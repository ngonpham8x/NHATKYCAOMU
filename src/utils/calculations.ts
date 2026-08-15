import { HarvestRecord, CycleInfo, CycleSummary, Settings } from '../types';

/**
 * Get days in month for a given year and 0-indexed month
 */
/**
 * Get days in month for a given year and 0-indexed month
 */
export function getDaysInMonth(year: number, monthZeroIndexed: number): number {
  if (isNaN(year) || isNaN(monthZeroIndexed)) return 30;
  const d = new Date(year, monthZeroIndexed + 1, 0).getDate();
  return isNaN(d) || d < 28 || d > 31 ? 30 : d;
}

/**
 * Returns a short description label for the active payment cycle setting.
 */
export function getCycleDescriptionShort(settings?: Settings): string {
  const type = settings?.paymentCycleType || 'fixed_10';
  const days = settings?.paymentCycleDays || 10;
  const customTitle = settings?.customCycleName;

  if (customTitle) {
    return customTitle;
  }

  if (type === 'fixed_15') {
    return 'Chu kỳ 15 ngày (2 đợt/tháng)';
  }
  if (type === 'fixed_30') {
    return 'Chu kỳ 30 ngày (Cả tháng)';
  }
  if (type === 'custom') {
    return `Chu kỳ tùy chỉnh (${days} ngày/đợt)`;
  }
  return 'Chu kỳ 10 ngày (3 đợt/tháng)';
}

/**
 * Returns full detailed description of the cycle configuration for guides & banners.
 */
export function getCycleDescriptionFull(settings?: Settings): string {
  const type = settings?.paymentCycleType || 'fixed_10';
  const days = settings?.paymentCycleDays || 10;
  const customTitle = settings?.customCycleName || '';

  let detail = '';
  if (type === 'fixed_15') {
    detail = 'Chu kỳ 15 ngày/đợt (Chia 2 đợt/tháng: Đợt 1 từ ngày 01-15, Đợt 2 từ ngày 16 đến cuối tháng)';
  } else if (type === 'fixed_30') {
    detail = 'Chu kỳ 30 ngày/đợt (Thanh toán gộp toàn bộ tháng 1 lần từ ngày 01 đến cuối tháng)';
  } else if (type === 'custom') {
    detail = `Chu kỳ tùy chỉnh ${days} ngày/đợt (Mỗi đợt cạo gồm ${days} ngày)`;
  } else {
    detail = 'Chu kỳ 10 ngày/đợt (Chia 3 đợt/tháng: Đợt 1 từ ngày 01-10, Đợt 2 từ ngày 11-20, Đợt 3 từ ngày 21 đến cuối tháng)';
  }

  return customTitle ? `${customTitle} (${detail})` : detail;
}

export interface MonthCycleRange {
  cycleNum: number;
  startDay: number;
  endDay: number;
  label: string;
  cycleName: string;
}

/**
 * Returns the list of cycles for a specific month and year according to settings.
 */
