import { initializeApp, getApps, getApp, setLogLevel } from 'firebase/app';

// Suppress verbose SDK network logs (e.g., backend non-responsiveness warnings)
setLogLevel('error');
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  writeBatch,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import firebaseAppletConfig from '../../firebase-applet-config.json';
import { HarvestRecord, Settings } from '../types';

// Environment values take precedence so production credentials stay outside Git.
// The JSON file is retained only as a local-preview fallback.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseAppletConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseAppletConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseAppletConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseAppletConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseAppletConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseAppletConfig.appId,
  firestoreDatabaseId:
    import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || firebaseAppletConfig.firestoreDatabaseId,
};

if (firebaseConfig.apiKey.includes('DummyKeyForLocalDevelopment')) {
  console.warn('Firebase chưa được cấu hình. Hãy thêm các biến VITE_FIREBASE_* trước khi phát hành.');
}

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Complete persistence setup before starting a redirect. This is important on iOS,
// where Google opens an external page and returns to the PWA in a new document.
const authPersistenceReady: Promise<void> = typeof window !== 'undefined'
  ? setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn('Firebase setPersistence notice:', err);
    })
  : Promise.resolve();

// Custom Database ID support
const customDbId = (firebaseConfig as Record<string, any>)?.firestoreDatabaseId;
export const db = customDbId 
  ? getFirestore(app, customDbId)
  : getFirestore(app);

// Enable Offline Persistence for zero lag and protection against network data loss
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence enabled in another tab.');
    } else if (err.code === 'unimplemented') {
      console.warn('Browser does not support offline persistence.');
    }
  });
}

/**
 * Security: Anti-F12 / Anti-Tamper check.
 * Verifies that the current action is backed by an authenticated Firebase token.
 */
export function getVerifiedUser() {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.email) {
    throw new Error('Xác thực không hợp lệ. Vui lòng đăng nhập lại qua Google!');
  }
  return currentUser;
}

export const ROOT_ADMIN_EMAILS = [
  'tayninhdoimoi@gmail.com',
  'ngonpham8x@gmail.com',
  'bhttq3@gmail.com',
  'ngocnt1091@gmail.com'
];
export const ROOT_ADMIN_EMAIL = 'bhttq3@gmail.com';

const LEGACY_SAMPLE_FARMS = ['Vườn Nhà', 'Vườn Đồi 1', 'Vườn Lô 2', 'Thợ Cạo A'];

function removeLegacySampleFarms(farms?: string[]): string[] {
  if (!Array.isArray(farms)) return [];
  const matchesLegacyList = farms.length === LEGACY_SAMPLE_FARMS.length
    && farms.every((farm) => LEGACY_SAMPLE_FARMS.includes(farm));
  return matchesLegacyList ? [] : farms;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'admin' | 'user' | 'sub_viewer';
  createdAt: string;
  updatedAt: string;
  settings?: Settings;
  subEmails?: string[]; // Up to 5 sub-emails allowed
  parentUserId?: string; // If this user is a sub-email, points to owner's UID
  parentUserEmail?: string; // If this user is a sub-email, points to owner's email
}

export interface AllowedUser {
  email: string; // Lowercased
  role: 'admin' | 'user';
  addedBy: string;
  addedAt: string;
  note?: string;
}

/** Start Google sign-in. Popup is attempted first so Safari keeps the auth state
 * in the same document; redirect remains a fallback when the browser blocks it. */
export async function loginWithGoogle() {
  await authPersistenceReady;
  // Force Google to re-authenticate instead of silently reusing a trusted device session.
  googleProvider.setCustomParameters({ prompt: 'login' });

  const canFallbackToRedirect = typeof window !== 'undefined' && (
    window.matchMedia?.('(pointer: coarse)').matches ||
    /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );

  try {
    const loginPromise = signInWithPopup(auth, googleProvider);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Quá thời gian kết nối Google. Vui lòng bấm đăng nhập lại!')), 30000)
    );
    const result = (await Promise.race([loginPromise, timeoutPromise])) as any;
    return result.user;
  } catch (error: any) {
    const canRetryWithRedirect = canFallbackToRedirect && (
      error?.code === 'auth/popup-blocked' ||
      error?.code === 'auth/operation-not-supported-in-this-environment'
    );

    if (!canRetryWithRedirect) throw error;

    await signInWithRedirect(auth, googleProvider);
    return null;
  }
}

