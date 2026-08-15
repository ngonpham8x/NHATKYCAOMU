import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col space-y-2 max-w-sm w-full px-4 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const bgStyle =
    toast.type === 'error'
      ? 'bg-red-900/95 text-white border-red-700'
      : toast.type === 'warning'
      ? 'bg-amber-900/95 text-white border-amber-700'
      : toast.type === 'info'
      ? 'bg-blue-900/95 text-white border-blue-700'
      : 'bg-emerald-900/95 text-white border-emerald-700';

  return (
    <div
      className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border shadow-lg backdrop-blur-md text-xs font-semibold animate-fade-in ${bgStyle}`}
    >
      <div className="flex items-center space-x-2.5 mr-2">
        {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-300 shrink-0" />}
        {toast.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-300 shrink-0" />}
        {toast.type === 'info' && <Info className="w-4 h-4 text-blue-300 shrink-0" />}
        {(toast.type === 'success' || !toast.type) && (
          <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
        )}
        <span className="leading-snug">{toast.message}</span>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1 hover:bg-white/20 rounded-lg transition"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
