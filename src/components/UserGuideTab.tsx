import React from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  Layers, 
  FileText, 
  TrendingUp, 
  ShieldCheck, 
  Smartphone, 
  Download, 
  Sparkles,
  Calculator,
  Plus,
  Calendar,
  Lock,
  Eye,
  Trash2,
  FileSpreadsheet,
  AlertTriangle,
  Monitor,
  Check,
  Search,
  UserCheck
} from 'lucide-react';
import { UserProfile } from '../lib/firebase';
import { Settings } from '../types';
import { getCyclesForMonth, getCycleDescriptionShort, getCycleDescriptionFull } from '../utils/calculations';

interface UserGuideTabProps {
  currentUser?: UserProfile;
  settings?: Settings;
  onNavigateToTab?: (tab: string) => void;
}

export const UserGuideTab: React.FC<UserGuideTabProps> = ({ currentUser, settings, onNavigateToTab }) => {
  const isAdmin = currentUser?.role === 'admin';
  const isSubViewer = currentUser?.role === 'sub_viewer';

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const monthCycles = getCyclesForMonth(currentYear, currentMonth, settings);
  const cycleDescShort = getCycleDescriptionShort(settings);
  const cycleDescFull = getCycleDescriptionFull(settings);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Top Banner with Logo Image */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 p-6 sm:p-10 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start space-x-4">
            <img 
              src="/logo.svg" 
              alt="Sổ Tay Cạo Mủ Logo" 
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shadow-2xl border-2 border-amber-300 object-contain shrink-0 bg-white p-1" 
            />
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-400 text-emerald-950 font-black text-xs uppercase shadow-xs">
                <Sparkles className="w-4 h-4 text-emerald-900" />
                <span>Cẩm Nang Hướng Dẫn Sử Dụng Thực Tế</span>
              </div>
              <h1 className="text-xl sm:text-3xl font-black uppercase tracking-wide">
                SỔ TAY CẠO MỦ & QUẢN LÝ THU NHẬP
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl font-medium leading-relaxed">
                Hướng dẫn minh họa chi tiết từng bước bằng hình ảnh giao diện thực tế: Nhập ngày cạo mới, tính độ TSC, theo dõi chu kỳ cộng dồn, chuyển đổi giao diện di động/máy tính và xuất báo cáo PDF/Excel.
              </p>
            </div>
          </div>

          <div className="p-4 bg-emerald-950/80 rounded-2xl border border-emerald-600/60 shrink-0 text-center space-y-1">
            <div className="text-xs font-bold text-amber-300">Hỗ trợ kỹ thuật 24/7</div>
            <div className="text-lg font-black text-white">0822.899.357</div>
            <div className="text-[11px] text-emerald-200">Email: tayninhdoimoi@gmail.com</div>
          </div>
        </div>
      </div>

      {/* Dynamic Account Role Notice */}
      <div className={`p-5 rounded-2xl border-2 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
        isAdmin 
          ? 'bg-amber-50 dark:bg-amber-950/80 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-100'
          : isSubViewer
          ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-300 dark:border-blue-700 text-blue-950 dark:text-blue-100'
          : 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-100'
      }`}>
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl text-white font-bold shrink-0 ${
            isAdmin ? 'bg-amber-600' : isSubViewer ? 'bg-blue-600' : 'bg-emerald-600'
          }`}>
            {isAdmin ? <ShieldCheck className="w-6 h-6" /> : isSubViewer ? <Eye className="w-6 h-6" /> : <UserCheck className="w-6 h-6" />}
          </div>
          <div>
            <div className="font-extrabold text-sm uppercase flex items-center space-x-2">
              <span>Quyền Hạn Tài Khoản:</span>
              <span className={`px-2 py-0.5 rounded text-xs font-black ${
                isAdmin ? 'bg-amber-200 text-amber-950' : isSubViewer ? 'bg-blue-200 text-blue-950' : 'bg-emerald-200 text-emerald-950'
              }`}>
                {isAdmin ? '👑 ADMIN TỐI CAO' : isSubViewer ? '👁️ NGƯỜI XEM (READ-ONLY)' : '🌿 CHỦ VƯỜN'}
              </span>
            </div>
            <p className="text-xs opacity-90 mt-0.5">
              {isAdmin 
                ? 'Bạn có toàn quyền Quản trị: Duyệt/Thu hồi quyền email, tự động xuất Excel & sao lưu backup khi thu hồi, xem workspace tất cả tài khoản.'
                : isSubViewer
                ? 'Bạn được cấp quyền Xem (Read-only): Có thể theo dõi nhật ký, xem lịch sử chu kỳ và tải báo cáo PDF/Excel, nhưng không thể chỉnh sửa hay xóa.'
                : 'Bạn có quyền Chủ vườn: Toàn quyền nhập ngày cạo mới, chốt chu kỳ thanh toán, chỉnh sửa nhật ký và quản lý thu nhập.'}
            </p>
          </div>
        </div>

        {isAdmin && onNavigateToTab && (
          <button
            onClick={() => onNavigateToTab('permissions')}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-emerald-950 font-black text-xs shadow-md transition cursor-pointer shrink-0"
          >
            Quản Lý Phân Quyền Email
          </button>
        )}
      </div>

      {/* Quick Summary Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-emerald-100 dark:border-gray-700 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
            <Calculator className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">Tính Tiền Chuẩn Độ TSC</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">Tự động nhân kg mủ × độ TSC × đơn giá, chính xác tuyệt đối từng đồng.</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-emerald-100 dark:border-gray-700 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">Gộp Chu Kỳ & Tự Tích Lũy</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">Tự động chia đợt cạo ({monthCycles.map((c) => c.label).join(', ')}) và tự tích lũy tiền.</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-emerald-100 dark:border-gray-700 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold">
            <Monitor className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">Chuyển Giao Diện Di Động / Máy Tính</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">Nút 1 chạm trên Navbar đổi nhanh giữa giao diện điện thoại gọn nhẹ và máy tính full 13 cột.</p>
        </div>
      </div>

      {/* Step-by-Step Interactive App Manual */}
      <div className="space-y-8">
        <div className="flex items-center space-x-2 border-b border-gray-200 dark:border-gray-800 pb-3">
          <BookOpen className="w-6 h-6 text-emerald-600" />
          <h2 className="text-lg font-black uppercase text-gray-900 dark:text-white">
            QUY TRÌNH HƯỚNG DẪN CHI TIẾT THEO CHỦ ĐỀ
          </h2>
        </div>

        {/* STEP 1: ADDING DAILY HARVEST RECORD */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-md overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-0">
          <div className="md:col-span-5 bg-gradient-to-br from-emerald-950 to-teal-950 p-6 flex items-center justify-center border-b md:border-b-0 md:border-r border-emerald-800">
            {/* Real App UI Replica: Daily Entry Modal */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 w-full max-w-sm shadow-xl space-y-2.5 text-xs border border-emerald-500/30">
              <div className="text-center border-b border-gray-200 dark:border-gray-800 pb-2">
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-black text-[11px] uppercase">
                  ✍️ Biểu Mẫu Nhập Ngày Cạo Mới
                </span>
              </div>

              <div className="space-y-2 text-gray-800 dark:text-gray-200">
                <div className="bg-emerald-50 dark:bg-emerald-950 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <div className="font-bold text-[11px] text-emerald-800 dark:text-emerald-300 mb-1">💧 MỦ NƯỚC (Tính theo độ TSC):</div>
                  <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                    <div>Khối lượng: <strong className="text-emerald-700">25 kg</strong></div>
                    <div>Độ mủ: <strong className="text-emerald-700">38.5°</strong></div>
                    <div>Giá độ: <strong>510đ/độ</strong></div>
                  </div>
                  <div className="text-right font-black text-emerald-700 dark:text-emerald-400 mt-1">
                    = 490,875 VNĐ
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950 p-2 rounded-xl border border-amber-200 dark:border-amber-800">
                  <div className="font-bold text-[11px] text-amber-800 dark:text-amber-300 mb-1">🍵 MỦ CHÉN:</div>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    <div>Khối lượng: <strong className="text-amber-700">7 kg</strong></div>
                    <div>Đơn giá: <strong>27,000đ/kg</strong></div>
                  </div>
                  <div className="text-right font-black text-amber-700 dark:text-amber-400 mt-1">
                    = 189,000 VNĐ
                  </div>
                </div>

                <div className="bg-emerald-800 text-amber-300 p-2 rounded-xl text-center font-black text-xs shadow-xs">
                  TỔNG CỘNG NGÀY = 679,875 VNĐ
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-7 p-6 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="px-3 py-1 bg-emerald-800 text-amber-300 font-black text-xs rounded-full">
                BƯỚC 1
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white">
                Nhập Ngày Cạo Mới & Tự Động Tính Tiền
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Nhấn nút màu xanh <strong>"+ Nhập Ngày Cạo"</strong> ở màn hình Trang Chủ hoặc danh sách nhật ký. Bạn chỉ cần nhập số kg mủ nước, độ mủ (°), kg mủ chén và đơn giá — hệ thống tự động nhân chính xác số tiền mủ nước & mủ chén trong chớp mắt.
              </p>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/60 p-3.5 rounded-2xl border border-emerald-100 dark:border-emerald-900 space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
              <div className="font-black text-emerald-900 dark:text-emerald-300 uppercase text-[11px]">
                📌 Mẹo sử dụng:
              </div>
              <ul className="space-y-1">
                <li>• Có thể chọn Lô cạo (Lô A, Lô B...) và Giờ cạo để phân loại vườn.</li>
                <li>• Nếu cạo ngày nào chưa có độ mủ, bạn có thể lưu trước và bổ sung độ sau.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* STEP 2: CYCLE & AUTOMATIC CUMULATIVE ACCUMULATION */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-md overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-0">
          <div className="md:col-span-5 bg-gradient-to-br from-emerald-900 to-teal-900 p-6 flex items-center justify-center border-b md:border-b-0 md:border-r border-emerald-800">
            {/* Real App UI Replica: Cycle Rules & Cumulative Table */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 w-full max-w-sm shadow-xl space-y-2.5 text-xs border border-amber-400/50">
              <div className="font-black text-emerald-800 dark:text-emerald-300 text-xs border-b border-gray-200 dark:border-gray-800 pb-1.5 flex justify-between items-center">
                <span>📅 QUY TẮC CỘNG DỒN TỰ ĐỘNG</span>
                <span className="text-[10px] bg-amber-400 text-emerald-950 font-bold px-1.5 py-0.5 rounded">{cycleDescShort}</span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                {monthCycles.map((c, idx) => (
                  <div key={idx} className="flex justify-between items-center p-1.5 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
                    <span><strong>{c.label}</strong></span>
                    <span className="text-emerald-700 font-bold">Cộng dồn tự động</span>
                  </div>
                ))}
              </div>

              <div className="p-2 bg-amber-400 text-emerald-950 rounded-xl text-center font-black text-xs shadow-xs">
                Cột "Cộng dồn" tự reset về 0 ở ngày đầu đợt mới!
              </div>
            </div>
          </div>

          <div className="md:col-span-7 p-6 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="px-3 py-1 bg-emerald-800 text-amber-300 font-black text-xs rounded-full">
                BƯỚC 2
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white">
                {cycleDescShort} & Cột Cộng Dồn Tích Lũy
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Ứng dụng đang hoạt động theo: <strong>{cycleDescFull}</strong>. Cột <strong>Cộng dồn</strong> sẽ lũy kế tổng tiền của từng ngày cạo liên tiếp và tự động bắt đầu tính lại từ 0 khi sang ngày đầu tiên của đợt mới. Chủ vườn có thể đổi loại chu kỳ này bất cứ lúc nào trong menu Cài Đặt.
              </p>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/60 p-3.5 rounded-2xl border border-emerald-100 dark:border-emerald-900 space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
              <div className="font-black text-emerald-900 dark:text-emerald-300 uppercase text-[11px]">
                📌 Thanh toán vựa mủ:
              </div>
              <p>
                Khi nhận tiền thanh toán từ vựa mủ, bạn chỉ cần nhấn nút <strong>"Thanh Toán & Lưu Chu Kỳ"</strong> để chốt lưu số liệu vào lịch sử chu kỳ đã thanh toán.
              </p>
            </div>
          </div>
        </div>

        {/* STEP 3: MOBILE VS DESKTOP VIEW MODE TOGGLE */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-md overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-0">
          <div className="md:col-span-5 bg-gradient-to-br from-emerald-950 to-teal-950 p-6 flex items-center justify-center border-b md:border-b-0 md:border-r border-emerald-800">
            {/* Real App UI Replica: View Mode Switcher */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 w-full max-w-sm shadow-xl space-y-2.5 text-xs border border-amber-400/50">
              <div className="font-black text-emerald-800 dark:text-emerald-300 text-xs border-b border-gray-200 dark:border-gray-800 pb-1.5 flex justify-between items-center">
                <span>🖥️ CHUYỂN ĐỔI GIAO DIỆN MÀN HÌNH</span>
                <span className="px-2 py-0.5 bg-amber-400 text-emerald-950 rounded text-[9px] font-black">1 Chạm</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-[11px]">
                <div className="p-2.5 bg-amber-400 text-emerald-950 rounded-xl font-black shadow-xs flex flex-col items-center justify-center space-y-1">
                  <span>📱 Chế Độ Di Động</span>
                  <span className="text-[9px] font-normal opacity-90">Gọn nhẹ trên điện thoại</span>
                </div>
                <div className="p-2.5 bg-emerald-800 text-amber-300 rounded-xl font-black shadow-xs flex flex-col items-center justify-center space-y-1">
                  <span>🖥️ Chế Độ Máy Tính</span>
                  <span className="text-[9px] font-normal opacity-90">Mở rộng full 13 cột rộng rãi</span>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-7 p-6 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="px-3 py-1 bg-emerald-800 text-amber-300 font-black text-xs rounded-full">
                BƯỚC 3
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white">
                Nút Chuyển Đổi Giao Diện Di Động 📱 & Máy Tính 🖥️
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Trên thanh Menu Navbar ở đầu ứng dụng, nút màu vàng <strong>📱 Di Động / 🖥️ Máy Tính</strong> cho phép bạn dễ dàng linh hoạt đổi qua lại giữa giao diện rút gọn trên điện thoại hoặc mở rộng full bảng 13 cột như màn hình máy tính / tablet.
              </p>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/60 p-3.5 rounded-2xl border border-emerald-100 dark:border-emerald-900 space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
              <div className="font-black text-emerald-900 dark:text-emerald-300 uppercase text-[11px]">
                📌 Ưu điểm 2 giao diện:
              </div>
              <ul className="space-y-1">
                <li>• <strong>Giao diện Di động (Mobile)</strong>: Tối ưu nút bấm to, cuộn mượt bằng ngón tay khi ra vườn cạo mủ.</li>
                <li>• <strong>Giao diện Máy tính (Desktop/Tablet)</strong>: Khung hình tự động mở rộng hiển thị đầy đủ 13 cột thông tin cùng lúc mà không bị che khuất.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* STEP 4: PERMISSIONS & AUTO EXPORT / BACKUP UPON REVOKING ACCESS */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-md overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-0">
          <div className="md:col-span-5 bg-gradient-to-br from-emerald-950 to-teal-950 p-6 flex items-center justify-center border-b md:border-b-0 md:border-r border-emerald-800">
            {/* Real App UI Replica: Revoke Admin & PDF Export */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 w-full max-w-sm shadow-xl space-y-2.5 text-xs border border-red-500/40">
              <div className="p-2 bg-red-50 dark:bg-red-950/80 rounded-xl border border-red-300 text-red-900 dark:text-red-200 text-[11px] flex justify-between items-center font-bold">
                <span>👑 Quyền Admin / Cấp Nhầm Email</span>
                <span className="px-2 py-1 bg-red-600 text-white rounded-lg text-[10px] font-black shadow-xs">
                  🗑️ Xóa / Thu Hồi Quyền
                </span>
              </div>

              <div className="p-2 bg-emerald-50 dark:bg-emerald-950 rounded-xl border border-emerald-300 text-emerald-900 dark:text-emerald-200 text-[11px] flex justify-between items-center font-bold">
                <span>📄 Tự Động Xuất File Excel & Backup Snapshot</span>
                <span className="text-emerald-700 dark:text-emerald-300">Gửi về Email Chủ Vườn</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-7 p-6 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="px-3 py-1 bg-emerald-800 text-amber-300 font-black text-xs rounded-full">
                BƯỚC 4
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white">
                Xóa / Thu Hồi Quyền Truy Cập & Tự Động Tạo Báo Cáo Sao Lưu
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Khi Admin nhấn nút <strong>"Xóa / Thu Hồi Quyền Truy Cập"</strong> của bất kỳ email nào (bao gồm cả trường hợp cấp nhầm Admin), hệ thống ngay lập tức <strong>TỰ ĐỘNG XUẤT FILE EXCEL BÁO CÁO</strong> đầy đủ dữ liệu và <strong>TẠO BẢN SAO LƯU SNAPSHOT DATABASE</strong> bảo vệ an toàn cho chủ vườn.
              </p>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/60 p-3.5 rounded-2xl border border-emerald-100 dark:border-emerald-900 space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
              <div className="font-black text-emerald-900 dark:text-emerald-300 uppercase text-[11px]">
                📌 An toàn tuyệt đối:
              </div>
              <ul className="space-y-1">
                <li>• Nút <strong>Xóa Admin Tối Cao / Thu Hồi</strong> cho phép hủy quyền truy cập lập tức.</li>
                <li>• Toàn bộ lịch sử cạo mủ được tự động sao lưu vào tài khoản chủ vườn trước khi xóa.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* STEP 5: EXPORTING REPORTS (PDF A4 & EXCEL) */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-md overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-0">
          <div className="md:col-span-5 bg-gradient-to-br from-emerald-900 to-teal-900 p-6 flex items-center justify-center border-b md:border-b-0 md:border-r border-emerald-800">
            {/* Real App UI Replica: Export Formats */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 w-full max-w-sm shadow-xl space-y-2 text-xs">
              <div className="font-black text-emerald-800 dark:text-emerald-300 border-b border-gray-200 dark:border-gray-800 pb-1.5 text-center">
                📄 XUẤT BÁO CÁO THU NHẬP
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-[11px]">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 rounded-xl font-extrabold border border-emerald-300">
                  📊 File Excel (.XLSX)
                  <div className="text-[9px] font-normal opacity-80">Công thức nguyên gốc</div>
                </div>
                <div className="p-2 bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 rounded-xl font-extrabold border border-amber-300">
                  📄 Báo Cáo PDF A4
                  <div className="text-[9px] font-normal opacity-80">Trang trí chuẩn đẹp</div>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-7 p-6 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="px-3 py-1 bg-emerald-800 text-amber-300 font-black text-xs rounded-full">
                BƯỚC 5
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white">
                Xuất Báo Cáo PDF A4 Chuẩn & File Excel
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Vào Tab <strong>"Xuất Báo Cáo"</strong> để in hoặc lưu file PDF/Excel. Báo cáo PDF được thiết kế căn chỉnh lề khổ giấy A4 sang trọng, không trùng lặp đơn vị kg, có chỗ ký tên chủ vườn rõ ràng.
              </p>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/60 p-3.5 rounded-2xl border border-emerald-100 dark:border-emerald-900 space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
              <div className="font-black text-emerald-900 dark:text-emerald-300 uppercase text-[11px]">
                📌 Tiện lợi nộp vựa:
              </div>
              <p>
                File PDF in ra có thể nộp trực tiếp cho vựa mủ hoặc lưu trữ nội bộ gia đình rất rõ ràng.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
