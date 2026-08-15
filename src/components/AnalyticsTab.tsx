import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart
} from 'recharts';
import { HarvestRecord, Settings } from '../types';
import { 
  formatVND, 
  formatDateVN, 
  summarizeCycles, 
  formatWeight,
  getCycleDescriptionShort
} from '../utils/calculations';
import { TrendingUp, BarChart3, Calculator, Award } from 'lucide-react';

interface AnalyticsTabProps {
  records: HarvestRecord[];
  settings?: Settings;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ records, settings }) => {
  const [selectedYear, setSelectedYear] = useState<string>('ALL');

  // Filter records by selected year if applicable
  const filteredRecords = useMemo(() => {
    if (selectedYear === 'ALL') return records;
    return records.filter((r) => r.date.startsWith(selectedYear));
  }, [records, selectedYear]);

  // Available years
  const availableYears = useMemo(() => {
    const setY = new Set<string>();
    records.forEach((r) => setY.add(r.date.substring(0, 4)));
    return Array.from(setY).sort().reverse();
  }, [records]);

  // 1. Daily Chart Data (Sorted ascending by date)
  const dailyChartData = useMemo(() => {
    return [...filteredRecords]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30) // Last 30 entries
      .map((r) => ({
        date: formatDateVN(r.date),
        'Tiền mủ độ': r.degreeLatex.total,
        'Tiền mủ chén': r.cupLatex.total,
        'Tổng ngày': r.dailyTotal,
        'Cộng dồn': r.cumulativeTotal || 0,
      }));
  }, [filteredRecords]);

  // 2. Cycle Chart Data
  const cycleSummaries = useMemo(() => {
    return summarizeCycles(filteredRecords, settings);
  }, [filteredRecords, settings]);

  const cycleChartData = useMemo(() => {
    return [...cycleSummaries]
      .reverse() // Chronological order
      .slice(-12) // Last 12 cycles
      .map((c) => ({
        name: `T${c.month}-Đ${c.cycleNum}`,
        fullName: c.cycleName,
        'Tổng tiền chu kỳ': c.totalEarning,
        'Số ngày cạo': c.tappingDaysCount,
        'Trung bình ngày': c.avgDailyEarning,
      }));
  }, [cycleSummaries]);

  // 3. Monthly Chart Data
  const monthlyChartData = useMemo(() => {
    const map: { [key: string]: { monthName: string; total: number; degree: number; cup: number; scrap: number; days: number } } = {};

    filteredRecords.forEach((r) => {
      const monthKey = r.date.substring(0, 7); // YYYY-MM
      const [y, m] = monthKey.split('-');
      const monthName = `Tháng ${parseInt(m, 10)}/${y}`;

      if (!map[monthKey]) {
        map[monthKey] = { monthName, total: 0, degree: 0, cup: 0, scrap: 0, days: 0 };
      }
      map[monthKey].total += r.dailyTotal;
      map[monthKey].degree += r.degreeLatex.total;
      map[monthKey].cup += r.cupLatex.total;
      map[monthKey].scrap += (r.scrapLatex?.total || 0);
      map[monthKey].days += 1;
    });

    return Object.keys(map)
      .sort()
      .map((key) => ({
        name: map[key].monthName,
        'Tổng doanh thu': map[key].total,
        'Mủ độ': map[key].degree,
        'Mủ chén': map[key].cup,
        'Mủ tạp': map[key].scrap,
        'Ngày cạo': map[key].days,
      }));
  }, [filteredRecords]);

  // Averages calculations
  const totalDays = filteredRecords.length;
  const totalMoney = filteredRecords.reduce((s, r) => s + r.dailyTotal, 0);
  const avgPerDay = totalDays > 0 ? Math.round(totalMoney / totalDays) : 0;

  const totalCycles = cycleSummaries.length;
  const avgPerCycle = totalCycles > 0 ? Math.round(totalMoney / totalCycles) : 0;

  const totalMonths = monthlyChartData.length;
  const avgPerMonth = totalMonths > 0 ? Math.round(totalMoney / totalMonths) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Year Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
            <span>THỐNG KÊ & BIỂU ĐỒ DOANH THU</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Phân tích trực quan xu hướng thu nhập theo ngày, cộng dồn chu kỳ và các tháng
          </p>
        </div>

        {/* Year Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Lọc năm:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">-- Tất cả các năm --</option>
            {availableYears.map((y) => (
              <option key={y} value={y}>
                Năm {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Averages Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-800 to-emerald-900 text-white p-5 rounded-2xl shadow-sm space-y-1">
          <div className="text-xs uppercase font-bold text-emerald-200">Trung bình tiền / ngày</div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300">
            {formatVND(avgPerDay)}
          </div>
          <div className="text-[11px] text-emerald-100">Tính trên {totalDays} ngày cạo</div>
        </div>

        <div className="bg-gradient-to-br from-teal-800 to-teal-900 text-white p-5 rounded-2xl shadow-sm space-y-1">
          <div className="text-xs uppercase font-bold text-teal-200">Trung bình tiền / chu kỳ</div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300">
            {formatVND(avgPerCycle)}
          </div>
          <div className="text-[11px] text-teal-100">Tính trên {totalCycles} đợt chu kỳ</div>
        </div>

        <div className="bg-gradient-to-br from-amber-800 to-emerald-950 text-white p-5 rounded-2xl shadow-sm space-y-1">
          <div className="text-xs uppercase font-bold text-amber-200">Trung bình tiền / tháng</div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300">
            {formatVND(avgPerMonth)}
          </div>
          <div className="text-[11px] text-emerald-100">Tính trên {totalMonths} tháng</div>
        </div>
      </div>

      {/* Empty State Warning */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400 space-y-2">
          <BarChart3 className="w-10 h-10 text-gray-400 mx-auto opacity-50" />
          <p className="font-bold text-sm text-gray-700 dark:text-gray-300">Chưa có dữ liệu nhật ký cạo mủ</p>
          <p className="text-xs">Hãy thêm nhật ký cạo mủ hằng ngày để hệ thống tự động vẽ biểu đồ phân tích doanh thu.</p>
        </div>
      ) : (
        <>
          {/* Chart 1: Biểu đồ cộng dồn trong chu kỳ */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <span>Biểu đồ tiền theo ngày & Tích lũy cộng dồn</span>
                </h3>
                <p className="text-xs text-gray-500">Cột: Tổng ngày | Đường: Cộng dồn tích lũy</p>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <ComposedChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: any) => formatVND(Number(value) || 0)} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="Cộng dồn" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
                  <Bar dataKey="Tổng ngày" fill="#047857" radius={[4, 4, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Biểu đồ theo chu kỳ */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-amber-600" />
                  <span>So sánh tổng tiền giữa các chu kỳ ({getCycleDescriptionShort(settings)})</span>
                </h3>
                <p className="text-xs text-gray-500">Doanh thu thu hoạch từng đợt chu kỳ cạo</p>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={cycleChartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: any) => formatVND(Number(value) || 0)} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Tổng tiền chu kỳ" fill="#d97706" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Trung bình ngày" fill="#059669" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Biểu đồ theo tháng */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                  <Calculator className="w-5 h-5 text-teal-600" />
                  <span>Tổng doanh thu phân bổ theo Tháng (Mủ độ vs Mủ chén)</span>
                </h3>
                <p className="text-xs text-gray-500">Doanh thu từng tháng</p>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: any) => formatVND(Number(value) || 0)} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Mủ độ" stackId="a" fill="#047857" />
                  <Bar dataKey="Mủ chén" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="Mủ tạp" stackId="a" fill="#ea580c" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
