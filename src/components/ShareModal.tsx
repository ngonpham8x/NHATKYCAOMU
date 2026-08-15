import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  FileText, 
  FileSpreadsheet, 
  Send, 
  ExternalLink,
  MessageCircle,
  Share2
} from 'lucide-react';
import { HarvestRecord, Settings } from '../types';
import { formatZaloShareText, exportToPDF, exportToExcel } from '../utils/export';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: HarvestRecord[];
  settings: Settings;
  title: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  records,
  settings,
  title,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [activeAppMsg, setActiveAppMsg] = useState<string>('');
  const [isPdfExporting, setIsPdfExporting] = useState<boolean>(false);

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

  const shareText = formatZaloShareText(records, settings, title);

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenZalo = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
    } catch (e) {
      console.error(e);
    }
    setActiveAppMsg('Đã sao chép báo cáo! Đang mở Zalo... Nhấn giữ ô chat và chọn DÁN (PASTE) để gửi.');
    setTimeout(() => {
      try {
        window.open('https://chat.zalo.me', '_blank', 'noopener,noreferrer');
      } catch (e) {
        console.warn('Could not open Zalo link:', e);
      }
    }, 400);
  };

  const handleOpenMessenger = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
    } catch (e) {
      console.error(e);
    }
    setActiveAppMsg('Đã sao chép báo cáo! Đang mở Messenger... Nhấn giữ ô chat và chọn DÁN (PASTE).');
    setTimeout(() => {
      try {
        window.open('https://www.messenger.com', '_blank', 'noopener,noreferrer');
      } catch (e) {
        console.warn('Could not open Messenger link:', e);
      }
    }, 400);
  };

  const handleOpenFacebook = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
    } catch (e) {
      console.error(e);
    }
    setActiveAppMsg('Đã sao chép báo cáo! Đang mở Facebook... Dán bài viết để đăng.');
    setTimeout(() => {
      try {
        window.open('https://www.facebook.com', '_blank', 'noopener,noreferrer');
      } catch (e) {
        console.warn('Could not open Facebook link:', e);
      }
    }, 400);
  };

  const handleExportPDF = async () => {
    setIsPdfExporting(true);
    try {
      await exportToPDF(records, settings, title);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPdfExporting(false);
    }
  };

  const handleExportExcel = () => {
    exportToExcel(records, title.replace(/[^a-zA-Z0-9]/g, '_'));
  };

  return (
    <div 
      id="share-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden my-auto"
      >
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 rounded-2xl">
              <Share2 className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black uppercase tracking-wide">
                Gửi Báo Cáo Doanh Thu
              </h3>
              <p className="text-xs text-blue-100 font-medium">
                Chọn ứng dụng Zalo, Messenger hoặc tải PDF/Excel
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-share-modal"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-10 h-10 rounded-full bg-blue-950/60 hover:bg-blue-900 active:scale-95 text-amber-200 transition flex items-center justify-center focus:outline-none cursor-pointer"
            title="Đóng (ESC)"
            aria-label="Đóng"
          >
            <X className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4">

          {activeAppMsg && (
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 text-xs font-bold rounded-2xl border border-emerald-300 flex items-start space-x-2 animate-bounce">
              <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <span>{activeAppMsg}</span>
            </div>
          )}

          {/* Direct App Buttons Grid (Compact & Small) */}
          <div className="grid grid-cols-3 gap-2">
            {/* Zalo Button */}
            <button
              onClick={handleOpenZalo}
              className="py-2 px-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs hover:shadow-md active:scale-95 transition flex flex-col items-center justify-center space-y-1 cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-white text-blue-600 font-black flex items-center justify-center text-[11px] shadow-xs shrink-0">
                Zalo
              </div>
              <span className="font-extrabold text-[11px] leading-tight">Gửi Zalo</span>
            </button>

            {/* Messenger Button */}
            <button
              onClick={handleOpenMessenger}
              className="py-2 px-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-xs shadow-xs hover:shadow-md active:scale-95 transition flex flex-col items-center justify-center space-y-1 cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-white text-pink-600 font-black flex items-center justify-center text-[11px] shadow-xs shrink-0">
                💬
              </div>
              <span className="font-extrabold text-[11px] leading-tight">Messenger</span>
            </button>

            {/* Facebook Button */}
            <button
              onClick={handleOpenFacebook}
              className="py-2 px-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs shadow-xs hover:shadow-md active:scale-95 transition flex flex-col items-center justify-center space-y-1 cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-white text-indigo-700 font-black flex items-center justify-center text-[11px] shadow-xs shrink-0">
                fb
              </div>
              <span className="font-extrabold text-[11px] leading-tight">Facebook</span>
            </button>
          </div>

          {/* Document Export Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={handleExportPDF}
              disabled={isPdfExporting}
              className="p-3 rounded-2xl bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold text-xs shadow-xs transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>{isPdfExporting ? 'Đang tạo PDF...' : 'Xuất File PDF'}</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="p-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Xuất File Excel</span>
            </button>
          </div>

          {/* Copy Preview Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
              <span>Nội dung văn bản báo cáo:</span>
              <button
                onClick={handleCopyText}
                className="text-emerald-700 dark:text-emerald-400 hover:underline flex items-center space-x-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã sao chép!' : 'Sao chép văn bản'}</span>
              </button>
            </div>

            <textarea
              readOnly
              value={shareText}
              rows={6}
              className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-mono text-xs focus:outline-none"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="p-3.5 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold text-xs transition cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
