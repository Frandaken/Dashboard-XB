import React from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

interface StatusBannerProps {
  type: 'loading' | 'error' | 'success';
  message: string;
  onDismiss?: () => void;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({
  type,
  message,
  onDismiss
}) => {
  const styles = {
    error: {
      bg: 'bg-rose-50 dark:bg-[#1A0507] border-rose-200 dark:border-[#4A1015] text-rose-800 dark:text-[#FDA4AF]',
      icon: <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
    },
    success: {
      bg: 'bg-emerald-50 dark:bg-[#071F14] border-emerald-200 dark:border-[#0E492B] text-emerald-800 dark:text-[#6EE7B7]',
      icon: <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
    },
    loading: {
      bg: 'bg-amber-50 dark:bg-[#1C1508] border-amber-200 dark:border-[#4D380E] text-amber-800 dark:text-[#FDE68A]',
      icon: <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
    }
  }[type];

  return (
    <div
      role="alert"
      className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-medium shadow-2xs ${styles.bg}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {styles.icon}
        <span className="truncate">{message}</span>
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-stone-400 hover:text-stone-700 p-1 rounded-md transition cursor-pointer"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
