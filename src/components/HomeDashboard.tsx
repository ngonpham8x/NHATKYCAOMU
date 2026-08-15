import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Banknote, 
  TrendingUp, 
  Calendar, 
  Award, 
  Clock, 
  ChevronRight, 
  Layers,
  Edit2,
  Trash2,
  Info,
  ExternalLink,
  Share2
} from 'lucide-react';
import { HarvestRecord, Settings } from '../types';
import { 
  formatVND, 
  formatDateVN, 
  formatWeight, 
  formatDegree, 
  getTodayDateStr, 
  getCycleInfo,
  getCyclesForMonth
} from '../utils/calculations';
import { MetricDetailModal } from './MetricDetailModal';

interface HomeDashboardProps {
  records: HarvestRecord[];
  settings: Settings;
  onOpenAddModal: (farmName?: string) => void;
  onOpenEditModal: (record: HarvestRecord) => void;
  onDeleteRecord: (id: string) => void;
  onNavigateToTab: (tab: any) => void;
  onUpdateSettings?: (newSettings: Settings) => void;
  onSetRecords?: (records: HarvestRecord[]) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  records,
  settings,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteRecord,
  onNavigateToTab,
  onUpdateSettings,
  onSetRecords,
}) => {
  const todayStr = getTodayDateStr();
  const todayObj = new Date();
  const currentYear = todayObj.getFullYear();
  const currentMonth = todayObj.getMonth() + 1; // 1-12

  // Modal detail config state
  const [detailModalConfig, setDetailModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    filterType: 'today' | 'cycle' | 'month' | 'year' | 'all';
  }>({
    isOpen: false,
    title: '',
    filterType: 'all',
  });

  // Get current cycle info
  const currentCycleInfo = getCycleInfo(todayStr, settings);

  // Today's Total
  const todayRecord = records.find((r) => r.date === todayStr);
  const todayRecords = todayRecord ? [todayRecord] : [];
  const todayTotal = todayRecord ? todayRecord.dailyTotal : 0;

  // Current Cycle Records
  const currentCycleRecords = records.filter((r) => {
    const cycle = getCycleInfo(r.date, settings);
    return cycle.key === currentCycleInfo.key;
  });

  // Current Cycle Cumulative Total
  const currentCycleTotal = currentCycleRecords.reduce((sum, r) => sum + r.dailyTotal, 0);

  // Previous Cycle Calculation
  let prevCycleYear = currentCycleInfo.year;
  let prevCycleMonth = currentCycleInfo.month;
  let prevCycleNum = currentCycleInfo.cycleNum - 1;
  
  if (prevCycleNum < 1) {
    prevCycleMonth -= 1;
    if (prevCycleMonth < 1) {
      prevCycleMonth = 12;
      prevCycleYear -= 1;
    }
    const prevMonthCycles = getCyclesForMonth(prevCycleYear, prevCycleMonth, settings);
    prevCycleNum = prevMonthCycles.length;
  }
  
  const pad = (n: number) => (isNaN(n) ? '01' : n < 10 ? `0${n}` : `${n}`);
  const prevCycleKey = `${prevCycleYear}-${pad(prevCycleMonth)}-C${prevCycleNum}`;

  const prevCycleRecords = records.filter((r) => {
    const cycle = getCycleInfo(r.date, settings);
    return cycle.key === prevCycleKey;
  });
  const prevCycleTotal = prevCycleRecords.reduce((sum, r) => sum + r.dailyTotal, 0);

  // Current Month Records & Total
  const currentMonthRecords = records.filter((r) => {
    const d = new Date(r.date + 'T00:00:00');
    return d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth;
  });
  const currentMonthTotal = currentMonthRecords.reduce((sum, r) => sum + r.dailyTotal, 0);

  // Current Year Records & Total
  const currentYearRecords = records.filter((r) => {
    const d = new Date(r.date + 'T00:00:00');
    return d.getFullYear() === currentYear;
  });
  const currentYearTotal = currentYearRecords.reduce((sum, r) => sum + r.dailyTotal, 0);

  // Total Tapping Days
  const totalDays = records.length;

  // Recent 7 entries
  const recentRecords = [...records]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);

  // Dynamic computation of active modal records so edits & deletions update instantly
  const activeModalRecords = useMemo(() => {
    switch (detailModalConfig.filterType) {
      case 'today':
        return todayRecords;
      case 'cycle':
        return currentCycleRecords;
      case 'month':
        return currentMonthRecords;
      case 'year':
        return currentYearRecords;
      case 'all':
      default:
        return records;
    }
  }, [detailModalConfig.filterType, records, todayRecords, currentCycleRecords, currentMonthRecords, currentYearRecords]);

  // Handlers for card click
  const openTodayDetail = () => {
    setDetailModalConfig({
      isOpen: true,
      title: `Chi Tiết Thu Nhập Hôm Nay (${formatDateVN(todayStr)})`,
      filterType: 'today',
    });
  };

  const openCycleDetail = () => {
    setDetailModalConfig({
      isOpen: true,
      title: `Chi Tiết Chu Kỳ Đợt Này (${currentCycleInfo.cycleName})`,
      filterType: 'cycle',
    });
  };

  const openMonthDetail = () => {
    setDetailModalConfig({
      isOpen: true,
      title: `Chi Tiết Thu Nhập Tháng ${currentMonth}/${currentYear}`,
      filterType: 'month',
    });
  };

  const openYearDetail = () => {
    setDetailModalConfig({
      isOpen: true,
      title: `Chi Tiết Thu Nhập Năm ${currentYear}`,
      filterType: 'year',
    });
  };

  const openAllDaysDetail = () => {
    setDetailModalConfig({
      isOpen: true,
      title: `Chi Tiết Tất Cả ${records.length} Ngày Cạo Trong Nhật Ký`,
      filterType: 'all',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Primary Action Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-15 pointer-events-none">
          <Banknote className="w-64 h-64 text-amber-200" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-emerald-900/60 backdrop-blur-xs px-3 py-1 rounded-full text-amber-300 text-xs font-bold mb-2 border border-emerald-600/50">
              <Layers className="w-3.5 h-3.5" />
              <span>{currentCycleInfo.cycleName}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Cộng dồn đợt này: {formatVND(currentCycleTotal)}
            </h2>
            <p className="text-emerald-100 text-sm mt-1 max-w-xl">
              Tự động tích lũy từ ngày 01, 11 hoặc 21 hằng tháng. Thống kê sản lượng mủ nước (mủ độ) & mủ chén chính xác.
            </p>
            {prevCycleTotal > 0 && (
              <div className="mt-3 flex items-center space-x-2 text-xs font-bold">
                <span className="bg-emerald-900/50 px-2 py-1 rounded-md text-emerald-200">
                  Chu kỳ trước: {formatVND(prevCycleTotal)}
                </span>
                {currentCycleTotal > prevCycleTotal ? (
                  <span className="text-amber-300 flex items-center space-x-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Tăng {formatVND(currentCycleTotal - prevCycleTotal)}</span>
                  </span>
                ) : currentCycleTotal < prevCycleTotal ? (
                  <span className="text-red-300 flex items-center space-x-1">
                    <TrendingUp className="w-3.5 h-3.5 rotate-180" />
                    <span>Giảm {formatVND(prevCycleTotal - currentCycleTotal)}</span>
                  </span>
                ) : null}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2 md:pt-0">
            <button
              onClick={onOpenAddModal}
              id="home-add-daily-entry-btn"
              className="flex items-center justify-center space-x-2 bg-amber-400 hover:bg-amber-300 active:scale-95 text-emerald-950 font-black px-6 py-3.5 rounded-xl text-base shadow-lg transition-transform focus:outline-none focus:ring-4 focus:ring-amber-300/50 cursor-pointer"
            >
              <Plus className="w-6 h-6 stroke-[3]" />
              <span>➕ Nhập Ngày Cạo Mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Metric Cards Grid (5 Summary Cards - Interactive Clickable) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Today's Total */}
        <div 
          onClick={openTodayDetail}
          className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-emerald-500 active:scale-98 transition cursor-pointer group"
          title="Nhấn để xem chi tiết dạng thẻ Mobile"
        >
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider group-hover:text-emerald-600 transition">Hôm nay</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400">
              {formatVND(todayTotal)}
            </div>
            <p className="text-xs text-gray-700 dark:text-gray-300 font-medium mt-1">
              {todayRecord ? `${formatWeight(todayRecord.degreeLatex.weight + todayRecord.cupLatex.weight)} tổng mủ` : 'Chưa nhập ngày hôm nay'}
            </p>
            <div className="mt-2 text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center space-x-1">
              <ExternalLink className="w-3 h-3" />
              <span>Xem chi tiết thẻ</span>
            </div>
          </div>
        </div>

        {/* Card 2: Current Cycle Cumulative Total */}
        <div 
          onClick={openCycleDetail}
          className="bg-white dark:bg-gray-800 p-4 rounded-2xl border-2 border-emerald-500/60 dark:border-emerald-500/80 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-emerald-600 active:scale-98 transition relative overflow-hidden cursor-pointer group"
          title="Nhấn để xem chi tiết dạng thẻ Mobile"
        >
          <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg uppercase">
            Cộng dồn
          </div>
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">Chu kỳ này</span>
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 group-hover:scale-110 transition">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-emerald-800 dark:text-emerald-300">
              {formatVND(currentCycleTotal)}
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold mt-1">
              {currentCycleRecords.length} ngày cạo trong đợt
            </p>
            <div className="mt-2 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center space-x-1">
              <ExternalLink className="w-3 h-3" />
              <span>Xem chi tiết thẻ đợt</span>
            </div>
          </div>
        </div>

        {/* Card 3: Month Total */}
        <div 
          onClick={openMonthDetail}
          className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-teal-500 active:scale-98 transition cursor-pointer group"
          title="Nhấn để xem chi tiết dạng thẻ Mobile"
        >
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider group-hover:text-teal-600 transition">Tháng {currentMonth}</span>
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
              {formatVND(currentMonthTotal)}
            </div>
            <p className="text-xs text-gray-700 dark:text-gray-300 font-medium mt-1">
              {currentMonthRecords.length} ngày cạo trong tháng
            </p>
            <div className="mt-2 text-[10px] font-bold text-teal-600 dark:text-teal-400 flex items-center space-x-1">
              <ExternalLink className="w-3 h-3" />
              <span>Xem chi tiết thẻ tháng</span>
            </div>
          </div>
        </div>

        {/* Card 4: Year Total */}
        <div 
          onClick={openYearDetail}
          className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-amber-500 active:scale-98 transition cursor-pointer group"
          title="Nhấn để xem chi tiết dạng thẻ Mobile"
        >
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider group-hover:text-amber-600 transition">Năm {currentYear}</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
              {formatVND(currentYearTotal)}
            </div>
            <p className="text-xs text-gray-700 dark:text-gray-300 font-medium mt-1">
              Tổng cả năm {currentYear}
            </p>
            <div className="mt-2 text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center space-x-1">
              <ExternalLink className="w-3 h-3" />
              <span>Xem chi tiết năm</span>
            </div>
          </div>
        </div>

        {/* Card 5: Total Tapping Days */}
        <div 
          onClick={openAllDaysDetail}
          className="col-span-2 md:col-span-1 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-blue-500 active:scale-98 transition cursor-pointer group"
          title="Nhấn để xem chi tiết dạng thẻ Mobile"
        >
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider group-hover:text-blue-600 transition">Số ngày cạo</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
              {totalDays} <span className="text-sm font-normal text-gray-700 dark:text-gray-300">ngày</span>
            </div>
            <p className="text-xs text-gray-700 dark:text-gray-300 font-medium mt-1">
              Đã ghi nhận trong nhật ký
            </p>
            <div className="mt-2 text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center space-x-1">
              <ExternalLink className="w-3 h-3" />
              <span>Xem tất cả thẻ ngày</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cycle Progress Explanation Banner */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 flex items-start space-x-3 text-amber-900 dark:text-amber-200 text-xs sm:text-sm">
        <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Quy tắc cộng dồn tự động: </span>
          {settings.paymentCycleType === 'fixed_15' ? (
            <span>Chu kỳ được tự động chia 2 đợt mỗi tháng: <strong>Đợt 1 (01-15)</strong> và <strong>Đợt 2 (16-cuối tháng)</strong>.</span>
          ) : settings.paymentCycleType === 'fixed_30' ? (
            <span>Chu kỳ được tự động tính gộp theo <strong>Toàn Bộ Tháng (01-cuối tháng)</strong>.</span>
          ) : settings.paymentCycleType === 'custom' ? (
            <span>Chu kỳ được tự động tính theo đợt tùy chỉnh <strong>{settings.paymentCycleDays || 10} ngày/đợt</strong>.</span>
          ) : (
            <span>Chu kỳ được tự động chia 3 đợt mỗi tháng: <strong>Đợt 1 (01-10)</strong>, <strong>Đợt 2 (11-20)</strong>, và <strong>Đợt 3 (21-cuối tháng)</strong>.</span>
          )}
          {' '}Cột <strong>Cộng dồn</strong> sẽ tự tích lũy tiền từng ngày trong chu kỳ và tự động bắt đầu lại từ ngày đầu của đợt mới.
        </div>
      </div>

      {/* Recent Records Table / Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <span>Nhật ký cạo gần đây</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                Mới nhất
              </span>
            </h3>
            <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">
              Tự động tính tổng tiền ngày & cột cộng dồn tích lũy
            </p>
          </div>

          <button
            onClick={() => onNavigateToTab('logs')}
            id="home-view-all-logs-btn"
            className="flex items-center space-x-1 text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 text-xs font-bold transition"
          >
            <span>Xem tất cả nhật ký</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {recentRecords.length === 0 ? (
          <div className="p-8 text-center text-gray-700 dark:text-gray-300 space-y-3">
            <p className="text-sm font-medium">Chưa có ngày cạo nào được ghi nhận.</p>
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center space-x-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl text-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Nhập ngày cạo đầu tiên</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-700 dark:text-gray-300 uppercase text-[11px] font-bold border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="py-3 px-3 sm:px-4">Ngày</th>
                  <th className="py-3 px-3 sm:px-4">Kg mủ độ</th>
                  <th className="py-3 px-3 sm:px-4">Độ</th>
                  <th className="py-3 px-3 sm:px-4">Tiền mủ độ</th>
                  <th className="py-3 px-3 sm:px-4">Kg mủ chén</th>
                  <th className="py-3 px-3 sm:px-4">Tiền mủ chén</th>
                  <th className="py-3 px-3 sm:px-4">Kg mủ tạp</th>
                  <th className="py-3 px-3 sm:px-4">Tiền mủ tạp</th>
                  <th className="py-3 px-3 sm:px-4">Tổng tiền ngày</th>
                  <th className="py-3 px-3 sm:px-4 text-emerald-800 dark:text-emerald-300 font-black bg-emerald-50 dark:bg-emerald-950/50">
                    Cộng dồn
                  </th>
                  <th className="py-3 px-3 sm:px-4 text-center">Sửa / Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {recentRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-emerald-50/50 dark:hover:bg-gray-700/50 transition">
                    <td className="py-3 px-3 sm:px-4 font-bold text-gray-900 dark:text-white whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <span>{formatDateVN(r.date)}</span>
                        {r.time && (
                          <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">
                            ⏰ {r.time}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-gray-700 dark:text-gray-300">
                      {formatWeight(r.degreeLatex.weight)}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-gray-700 dark:text-gray-300">
                      {formatDegree(r.degreeLatex.degree)}
                    </td>
                    <td className="py-3 px-3 sm:px-4 font-semibold text-gray-900 dark:text-gray-200">
                      {formatVND(r.degreeLatex.total)}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-gray-700 dark:text-gray-300">
                      {formatWeight(r.cupLatex.weight)}
                    </td>
                    <td className="py-3 px-3 sm:px-4 font-semibold text-gray-900 dark:text-gray-200">
                      {formatVND(r.cupLatex.total)}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-gray-700 dark:text-gray-300">
                      {formatWeight(r.scrapLatex?.weight || 0)}
                    </td>
                    <td className="py-3 px-3 sm:px-4 font-semibold text-gray-900 dark:text-gray-200">
                      {formatVND(r.scrapLatex?.total || 0)}
                    </td>
                    <td className="py-3 px-3 sm:px-4 font-black text-gray-900 dark:text-white text-emerald-700 dark:text-emerald-400">
                      {formatVND(r.dailyTotal)}
                    </td>
                    <td className="py-3 px-3 sm:px-4 font-black text-emerald-900 dark:text-emerald-200 bg-emerald-50/70 dark:bg-emerald-950/40 whitespace-nowrap">
                      {formatVND(r.cumulativeTotal)}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => onOpenEditModal(r)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition"
                          title="Sửa ngày cạo"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteRecord(r.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition"
                          title="Xóa ngày cạo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Metric Detail Modal for Mobile Card View */}
      <MetricDetailModal
        isOpen={detailModalConfig.isOpen}
        onClose={() => setDetailModalConfig((prev) => ({ ...prev, isOpen: false }))}
        title={detailModalConfig.title}
        records={activeModalRecords}
        settings={settings}
        onOpenEditModal={(record) => {
          setDetailModalConfig((prev) => ({ ...prev, isOpen: false }));
          onOpenEditModal(record);
        }}
        onDeleteRecord={onDeleteRecord}
        onOpenAddModal={(farmName) => {
          setDetailModalConfig((prev) => ({ ...prev, isOpen: false }));
          onOpenAddModal(farmName);
        }}
        onUpdateSettings={onUpdateSettings}
        onSetRecords={onSetRecords}
      />
    </div>
  );
};
