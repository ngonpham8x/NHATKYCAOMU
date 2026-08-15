import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { HarvestRecord, Settings, ActiveTab } from './types';
import { 
  DEFAULT_SETTINGS, 
  loadSettings, 
  saveSettings, 
  loadRecords, 
  saveRecords
} from './utils/storage';
import { calculateCumulativeTotals } from './utils/calculations';
import { 
  auth, 
  completeGoogleRedirect,
  logoutFirebase, 
  subscribeToEmailAccessPermission,
  ensureRootAdminAllowed, 
  syncUserProfile, 
  subscribeToUserRecords, 
  saveRecordToFirestore, 
  replaceUserRecordsInFirestore,
  deleteRecordFromFirestore, 
  saveUserSettingsToFirestore, 
  fetchAllUsersForAdmin, 
  subscribeToSecurityAlerts,
  subscribeToAccessRequests,
  UserProfile 
} from './lib/firebase';

import { Navbar } from './components/Navbar';
import { Navigation } from './components/Navigation';
import { HomeDashboard } from './components/HomeDashboard';
import { Cycle10DaysTab } from './components/Cycle10DaysTab';
import { DailyLogList } from './components/DailyLogList';
import { SavedCyclesTab } from './components/SavedCyclesTab';
import { YearlySummaryTab } from './components/YearlySummaryTab';
import { SettingsTab } from './components/SettingsTab';
import { PermissionsTab } from './components/PermissionsTab';
import { UserGuideTab } from './components/UserGuideTab';
import { DailyEntryModal } from './components/DailyEntryModal';
import { AuthModal } from './components/AuthModal';
import { LatexPriceTicker } from './components/LatexPriceTicker';
import { ConfirmModal } from './components/ConfirmModal';
import { ToastContainer, ToastMessage } from './components/Toast';

// Module-level variable to store PWA prompt trigger safely outside React Fiber tree
let pwaPromptHandler: (() => void) | null = null;

const AnalyticsTab = lazy(async () => ({
  default: (await import('./components/AnalyticsTab')).AnalyticsTab,
}));

const ExportTab = lazy(async () => ({
  default: (await import('./components/ExportTab')).ExportTab,
}));

const DeferredTabFallback = () => (
  <div className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
    Đang tải nội dung…
  </div>
);

