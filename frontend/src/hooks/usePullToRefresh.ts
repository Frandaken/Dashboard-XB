import React, { useState, useRef, useEffect, useCallback, RefObject } from 'react';

export interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  disabled?: boolean;
  threshold?: number;
  maxPull?: number;
  damping?: number;
  minRefreshTime?: number;
  successDisplayDuration?: number;
}

export interface UsePullToRefreshReturn {
  containerRef: RefObject<HTMLDivElement | null>;
  isPulling: boolean;
  isThresholdReached: boolean;
  isRefreshing: boolean;
  isSuccess: boolean;
  pullDistance: number;
  progress: number;
  triggerRefresh: () => Promise<void>;
}

export function usePullToRefresh({
  onRefresh,
  disabled = false,
  threshold = 72,
  maxPull = 110,
  damping = 0.42,
  minRefreshTime = 650,
  successDisplayDuration = 500
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [pullDistance, setPullDistance] = useState<number>(0);
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const [isThresholdReached, setIsThresholdReached] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Tracking refs to avoid stale closures in touch event listeners
  const touchStateRef = useRef({
    startY: 0,
    startX: 0,
    isTracking: false,
    isActivePull: false,
    wasThresholdReached: false
  });

  const stateRef = useRef({
    isRefreshing,
    disabled
  });

  useEffect(() => {
    stateRef.current = { isRefreshing, disabled };
  }, [isRefreshing, disabled]);

  const triggerRefresh = useCallback(async () => {
    if (stateRef.current.isRefreshing) return;

    setIsRefreshing(true);
    setIsPulling(false);
    setIsThresholdReached(false);
    setPullDistance(56); // Lock height during refresh

    const startTime = Date.now();

    try {
      await onRefresh();
    } catch (err) {
      console.warn('Pull-to-refresh sync failed:', err);
    } finally {
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, minRefreshTime - elapsed);

      setTimeout(() => {
        setIsSuccess(true);
        if ('vibrate' in navigator) {
          try {
            navigator.vibrate?.(10);
          } catch {}
        }

        setTimeout(() => {
          setIsSuccess(false);
          setIsRefreshing(false);
          setPullDistance(0);
        }, successDisplayDuration);
      }, remainingTime);
    }
  }, [onRefresh, minRefreshTime, successDisplayDuration]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const getScrollTop = (): number => {
      // Check container scroll, document element scroll, and window scroll
      const containerScroll = container ? container.scrollTop : 0;
      const windowScroll = typeof window !== 'undefined' ? window.scrollY || document.documentElement.scrollTop : 0;
      return Math.max(containerScroll, windowScroll);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (stateRef.current.disabled || stateRef.current.isRefreshing) return;

      // Only allow initiating if user is at the top of page
      if (getScrollTop() > 2) return;

      const touch = e.touches[0];
      if (!touch) return;

      touchStateRef.current = {
        startY: touch.clientY,
        startX: touch.clientX,
        isTracking: true,
        isActivePull: false,
        wasThresholdReached: false
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      const tState = touchStateRef.current;
      if (!tState.isTracking || stateRef.current.disabled || stateRef.current.isRefreshing) return;

      const touch = e.touches[0];
      if (!touch) return;

      const currentY = touch.clientY;
      const currentX = touch.clientX;
      const deltaY = currentY - tState.startY;
      const deltaX = currentX - tState.startX;

      // If not yet actively pulling, verify intent
      if (!tState.isActivePull) {
        // If swiping horizontally more than vertically, cancel pull tracking
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 8) {
          tState.isTracking = false;
          return;
        }

        // If scrolling downwards into page content (finger moving up), cancel
        if (deltaY < 0) {
          tState.isTracking = false;
          return;
        }

        // Must still be at top
        if (getScrollTop() > 2) {
          tState.isTracking = false;
          return;
        }

        // Initiate pull once a slight threshold is crossed
        if (deltaY > 5) {
          tState.isActivePull = true;
          setIsPulling(true);
        }
      }

      if (tState.isActivePull && deltaY > 0) {
        // Prevent default browser elastic bounce / reload to let custom component handle it smoothly
        if (e.cancelable) {
          e.preventDefault();
        }

        // Apply logarithmic damping curve for natural elastic feel
        const damped = Math.min(maxPull, Math.pow(deltaY, 0.85) * damping * 2.8);
        setPullDistance(damped);

        const reached = damped >= threshold;
        if (reached && !tState.wasThresholdReached) {
          tState.wasThresholdReached = true;
          setIsThresholdReached(true);
          if ('vibrate' in navigator) {
            try {
              navigator.vibrate?.(12);
            } catch {}
          }
        } else if (!reached && tState.wasThresholdReached) {
          tState.wasThresholdReached = false;
          setIsThresholdReached(false);
        }
      }
    };

    const handleTouchEnd = () => {
      const tState = touchStateRef.current;
      if (!tState.isTracking) return;

      tState.isTracking = false;

      if (tState.isActivePull) {
        tState.isActivePull = false;

        if (tState.wasThresholdReached) {
          triggerRefresh();
        } else {
          // Spring back to 0 without refreshing
          setIsPulling(false);
          setIsThresholdReached(false);
          setPullDistance(0);
        }
      }
    };

    const handleTouchCancel = () => {
      touchStateRef.current.isTracking = false;
      touchStateRef.current.isActivePull = false;
      setIsPulling(false);
      setIsThresholdReached(false);
      if (!stateRef.current.isRefreshing) {
        setPullDistance(0);
      }
    };

    // Attach with { passive: false } to allow e.preventDefault() during active pull
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [disabled, maxPull, threshold, damping, triggerRefresh]);

  const progress = Math.min(1, pullDistance / threshold);

  return {
    containerRef,
    isPulling,
    isThresholdReached,
    isRefreshing,
    isSuccess,
    pullDistance,
    progress,
    triggerRefresh
  };
}
