import React from 'react';
import { AlertTriangle, CheckCircle2, Loader2, X } from 'lucide-react';

interface StatusBannerProps {
  type: 'loading' | 'error' | 'success' | null;
  message: string;
  onDismiss?: () => void;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({ type, message, onDismiss }) => {
  if (!type || !message) return null;

  const bgClasses = {
    loading: 'bg-amber-50 text-amber-900 border-amber-300',
    error: 'bg-rose-50 text-rose-950 border-rose-300',
    success: 'bg-emerald-50 text-emerald-950 border-emerald-300'
  };

  const icons = {
    loading: <Loader2 className="w-4 h-4 animate-spin text-amber-700 flex-shrink-0" />,
    error: <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />,
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
  };

  return (
    <div
      id="status-banner"
      className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border text-xs sm:text-sm font-medium ${bgClasses[type]} shadow-2xs transition animate-in fade-in duration-200`}
    >
      <div className="flex items-center gap-2">
        {icons[type]}
        <span>{message}</span>
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-black/5 rounded text-stone-500 hover:text-stone-800 transition cursor-pointer"
          aria-label="Tutup pesan"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