/** Resolve the Google redirect when mobile authentication returns to this page. */
export async function completeGoogleRedirect() {
  await authPersistenceReady;
  return getRedirectResult(auth);
}

/**
 * Sign out
 */
export async function logoutFirebase() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

export interface PermissionCheckResult {
  isAllowed: boolean;
  isAdmin: boolean;
  isSubViewer?: boolean;
  parentUserId?: string;
  parentUserEmail?: string;
  parentOwnerName?: string;
}

/**
 * Check if an email is authorized:
 * 1. Is one of the 4 Root Admins?
 * 2. Is present in allowed_users collection?
 * 3. Is listed as a sub-email (max 5) of an allowed user?
 */
export async function checkEmailAccessPermission(email: string): Promise<PermissionCheckResult> {
  const lowerEmail = email.toLowerCase().trim();
  
  if (ROOT_ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === lowerEmail)) {
    return { isAllowed: true, isAdmin: true };
  }

  try {
    // 1. Check direct allowed_users collection
    const allowedDocRef = doc(db, 'allowed_users', lowerEmail);
    const allowedDocSnap = await getDoc(allowedDocRef);

    if (allowedDocSnap.exists()) {
      const data = allowedDocSnap.data() as AllowedUser;
      return {
        isAllowed: true,
        isAdmin: data.role === 'admin',
      };
    }

    // 2. Check if this email is a sub-email assigned by an authorized main user
    const usersCol = collection(db, 'users');
    const qSub = query(usersCol, where('subEmails', 'array-contains', lowerEmail));
    const subSnap = await getDocs(qSub);

    if (!subSnap.empty) {
      const ownerDoc = subSnap.docs[0];
      const ownerData = ownerDoc.data() as UserProfile;
      return {
        isAllowed: true,
        isAdmin: false,
        isSubViewer: true,
        parentUserId: ownerData.uid,
        parentUserEmail: ownerData.email,
        parentOwnerName: ownerData.displayName,
      };
    }
  } catch (err) {
    console.error('Error checking permission for email:', err);
  }

  return { isAllowed: false, isAdmin: false };
}

/**
 * Real-time listener for email access permission with guaranteed callback resolution.
 * Triggers callback whenever permission status changes.
 */
export function subscribeToEmailAccessPermission(
  email: string,
  onUpdate: (result: PermissionCheckResult) => void
) {
  const safeUpdate = (res: PermissionCheckResult) => {
    setTimeout(() => onUpdate(res), 0);
  };

  const lowerEmail = email.toLowerCase().trim();
  if (!lowerEmail) {
    safeUpdate({ isAllowed: false, isAdmin: false });
    return () => {};
  }

  if (ROOT_ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === lowerEmail)) {
    safeUpdate({ isAllowed: true, isAdmin: true });
    return () => {};
  }

  let hasResponded = false;
  // 3.5s timeout safety: if Firestore onSnapshot hangs or is slow, run direct permission check
  const timeoutTimer = setTimeout(async () => {
    if (!hasResponded) {
      console.warn('subscribeToEmailAccessPermission listener timeout, executing fallback permission check...');
      try {
        const permission = await checkEmailAccessPermission(lowerEmail);
        safeUpdate(permission);
      } catch (e) {
        safeUpdate({ isAllowed: false, isAdmin: false });
      }
    }
  }, 3500);

  const allowedDocRef = doc(db, 'allowed_users', lowerEmail);
  const unsub = onSnapshot(allowedDocRef, async (snap) => {
    hasResponded = true;
    clearTimeout(timeoutTimer);
    if (snap.exists()) {
      const data = snap.data() as AllowedUser;
      safeUpdate({
        isAllowed: true,
        isAdmin: data.role === 'admin',
      });
    } else {
      // Document missing/deleted, check if it's a sub-email
      try {
        const permission = await checkEmailAccessPermission(lowerEmail);
        safeUpdate(permission);
      } catch (e) {
        safeUpdate({ isAllowed: false, isAdmin: false });
      }
    }
  }, async (err) => {
    hasResponded = true;
    clearTimeout(timeoutTimer);
    console.error('Error listening to permission changes:', err);
    try {
      const permission = await checkEmailAccessPermission(lowerEmail);
      safeUpdate(permission);
    } catch (e) {
      safeUpdate({ isAllowed: false, isAdmin: false });
    }
  });

  return () => {
    clearTimeout(timeoutTimer);
    unsub();
  };
}

