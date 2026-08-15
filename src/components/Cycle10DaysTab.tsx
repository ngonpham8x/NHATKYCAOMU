import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Layers, 
  Sparkles, 
  Check, 
  Trash2, 
  Plus, 
  ArrowRight, 
  ArrowLeft, 
  Info, 
  Calculator, 
  CheckCircle2, 
  TrendingUp, 
  CalendarDays,
  Clock,
  X,
  Edit3
} from 'lucide-react';
import { HarvestRecord, Settings } from '../types';
import { 
  formatVND, 
  getCycleInfo, 
  getDaysInMonth, 
  formatWeight, 
  formatDegree,
  getCyclesForMonth,
  getCycleDescriptionShort,
  parseVietnameseDecimal,
  parseVietnamesePrice
} from '../utils/calculations';
import { NumericInput } from './NumericInput';

interface Cycle10DaysTabProps {
  records: HarvestRecord[];
  settings: Settings;
  onSaveRecord: (record: HarvestRecord) => void;
  onDeleteRecord: (id: string) => void;
  onNavigateToTab?: (tab: any) => void;
}

export const Cycle10DaysTab: React.FC<Cycle10DaysTabProps> = ({
  records,
  settings,
  onSaveRecord,
  onDeleteRecord,
  onNavigateToTab,
}) => {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);
  const monthCycles = getCyclesForMonth(selectedYear, selectedMonth, settings);

  const [selectedCycleNum, setSelectedCycleNum] = useState<number>(() => {
    const d = today.getDate();
    const active = monthCycles.find((c) => d >= c.startDay && d <= c.endDay);
    return active ? active.cycleNum : 1;
  });

  const [summaryViewMode, setSummaryViewMode] = useState<'cards' | 'table'>('cards');

  // Calculate day range for selected cycle
  const currentCycleObj = monthCycles.find((c) => c.cycleNum === selectedCycleNum) || monthCycles[0];
  const activeCycleNum = currentCycleObj.cycleNum;
  const startDay = currentCycleObj.startDay;
  const endDay = currentCycleObj.endDay;

  // Generate array of date objects for the cycle
  const daysInCycle = Array.from({ length: endDay - startDay + 1 }, (_, i) => {
    const dayNum = startDay + i;
    const dayStr = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
    const monthStr = selectedMonth < 10 ? `0${selectedMonth}` : `${selectedMonth}`;
    const dateStr = `${selectedYear}-${monthStr}-${dayStr}`;
    return {
      dayNum,
      dateStr,
      displayDate: `${dayStr}/${monthStr}`,
      fullDisplayDate: `${dayStr}/${monthStr}/${selectedYear}`,
    };
  });

  // Selected Day inside the 10-day tab bar (0 to daysInCycle.length - 1)
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);
  // Controls visibility of the editing form (defaults to open for immediate entry)
  const [isEditingFormOpen, setIsEditingFormOpen] = useState<boolean>(true);

  // Form input state for current selected day
  const currentDayInfo = daysInCycle[selectedDayIdx] || daysInCycle[0];

  const [degreeWeight, setDegreeWeight] = useState<string>('');
  const [degreeValue, setDegreeValue] = useState<string>('');
  const [degreePrice, setDegreePrice] = useState<string>(settings.defaultDegreePrice.toString());

  const [cupWeight, setCupWeight] = useState<string>('');
  const [cupPrice, setCupPrice] = useState<string>(settings.defaultCupPrice.toString());

  const [scrapWeight, setScrapWeight] = useState<string>('');
  const [scrapPrice, setScrapPrice] = useState<string>((settings.defaultScrapPrice || 15000).toString());

  const [harvestTime, setHarvestTime] = useState<string>('05:30');
  const [note, setNote] = useState<string>('');
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string>('');
  const [tabValidationError, setTabValidationError] = useState<string>('');

  // Find existing record for selected day if any
  const existingRecordForDay = records.find((r) => r.date === currentDayInfo?.dateStr);

  // Populate form when day selection or records change
  useEffect(() => {
    if (!currentDayInfo) return;
    const rec = records.find((r) => r.date === currentDayInfo.dateStr);
    if (rec) {
      setHarvestTime(rec.time || '05:30');
      setDegreeWeight(rec.degreeLatex.weight > 0 ? rec.degreeLatex.weight.toString() : '');
      setDegreeValue(rec.degreeLatex.degree > 0 ? rec.degreeLatex.degree.toString() : '');
      setDegreePrice(rec.degreeLatex.pricePerDegree.toString() || settings.defaultDegreePrice.toString());
      setCupWeight(rec.cupLatex.weight > 0 ? rec.cupLatex.weight.toString() : '');
      setCupPrice(rec.cupLatex.pricePerKg.toString() || settings.defaultCupPrice.toString());
      setScrapWeight(rec.scrapLatex && rec.scrapLatex.weight > 0 ? rec.scrapLatex.weight.toString() : '');
      setScrapPrice(rec.scrapLatex?.pricePerKg ? rec.scrapLatex.pricePerKg.toString() : (settings.defaultScrapPrice || 15000).toString());
      setNote(rec.note || '');
    } else {
      setHarvestTime('05:30');
      setDegreeWeight('');
      setDegreeValue('');
      setDegreePrice(settings.defaultDegreePrice.toString());
      setCupWeight('');
      setCupPrice(settings.defaultCupPrice.toString());
      setScrapWeight('');
      setScrapPrice((settings.defaultScrapPrice || 15000).toString());
      setNote('');
    }
    setTabValidationError('');
  }, [currentDayInfo?.dateStr, records, settings]);

  // Real-time calculation with Vietnamese Decimal & Price parsing
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

  // Compute total cycle earnings & cumulative total for cycle
  const cycleKey = `${selectedYear}-${selectedMonth < 10 ? '0' + selectedMonth : selectedMonth}-C${selectedCycleNum}`;
  const cycleRecordsMap = new Map<string, HarvestRecord>();
  records.forEach((r) => {
    const c = getCycleInfo(r.date, settings);
    if (c.key === cycleKey) {
      cycleRecordsMap.set(r.date, r);
    }
  });

  // Calculate cumulative money for current cycle up to currentDayInfo.dateStr
  let currentCycleCumulative = 0;
  daysInCycle.forEach((d) => {
    if (d.dateStr <= currentDayInfo.dateStr) {
      if (d.dateStr === currentDayInfo.dateStr) {
        currentCycleCumulative += dailyTotal;
      } else {
        const r = cycleRecordsMap.get(d.dateStr);
        if (r) currentCycleCumulative += r.dailyTotal;
      }
    }
  });

  // Total money recorded in entire 10-day cycle
  let totalCycleMoney = 0;
  let totalTappingDaysCount = 0;
  daysInCycle.forEach((d) => {
    const r = cycleRecordsMap.get(d.dateStr);
    if (r) {
      totalCycleMoney += r.dailyTotal;
      totalTappingDaysCount += 1;
    }
  });

  const handleSaveCurrentDay = (andNext: boolean = false) => {
    if (!currentDayInfo) return;

    if (numDegreeWeight <= 0 && numCupWeight <= 0 && numScrapWeight <= 0) {
      setTabValidationError('Vui lòng nhập số ký của ít nhất 1 loại mủ trước khi lưu.');
      return;
    }

    if (numDegreeWeight > 0 && (numDegreeValue <= 0 || numDegreePrice <= 0)) {
      setTabValidationError('Mủ nước yêu cầu độ TSC > 0 và đơn giá > 0 đ.');
      return;
    }

    if (numCupWeight > 0 && numCupPrice <= 0) {
      setTabValidationError('Mủ chén yêu cầu đơn giá > 0 đ.');
      return;
    }

    if (numScrapWeight > 0 && numScrapPrice <= 0) {
      setTabValidationError('Mủ tạp yêu cầu đơn giá > 0 đ.');
      return;
    }

    setTabValidationError('');

    const newRecord: HarvestRecord = {
      id: existingRecordForDay ? existingRecordForDay.id : `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: currentDayInfo.dateStr,
      time: harvestTime || '05:30',
      farmName: existingRecordForDay?.farmName || (settings.farmsList && settings.farmsList.length > 0 ? settings.farmsList[0] : (settings.rubberFieldName || '')),
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
      createdAt: existingRecordForDay ? existingRecordForDay.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveRecord(newRecord);
    setSavedSuccessMsg(`Đã lưu dữ liệu Ngày ${currentDayInfo.displayDate}!`);
    setTimeout(() => setSavedSuccessMsg(''), 2500);

    if (andNext && selectedDayIdx < daysInCycle.length - 1) {
      setSelectedDayIdx((prev) => prev + 1);
    }
  };

  const handleDeleteCurrentDay = () => {
    if (existingRecordForDay) {
      onDeleteRecord(existingRecordForDay.id);
    }
  };

  const sampleDateForCycle = `${selectedYear}-${selectedMonth < 10 ? '0' + selectedMonth : selectedMonth}-${startDay < 10 ? '0' + startDay : startDay}`;
  const currentCycleInfoObj = getCycleInfo(sampleDateForCycle, settings);
  const cycleNameText = currentCycleInfoObj.cycleName;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 p-5 sm:p-6 rounded-2xl text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-400 text-emerald-950 rounded-xl font-bold shadow-xs">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wide">
                  CHU KỲ
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-emerald-950 font-black text-xs uppercase shadow-xs">
                  {getCycleDescriptionShort(settings)}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100 mt-1">
                {cycleNameText || 'Chọn đợt & bấm trực tiếp từng Tab Ngày để xem / nhập nhanh tiền mủ'}
              </p>
            </div>
          </div>

          {/* Month / Year & Settings Link */}
          <div className="flex flex-wrap items-center gap-2 bg-emerald-950/40 p-2 rounded-xl border border-emerald-700/50">
            {onNavigateToTab && (
              <button
                onClick={() => onNavigateToTab('settings')}
                className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs transition flex items-center space-x-1 cursor-pointer shrink-0"
                title="Thay đổi loại chu kỳ tính tiền (10 ngày, 15 ngày, 30 ngày...)"
              >
                <span>⚙️ Cài đặt Loại chu kỳ tính tiền</span>
              </button>
            )}
            {/* Month dropdown */}
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(parseInt(e.target.value));
                setSelectedDayIdx(0);
              }}
              className="bg-emerald-900 text-white font-bold text-xs py-2 px-3 rounded-lg border border-emerald-600 focus:outline-none"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  Tháng {m}
                </option>
              ))}
            </select>

            {/* Year dropdown */}
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(parseInt(e.target.value));
                setSelectedDayIdx(0);
              }}
              className="bg-emerald-900 text-white font-bold text-xs py-2 px-3 rounded-lg border border-emerald-600 focus:outline-none"
            >
              {[2024, 2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>
                  Năm {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Cycle Selection Tabs */}
        <div 
          className="grid gap-2 mt-5"
          style={{ gridTemplateColumns: `repeat(${monthCycles.length}, minmax(0, 1fr))` }}
        >
          {monthCycles.map((cycleItem) => {
            const isSel = activeCycleNum === cycleItem.cycleNum;
            return (
              <button
                key={cycleItem.cycleNum}
                onClick={() => {
                  setSelectedCycleNum(cycleItem.cycleNum);
                  setSelectedDayIdx(0);
                }}
                className={`py-2.5 px-2 rounded-xl font-bold text-xs sm:text-sm transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                  isSel
                    ? 'bg-amber-400 text-emerald-950 shadow-md ring-2 ring-amber-300 font-black'
                    : 'bg-emerald-900/60 hover:bg-emerald-700 text-emerald-100 border border-emerald-700'
                }`}
              >
                <span>{cycleItem.label}</span>
                <span className="text-[10px] opacity-80 mt-0.5">Tháng {selectedMonth}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 10-DAY DAY TABS BAR (Tab Các Ngày Trong Chu Kỳ) */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase text-gray-800 dark:text-gray-200 flex items-center space-x-2">
            <CalendarDays className="w-4 h-4 text-emerald-600" />
            <span>TAB CÁC NGÀY TRONG {cycleNameText.toUpperCase()}</span>
          </h3>
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            Đã cạo: {totalTappingDaysCount} / {daysInCycle.length} ngày • Tổng: {formatVND(totalCycleMoney)}
          </span>
        </div>

        {/* Scrollable Horizontal Day Tabs */}
        <div className="flex space-x-2 overflow-x-auto pb-2 no-scrollbar">
          {daysInCycle.map((d, idx) => {
            const isSelected = idx === selectedDayIdx;
            const rec = cycleRecordsMap.get(d.dateStr);
            const isFilled = !!rec;

            return (
              <button
                key={d.dateStr}
                onClick={() => {
                  setSelectedDayIdx(idx);
                  setIsEditingFormOpen(true);
                }}
                className={`flex-shrink-0 min-w-[100px] sm:min-w-[115px] p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between space-y-1 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-md ring-2 ring-amber-400 scale-[1.02]'
                    : isFilled
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 hover:bg-emerald-100'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-xs font-black ${isSelected ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                    Ngày {d.dayNum < 10 ? '0' + d.dayNum : d.dayNum}
                  </span>
                  {isFilled && (
                    <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-300' : 'text-emerald-600'}`} />
                  )}
                </div>

                <div className="text-[11px] font-bold">
                  {isFilled ? (
                    <span className={isSelected ? 'text-amber-300 font-extrabold' : 'text-emerald-700 dark:text-emerald-400'}>
                      {formatVND(rec.dailyTotal)}
                    </span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500 italic">Nghỉ / Chưa cạo</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ACTIVE DAY INPUT & CALCULATION CARD (Hidden by default, shown when user clicks Edit / Nhập) */}
      {currentDayInfo && !isEditingFormOpen && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-gray-800 dark:text-gray-200">
            <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Đang chọn: <strong className="text-emerald-700 dark:text-emerald-400">Ngày {currentDayInfo.displayDate} ({currentDayInfo.fullDisplayDate})</strong></span>
            {existingRecordForDay ? (
              <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold text-[10px]">✓ Đã cạo ({formatVND(existingRecordForDay.dailyTotal)})</span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-900 text-gray-500 font-medium text-[10px]">Chưa cạo</span>
            )}
          </div>

          <button
            onClick={() => setIsEditingFormOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-extrabold text-xs transition shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-amber-300" />
            <span>{existingRecordForDay ? `Chỉnh sửa Ngày ${currentDayInfo.displayDate}` : `Nhập mủ Ngày ${currentDayInfo.displayDate}`}</span>
          </button>
        </div>
      )}

      {currentDayInfo && isEditingFormOpen && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md overflow-hidden animate-fade-in">
          {/* Card Title Bar */}
          <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-amber-300" />
              <h3 className="text-base font-black uppercase tracking-wide">
                NHẬP / CHỈNH SỬA NGÀY {currentDayInfo.displayDate}
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <div className="hidden sm:inline-flex items-center px-3 py-1 rounded-full bg-emerald-900 text-amber-300 text-xs font-extrabold border border-emerald-600">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-400" />
                {cycleNameText}
              </div>
              <button
                onClick={() => setIsEditingFormOpen(false)}
                className="px-3 py-1 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-amber-300 border border-emerald-600 font-bold text-xs flex items-center space-x-1 cursor-pointer transition"
                title="Đóng bảng chỉnh sửa"
              >
                <X className="w-4 h-4 text-amber-300" />
                <span>Ẩn / Đóng</span>
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-5">
            {savedSuccessMsg && (
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center space-x-2 border border-emerald-300">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{savedSuccessMsg}</span>
              </div>
            )}

            {tabValidationError && (
              <div className="p-3 bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-200 rounded-xl text-xs font-bold flex items-center justify-between border border-red-300 dark:border-red-800">
                <span>⚠️ {tabValidationError}</span>
                <button
                  type="button"
                  onClick={() => setTabValidationError('')}
                  className="p-1 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900 rounded-md cursor-pointer ml-2"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Section 1: Ngày & Giờ Cạo */}
            <div className="bg-gray-50 dark:bg-gray-900 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase text-gray-700 dark:text-gray-300 flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>1. Thời gian cạo mủ:</span>
                </label>
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 text-xs font-bold border border-amber-300">
                  {cycleNameText}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                    Ngày cạo:
                  </label>
                  <input
                    type="text"
                    disabled
                    value={currentDayInfo.fullDisplayDate}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-black text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Giờ cạo / trút mủ:</span>
                  </label>
                  <input
                    type="time"
                    value={harvestTime}
                    onChange={(e) => setHarvestTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Mủ Độ (Mủ Nước) */}
            <div className="bg-emerald-50/60 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase text-emerald-900 dark:text-emerald-300">
                  2. Mủ độ (Mủ nước)
                </h4>
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                  Thành tiền: {formatVND(degreeTotal)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Số ký (kg)
                  </label>
                  <NumericInput
                    decimal={true}
                    placeholder="51.9"
                    value={degreeWeight}
                    onChange={setDegreeWeight}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Độ mủ (DRC °)
                  </label>
                  <NumericInput
                    decimal={true}
                    placeholder="33.5"
                    value={degreeValue}
                    onChange={setDegreeValue}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Giá/độ (đ)
                  </label>
                  <NumericInput
                    decimal={false}
                    placeholder="350"
                    value={degreePrice}
                    onChange={setDegreePrice}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="text-[11px] text-gray-500 dark:text-gray-400 italic">
                Công thức: {numDegreeWeight || '0'} kg × {numDegreeValue || '0'}° × {numDegreePrice || '0'} đ = <strong className="text-emerald-700 dark:text-emerald-300">{formatVND(degreeTotal)}</strong>
              </div>
            </div>

            {/* Section 3: Mủ Chén (Mủ Kéo) */}
            <div className="bg-amber-50/60 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase text-amber-900 dark:text-amber-300">
                  3. Mủ chén (Mủ kéo)
                </h4>
                <span className="text-xs font-black text-amber-700 dark:text-amber-400">
                  Thành tiền: {formatVND(cupTotal)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Số ký (kg)
                  </label>
                  <NumericInput
                    decimal={true}
                    placeholder="24"
                    value={cupWeight}
                    onChange={setCupWeight}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Giá/kg (đ)
                  </label>
                  <NumericInput
                    decimal={false}
                    placeholder="18000"
                    value={cupPrice}
                    onChange={setCupPrice}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="text-[11px] text-gray-500 dark:text-gray-400 italic">
                Công thức: {numCupWeight || '0'} kg × {numCupPrice || '0'} đ = <strong className="text-amber-700 dark:text-amber-300">{formatVND(cupTotal)}</strong>
              </div>
            </div>

            {/* Section 4: Mủ Tạp (Mủ Dây, Mủ Đông) - TÁCH RIÊNG */}
            <div className="bg-orange-50/60 dark:bg-orange-950/20 p-4 rounded-xl border border-orange-200 dark:border-orange-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase text-orange-900 dark:text-orange-300">
                  4. Mủ tạp (Mủ dây, Mủ đông)
                </h4>
                <span className="text-xs font-black text-orange-700 dark:text-orange-400">
                  Thành tiền: {formatVND(scrapTotal)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Số ký mủ tạp (kg)
                  </label>
                  <NumericInput
                    decimal={true}
                    placeholder="10"
                    value={scrapWeight}
                    onChange={setScrapWeight}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Giá mủ tạp/kg (đ)
                  </label>
                  <NumericInput
                    decimal={false}
                    placeholder="15000"
                    value={scrapPrice}
                    onChange={setScrapPrice}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="text-[11px] text-gray-500 dark:text-gray-400 italic">
                Công thức: {numScrapWeight || '0'} kg × {numScrapPrice || '0'} đ = <strong className="text-orange-700 dark:text-orange-300">{formatVND(scrapTotal)}</strong>
              </div>
            </div>

            {/* Section 5: Total & Cumulative Banner */}
            <div className="bg-emerald-900 text-white p-4 rounded-xl space-y-2 shadow-inner">
              <div className="flex items-center justify-between border-b border-emerald-800 pb-2">
                <span className="text-xs uppercase font-bold text-emerald-200">
                  5. Tổng tiền ngày
                </span>
                <span className="text-xl sm:text-2xl font-black text-amber-300">
                  {formatVND(dailyTotal)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-semibold text-emerald-100 flex items-center space-x-1">
                  <Info className="w-3.5 h-3.5 text-amber-300" />
                  <span>Ước tính cộng dồn đợt này:</span>
                </span>
                <span className="text-sm font-bold text-white">
                  {formatVND(currentCycleCumulative)}
                </span>
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Ghi chú ngày cạo (Không bắt buộc)
              </label>
              <input
                type="text"
                placeholder="VD: Cạo muộn, thời tiết âm u..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
              <button
                type="button"
                onClick={() => handleSaveCurrentDay(false)}
                className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center space-x-2"
              >
                <Check className="w-4 h-4 text-amber-300" />
                <span>Lưu Ngày {currentDayInfo.displayDate}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveCurrentDay(true)}
                className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-emerald-950 font-black text-xs shadow-md transition flex items-center justify-center space-x-2"
              >
                <span>Lưu & Chuyển Sang Ngày Tiếp</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {existingRecordForDay && (
                <button
                  type="button"
                  onClick={handleDeleteCurrentDay}
                  className="w-full sm:w-auto py-3 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs border border-red-200 transition flex items-center justify-center"
                  title="Xóa dữ liệu ngày này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUMMARY TABLE / MOBILE CARDS OF THE CYCLE */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3 gap-3">
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <span>BẢNG TỔNG HỢP CỘNG DỒN {cycleNameText.toUpperCase()}</span>
          </h3>

          {/* View Mode Toggle Switch */}
          <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold shrink-0">
            <button
              onClick={() => setSummaryViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 cursor-pointer ${
                summaryViewMode === 'cards'
                  ? 'bg-amber-400 text-emerald-950 font-black shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>📱 Dạng thẻ Mobile (Mặc định)</span>
            </button>
            <button
              onClick={() => setSummaryViewMode('table')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 cursor-pointer ${
                summaryViewMode === 'table'
                  ? 'bg-emerald-700 text-white font-black shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>📊 Dạng bảng</span>
            </button>
          </div>
        </div>

        {/* View Mode 1: Mobile Cards Grid (DEFAULT) */}
        {summaryViewMode === 'cards' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {(() => {
              let runningSum = 0;
              return daysInCycle.map((d, i) => {
                const rec = cycleRecordsMap.get(d.dateStr);
                if (rec) {
                  runningSum += rec.dailyTotal;
                }
                const isCur = i === selectedDayIdx;

                return (
                  <div
                    key={d.dateStr}
                    onClick={() => setSelectedDayIdx(i)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 relative overflow-hidden ${
                      isCur
                        ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-400 shadow-md ring-2 ring-amber-400/80'
                        : rec
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                        : 'bg-gray-50/60 dark:bg-gray-900/60 border-gray-200 dark:border-gray-800 opacity-80 hover:opacity-100'
                    }`}
                  >
                    {/* Top Row: Day STT & Date */}
                    <div className="flex items-center justify-between border-b border-gray-200/60 dark:border-gray-700/60 pb-2">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="w-6 h-6 rounded-lg bg-emerald-700 text-white text-[11px] font-black flex items-center justify-center shrink-0">
                          #{i + 1}
                        </span>
                        <span className="font-extrabold text-sm text-gray-900 dark:text-white">
                          Ngày {d.dayNum < 10 ? '0' + d.dayNum : d.dayNum} ({d.displayDate})
                        </span>
                        {rec && (
                          <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-200 font-bold px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700/80">
                            🌳 {rec.farmName || settings.rubberFieldName || 'Chưa đặt tên'}
                          </span>
                        )}
                      </div>
                      {rec ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 font-bold text-[10px] uppercase border border-emerald-300 dark:border-emerald-700">
                          ✓ Đã Cạo
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold text-[10px]">
                          Nghỉ / Chưa cạo
                        </span>
                      )}
                    </div>

                    {/* Card Content Grid */}
                    <div className="space-y-1.5 text-xs">
                      {/* Mủ nước */}
                      <div className="flex items-center justify-between text-gray-700 dark:text-gray-300">
                        <span>💧 Mủ nước (TSC):</span>
                        <span className="font-bold">
                          {rec && rec.degreeLatex.weight > 0 ? (
                            `${formatWeight(rec.degreeLatex.weight)} × ${formatDegree(rec.degreeLatex.degree)}°`
                          ) : (
                            <span className="text-gray-400 font-normal">-</span>
                          )}
                        </span>
                      </div>

                      {/* Mủ chén */}
                      <div className="flex items-center justify-between text-gray-700 dark:text-gray-300">
                        <span>🍵 Mủ chén:</span>
                        <span className="font-bold">
                          {rec && rec.cupLatex.weight > 0 ? (
                            `${formatWeight(rec.cupLatex.weight)}`
                          ) : (
                            <span className="text-gray-400 font-normal">-</span>
                          )}
                        </span>
                      </div>

                      {/* Mủ tạp */}
                      <div className="flex items-center justify-between text-gray-700 dark:text-gray-300">
                        <span>📦 Mủ tạp:</span>
                        <span className="font-bold">
                          {rec && rec.scrapLatex && rec.scrapLatex.weight > 0 ? (
                            `${formatWeight(rec.scrapLatex.weight)}`
                          ) : (
                            <span className="text-gray-400 font-normal">-</span>
                          )}
                        </span>
                      </div>

                      {/* Tiền ngày */}
                      <div className="flex items-center justify-between pt-1 border-t border-dashed border-gray-200 dark:border-gray-700">
                        <span className="font-bold text-gray-800 dark:text-gray-200">💰 Thu nhập ngày:</span>
                        <span className="font-black text-sm text-emerald-700 dark:text-emerald-400">
                          {rec ? formatVND(rec.dailyTotal) : '0 đ'}
                        </span>
                      </div>

                      {/* Cộng dồn đợt */}
                      <div className="flex items-center justify-between bg-emerald-800/10 dark:bg-emerald-900/40 p-2 rounded-xl">
                        <span className="font-bold text-amber-900 dark:text-amber-300">⚡ Cộng dồn đợt:</span>
                        <span className="font-black text-sm text-amber-800 dark:text-amber-300">
                          {rec ? formatVND(runningSum) : '-'}
                        </span>
                      </div>
                    </div>

                    {/* Footer Action */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDayIdx(i);
                        setIsEditingFormOpen(true);
                      }}
                      className="w-full py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition flex items-center justify-center space-x-1"
                    >
                      <span>{rec ? '✏️ Xem / Chỉnh sửa ngày này' : '➕ Nhập mủ ngày này'}</span>
                    </button>
                  </div>
                );
              });
            })()}
          </div>
        ) : (
          /* View Mode 2: Table Format */
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-bold uppercase border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="py-2.5 px-3">STT</th>
                  <th className="py-2.5 px-3">Ngày</th>
                  <th className="py-2.5 px-3">Mủ độ (kg × ° × Giá)</th>
                  <th className="py-2.5 px-3">Mủ chén (kg × Giá)</th>
                  <th className="py-2.5 px-3">Mủ tạp (kg × Giá)</th>
                  <th className="py-2.5 px-3 text-right">Tiền ngày</th>
                  <th className="py-2.5 px-3 text-right">Cộng dồn đợt</th>
                  <th className="py-2.5 px-3 text-center">Nhập / Sửa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {(() => {
                  let runningSum = 0;
                  return daysInCycle.map((d, i) => {
                    const rec = cycleRecordsMap.get(d.dateStr);
                    if (rec) {
                      runningSum += rec.dailyTotal;
                    }
                    const isCur = i === selectedDayIdx;

                    return (
                      <tr
                        key={d.dateStr}
                        onClick={() => setSelectedDayIdx(i)}
                        className={`cursor-pointer transition-colors ${
                          isCur
                            ? 'bg-amber-50/80 dark:bg-amber-950/30 font-bold'
                            : rec
                            ? 'hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-400'
                        }`}
                      >
                        <td className="py-3 px-3 font-medium">#{i + 1}</td>
                        <td className="py-3 px-3 font-bold text-gray-900 dark:text-white">
                          {d.displayDate}
                        </td>
                        <td className="py-3 px-3">
                          {rec && rec.degreeLatex.weight > 0 ? (
                            <span>
                              {formatWeight(rec.degreeLatex.weight)} kg × {formatDegree(rec.degreeLatex.degree)}°
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {rec && rec.cupLatex.weight > 0 ? (
                            <span>{formatWeight(rec.cupLatex.weight)} kg</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {rec && rec.scrapLatex && rec.scrapLatex.weight > 0 ? (
                            <span>{formatWeight(rec.scrapLatex.weight)} kg</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-800 dark:text-emerald-400">
                          {rec ? formatVND(rec.dailyTotal) : '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-amber-800 dark:text-amber-300">
                          {rec ? formatVND(runningSum) : '-'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDayIdx(i);
                              setIsEditingFormOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[11px] hover:bg-emerald-200 cursor-pointer"
                          >
                            {rec ? 'Sửa' : 'Nhập'}
                          </button>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
