import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  UserPlus, 
  Trash2, 
  Mail, 
  ShieldAlert, 
  CheckCircle2, 
  Search, 
  Users, 
  Info, 
  Sparkles,
  Lock,
  Eye,
  Calendar,
  Check,
  UserCheck,
  BellRing,
  Clock,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { 
  AllowedUser, 
  UserProfile, 
  AccessRequest,
  SecurityAlert,
  addAllowedEmail, 
  removeAllowedEmail, 
  subscribeToAllowedUsers, 
  subscribeToAccessRequests,
  subscribeToSecurityAlerts,
  approveAccessRequest,
  deleteAccessRequest,
  fetchAllUsersForAdmin,
  createDatabaseBackup,
  ROOT_ADMIN_EMAILS 
} from '../lib/firebase';
import { HarvestRecord, Settings } from '../types';
import { exportToExcel } from '../utils/export';

import { ConfirmModal } from './ConfirmModal';

interface PermissionsTabProps {
  currentUser: UserProfile;
  records?: HarvestRecord[];
  settings?: Settings;
}

export const PermissionsTab: React.FC<PermissionsTabProps> = ({ currentUser, records = [], settings }) => {
  const [allowedList, setAllowedList] = useState<AllowedUser[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // New Email Form State
  const [newEmail, setNewEmail] = useState<string>('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [newNote, setNewNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Subscribe to allowed_users, access_requests & security_alerts in Firestore
  useEffect(() => {
    const unsubAllowed = subscribeToAllowedUsers((list) => {
      setAllowedList(list);
    });

    const unsubRequests = subscribeToAccessRequests((requests) => {
      setAccessRequests(requests);
    });

    const unsubAlerts = subscribeToSecurityAlerts((alerts) => {
      setSecurityAlerts(alerts);
    });

    // Fetch registered users profile
    fetchAllUsersForAdmin().then((users) => {
      setRegisteredUsers(users);
    });

    return () => {
      unsubAllowed();
      unsubRequests();
      unsubAlerts();
    };
  }, []);

  const handleApproveRequest = async (request: AccessRequest) => {
    try {
      await approveAccessRequest(request, 'user', currentUser.email);
      setMessage({
        type: 'success',
        text: `Đã ĐỒNG Ý và CẤP QUYỀN thành công cho Email ${request.email}! người dùng có thể đăng nhập ngay.`
      });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Lỗi khi đồng ý cấp quyền.' });
    }
  };

  // Confirm Modal States
  const [deleteReqConfirm, setDeleteReqConfirm] = useState<{ isOpen: boolean; requestId: string; email: string }>({
    isOpen: false,
    requestId: '',
    email: '',
  });

  const [revokeConfirm, setRevokeConfirm] = useState<{ isOpen: boolean; email: string }>({
    isOpen: false,
    email: '',
  });

  const handleDeleteRequest = (requestId: string, email: string) => {
    setDeleteReqConfirm({ isOpen: true, requestId, email });
  };

  const handleConfirmDeleteRequest = async () => {
    const { requestId, email } = deleteReqConfirm;
    setDeleteReqConfirm({ isOpen: false, requestId: '', email: '' });
    if (!requestId) return;

    try {
      await deleteAccessRequest(requestId);
      setMessage({
        type: 'success',
        text: `Đã XÓA yêu cầu truy cập của Email ${email}.`,
      });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Lỗi khi xóa yêu cầu.' });
    }
  };

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToGrant = newEmail.toLowerCase().trim();

    if (!emailToGrant || !emailToGrant.includes('@')) {
      setMessage({ type: 'error', text: 'Vui lòng nhập địa chỉ Email hợp lệ!' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      await addAllowedEmail(emailToGrant, newRole, currentUser.email, newNote);
      setMessage({
        type: 'success',
        text: `Đã cấp quyền thành công cho Email ${emailToGrant}! Khi người này đăng nhập Google, họ sẽ nhận được 1 bảng dữ liệu trắng riêng biệt.`
      });
      setNewEmail('');
      setNewNote('');
    } catch (err: unknown) {
      console.error(err);
      const e = err as Error;
      setMessage({ type: 'error', text: e.message || 'Lỗi khi cấp quyền cho Email.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    if (currentUser?.email && emailToRemove.toLowerCase() === currentUser.email.toLowerCase()) {
      setMessage({ type: 'error', text: 'Bạn không thể tự xóa quyền của chính tài khoản đang đăng nhập!' });
      return;
    }

    setRevokeConfirm({ isOpen: true, email: emailToRemove });
  };

  const handleConfirmRevokeEmail = async () => {
    const emailToRemove = revokeConfirm.email;
    setRevokeConfirm({ isOpen: false, email: '' });
    if (!emailToRemove) return;

    try {
      await removeAllowedEmail(emailToRemove);

      // Auto export full Excel report & backup snapshot for Garden Owner upon revocation
      if (records && records.length > 0 && settings) {
        await exportToExcel(records, `Bao_Cao_Tudong_ThuHoi_Quyen_${emailToRemove.replace(/[^a-zA-Z0-9]/g, '_')}`, settings);
      }
      if (currentUser && records && settings) {
        await createDatabaseBackup(currentUser.uid, currentUser.email, records, settings);
      }

      setMessage({
        type: 'success',
        text: `Đã THU HỒI QUYỀN TRUY CẬP của Email ${emailToRemove} thành công! Hệ thống đã TỰ ĐỘNG XUẤT BÁO CÁO EXCEL & SAO LƯU DỮ LIỆU gửi về tài khoản Admin / Chủ Vườn (${currentUser.email}).`,
      });
    } catch (err: unknown) {
      console.error(err);
      const e = err as Error;
      setMessage({ type: 'error', text: e.message || 'Lỗi khi thu hồi quyền Email.' });
    }
  };

  // Filter list
  const filteredAllowedList = allowedList.filter((item) => 
    item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.note && item.note.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl flex items-center justify-between relative overflow-hidden">
        <div className="flex items-center space-x-4 relative z-10">
          <div className="p-3.5 bg-amber-400 text-emerald-950 rounded-2xl shadow-lg font-black shrink-0">
            <ShieldCheck className="w-8 h-8 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wide">
                QUẢN LÝ CẤP QUYỀN TRUY CẬP & EMAIL PHỤ (ADMIN)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-emerald-950 font-black text-xs uppercase shadow-xs">
                Chỉ Admin
              </span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1 font-medium">
              Thêm Email được phép đăng nhập hoặc cấp thêm Email phụ cho Chủ Vườn. Mỗi Email sẽ có dữ liệu hoàn toàn bảo mật.
            </p>
          </div>
        </div>
      </div>

      {/* Admin Read Only Notice Card */}
      <div className="bg-emerald-50 dark:bg-emerald-950/70 border-2 border-emerald-300 dark:border-emerald-700 p-5 rounded-3xl shadow-sm space-y-2">
        <div className="flex items-center space-x-2.5 text-emerald-900 dark:text-emerald-200 font-black text-sm uppercase">
          <div className="p-2 bg-emerald-600 text-white rounded-xl font-bold shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-extrabold text-emerald-900 dark:text-emerald-100">Quyền Admin (Chỉ Xem - Read Only)</span>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed font-medium pl-10">
          Admin có thể chuyển đổi xem nhật ký của từng người dùng ở menu góc trên. Trong chế độ xem tài khoản khác, Admin chỉ có quyền xem báo cáo, <strong>hoàn toàn KHÔNG THỂ chỉnh sửa hay xóa dữ liệu</strong> của người dùng.
        </p>
      </div>

      {/* Unauthorized Access Security Alerts Section for Admin */}
      <div className="bg-red-50 dark:bg-red-950/60 border-2 border-red-300 dark:border-red-700 p-5 rounded-3xl shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5 text-red-900 dark:text-red-200 font-black text-sm uppercase">
            <div className="p-2 bg-red-600 text-white rounded-xl font-bold shrink-0 animate-pulse">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-extrabold">Cảnh Báo Nhật Ký Truy Cập Trái Phép</span>
              <p className="text-xs font-normal text-red-800 dark:text-red-300">
                Lịch sử các lần truy cập hoặc đăng nhập khi chưa được Admin cấp quyền.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-red-600 text-white font-black text-xs shadow-xs font-mono">
            {securityAlerts.length} Cảnh báo
          </span>
        </div>

        {securityAlerts.length === 0 ? (
          <div className="bg-white/80 dark:bg-gray-800/80 p-4 rounded-2xl text-xs text-emerald-700 dark:text-emerald-400 text-center font-bold border border-red-200/60 dark:border-red-900 flex items-center justify-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Hệ thống an toàn. Chưa ghi nhận vụ truy cập trái phép nào.</span>
          </div>
        ) : (
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {securityAlerts.map((alt) => (
              <div
                key={alt.id}
                className="bg-white dark:bg-gray-800 p-3.5 rounded-2xl border border-red-200 dark:border-red-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-red-600 shrink-0" />
                    <span className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white">
                      {alt.email}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-black uppercase">
                      CẢNH BÁO TRUY CẬP
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 font-medium">
                    ⏰ Thời gian: {new Date(alt.timestamp).toLocaleString('vi-VN')} | 📱 {alt.userAgent ? alt.userAgent.slice(0, 50) + '...' : 'Di động'}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setNewEmail(alt.email);
                    setMessage({ type: 'success', text: `Đã điền Email ${alt.email} vào biểu mẫu bên dưới. Bạn có thể chọn quyền hạn và nhấn "Cấp Quyền Ngay".` });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-xs transition flex items-center space-x-1 cursor-pointer shrink-0"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Cấp quyền email này</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Access Requests Notifications for Admin */}
      <div className="bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-300 dark:border-amber-700 p-5 rounded-3xl shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5 text-amber-900 dark:text-amber-200 font-black text-sm uppercase">
            <div className="p-2 bg-amber-400 text-emerald-950 rounded-xl font-bold shrink-0 animate-bounce">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base">Thông Báo Yêu Cầu Truy Cập Đang Chờ Duyệt</span>
              <p className="text-xs font-normal text-amber-800 dark:text-amber-300">
                Khi người dùng mới xin cấp quyền từ màn hình đăng nhập, yêu cầu sẽ xuất hiện tại đây.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-400 text-emerald-950 font-black text-xs shadow-xs font-mono">
            {accessRequests.length} Yêu cầu
          </span>
        </div>

        {accessRequests.length === 0 ? (
          <div className="bg-white/80 dark:bg-gray-800/80 p-4 rounded-2xl text-xs text-gray-500 text-center font-medium border border-amber-200/60 dark:border-amber-900">
            Hiện tại không có yêu cầu truy cập nào đang chờ duyệt.
          </div>
        ) : (
          <div className="space-y-3">
            {accessRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-extrabold text-sm text-gray-900 dark:text-white">
                      {req.email}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{new Date(req.requestedAt).toLocaleString('vi-VN')}</span>
                    </span>
                    {req.note && <span className="italic text-gray-600 dark:text-gray-400">"{req.note}"</span>}
                  </div>
                </div>

                {/* Approve and Delete Action Buttons */}
                <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0">
                  <button
                    onClick={() => handleApproveRequest(req)}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs shadow-sm transition flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4 text-amber-300" />
                    <span>Đồng ý</span>
                  </button>

                  <button
                    onClick={() => handleDeleteRequest(req.id, req.email)}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-xs shadow-sm transition flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                    <span>Xóa</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Explanation Box */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/60 dark:to-gray-900 p-5 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 space-y-3">
        <div className="flex items-center space-x-2 text-emerald-900 dark:text-emerald-300 font-black text-sm uppercase">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span>Nguyên Tắc Hoạt Động & Bảo Mật Dữ Liệu</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div className="bg-white dark:bg-gray-800 p-3.5 rounded-xl border border-emerald-100 dark:border-gray-700 space-y-1">
            <div className="font-bold text-gray-900 dark:text-white flex items-center space-x-1.5">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>1. Dữ Liệu Trắng Riêng Độc Lập</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">
              Khi được cấp quyền, người dùng đăng nhập bằng Google Auth sẽ có một workspace trống hoàn toàn riêng biệt. Dữ liệu cạo mủ được lưu trữ an toàn theo UID người đó, không bị lẫn lộn hay sở hữu chung với bất kỳ ai.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-3.5 rounded-xl border border-emerald-100 dark:border-gray-700 space-y-1">
            <div className="font-bold text-gray-900 dark:text-white flex items-center space-x-1.5">
              <Eye className="w-4 h-4 text-amber-600" />
              <span>2. Quyền Admin (Chỉ Xem - Read Only)</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">
              Admin có thể chuyển đổi xem nhật ký của từng người dùng ở menu góc trên. Trong chế độ xem tài khoản khác, Admin <strong>chỉ có quyền xem báo cáo</strong>, hoàn toàn KHÔNG THỂ chỉnh sửa hay xóa dữ liệu của người dùng.
            </p>
          </div>
        </div>
      </div>

      {/* Grant Email Access Form */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 border-b border-gray-100 dark:border-gray-700 pb-3">
          <UserPlus className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-black text-gray-900 dark:text-white uppercase">
            Cấp Quyền Cho Địa Chỉ Email Mới
          </h3>
        </div>

        {message && (
          <div className={`p-4 rounded-xl text-xs sm:text-sm font-bold flex items-start space-x-2 border ${
            message.type === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border-emerald-300' 
              : 'bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-200 border-red-300'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" /> : <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleAddEmail} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Địa chỉ Email Google (*)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="vi-du: nongdan.caocau@gmail.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-medium text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Vai Trò Quyền Hạn
            </label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as 'admin' | 'user')}
              className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-medium text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="user">🌾 Nông dân / Người dùng (Mặc định)</option>
              <option value="admin">👑 Quản trị viên (Admin)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Ghi Chú / Tên Chủ Vườn (Tùy chọn)
            </label>
            <input
              type="text"
              placeholder="VD: Anh Tấn - Vườn Lô 3"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-medium text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs sm:text-sm shadow-md active:scale-98 transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4 stroke-[3]" />
              <span>{submitting ? 'Đang cấp quyền...' : '➕ Cấp Quyền Cho Email Này Ngay'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Allowed Emails Table / List */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-700 pb-3">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-black text-gray-900 dark:text-white uppercase">
              Danh Sách Email Đã Được Cấp Quyền ({allowedList.length})
            </h3>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm theo email hoặc ghi chú..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs text-gray-800 dark:text-gray-200 focus:outline-none"
            />
          </div>
        </div>

        {filteredAllowedList.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-xs font-medium">
            Chưa có Email nào khớp với tìm kiếm.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/80 text-gray-500 dark:text-gray-400 font-bold uppercase text-[11px] border-b border-gray-100 dark:border-gray-700">
                  <th className="p-3">Địa Chỉ Email</th>
                  <th className="p-3">Vai Trò</th>
                  <th className="p-3">Ghi Chú Vườn</th>
                  <th className="p-3">Ngày Cấp Quyền</th>
                  <th className="p-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 font-medium">
                {filteredAllowedList.map((item) => {
                  const isRoot = ROOT_ADMIN_EMAILS.some((adm) => adm.toLowerCase() === item.email.toLowerCase());

                  return (
                    <tr key={item.email} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-bold text-gray-900 dark:text-white">
                            {item.email}
                          </span>
                        </div>
                      </td>

                      <td className="p-3">
                        {isRoot ? (
                          <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 font-black text-[11px]">
                            👑 Admin Tối Cao
                          </span>
                        ) : item.role === 'admin' ? (
                          <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300 font-bold text-[11px]">
                            👑 Quản Trị Viên
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
                            🌾 Nông Dân Cạo Mủ
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-gray-600 dark:text-gray-300">
                        {item.note || '—'}
                      </td>

                      <td className="p-3 text-gray-500 text-xs font-mono">
                        {item.addedAt ? new Date(item.addedAt).toLocaleDateString('vi-VN') : '—'}
                      </td>

                      <td className="p-3 text-right">
                        {currentUser?.email && item.email.toLowerCase() === currentUser.email.toLowerCase() ? (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold italic">Đang đăng nhập</span>
                        ) : (
                          <button
                            onClick={() => handleRemoveEmail(item.email)}
                            className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-xs transition flex items-center space-x-1 ml-auto cursor-pointer shadow-xs"
                            title={isRoot ? "Xóa quyền Admin Tối Cao" : "Thu hồi / Xóa quyền truy cập"}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-white" />
                            <span>{isRoot ? 'Xóa Admin Tối Cao' : 'Xóa / Thu hồi'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Registered Profiles List */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 border-b border-gray-100 dark:border-gray-700 pb-3">
          <Users className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-black text-gray-900 dark:text-white uppercase">
            Tài Khoản Google Đã Từng Đăng Nhập Hệ Thống ({registeredUsers.length})
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {registeredUsers.map((u) => (
            <div 
              key={u.uid}
              className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center space-x-3"
            >
              <img 
                src={u.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                alt={u.displayName}
                className="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-600 object-cover"
              />
              <div className="overflow-hidden">
                <div className="font-bold text-xs text-gray-900 dark:text-white truncate">
                  {u.displayName}
                </div>
                <div className="text-[11px] text-gray-500 truncate">
                  {u.email}
                </div>
                <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
                  Lần cuối: {new Date(u.updatedAt).toLocaleDateString('vi-VN')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirm Modal for Revoking Email Access */}
      <ConfirmModal
        isOpen={revokeConfirm.isOpen}
        title="Xác Nhận Thu Hồi Quyền"
        message={`Bạn có chắc chắn muốn THU HỒI QUYỀN TRUY CẬP của Email ${revokeConfirm.email}? Người dùng này sẽ không thể truy cập ứng dụng nữa.`}
        confirmLabel="Có, Thu Hồi"
        cancelLabel="Không, Hủy"
        variant="danger"
        onConfirm={handleConfirmRevokeEmail}
        onCancel={() => setRevokeConfirm({ isOpen: false, email: '' })}
      />

      {/* Confirm Modal for Deleting Access Request */}
      <ConfirmModal
        isOpen={deleteReqConfirm.isOpen}
        title="Xác Nhận Xóa Yêu Cầu"
        message={`Bạn có chắc chắn muốn XÓA yêu cầu truy cập từ Email ${deleteReqConfirm.email}?`}
        confirmLabel="Có, Xóa"
        cancelLabel="Không, Hủy"
        variant="danger"
        onConfirm={handleConfirmDeleteRequest}
        onCancel={() => setDeleteReqConfirm({ isOpen: false, requestId: '', email: '' })}
      />

    </div>
  );
};
