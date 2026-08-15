import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  Calendar, 
  CheckCircle,
  FileText,
  Share2,
  Check
} from 'lucide-react';
import { HarvestRecord, Settings } from '../types';
import { exportToExcel, exportToPDF, triggerPrint } from '../utils/export';
import { ShareModal } from './ShareModal';

interface ExportTabProps {
  records: HarvestRecord[];
  settings: Settings;
}

export const ExportTab: React.FC<ExportTabProps> = ({ records, settings }) => {
  const [exportMonth, setExportMonth] = useState<string>('ALL');
  const [exportYear, setExportYear] = useState<string>('ALL');
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  // Filter records for export
  const filteredRecords = records.filter((r) => {
    if (exportYear !== 'ALL' && !r.date.startsWith(exportYear)) return false;
    if (exportMonth !== 'ALL') {
      const m = parseInt(r.date.substring(5, 7), 10);
      if (m !== parseInt(exportMonth, 10)) return false;
    }
    return true;
  });

  const [exportNotification, setExportNotification] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);

  const notifyExport = (text: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setExportNotification({ type, text });
    setTimeout(() => setExportNotification(null), 4000);
  };

  const getRecordsToExport = (): HarvestRecord[] => {
    if (filteredRecords.length > 0) return filteredRecords;
    if (records.length > 0) return records;
    return [];
  };

  const handleExportExcel = async () => {
    if (records.length === 0) {
      notifyExport('⚠️ Chưa có dữ liệu nhật ký cạo mủ nào được lưu. Vui lòng thêm dữ liệu ở trang chủ trước khi xuất Excel!', 'warning');
      return;
    }
    const recs = getRecordsToExport();
    if (recs.length === 0) return;

    const title = `Bao_Cao_Mu_Cao_Su_${exportYear}_${exportMonth}`;
    await exportToExcel(recs, title, settings);
    notifyExport('✅ Đã khởi tạo tải file Excel (.xls) thành công! Kiểm tra thư mục Tải về trên thiết bị.', 'success');
  };

  const handleExportPDF = async () => {
    if (records.length === 0) {
      notifyExport('⚠️ Chưa có dữ liệu nhật ký cạo mủ nào được lưu. Vui lòng thêm dữ liệu ở trang chủ trước khi xuất PDF!', 'warning');
      return;
    }
    const recs = getRecordsToExport();
    if (recs.length === 0) return;

    setIsExportingPdf(true);
    try {
      const title = `BÁO CÁO CẠO MỦ CAO SU (${exportMonth === 'ALL' ? 'Tất cả các tháng' : 'Tháng ' + exportMonth}/${exportYear === 'ALL' ? 'Tất cả các năm' : exportYear})`;
      await exportToPDF(recs, settings, title);
      notifyExport('✅ Đã xuất file PDF thành công! File đã được tải về máy của bạn.', 'success');
    } catch (err) {
      console.error(err);
      notifyExport('Không thể tạo file PDF tự động. Vui lòng thử lại hoặc dùng nút In Báo Cáo.', 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleOpenShareModal = () => {
    if (records.length === 0) {
      notifyExport('⚠️ Chưa có dữ liệu nhật ký cạo mủ nào để chia sẻ!', 'warning');
      return;
    }
    const recs = getRecordsToExport();
    if (recs.length === 0) return;

    setIsShareModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 p-6 rounded-2xl text-white shadow-md">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-400 text-emerald-950 rounded-xl font-bold">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-wide">
              XUẤT BÁO CÁO & CHIA SẺ ZALO
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1">
              Tạo file PDF, Excel, in ấn hoặc gửi bảng doanh thu qua Zalo / Facebook
            </p>
          </div>
        </div>
      </div>

      {exportNotification && (
        <div className={`p-4 rounded-xl font-bold text-xs shadow-sm flex items-center space-x-2 animate-fade-in ${
          exportNotification.type === 'error' ? 'bg-red-100 dark:bg-red-950 text-red-900 dark:text-red-200 border border-red-300' :
          exportNotification.type === 'warning' ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300' :
          'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border border-emerald-300'
        }`}>
          <span>{exportNotification.text}</span>
        </div>
      )}

      {/* Filter Selection Panel */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-emerald-600" />
          <span>1. Chọn khoảng thời gian xuất báo cáo</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Tháng
            </label>
            <select
              value={exportMonth}
              onChange={(e) => setExportMonth(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">-- Tất cả 12 tháng --</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m.toString()}>
                  Tháng {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Năm
            </label>
            <select
              value={exportYear}
              onChange={(e) => setExportYear(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">-- Tất cả các năm --</option>
              {[2026, 2025, 2024, 2023].map((y) => (
                <option key={y} value={y.toString()}>
                  Năm {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3.5 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <span>Tìm thấy {filteredRecords.length} ngày cạo trong khoảng thời gian đã chọn.</span>
          <CheckCircle className="w-5 h-5 text-emerald-600" />
        </div>
      </div>

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Option 1: Share Zalo */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border-2 border-blue-500/50 dark:border-blue-500/70 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-600 transition">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold">
              <Share2 className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-black text-gray-900 dark:text-white">Chia Sẻ Doanh Thu Zalo</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Gửi ngay bảng tóm tắt doanh thu ngày / đợt cạo tới Zalo, Tin nhắn SMS hoặc Messenger bằng 1 chạm.
            </p>
          </div>

          <button
            onClick={handleOpenShareModal}
            id="export-share-zalo-btn"
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Gửi Báo Cáo Zalo / Messenger</span>
          </button>
        </div>

        {/* Option 2: PDF */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-500 transition">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 flex items-center justify-center font-bold">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-black text-gray-900 dark:text-white">Xuất File PDF (.pdf)</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Tạo tài liệu PDF đẹp mắt có khung bảng định dạng chuẩn sẵn sàng gửi qua Zalo, Email hoặc lưu trữ điện thoại.
            </p>
          </div>

          <button
            onClick={handleExportPDF}
            disabled={isExportingPdf}
            id="export-pdf-btn"
            className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isExportingPdf ? 'Đang tạo PDF...' : 'Tải File PDF'}</span>
          </button>
        </div>

        {/* Option 3: Excel */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-500 transition">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-black text-gray-900 dark:text-white">Xuất File Excel (.xlsx)</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Tải file bảng tính Excel đầy đủ các cột: Ngày, mủ độ, giá độ, tiền mủ độ, mủ chén, giá chén, tổng ngày và cộng dồn.
            </p>
          </div>

          <button
            onClick={handleExportExcel}
            id="export-excel-btn"
            className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Tải File Excel</span>
          </button>
        </div>

        {/* Option 4: Print */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-500 transition">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
              <Printer className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-black text-gray-900 dark:text-white">In Báo Cáo Trực Tiếp</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Mở giao diện máy in của trình duyệt để in trực tiếp ra giấy A4 hoặc lưu thành tài liệu in ấn.
            </p>
          </div>

          <button
            onClick={triggerPrint}
            id="export-print-btn"
            className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>In Báo Cáo</span>
          </button>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        records={filteredRecords}
        settings={settings}
        title={`BÁO CÁO DOANH THU (${exportMonth === 'ALL' ? 'Cả năm' : 'Tháng ' + exportMonth}/${exportYear})`}
      />
    </div>
  );
};
