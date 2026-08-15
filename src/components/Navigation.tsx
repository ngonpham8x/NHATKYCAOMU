import React from 'react';
import { 
  Home, 
  Layers,
  FileText, 
  History, 
  BarChart3, 
  CalendarRange, 
  FileSpreadsheet, 
  Settings as SettingsIcon,
  ShieldCheck,
  BookOpen,
  PanelLeftClose,
  PanelLeft,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ActiveTab } from '../types';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isAdmin?: boolean;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ 
  activeTab, 
  onTabChange, 
  isAdmin,
  isSidebarOpen,
  onToggleSidebar
}) => {
  const baseTabs: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Trang chủ', icon: Home },
    { id: 'cycle10', label: 'Chu kỳ', icon: Layers },
    { id: 'logs', label: 'Nhật ký cạo', icon: FileText },
    { id: 'cycles', label: 'Lưu chu kỳ', icon: History },
    { id: 'analytics', label: 'Thống kê', icon: BarChart3 },
    { id: 'yearly', label: 'Tổng kết năm', icon: CalendarRange },
    { id: 'export', label: 'Xuất báo cáo', icon: FileSpreadsheet },
    { id: 'guide', label: '📖 Hướng dẫn', icon: BookOpen },
    { id: 'settings', label: 'Cài đặt', icon: SettingsIcon },
  ];

  // ONLY Admin sees the Cấp Quyền tab ("chỉ admin mới thấy phần cấp quyền")
  const tabs = isAdmin 
    ? [...baseTabs, { id: 'permissions' as ActiveTab, label: '🔒 Cấp Quyền', icon: ShieldCheck }]
    : baseTabs;

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isSidebarOpen && (
        <div 
          onClick={onToggleSidebar}
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-xs z-40 animate-fade-in"
        />
      )}

      {/* Left Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 z-40 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col shadow-lg shrink-0 ${
          isSidebarOpen 
            ? 'w-64 translate-x-0' 
            : '-translate-x-full lg:translate-x-0 lg:w-16'
        }`}
      >
        {/* Sidebar Header with Hide/Show Toggle */}
        <div className="h-16 px-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-emerald-800 text-white dark:bg-emerald-950 shrink-0">
          <div className={`flex items-center space-x-2 transition-opacity ${!isSidebarOpen && 'lg:hidden'}`}>
            <span className="font-black text-xs tracking-wider uppercase text-amber-300">
              Menu Quản Lý
            </span>
          </div>

          {/* Desktop Chevron Toggle Button */}
          <button
            onClick={onToggleSidebar}
            id="sidebar-toggle-btn"
            className="hidden lg:flex p-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-amber-300 cursor-pointer transition items-center justify-center ml-auto"
            title={isSidebarOpen ? 'Thu gọn Menu (Tăng diện tích màn hình)' : 'Mở rộng Menu'}
          >
            {isSidebarOpen ? (
              <ChevronLeft className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>

          {/* Mobile Close Button (X icon, no arrow on mobile) */}
          <button
            onClick={onToggleSidebar}
            id="mobile-drawer-close-btn"
            className="lg:hidden p-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-amber-300 cursor-pointer transition flex items-center justify-center ml-auto"
            title="Đóng Menu"
          >
            <X className="w-5 h-5 text-amber-300" />
          </button>
        </div>

        {/* Sidebar Navigation Items */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1.5 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isPermissionsTab = tab.id === 'permissions';

            return (
              <button
                key={tab.id}
                id={`sidebar-tab-${tab.id}`}
                onClick={() => {
                  onTabChange(tab.id);
                  // Close drawer on mobile after selection
                  if (window.innerWidth < 1024) {
                    onToggleSidebar();
                  }
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  isActive
                    ? isPermissionsTab
                      ? 'bg-amber-400 text-emerald-950 font-black shadow-md'
                      : 'bg-emerald-700 text-white shadow-md dark:bg-emerald-600'
                    : isPermissionsTab
                      ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 hover:bg-amber-200'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-gray-800 hover:text-emerald-800'
                } ${!isSidebarOpen && 'lg:justify-center lg:px-0'}`}
                title={tab.label}
              >
                <Icon className={`w-5 h-5 shrink-0 ${
                  isActive 
                    ? (isPermissionsTab ? 'text-emerald-950' : 'text-amber-300') 
                    : (isPermissionsTab ? 'text-amber-600' : 'text-emerald-600 dark:text-emerald-400')
                }`} />

                <span className={`truncate text-left ${!isSidebarOpen && 'lg:hidden'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom Sidebar Collapse Toggle Helper Button (Desktop only) */}
        <div className="hidden lg:block p-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50">
          <button
            onClick={onToggleSidebar}
            className={`w-full flex items-center justify-center space-x-2 py-2 px-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition cursor-pointer ${
              !isSidebarOpen && 'lg:px-0'
            }`}
          >
            <PanelLeft className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className={`${!isSidebarOpen && 'lg:hidden'} truncate`}>
              {isSidebarOpen ? 'Thu gọn (Ẩn Menu)' : 'Mở rộng'}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};
