import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Ignore only browser noise known to be emitted by OAuth popups/embedded
// browsers. Do not suppress generic SecurityError/CORS failures: those can
// indicate a real login or data-sync problem and must remain visible.
const isIgnoredError = (err: unknown): boolean => {
  if (!err) return false;
  try {
    const value = err as {
      message?: unknown;
      reason?: { message?: unknown } | unknown;
      error?: { message?: unknown } | unknown;
      stack?: unknown;
    };
    const str = `${typeof err === 'string' ? err : ''} ${value.message || ''} ${typeof value.reason === 'object' && value.reason !== null && 'message' in value.reason ? value.reason.message : value.reason || ''} ${typeof value.error === 'object' && value.error !== null && 'message' in value.error ? value.error.message : value.error || ''} ${value.stack || ''}`;
    const lower = str.toLowerCase();
    return (
      lower.includes('cross-origin-opener-policy policy would block window.closed') ||
      lower.includes('cross-origin-opener-policy policy would block window.close') ||
      lower.includes('$$typeof') ||
      lower.includes('should not already be working') ||
      lower.includes('blocked a frame with origin') ||
      lower.includes('named property')
    );
  } catch {
    return false;
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
        return false;
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
        return false;
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
    (this as Component<ErrorBoundaryProps, ErrorBoundaryState>).setState({ hasError: false });
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

    return (this as Component<ErrorBoundaryProps, ErrorBoundaryState>).props.children;
  }
}

// Register Service Worker for PWA application installation and caching (only in standalone production mode)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && !window.location.hostname.includes('ais-')) {
  const registerSW = () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Ask the browser to check the no-cache service-worker endpoint now,
        // rather than waiting for its normal periodic update interval.
        registration.update().catch(() => {});
      })
      .catch(() => {});
  };

  // When a new worker claims an already-open PWA, refresh once so the page
  // immediately executes the newly deployed authentication bundle.
  let refreshingAfterSWUpdate = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshingAfterSWUpdate) return;
    refreshingAfterSWUpdate = true;
    window.location.reload();
  });

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
