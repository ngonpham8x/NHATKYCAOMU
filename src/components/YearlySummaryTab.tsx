import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Award, 
  Scale, 
  Layers, 
  Banknote, 
  TrendingUp, 
  Calculator,
  ChevronDown,
  CheckCircle2
} from 'lucide-react';
import { HarvestRecord, CycleSummary, Settings } from '../types';
import { 
  summarizeCycles, 
  formatVND, 
  formatWeight, 
  formatDegree 
} from '../utils/calculations';

interface YearlySummaryTabProps {
  records: HarvestRecord[];
  settings?: Settings;
}

export const YearlySummaryTab: React.FC<YearlySummaryTabProps> = ({ records, settings }) => {
  // Available Years
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    records.forEach((r) => years.add(r.date.substring(0, 4)));
    const sorted = Array.from(years).sort().reverse();
    return sorted.length > 0 ? sorted : [new Date().getFullYear().toString()];
  }, [records]);

  const [selectedYear, setSelectedYear] = useState<string>(availableYears[0]);

  // All cycles for selected year
  const cyclesForYear = useMemo(() => {
    const allSummaries = summarizeCycles(records, settings);
    return allSummaries.filter((c) => c.year === parseInt(selectedYear, 10));
  }, [records, selectedYear, settings]);

  // Year aggregates
  const yearRecords = useMemo(() => {
    return records.filter((r) => r.date.startsWith(selectedYear));
  }, [records, selectedYear]);

  const totalYearMoney = yearRecords.reduce((s, r) => s + r.dailyTotal, 0);
  const totalTappingDays = yearRecords.length;
  const totalDegreeWeight = yearRecords.reduce((s, r) => s + r.degreeLatex.weight, 0);
  const totalDegreeMoney = yearRecords.reduce((s, r) => s + r.degreeLatex.total, 0);
  const totalCupWeight = yearRecords.reduce((s, r) => s + r.cupLatex.weight, 0);
  const totalCupMoney = yearRecords.reduce((s, r) => s + r.cupLatex.total, 0);
  const totalScrapWeight = yearRecords.reduce((s, r) => s + (r.scrapLatex?.weight || 0), 0);
  const totalScrapMoney = yearRecords.reduce((s, r) => s + (r.scrapLatex?.total || 0), 0);
  const totalCyclesCount = cyclesForYear.length;

  // Group cycles by Month (1 - 12)
  const monthGrouped = useMemo(() => {
    const map: { [month: number]: CycleSummary[] } = {};
    for (let m = 1; m <= 12; m++) {
      map[m] = [];
    }
    cyclesForYear.forEach((c) => {
      if (map[c.month]) {
        map[c.month].push(c);
      }
    });
    return map;
  }, [cyclesForYear]);

  // Active months count for averages
  const activeMonthsCount = Object.values(monthGrouped).filter((list: CycleSummary[]) => list.length > 0).length;

  const avgPerDay = totalTappingDays > 0 ? Math.round(totalYearMoney / totalTappingDays) : 0;
  const avgPerCycle = totalCyclesCount > 0 ? Math.round(totalYearMoney / totalCyclesCount) : 0;
  const avgPerMonth = activeMonthsCount > 0 ? Math.round(totalYearMoney / activeMonthsCount) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Year Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 to-teal-900 p-6 rounded-2xl text-white shadow-md">
        <div>
          <div className="inline-flex items-center space-x-1.5 bg-amber-400 text-emerald-950 px-3 py-1 rounded-full text-xs font-black uppercase mb-2">
            <Award className="w-4 h-4" />
            <span>TỔNG KẾT NĂM TOÀN DIỆN</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">
            BÁO CÁO TỔNG KẾT NĂM {selectedYear}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 mt-1">
            Tổng hợp dữ liệu mủ độ, mủ chén và thu nhập của 12 tháng trong năm {selectedYear}
          </p>
        </div>

        {/* Year Dropdown */}
        <div className="flex items-center space-x-2 bg-emerald-800/80 p-2 rounded-xl border border-emerald-600">
          <Calendar className="w-5 h-5 text-amber-300" />
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-transparent text-white font-black text-lg focus:outline-none cursor-pointer"
          >
            {availableYears.map((y) => (
              <option key={y} value={y} className="bg-emerald-900 text-white">
                Năm {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Money */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl border-2 border-emerald-500 shadow-xs">
          <div className="text-xs font-bold uppercase text-gray-400">Tổng tiền cả năm</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
            {formatVND(totalYearMoney)}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Toàn bộ năm {selectedYear}</p>
        </div>

        {/* Total Days & Cycles */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
          <div className="text-xs font-bold uppercase text-gray-400">Số chu kỳ & Ngày cạo</div>
          <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-1">
            {totalCyclesCount} <span className="text-xs font-medium text-gray-500">chu kỳ</span> / {totalTappingDays} <span className="text-xs font-medium text-gray-500">ngày</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Ghi nhận chính xác</p>
        </div>

        {/* Total Degree Latex */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
          <div className="text-xs font-bold uppercase text-gray-400">Tổng Mủ Độ (Mủ nước)</div>
          <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-1">
            {formatWeight(totalDegreeWeight)}
          </div>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold mt-1">
            = {formatVND(totalDegreeMoney)}
          </p>
        </div>

        {/* Total Cup Latex */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
          <div className="text-xs font-bold uppercase text-gray-400">Tổng Mủ Chén (Mủ tạp)</div>
          <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-1">
            {formatWeight(totalCupWeight)}
          </div>
          <p className="text-[11px] text-amber-700 dark:text-amber-400 font-bold mt-1">
            = {formatVND(totalCupMoney)}
          </p>
        </div>
      </div>

      {/* Averages Summary Grid */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-400 text-emerald-950 rounded-xl font-bold">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase text-amber-900 dark:text-amber-300">Trung bình / ngày</div>
            <div className="text-lg font-black text-emerald-900 dark:text-emerald-200">
              {formatVND(avgPerDay)}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-400 text-emerald-950 rounded-xl font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase text-amber-900 dark:text-amber-300">Trung bình / chu kỳ</div>
            <div className="text-lg font-black text-emerald-900 dark:text-emerald-200">
              {formatVND(avgPerCycle)}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-400 text-emerald-950 rounded-xl font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase text-amber-900 dark:text-amber-300">Trung bình / tháng</div>
            <div className="text-lg font-black text-emerald-900 dark:text-emerald-200">
              {formatVND(avgPerMonth)}
            </div>
          </div>
        </div>
      </div>

      {/* Month-by-Month Full Breakdown Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Bảng Tổng Hợp Chi Tiết 12 Tháng Năm {selectedYear}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Thống kê đợt 1, đợt 2, đợt 3 của từng tháng</p>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
            const monthCycles = monthGrouped[month].sort((a, b) => a.cycleNum - b.cycleNum);
            const monthTotal = monthCycles.reduce((s, c) => s + c.totalEarning, 0);
            const monthDegreeWeight = monthCycles.reduce((s, c) => s + c.totalDegreeWeight, 0);
            const monthCupWeight = monthCycles.reduce((s, c) => s + c.totalCupWeight, 0);
            const monthDays = monthCycles.reduce((s, c) => s + c.tappingDaysCount, 0);

            if (monthCycles.length === 0) {
              return (
                <div key={month} className="p-4 flex items-center justify-between text-xs text-gray-400">
                  <span className="font-bold">Tháng {month < 10 ? `0${month}` : month}</span>
                  <span>Chưa có dữ liệu cạo mủ</span>
                </div>
              );
            }

            return (
              <div key={month} className="p-4 sm:p-5 space-y-3 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition">
                {/* Month Summary Line */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="text-base font-black text-gray-900 dark:text-white">
                      Tháng {month < 10 ? `0${month}` : month} / {selectedYear}
                    </span>
                    <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                      {monthDays} ngày cạo
                    </span>
                  </div>

                  <div className="flex items-center space-x-4 text-xs font-bold">
                    <span>Mủ độ: {formatWeight(monthDegreeWeight)}</span>
                    <span>Mủ chén: {formatWeight(monthCupWeight)}</span>
                    <span className="text-base font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-lg">
                      {formatVND(monthTotal)}
                    </span>
                  </div>
                </div>

                {/* Cycles Breakdown Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                  {monthCycles.map((cycle) => (
                    <div
                      key={cycle.key}
                      className="p-2.5 rounded-xl border bg-emerald-50/40 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                    >
                      <div className="flex justify-between font-bold text-gray-700 dark:text-gray-300">
                        <span>Đợt {cycle.cycleNum} ({cycle.cycleName})</span>
                        <span>{cycle.tappingDaysCount} ngày</span>
                      </div>
                      <div className="text-sm font-black text-emerald-800 dark:text-emerald-300 mt-1">
                        {formatVND(cycle.totalEarning)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
