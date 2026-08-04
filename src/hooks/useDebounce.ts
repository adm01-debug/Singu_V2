import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Debounces a value — returns the value only after it stops changing for `delay` ms.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Returns a debounced version of the callback.
 * The callback is only invoked after `delay` ms of inactivity.
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number
): T {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const debouncedFn = useCallback(
    (...args: unknown[]) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => callbackRef.current(...args), delay);
    },
    [delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return debouncedFn;
}