/**
 * Ensure Root Admins are automatically added to allowed_users if missing
 */
export async function ensureRootAdminAllowed(adminUser: User) {
  const lowerEmail = (adminUser.email || '').toLowerCase();
  if (!lowerEmail) return;

  try {
    const allowedDocRef = doc(db, 'allowed_users', lowerEmail);
    const snap = await getDoc(allowedDocRef);
    if (!snap.exists()) {
      await setDoc(allowedDocRef, {
        email: lowerEmail,
        role: 'admin',
        addedBy: 'SYSTEM_BOOTSTRAP',
        addedAt: new Date().toISOString(),
        note: 'Admin tối cao hệ thống',
      });
    }
  } catch (e) {
    console.error('Failed ensuring root admin in allowed_users:', e);
  }
}

export interface AccessRequest {
  id: string;
  email: string;
  requestedAt: string;
  note?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface SecurityAlert {
  id: string;
  email: string;
  timestamp: string;
  action: string;
  ip?: string;
  userAgent?: string;
  severity: 'low' | 'medium' | 'high';
  status: 'new' | 'reviewed';
}

export interface BackupItem {
  id: string;
  userId: string;
  userEmail: string;
  createdAt: string;
  recordCount: number;
  dataJson: string;
}

/**
 * Log intrusion attempt or suspicious activity to Firestore security_alerts
 */
export async function logSecurityAlert(
  email: string,
  action: string,
  severity: 'low' | 'medium' | 'high' = 'high'
) {
  try {
    const alertsCol = collection(db, 'security_alerts');
    const alertId = doc(alertsCol).id;
    await setDoc(doc(db, 'security_alerts', alertId), {
      id: alertId,
      email: email.toLowerCase().trim(),
      timestamp: new Date().toISOString(),
      action,
      severity,
      status: 'new',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    });
  } catch (err) {
    console.error('Failed to log security alert:', err);
  }
}

/**
 * Admin: Subscribe to real-time security alerts
 */
export function subscribeToSecurityAlerts(onUpdate: (alerts: SecurityAlert[]) => void) {
  const colRef = collection(db, 'security_alerts');
  const latestAlerts = query(colRef, orderBy('timestamp', 'desc'), limit(50));
  return onSnapshot(latestAlerts, (snap) => {
    const list: SecurityAlert[] = [];
    snap.forEach((docSnap) => {
      list.push(docSnap.data() as SecurityAlert);
    });
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setTimeout(() => onUpdate(list), 0);
  }, (err) => {
    console.warn('Security alerts subscription non-fatal notice:', err.message);
    setTimeout(() => onUpdate([]), 0);
  });
}

/**
 * Create automated database backup and store in Firestore & localStorage
 */
export async function createDatabaseBackup(
  userId: string,
  userEmail: string,
  records: HarvestRecord[],
  settings?: Settings
): Promise<string> {
  const backupId = `backup_${new Date().toISOString().slice(0, 10)}_${Date.now()}`;
  const backupData = {
    records,
    settings,
    exportedAt: new Date().toISOString(),
    recordCount: records.length,
  };
  const jsonString = JSON.stringify(backupData);

  // 1. Save to local storage cache
  try {
    localStorage.setItem(`auto_backup_${userId}`, jsonString);
  } catch (e) {
    console.warn('LocalStorage backup failed:', e);
  }

  // 2. Save to Firestore backups collection
  try {
    const backupRef = doc(db, 'backups', backupId);
    await setDoc(backupRef, {
      id: backupId,
      userId,
      userEmail,
      createdAt: new Date().toISOString(),
      recordCount: records.length,
      dataJson: jsonString,
    });
    try {
      localStorage.setItem(`last_backup_time_${userId}`, new Date().toISOString());
    } catch (e) {
      console.warn('LocalStorage backup timestamp failed:', e);
    }
  } catch (err) {
    console.error('Firestore backup failed:', err);
    throw err instanceof Error ? err : new Error('Không thể lưu bản sao lên Firestore');
  }

  return backupId;
}

/**
 * Check if 7 days passed since last backup and trigger automatic weekly backup
 */
export async function checkAndTriggerWeeklyBackup(
  userId: string,
  userEmail: string,
  records: HarvestRecord[],
  settings?: Settings
): Promise<boolean> {
  if (records.length === 0) return false;

  const lastBackupStr = localStorage.getItem(`last_backup_time_${userId}`);
  const now = new Date().getTime();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

  if (!lastBackupStr || (now - new Date(lastBackupStr).getTime()) >= SEVEN_DAYS_MS) {
    await createDatabaseBackup(userId, userEmail, records, settings);
    return true; // Backup triggered
  }
  return false;
}


function sanitizeEmailToName(email?: string): string {
  if (!email) return 'Phạm Duy Ngôn';
  const lower = email.toLowerCase();
  if (lower.includes('ngon') || lower.includes('bhttq3') || lower.includes('tayninhdoimoi')) {
    return 'Phạm Duy Ngôn';
  }
  const prefix = email.split('@')[0];
  if (prefix && !prefix.toLowerCase().includes('linh tinh')) {
    return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  }
  return 'Phạm Duy Ngôn';
}

function cleanName(rawName?: string, userEmail?: string): string {
  if (!rawName) return sanitizeEmailToName(userEmail);
  const lower = rawName.trim().toLowerCase();
  if (lower.includes('linh tinh') || lower === 'nông dân cạo mủ' || lower === 'user') {
    return sanitizeEmailToName(userEmail);
  }
  return rawName.trim();
}

/**
 * Upsert User Profile & Settings in Firestore
 */
export async function syncUserProfile(
  user: User, 
  permissionInfo: PermissionCheckResult, 
  defaultSettings: Settings
): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  const now = new Date().toISOString();
  const effectiveRole = permissionInfo.isSubViewer 
    ? 'sub_viewer' 
    : permissionInfo.isAdmin 
      ? 'admin' 
      : 'user';

