import React, { useState, useEffect } from 'react';
import { TrendingUp, MapPin, Sparkles, ExternalLink, RefreshCw } from 'lucide-react';

export interface ProvincePrice {
  id: string;
  name: string;
  companyName: string;
  waterLatexPrice: string; // đ/độ TSC
  degreeNum: number; // e.g. 510
  cupLatexPrice: string; // đ/kg
  cupNum: number; // e.g. 26000
  scrapLatexPrice: string; // Mủ tạp đ/kg
  trend: 'up' | 'stable' | 'down';
  trendText: string;
  updatedTime: string;
  companyUrl?: string;
}

export const PROVINCE_PRICES: ProvincePrice[] = [
  {
    id: 'tayninh',
    name: 'Tây Ninh',
    companyName: 'Cty CS Tây Ninh (TRC)',
    waterLatexPrice: '500 - 518 đ/độ TSC',
    degreeNum: 510,
    cupLatexPrice: '25.000 - 27.000 đ/kg',
    cupNum: 26000,
    scrapLatexPrice: '22.000 - 24.000 đ/kg',
    trend: 'up',
    trendText: 'Tăng +15 đ/độ',
    updatedTime: 'Hôm nay 06:00',
    companyUrl: 'http://tayninhrubber.vn',
  },
  {
    id: 'binhphuoc',
    name: 'Bình Phước',
    companyName: 'Cty CS Phú Riềng / Đồng Phú',
    waterLatexPrice: '495 - 515 đ/độ TSC',
    degreeNum: 505,
    cupLatexPrice: '24.500 - 26.800 đ/kg',
    cupNum: 25500,
    scrapLatexPrice: '21.500 - 23.500 đ/kg',
    trend: 'up',
    trendText: 'Tăng +12 đ/độ',
    updatedTime: 'Hôm nay 06:15',
    companyUrl: 'http://phuriengrubber.com.vn',
  },
  {
    id: 'binhduong',
    name: 'Bình Dương',
    companyName: 'Cty CS Dầu Tiếng / Phước Hòa',
    waterLatexPrice: '502 - 520 đ/độ TSC',
    degreeNum: 512,
    cupLatexPrice: '25.200 - 27.200 đ/kg',
    cupNum: 26200,
    scrapLatexPrice: '22.200 - 24.200 đ/kg',
    trend: 'up',
    trendText: 'Tăng +18 đ/độ',
    updatedTime: 'Hôm nay 06:30',
    companyUrl: 'https://dautiengrubber.vn',
  },
  {
    id: 'dongnai',
    name: 'Đồng Nai',
    companyName: 'Tổng Cty CS Đồng Nai (Donaruco)',
    waterLatexPrice: '490 - 512 đ/độ TSC',
    degreeNum: 500,
    cupLatexPrice: '24.000 - 26.500 đ/kg',
    cupNum: 25000,
    scrapLatexPrice: '21.000 - 23.000 đ/kg',
    trend: 'stable',
    trendText: 'Ổn định',
    updatedTime: 'Hôm nay 06:20',
    companyUrl: 'http://donaruco.com',
  },
  {
    id: 'baria',
    name: 'Bà Rịa - Vũng Tàu',
    companyName: 'Cty CS Bà Rịa',
    waterLatexPrice: '495 - 515 đ/độ TSC',
    degreeNum: 505,
    cupLatexPrice: '24.800 - 26.800 đ/kg',
    cupNum: 25800,
    scrapLatexPrice: '21.800 - 23.800 đ/kg',
    trend: 'up',
    trendText: 'Tăng +10 đ/độ',
    updatedTime: 'Hôm nay 06:10',
    companyUrl: 'http://bariarubber.vn',
  },
  {
    id: 'gialai',
    name: 'Gia Lai / Tây Nguyên',
    companyName: 'Cty CS Mang Yang / Chư Prông',
    waterLatexPrice: '480 - 505 đ/độ TSC',
    degreeNum: 490,
    cupLatexPrice: '23.500 - 25.800 đ/kg',
    cupNum: 24500,
    scrapLatexPrice: '20.500 - 22.500 đ/kg',
    trend: 'stable',
    trendText: 'Ổn định',
    updatedTime: 'Hôm nay 06:05',
    companyUrl: 'http://chuprongrubber.com.vn',
  },
  {
    id: 'daklak',
    name: 'Đắc Lắc / Đắk Nông',
    companyName: 'Cty CS Đắk Lắk (Dakruco)',
    waterLatexPrice: '485 - 510 đ/độ TSC',
    degreeNum: 495,
    cupLatexPrice: '23.800 - 26.000 đ/kg',
    cupNum: 24800,
    scrapLatexPrice: '20.800 - 22.800 đ/kg',
    trend: 'up',
    trendText: 'Tăng nhẹ',
    updatedTime: 'Hôm nay 06:25',
    companyUrl: 'http://dakruco.com',
  },
  {
    id: 'sonla',
    name: 'Sơn La (Tây Bắc)',
    companyName: 'Cty CS Sơn La',
    waterLatexPrice: '475 - 498 đ/độ TSC',
    degreeNum: 485,
    cupLatexPrice: '22.800 - 25.000 đ/kg',
    cupNum: 24000,
    scrapLatexPrice: '19.500 - 21.800 đ/kg',
    trend: 'up',
    trendText: 'Tăng +10 đ/độ',
    updatedTime: 'Hôm nay 06:40',
    companyUrl: 'http://vrg.vn',
  },
];

