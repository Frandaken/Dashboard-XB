export type HapticStyle = 'light' | 'toggle' | 'threshold' | 'trigger' | 'success';

const HAPTIC_PATTERNS: Record<HapticStyle, number | number[]> = {
  light: 8,
  toggle: 10,
  threshold: 12,
  trigger: 14,
  success: 10
};

function isMobileTouchDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const hasTouch = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
  const isCoarse = window.matchMedia?.('(pointer: coarse)')?.matches ?? false;
  return hasTouch || isCoarse;
}

/**
 * Triggers subtle hardware haptic feedback on supported mobile/touch devices
 * using the Web Vibration API, silently ignoring unsupported or desktop browsers.
 */
export function triggerHaptic(style: HapticStyle = 'light'): void {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
    if (!isMobileTouchDevice()) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return;

    navigator.vibrate(HAPTIC_PATTERNS[style]);
  } catch {
    // Ignore browsers/iframes that block or disallow vibration
  }
}