  const userCleanName = cleanName(user.displayName || '', user.email || '');

  if (!snap.exists()) {
    const parentUserId = permissionInfo.parentUserId || null;
    const parentUserEmail = permissionInfo.parentUserEmail || null;

    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: userCleanName,
      photoURL: user.photoURL || '',
      role: effectiveRole,
      createdAt: now,
      updatedAt: now,
      subEmails: [],
      ...(parentUserId ? { parentUserId } : {}),
      ...(parentUserEmail ? { parentUserEmail } : {}),
      settings: {
        ...defaultSettings,
        ownerName: userCleanName || defaultSettings.ownerName,
      },
    };

    // Strip any potential undefined values for Firestore safety
    const docData: Record<string, any> = {
      uid: newProfile.uid,
      email: newProfile.email,
      displayName: newProfile.displayName,
      photoURL: newProfile.photoURL,
      role: newProfile.role,
      createdAt: newProfile.createdAt,
      updatedAt: newProfile.updatedAt,
      subEmails: [],
      parentUserId: parentUserId,
      parentUserEmail: parentUserEmail,
      settings: newProfile.settings,
    };

    await setDoc(userRef, docData);
    return newProfile;
  } else {
    const existing = snap.data() as UserProfile;
    const parentUserId = permissionInfo.parentUserId || existing.parentUserId || null;
    const parentUserEmail = permissionInfo.parentUserEmail || existing.parentUserEmail || null;

    const cleanDisplayName = cleanName(user.displayName || existing.displayName || '', user.email || existing.email || '');
    const cleanOwnerName = cleanName(existing.settings?.ownerName, user.email || existing.email || '');

    const updatedSettings = {
      ...defaultSettings,
      ...(existing.settings || {}),
      farmsList: removeLegacySampleFarms(existing.settings?.farmsList),
      ownerName: cleanOwnerName,
    };

    const updatedProfile: UserProfile = {
      ...existing,
      email: user.email || existing.email,
      displayName: cleanDisplayName,
      photoURL: user.photoURL || existing.photoURL,
      role: effectiveRole,
      ...(parentUserId ? { parentUserId } : {}),
      ...(parentUserEmail ? { parentUserEmail } : {}),
      settings: updatedSettings,
      updatedAt: now,
    };

    await updateDoc(userRef, {
      email: updatedProfile.email,
      displayName: updatedProfile.displayName,
      photoURL: updatedProfile.photoURL,
      role: updatedProfile.role,
      parentUserId: parentUserId,
      parentUserEmail: parentUserEmail,
      settings: updatedSettings,
      updatedAt: now,
    });
    return updatedProfile;
  }
}

/**
 * Manage Sub-emails (Max 5) for a Main User
 */