export default function App() {
  // Global Toast Notifications State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };
  // A signed-in Firebase user is required before any profile or workspace is shown.
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [unauthorizedEmail, setUnauthorizedEmail] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Admin Viewing Workspace State
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [activeViewingUserId, setActiveViewingUserId] = useState<string>('');

  // App Data State with LocalStorage Persistence
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [records, setRecords] = useState<HarvestRecord[]>(() => loadRecords());
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');

  // Refs for optimized real-time subscriptions without re-subscribing on settings update
  const settingsRef = useRef<Settings>(settings);
  const rawRecordsRef = useRef<HarvestRecord[]>(records);

  useEffect(() => {
    settingsRef.current = settings;
    if (rawRecordsRef.current.length > 0) {
      setRecords(calculateCumulativeTotals(rawRecordsRef.current, settings));
    }
  }, [settings]);

  // Left Sidebar Collapse Toggle State (Defaults to open for quick access)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const handleToggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  // Modal controls
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<HarvestRecord | null>(null);
  const [selectedFarmName, setSelectedFarmName] = useState<string>('');

  // View Mode: Mobile vs Desktop Mode Switcher
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');

  const handleToggleViewMode = () => {
    setViewMode((prev) => (prev === 'desktop' ? 'mobile' : 'desktop'));
  };

  // PWA Install Boolean State
  const [canInstallPWA, setCanInstallPWA] = useState<boolean>(false);

  // Admin Alerts Counters
  const [securityAlertsCount, setSecurityAlertsCount] = useState<number>(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);

  useEffect(() => {
    completeGoogleRedirect().catch((err: unknown) => {
      const firebaseError = err as { code?: string; message?: string };
      setAuthError(`Đăng nhập Google không hoàn tất (${firebaseError.code || firebaseError.message || 'unknown-error'}). Hãy thử lại.`);
    });
  }, []);

  // Subscribe to security alerts & access requests for Admin
  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      setSecurityAlertsCount(0);
      setPendingRequestsCount(0);
      return;
    }

    const unsubAlerts = subscribeToSecurityAlerts((alerts) => {
      setSecurityAlertsCount(alerts.length);
    });

    const unsubRequests = subscribeToAccessRequests((requests) => {
      setPendingRequestsCount(requests.length);
    });

    return () => {
      unsubAlerts();
      unsubRequests();
    };
  }, [currentUser?.role]);

  // Is Sub-Viewer in Read-Only Mode (Admin and Owner always have full edit rights)
  const isReadOnlyMode = currentUser?.role === 'sub_viewer';

  // Sync dark theme when settings change
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Firebase Auth Listener with Persistent Session & Real-time Permission Check
  useEffect(() => {
    let unsubPermission: (() => void) | null = null;

    // Safety timer: allow redirect OAuth and the first Firestore permission
    // check to finish before showing the login screen.
    const safetyTimer = setTimeout(() => {
      setAuthLoading(false);
    }, 15000);

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      setTimeout(async () => {
        if (unsubPermission) {
          unsubPermission();
          unsubPermission = null;
        }

        if (!firebaseUser) {
          setCurrentUser(null);
          setUnauthorizedEmail(null);
          setRecords([]);
          rawRecordsRef.current = [];
          setActiveViewingUserId('');
          setAuthLoading(false);
          clearTimeout(safetyTimer);
          return;
        }

        const email = firebaseUser.email || '';

        // Subscribe to real-time permission changes.
        unsubPermission = subscribeToEmailAccessPermission(email, async (permissionInfo) => {
          try {
            if (!permissionInfo.isAllowed) {
              setUnauthorizedEmail(email);
              setAuthError(null);
              setCurrentUser(null);
              setAuthLoading(false);
              clearTimeout(safetyTimer);
              return;
            }

            setUnauthorizedEmail(null);
            setAuthError(null);

            // If Root Admin, ensure record exists in allowed_users (non-blocking)
            if (permissionInfo.isAdmin) {
              ensureRootAdminAllowed(firebaseUser).catch(console.error);
            }

            // Sync user profile & custom settings
            const profile = await syncUserProfile(firebaseUser, permissionInfo, DEFAULT_SETTINGS);
            setCurrentUser(profile);

            // If sub-viewer, force viewing active user ID to parent owner's UID!
            if (permissionInfo.isSubViewer && permissionInfo.parentUserId) {
              setActiveViewingUserId(permissionInfo.parentUserId);
            } else {
              setActiveViewingUserId(profile.uid);
            }

            if (profile.settings) {
              setSettings(profile.settings);
            }

            // If Admin, fetch all registered users for workspace switcher (non-blocking)
            if (permissionInfo.isAdmin) {
              fetchAllUsersForAdmin().then(setAllUsers).catch(console.error);
            }
          } catch (err: unknown) {
            console.error('Error processing user login profile:', err);
            const firebaseError = err as { code?: string; message?: string };
            setAuthError(`Không thể tạo hoặc tải hồ sơ Firestore (${firebaseError.code || firebaseError.message || 'unknown-error'}). Kiểm tra Firestore Database và Rules rồi thử lại.`);
            setCurrentUser(null);
          } finally {
            setAuthLoading(false);
            clearTimeout(safetyTimer);
          }
        });
      }, 0);
    });

    // PWA Install prompt listener (Only outside iframe environment in standalone mode)
    let isIframe = true;
    try {
      isIframe = typeof window === 'undefined' || window.self !== window.parent || window.location.hostname.includes('ais-');
    } catch {
      isIframe = true;
    }

    const handleBeforeInstallPrompt = (e: any) => {
      if (isIframe) return;
      try {
        if (e && typeof e.preventDefault === 'function') {
          e.preventDefault();
        }
      } catch (err) {}

      pwaPromptHandler = () => {
        try {
          if (e && typeof e.prompt === 'function') {
            e.prompt();
          }
        } catch (err) {
          console.warn('PWA prompt notice:', err);
        }
      };
      setCanInstallPWA(true);
    };

    if (!isIframe && typeof window !== 'undefined') {
      try {
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      } catch (e) {}
    }

    return () => {
      clearTimeout(safetyTimer);
      unsubscribeAuth();
      if (unsubPermission) unsubPermission();
      if (!isIframe && typeof window !== 'undefined') {
        try {
          window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        } catch (e) {}
      }
    };
  }, []);

  // Real-time Harvest Records Subscription for Active Viewing User (Only re-subscribes on user ID change)
  useEffect(() => {
    if (!activeViewingUserId) {
      return;
    }

    const unsubscribe = subscribeToUserRecords(activeViewingUserId, (rawRecords) => {
      // Firestore is the source of truth for a signed-in workspace. An empty
      // snapshot is a valid update (for example after deleting the last log),
      // so never fall back to stale local records here.
      rawRecordsRef.current = rawRecords;
      const recalculated = calculateCumulativeTotals(rawRecords, settingsRef.current);
      setRecords(recalculated);
      saveRecords(recalculated, settingsRef.current);
    });

    return () => unsubscribe();
  }, [activeViewingUserId]);

  // Handle Logout
  const handleLogout = async () => {
    await logoutFirebase();
  };

  // Handler to update settings
  const handleUpdateSettings = async (newSettings: Settings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    if (currentUser) {
      await saveUserSettingsToFirestore(currentUser.uid, newSettings);
    }
  };

  // Restore a JSON snapshot locally and replace the signed-in user's cloud journal.
  const handleRestoreRecords = async (restoredRecords: HarvestRecord[], restoredSettings?: Settings) => {
    if (isReadOnlyMode) {
      throw new Error('Tài khoản đang ở chế độ chỉ xem, không thể khôi phục dữ liệu.');
    }

    const effectiveSettings = restoredSettings
      ? { ...DEFAULT_SETTINGS, ...restoredSettings }
      : settingsRef.current;
    const recalculated = calculateCumulativeTotals(restoredRecords, effectiveSettings);

    settingsRef.current = effectiveSettings;
    rawRecordsRef.current = recalculated;
    setSettings(effectiveSettings);
    setRecords(recalculated);
    saveSettings(effectiveSettings);
    saveRecords(recalculated, effectiveSettings);

    if (currentUser) {
      const persistedRecords = await replaceUserRecordsInFirestore(recalculated, currentUser);
      const persistedCalculated = calculateCumulativeTotals(persistedRecords, effectiveSettings);
      rawRecordsRef.current = persistedCalculated;
      setRecords(persistedCalculated);
      saveRecords(persistedCalculated, effectiveSettings);
      if (restoredSettings) {
        await saveUserSettingsToFirestore(currentUser.uid, effectiveSettings);
      }
    }
  };

  // Handler to save or update a record
  const handleSaveRecord = async (newRecord: HarvestRecord) => {
    if (isReadOnlyMode) {
      showToast('⚠️ Chế độ Admin chỉ xem: Bạn không thể thêm hoặc sửa dữ liệu của người dùng này.', 'warning');
      return;
    }

    // Optimistic UI update for instant zero-lag UI response
    const currentList = rawRecordsRef.current.length > 0 ? rawRecordsRef.current : records;
    // Match by ID, or if new record without persistent ID, match date + farmName
    const existingIdx = currentList.findIndex((r) => 
      r.id === newRecord.id || 
      (r.date === newRecord.date && (r.farmName || '').trim() === (newRecord.farmName || '').trim())
    );
    let updatedRaw: HarvestRecord[];
    if (existingIdx >= 0) {
      updatedRaw = [...currentList];
      updatedRaw[existingIdx] = { ...newRecord, id: currentList[existingIdx].id || newRecord.id };
    } else {
      updatedRaw = [newRecord, ...currentList];
    }
    rawRecordsRef.current = updatedRaw;
    const computed = calculateCumulativeTotals(updatedRaw, settingsRef.current);
    setRecords(computed);
    saveRecords(computed, settingsRef.current);
    setIsModalOpen(false);
    setEditingRecord(null);

    if (currentUser) {
      try {
        const savedDocId = await saveRecordToFirestore(newRecord, currentUser);
        // Update ID if it was a new record with sample/local ID
        if (newRecord.id !== savedDocId) {
          const fixedRaw = rawRecordsRef.current.map((r) => 
            (r.id === newRecord.id || (r.date === newRecord.date && (r.farmName || '').trim() === (newRecord.farmName || '').trim()))
              ? { ...r, id: savedDocId } 
              : r
          );
          rawRecordsRef.current = fixedRaw;
          const fixedComputed = calculateCumulativeTotals(fixedRaw, settingsRef.current);
          setRecords(fixedComputed);
          saveRecords(fixedComputed, settingsRef.current);
        }
        showToast('Đã lưu nhật ký cạo mủ thành công!', 'success');
      } catch (err) {
        console.warn('Sync to Firestore notice:', err);
        showToast('Đã lưu dữ liệu vào sổ cạo!', 'success');
      }
    } else {
      showToast('Đã lưu dữ liệu vào sổ cạo!', 'success');
    }
  };

  // Delete Record Confirmation Modal State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    recordId: string;
    dateStr: string;
    farmName: string;
  }>({
    isOpen: false,
    recordId: '',
    dateStr: '',
    farmName: '',
  });

  // Handler to request delete a record
  const handleDeleteRecord = (id: string) => {
    if (isReadOnlyMode) {
      showToast('⚠️ Chế độ Admin chỉ xem: Bạn không thể xóa dữ liệu của người dùng này.', 'warning');
      return;
    }

    const currentList = rawRecordsRef.current.length > 0 ? rawRecordsRef.current : records;
    const recordToDelete = currentList.find((r) => r.id === id);
    if (!recordToDelete) return;

    setDeleteConfirm({
      isOpen: true,
      recordId: recordToDelete.id,
      dateStr: recordToDelete.date,
      farmName: recordToDelete.farmName || '',
    });
  };

  // Confirm execution of delete (strictly by recordId)
  const handleConfirmDeleteRecord = async () => {
    const { recordId } = deleteConfirm;
    setDeleteConfirm({ isOpen: false, recordId: '', dateStr: '', farmName: '' });

    if (!recordId) return;

    // Optimistic UI delete update: strictly delete matching ID only
    const currentList = rawRecordsRef.current.length > 0 ? rawRecordsRef.current : records;
    const previousRaw = [...currentList];
    const filteredRaw = currentList.filter((r) => r.id !== recordId);
    rawRecordsRef.current = filteredRaw;
    const computed = calculateCumulativeTotals(filteredRaw, settingsRef.current);
    setRecords(computed);
    saveRecords(computed, settingsRef.current);

    try {
      // `rec-*` IDs can be real Firestore document IDs from older saves, so
      // only generated `sample-*` records are local-only and must be skipped.
      if (currentUser && recordId && !recordId.startsWith('sample-')) {
        await deleteRecordFromFirestore(recordId);
      }
      showToast('Đã xóa và đồng bộ dữ liệu thành công!', 'success');
    } catch (err) {
      console.error('Error deleting record from Firestore:', err);
      // Do not leave this device looking correct while the cloud still has
      // the record. Restore the previous state and report the sync failure.
      rawRecordsRef.current = previousRaw;
      const restored = calculateCumulativeTotals(previousRaw, settingsRef.current);
      setRecords(restored);
      saveRecords(restored, settingsRef.current);
      showToast('Không thể đồng bộ việc xóa. Dữ liệu đã được khôi phục.', 'error');
    }
  };

  // Modal Trigger Openers
  const handleOpenAddModal = (farmNameOrEvent?: string | any) => {
    if (isReadOnlyMode) {
      showToast('⚠️ Chế độ Admin chỉ xem: Bạn không thể thêm dữ liệu cho tài khoản này.', 'warning');
      return;
    }
    setEditingRecord(null);
    // Prevent React SyntheticEvent from being stored as farmName
    const finalFarmName = typeof farmNameOrEvent === 'string' ? farmNameOrEvent : '';
    setSelectedFarmName(finalFarmName);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (record: HarvestRecord) => {
    if (isReadOnlyMode) {
      showToast('⚠️ Chế độ Admin chỉ xem: Bạn không thể sửa dữ liệu của tài khoản này.', 'warning');
      return;
    }
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  // PWA Install
  const handleInstallPWA = () => {
    if (pwaPromptHandler) {
      const trigger = pwaPromptHandler;
      pwaPromptHandler = null;
      setCanInstallPWA(false);
      if (typeof trigger === 'function') {
        trigger();
      }
    }
  };

  // Render Auth Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-950 text-white p-4">
        <div className="text-center space-y-4 animate-pulse">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black text-2xl shadow-xl">
            🌱
          </div>
          <h2 className="text-xl font-bold uppercase tracking-wider">
            Tính Tiền Mủ Cao Su
          </h2>
          <p className="text-xs text-emerald-300">
            Đang xác thực tài khoản Google Auth & Tải dữ liệu...
          </p>
        </div>
      </div>
    );
  }

  // Render Auth Modal if not logged in or unauthorized
  if (!currentUser) {
    return (
      <AuthModal
        unauthorizedEmail={unauthorizedEmail}
        authError={authError}
        onLogoutAndRetry={handleLogout}
      />
    );
  }

  const isAdmin = currentUser.role === 'admin';

  const handleApplyTickerPrices = (degreePrice: number, cupPrice: number) => {
    const updated = {
      ...settings,
      defaultDegreePrice: degreePrice,
      defaultCupPrice: cupPrice,
    };
    handleUpdateSettings(updated);
    showToast(`Đã áp dụng đơn giá thị trường (${degreePrice} đ/độ, ${cupPrice.toLocaleString('vi-VN')} đ/kg mủ chén) làm đơn giá mặc định của bạn!`, 'success');
  };

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors font-sans pb-16 lg:pb-8 ${viewMode === 'desktop' ? 'w-full overflow-x-auto' : ''}`}>
      {/* Navbar with Menu Toggle */}
      <Navbar
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        canInstallPWA={canInstallPWA}
        onInstallPWA={handleInstallPWA}
        currentUser={currentUser}
        allUsers={allUsers}
        activeViewingUserId={activeViewingUserId}
        onChangeViewingUser={setActiveViewingUserId}
        onLogout={handleLogout}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={handleToggleSidebar}
        securityAlertsCount={securityAlertsCount}
        pendingRequestsCount={pendingRequestsCount}
        onNavigateToTab={setActiveTab}
        viewMode={viewMode}
        onToggleViewMode={handleToggleViewMode}
      />

      {/* Main Layout Container with Left Sidebar & Content */}
      <div className={`flex flex-1 w-full relative ${viewMode === 'desktop' ? 'overflow-x-auto' : ''}`}>
        {/* Left Navigation Sidebar */}
        <Navigation 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          isAdmin={isAdmin}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={handleToggleSidebar}
        />

        {/* Main Content Area */}
        <main className={`flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 min-w-0 transition-all duration-300 ${viewMode === 'desktop' ? 'min-w-[960px] md:min-w-[1150px] overflow-x-auto' : ''}`}>
          {activeTab === 'home' && (
            <HomeDashboard
              records={records}
              settings={settings}
              onOpenAddModal={handleOpenAddModal}
              onOpenEditModal={handleOpenEditModal}
              onDeleteRecord={handleDeleteRecord}
              onNavigateToTab={setActiveTab}
              onUpdateSettings={handleUpdateSettings}
              onSetRecords={(recs) => setRecords(recs)}
            />
          )}

          {activeTab === 'cycle10' && (
            <Cycle10DaysTab
              records={records}
              settings={settings}
              onSaveRecord={handleSaveRecord}
              onDeleteRecord={handleDeleteRecord}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === 'logs' && (
            <DailyLogList
              records={records}
              settings={settings}
              onOpenAddModal={handleOpenAddModal}
              onOpenEditModal={handleOpenEditModal}
              onDeleteRecord={handleDeleteRecord}
            />
          )}

          {activeTab === 'cycles' && (
            <SavedCyclesTab
              records={records}
              settings={settings}
              onOpenEditModal={handleOpenEditModal}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === 'analytics' && (
            <Suspense fallback={<DeferredTabFallback />}>
              <AnalyticsTab records={records} settings={settings} />
            </Suspense>
          )}

          {activeTab === 'yearly' && <YearlySummaryTab records={records} settings={settings} />}

          {activeTab === 'export' && (
            <Suspense fallback={<DeferredTabFallback />}>
              <ExportTab records={records} settings={settings} />
            </Suspense>
          )}

          {activeTab === 'guide' && <UserGuideTab currentUser={currentUser} settings={settings} onNavigateToTab={setActiveTab} />}

          {activeTab === 'settings' && (
            <SettingsTab
              settings={settings}
              onSaveSettings={handleUpdateSettings}
              records={records}
              onSetRecords={(recs) => setRecords(recs)}
              onRestoreRecords={handleRestoreRecords}
              canInstallPWA={canInstallPWA}
              onInstallPWA={handleInstallPWA}
              currentUser={currentUser}
              onNotify={showToast}
            />
          )}

          {activeTab === 'permissions' && isAdmin && (
            <PermissionsTab currentUser={currentUser} records={records} settings={settings} />
          )}
        </main>
      </div>

      {/* Daily Entry Modal */}
      <DailyEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveRecord={handleSaveRecord}
        onUpdateSettings={handleUpdateSettings}
        editingRecord={editingRecord}
        existingRecords={records}
        settings={settings}
        initialFarmName={selectedFarmName}
      />

      {/* Delete Record Confirmation Modal with Có/Không buttons */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Xác Nhận Xóa Ngày Cạo"
        message={`Bạn có chắc chắn muốn XÓA nhật ký cạo mủ ngày ${deleteConfirm.dateStr}${deleteConfirm.farmName ? ` (${deleteConfirm.farmName})` : ''}? Hệ thống sẽ tự động tính lại số tiền cộng dồn cho các ngày còn lại.`}
        confirmLabel="Có, Xóa"
        cancelLabel="Không, Hủy"
        variant="danger"
        onConfirm={handleConfirmDeleteRecord}
        onCancel={() => setDeleteConfirm({ isOpen: false, recordId: '', dateStr: '', farmName: '' })}
      />

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-800 py-4 text-center text-xs text-gray-500 dark:text-gray-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>Tính Tiền Mủ Cao Su</strong> — Hệ thống quản lý sản lượng & phân quyền Google Auth.
          </div>
          <div>
            Đăng nhập: <strong className="text-gray-700 dark:text-gray-200">{currentUser.email}</strong> ({isAdmin ? 'Admin' : 'Nông Dân'})
          </div>
        </div>
      </footer>

      {/* Global Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
