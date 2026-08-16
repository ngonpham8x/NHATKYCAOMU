import { HarvestRecord, Settings } from '../types';
import { calculateCumulativeTotals, getTodayDateStr } from './calculations';

// Centralized LocalStorage Constants
export const RECORDS_STORAGE_KEY = 'rubber_latex_records_v1';
export const SETTINGS_STORAGE_KEY = 'rubber_latex_settings_v1';

export const DEFAULT_SETTINGS: Settings = {
  defaultDegreePrice: 350, // 350 đ/độ/kg
  defaultCupPrice: 18000, // 18.000 đ/kg mủ chén
  defaultScrapPrice: 15000, // 15.000 đ/kg mủ tạp
  theme: 'light',
  rubberFieldName: '',
  ownerName: 'Phạm Duy Ngôn',
  farmsList: [],
};

export function loadSettings(): Settings {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.ownerName || parsed.ownerName === 'Nông Dân Cạo Mủ') {
        parsed.ownerName = 'Phạm Duy Ngôn';
      }
      if (!Array.isArray(parsed.farmsList)) {
        parsed.farmsList = [];
      }
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load settings from localStorage', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: Settings): void {
  try {
    const serialized = JSON.stringify(settings);
    localStorage.setItem(SETTINGS_STORAGE_KEY, serialized);
  } catch (e) {
    console.error('Failed to save settings to localStorage', e);
  }
}

export function loadRecords(currentSettings?: Settings): HarvestRecord[] {
  try {
    const saved = localStorage.getItem(RECORDS_STORAGE_KEY);
    if (saved) {
      const parsed: HarvestRecord[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return calculateCumulativeTotals(parsed, currentSettings);
      }
    }
  } catch (e) {
    console.error('Failed to load records from localStorage', e);
  }
  return [];
}

export function saveRecords(records: HarvestRecord[], currentSettings?: Settings): HarvestRecord[] {
  try {
    const recalculated = calculateCumulativeTotals(records, currentSettings);
    const serialized = JSON.stringify(recalculated);
    localStorage.setItem(RECORDS_STORAGE_KEY, serialized);
    return recalculated;
  } catch (e) {
    console.error('Failed to save records to localStorage', e);
    return calculateCumulativeTotals(records, currentSettings);
  }
}

/**
 * Generate sample realistic rubber harvest records for testing.
 * Generates data for the current month and previous month so all cycles, cumulative figures,
 * and yearly summaries can be visualized immediately!
 */