export async function updateUserSubEmails(userId: string, subEmails: string[]) {
  const cleanList = Array.from(
    new Set(subEmails.map((e) => e.toLowerCase().trim()).filter(Boolean))
  );

  if (cleanList.length > 5) {
    throw new Error('Chỉ được phép cấp quyền tối đa 5 Email phụ!');
  }

  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    subEmails: cleanList,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Subscribe to real-time Harvest Records for a specific user ID
 */
export function subscribeToUserRecords(
  targetUserId: string,
  onRecordsUpdated: (records: HarvestRecord[]) => void
) {
  const recordsCol = collection(db, 'harvest_records');
  const q = query(recordsCol, where('userId', '==', targetUserId));

  return onSnapshot(q, (snapshot) => {
    const recordsList: HarvestRecord[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      recordsList.push({
        id: docSnap.id,
        date: data.date,
        time: data.time || '05:30',
        farmName: data.farmName || '',
        degreeLatex: data.degreeLatex,
        cupLatex: data.cupLatex,
        scrapLatex: data.scrapLatex || { weight: 0, pricePerKg: 0, total: 0 },
        dailyTotal: data.dailyTotal,
        cumulativeTotal: data.cumulativeTotal,
        note: data.note || '',
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      });
    });

    // Sort descending by date
    recordsList.sort((a, b) => b.date.localeCompare(a.date));
    setTimeout(() => onRecordsUpdated(recordsList), 0);
  }, (error) => {
    console.error('Error subscribing to harvest_records:', error);
  });
}

/**
 * Save / Update a Harvest Record in Firestore
 */
