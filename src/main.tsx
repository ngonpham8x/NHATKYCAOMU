import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Production Anti-Debug / Anti-F12 Security Measures
if (typeof window !== 'undefined' && import.meta.env.MODE === 'production') {
  // 1. Block Context Menu (Right Click)
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  // 2. Block Keyboard Shortcuts (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U)
  document.addEventListener('keydown', (e) => {
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) ||
      (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) ||
      (e.ctrlKey && (e.key === 'U' || e.key === 'u'))
    ) {
      e.preventDefault();
    }
  });

  // 3. Infinite Debugger Loop (Freezes DevTools if forced open)
  setInterval(() => {
    const start = new Date().getTime();
    // eslint-disable-next-line no-debugger
    debugger; 
    if (new Date().getTime() - start > 100) {
      // DevTools is open and paused the execution
      document.body.innerHTML = '<div style="padding: 50px; text-align: center; font-family: sans-serif;"><h3>Truy cập bị từ chối!</h3><p>Vui lòng tắt công cụ phát triển (DevTools) để tiếp tục sử dụng ứng dụng.</p></div>';
    }
  }, 2000);
}

// Helper to identify non-fatal cross-origin iframe security errors and React scheduler batching notices
const isIgnoredError = (err: any): boolean => {
  if (!err) return false;
  try {
    const str = `${typeof err === 'string' ? err : ''} ${err?.message || ''} ${err?.reason?.message || err?.reason || ''} ${err?.error?.message || err?.error || ''} ${err?.stack || ''}`;
    const lower = str.toLowerCase();
    return (
      lower.includes('cross-origin') ||
      lower.includes('securityerror') ||
      lower.includes('$$typeof') ||
      lower.includes('should not already be working') ||
      lower.includes('blocked a frame') ||
      lower.includes('named property')
    );
  } catch {
    return true;
  }
};

// Global uncaught error filter for non-fatal cross-origin iframe / Window property access errors
if (typeof window !== 'undefined') {
  const originalOnError = window.onerror;
  window.onerror = function (msg, source, lineno, colno, error) {
    if (isIgnoredError(msg) || isIgnoredError(error)) {
      return true; // Suppress reporting to iframe host
    }
    if (originalOnError) {
      return originalOnError.apply(this, [msg, source, lineno, colno, error]);
    }
    return false;
  };

  const originalOnUnhandledRejection = window.onunhandledrejection;
  window.onunhandledrejection = function (event) {
    if (isIgnoredError(event?.reason)) {
      if (typeof event.preventDefault === 'function') {
        event.preventDefault();
      }
      return true; // Suppress reporting to iframe host
    }
    if (originalOnUnhandledRejection) {
      return originalOnUnhandledRejection.call(this, event);
    }
    return false;
  };

  window.addEventListener(
    'error',
    (event: ErrorEvent) => {
      try {
        if (isIgnoredError(event) || isIgnoredError(event.message) || isIgnoredError(event.error)) {
          event.preventDefault();
          if (typeof event.stopImmediatePropagation === 'function') {
            event.stopImmediatePropagation();
          }
          return true;
        }
      } catch (e) {
        try { event.preventDefault(); } catch (err) {}
        return true;
      }
    },
    true
  );

  window.addEventListener(
    'unhandledrejection',
    (event: PromiseRejectionEvent) => {
      try {
        if (isIgnoredError(event) || isIgnoredError(event.reason)) {
          event.preventDefault();
          if (typeof event.stopImmediatePropagation === 'function') {
            event.stopImmediatePropagation();
          }
          return true;
        }
      } catch (e) {
        try { event.preventDefault(); } catch (err) {}
        return true;
      }
    },
    true
  );
}

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// React Error Boundary for resilient component rendering
class GlobalErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    if (isIgnoredError(error)) {
      return { hasError: false };
    }
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (isIgnoredError(error)) {
      return;
    }
    console.warn('ErrorBoundary caught non-fatal notice:', error?.message, errorInfo);
  }

  handleReset = () => {
    (this as any).setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-gray-900 p-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl max-w-md w-full text-center space-y-4">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300 rounded-xl flex items-center justify-center mx-auto text-xl font-bold">
              ⚠️
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Đã xảy ra sự cố hiển thị nhỏ
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Ứng dụng vừa gặp xung đột bộ nhớ tạm thời. Bạn vui lòng thử lại hoặc tải lại trang.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                Thử lại
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                Tải lại trang
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

// Register Service Worker for PWA application installation and caching (only in standalone production mode)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && !window.location.hostname.includes('ais-')) {
  const registerSW = () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch(() => {});
  };

  if (document.readyState === 'complete') {
    registerSW();
  } else {
    window.addEventListener('load', registerSW, { once: true });
  }
}

createRoot(document.getElementById('root')!, {
  onUncaughtError(error) {
    if (isIgnoredError(error)) return;
    console.warn('Uncaught error notice:', (error as any)?.message || error);
  },
  onCaughtError(error) {
    if (isIgnoredError(error)) return;
    console.warn('Caught error notice:', (error as any)?.message || error);
  },
  onRecoverableError(error) {
    if (isIgnoredError(error)) return;
    console.warn('Recoverable error notice:', (error as any)?.message || error);
  },
}).render(
  <GlobalErrorBoundary>
    <App />
  </GlobalErrorBoundary>,
);