export function getCyclesForMonth(year: number, month: number, settings?: Settings): MonthCycleRange[] {
  const validYear = isNaN(year) ? new Date().getFullYear() : year;
  const validMonth = isNaN(month) ? new Date().getMonth() + 1 : Math.min(Math.max(month, 1), 12);
  const daysInMonth = getDaysInMonth(validYear, validMonth - 1);
  const type = settings?.paymentCycleType || 'fixed_10';
  const customDays = settings?.paymentCycleDays || 10;
  const customTitle = settings?.customCycleName || '';

  const pad = (n: number) => (isNaN(n) ? '01' : n < 10 ? `0${n}` : `${n}`);

  if (type === 'fixed_15') {
    return [
      {
        cycleNum: 1,
        startDay: 1,
        endDay: 15,
        label: `Đợt 1 (01 - 15)`,
        cycleName: customTitle ? `${customTitle} - Đợt 1 (01 - 15/T${validMonth})` : `Đợt 1 (01 - 15/Tháng ${validMonth})`,
      },
      {
        cycleNum: 2,
        startDay: 16,
        endDay: daysInMonth,
        label: `Đợt 2 (16 - ${daysInMonth})`,
        cycleName: customTitle ? `${customTitle} - Đợt 2 (16 - ${daysInMonth}/T${validMonth})` : `Đợt 2 (16 - ${daysInMonth}/Tháng ${validMonth})`,
      },
    ];
  }

  if (type === 'fixed_30') {
    return [
      {
        cycleNum: 1,
        startDay: 1,
        endDay: daysInMonth,
        label: `Cả Tháng (01 - ${daysInMonth})`,
        cycleName: customTitle ? `${customTitle} (Tháng ${validMonth})` : `Thanh toán Tháng ${validMonth} (01 - ${daysInMonth})`,
      },
    ];
  }

  if (type === 'custom' && customDays > 0) {
    const count = Math.ceil(daysInMonth / customDays);
    const result: MonthCycleRange[] = [];
    for (let i = 1; i <= count; i++) {
      const startDay = (i - 1) * customDays + 1;
      let endDay = Math.min(i * customDays, daysInMonth);
      if (i === count) endDay = daysInMonth;
      result.push({
        cycleNum: i,
        startDay,
        endDay,
        label: `Đợt ${i} (${pad(startDay)} - ${pad(endDay)})`,
        cycleName: customTitle
          ? `${customTitle} (Đợt ${i}: ${pad(startDay)} - ${pad(endDay)}/T${validMonth})`
          : `Đợt ${i} (${pad(startDay)} - ${pad(endDay)}/Tháng ${validMonth})`,
      });
    }
    return result;
  }

  // Default fixed_10
  return [
    {
      cycleNum: 1,
      startDay: 1,
      endDay: 10,
      label: `Đợt 1 (01 - 10)`,
      cycleName: customTitle ? `${customTitle} - Đợt 1 (01 - 10/T${validMonth})` : `Đợt 1 (01 - 10/Tháng ${validMonth})`,
    },
    {
      cycleNum: 2,
      startDay: 11,
      endDay: 20,
      label: `Đợt 2 (11 - 20)`,
      cycleName: customTitle ? `${customTitle} - Đợt 2 (11 - 20/T${validMonth})` : `Đợt 2 (11 - 20/Tháng ${validMonth})`,
    },
    {
      cycleNum: 3,
      startDay: 21,
      endDay: daysInMonth,
      label: `Đợt 3 (21 - ${daysInMonth})`,
      cycleName: customTitle ? `${customTitle} - Đợt 3 (21 - ${daysInMonth}/T${validMonth})` : `Đợt 3 (21 - ${daysInMonth}/Tháng ${validMonth})`,
    },
  ];
}

/**
 * Determine which cycle a given YYYY-MM-DD date belongs to based on plantation settings
 */
