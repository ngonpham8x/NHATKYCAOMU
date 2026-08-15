import React, { useEffect } from 'react';
import { AlertTriangle, HelpCircle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  confirmText?: string;
  cancelLabel?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  confirmVariant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = 'Xác Nhận Thao Tác',
  message,
  confirmLabel,
  confirmText,
  cancelLabel,
  cancelText,
  variant,
  confirmVariant,
  onConfirm,
  onCancel,
}) => {
  // ESC key support
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const finalConfirmLabel = confirmLabel || confirmText || 'Có';
  const finalCancelLabel = cancelLabel || cancelText || 'Không';
  const finalVariant = variant || confirmVariant || 'danger';

  return (
    <div 
      id="confirm-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
      className="fixed inset-0 z-[100] overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700"
      >
        {/* Modal Header */}
        <div
          className={`p-4 flex items-center justify-between text-white ${
            finalVariant === 'danger'
              ? 'bg-red-600'
              : finalVariant === 'warning'
              ? 'bg-amber-600'
              : 'bg-emerald-700'
          }`}
        >
          <div className="flex items-center space-x-2 font-black text-base">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{title}</span>
          </div>
          <button
            type="button"
            id="btn-close-confirm-modal"
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
            className="w-8 h-8 rounded-lg hover:bg-white/20 active:bg-white/30 flex items-center justify-center transition cursor-pointer"
            title="Đóng (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-center">
          <div
            className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center ${
              finalVariant === 'danger'
                ? 'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400'
                : finalVariant === 'warning'
                ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
            }`}
          >
            <HelpCircle className="w-8 h-8" />
          </div>

          <p className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">
            {message}
          </p>

          {/* Action Buttons: "Có" and "Không" */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              id="btn-cancel-confirm-modal"
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
              className="py-2.5 px-4 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-extrabold text-sm hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition cursor-pointer"
            >
              ❌ {finalCancelLabel}
            </button>
            <button
              type="button"
              id="btn-accept-confirm-modal"
              onClick={(e) => {
                e.stopPropagation();
                onConfirm();
              }}
              className={`py-2.5 px-4 rounded-xl font-black text-sm text-white shadow-md active:scale-95 transition cursor-pointer ${
                finalVariant === 'danger'
                  ? 'bg-red-600 hover:bg-red-700'
                  : finalVariant === 'warning'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-emerald-700 hover:bg-emerald-800'
              }`}
            >
              ✓ {finalConfirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
