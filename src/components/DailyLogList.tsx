import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Calendar, 
  Edit2, 
  Trash2, 
  Eye, 
  Plus, 
  Filter, 
  X,
  FileSpreadsheet,
  Layers,
  Info
} from 'lucide-react';
import { HarvestRecord, Settings } from '../types';
import { 
  formatVND, 
  formatDateVN, 
  formatWeight, 
  formatDegree, 
  getCycleInfo 
} from '../utils/calculations';

interface DailyLogListProps {
  records: HarvestRecord[];
  settings?: Settings;
  onOpenAddModal: () => void;
  onOpenEditModal: (record: HarvestRecord) => void;
  onDeleteRecord: (id: string) => void;
}

export const DailyLogList: React.FC<DailyLogListProps> = ({
  records,
  settings,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteRecord,
}) => {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');

  // Selected Record for Detail View modal
  const [detailRecord, setDetailRecord] = useState<HarvestRecord | null>(null);

  // Extract available years and months from records
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    records.forEach((r) => {
      const yr = r.date.substring(0, 4);
      years.add(yr);
    });
    return Array.from(years).sort().reverse();
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Year filter
      if (selectedYear !== 'ALL' && !r.date.startsWith(selectedYear)) {
        return false;
      }
      // Month filter
      if (selectedMonth !== 'ALL') {
        const monthNum = parseInt(r.date.substring(5, 7), 10);
        if (monthNum !== parseInt(selectedMonth, 10)) {
          return false;
        }
      }
      // Search term (Date formatted, Note, or numbers)
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const dateVN = formatDateVN(r.date).toLowerCase();
        const noteText = (r.note || '').toLowerCase();
        return dateVN.includes(term) || noteText.includes(term) || r.date.includes(term);
      }
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date)); // Newest first
  }, [records, selectedYear, selectedMonth, searchTerm]);

  // Filter totals
  const totalFilteredMoney = filteredRecords.reduce((s, r) => s + r.dailyTotal, 0);
  const totalFilteredDegreeWeight = filteredRecords.reduce((s, r) => s + r.degreeLatex.weight, 0);
  const totalFilteredCupWeight = filteredRecords.reduce((s, r) => s + r.cupLatex.weight, 0);
  const totalFilteredScrapWeight = filteredRecords.reduce((s, r) => s + (r.scrapLatex?.weight || 0), 0);

  // Close detail view on ESC
  React.useEffect(() => {
    if (!detailRecord) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDetailRecord(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [detailRecord]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white flex items-center space-x-2">
            <span>DANH SÁCH NHẬT KÝ CẠO MỦ</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-1 rounded-full font-bold">
              {filteredRecords.length} ngày
            </span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Theo dõi từng ngày, tiền mủ độ, tiền mủ chén và cột cộng dồn tích lũy theo chu kỳ
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          id="log-list-add-new-btn"
          className="flex items-center justify-center space-x-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow-md transition"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>➕ Thêm Ngày Cạo</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo ngày (01/08/2026), ghi chú..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Month Filter */}
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="ALL">-- Tất cả các tháng --</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m.toString()}>
                Tháng {m}
              </option>
            ))}
          </select>
        </div>

        {/* Year Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-emerald-600 shrink-0" />
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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

      {/* Filter Summary Banner */}
      <div className="bg-emerald-900/90 text-white p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center space-x-2">
          <FileSpreadsheet className="w-4 h-4 text-amber-300" />
          <span className="font-bold">Tổng trong bộ lọc ({filteredRecords.length} ngày):</span>
        </div>
        <div className="flex items-center space-x-3 font-bold flex-wrap">
          <span>⚖️ Tổng mủ: <strong className="text-amber-300 font-black">{formatWeight(totalFilteredDegreeWeight + totalFilteredCupWeight + totalFilteredScrapWeight)}</strong></span>
          <span>•</span>
          <span>Mủ độ: <strong className="text-amber-300">{formatWeight(totalFilteredDegreeWeight)}</strong></span>
          <span>•</span>
          <span>Mủ chén: <strong className="text-amber-300">{formatWeight(totalFilteredCupWeight)}</strong></span>
          {totalFilteredScrapWeight > 0 && (
            <>
              <span>•</span>
              <span>Mủ tạp: <strong className="text-amber-300">{formatWeight(totalFilteredScrapWeight)}</strong></span>
            </>
          )}
          <span className="bg-amber-400 text-emerald-950 px-2.5 py-1 rounded-lg font-black text-sm">
            {formatVND(totalFilteredMoney)}
          </span>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 uppercase text-[11px] font-bold border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="py-3 px-3">Ngày</th>
                <th className="py-3 px-3">Kg mủ độ</th>
                <th className="py-3 px-3">Độ</th>
                <th className="py-3 px-3">Giá độ</th>
                <th className="py-3 px-3">Tiền mủ độ</th>
                <th className="py-3 px-3">Kg mủ chén</th>
                <th className="py-3 px-3">Giá chén</th>
                <th className="py-3 px-3">Tiền mủ chén</th>
                <th className="py-3 px-3">Kg mủ tạp</th>
                <th className="py-3 px-3">Tiền mủ tạp</th>
                <th className="py-3 px-3 text-emerald-800 dark:text-emerald-300 font-extrabold">
                  Tổng tiền ngày
                </th>
                <th className="py-3 px-3 text-emerald-900 dark:text-emerald-200 font-black bg-emerald-100 dark:bg-emerald-950 border-x border-emerald-200 dark:border-emerald-800">
                  Cộng dồn
                </th>
                <th className="py-3 px-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    Không tìm thấy dữ liệu nhật ký phù hợp.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const cycle = getCycleInfo(r.date, settings);
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-emerald-50/50 dark:hover:bg-gray-700/50 transition group"
                    >
                      <td className="py-3 px-3 font-bold text-gray-900 dark:text-white whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span>{formatDateVN(r.date)}</span>
                          {r.time && (
                            <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">
                              ⏰ {r.time}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-normal text-emerald-700 dark:text-emerald-400">
                          {cycle.cycleName}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-gray-800 dark:text-gray-200 font-medium">
                        {formatWeight(r.degreeLatex.weight)}
                      </td>
                      <td className="py-3 px-3 text-gray-800 dark:text-gray-200 font-medium">
                        {formatDegree(r.degreeLatex.degree)}
                      </td>
                      <td className="py-3 px-3 text-gray-600 dark:text-gray-400">
                        {formatVND(r.degreeLatex.pricePerDegree)}
                      </td>
                      <td className="py-3 px-3 font-bold text-gray-900 dark:text-gray-100">
                        {formatVND(r.degreeLatex.total)}
                      </td>
                      <td className="py-3 px-3 text-gray-800 dark:text-gray-200 font-medium">
                        {formatWeight(r.cupLatex.weight)}
                      </td>
                      <td className="py-3 px-3 text-gray-600 dark:text-gray-400">
                        {formatVND(r.cupLatex.pricePerKg)}
                      </td>
                      <td className="py-3 px-3 font-bold text-gray-900 dark:text-gray-100">
                        {formatVND(r.cupLatex.total)}
                      </td>
                      <td className="py-3 px-3 text-gray-800 dark:text-gray-200 font-medium">
                        {formatWeight(r.scrapLatex?.weight || 0)}
                      </td>
                      <td className="py-3 px-3 font-bold text-gray-900 dark:text-gray-100">
                        {formatVND(r.scrapLatex?.total || 0)}
                      </td>
                      <td className="py-3 px-3 font-black text-emerald-700 dark:text-emerald-400 text-base">
                        {formatVND(r.dailyTotal)}
                      </td>
                      <td className="py-3 px-3 font-black text-emerald-950 dark:text-emerald-200 bg-emerald-50/80 dark:bg-emerald-950/60 border-x border-emerald-200 dark:border-emerald-800 text-base whitespace-nowrap">
                        {formatVND(r.cumulativeTotal)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => setDetailRecord(r)}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg transition"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenEditModal(r)}
                            className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg transition"
                            title="Sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteRecord(r.id)}
                            className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/60 rounded-lg transition"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile / Tablet Cards View */}
      <div className="lg:hidden space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl text-center text-gray-500">
            Không tìm thấy nhật ký cạo.
          </div>
        ) : (
          filteredRecords.map((r) => {
            const cycle = getCycleInfo(r.date, settings);
            return (
              <div
                key={r.id}
                className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs space-y-3 relative"
              >
                {/* Card Top Header */}
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                    <span className="text-base font-black text-gray-900 dark:text-white">
                      {formatDateVN(r.date)}
                    </span>
                    <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-200 font-bold px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700/80">
                      🌳 {r.farmName || 'Vườn Cao Su'}
                    </span>
                    {r.time && (
                      <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 font-bold px-1.5 py-0.5 rounded font-mono">
                        ⏰ {r.time}
                      </span>
                    )}
                    <span className="text-[11px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                      {cycle.cycleName}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setDetailRecord(r)}
                      className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onOpenEditModal(r)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteRecord(r.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Card Main Breakdown Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-800">
                    <div className="font-bold text-emerald-900 dark:text-emerald-300 uppercase text-[10px]">
                      Mủ độ: {formatWeight(r.degreeLatex.weight)} ({formatDegree(r.degreeLatex.degree)})
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 mt-0.5">
                      Giá: {formatVND(r.degreeLatex.pricePerDegree)}/độ
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white mt-1">
                      = {formatVND(r.degreeLatex.total)}
                    </div>
                  </div>

                  <div className="bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-100 dark:border-amber-800">
                    <div className="font-bold text-amber-900 dark:text-amber-300 uppercase text-[10px]">
                      Mủ chén: {formatWeight(r.cupLatex.weight)}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 mt-0.5">
                      Giá: {formatVND(r.cupLatex.pricePerKg)}/kg
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white mt-1">
                      = {formatVND(r.cupLatex.total)}
                    </div>
                  </div>
                </div>

                {/* Card Footer Totals */}
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <div className="text-gray-500 text-[10px] uppercase font-bold">Tổng tiền ngày</div>
                    <div className="text-base font-black text-emerald-700 dark:text-emerald-400">
                      {formatVND(r.dailyTotal)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-emerald-800 dark:text-emerald-300 text-[10px] uppercase font-bold">
                      Cộng dồn chu kỳ
                    </div>
                    <div className="text-base font-black text-emerald-950 dark:text-emerald-200">
                      {formatVND(r.cumulativeTotal)}
                    </div>
                  </div>
                </div>

                {r.note && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                    Ghi chú: "{r.note}"
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Detail View Modal */}
      {detailRecord && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDetailRecord(null);
            }
          }}
          className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700 my-auto"
          >
            <div className="bg-emerald-700 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Chi tiết ngày {formatDateVN(detailRecord.date)}</h3>
              <button 
                type="button"
                onClick={() => setDetailRecord(null)} 
                className="w-8 h-8 rounded-lg bg-emerald-800 hover:bg-emerald-900 flex items-center justify-center text-amber-200 cursor-pointer"
                title="Đóng chi tiết (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs sm:text-sm">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl">
                <div className="font-bold text-emerald-900 dark:text-emerald-300">
                  {getCycleInfo(detailRecord.date, settings).cycleName}
                </div>
              </div>

              <div className="space-y-2 border-b border-gray-100 dark:border-gray-700 pb-3">
                <h4 className="font-bold text-gray-900 dark:text-white uppercase text-xs">Mủ độ (Mủ nước)</h4>
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span>Số lượng:</span>
                  <span className="font-bold">{formatWeight(detailRecord.degreeLatex.weight)}</span>
                </div>
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span>Độ mủ (TSC / DRC):</span>
                  <span className="font-bold">{formatDegree(detailRecord.degreeLatex.degree)}</span>
                </div>
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span>Đơn giá:</span>
                  <span className="font-bold">{formatVND(detailRecord.degreeLatex.pricePerDegree)} / độ / kg</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold pt-1">
                  <span>Thành tiền:</span>
                  <span>{formatVND(detailRecord.degreeLatex.total)}</span>
                </div>
              </div>

              <div className="space-y-2 border-b border-gray-100 dark:border-gray-700 pb-3">
                <h4 className="font-bold text-gray-900 dark:text-white uppercase text-xs">Mủ chén</h4>
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span>Số lượng:</span>
                  <span className="font-bold">{formatWeight(detailRecord.cupLatex.weight)}</span>
                </div>
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span>Đơn giá:</span>
                  <span className="font-bold">{formatVND(detailRecord.cupLatex.pricePerKg)} / kg</span>
                </div>
                <div className="flex justify-between text-amber-700 font-bold pt-1">
                  <span>Thành tiền:</span>
                  <span>{formatVND(detailRecord.cupLatex.total)}</span>
                </div>
              </div>

              {(detailRecord.scrapLatex?.weight || 0) > 0 && (
                <div className="space-y-2 border-b border-gray-100 dark:border-gray-700 pb-3">
                  <h4 className="font-bold text-gray-900 dark:text-white uppercase text-xs">Mủ tạp (Mủ dây / đông)</h4>
                  <div className="flex justify-between text-gray-700 dark:text-gray-300">
                    <span>Số lượng:</span>
                    <span className="font-bold">{formatWeight(detailRecord.scrapLatex?.weight)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700 dark:text-gray-300">
                    <span>Đơn giá:</span>
                    <span className="font-bold">{formatVND(detailRecord.scrapLatex?.pricePerKg)} / kg</span>
                  </div>
                  <div className="flex justify-between text-orange-700 font-bold pt-1">
                    <span>Thành tiền:</span>
                    <span>{formatVND(detailRecord.scrapLatex?.total)}</span>
                  </div>
                </div>
              )}

              <div className="bg-emerald-900 text-white p-3 rounded-xl space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Tổng tiền ngày:</span>
                  <span className="text-amber-300 text-base">{formatVND(detailRecord.dailyTotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-emerald-200">
                  <span>Cộng dồn chu kỳ:</span>
                  <span className="font-bold">{formatVND(detailRecord.cumulativeTotal)}</span>
                </div>
              </div>

              {detailRecord.note && (
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl text-xs text-gray-600 dark:text-gray-300">
                  <strong>Ghi chú:</strong> {detailRecord.note}
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900 text-right">
              <button
                onClick={() => setDetailRecord(null)}
                className="px-4 py-2 bg-emerald-700 text-white font-bold rounded-xl text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
