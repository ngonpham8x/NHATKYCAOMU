import React, { useState, useEffect } from 'react';
import { 
  X, 
  Share2, 
  FileText, 
  FileSpreadsheet, 
  Calendar, 
  Clock, 
  Edit2, 
  Trash2, 
  Check, 
  Copy, 
  Droplet, 
  Coffee,
  Send,
  Plus,
  ChevronDown,
  Trees,
  Pencil
} from 'lucide-react';
import { HarvestRecord, Settings } from '../types';
import { formatDateVN, formatVND, formatWeight, formatDegree, getCycleInfo } from '../utils/calculations';
import { hasMultipleActualFarms } from '../utils/farmDisplay';
import { ShareModal } from './ShareModal';
import { ConfirmModal } from './ConfirmModal';

interface MetricDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  records: HarvestRecord[];
  settings: Settings;
  onOpenEditModal: (record: HarvestRecord) => void;
  onDeleteRecord: (id: string) => void;
  onOpenAddModal?: (farmName?: string) => void;
  onUpdateSettings?: (newSettings: Settings) => void;
  onSetRecords?: (records: HarvestRecord[]) => void;
}

export const MetricDetailModal: React.FC<MetricDetailModalProps> = ({
  isOpen,
  onClose,
  title,
  records,
  settings,
  onOpenEditModal,
  onDeleteRecord,
  onOpenAddModal,
  onUpdateSettings,
  onSetRecords,
}) => {
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isAddingCustomFarm, setIsAddingCustomFarm] = useState<boolean>(false);
  const [customFarmInput, setCustomFarmInput] = useState<string>('');

  const [editFarmError, setEditFarmError] = useState<string>('');

  const [editingFarm, setEditingFarm] = useState<{
    isOpen: boolean;
    oldName: string;
    newName: string;
    updateHistoricalRecords: boolean;
  }>({
    isOpen: false,
    oldName: '',
    newName: '',
    updateHistoricalRecords: true,
  });

  const [deletingFarmConfirm, setDeletingFarmConfirm] = useState<{
    isOpen: boolean;
    farmName: string;
  }>({
    isOpen: false,
    farmName: '',
  });

  const [shareModalConfig, setShareModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    records: HarvestRecord[];
  }>({
    isOpen: false,
    title: '',
    records: [],
  });

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const savedFarmsList = settings.farmsList || [];

  // Calculate totals for modal summary
  const totalDegreeWeight = records.reduce((s, r) => s + r.degreeLatex.weight, 0);
  const totalDegreeMoney = records.reduce((s, r) => s + r.degreeLatex.total, 0);
  const totalCupWeight = records.reduce((s, r) => s + r.cupLatex.weight, 0);
  const totalCupMoney = records.reduce((s, r) => s + r.cupLatex.total, 0);
  const totalScrapWeight = records.reduce((s, r) => s + (r.scrapLatex?.weight || 0), 0);
  const totalScrapMoney = records.reduce((s, r) => s + (r.scrapLatex?.total || 0), 0);
  const totalMoney = records.reduce((s, r) => s + r.dailyTotal, 0);

  // Average degree
  const recordsWithDegree = records.filter((r) => r.degreeLatex.degree > 0);
  const avgDegree = recordsWithDegree.length > 0
    ? recordsWithDegree.reduce((s, r) => s + r.degreeLatex.degree, 0) / recordsWithDegree.length
    : 0;

  // Group records by farm/garden for per-farm summary
  const farmSummaryMap = new Map<string, {
    farmName: string;
    count: number;
    degreeWeight: number;
    degreeMoney: number;
    cupWeight: number;
    cupMoney: number;
    scrapWeight: number;
    scrapMoney: number;
    totalMoney: number;
  }>();

  records.forEach((r) => {
    const farm = r.farmName || settings.rubberFieldName || '—';
    const existing = farmSummaryMap.get(farm) || {
      farmName: farm,
      count: 0,
      degreeWeight: 0,
      degreeMoney: 0,
      cupWeight: 0,
      cupMoney: 0,
      scrapWeight: 0,
      scrapMoney: 0,
      totalMoney: 0,
    };

    existing.count += 1;
    existing.degreeWeight += r.degreeLatex.weight;
    existing.degreeMoney += r.degreeLatex.total;
    existing.cupWeight += r.cupLatex.weight;
    existing.cupMoney += r.cupLatex.total;
    existing.scrapWeight += r.scrapLatex?.weight || 0;
    existing.scrapMoney += r.scrapLatex?.total || 0;
    existing.totalMoney += r.dailyTotal;

    farmSummaryMap.set(farm, existing);
  });

  const farmSummaries = Array.from(farmSummaryMap.values());

  const shouldShowFarmBreakdown = hasMultipleActualFarms(records, settings);

  const sortedRecords = [...records].sort((a, b) => b.date.localeCompare(a.date));

  const handleSaveAndSelectCustomFarm = () => {
    const trimmed = customFarmInput.trim();
    if (!trimmed) return;
    if (!savedFarmsList.includes(trimmed)) {
      const updatedList = [...savedFarmsList, trimmed];
      if (onUpdateSettings) {
        onUpdateSettings({
          ...settings,
          farmsList: updatedList,
        });
      }
    }
    setIsDropdownOpen(false);
    setIsAddingCustomFarm(false);
    setCustomFarmInput('');
    onClose();
    if (onOpenAddModal) {
      onOpenAddModal(trimmed);
    }
  };

  const handleSaveEditFarm = () => {
    const cleanNew = editingFarm.newName.trim();
    if (!cleanNew) {
      setEditFarmError('Tên vườn/thợ cạo không được để trống!');
      return;
    }

    if (cleanNew !== editingFarm.oldName && savedFarmsList.includes(cleanNew)) {
      setEditFarmError('Tên vườn hoặc thợ cạo này đã có trong danh sách!');
      return;
    }

    setEditFarmError('');
    const updatedList = savedFarmsList.map((f) => (f === editingFarm.oldName ? cleanNew : f));
    if (onUpdateSettings) {
      onUpdateSettings({
        ...settings,
        farmsList: updatedList,
      });
    }

    // Update historical records if checked
    if (editingFarm.updateHistoricalRecords && records && records.length > 0 && onSetRecords) {
      const updatedRecords = records.map((r) => {
        if (r.farmName === editingFarm.oldName) {
          return { ...r, farmName: cleanNew };
        }
        return r;
      });
      onSetRecords(updatedRecords);
    }

    setEditingFarm({ isOpen: false, oldName: '', newName: '', updateHistoricalRecords: true });
  };

  const handleConfirmDeleteFarm = () => {
    const nameToRemove = deletingFarmConfirm.farmName;
    if (savedFarmsList.length <= 1) {
      setDeletingFarmConfirm({ isOpen: false, farmName: '' });
      return;
    }
    const updated = savedFarmsList.filter((f) => f !== nameToRemove);
    if (onUpdateSettings) {
      onUpdateSettings({
        ...settings,
        farmsList: updated,
      });
    }
    setDeletingFarmConfirm({ isOpen: false, farmName: '' });
  };

  // Share overall summary
  const handleShareSummary = () => {
    setShareModalConfig({
      isOpen: true,
      title: title,
      records: records,
    });
  };

  // Share single record card
  const handleShareSingleRecord = (r: HarvestRecord) => {
    setShareModalConfig({
      isOpen: true,
      title: `BÁO CÁO NGÀY ${formatDateVN(r.date)}`,
      records: [r],
    });
  };

  // Export PDF
  const handleExportPDF = async () => {
    setIsExportingPdf(true);
    try {
      const { exportToPDF } = await import('../utils/export');
      await exportToPDF(records, settings, title);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Export Excel
  const handleExportExcel = async () => {
    const { exportToExcel } = await import('../utils/export');
    await exportToExcel(records, title.replace(/[^a-zA-Z0-9]/g, '_'), settings);
  };

  return (
    <div 
      id="metric-detail-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-2xl shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col max-h-[92vh] overflow-hidden my-auto"
      >
        
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-400 text-emerald-950 rounded-2xl font-black">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black tracking-wide leading-tight uppercase">
                {title}
              </h3>
              <p className="text-xs text-emerald-100 font-medium">
                {records.length} ngày cạo trong danh sách • Chi tiết dạng thẻ Mobile
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-metric-detail-modal"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-10 h-10 rounded-full bg-emerald-950/60 hover:bg-emerald-900 active:scale-95 text-amber-300 transition flex items-center justify-center focus:outline-none cursor-pointer shadow-xs"
            title="Đóng chi tiết (ESC)"
            aria-label="Đóng chi tiết"
          >
            <X className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Scrollable Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          
          {/* Summary Box Header */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/60 dark:to-gray-900 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-200/60 dark:border-emerald-800 pb-2">
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
                Tổng Quan Danh Sách Đang Xem
              </span>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-700 text-white">
                {records.length} ngày
              </span>
            </div>

            {/* Featured Total Rubber Output (Tổng Sản Lượng Mủ) Banner */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm border border-emerald-700">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black text-xl shrink-0 shadow-xs">
                  ⚖️
                </div>
                <div>
                  <span className="text-[10px] text-emerald-200 uppercase font-black tracking-wider block">
                    TỔNG SẢN LƯỢNG MỦ (ĐỘ + CHÉN + TẠP)
                  </span>
                  <span className="text-xl font-black text-amber-300 tracking-tight">
                    {formatWeight(totalDegreeWeight + totalCupWeight + totalScrapWeight)}
                  </span>
                </div>
              </div>
              <div className="text-left sm:text-right text-xs text-emerald-100 font-bold space-x-3 sm:space-x-0 sm:space-y-0.5 border-t sm:border-t-0 pt-1.5 sm:pt-0 border-emerald-700/60 flex sm:block flex-wrap">
                <div>💧 Mủ nước (độ): <strong className="text-white">{formatWeight(totalDegreeWeight)}</strong> ({formatVND(totalDegreeMoney)})</div>
                <div>🍵 Mủ chén: <strong className="text-amber-200">{formatWeight(totalCupWeight)}</strong> ({formatVND(totalCupMoney)})</div>
                <div>🍂 Mủ tạp: <strong className="text-amber-300">{formatWeight(totalScrapWeight)}</strong> ({formatVND(totalScrapMoney)})</div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
              <div className="bg-white dark:bg-gray-800 p-2 rounded-xl border border-emerald-100 dark:border-gray-700">
                <div className="text-[10px] text-gray-500 font-bold uppercase">Tổng Thu Nhập</div>
                <div className="text-sm sm:text-base font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {formatVND(totalMoney)}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-2 rounded-xl border border-emerald-100 dark:border-gray-700">
                <div className="text-[10px] text-gray-500 font-bold uppercase">Mủ Độ (Nước)</div>
                <div className="text-xs font-extrabold text-gray-900 dark:text-white mt-0.5">
                  {formatWeight(totalDegreeWeight)}
                </div>
                <div className="text-[9px] text-emerald-700 dark:text-emerald-400 font-bold">
                  {formatVND(totalDegreeMoney)}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-2 rounded-xl border border-emerald-100 dark:border-gray-700">
                <div className="text-[10px] text-gray-500 font-bold uppercase">Mủ Chén</div>
                <div className="text-xs font-extrabold text-amber-900 dark:text-amber-400 mt-0.5">
                  {formatWeight(totalCupWeight)}
                </div>
                <div className="text-[9px] text-amber-800 dark:text-amber-400 font-bold">
                  {formatVND(totalCupMoney)}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-2 rounded-xl border border-emerald-100 dark:border-gray-700">
                <div className="text-[10px] text-gray-500 font-bold uppercase">Mủ Tạp</div>
                <div className="text-xs font-extrabold text-amber-800 dark:text-amber-300 mt-0.5">
                  {formatWeight(totalScrapWeight)}
                </div>
                <div className="text-[9px] text-amber-700 dark:text-amber-300 font-bold">
                  {formatVND(totalScrapMoney)}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-2 rounded-xl border border-emerald-100 dark:border-gray-700 col-span-2 sm:col-span-1">
                <div className="text-[10px] text-gray-500 font-bold uppercase">Độ TSC TB</div>
                <div className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 mt-0.5">
                  {avgDegree > 0 ? `${formatDegree(avgDegree)}°` : '-'}
                </div>
              </div>
            </div>

            {/* Breakdown per farm */}
            {/* A single real farm may still have a worker label in records.
                Show this block only when there are at least two real farms. */}
            {shouldShowFarmBreakdown && (
              <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-2 text-left shadow-2xs">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-1.5">
                  <span className="text-[11px] font-black text-emerald-950 dark:text-emerald-300 uppercase tracking-wider flex items-center space-x-1">
                    <Trees className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Cộng Tổng Sản Lượng Theo Từng Vườn / Thợ Cạo ({farmSummaries.length} vườn):</span>
                  </span>
                </div>

                <div className="space-y-1.5">
                  {farmSummaries.map((f, idx) => (
                    <div 
                      key={`farm-sum-${f.farmName}-${idx}`}
                      className="p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-extrabold text-xs text-amber-950 dark:text-amber-200 flex items-center space-x-1">
                            <span>🌳</span>
                            <span>{f.farmName}</span>
                          </span>
                          <span className="text-[10px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-bold px-1.5 py-0.2 rounded-full">
                            {f.count} lần cạo
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-700 dark:text-gray-300 flex items-center space-x-2 flex-wrap">
                          <span>⚖️ Tổng mủ: <strong className="text-emerald-950 dark:text-emerald-200 font-black">{formatWeight(f.degreeWeight + f.cupWeight + f.scrapWeight)}</strong></span>
                          <span>•</span>
                          <span>💧 Mủ nước: <strong className="text-emerald-800 dark:text-emerald-300">{formatWeight(f.degreeWeight)}</strong> ({formatVND(f.degreeMoney)})</span>
                          <span>•</span>
                          <span>🍵 Mủ chén: <strong className="text-amber-800 dark:text-amber-300">{formatWeight(f.cupWeight)}</strong> ({formatVND(f.cupMoney)})</span>
                          <span>•</span>
                          <span>🍂 Mủ tạp: <strong className="text-amber-700 dark:text-amber-300">{formatWeight(f.scrapWeight)}</strong> ({formatVND(f.scrapMoney)})</span>
                        </div>
                      </div>

                      <div className="text-left sm:text-right border-t sm:border-t-0 pt-1 sm:pt-0 border-amber-200/50 dark:border-amber-900">
                        <span className="text-[9px] text-gray-500 uppercase font-bold block">Tổng tiền vườn này</span>
                        <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                          {formatVND(f.totalMoney)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Action Bar for whole group */}
            <div className="pt-1 flex flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                {onOpenAddModal && (
                  <button
                    onClick={() => setIsDropdownOpen((prev) => !prev)}
                    className="py-2.5 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-emerald-950 font-black text-xs shadow-md transition flex items-center justify-center space-x-1.5 cursor-pointer border border-amber-600/30 active:scale-98"
                    title="Nhấn để chọn tên vườn/thợ cạo và tính sản lượng"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>+ Thêm Sản Lượng Vườn Mới</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                )}

                <button
                  onClick={handleShareSummary}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center space-x-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Chia sẻ qua Zalo</span>
                </button>

                <button
                  onClick={handleExportPDF}
                  disabled={isExportingPdf}
                  className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold text-xs shadow-xs transition flex items-center space-x-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{isExportingPdf ? 'Đang tạo PDF...' : 'Xuất PDF'}</span>
                </button>

                <button
                  onClick={handleExportExcel}
                  className="py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition flex items-center space-x-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Xuất Excel</span>
                </button>
              </div>

              {/* Unfoldable Dropdown Menu for Garden / Tapper Selection */}
              {isDropdownOpen && (
                <div className="w-full bg-amber-50 dark:bg-gray-900 border-2 border-amber-400 dark:border-amber-600 rounded-2xl p-3.5 shadow-xl space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-amber-200 dark:border-gray-700 pb-2">
                    <div className="flex items-center space-x-1.5">
                      <Trees className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      <span className="text-xs font-black uppercase text-amber-950 dark:text-amber-300">
                        Chọn Vườn hoặc Thợ Cạo để nhập sản lượng:
                      </span>
                    </div>
                    <button
                      onClick={() => setIsDropdownOpen(false)}
                      className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* List of saved garden/tapper options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto">
                    {savedFarmsList.map((farm, idx) => (
                      <div
                        key={`farm-opt-${farm}-${idx}`}
                        className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-800/80 hover:border-amber-500 hover:bg-amber-100/60 dark:hover:bg-amber-950/40 text-left font-bold text-xs text-gray-800 dark:text-gray-100 flex items-center justify-between shadow-2xs transition group"
                      >
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            onClose();
                            if (onOpenAddModal) {
                              onOpenAddModal(farm);
                            }
                          }}
                          className="flex-1 flex items-center justify-between min-w-0 mr-1 cursor-pointer"
                        >
                          <span className="flex items-center space-x-1.5 truncate">
                            <span className="text-base">🌳</span>
                            <span className="truncate">{farm}</span>
                          </span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold px-1.5 py-0.5 rounded-md group-hover:bg-emerald-700 group-hover:text-white transition shrink-0 ml-1">
                            Nhập →
                          </span>
                        </button>

                        <div className="flex items-center space-x-1 shrink-0 border-l border-amber-200/80 dark:border-gray-700 pl-1 ml-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingFarm({
                                isOpen: true,
                                oldName: farm,
                                newName: farm,
                                updateHistoricalRecords: true,
                              });
                            }}
                            title="Sửa tên vườn / thợ cạo"
                            className="p-1 rounded-lg text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (savedFarmsList.length <= 1) {
                                return;
                              }
                              setDeletingFarmConfirm({
                                isOpen: true,
                                farmName: farm,
                              });
                            }}
                            title={savedFarmsList.length <= 1 ? "Cần giữ ít nhất 1 tên vườn" : "Xóa tên vườn / thợ cạo"}
                            disabled={savedFarmsList.length <= 1}
                            className={`p-1 rounded-lg transition ${
                              savedFarmsList.length <= 1
                                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 cursor-pointer'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Custom Farm Adder */}
                  <div className="pt-2 border-t border-amber-200 dark:border-gray-700">
                    {!isAddingCustomFarm ? (
                      <button
                        onClick={() => setIsAddingCustomFarm(true)}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>+ Tự Đặt Tên Vườn / Thợ Cạo Mới Để Lưu...</span>
                      </button>
                    ) : (
                      <div className="flex items-center space-x-2 animate-fade-in">
                        <input
                          type="text"
                          placeholder="Tên vườn hoặc thợ cạo mới (VD: Vườn Bãi Bồi...)"
                          value={customFarmInput}
                          onChange={(e) => setCustomFarmInput(e.target.value)}
                          autoFocus
                          className="flex-1 px-3 py-2 text-xs font-bold rounded-xl border-2 border-emerald-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none"
                        />
                        <button
                          onClick={handleSaveAndSelectCustomFarm}
                          className="py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-md transition"
                        >
                          Lưu & Nhập
                        </button>
                        <button
                          onClick={() => {
                            setIsAddingCustomFarm(false);
                            setCustomFarmInput('');
                          }}
                          className="py-2 px-2 text-xs text-gray-500 hover:text-gray-700 font-bold"
                        >
                          Hủy
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* List of Mobile Detail Cards */}
          {sortedRecords.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-700 dark:text-gray-300 text-xs uppercase tracking-wider">
                  Danh sách chi tiết từng ngày ({records.length} thẻ):
                </h4>
                {onOpenAddModal && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAddModal();
                    }}
                    className="text-xs text-emerald-700 dark:text-emerald-400 font-black hover:underline flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm ngày cạo mới</span>
                  </button>
                )}
              </div>

              {sortedRecords.map((r) => {
                const cycle = getCycleInfo(r.date);
                return (
                  <div 
                    key={r.id}
                    className="bg-white dark:bg-gray-800 p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 shadow-xs hover:border-emerald-500 transition space-y-3"
                  >
                    {/* Card Header */}
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2.5">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="text-base font-black text-gray-900 dark:text-white">
                          📅 {formatDateVN(r.date)}
                        </span>
                        {shouldShowFarmBreakdown && (
                          <span className="text-xs bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-200 font-black px-2.5 py-0.5 rounded-full flex items-center space-x-1 border border-amber-300 dark:border-amber-700/80 shadow-2xs">
                            <Trees className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                            <span>🌳 {r.farmName || settings.rubberFieldName || 'Chưa đặt tên'}</span>
                          </span>
                        )}
                        {r.time && (
                          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-mono font-bold px-2 py-0.5 rounded-md flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-emerald-600" />
                            <span>{r.time}</span>
                          </span>
                        )}
                        <span className="text-xs bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                          {cycle.cycleName}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleShareSingleRecord(r)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg font-bold text-xs flex items-center space-x-1 border border-blue-200 dark:border-blue-800 cursor-pointer"
                          title="Chia sẻ ngày này qua Zalo"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Gửi Zalo</span>
                        </button>
                        {onOpenEditModal && (
                          <button
                            onClick={() => {
                              onClose();
                              onOpenEditModal(r);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg cursor-pointer"
                            title="Sửa ngày này"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {onDeleteRecord && (
                          <button
                            onClick={() => onDeleteRecord(r.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg cursor-pointer"
                            title="Xóa ngày này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Card Content Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* Box 1: Mủ Độ */}
                      <div className="bg-emerald-50/60 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900 space-y-1">
                        <div className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center space-x-1">
                          <Droplet className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Mủ Độ (Mủ Nước):</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[11px] text-gray-700 dark:text-gray-300">
                          <div>Khối lượng: <strong className="text-gray-900 dark:text-white">{formatWeight(r.degreeLatex.weight)}</strong></div>
                          <div>Độ TSC: <strong className="text-emerald-700 dark:text-emerald-400">{formatDegree(r.degreeLatex.degree)}°</strong></div>
                          <div className="col-span-2">Đơn giá: <strong className="text-gray-900 dark:text-white">{formatVND(r.degreeLatex.pricePerDegree)}/độ</strong></div>
                          <div className="col-span-2 text-xs font-black text-emerald-800 dark:text-emerald-300 pt-0.5 border-t border-emerald-200/50 dark:border-emerald-900">
                            Thành tiền: {formatVND(r.degreeLatex.total)}
                          </div>
                        </div>
                      </div>

                      {/* Box 2: Mủ Chén */}
                      <div className="bg-amber-50/60 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-100 dark:border-amber-900 space-y-1">
                        <div className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center space-x-1">
                          <Coffee className="w-3.5 h-3.5 text-amber-600" />
                          <span>Mủ Chén (Mủ Kéo):</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[11px] text-gray-700 dark:text-gray-300">
                          <div>Khối lượng: <strong className="text-gray-900 dark:text-white">{formatWeight(r.cupLatex.weight)}</strong></div>
                          <div>Đơn giá: <strong className="text-amber-800 dark:text-amber-400">{formatVND(r.cupLatex.pricePerKg)}/kg</strong></div>
                          <div className="col-span-2 text-xs font-black text-amber-900 dark:text-amber-300 pt-0.5 border-t border-amber-200/50 dark:border-amber-900">
                            Thành tiền: {formatVND(r.cupLatex.total)}
                          </div>
                        </div>
                      </div>

                      {/* Box 3: Mủ Tạp */}
                      <div className="bg-orange-50/60 dark:bg-orange-950/40 p-3 rounded-xl border border-orange-100 dark:border-orange-900 space-y-1">
                        <div className="text-xs font-bold text-orange-900 dark:text-orange-300 flex items-center space-x-1">
                          <span className="text-sm">🍂</span>
                          <span>Mủ Tạp (Mủ Dây/Đông):</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[11px] text-gray-700 dark:text-gray-300">
                          <div>Khối lượng: <strong className="text-gray-900 dark:text-white">{formatWeight(r.scrapLatex?.weight || 0)}</strong></div>
                          <div>Đơn giá: <strong className="text-orange-800 dark:text-orange-400">{formatVND(r.scrapLatex?.pricePerKg || 0)}/kg</strong></div>
                          <div className="col-span-2 text-xs font-black text-orange-900 dark:text-orange-300 pt-0.5 border-t border-orange-200/50 dark:border-orange-900">
                            Thành tiền: {formatVND(r.scrapLatex?.total || 0)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Totals */}
                    <div className="bg-gray-50 dark:bg-gray-900 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center justify-between font-black text-xs">
                      <div>
                        <span className="text-gray-500 font-bold uppercase text-[10px] block">Tổng Tiền Ngày</span>
                        <span className="text-base text-emerald-700 dark:text-emerald-400">{formatVND(r.dailyTotal)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-amber-800 dark:text-amber-400 font-bold uppercase text-[10px] block">Cộng Dồn Đợt</span>
                        <span className="text-sm text-emerald-900 dark:text-emerald-300">{formatVND(r.cumulativeTotal)}</span>
                      </div>
                    </div>

                    {r.note && (
                      <div className="text-[11px] text-gray-600 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-900 px-2.5 py-1 rounded-lg">
                        📝 Ghi chú: {r.note}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold text-xs transition"
          >
            Đóng Chi Tiết
          </button>
        </div>

      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModalConfig.isOpen}
        onClose={() => setShareModalConfig((prev) => ({ ...prev, isOpen: false }))}
        records={shareModalConfig.records}
        settings={settings}
        title={shareModalConfig.title}
      />

      {/* Edit Farm Name Modal */}
      {editingFarm.isOpen && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEditingFarm({ isOpen: false, oldName: '', newName: '', updateHistoricalRecords: true });
            }
          }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4 my-auto"
          >
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center space-x-2">
                <Pencil className="w-4 h-4 text-amber-600" />
                <span>Sửa tên vườn / thợ cạo</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingFarm({ isOpen: false, oldName: '', newName: '', updateHistoricalRecords: true })}
                className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-300 transition cursor-pointer"
                title="Đóng (ESC)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                  Tên vườn/thợ cạo hiện tại:
                </label>
                <input
                  type="text"
                  value={editingFarm.oldName}
                  disabled
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-200 mb-1">
                  Tên mới thay thế:
                </label>
                <input
                  type="text"
                  value={editingFarm.newName}
                  onChange={(e) => {
                    setEditFarmError('');
                    setEditingFarm({ ...editingFarm, newName: e.target.value });
                  }}
                  autoFocus
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border-2 border-emerald-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
                />
                {editFarmError && (
                  <p className="text-[11px] font-bold text-red-600 dark:text-red-400 mt-1">
                    ⚠️ {editFarmError}
                  </p>
                )}
              </div>

              <label className="flex items-center space-x-2 text-xs font-medium text-gray-700 dark:text-gray-300 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingFarm.updateHistoricalRecords}
                  onChange={(e) => setEditingFarm({ ...editingFarm, updateHistoricalRecords: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Cập nhật luôn tên này cho tất cả nhật ký mủ cũ</span>
              </label>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setEditingFarm({ isOpen: false, oldName: '', newName: '', updateHistoricalRecords: true })}
                className="px-3 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEditFarm}
                className="px-4 py-2 rounded-xl text-xs font-extrabold bg-emerald-700 hover:bg-emerald-800 text-white shadow-md transition cursor-pointer"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Farm Modal */}
      {deletingFarmConfirm.isOpen && (
        <ConfirmModal
          isOpen={deletingFarmConfirm.isOpen}
          title="Xác nhận xóa tên vườn"
          message={`Bạn có chắc chắn muốn xóa tên vườn/thợ cạo "${deletingFarmConfirm.farmName}" khỏi danh sách lựa chọn nhanh không?`}
          confirmText="Xóa khỏi danh sách"
          cancelText="Hủy"
          confirmVariant="danger"
          onConfirm={handleConfirmDeleteFarm}
          onCancel={() => setDeletingFarmConfirm({ isOpen: false, farmName: '' })}
        />
      )}
    </div>
  );
};