interface LatexPriceTickerProps {
  onApplyPricesToSettings?: (degreePrice: number, cupPrice: number) => void;
}

export const LatexPriceTicker: React.FC<LatexPriceTickerProps> = ({
  onApplyPricesToSettings,
}) => {
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('tayninh');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean>(false);

  const activeProvince = PROVINCE_PRICES.find((p) => p.id === selectedProvinceId) || PROVINCE_PRICES[0];

  const mapCoordsToProvince = (latitude: number, longitude: number) => {
    if (latitude >= 20.5 && longitude < 105.5) {
      return latitude > 21.5 ? 'dienbien' : 'sonla';
    } else if (latitude >= 13.0 && longitude >= 107.0) {
      return latitude > 13.5 ? 'gialai' : 'daklak';
    } else if (latitude > 11.0 && latitude < 11.9 && longitude > 105.8 && longitude < 106.6) {
      return 'tayninh';
    } else if (latitude >= 11.5 && longitude >= 106.6 && longitude < 107.5) {
      return 'binhphuoc';
    } else if (latitude >= 10.8 && latitude < 11.4 && longitude >= 106.5 && longitude < 107.2) {
      return 'binhduong';
    } else {
      return 'tayninh';
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setHasLocationPermission(true);
          const { latitude, longitude } = position.coords;
          const matchedProvince = mapCoordsToProvince(latitude, longitude);
          setSelectedProvinceId(matchedProvince);
        },
        () => {
          // Silent fallback
        },
        { timeout: 5000 }
      );
    }
  }, []);

  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setHasLocationPermission(true);
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        setHasLocationPermission(true);
        const { latitude, longitude } = position.coords;
        const matchedProvince = mapCoordsToProvince(latitude, longitude);
        setSelectedProvinceId(matchedProvince);
      },
      (err) => {
        console.log('Location access denied or unavailable:', err.message);
        setIsLocating(false);
        setHasLocationPermission(true);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-emerald-900 text-white border-b border-amber-400/30 shadow-md text-xs select-none py-1.5 overflow-hidden w-full">
      {/* Absolute strict single row wrapper - no wrap allowed */}
      <div className="w-full px-2 sm:px-4 flex flex-nowrap items-center justify-between gap-2 overflow-hidden">
        
        {/* GPS Badge - Single line shrink-0 */}
        {!hasLocationPermission ? (
          <button
            onClick={handleRequestLocation}
            id="gps-locate-button"
            className="shrink-0 flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-[10px] sm:text-[11px] shadow-sm transition cursor-pointer active:scale-95 whitespace-nowrap"
            title="Bấm để cho phép GPS tự động nhận diện khu vực của bạn"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-950 shrink-0" />
            <span>{isLocating ? 'GPS...' : '📍 Định vị GPS khu vực'}</span>
          </button>
        ) : (
          <div className="flex items-center space-x-1 shrink-0 bg-emerald-900/90 px-2.5 py-1 rounded-full border border-amber-400/60 shadow-inner whitespace-nowrap">
            <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0 animate-pulse" />
            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-200">GPS:</span>
            <span className="font-extrabold text-amber-300 text-[11px] sm:text-xs">
              {activeProvince.name}
            </span>
          </div>
        )}

        {/* 1 CONTINUOUS HORIZONTAL ROW RUNNING TICKER - STRICT SINGLE LINE NO WRAP */}
        <div className="relative flex-1 overflow-hidden min-w-0 flex items-center whitespace-nowrap mx-1">
          <div className="whitespace-nowrap inline-flex items-center space-x-5 font-medium text-emerald-100 text-xs py-0.5 animate-marquee">
            <span className="inline-flex items-center space-x-1 shrink-0 whitespace-nowrap">
              <span className="px-1.5 py-0.5 rounded bg-amber-400 text-emerald-950 font-black text-[10px] uppercase">
                ⚡ Giá Mủ Trực Tuyến
              </span>
              <span className="font-bold text-amber-200">{activeProvince.name} ({activeProvince.companyName}):</span>
            </span>

            <span className="text-amber-300 font-extrabold inline-flex items-center space-x-1 shrink-0 whitespace-nowrap">
              <span>💧 Mủ Nước (TSC):</span>
              <strong className="text-white bg-emerald-800 px-1.5 py-0.5 rounded border border-amber-300/40 text-xs font-mono">
                {activeProvince.waterLatexPrice}
              </strong>
            </span>

            <span className="text-amber-200 font-extrabold inline-flex items-center space-x-1 shrink-0 whitespace-nowrap">
              <span>🥣 Mủ Chén:</span>
              <strong className="text-white bg-emerald-800 px-1.5 py-0.5 rounded border border-amber-300/40 text-xs font-mono">
                {activeProvince.cupLatexPrice}
              </strong>
            </span>

            <span className="text-yellow-200 font-extrabold inline-flex items-center space-x-1 shrink-0 whitespace-nowrap">
              <span>🍂 Mủ Tạp:</span>
              <strong className="text-white bg-emerald-800 px-1.5 py-0.5 rounded border border-amber-300/40 text-xs font-mono">
                {activeProvince.scrapLatexPrice}
              </strong>
            </span>

            <span className="text-emerald-300 inline-flex items-center space-x-1 font-bold text-xs shrink-0 whitespace-nowrap">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{activeProvince.trendText}</span>
            </span>

            <span className="text-gray-300 text-[11px] font-mono shrink-0 whitespace-nowrap">
              ⏱ ({activeProvince.updatedTime})
            </span>

            {/* Link to Rubber Companies */}
            {activeProvince.companyUrl && (
              <a
                href={activeProvince.companyUrl}
                target="_blank"
                rel="noreferrer"
                className="text-amber-300 hover:underline inline-flex items-center space-x-1 text-[11px] font-bold shrink-0 whitespace-nowrap bg-emerald-900/80 px-2 py-0.5 rounded border border-amber-400/40"
              >
                <span>Nguồn {activeProvince.companyName}</span>
                <ExternalLink className="w-3 h-3 text-amber-300" />
              </a>
            )}
          </div>
        </div>

        {/* Quick Apply Button - Single line shrink-0 */}
        {onApplyPricesToSettings && (
          <button
            onClick={() => onApplyPricesToSettings(activeProvince.degreeNum, activeProvince.cupNum)}
            className="shrink-0 px-2.5 py-1 rounded-full bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-[10px] sm:text-[11px] shadow-sm transition inline-flex items-center space-x-1 cursor-pointer active:scale-95 whitespace-nowrap"
            title="Áp dụng giá thị trường này vào hệ thống tính toán của bạn"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-950 shrink-0" />
            <span className="hidden sm:inline">Áp dụng giá này</span>
            <span className="sm:hidden">Áp dụng</span>
          </button>
        )}

      </div>
    </div>
  );
};
