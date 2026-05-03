/**
 * Debounce Utility — Rate-limits rapid function invocations.
 *
 * Prevents denial-of-wallet attacks on API endpoints and improves
 * efficiency by collapsing rapid user input into a single API call.
 *
 * @module utils/debounce
 */

/**
 * Create a debounced version of a function.
 *
 * The returned function delays invoking the original until `delayMs`
 * milliseconds have elapsed since the last call. If invoked again
 * before the delay expires, the timer resets.
 *
 * @param fn - The function to debounce.
 * @param delayMs - Delay in milliseconds (default: 500ms).
 * @returns A debounced wrapper function.
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delayMs = 500,
): (...args: Parameters<T>) => void {
  let timerId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>): void => {
    if (timerId !== null) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      fn(...args);
      timerId = null;
    }, delayMs);
  };
}

/**
 * Create a throttled version of a function.
 *
 * The returned function invokes the original at most once every
 * `intervalMs` milliseconds, dropping intermediate calls.
 *
 * @param fn - The function to throttle.
 * @param intervalMs - Minimum interval between invocations (default: 1000ms).
 * @returns A throttled wrapper function.
 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  intervalMs = 1000,
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return (...args: Parameters<T>): void => {
    const now = Date.now();
    if (now - lastCall >= intervalMs) {
      lastCall = now;
      fn(...args);
    }
  };
}
