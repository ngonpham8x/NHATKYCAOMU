export interface HarvestRecord {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm (e.g. "05:30")
  farmName?: string; // Tên lô / vườn cao su hoặc thợ cạo (VD: "Vườn Lô 1", "Vườn Bãi Bồi", "Thợ Cạo A")
  degreeLatex: {
    weight: number; // kg mủ nước
    degree: number; // độ mủ (TSC / DRC)
    pricePerDegree: number; // đ/độ/kg
    total: number; // weight * degree * pricePerDegree
  };
  cupLatex: {
    weight: number; // kg mủ chén
    pricePerKg: number; // đ/kg mủ chén
    total: number; // weight * pricePerKg
  };
  scrapLatex?: {
    weight: number; // kg mủ tạp / mủ dây
    pricePerKg: number; // đ/kg mủ tạp
    total: number; // weight * pricePerKg
  };
  dailyTotal: number; // degreeLatex.total + cupLatex.total + (scrapLatex?.total || 0)
  cumulativeTotal?: number; // Computed cumulative total within cycle up to this date
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CycleInfo {
  year: number;
  month: number; // 1-12
  cycleNum: number;
  cycleName: string; // "Đợt 1 (01 - 10)", "Đợt 2 (11 - 20)", etc.
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  key: string; // "YYYY-MM-C1", "YYYY-MM-C2", etc.
}

export interface CycleSummary extends CycleInfo {
  records: HarvestRecord[];
  tappingDaysCount: number;
  totalDegreeWeight: number;
  totalDegreeMoney: number;
  totalCupWeight: number;
  totalCupMoney: number;
  totalScrapWeight?: number;
  totalScrapMoney?: number;
  totalEarning: number;
  avgDailyEarning: number;
}

export interface Settings {
  defaultDegreePrice: number; // Default price per degree (e.g., 350 đ)
  defaultCupPrice: number; // Default price per kg cup lump (e.g., 18500 đ)
  defaultScrapPrice?: number; // Default price per kg scrap latex (e.g., 15000 đ)
  theme: 'light' | 'dark' | 'system';
  rubberFieldName?: string; // Tên lô / vườn cao su
  ownerName?: string; // Tên chủ vườn / người cạo
  farmsList?: string[]; // Danh sách tên vườn hoặc thợ cạo đã lưu
  rubberArea?: string; // Diện tích vườn (VD: 2.5 Héc-ta)
  ownerPhone?: string; // Số điện thoại liên hệ
  // Cấu hình Chu kỳ nhận tiền của chủ vườn (Mỗi vườn có chu kỳ nhận tiền khác nhau)
  paymentCycleType?: 'fixed_10' | 'fixed_15' | 'fixed_30' | 'custom'; // Chu kỳ nhận tiền
  paymentCycleDays?: number; // Số ngày 1 chu kỳ (Mặc định 10 ngày, có thể chỉnh 15 ngày, 30 ngày...)
  customCycleName?: string; // Tên gọi chu kỳ (VD: "Đợt cạo 10 ngày", "Chu kỳ 15 ngày thanh toán 1 lần"...)
  subEmails?: string[]; // Danh sách tối đa 5 email phụ được phép xem dữ liệu của chủ tài khoản này
  ownerEmail?: string; // Email chủ vườn nhận báo cáo định kỳ
  autoMonthlyEmail?: boolean; // Tự động gửi email báo cáo hàng tháng
}

export type ActiveTab = 
  | 'home' 
  | 'cycle10'
  | 'logs' 
  | 'cycles' 
  | 'analytics' 
  | 'yearly' 
  | 'export' 
  | 'settings'
  | 'permissions'
  | 'guide';
