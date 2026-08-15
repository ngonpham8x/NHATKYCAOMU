import React, { useState, useMemo } from 'react';
import { 
  History, 
  Calendar, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Eye, 
  Layers, 
  Scale, 
  Banknote,
  CheckCircle2
} from 'lucide-react';
import { HarvestRecord, CycleSummary, Settings } from '../types';
import { 
  summarizeCycles, 
  formatVND, 
  formatWeight, 
  formatDateVN 
} from '../utils/calculations';

interface SavedCyclesTabProps {
  records: HarvestRecord[];
  settings?: Settings;
  onOpenAddModalWithDate?: (dateStr: string) => void;
  onOpenEditModal: (record: HarvestRecord) => void;
  onNavigateToTab?: (tab: any) => void;
}

export const SavedCyclesTab: React.FC<SavedCyclesTabProps> = ({
  records,
  settings,
  onOpenAddModalWithDate,
  onOpenEditModal,
  onNavigateToTab,
}) => {
  // Compute all cycles automatically based on configured settings
  const cycleSummaries = useMemo(() => {
    return summarizeCycles(records, settings);
  }, [records, settings]);

  // Expanded cycle state
  const [expandedKeys, setExpandedKeys] = useState<{ [key: string]: boolean }>({});

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Group cycles by Year -> Month
  const groupedByYearAndMonth = useMemo(() => {
    const map: { [year: number]: { [month: number]: CycleSummary[] } } = {};

    cycleSummaries.forEach((cycle) => {
      if (!map[cycle.year]) {
        map[cycle.year] = {};
      }
      if (!map[cycle.year][cycle.month]) {
        map[cycle.year][cycle.month] = [];
      }
      map[cycle.year][cycle.month].push(cycle);
    });

    return map;
  }, [cycleSummaries]);

  const yearsList = Object.keys(groupedByYearAndMonth)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 p-5 sm:p-6 rounded-2xl text-white shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-400 text-emerald-950 rounded-xl font-bold">
              <History className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wide">
                LƯU CHU KỲ TỰ ĐỘNG
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100 mt-0.5">
                Tự động nhóm đợt cạo và tính doanh thu. Dữ liệu được lưu vĩnh viễn không bị mất khi sang tháng mới.
              </p>
            </div>
          </div>

          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab('settings')}
              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs shadow-sm transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap shrink-0"
              title="Đổi loại chu kỳ tính tiền (10 ngày, 15 ngày, 30 ngày...)"
            >
              <span>⚙️ Cài đặt loại chu kỳ tính tiền</span>
            </button>
          )}
        </div>
      </div>

      {yearsList.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-12 rounded-2xl text-center space-y-3 border border-gray-100 dark:border-gray-700">
          <Layers className="w-12 h-12 text-emerald-500 mx-auto" />
          <p className="text-gray-600 dark:text-gray-300 font-medium">
            Chưa có chu kỳ nào được ghi nhận. Nhập ngày cạo để tự động tạo chu kỳ!
          </p>
        </div>
      ) : (
        yearsList.map((year) => {
          const monthsInYear = Object.keys(groupedByYearAndMonth[year])
            .map(Number)
            .sort((a, b) => b - a);

          const yearTotal = monthsInYear.reduce((sumY, m) => {
            return sumY + groupedByYearAndMonth[year][m].reduce((sumM, c) => sumM + c.totalEarning, 0);
          }, 0);

          return (
            <div key={year} className="space-y-4">
              {/* Year Header Badge */}
              <div className="flex items-center justify-between bg-emerald-950 text-white px-5 py-3 rounded-xl shadow-xs">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-amber-300" />
                  <span className="text-lg font-black tracking-wide">NĂM {year}</span>
                </div>
                <div className="text-sm font-bold text-amber-300">
                  Tổng năm: {formatVND(yearTotal)}
                </div>
              </div>

              {/* Months list */}
              {monthsInYear.map((month) => {
                const cyclesInMonth = groupedByYearAndMonth[year][month].sort(
                  (a, b) => a.cycleNum - b.cycleNum
                );

                const monthTotal = cyclesInMonth.reduce((s, c) => s + c.totalEarning, 0);

                return (
                  <div
                    key={`${year}-${month}`}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-xs space-y-3 p-4 sm:p-5"
                  >
                    {/* Month Header */}
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white flex items-center space-x-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          <span>Tháng {month < 10 ? `0${month}` : month} / {year}</span>
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Gồm {cyclesInMonth.length} đợt thu hoạch mủ
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-gray-400">
                          Tổng tháng {month}
                        </div>
                        <div className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                          {formatVND(monthTotal)}
                        </div>
                      </div>
                    </div>

                    {/* Cycle Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                      {cyclesInMonth.map((cycle) => {
                        const isExpanded = !!expandedKeys[cycle.key];

                        return (
                          <div
                            key={cycle.key}
                            className="bg-gray-50 dark:bg-gray-900/60 border border-emerald-200/80 dark:border-emerald-800/80 rounded-xl p-4 flex flex-col justify-between hover:border-emerald-500 transition space-y-3"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="inline-block px-2.5 py-1 bg-emerald-700 text-white text-xs font-black rounded-md uppercase">
                                  Đợt {cycle.cycleNum}
                                </span>
                                <div className="text-xs font-bold text-gray-600 dark:text-gray-300 mt-1">
                                  {cycle.cycleName}
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-base font-black text-emerald-800 dark:text-emerald-300">
                                  {formatVND(cycle.totalEarning)}
                                </div>
                                <div className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold">
                                  {cycle.tappingDaysCount} ngày cạo
                                </div>
                              </div>
                            </div>

                            {/* Cycle Details */}
                            <div className="grid grid-cols-2 gap-2 text-[11px] bg-white dark:bg-gray-800 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700">
                              <div>
                                <span className="text-gray-400">Mủ độ:</span>{' '}
                                <strong className="text-gray-800 dark:text-gray-200">{formatWeight(cycle.totalDegreeWeight)}</strong>
                              </div>
                              <div>
                                <span className="text-gray-400">Mủ chén:</span>{' '}
                                <strong className="text-gray-800 dark:text-gray-200">{formatWeight(cycle.totalCupWeight)}</strong>
                              </div>
                              {(cycle.totalScrapWeight || 0) > 0 && (
                                <div className="col-span-2">
                                  <span className="text-gray-400">Mủ tạp:</span>{' '}
                                  <strong className="text-amber-700 dark:text-amber-300">{formatWeight(cycle.totalScrapWeight)}</strong>
                                </div>
                              )}
                              <div className="col-span-2 text-emerald-700 dark:text-emerald-400 font-bold">
                                Trung bình: {formatVND(cycle.avgDailyEarning)}/ngày
                              </div>
                            </div>

                            {/* Expand / View Days Button */}
                            <button
                              onClick={() => toggleExpand(cycle.key)}
                              className="w-full flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 px-3 py-2 rounded-lg transition"
                            >
                              <span>
                                {isExpanded ? 'Ẩn danh sách ngày' : `Xem ${cycle.records.length} ngày trong đợt`}
                              </span>
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>

                            {/* Expanded Days Table */}
                            {isExpanded && (
                              <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2 text-xs">
                                {cycle.records.map((r) => (
                                  <div
                                    key={r.id}
                                    onClick={() => onOpenEditModal(r)}
                                    className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between hover:border-blue-400 cursor-pointer transition"
                                    title="Click để sửa ngày này"
                                  >
                                    <div>
                                      <div className="font-bold text-gray-900 dark:text-white">
                                        {formatDateVN(r.date)}
                                      </div>
                                      <div className="text-[10px] text-gray-500">
                                        Độ: {formatWeight(r.degreeLatex.weight)} | Chén: {formatWeight(r.cupLatex.weight)}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-black text-emerald-700 dark:text-emerald-400">
                                        {formatVND(r.dailyTotal)}
                                      </div>
                                      <div className="text-[10px] text-gray-500">
                                        Cộng dồn: {formatVND(r.cumulativeTotal)}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })
      )}
    </div>
  );
};
