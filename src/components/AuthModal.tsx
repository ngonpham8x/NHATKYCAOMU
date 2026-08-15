import { useState } from 'react';
import { LogIn, ShieldAlert, CheckCircle2, UserX, Sparkles, Lock, ArrowRight, Send, Check } from 'lucide-react';
import { loginWithGoogle, requestAccessPermission, ROOT_ADMIN_EMAIL } from '../lib/firebase';

interface AuthModalProps {
  onLoginSuccess: () => void;
  unauthorizedEmail?: string | null;
  authError?: string | null;
  onLogoutAndRetry?: () => void;
  onDirectLogin?: (email: string, role: 'admin' | 'user') => void;
}

export const AuthModal = ({
  unauthorizedEmail,
  authError,
  onLogoutAndRetry,
  onDirectLogin,
}: AuthModalProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [requestSent, setRequestSent] = useState<boolean>(false);
  const [sendingRequest, setSendingRequest] = useState<boolean>(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await loginWithGoogle();
      // Auth state change in App.tsx will handle authorization check
      } catch (err: unknown) {
        console.error('Login error:', err);
        const e = err as { code?: string; message?: string };
        if (e.code !== 'auth/popup-closed-by-user') {
          const errMsg = e.message || 'Lỗi không xác định';
          setErrorMsg(`Lỗi Đăng Nhập [${e.code || 'SYS'}]: ${errMsg}`);
        }
    } finally {
      setLoading(false);
    }
  };

  const handleSendAccessRequest = async () => {
    if (!unauthorizedEmail) return;
    setSendingRequest(true);
    try {
      await requestAccessPermission(unauthorizedEmail, 'Người dùng yêu cầu mở tài khoản từ giao diện AuthModal');
      setRequestSent(true);
    } catch (err) {
      console.error('Error sending access request:', err);
      setErrorMsg('Lỗi khi gửi yêu cầu. Vui lòng liên hệ Admin qua Zalo/SĐT 0822.899.357');
    } finally {
      setSendingRequest(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md shadow-2xl border border-emerald-100 dark:border-gray-700 overflow-hidden my-auto">
        
        {/* Top Header Card */}
        <div className="bg-gradient-to-br from-emerald-800 via-teal-800 to-emerald-900 p-6 sm:p-8 text-white text-center relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />
          
          <img 
            src="/logo.svg" 
            alt="Sổ Tay Cạo Mủ Logo" 
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shadow-xl border-2 border-amber-300 mx-auto mb-3 object-contain bg-white p-1" 
          />

          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wide">
            Tính Tiền Mủ Cao Su
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 mt-1 font-medium">
            Hệ thống Quản lý Sản Lượng & Phân Quyền Theo Email
          </p>

          <div className="mt-4 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-900/80 border border-emerald-600/60 text-[11px] font-bold text-amber-300">
            <Lock className="w-3.5 h-3.5" />
            <span>Xác Thực Google Auth & Dữ Liệu Độc Lập</span>
          </div>
        </div>

        {/* Body Section */}
        <div className="p-6 sm:p-8 space-y-5">
          
          {/* Unauthorized Email Alert Case */}
          {unauthorizedEmail ? (
            <div className="bg-amber-50 dark:bg-amber-950/60 p-4 sm:p-5 rounded-2xl border-2 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-100 space-y-3">
              <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-300 font-black text-sm uppercase">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Chưa Được Cấp Quyền Truy Cập</span>
              </div>

              <p className="text-xs sm:text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                Tài khoản Email <strong className="text-amber-900 dark:text-amber-200 font-bold underline">{unauthorizedEmail}</strong> của bạn hiện chưa đăng ký chủ APP.
              </p>

              <div className="bg-white/80 dark:bg-gray-900/80 p-3 rounded-xl text-xs space-y-1.5 border border-amber-200/80 dark:border-amber-900">
                <div className="font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Quy trình cấp phép sử dụng:</span>
                </div>
                <ul className="list-disc pl-4 text-gray-600 dark:text-gray-400 space-y-1 text-[11px]">
                  <li>Mỗi Email đăng ký sẽ sở hữu <strong>1 dữ liệu vườn cạo hoàn toàn riêng biệt</strong>.</li>
                  <li>Email được cấp quyền phụ có thể xem sổ cạo của chủ vườn mà không sửa xóa được.</li>
                  <li>Vui lòng liên hệ Admin (<strong className="text-emerald-700 dark:text-emerald-400">0822.899.357</strong> hoặc email: <strong className="text-emerald-700 dark:text-emerald-400">tayninhdoimoi@gmail.com</strong>) để được cấp phép.</li>
                </ul>
              </div>

              {/* Request Access Button */}
              {requestSent ? (
                <div className="p-3 bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 text-emerald-900 dark:text-emerald-200 rounded-xl text-xs font-bold flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Đã gửi yêu cầu cấp quyền đến Admin! Vui lòng chờ Admin phê duyệt.</span>
                </div>
              ) : (
                <button
                  onClick={handleSendAccessRequest}
                  disabled={sendingRequest}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-amber-300" />
                  <span>{sendingRequest ? 'Đang gửi yêu cầu...' : '📩 Gửi Yêu Cầu Cấp Quyền Cho Admin'}</span>
                </button>
              )}

              <button
                onClick={onLogoutAndRetry}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <UserX className="w-4 h-4" />
                <span>Đăng Xuất & Chọn Email Khác</span>
              </button>
            </div>
          ) : (
            /* Standard Login Form */
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="font-bold text-gray-800 dark:text-white text-base">
                  Đăng Nhập Tài Khoản Google
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Vui lòng chọn tài khoản Google Email đã được Admin cấp quyền để truy cập nhật ký cạo mủ của bạn.
                </p>
              </div>

              {(authError || errorMsg) && (
                <div className="p-3 bg-red-50 dark:bg-red-950/80 text-red-800 dark:text-red-200 text-xs font-bold rounded-xl border border-red-200 dark:border-red-800 flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{authError || errorMsg}</span>
                </div>
              )}

              {/* Google Sign-in Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-2xl bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border-2 border-gray-200 dark:border-gray-600 shadow-md hover:shadow-lg active:scale-98 text-gray-800 dark:text-white font-bold text-sm transition flex items-center justify-center space-x-3 cursor-pointer group disabled:opacity-50"
              >
                {/* Google SVG Logo */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{loading ? 'Đang kết nối Google...' : 'Đăng nhập bằng Google Auth'}</span>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition" />
              </button>

              {/* Info Badges */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2 text-[11px] text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Dữ liệu lưu trữ an toàn trên Google Cloud Firestore</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Bảo mật dữ liệu riêng biệt cho từng người dùng</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3.5 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 text-center text-[11px] text-gray-500 font-medium">
          Chủ quản ứng dụng: <strong className="text-gray-700 dark:text-gray-300">Phạm Duy Ngôn</strong> • SĐT-Zalo 0822.899.357
        </div>

      </div>
    </div>
  );
};
