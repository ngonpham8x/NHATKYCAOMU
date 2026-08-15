import React, { useState, useEffect } from 'react';
import { 
  Sprout, 
  Sun, 
  Moon, 
  Download, 
  Calendar, 
  Clock, 
  LogOut, 
  UserCheck, 
  ShieldCheck, 
  Eye, 
  ChevronDown,
  PanelLeft,
  Menu,
  BellRing,
  ShieldAlert,
  Monitor,
  Smartphone
} from 'lucide-react';
import { Settings } from '../types';
import { formatDateVN, getTodayDateStr } from '../utils/calculations';
import { UserProfile } from '../lib/firebase';

interface NavbarProps {
  settings: Settings;
  onUpdateSettings: (newSettings: Settings) => void;
  canInstallPWA?: boolean;
  onInstallPWA: () => void;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  activeViewingUserId: string;
  onChangeViewingUser: (userId: string) => void;
  onLogout: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  securityAlertsCount?: number;
  pendingRequestsCount?: number;
  onNavigateToTab?: (tab: string) => void;
  viewMode?: 'mobile' | 'desktop';
  onToggleViewMode?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  onUpdateSettings,
  canInstallPWA = false,
  onInstallPWA,
  currentUser,
  allUsers,
  activeViewingUserId,
  onChangeViewingUser,
  onLogout,
  isSidebarOpen,
  onToggleSidebar,
  securityAlertsCount = 0,
  pendingRequestsCount = 0,
  onNavigateToTab,
  viewMode = 'mobile',
  onToggleViewMode,
}) => {
  const isDark = settings.theme === 'dark';
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    onUpdateSettings({ ...settings, theme: nextTheme });
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const todayStr = getTodayDateStr();
  const isAdmin = currentUser.role === 'admin';
  const isViewingOther = activeViewingUserId !== currentUser.uid;

  const activeViewingUser = allUsers.find((u) => u.uid === activeViewingUserId) || currentUser;

  return (
    <header className="sticky top-0 z-30 bg-emerald-700 text-white shadow-md dark:bg-emerald-950 transition-colors border-b border-emerald-600 dark:border-emerald-800">
      
      {/* Admin Viewing Banner if viewing another user's workspace */}
      {isAdmin && isViewingOther && (
        <div className="bg-amber-400 text-emerald-950 text-xs font-black py-1 px-4 text-center flex items-center justify-center space-x-2 shadow-xs">
          <Eye className="w-4 h-4 text-emerald-900 shrink-0 animate-pulse" />
          <span>
            Đang xem nhật ký của: <strong>{activeViewingUser.displayName} ({activeViewingUser.email})</strong>. Bạn CHỈ CÓ QUYỀN XEM (Read-only), không thể chỉnh sửa hay xóa.
          </span>
          <button
            onClick={() => onChangeViewingUser(currentUser.uid)}
            className="ml-2 px-2 py-0.5 rounded bg-emerald-900 text-amber-300 font-extrabold hover:bg-emerald-800 cursor-pointer text-[10px]"
          >
            Quay về dữ liệu của tôi
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        
        {/* Logo & App Title & Mobile Menu Toggle */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              id="navbar-sidebar-toggle-btn"
              className="p-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-amber-300 border border-emerald-600/80 transition cursor-pointer flex items-center justify-center shadow-sm active:scale-95 shrink-0"
              title={isSidebarOpen ? 'Thu gọn / Đóng Menu' : 'Mở Menu'}
            >
              <Menu className="w-5 h-5 text-amber-300 shrink-0" />
            </button>
          )}

          <img 
            src="/logo.svg" 
            alt="Sổ Tay Cạo Mủ Logo" 
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl shadow-md border border-amber-300/80 object-contain shrink-0 bg-white p-0.5" 
          />
          <div>
            <h1 className="text-sm sm:text-lg font-black tracking-wide leading-tight uppercase font-sans">
              SỔ TAY CẠO MỦ
            </h1>
            <p className="text-[11px] text-emerald-100 dark:text-emerald-300 hidden sm:block font-medium">
              Chủ vườn: {settings.ownerName || currentUser.displayName} {isAdmin && '(Admin)'}
            </p>
          </div>
        </div>

        {/* Admin Workspace Selector Dropdown */}
        {isAdmin && allUsers.length > 0 && (
          <div className="hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-emerald-800/90 dark:bg-emerald-900 border border-emerald-500/50">
            <Eye className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="text-xs font-bold text-amber-200">Xem workspace:</span>
            <select
              value={activeViewingUserId}
              onChange={(e) => onChangeViewingUser(e.target.value)}
              className="bg-emerald-900 text-white font-bold text-xs py-1 px-2 rounded-lg border border-emerald-600 focus:outline-none cursor-pointer"
            >
              <option value={currentUser.uid}>👑 Tôi ({currentUser.displayName})</option>
              {allUsers
                .filter((u) => u.uid !== currentUser.uid)
                .map((u) => (
                  <option key={u.uid} value={u.uid}>
                    🌾 {u.displayName} ({u.email})
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Right Action Icons, User Profile & Live Clock Date Badge */}
        <div className="flex items-center space-x-2">
          
          {/* Admin Security Alerts / Access Requests Warning Button */}
          {isAdmin && (securityAlertsCount > 0 || pendingRequestsCount > 0) && (
            <button
              onClick={() => onNavigateToTab && onNavigateToTab('permissions')}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-md animate-pulse cursor-pointer border border-red-300 active:scale-95 transition"
              title="Cảnh báo an ninh: Có người đăng nhập trái phép hoặc yêu cầu truy cập!"
            >
              <ShieldAlert className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="hidden sm:inline">Cảnh báo:</span>
              <span className="bg-amber-400 text-red-950 px-1.5 py-0.2 rounded-full font-mono text-[11px]">
                {securityAlertsCount + pendingRequestsCount}
              </span>
            </button>
          )}


          {/* Today Date Badge */}
          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-800/80 dark:bg-emerald-900/90 text-emerald-100 text-xs font-bold border border-emerald-600/60">
            <Calendar className="w-3.5 h-3.5 text-amber-300" />
            <span>{formatDateVN(todayStr)}</span>
            {timeStr && (
              <span className="ml-1 pl-1.5 border-l border-emerald-600 text-amber-300 font-mono">
                {timeStr}
              </span>
            )}
          </div>

          {/* User Profile Info Badge */}
          <div className="flex items-center space-x-2 px-2 sm:px-3 py-1 rounded-xl bg-emerald-800/70 dark:bg-emerald-900/80 border border-emerald-600/50">
            <img 
              src={currentUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
              alt={currentUser.displayName}
              className="w-7 h-7 rounded-full object-cover border border-amber-300 shrink-0"
            />
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-white truncate max-w-[120px] leading-tight">
                {currentUser.displayName}
              </div>
              <div className="text-[10px] text-amber-300 font-semibold truncate max-w-[120px]">
                {isAdmin ? 'Quản Trị Viên' : 'Nông Dân'}
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 hover:bg-emerald-600 dark:hover:bg-emerald-800 rounded-lg text-amber-200 transition cursor-pointer ml-1"
              title="Đăng xuất khỏi tài khoản Google"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