export async function saveRecordToFirestore(
  record: HarvestRecord, 
  user: UserProfile
): Promise<string> {
  const recordsCol = collection(db, 'harvest_records');
  const recordDocId = record.id && !record.id.startsWith('sample-') 
    ? record.id 
    : doc(recordsCol).id;

  const docRef = doc(db, 'harvest_records', recordDocId);

  const payload = {
    id: recordDocId,
    userId: user.uid,
    userEmail: user.email,
    date: record.date,
    time: record.time || '05:30',
    farmName: record.farmName || '',
    degreeLatex: record.degreeLatex,
    cupLatex: record.cupLatex,
    scrapLatex: record.scrapLatex || { weight: 0, pricePerKg: 0, total: 0 },
    dailyTotal: record.dailyTotal,
    cumulativeTotal: record.cumulativeTotal || 0,
    note: record.note || '',
    createdAt: record.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(docRef, payload, { merge: true });
  return recordDocId;
}

/**
 * Replace the signed-in user's cloud journal with an imported JSON snapshot.
 * The operation is chunked so it also works when a journal contains more than
 * Firestore's 500-write batch limit.
 */
export async function replaceUserRecordsInFirestore(
  records: HarvestRecord[],
  user: UserProfile
): Promise<HarvestRecord[]> {
  const recordsCol = collection(db, 'harvest_records');
  const existing = await getDocs(query(recordsCol, where('userId', '==', user.uid)));
  const usedIds = new Set<string>();
  const recordsWithIds = records.map((record) => {
    let id = record.id && !record.id.startsWith('sample-') ? record.id : doc(recordsCol).id;
    if (usedIds.has(id)) id = doc(recordsCol).id;
    usedIds.add(id);
    return { ...record, id };
  });

  const operations: Array<{ type: 'delete' | 'set'; ref: ReturnType<typeof doc>; data?: Record<string, unknown> }> = [];
  existing.forEach((snapshot) => operations.push({ type: 'delete', ref: snapshot.ref }));

  recordsWithIds.forEach((record) => {
    operations.push({
      type: 'set',
      ref: doc(db, 'harvest_records', record.id),
      data: {
        id: record.id,
        userId: user.uid,
        userEmail: user.email,
        date: record.date,
        time: record.time || '05:30',
        farmName: record.farmName || '',
        degreeLatex: record.degreeLatex,
        cupLatex: record.cupLatex,
        scrapLatex: record.scrapLatex || { weight: 0, pricePerKg: 0, total: 0 },
        dailyTotal: record.dailyTotal,
        cumulativeTotal: record.cumulativeTotal || 0,
        note: record.note || '',
        createdAt: record.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  });

  for (let offset = 0; offset < operations.length; offset += 450) {
    const batch = writeBatch(db);
    operations.slice(offset, offset + 450).forEach((operation) => {
      if (operation.type === 'delete') batch.delete(operation.ref);
      else batch.set(operation.ref, operation.data || {}, { merge: true });
    });
    await batch.commit();
  }

  return recordsWithIds;
}

/**
 * Delete a Harvest Record in Firestore
 */
export async function deleteRecordFromFirestore(recordId: string) {
  const docRef = doc(db, 'harvest_records', recordId);
  await deleteDoc(docRef);
}

/**
 * Save user settings to Firestore
 */
export async function saveUserSettingsToFirestore(userId: string, settings: Settings) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    settings,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Admin: Fetch all users who have logged in or registered
 */
export async function fetchAllUsersForAdmin(): Promise<UserProfile[]> {
  try {
    const usersCol = collection(db, 'users');
    const snap = await getDocs(usersCol);
    const users: UserProfile[] = [];
    snap.forEach((d) => {
      users.push(d.data() as UserProfile);
    });
    return users;
  } catch (err) {
    console.error('Error fetching users for admin:', err);
    return [];
  }
}

/**
 * Admin: Subscribe to allowed_users collection
 */
export function subscribeToAllowedUsers(onUpdate: (allowedList: AllowedUser[]) => void) {
  const colRef = collection(db, 'allowed_users');
  return onSnapshot(colRef, (snap) => {
    const list: AllowedUser[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as AllowedUser;
      list.push(data);
    });
    setTimeout(() => onUpdate(list), 0);
  }, (err) => {
    console.error('Error subscribing to allowed_users:', err);
  });
}

/**
 * Admin: Add email to Whitelist
 */
export async function addAllowedEmail(email: string, role: 'admin' | 'user', addedBy: string, note?: string) {
  const cleanEmail = email.toLowerCase().trim();
  if (!cleanEmail) throw new Error('Email không được để trống');

  const docRef = doc(db, 'allowed_users', cleanEmail);
  await setDoc(docRef, {
    email: cleanEmail,
    role,
    addedBy,
    addedAt: new Date().toISOString(),
    note: note || '',
  });
}

/**
  * Admin: Remove email from Whitelist
  */
export async function removeAllowedEmail(email: string) {
  const cleanEmail = email.toLowerCase().trim();
  if (cleanEmail === ROOT_ADMIN_EMAIL.toLowerCase()) {
    throw new Error('Không thể xóa Admin tối cao khỏi danh sách!');
  }
  const docRef = doc(db, 'allowed_users', cleanEmail);
  await deleteDoc(docRef);
}

/**
 * User: Submit request for access authorization
 */
export async function requestAccessPermission(email: string, note?: string) {
  const cleanEmail = email.toLowerCase().trim();
  if (!cleanEmail) throw new Error('Email không hợp lệ!');

  const reqId = cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
  const reqRef = doc(db, 'access_requests', reqId);

  await setDoc(reqRef, {
    id: reqId,
    email: cleanEmail,
    requestedAt: new Date().toISOString(),
    note: note || 'Người dùng yêu cầu mở tài khoản',
    status: 'pending',
  });
}

/**
 * Admin: Subscribe to real-time pending access requests
 */
export function subscribeToAccessRequests(onUpdate: (requests: AccessRequest[]) => void) {
  const colRef = collection(db, 'access_requests');
  const pendingRequests = query(colRef, where('status', '==', 'pending'), limit(50));
  return onSnapshot(pendingRequests, (snap) => {
    const list: AccessRequest[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as AccessRequest;
      if (data.status === 'pending') {
        list.push(data);
      }
    });
    // Sort newest first
    list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
    setTimeout(() => onUpdate(list), 0);
  }, (err) => {
    console.error('Error subscribing to access_requests:', err);
  });
}

/**
 * Admin: Approve access request (adds to allowed_users and removes request)
 */
export async function approveAccessRequest(
  request: AccessRequest, 
  role: 'user' | 'admin', 
  approvedBy: string
) {
  // Add to allowed_users whitelist
  await addAllowedEmail(request.email, role, approvedBy, `Được duyệt từ Yêu cầu truy cập (${request.note || ''})`);

  // Update or delete access_requests document
  const reqRef = doc(db, 'access_requests', request.id);
  await deleteDoc(reqRef);
}

/**
 * Admin: Delete / Reject access request
 */
export async function deleteAccessRequest(requestId: string) {
  const reqRef = doc(db, 'access_requests', requestId);
  await deleteDoc(reqRef);
}
