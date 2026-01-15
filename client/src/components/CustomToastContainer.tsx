import React, { useEffect } from 'react';
import { useToast, setGlobalToast } from '../contexts/CustomToastContext';
import { X, CheckCircle, XCircle, Info } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    setGlobalToast(showToast);
  }, [showToast]);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-md pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`
            flex items-start gap-3 p-4 rounded-xl shadow-lg border pointer-events-auto
            backdrop-blur-sm
            animate-in slide-in-from-right-5 fade-in duration-300
            ${toast.type === 'success' ? 'bg-emerald-50/95 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800' : ''}
            ${toast.type === 'error' ? 'bg-rose-50/95 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800' : ''}
            ${toast.type === 'info' ? 'bg-blue-50/95 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' : ''}
          `}
        >
          {toast.type === 'success' && (
            <div className="shrink-0 mt-0.5">
              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          )}
          {toast.type === 'error' && (
            <div className="shrink-0 mt-0.5">
              <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
          )}
          {toast.type === 'info' && (
            <div className="shrink-0 mt-0.5">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          )}
          
          <p className={`
            flex-1 text-sm font-medium leading-relaxed
            ${toast.type === 'success' ? 'text-emerald-900 dark:text-emerald-100' : ''}
            ${toast.type === 'error' ? 'text-rose-900 dark:text-rose-100' : ''}
            ${toast.type === 'info' ? 'text-blue-900 dark:text-blue-100' : ''}
          `}>
            {toast.message}
          </p>
          
          <button
            onClick={() => removeToast(toast.id)}
            className="shrink-0 rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all duration-200"
            aria-label="Close notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
