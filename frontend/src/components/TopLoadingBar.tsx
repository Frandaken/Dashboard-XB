import React, { useEffect, useRef, useState } from 'react';

interface TopLoadingBarProps {
  /** Whether a data synchronization request is currently in flight */
  isLoading: boolean;
  /** Current sync progress percentage (0 - 100) */
  progress: number;
}

export const TopLoadingBar: React.FC<TopLoadingBarProps> = ({ isLoading, progress }) => {
  const [visible, setVisible] = useState<boolean>(false);
  const [fadingOut, setFadingOut] = useState<boolean>(false);
  const [displayProgress, setDisplayProgress] = useState<number>(0);

  const wasLoadingRef = useRef<boolean>(false);
  const progressRef = useRef<number>(progress);
  const fadeTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  const clearTimers = () => {
    if (fadeTimerRef.current !== null) {
      window.clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  // Drive show / complete / fade-out lifecycle when isLoading changes
  useEffect(() => {
    clearTimers();

    if (isLoading) {
      wasLoadingRef.current = true;
      setVisible(true);
      setFadingOut(false);
      setDisplayProgress(prev => {
        const baseline = Math.max(8, Math.min(95, progressRef.current));
        return prev > 0 && prev < 100 ? Math.max(prev, baseline) : baseline;
      });
    } else if (wasLoadingRef.current) {
      wasLoadingRef.current = false;
      setDisplayProgress(100);

      fadeTimerRef.current = window.setTimeout(() => {
        setFadingOut(true);
      }, 220);

      hideTimerRef.current = window.setTimeout(() => {
        setVisible(false);
        setFadingOut(false);
        setDisplayProgress(0);
      }, 500);
    }

    return clearTimers;
  }, [isLoading]);

  // Reflect real progress updates reported by fetchData without jumping backwards
  useEffect(() => {
    if (!isLoading) return;
    const clamped = Math.max(8, Math.min(98, progress));
    setDisplayProgress(prev => (clamped > prev ? clamped : prev));
  }, [isLoading, progress]);

  // Subtle trickle when waiting on slower endpoints so the bar never feels stalled
  useEffect(() => {
    if (!isLoading) return;

    const trickle = window.setInterval(() => {
      setDisplayProgress(prev => {
        const ceiling = Math.min(94, Math.max(progressRef.current + 6, 86));
        if (prev >= ceiling) return prev;
        const step = Math.max(0.4, (ceiling - prev) * 0.14);
        return Math.min(ceiling, Number((prev + step).toFixed(1)));
      });
    }, 350);

    return () => window.clearInterval(trickle);
  }, [isLoading]);

  if (!visible) return null;

  const clampedDisplay = Math.max(0, Math.min(100, displayProgress));

  return (
    <div
      role="progressbar"
      aria-label="Sinkronisasi data kelas"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clampedDisplay)}
      className={`pointer-events-none fixed top-0 inset-x-0 z-[60] h-[2.5px] overflow-hidden bg-emerald-950/[0.05] dark:bg-emerald-400/[0.08] transition-opacity duration-250 ease-out motion-reduce:transition-none ${
        fadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className="h-full w-full bg-gradient-to-r from-[#1E3A2F] via-emerald-600 to-emerald-400 dark:from-emerald-600 dark:via-emerald-400 dark:to-teal-300 transition-transform duration-200 ease-out motion-reduce:transition-none relative"
        style={{
          transform: `translate3d(${clampedDisplay - 100}%, 0, 0)`
        }}
      >
        <span
          aria-hidden="true"
          className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-r from-transparent to-emerald-300/90 dark:to-teal-200/90 shadow-[0_0_8px_rgba(16,185,129,0.55)] dark:shadow-[0_0_10px_rgba(52,211,153,0.7)]"
        />
      </div>
    </div>
  );
};
