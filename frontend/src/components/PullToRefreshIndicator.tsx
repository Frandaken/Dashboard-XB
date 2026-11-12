import React from 'react';
import { ArrowDown, RefreshCw, CheckCircle2 } from 'lucide-react';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  progress: number;
  isPulling: boolean;
  isThresholdReached: boolean;
  isRefreshing: boolean;
  isSuccess: boolean;
  onManualTrigger?: () => void;
}

export const PullToRefreshIndicator: React.FC<PullToRefreshIndicatorProps> = ({
  pullDistance,
  progress,
  isPulling,
  isThresholdReached,
  isRefreshing,
  isSuccess,
  onManualTrigger
}) => {
  // Only render when there is active pull or refreshing or success state
  const isVisible = pullDistance > 0 || isRefreshing || isSuccess;
  if (!isVisible) return null;

  // SVG progress circle dimensions
  const size = 26;
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(1, Math.max(0, progress)));

  // Calculate indicator opacity and vertical offset
  const translateY = isRefreshing || isSuccess ? 12 : Math.min(pullDistance * 0.75 - 10, 24);
  const opacity = Math.min(1, Math.max(0.2, progress * 1.2));

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-2 inset-x-0 z-50 pointer-events-none transition-all duration-150 ease-out flex items-center justify-center px-4"
      style={{
        transform: `translateY(${translateY}px)`,
        opacity
      }}
    >
      <div
        onClick={onManualTrigger}
        className={`pointer-events-auto flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl shadow-lg border backdrop-blur-md transition-all duration-200 select-none ${
          isSuccess
            ? 'bg-emerald-50/95 dark:bg-[#122A1E]/95 border-emerald-600/30 text-emerald-900 dark:text-emerald-200 shadow-emerald-950/10'
            : isThresholdReached
            ? 'bg-emerald-50/95 dark:bg-[#10251B]/95 border-emerald-600/30 text-emerald-900 dark:text-emerald-300'
            : 'bg-white/95 dark:bg-[#18191C]/95 border-stone-200/90 dark:border-stone-800/90 text-stone-800 dark:text-stone-200 shadow-stone-900/10'
        }`}
      >
        {/* Status Graphic: Circular SVG progress ring / Spinner / Success check */}
        <div className="relative w-6 h-6 flex items-center justify-center flex-shrink-0">
          {isSuccess ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-subtle-bounce" />
          ) : isRefreshing ? (
            <RefreshCw className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-spin" />
          ) : (
            <>
              {/* Circular track */}
              <svg className="w-6 h-6 -rotate-90 transform" viewBox={`0 0 ${size} ${size}`}>
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  className="stroke-stone-200 dark:stroke-stone-700"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  className="stroke-emerald-600 dark:stroke-emerald-400 transition-all duration-75"
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              {/* Rotating Arrow inside progress ring */}
              <ArrowDown
                className={`w-3.5 h-3.5 absolute transition-transform duration-150 ${
                  isThresholdReached
                    ? 'text-emerald-600 dark:text-emerald-400 rotate-180 scale-110'
                    : 'text-stone-500 dark:text-stone-400'
                }`}
                style={{
                  transform: isThresholdReached ? 'rotate(180deg)' : `rotate(${Math.min(180, progress * 180)}deg)`
                }}
              />
            </>
          )}
        </div>

        {/* Text message */}
        <div className="text-xs font-semibold tracking-tight whitespace-nowrap">
          {isSuccess ? (
            <span className="text-emerald-800 dark:text-emerald-300">Data berhasil diperbarui!</span>
          ) : isRefreshing ? (
            <span className="text-stone-700 dark:text-stone-300">Menyinkronkan data jadwal...</span>
          ) : isThresholdReached ? (
            <span className="text-emerald-700 dark:text-emerald-400">Lepaskan untuk sinkronkan</span>
          ) : (
            <span className="text-stone-600 dark:text-stone-400">Tarik ke bawah untuk sinkronkan</span>
          )}
        </div>
      </div>
    </div>
  );
};
