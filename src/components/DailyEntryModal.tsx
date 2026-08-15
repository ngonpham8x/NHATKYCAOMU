import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Calendar, Calculator, Check, AlertCircle, Info, Sparkles, Clock, Trees, Plus, Droplets, Coffee, Layers } from 'lucide-react';
import { HarvestRecord, Settings } from '../types';
import { 
  formatVND, 
  getTodayDateStr, 
  getCycleInfo, 
  parseVietnameseDecimal, 
  parseVietnamesePrice 
} from '../utils/calculations';
import { NumericInput } from './NumericInput';

interface DailyEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRecord: (record: HarvestRecord) => void;
  onUpdateSettings?: (newSettings: Settings) => void;
  editingRecord: HarvestRecord | null;
  existingRecords: HarvestRecord[];
  settings: Settings;
  initialFarmName?: string;
}

export const DailyEntryModal: React.FC<DailyEntryModalProps> = ({
  isOpen,
  onClose,
  onSaveRecord,
  onUpdateSettings,
  editingRecord,
  existingRecords,
  settings,
  initialFarmName,
}) => {
  // Form states
  const [date, setDate] = useState<string>(getTodayDateStr());
  const [time, setTime] = useState<string>('05:30');

  // Authoritative Farms List directly from settings with fallback - memoized
  const farmsList = useMemo(() => {
    return settings?.farmsList && settings.farmsList.length > 0 
      ? settings.farmsList 
      : [];
  }, [settings?.farmsList]);

  const [farmName, setFarmName] = useState<string>(
    initialFarmName || farmsList[0] || ''
  );
  const [isAddingNewFarm, setIsAddingNewFarm] = useState<boolean>(false);
  const [newFarmInput, setNewFarmInput] = useState<string>('');

  // 1. Mủ độ (Mủ nước)
  const [degreeWeight, setDegreeWeight] = useState<string>('');
  const [degreeValue, setDegreeValue] = useState<string>('');
  const [degreePrice, setDegreePrice] = useState<string>(
    (settings?.defaultDegreePrice || 350).toString()
  );

  // 2. Mủ chén (Mủ kéo)
  const [cupWeight, setCupWeight] = useState<string>('');
  const [cupPrice, setCupPrice] = useState<string>(
    (settings.defaultCupPrice || 18000).toString()
  );

  // 3. Mủ tạp (Mủ dây / Mủ đông) - Tách riêng biệt
  const [scrapWeight, setScrapWeight] = useState<string>('');
  const [scrapPrice, setScrapPrice] = useState<string>(
    (settings.defaultScrapPrice || 15000).toString()
  );

  // Note
  const [note, setNote] = useState<string>('');

  // Duplicate date & farm warning & validation
  const [duplicateWarning, setDuplicateWarning] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');

  // Form ref for smooth scroll on validation error
  const formRef = useRef<HTMLFormElement>(null);

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

  // Initialize form fields ONLY when modal opens or editing record changes
  useEffect(() => {
    if (isOpen) {
      if (editingRecord) {
        setDate(editingRecord.date || getTodayDateStr());
        setTime(editingRecord.time || '05:30');
        setFarmName(editingRecord.farmName || farmsList[0] || '');
        setDegreeWeight(editingRecord.degreeLatex?.weight ? editingRecord.degreeLatex.weight.toString() : '');
        setDegreeValue(editingRecord.degreeLatex?.degree ? editingRecord.degreeLatex.degree.toString() : '');
        setDegreePrice(editingRecord.degreeLatex?.pricePerDegree ? editingRecord.degreeLatex.pricePerDegree.toString() : (settings?.defaultDegreePrice || 350).toString());
        setCupWeight(editingRecord.cupLatex?.weight ? editingRecord.cupLatex.weight.toString() : '');
        setCupPrice(editingRecord.cupLatex?.pricePerKg ? editingRecord.cupLatex.pricePerKg.toString() : (settings?.defaultCupPrice || 18000).toString());
        setScrapWeight(editingRecord.scrapLatex?.weight ? editingRecord.scrapLatex.weight.toString() : '');
        setScrapPrice(editingRecord.scrapLatex?.pricePerKg ? editingRecord.scrapLatex.pricePerKg.toString() : (settings?.defaultScrapPrice || 15000).toString());
        setNote(editingRecord.note || '');
      } else {
        setDate(getTodayDateStr());
        setTime('05:30');
        setFarmName(initialFarmName || farmsList[0] || '');
        setDegreeWeight('');
        setDegreeValue('');
        setDegreePrice((settings?.defaultDegreePrice || 350).toString());
        setCupWeight('');
        setCupPrice((settings?.defaultCupPrice || 18000).toString());
        setScrapWeight('');
        setScrapPrice((settings?.defaultScrapPrice || 15000).toString());
        setNote('');
      }
      setIsAddingNewFarm(false);
      setNewFarmInput('');
      setValidationError('');
    }
  }, [isOpen, editingRecord?.id, initialFarmName]);

  // Check if date + farm combination already exists (when creating new or changing date/farm)
  useEffect(() => {
    const currentFarm = (farmName || '').trim();
    const records = existingRecords || [];
    if (!editingRecord && date) {
      const exists = records.some((r) => r && r.date === date && (r.farmName || '').trim() === currentFarm);
      setDuplicateWarning(exists);
    } else if (editingRecord && (date !== editingRecord.date || currentFarm !== (editingRecord.farmName || '').trim())) {
      const exists = records.some((r) => r && r.date === date && (r.farmName || '').trim() === currentFarm && r.id !== editingRecord.id);
      setDuplicateWarning(exists);
    } else {
      setDuplicateWarning(false);
    }
  }, [date, farmName, existingRecords, editingRecord]);

  if (!isOpen) return null;

  const handleAddNewFarmName = (e?: React.MouseEvent | React.KeyboardEvent | React.FormEvent, customName?: string) => {
    if (e && 'preventDefault' in e) {
      e.preventDefault();
    }
    const trimmed = (customName !== undefined ? customName : newFarmInput).trim();
    if (!trimmed) return;

    if (!farmsList.includes(trimmed)) {
      const updatedList = [...farmsList, trimmed];
      if (onUpdateSettings) {
        onUpdateSettings({
          ...settings,
          farmsList: updatedList,
        });
      }
    }
    setFarmName(trimmed);
    setNewFarmInput('');
    setIsAddingNewFarm(false);
  };

  // Real-time calculations with Vietnamese Decimal & Price parsing
  const numDegreeWeight = parseVietnameseDecimal(degreeWeight);
  const numDegreeValue = parseVietnameseDecimal(degreeValue);
  const numDegreePrice = parseVietnamesePrice(degreePrice);
  const degreeTotal = Math.round(numDegreeWeight * numDegreeValue * numDegreePrice);

  const numCupWeight = parseVietnameseDecimal(cupWeight);
  const numCupPrice = parseVietnamesePrice(cupPrice);
  const cupTotal = Math.round(numCupWeight * numCupPrice);

  const numScrapWeight = parseVietnameseDecimal(scrapWeight);
  const numScrapPrice = parseVietnamesePrice(scrapPrice);
  const scrapTotal = Math.round(numScrapWeight * numScrapPrice);

  const dailyTotal = degreeTotal + cupTotal + scrapTotal;

  // Cycle info preview for selected date
  const cycleInfo = getCycleInfo(date, settings);

  // Estimate new cumulative total for this cycle
  const currentCycleRecords = (existingRecords || []).filter((r) => {
    if (!r || !r.date) return false;
    if (editingRecord && r.id === editingRecord.id) return false;
    const c = getCycleInfo(r.date, settings);
    return c && c.key === cycleInfo.key && r.date <= date;
  });
  const currentCyclePriorTotal = currentCycleRecords.reduce((s, r) => s + (r?.dailyTotal || 0), 0);
  const estimatedCumulative = currentCyclePriorTotal + dailyTotal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const triggerError = (msg: string) => {
      setValidationError(msg);
      if (formRef.current) {
        formRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    if (!date) {
      triggerError('Vui lòng chọn ngày cạo mủ.');
      return;
    }

    // Resolve final farm name (whether selected or currently typed in new farm input)
    let finalFarmName = farmName.trim();
    if (isAddingNewFarm && newFarmInput.trim()) {
      finalFarmName = newFarmInput.trim();
      if (!farmsList.includes(finalFarmName)) {
        const updatedList = [...farmsList, finalFarmName];
        if (onUpdateSettings) {
          onUpdateSettings({
            ...settings,
            farmsList: updatedList,
          });
        }
      }
      setFarmName(finalFarmName);
      setIsAddingNewFarm(false);
      setNewFarmInput('');
    }

    if (!finalFarmName) {
      triggerError('Vui lòng chọn hoặc thêm Tên Vườn/Thợ Cạo.');
      return;
    }

    // Check that at least one latex category has weight
    if (numDegreeWeight <= 0 && numCupWeight <= 0 && numScrapWeight <= 0) {
      triggerError('Vui lòng nhập số ký của ít nhất 1 loại mủ (Mủ nước, Mủ chén hoặc Mủ tạp).');
      return;
    }

    // Validate Mủ nước dependencies
    if (numDegreeWeight > 0) {
      if (numDegreeValue <= 0) {
        triggerError('Đã nhập kg Mủ nước thì độ TSC/DRC phải lớn hơn 0.');
        return;
      }
      if (numDegreePrice <= 0) {
        triggerError('Đã nhập kg Mủ nước thì đơn giá/độ phải lớn hơn 0 đ.');
        return;
      }
    }

    // Validate Mủ chén dependencies
    if (numCupWeight > 0 && numCupPrice <= 0) {
      triggerError('Đã nhập kg Mủ chén thì giá mủ chén/kg phải lớn hơn 0 đ.');
      return;
    }

    // Validate Mủ tạp dependencies
    if (numScrapWeight > 0 && numScrapPrice <= 0) {
      triggerError('Đã nhập kg Mủ tạp thì giá mủ tạp/kg phải lớn hơn 0 đ.');
      return;
    }

    if (dailyTotal <= 0) {
      triggerError('Tổng số tiền ngày cạo phải lớn hơn 0 đ.');
      return;
    }

    setValidationError('');

    const newRecord: HarvestRecord = {
      id: editingRecord ? editingRecord.id : `rec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      date,
      time: time || '05:30',
      farmName: finalFarmName,
      degreeLatex: {
        weight: numDegreeWeight,
        degree: numDegreeValue,
        pricePerDegree: numDegreePrice,
        total: degreeTotal,
      },
      cupLatex: {
        weight: numCupWeight,
        pricePerKg: numCupPrice,
        total: cupTotal,
      },
      scrapLatex: {
        weight: numScrapWeight,
        pricePerKg: numScrapPrice,
        total: scrapTotal,
      },
      dailyTotal,
      note: note.trim(),
      createdAt: editingRecord ? editingRecord.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveRecord(newRecord);
    onClose();
  };

  // Compile full options list ensuring current selected farm is present
  const allFarmOptions = Array.from(new Set([
    ...farmsList,
    ...(farmName ? [farmName] : [])
  ]));

  return (
    <div 
      id="daily-entry-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-[120] overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] my-auto relative z-10"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-400 text-emerald-950 rounded-xl font-black shadow-xs">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-wide leading-tight uppercase">
                {editingRecord ? 'SỬA NHẬT KÝ CẠO MỦ' : 'NHẬP DỮ LIỆU NGÀY CẠO MỦ'}
              </h3>
              <p className="text-[11px] text-emerald-100 font-medium">
                Tách riêng Mủ Nước, Mủ Chén & Mủ Tạp chuẩn xác
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-daily-entry-modal"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 active:scale-95 text-amber-300 transition flex items-center justify-center cursor-pointer shadow-md"
            title="Đóng cửa sổ (ESC)"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form ref={formRef} onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {validationError && (
            <div className="p-3 bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200 text-xs font-bold rounded-xl border border-red-300 flex items-center justify-between animate-fade-in">
              <span>⚠️ {validationError}</span>
              <button
                type="button"
                onClick={() => setValidationError('')}
                className="p-1 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900 rounded-md transition cursor-pointer shrink-0 ml-2"
                title="Đóng cảnh báo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Section 0: Select Garden / Tapper */}
          <div className="bg-amber-50/80 dark:bg-amber-950/30 p-3.5 rounded-2xl border border-amber-300 dark:border-amber-800/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase text-amber-900 dark:text-amber-300 flex items-center space-x-1.5">
                <Trees className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>1. Tên Vườn hoặc Thợ Cạo:</span>
              </label>

              {!isAddingNewFarm && (
                <button
                  type="button"
                  id="btn-trigger-add-farm-name"
                  onClick={() => {
                    setIsAddingNewFarm(true);
                    setNewFarmInput('');
                  }}
                  className="text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 active:scale-95 flex items-center space-x-1.5 cursor-pointer bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>+ Thêm tên mới</span>
                </button>
              )}
            </div>

            {isAddingNewFarm ? (
              <div className="space-y-2.5 animate-fade-in bg-white dark:bg-gray-800 p-3 rounded-xl border-2 border-amber-400 shadow-sm">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    id="input-new-farm-name"
                    placeholder="Nhập tên vườn/thợ (VD: Vườn Đồi 3, Thợ Cạo B...)"
                    value={newFarmInput}
                    onChange={(e) => setNewFarmInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNewFarmName();
                      }
                    }}
                    autoFocus
                    className="flex-1 px-3 py-2 text-xs font-bold rounded-lg border border-amber-400 bg-amber-50/40 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    id="btn-save-new-farm-name"
                    onClick={() => handleAddNewFarmName()}
                    className="py-2 px-3 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer flex items-center space-x-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Lưu & Chọn</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNewFarm(false);
                      setNewFarmInput('');
                    }}
                    className="py-2 px-2 text-gray-500 text-xs font-semibold hover:text-gray-700 dark:text-gray-400 cursor-pointer"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <select
                  id="select-farm-name"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700/80 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-black text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
                >
                  {!farmName && <option value="" disabled>-- Vui lòng chọn hoặc thêm vườn --</option>}
                  {allFarmOptions.map((farm, idx) => (
                    farm ? (
                      <option key={`modal-farm-${farm}-${idx}`} value={farm}>
                        🌳 {farm}
                      </option>
                    ) : null
                  ))}
                </select>
              </div>
            )}
            <p className="text-[11px] text-amber-800 dark:text-amber-400 font-medium">
              Chủ vườn chọn tên vườn/thợ cạo để tính riêng sản lượng tích lũy từng lô.
            </p>
          </div>

          {/* Section 1: Date, Time & Cycle Info */}
          <div className="bg-gray-50 dark:bg-gray-900/60 p-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase text-gray-700 dark:text-gray-300 flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>2. Thời gian cạo mủ:</span>
              </label>

              <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-800">
                <Sparkles className="w-3 h-3 mr-1 text-amber-500" />
                {cycleInfo.cycleName}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Ngày cạo mủ:
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Giờ cạo / trút mủ:</span>
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {duplicateWarning && (
              <div className="flex items-center space-x-1.5 text-amber-600 dark:text-amber-400 text-xs font-semibold pt-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Đã có dữ liệu cho ngày này và vườn này! Lưu lại sẽ cập nhật dữ liệu mới.</span>
              </div>
            )}
          </div>

          {/* Section 2: Mủ Độ (Liquid Latex) */}
          <div className="bg-emerald-50/60 dark:bg-emerald-950/20 p-3.5 sm:p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center space-x-1.5">
                <Droplets className="w-4 h-4 text-emerald-600" />
                <span>3. Mủ độ (Mủ nước)</span>
              </h4>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                Thành tiền: {formatVND(degreeTotal)}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Số ký (kg)
                </label>
                <NumericInput
                  id="input-degree-weight"
                  name="degreeWeight"
                  decimal={true}
                  placeholder="0.0"
                  value={degreeWeight}
                  onChange={setDegreeWeight}
                  showClear={true}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Độ TSC (DRC)
                </label>
                <NumericInput
                  id="input-degree-value"
                  name="degreeValue"
                  decimal={true}
                  placeholder="30.0"
                  value={degreeValue}
                  onChange={setDegreeValue}
                  showClear={true}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Giá/độ (đ)
                </label>
                <NumericInput
                  id="input-degree-price"
                  name="degreePrice"
                  decimal={false}
                  placeholder="350"
                  value={degreePrice}
                  onChange={setDegreePrice}
                  showClear={true}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="text-[11px] text-gray-500 dark:text-gray-400 italic">
              Công thức: {numDegreeWeight || '0'} kg × {numDegreeValue || '0'}° × {numDegreePrice || '0'} đ = <strong className="text-emerald-700 dark:text-emerald-300">{formatVND(degreeTotal)}</strong>
            </div>
          </div>

          {/* Section 3: Mủ Chén (Cup Lump Latex) - TÁCH RIÊNG */}
          <div className="bg-amber-50/60 dark:bg-amber-950/20 p-3.5 sm:p-4 rounded-2xl border border-amber-200 dark:border-amber-800/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center space-x-1.5">
                <Coffee className="w-4 h-4 text-amber-600" />
                <span>4. Mủ chén (Mủ kéo)</span>
              </h4>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                Thành tiền: {formatVND(cupTotal)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Số ký mủ chén (kg)
                </label>
                <NumericInput
                  id="input-cup-weight"
                  name="cupWeight"
                  decimal={true}
                  placeholder="0.0"
                  value={cupWeight}
                  onChange={setCupWeight}
                  showClear={true}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Giá mủ chén/kg (đ)
                </label>
                <NumericInput
                  id="input-cup-price"
                  name="cupPrice"
                  decimal={false}
                  placeholder="18000"
                  value={cupPrice}
                  onChange={setCupPrice}
                  showClear={true}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="text-[11px] text-gray-500 dark:text-gray-400 italic">
              Công thức: {numCupWeight || '0'} kg × {numCupPrice || '0'} đ = <strong className="text-amber-700 dark:text-amber-300">{formatVND(cupTotal)}</strong>
            </div>
          </div>

          {/* Section 4: Mủ Tạp (Scrap Latex / Mủ Dây, Mủ Đông) - TÁCH RIÊNG BIỆT */}
          <div className="bg-orange-50/60 dark:bg-orange-950/20 p-3.5 sm:p-4 rounded-2xl border border-orange-200 dark:border-orange-800/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-orange-900 dark:text-orange-300 flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-orange-600" />
                <span>5. Mủ tạp (Mủ dây, Mủ đông)</span>
              </h4>
              <span className="text-xs font-bold text-orange-700 dark:text-orange-400">
                Thành tiền: {formatVND(scrapTotal)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Số ký mủ tạp (kg)
                </label>
                <NumericInput
                  id="input-scrap-weight"
                  name="scrapWeight"
                  decimal={true}
                  placeholder="0.0"
                  value={scrapWeight}
                  onChange={setScrapWeight}
                  showClear={true}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Giá mủ tạp/kg (đ)
                </label>
                <NumericInput
                  id="input-scrap-price"
                  name="scrapPrice"
                  decimal={false}
                  placeholder="15000"
                  value={scrapPrice}
                  onChange={setScrapPrice}
                  showClear={true}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="text-[11px] text-gray-500 dark:text-gray-400 italic">
              Công thức: {numScrapWeight || '0'} kg × {numScrapPrice || '0'} đ = <strong className="text-orange-700 dark:text-orange-300">{formatVND(scrapTotal)}</strong>
            </div>
          </div>

          {/* Section 5: Live Totals & Cumulative Estimate Banner */}
          <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white p-4 rounded-2xl space-y-2 shadow-inner border border-emerald-800">
            <div className="flex items-center justify-between border-b border-emerald-800 pb-2">
              <span className="text-xs uppercase font-bold text-emerald-200">
                6. Tổng tiền ngày
              </span>
              <span className="text-xl font-black text-amber-300">
                {formatVND(dailyTotal)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-semibold text-emerald-100 flex items-center space-x-1">
                <Info className="w-3.5 h-3.5 text-amber-300" />
                <span>Ước tính cộng dồn đợt này:</span>
              </span>
              <span className="text-sm font-bold text-white">
                {formatVND(estimatedCumulative)}
              </span>
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Ghi chú (Không bắt buộc)
            </label>
            <input
              type="text"
              placeholder="VD: Thời tiết nắng đẹp, mủ chạy đều, Lô B..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Form Submit Buttons */}
          <div className="pt-3 flex items-center space-x-3 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              id="btn-cancel-daily-entry-modal"
              onClick={onClose}
              className="w-1/3 py-3.5 px-4 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-bold text-sm hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition cursor-pointer flex items-center justify-center"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              id="btn-submit-daily-entry-modal"
              className="w-2/3 py-3.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white font-black text-sm shadow-md transition flex items-center justify-center space-x-2 cursor-pointer relative z-10"
            >
              <Check className="w-5 h-5 stroke-[2.5]" />
              <span>{editingRecord ? 'Cập Nhật Ngày Cạo' : 'Lưu Ngày Cạo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