export function getCycleInfo(dateStr?: string, settings?: Settings): CycleInfo {
  let year = new Date().getFullYear();
  let month = new Date().getMonth() + 1;
  let day = new Date().getDate();

  if (dateStr && typeof dateStr === 'string') {
    const cleanStr = dateStr.trim();
    if (cleanStr.includes('-')) {
      const parts = cleanStr.split('-');
      if (parts.length >= 3) {
        const p0 = parseInt(parts[0], 10);
        const p1 = parseInt(parts[1], 10);
        const p2 = parseInt(parts[2], 10);
        if (!isNaN(p0) && !isNaN(p1) && !isNaN(p2)) {
          year = p0;
          month = Math.min(Math.max(p1, 1), 12);
          day = Math.min(Math.max(p2, 1), 31);
        }
      }
    } else if (cleanStr.includes('/')) {
      const parts = cleanStr.split('/');
      if (parts.length >= 3) {
        const p0 = parseInt(parts[0], 10);
        const p1 = parseInt(parts[1], 10);
        const p2 = parseInt(parts[2], 10);
        if (p2 > 1000) {
          day = Math.min(Math.max(p0, 1), 31);
          month = Math.min(Math.max(p1, 1), 12);
          year = p2;
        } else if (p0 > 1000) {
          year = p0;
          month = Math.min(Math.max(p1, 1), 12);
          day = Math.min(Math.max(p2, 1), 31);
        }
      }
    }
  }

  const monthCycles = getCyclesForMonth(year, month, settings);
  const matched = (monthCycles && monthCycles.length > 0)
    ? (monthCycles.find((c) => day >= c.startDay && day <= c.endDay) || monthCycles[monthCycles.length - 1])
    : {
        cycleNum: 1,
        startDay: 1,
        endDay: 10,
        label: 'Đợt 1',
        cycleName: `Đợt 1 (Tháng ${month})`,
      };

  const pad = (n: number) => (isNaN(n) ? '01' : n < 10 ? `0${n}` : `${n}`);
  const startDate = `${year}-${pad(month)}-${pad(matched.startDay || 1)}`;
  const endDate = `${year}-${pad(month)}-${pad(matched.endDay || 10)}`;
  const key = `${year}-${pad(month)}-C${matched.cycleNum || 1}`;

  return {
    year,
    month,
    cycleNum: matched.cycleNum || 1,
    cycleName: matched.cycleName || `Đợt 1 (Tháng ${month})`,
    startDate,
    endDate,
    key,
  };
}

/**
 * Recalculate cumulative totals for all records based on configured cycle rules.
 */
export function calculateCumulativeTotals(records: HarvestRecord[], settings?: Settings): HarvestRecord[] {
  // Sort all records chronologically first
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));

  // Group by cycle key
  const cycleGroups: { [key: string]: HarvestRecord[] } = {};

  sorted.forEach((record) => {
    const cycle = getCycleInfo(record.date, settings);
    if (!cycleGroups[cycle.key]) {
      cycleGroups[cycle.key] = [];
    }
    cycleGroups[cycle.key].push(record);
  });

  // Calculate cumulative for each cycle independently
  const processedRecords: HarvestRecord[] = [];

  Object.values(cycleGroups).forEach((groupRecords) => {
    let runningSum = 0;
    groupRecords.forEach((record) => {
      runningSum += record.dailyTotal;
      processedRecords.push({
        ...record,
        cumulativeTotal: Math.round(runningSum),
      });
    });
  });

  // Return sorted descending by date for display (newest first)
  return processedRecords.sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Summarize records into Cycle objects (for Tab "Lưu chu kỳ")
 */
export function summarizeCycles(records: HarvestRecord[], settings?: Settings): CycleSummary[] {
  const processed = calculateCumulativeTotals(records, settings);
  const map: { [key: string]: CycleSummary } = {};

  processed.forEach((rec) => {
    const info = getCycleInfo(rec.date, settings);
    if (!map[info.key]) {
      map[info.key] = {
        ...info,
        records: [],
        tappingDaysCount: 0,
        totalDegreeWeight: 0,
        totalDegreeMoney: 0,
        totalCupWeight: 0,
        totalCupMoney: 0,
        totalScrapWeight: 0,
        totalScrapMoney: 0,
        totalEarning: 0,
        avgDailyEarning: 0,
      };
    }

    const c = map[info.key];
    c.records.push(rec);
    c.tappingDaysCount += 1;
    c.totalDegreeWeight += rec.degreeLatex.weight;
    c.totalDegreeMoney += rec.degreeLatex.total;
    c.totalCupWeight += rec.cupLatex.weight;
    c.totalCupMoney += rec.cupLatex.total;
    c.totalScrapWeight = (c.totalScrapWeight || 0) + (rec.scrapLatex?.weight || 0);
    c.totalScrapMoney = (c.totalScrapMoney || 0) + (rec.scrapLatex?.total || 0);
    c.totalEarning += rec.dailyTotal;
  });

  // Finalize averages and sort records ascending inside cycles
  const result = Object.values(map).map((cycle) => {
    cycle.records.sort((a, b) => a.date.localeCompare(b.date));
    cycle.avgDailyEarning = cycle.tappingDaysCount > 0 
      ? Math.round(cycle.totalEarning / cycle.tappingDaysCount) 
      : 0;
    return cycle;
  });

  // Sort cycles descending by key (newest cycle first)
  return result.sort((a, b) => b.key.localeCompare(a.key));
}