export function generateSampleData(): HarvestRecord[] {
  const records: HarvestRecord[] = [];
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed

  // Helper to generate entries for a specific year and month
  const addMonthData = (year: number, monthIndex: number) => {
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    // Tapping schedule e.g., d1 d2 nghỉ d3 (cạo 2 ngày nghỉ 1 ngày or daily with rainy days)
    for (let day = 1; day <= daysInMonth; day++) {
      // Don't generate future days in current month
      if (year === currentYear && monthIndex === currentMonth && day > today.getDate()) {
        continue;
      }

      // Skip roughly 1 out of 4 days for rain / rest day
      if ((day % 4 === 0) && day !== 1) {
        continue;
      }

      const pad = (n: number) => n.toString().padStart(2, '0');
      const dateStr = `${year}-${pad(monthIndex + 1)}-${pad(day)}`;

      // Realistic latex variations
      // Mủ độ: 40-65 kg, degree 30.5 - 34.5, price ~ 340-360 đ
      const degreeWeight = Math.round((42 + Math.sin(day) * 12 + Math.random() * 8) * 10) / 10;
      const degreeVal = Math.round((31 + Math.cos(day) * 2 + Math.random() * 1.5) * 10) / 10;
      const degreePrice = 350;
      const degreeTotal = Math.round(degreeWeight * degreeVal * degreePrice);

      // Mủ chén: 15-30 kg, price ~ 18,000 đ
      const cupWeight = Math.round((18 + Math.cos(day * 2) * 6 + Math.random() * 4) * 10) / 10;
      const cupPrice = 18000;
      const cupTotal = Math.round(cupWeight * cupPrice);

      // Mủ tạp: 5-15 kg, price ~ 15,000 đ
      const scrapWeight = Math.round((6 + Math.sin(day * 1.5) * 3 + Math.random() * 3) * 10) / 10;
      const scrapPrice = 15000;
      const scrapTotal = Math.round(scrapWeight * scrapPrice);

      const dailyTotal = degreeTotal + cupTotal + scrapTotal;

      const notes = [
        'Thời tiết đẹp, mủ chảy đều',
        'Mủ trong, độ khá cao',
        'Cạo sáng sớm, sương mù nhẹ',
        'Lô A - cây cho mủ tốt',
        'Mủ dẻo, chén đầy',
        '',
      ];
      const note = notes[Math.floor(Math.random() * notes.length)];

      records.push({
        id: `sample-${dateStr}-${Math.random().toString(36).substring(2, 7)}`,
        date: dateStr,
        time: '05:30',
        degreeLatex: {
          weight: degreeWeight,
          degree: degreeVal,
          pricePerDegree: degreePrice,
          total: degreeTotal,
        },
        cupLatex: {
          weight: cupWeight,
          pricePerKg: cupPrice,
          total: cupTotal,
        },
        scrapLatex: {
          weight: scrapWeight,
          pricePerKg: scrapPrice,
          total: scrapTotal,
        },
        dailyTotal,
        note,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  // Add data for current month and previous month
  const prevMonthIndex = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  addMonthData(prevYear, prevMonthIndex);
  addMonthData(currentYear, currentMonth);

  return calculateCumulativeTotals(records);
}

/**
 * Export data as JSON file download
 */
export function exportToJSON(records: HarvestRecord[], settings: Settings): void {
  const data = {
    appName: 'Tính Tiền Mủ Cao Su',
    exportDate: new Date().toISOString(),
    version: '1.0',
    settings,
    records,
  };

  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  const dateStr = getTodayDateStr().replace(/-/g, '');
  link.download = `sao_luu_mu_cao_su_${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Safari/iOS may start the download asynchronously; revoking immediately
  // can cancel the download before the browser has consumed the blob.
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * Parse imported JSON file with robust schema and type validation
 */
export async function importFromJSON(file: File): Promise<{ records: HarvestRecord[]; settings?: Settings }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        let candidateRecords: any[] = [];
        let settings: Settings | undefined = undefined;

        if (Array.isArray(parsed)) {
          candidateRecords = parsed;
        } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.records)) {
          candidateRecords = parsed.records;
          if (parsed.settings && typeof parsed.settings === 'object') {
            settings = { ...DEFAULT_SETTINGS, ...parsed.settings };
          }
        } else {
          throw new Error('Định dạng file sao lưu không đúng chuẩn JSON của ứng dụng.');
        }

        // Validate each candidate record to ensure integrity
        const validRecords: HarvestRecord[] = candidateRecords
          .filter((item) => {
            return (
              item &&
              typeof item === 'object' &&
              typeof item.date === 'string' &&
              item.date.match(/^\d{4}-\d{2}-\d{2}$/)
            );
          })
          .map((item, idx) => {
            const dateStr = item.date;
            const id = typeof item.id === 'string' && item.id ? item.id : `imported-${dateStr}-${idx}-${Date.now()}`;
            const time = typeof item.time === 'string' ? item.time : '05:30';
            const farmName = typeof item.farmName === 'string' ? item.farmName : '';
            const tapperName = typeof item.tapperName === 'string' ? item.tapperName : '';
            const note = typeof item.note === 'string' ? item.note : '';

            const degWeight = typeof item.degreeLatex?.weight === 'number' && !isNaN(item.degreeLatex.weight) && item.degreeLatex.weight >= 0 ? item.degreeLatex.weight : 0;
            const degVal = typeof item.degreeLatex?.degree === 'number' && !isNaN(item.degreeLatex.degree) && item.degreeLatex.degree >= 0 ? item.degreeLatex.degree : 0;
            const degPrice = typeof item.degreeLatex?.pricePerDegree === 'number' && !isNaN(item.degreeLatex.pricePerDegree) && item.degreeLatex.pricePerDegree >= 0 ? item.degreeLatex.pricePerDegree : (settings?.defaultDegreePrice || 350);
            const degTotal = Math.round(degWeight * degVal * degPrice);

            const cupWeight = typeof item.cupLatex?.weight === 'number' && !isNaN(item.cupLatex.weight) && item.cupLatex.weight >= 0 ? item.cupLatex.weight : 0;
            const cupPrice = typeof item.cupLatex?.pricePerKg === 'number' && !isNaN(item.cupLatex.pricePerKg) && item.cupLatex.pricePerKg >= 0 ? item.cupLatex.pricePerKg : (settings?.defaultCupPrice || 18000);
            const cupTotal = Math.round(cupWeight * cupPrice);

            const scrapWeight = typeof item.scrapLatex?.weight === 'number' && !isNaN(item.scrapLatex.weight) && item.scrapLatex.weight >= 0 ? item.scrapLatex.weight : 0;
            const scrapPrice = typeof item.scrapLatex?.pricePerKg === 'number' && !isNaN(item.scrapLatex.pricePerKg) && item.scrapLatex.pricePerKg >= 0 ? item.scrapLatex.pricePerKg : (settings?.defaultScrapPrice || 15000);
            const scrapTotal = Math.round(scrapWeight * scrapPrice);

            const dailyTotal = degTotal + cupTotal + scrapTotal;

            return {
              id,
              date: dateStr,
              time,
              farmName,
              tapperName,
              degreeLatex: {
                weight: degWeight,
                degree: degVal,
                pricePerDegree: degPrice,
                total: degTotal,
              },
              cupLatex: {
                weight: cupWeight,
                pricePerKg: cupPrice,
                total: cupTotal,
              },
              scrapLatex: {
                weight: scrapWeight,
                pricePerKg: scrapPrice,
                total: scrapTotal,
              },
              dailyTotal,
              note,
              createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as HarvestRecord;
          });

        const calculated = calculateCumulativeTotals(validRecords, settings);
        resolve({ records: calculated, settings });
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Không thể đọc file JSON'));
      }
    };
    reader.onerror = () => reject(new Error('Lỗi khi đọc file'));
    reader.readAsText(file);
  });
}
