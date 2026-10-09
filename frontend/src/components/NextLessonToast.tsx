import React, { useEffect, useState } from 'react';
import { Clock, X } from 'lucide-react';

export interface NextLessonInfo {
  lessonName: string;
  sessionNumber: number | string;
  timeStr: string;
  minutesRemaining?: number;
}

interface NextLessonToastProps {
  info: NextLessonInfo | null;
  onClose: () => void;
  autoCloseMs?: number; // 5 seconds
}

export const NextLessonToast: React.FC<NextLessonToastProps> = ({
  info,
  onClose,
  autoCloseMs = 5000
}) => {
  const [progress, setProgress] = useState<number>(100);

  useEffect(() => {
    if (!info) return;

    setProgress(100);
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingPct = Math.max(0, 100 - (elapsed / autoCloseMs) * 100);
      setProgress(remainingPct);
      if (elapsed >= autoCloseMs) {
        clearInterval(interval);
        onClose();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [info, autoCloseMs, onClose]);

  if (!info) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] sm:w-auto max-w-lg transition-all duration-200 animate-in slide-in-from-top-4 fade-in pointer-events-auto"
    >
      <div className="relative overflow-hidden rounded-xl border border-[#D8D2C5] dark:border-[#2A2A2A] bg-[#FAF7F2]/95 dark:bg-[#121212]/95 backdrop-blur-md shadow-xl text-stone-900 dark:text-stone-100 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#DCFCE7] dark:bg-[#071F14] text-[#14532D] dark:text-[#34D399] flex items-center justify-center flex-shrink-0 shadow-2xs">
          <Clock className="w-4 h-4" />
        </div>

        <div className="text-xs sm:text-sm text-stone-700 dark:text-stone-200 min-w-0 pr-1 flex-1 leading-snug">
          Jam Selanjutnya,{' '}
          <strong className="font-bold text-stone-950 dark:text-white">
            {info.lessonName}
          </strong>
          {info.sessionNumber !== 0 ? (
            <>, jam ke-{info.sessionNumber}</>
          ) : (
            <> (Pembiasaan)</>
          )}{' '}
          akan dimulai dalam {info.minutesRemaining || 5} menit
        </div>

        <button
          onClick={onClose}
          aria-label="Tutup pemberitahuan jam berikutnya"
          className="w-7 h-7 rounded-lg hover:bg-stone-200 dark:hover:bg-[#222222] text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 flex items-center justify-center transition cursor-pointer flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 5-second progress bar */}
        <div
          className="absolute bottom-0 left-0 h-0.5 bg-[#2C4E3A] dark:bg-[#34D399] transition-all duration-75"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
