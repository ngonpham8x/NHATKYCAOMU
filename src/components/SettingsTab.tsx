import React, { useState, useRef } from 'react';
import { 
  Settings as SettingsIcon, 
  DollarSign, 
  Download, 
  Upload, 
  Database, 
  RefreshCw, 
  Trash2, 
  Check, 
  Info,
  Smartphone,
  CheckCircle,
  HelpCircle,
  TreeDeciduous,
  Calendar,
  Users,
  Plus,
  Mail,
  Pencil,
  X,
  CloudUpload
} from 'lucide-react';
import { Settings, HarvestRecord } from '../types';
import { exportToJSON, importFromJSON, generateSampleData } from '../utils/storage';
import { createDatabaseBackup, UserProfile } from '../lib/firebase';
import { formatVND, parseVietnamesePrice } from '../utils/calculations';
import { ConfirmModal } from './ConfirmModal';
import { NumericInput } from './NumericInput';

interface SettingsTabProps {
  settings: Settings;
  onSaveSettings: (settings: Settings) => void;
  records: HarvestRecord[];
  onSetRecords: (records: HarvestRecord[]) => void;
  onRestoreRecords?: (records: HarvestRecord[], settings?: Settings) => Promise<void>;
  canInstallPWA?: boolean;
  onInstallPWA: () => void;
  currentUser?: UserProfile;
  onNotify?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  onSaveSettings,
  records,
  onSetRecords,
  onRestoreRecords,
  canInstallPWA = false,
  onInstallPWA,
  currentUser,
  onNotify,
}) => {
  const [degreePrice, setDegreePrice] = useState<string>(settings.defaultDegreePrice.toString());
  const [cupPrice, setCupPrice] = useState<string>(settings.defaultCupPrice.toString());
  const [scrapPrice, setScrapPrice] = useState<string>((settings.defaultScrapPrice || 15000).toString());
  const [ownerName, setOwnerName] = useState<string>(settings.ownerName || '');
  const [fieldName, setFieldName] = useState<string>(settings.rubberFieldName || '');
  
  // Custom Payment Cycle State
  const [paymentCycleType, setPaymentCycleType] = useState<'fixed_10' | 'fixed_15' | 'fixed_30' | 'custom'>(
    settings.paymentCycleType || 'fixed_10'
  );
  const [paymentCycleDays, setPaymentCycleDays] = useState<string>(
    (settings.paymentCycleDays || 10).toString()
  );
  const [customCycleName, setCustomCycleName] = useState<string>(settings.customCycleName || '');

  // Sub-Emails Delegation State (Up to 5 emails)
  const [subEmails, setSubEmails] = useState<string[]>(settings.subEmails || []);
  const [newSubEmail, setNewSubEmail] = useState<string>('');
  const [subEmailError, setSubEmailError] = useState<string>('');

  // Farms / Tappers List State
  const [farmsList, setFarmsList] = useState<string[]>(
    settings.farmsList || []
  );
  const [newFarmNameInput, setNewFarmNameInput] = useState<string>('');

  // Edit & Delete Garden State
  const [editingFarm, setEditingFarm] = useState<{
    isOpen: boolean;
    oldName: string;
    newName: string;
    updateHistoricalRecords: boolean;
  }>({
    isOpen: false,
    oldName: '',
    newName: '',
    updateHistoricalRecords: true,
  });

  const [deletingFarmConfirm, setDeletingFarmConfirm] = useState<{
    isOpen: boolean;
    farmName: string;
  }>({
    isOpen: false,
    farmName: '',
  });

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [statusNotification, setStatusNotification] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null);
  const [isSyncingJson, setIsSyncingJson] = useState(false);
  const [largeBackupNotice, setLargeBackupNotice] = useState<{ title: string; message: string } | null>(null);

  const notifyStatus = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setStatusNotification({ type, msg });
    onNotify?.(msg, type);
    setTimeout(() => setStatusNotification(null), 4000);
  };

  const showBackupSuccess = (title: string, message: string) => {
    setLargeBackupNotice({ title, message });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSavePrices = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedDegreePrice = parseVietnamesePrice(degreePrice) || 350;
    const parsedCupPrice = parseVietnamesePrice(cupPrice) || 18000;
    const parsedScrapPrice = parseVietnamesePrice(scrapPrice) || 15000;

    const updated: Settings = {
      ...settings,
      defaultDegreePrice: parsedDegreePrice,
      defaultCupPrice: parsedCupPrice,
      defaultScrapPrice: parsedScrapPrice,
      ownerName: ownerName.trim(),
      rubberFieldName: fieldName.trim(),
      paymentCycleType,
      paymentCycleDays: parseInt(paymentCycleDays, 10) || 10,
      customCycleName: customCycleName.trim(),
      subEmails,
      farmsList,
    };
    onSaveSettings(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddFarmName = () => {
    const clean = newFarmNameInput.trim();
    if (!clean) return;
    if (farmsList.includes(clean)) {
      notifyStatus('Tên vườn hoặc thợ cạo này đã có trong danh sách!', 'error');
      return;
    }
    const updated = [...farmsList, clean];
    setFarmsList(updated);
    setNewFarmNameInput('');
    onSaveSettings({
      ...settings,
      farmsList: updated,
    });
  };

  const handleOpenEditFarm = (farmName: string) => {
    setEditingFarm({
      isOpen: true,
      oldName: farmName,
      newName: farmName,
      updateHistoricalRecords: true,
    });
  };

  const handleSaveEditFarm = () => {
    const cleanNew = editingFarm.newName.trim();
    if (!cleanNew) {
      notifyStatus('Tên vườn/thợ cạo không được để trống!', 'error');
      return;
    }

    if (cleanNew !== editingFarm.oldName && farmsList.includes(cleanNew)) {
      notifyStatus('Tên vườn hoặc thợ cạo này đã có trong danh sách!', 'error');
      return;
    }

    const updatedList = farmsList.map((f) => (f === editingFarm.oldName ? cleanNew : f));
    setFarmsList(updatedList);

    const updatedSettings = {
      ...settings,
      farmsList: updatedList,
    };
    onSaveSettings(updatedSettings);

    // Update historical records if checked
    let updatedCount = 0;
    if (editingFarm.updateHistoricalRecords && records && records.length > 0) {
      const updatedRecords = records.map((r) => {
        if (r.farmName === editingFarm.oldName) {
          updatedCount++;
          return { ...r, farmName: cleanNew };
        }
        return r;
      });

      if (updatedCount > 0) {
        onSetRecords(updatedRecords);
      }
    }

    setEditingFarm({ isOpen: false, oldName: '', newName: '', updateHistoricalRecords: true });

    if (updatedCount > 0) {
      notifyStatus(`Đã đổi tên thành "${cleanNew}" và cập nhật ${updatedCount} nhật ký mủ cũ!`, 'success');
    } else {
      notifyStatus(`Đã đổi tên vườn thành "${cleanNew}" thành công!`, 'success');
    }
  };

  const handleOpenDeleteFarm = (farmName: string) => {
    setDeletingFarmConfirm({
      isOpen: true,
      farmName,
    });
  };

  const handleConfirmDeleteFarm = () => {
    const nameToRemove = deletingFarmConfirm.farmName;
    const updated = farmsList.filter((f) => f !== nameToRemove);
    setFarmsList(updated);
    onSaveSettings({
      ...settings,
      farmsList: updated,
    });
    setDeletingFarmConfirm({ isOpen: false, farmName: '' });
    notifyStatus(`Đã xóa tên vườn "${nameToRemove}" khỏi danh sách.`, 'info');
  };

  const handleRemoveFarmName = (nameToRemove: string) => {
    handleOpenDeleteFarm(nameToRemove);
  };

  const handleAddSubEmail = () => {
    const clean = newSubEmail.toLowerCase().trim();
    setSubEmailError('');
    if (!clean || !clean.includes('@')) {
      setSubEmailError('Vui lòng nhập Email hợp lệ!');
      return;
    }
    if (subEmails.includes(clean)) {
      setSubEmailError('Email này đã có trong danh sách!');
      return;
    }
    if (subEmails.length >= 5) {
      setSubEmailError('Đã đạt giới hạn tối đa 5 Email phụ!');
      return;
    }

    const updatedList = [...subEmails, clean];
    setSubEmails(updatedList);
    setNewSubEmail('');
    
    // Auto sync to settings
    onSaveSettings({
      ...settings,
      subEmails: updatedList,
    });
  };

  // Confirm Modal States
  const [subEmailRemoveConfirm, setSubEmailRemoveConfirm] = useState<{
    isOpen: boolean;
    email: string;
  }>({
    isOpen: false,
    email: '',
  });

  const [clearDataConfirm, setClearDataConfirm] = useState<boolean>(false);

  const handleRemoveSubEmail = (emailToRemove: string) => {
    setSubEmailRemoveConfirm({ isOpen: true, email: emailToRemove });
  };

  const handleConfirmRemoveSubEmail = async () => {
    const emailToRemove = subEmailRemoveConfirm.email;
    setSubEmailRemoveConfirm({ isOpen: false, email: '' });
    if (!emailToRemove) return;

    const updatedList = subEmails.filter((e) => e !== emailToRemove);
    setSubEmails(updatedList);
    onSaveSettings({
      ...settings,
      subEmails: updatedList,
    });

    // Auto export full Excel report & backup snapshot for Garden Owner upon revocation
    try {
      const { exportToExcel } = await import('../utils/export');
      await exportToExcel(records, `Bao_Cao_Tudong_ThuHoi_Quyen_${emailToRemove.replace(/[^a-zA-Z0-9]/g, '_')}`, settings);
      if (currentUser) {
        await createDatabaseBackup(currentUser.uid, currentUser.email, records, settings);
      }
      notifyStatus(`Đã THU HỒI QUYỀN TRUY CẬP của Email ${emailToRemove} thành công!`, 'success');
    } catch (e) {
      console.error('Error auto exporting report on revocation:', e);
      notifyStatus(`Đã thu hồi quyền của ${emailToRemove}, nhưng chưa tạo được bản sao lưu trên web.`, 'error');
    }
  };

  const handleExportJSON = () => {
    try {
      exportToJSON(records, settings);
      const message = `Đã tạo file sao lưu gồm ${records.length} ngày cạo. File được tải về thiết bị của bạn.`;
      notifyStatus('Sao lưu dữ liệu ra file JSON thành công!', 'success');
      showBackupSuccess('ĐÃ SAO LƯU THÀNH CÔNG', message);
    } catch (e) {
      notifyStatus('Lỗi khi sao lưu dữ liệu!', 'error');
    }
  };

  const handleSyncJSON = async () => {
    if (!currentUser) {
      notifyStatus('Vui lòng đăng nhập Google trước khi đồng bộ dữ liệu lên web.', 'error');
      return;
    }
    if (records.length === 0) {
      notifyStatus('Chưa có dữ liệu nhật ký để đồng bộ lên web.', 'error');
      return;
    }

    setIsSyncingJson(true);
    try {
      const backupId = await createDatabaseBackup(currentUser.uid, currentUser.email, records, settings);
      const message = `Đã đồng bộ ${records.length} ngày cạo lên tài khoản Google. Mã sao lưu: ${backupId}`;
      notifyStatus(`Đồng bộ JSON lên web thành công (${records.length} ngày). Mã sao lưu: ${backupId}`, 'success');
      showBackupSuccess('ĐÃ ĐỒNG BỘ LÊN WEB', message);
    } catch (err) {
      console.error('Cloud JSON sync failed:', err);
      const code = err && typeof err === 'object' && 'code' in err ? String((err as { code?: unknown }).code) : '';
      notifyStatus(
        `Không thể đồng bộ JSON lên web${code ? ` (${code})` : ''}. Dữ liệu trên thiết bị vẫn được giữ nguyên.`,
        'error'
      );
    } finally {
      setIsSyncingJson(false);
    }
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await importFromJSON(file);
      if (onRestoreRecords) {
        await onRestoreRecords(result.records, result.settings);
      } else {
        onSetRecords(result.records);
        if (result.settings) {
          onSaveSettings(result.settings);
        }
      }
      const message = `Đã khôi phục ${result.records.length} ngày cạo và cập nhật dữ liệu trên thiết bị${currentUser ? ' và web' : ''}.`;
      notifyStatus('Khôi phục dữ liệu thành công!', 'success');
      showBackupSuccess('ĐÃ KHÔI PHỤC THÀNH CÔNG', message);
    } catch (err) {
      notifyStatus(err instanceof Error ? err.message : 'Lỗi khi đọc file khôi phục', 'error');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerateSampleData = () => {
    const samples = generateSampleData();
    onSetRecords(samples);
    notifyStatus('Đã tạo thành công dữ liệu cạo mủ cao su mẫu!', 'success');
  };

  const handleClearData = () => {
    setClearDataConfirm(true);
  };

  const handleConfirmClearData = () => {
    setClearDataConfirm(false);
    onSetRecords([]);
    notifyStatus('Đã xóa sạch toàn bộ dữ liệu cạo mủ thành công.', 'info');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 p-6 rounded-2xl text-white shadow-md">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-400 text-emerald-950 rounded-xl font-bold">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-wide">
              CÀI ĐẶT & SAO LƯU DỮ LIỆU
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1">
              Chu kỳ nhận tiền, đơn giá mặc định, cấp quyền Email phụ và sao lưu JSON
            </p>
          </div>
        </div>
      </div>

      {statusNotification && (
        <div className={`p-4 rounded-xl font-bold text-xs shadow-sm flex items-center space-x-2 animate-fade-in ${
          statusNotification.type === 'error' ? 'bg-red-100 dark:bg-red-950 text-red-900 dark:text-red-200 border border-red-300' :
          statusNotification.type === 'info' ? 'bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-200 border border-blue-300' :
          'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border border-emerald-300'
        }`}>
          <span>{statusNotification.msg}</span>
        </div>
      )}

      {largeBackupNotice && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="backup-success-title"
        >
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-gray-800 p-6 text-center shadow-2xl border-2 border-emerald-400 animate-fade-in">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60">
              <CheckCircle className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 id="backup-success-title" className="text-lg font-black text-emerald-800 dark:text-emerald-300">
              {largeBackupNotice.title}
            </h3>
            <p className="mt-2 text-sm font-medium leading-relaxed text-gray-600 dark:text-gray-300">
              {largeBackupNotice.message}
            </p>
            <button
              type="button"
              onClick={() => setLargeBackupNotice(null)}
              className="mt-5 w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-black text-white shadow-md transition hover:bg-emerald-800"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}

      {/* Payment Cycle Configuration (Cấu hình chu kỳ nhận tiền) */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <span>1. Chu kỳ nhận tiền (Thanh toán đợt cạo)</span>
          </h3>
          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full">
            Tùy từng chủ vườn
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Loại chu kỳ tính tiền
            </label>
            <select
              value={paymentCycleType}
              onChange={(e) => setPaymentCycleType(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="fixed_10">🗓 10 ngày / Đợt (01-10, 11-20, 21-Cuối tháng) - Mặc định</option>
              <option value="fixed_15">🗓 15 ngày / Đợt (01-15, 16-Cuối tháng)</option>
              <option value="fixed_30">🗓 30 ngày (Thanh toán cả tháng 1 lần)</option>
              <option value="custom">⚙️ Tùy chỉnh số ngày chu kỳ (N ngày)</option>
            </select>
          </div>

          {paymentCycleType === 'custom' && (
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Số ngày / 1 Chu kỳ thanh toán
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={paymentCycleDays}
                onChange={(e) => setPaymentCycleDays(e.target.value)}
                placeholder="VD: 7 hoặc 12 ngày"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          <div className={paymentCycleType === 'custom' ? 'sm:col-span-2' : ''}>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Tên / Ký hiệu chu kỳ (Tùy chọn)
            </label>
            <input
              type="text"
              placeholder="VD: Lô Bến Củi - Đợt cạo 10 ngày"
              value={customCycleName}
              onChange={(e) => setCustomCycleName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Farm & Worker Names Management (Quản lý tên vườn & thợ cạo) */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <TreeDeciduous className="w-5 h-5 text-emerald-600" />
            <span>2. Danh sách Tên Vườn Cao Su & Thợ Cạo</span>
          </h3>
          <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded-full">
            Tự lưu để xổ ra
          </span>
        </div>

        <p className="text-xs text-gray-600 dark:text-gray-400">
          Chủ vườn thêm danh sách các lô vườn hoặc tên thợ cạo tại đây. Mỗi khi nhập sản lượng mủ mới, tên vườn/thợ cạo sẽ tự động xổ ra để chủ chọn nhanh.
        </p>

        {/* Input new farm */}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Nhập tên vườn hoặc thợ cạo mới (VD: Vườn Lô 3, Thợ Cạo B...)"
            value={newFarmNameInput}
            onChange={(e) => setNewFarmNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddFarmName();
              }
            }}
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="button"
            onClick={handleAddFarmName}
            className="py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm</span>
          </button>
        </div>

        {/* Current Farm List */}
        <div className="space-y-2 pt-1">
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
            Danh sách vườn / thợ cạo hiện tại ({farmsList.length}):
          </label>
          {farmsList.length === 0 ? (
            <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-dashed border-amber-300 dark:border-amber-800 text-center text-xs font-bold text-amber-900 dark:text-amber-200 space-y-1">
              <div>🌳 Chưa có tên vườn/thợ cạo nào trong danh sách.</div>
              <div className="text-[11px] font-normal text-amber-800 dark:text-amber-300">
                Khi nào có vườn, chủ vườn bấm nút <strong>"+ Thêm"</strong> ở trên để tạo danh sách vườn.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {farmsList.map((farm, idx) => {
                const usageCount = records ? records.filter((r) => r.farmName === farm).length : 0;
                return (
                  <div
                    key={`setting-farm-${farm}-${idx}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-800 text-amber-950 dark:text-amber-200 shadow-2xs group hover:border-amber-400 transition"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                      <span className="text-base shrink-0">🌳</span>
                      <div className="truncate">
                        <div className="text-xs font-black truncate">{farm}</div>
                        <div className="text-[10px] text-amber-800/80 dark:text-amber-400 font-semibold">
                          {usageCount > 0 ? `${usageCount} ngày cạo trong lịch sử` : 'Chưa có nhật ký'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditFarm(farm)}
                        className="px-2.5 py-1 rounded-lg bg-amber-200/90 hover:bg-amber-300 dark:bg-amber-900/60 dark:hover:bg-amber-800 text-amber-950 dark:text-amber-100 text-[11px] font-bold flex items-center space-x-1 transition shadow-2xs cursor-pointer"
                        title="Sửa tên vườn này"
                      >
                        <Pencil className="w-3 h-3 text-amber-800 dark:text-amber-300" />
                        <span>Sửa</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenDeleteFarm(farm)}
                        className="px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-950/80 dark:hover:bg-red-900 text-red-800 dark:text-red-200 text-[11px] font-bold flex items-center space-x-1 transition shadow-2xs cursor-pointer"
                        title="Xóa tên vườn này khỏi danh sách"
                      >
                        <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sub-Email Viewer Delegation (Cấp quyền cho tối đa 5 Email phụ) */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <span>2. Cấp quyền xem cho Email phụ (Tối đa 5 Email)</span>
          </h3>
          <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 rounded-full">
            {subEmails.length}/5 Email phụ
          </span>
        </div>

        <p className="text-xs text-gray-600 dark:text-gray-300">
          Người dùng được cấp Email phụ (ví dụ người nhà, kế toán) khi đăng nhập sẽ <strong>chỉ được quyền xem</strong> nội dung nhật ký cạo mủ của chính bạn, không xem được của người khác và không có quyền sửa xóa.
        </p>

        {subEmailError && (
          <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-bold border border-red-200">
            {subEmailError}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="email"
              placeholder="Nhập địa chỉ Google Email phụ (VD: ketoan.vuoncao@gmail.com)"
              value={newSubEmail}
              onChange={(e) => setNewSubEmail(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            type="button"
            onClick={handleAddSubEmail}
            disabled={subEmails.length >= 5}
            className="py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition flex items-center justify-center space-x-1 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Email Phụ</span>
          </button>
        </div>

        {/* Existing Sub-emails list */}
        {subEmails.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Danh sách Email phụ đã được xem sổ:
            </div>
            <div className="flex flex-wrap gap-2">
              {subEmails.map((email) => (
                <div
                  key={email}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 text-xs font-bold flex items-center space-x-2"
                >
                  <Mail className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{email}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubEmail(email)}
                    className="hover:text-red-600 transition cursor-pointer p-0.5 rounded"
                    title="Xóa Email phụ này"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Settings Form: Default Prices */}
      <form onSubmit={handleSavePrices} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <span>3. Đơn giá mặc định cho các ngày cạo sau này</span>
          </h3>
          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1">
              <Check className="w-4 h-4" />
              <span>Đã lưu thành công!</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Giá mỗi độ mặc định (đ/độ/kg)
            </label>
            <NumericInput
              decimal={false}
              value={degreePrice}
              onChange={setDegreePrice}
              placeholder="350"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-gray-400 mt-1">Hiện tại: {formatVND(parseVietnamesePrice(degreePrice) || 0)} / độ</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Giá mủ chén mặc định (đ/kg)
            </label>
            <NumericInput
              decimal={false}
              value={cupPrice}
              onChange={setCupPrice}
              placeholder="18000"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-gray-400 mt-1">Hiện tại: {formatVND(parseVietnamesePrice(cupPrice) || 0)} / kg</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Giá mủ tạp mặc định (đ/kg)
            </label>
            <NumericInput
              decimal={false}
              value={scrapPrice}
              onChange={setScrapPrice}
              placeholder="15000"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-gray-400 mt-1">Hiện tại: {formatVND(parseVietnamesePrice(scrapPrice) || 0)} / kg</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Tên chủ vườn / Người cạo mủ
            </label>
            <input
              type="text"
              placeholder="VD: Nguyễn Văn A"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Tên lô / Vườn cao su
            </label>
            <input
              type="text"
              placeholder="VD: Lô 12 - Vườn 5ha"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl flex items-start space-x-2 text-xs text-amber-800 dark:text-amber-300">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <strong>Lưu ý:</strong> Thay đổi giá chỉ áp dụng cho các ngày cạo nhập sau này. Tất cả dữ liệu ngày cũ sẽ giữ nguyên giá tại thời điểm nhập để đảm bảo số liệu thu nhập luôn chính xác.
          </span>
        </div>

        <button
          type="submit"
          id="save-price-settings-btn"
          className="py-2.5 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition flex items-center space-x-2"
        >
          <Check className="w-4 h-4" />
          <span>Lưu Tất Cả Cài Đặt</span>
        </button>
      </form>

      {/* Monthly Automatic Report Email Configuration (Báo cáo tự động hàng tháng) */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/80 dark:to-gray-900 p-5 rounded-2xl border-2 border-emerald-300 dark:border-emerald-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-800 pb-3">
          <h3 className="text-base font-black text-emerald-950 dark:text-emerald-200 flex items-center space-x-2">
            <Mail className="w-5 h-5 text-emerald-600" />
            <span>4. Tự động gửi báo cáo hàng tháng qua Email chủ vườn</span>
          </h3>
          <span className="text-xs font-black px-3 py-1 bg-amber-400 text-emerald-950 rounded-full shadow-xs">
            Tự Động Hóa
          </span>
        </div>

        <p className="text-xs text-gray-700 dark:text-gray-300">
          Vào ngày cuối mỗi tháng, ứng dụng sẽ tự động tổng hợp tất cả đợt cạo, kg mủ nước, kg mủ chén và tổng doanh thu trong tháng để gửi email chi tiết cho chủ vườn.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">
              Email nhận báo cáo tháng chủ vườn
            </label>
            <input
              type="email"
              value={settings.ownerEmail || 'bhttq3@gmail.com'}
              onChange={(e) => onSaveSettings({ ...settings, ownerEmail: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs font-extrabold focus:ring-2 focus:ring-emerald-500"
              placeholder="bhttq3@gmail.com"
            />
          </div>

          <div className="flex items-center space-x-3 pt-6">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoMonthlyEmail !== false}
                onChange={(e) => onSaveSettings({ ...settings, autoMonthlyEmail: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
            <span className="text-xs font-black text-emerald-900 dark:text-emerald-200 uppercase">
              {settings.autoMonthlyEmail !== false ? '✅ Đã Bật Gửi Mail Tháng' : '❌ Tắt Gửi Mail Tháng'}
            </span>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              const currentMonth = now.getMonth() + 1;
              const currentYear = now.getFullYear();
              const monthRecords = records.filter((r) => {
                const d = new Date(r.date);
                return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
              });

              const totalWaterKg = monthRecords.reduce((s, r) => s + r.waterLatexKg, 0);
              const totalCupKg = monthRecords.reduce((s, r) => s + r.cupLatexKg, 0);
              const totalMoney = monthRecords.reduce((s, r) => s + r.totalAmount, 0);

              const subject = encodeURIComponent(`[BÁO CÁO THÁNG ${currentMonth}/${currentYear}] Thu Nhập Mủ Cao Su - ${settings.rubberFieldName || 'Lô Cao Su'}`);
              const body = encodeURIComponent(
                `BÁO CÁO DOANH THU MỦ CAO SU THÁNG ${currentMonth}/${currentYear}\n` +
                `Chủ vườn: ${settings.ownerName || 'Phạm Duy Ngôn'}\n` +
                `Lô cạo: ${settings.rubberFieldName || 'Vườn Cao Su'}\n` +
                `Tổng số ngày cạo: ${monthRecords.length} ngày\n` +
                `Tổng mủ nước: ${totalWaterKg} kg\n` +
                `Tổng mủ chén: ${totalCupKg} kg\n` +
                `-------------------------------\n` +
                `TỔNG THU NHẬP THÁNG: ${formatVND(totalMoney)}\n\n` +
                `Báo cáo được khởi tạo tự động từ ứng dụng Tính Tiền Mủ Cao Su.`
              );

              try {
                window.open(`mailto:${settings.ownerEmail || 'bhttq3@gmail.com'}?subject=${subject}&body=${body}`, '_blank');
              } catch (e) {
                console.warn('Could not open mailto link:', e);
              }
            }}
            id="test-monthly-email-btn"
            className="py-2 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Mail className="w-4 h-4 text-amber-300" />
            <span>Gửi Thử Báo Cáo Tháng {new Date().getMonth() + 1} Qua Email Ngay</span>
          </button>
        </div>
      </div>

      {/* Backup & Restore Data Panel */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
          <Database className="w-5 h-5 text-emerald-600" />
          <span>4. Quản lý & Sao lưu dữ liệu (Thiết bị / JSON / Web)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Export JSON */}
          <button
            onClick={handleExportJSON}
            id="export-json-backup-btn"
            className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 hover:border-emerald-500 text-left transition space-y-1"
          >
            <div className="flex items-center space-x-2 font-bold text-emerald-900 dark:text-emerald-300 text-sm">
              <Download className="w-4 h-4" />
              <span>Sao lưu dữ liệu ra file JSON</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Tải file dự phòng toàn bộ {records.length} ngày cạo mủ về điện thoại hoặc máy tính.
            </p>
          </button>

          {/* Cloud JSON sync */}
          <button
            onClick={handleSyncJSON}
            disabled={isSyncingJson}
            id="sync-json-cloud-btn"
            className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 hover:border-blue-500 disabled:opacity-60 disabled:cursor-wait text-left transition space-y-1"
          >
            <div className="flex items-center space-x-2 font-bold text-blue-900 dark:text-blue-300 text-sm">
              <CloudUpload className="w-4 h-4" />
              <span>{isSyncingJson ? 'Đang đồng bộ lên web...' : 'Đồng bộ JSON lên web'}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Lưu bản sao {records.length} ngày vào tài khoản Google để dùng trên thiết bị khác.
            </p>
          </button>

          {/* Import JSON */}
          <div className="relative">
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleImportJSON}
              className="hidden"
              id="import-json-input"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              id="import-json-btn"
              className="w-full p-4 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 hover:border-teal-500 text-left transition space-y-1"
            >
              <div className="flex items-center space-x-2 font-bold text-teal-900 dark:text-teal-300 text-sm">
                <Upload className="w-4 h-4" />
                <span>Khôi phục JSON lên thiết bị & web</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Chọn file JSON để thay thế nhật ký trên thiết bị và tài khoản Google đang đăng nhập.
              </p>
            </button>
          </div>
        </div>

        {/* Generate Sample Data & Clear Data */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleGenerateSampleData}
            id="generate-sample-data-btn"
            className="flex-1 py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs shadow-xs transition flex items-center justify-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>➕ Tạo Dữ Liệu Cạo Mủ Mẫu (Thử nghiệm)</span>
          </button>

          <button
            onClick={handleClearData}
            id="clear-all-records-btn"
            className="py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs border border-red-200 transition flex items-center justify-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Xóa Toàn Bộ Dữ Liệu</span>
          </button>
        </div>
      </div>

      {/* PWA Installation Instructions */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs space-y-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
          <Smartphone className="w-5 h-5 text-emerald-600" />
          <span>5. Cài đặt ứng dụng PWA (Cài như App)</span>
        </h3>

        <div className="text-xs text-gray-600 dark:text-gray-300 space-y-2 leading-relaxed">
          <p>
            Ứng dụng hỗ trợ chuẩn <strong>Progressive Web App (PWA)</strong> cho phép cài đặt trực tiếp lên màn hình chính thiết bị (iPhone, iPad, Android, Windows, Mac) để mở hoạt động như một ứng dụng độc lập, không cần thanh địa chỉ trình duyệt.
          </p>

          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl space-y-1 font-medium">
            <div className="font-bold text-emerald-800 dark:text-emerald-400">📱 Hướng dẫn cài trên iPhone / iPad (Safari):</div>
            <div>Bấm biểu tượng <strong>Chia sẻ (Share)</strong> ở thanh công cụ Safari ➔ Chọn <strong>"Thêm vào Màn hình chính" (Add to Home Screen)</strong>.</div>

            <div className="font-bold text-emerald-800 dark:text-emerald-400 pt-2">🤖 Hướng dẫn cài trên Android (Chrome):</div>
            <div>Bấm dấu 3 chấm ở góc trình duyệt Chrome ➔ Chọn <strong>"Cài đặt ứng dụng" (Install app)</strong> hoặc <strong>"Thêm vào Màn hình chính"</strong>.</div>

            <div className="font-bold text-emerald-800 dark:text-emerald-400 pt-2">💻 Hướng dẫn cài trên Windows / Mac (Chrome / Edge):</div>
            <div>Nhấp vào biểu tượng <strong>Cài đặt (Install)</strong> nhỏ ở thanh địa chỉ hoặc Menu ➔ Chọn <strong>"Cài đặt Sổ Tay Cạo Mủ"</strong>.</div>
          </div>

          {canInstallPWA && (
            <button
              onClick={onInstallPWA}
              className="mt-2 py-2.5 px-5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center space-x-2"
            >
              <Smartphone className="w-4 h-4 text-amber-300" />
              <span>Cài đặt Ứng dụng PWA Ngay Chiếc Điện Thoại Này</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirm Modal for Removing Sub Email */}
      <ConfirmModal
        isOpen={subEmailRemoveConfirm.isOpen}
        title="Xác Nhận Thu Hồi Email Phụ"
        message={`Bạn có chắc chắn muốn THU HỒI / XÓA Email phụ ${subEmailRemoveConfirm.email} khỏi danh sách được xem nhật ký không?`}
        confirmLabel="Có, Thu Hồi"
        cancelLabel="Không, Hủy"
        variant="danger"
        onConfirm={handleConfirmRemoveSubEmail}
        onCancel={() => setSubEmailRemoveConfirm({ isOpen: false, email: '' })}
      />

      {/* Confirm Modal for Clearing All Data */}
      <ConfirmModal
        isOpen={clearDataConfirm}
        title="CẢNH BÁO: Xóa Toàn Bộ Dữ Liệu"
        message="CẢNH BÁO VĨNH VIỄN: Bạn có chắc chắn muốn XÓA TOÀN BỘ tất cả nhật ký cạo mủ không? Dữ liệu bị xóa sẽ không thể khôi phục."
        confirmLabel="Có, Xóa Tất Cả"
        cancelLabel="Không, Giữ Lại"
        variant="danger"
        onConfirm={handleConfirmClearData}
        onCancel={() => setClearDataConfirm(false)}
      />

      {/* Edit Garden Name Modal */}
      {editingFarm.isOpen && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEditingFarm({ isOpen: false, oldName: '', newName: '', updateHistoricalRecords: true });
            }
          }}
          className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700 my-auto"
          >
            <div className="p-4 bg-emerald-700 text-white flex items-center justify-between font-bold text-sm">
              <div className="flex items-center space-x-2">
                <Pencil className="w-4 h-4" />
                <span>Sửa Tên Vườn / Thợ Cạo</span>
              </div>
              <button
                type="button"
                onClick={() => setEditingFarm({ isOpen: false, oldName: '', newName: '', updateHistoricalRecords: true })}
                className="w-8 h-8 rounded-lg bg-emerald-800 hover:bg-emerald-900 flex items-center justify-center text-amber-200 transition cursor-pointer"
                title="Đóng (ESC)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-500 dark:text-gray-400 mb-1">
                  Tên hiện tại:
                </label>
                <div className="p-2.5 bg-gray-100 dark:bg-gray-700/60 rounded-xl font-bold text-gray-800 dark:text-gray-200">
                  🌳 {editingFarm.oldName}
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-800 dark:text-gray-200 mb-1">
                  Tên mới (sau khi sửa):
                </label>
                <input
                  type="text"
                  value={editingFarm.newName}
                  onChange={(e) => setEditingFarm((prev) => ({ ...prev, newName: e.target.value }))}
                  placeholder="Nhập tên vườn hoặc thợ cạo mới..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingFarm.updateHistoricalRecords}
                    onChange={(e) => setEditingFarm((prev) => ({ ...prev, updateHistoricalRecords: e.target.checked }))}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span className="font-semibold text-emerald-950 dark:text-emerald-200 leading-snug">
                    Tự động cập nhật tên mới này cho tất cả các nhật ký cạo mủ cũ trong lịch sử ({records ? records.filter((r) => r.farmName === editingFarm.oldName).length : 0} ngày)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingFarm({ isOpen: false, oldName: '', newName: '', updateHistoricalRecords: true })}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditFarm}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Lưu Thay Đổi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Garden Name Confirm Modal */}
      <ConfirmModal
        isOpen={deletingFarmConfirm.isOpen}
        title="Xác Nhận Xóa Tên Vườn"
        message={`Bạn có chắc chắn muốn xóa tên vườn/thợ cạo "${deletingFarmConfirm.farmName}" khỏi danh sách xổ ra không?\n\nLưu ý: Các nhật ký cạo mủ cũ đã lưu trước đây vẫn được giữ nguyên trong lịch sử.`}
        confirmLabel="Xóa Khỏi Danh Sách"
        cancelLabel="Hủy Bỏ"
        variant="danger"
        onConfirm={handleConfirmDeleteFarm}
        onCancel={() => setDeletingFarmConfirm({ isOpen: false, farmName: '' })}
      />
    </div>
  );
};