/**
 * Safely parse a Vietnamese/international decimal string (for kg weights, DRC degrees)
 * Handles "55.5", "55,5", " 45,2 ", etc. Strictly non-negative.
 */
export function parseVietnameseDecimal(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return isNaN(value) || value < 0 ? 0 : value;
  
  let str = value.toString().trim();
  if (!str) return 0;

  // Remove all characters except digits, dots, and commas (no negative numbers)
  str = str.replace(/[^0-9.,]/g, '');
  if (!str) return 0;

  const hasDot = str.includes('.');
  const hasComma = str.includes(',');

  if (hasDot && hasComma) {
    const lastDot = str.lastIndexOf('.');
    const lastComma = str.lastIndexOf(',');
    if (lastDot < lastComma) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (hasComma) {
    str = str.replace(',', '.');
  }

  const result = parseFloat(str);
  return isNaN(result) || result < 0 ? 0 : result;
}

/**
 * Safely parse a Vietnamese currency / price string
 * Handles prices like "18000", "18.000", "18,000", "350", "18 000 đ". Strictly non-negative.
 */
export function parseVietnamesePrice(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return isNaN(value) || value < 0 ? 0 : Math.round(value);

  let str = value.toString().trim();
  if (!str) return 0;

  str = str.replace(/[^0-9.,]/g, '');
  if (!str) return 0;

  const hasDot = str.includes('.');
  const hasComma = str.includes(',');

  if (hasDot && hasComma) {
    const lastDot = str.lastIndexOf('.');
    const lastComma = str.lastIndexOf(',');
    if (lastDot < lastComma) {
      str = str.replace(/\./g, '').split(',')[0];
    } else {
      str = str.replace(/,/g, '').split('.')[0];
    }
  } else if (hasDot) {
    const parts = str.split('.');
    if (parts.length > 2) {
      str = str.replace(/\./g, '');
    } else if (parts.length === 2) {
      if (parts[1].length === 3) {
        str = parts[0] + parts[1];
      } else {
        const num = parseFloat(str);
        return isNaN(num) || num < 0 ? 0 : num;
      }
    }
  } else if (hasComma) {
    const parts = str.split(',');
    if (parts.length > 2) {
      str = str.replace(/,/g, '');
    } else if (parts.length === 2) {
      if (parts[1].length === 3) {
        str = parts[0] + parts[1];
      } else {
        const num = parseFloat(str.replace(',', '.'));
        return isNaN(num) || num < 0 ? 0 : num;
      }
    }
  }

  const result = parseFloat(str);
  return isNaN(result) || result < 0 ? 0 : result;
}

/**
 * Format Currency in Vietnamese (e.g. 1.250.000 đ)
 */
export function formatVND(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 đ';
  const rounded = Math.round(amount);
  return new Intl.NumberFormat('vi-VN').format(rounded) + ' đ';
}

/**
 * Format weight in kg (e.g. 45.5 kg or 45 kg)
 */
export function formatWeight(kg: number | undefined | null): string {
  if (kg === undefined || kg === null || isNaN(kg)) return '0 kg';
  return (
    new Intl.NumberFormat('vi-VN', {
      maximumFractionDigits: 2,
    }).format(kg) + ' kg'
  );
}

/**
 * Format latex degree (e.g. 32.5°)
 */
export function formatDegree(deg: number | undefined | null): string {
  if (deg === undefined || deg === null || isNaN(deg)) return '0°';
  return (
    new Intl.NumberFormat('vi-VN', {
      maximumFractionDigits: 1,
    }).format(deg) + '°'
  );
}

/**
 * Format YYYY-MM-DD to DD/MM/YYYY
 */
export function formatDateVN(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Get Today's date string YYYY-MM-DD
 */
export function getTodayDateStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}
