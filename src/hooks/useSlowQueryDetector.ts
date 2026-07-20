import { useEffect, useState, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface SlowQueryState {
  isSlowQuery: boolean;
  duration: number;
  queryKey: string;
  severity: 'warning' | 'critical';
}

const SLOW_THRESHOLD_MS = 3000;
const CRITICAL_THRESHOLD_MS = 8000;
const CLEAR_DELAY_MS = 5000;

export function useSlowQueryDetector(): SlowQueryState {
  const queryClient = useQueryClient();
  const [state, setState] = useState<SlowQueryState>({
    isSlowQuery: false,
    duration: 0,
    queryKey: '',
    severity: 'warning',
  });
  const timers = useRef<Map<string, number>>(new Map());
  const clearTimer = useRef<ReturnType<typeof setTimeout>>();

  const checkQuery = useCallback((key: string, startTime: number) => {
    const elapsed = Date.now() - startTime;
    if (elapsed >= SLOW_THRESHOLD_MS) {
      setState({
        isSlowQuery: true,
        duration: elapsed,
        queryKey: key,
        severity: elapsed >= CRITICAL_THRESHOLD_MS ? 'critical' : 'warning',
      });
    }
  }, []);

  useEffect(() => {
    const cache = queryClient.getQueryCache();

    const unsubscribe = cache.subscribe((event) => {
      if (!event?.query) return;
      const key = JSON.stringify(event.query.queryKey);

      if (event.type === 'updated') {
        const status = event.query.state.fetchStatus;

        if (status === 'fetching') {
          const start = Date.now();
          timers.current.set(key, start);
          // Poll check while fetching
          const interval = setInterval(() => {
            if (event.query.state.fetchStatus !== 'fetching') {
              clearInterval(interval);
              return;
            }
            checkQuery(key, start);
          }, 1000);
          // Store interval for cleanup
          const existingStart = timers.current.get(key);
          if (existingStart) timers.current.set(key + '_interval', interval as unknown as number);
        }

        if (status === 'idle') {
          const start = timers.current.get(key);
          if (start) {
            const elapsed = Date.now() - start;
            if (elapsed >= SLOW_THRESHOLD_MS) {
              setState({
                isSlowQuery: true,
                duration: elapsed,
                queryKey: key,
                severity: elapsed >= CRITICAL_THRESHOLD_MS ? 'critical' : 'warning',
              });
            }
            timers.current.delete(key);
            // Auto-clear after delay
            if (clearTimer.current) clearTimeout(clearTimer.current);
            clearTimer.current = setTimeout(() => {
              // eslint-disable-next-line sonarjs/no-nested-functions
              setState(prev => ({ ...prev, isSlowQuery: false }));
            }, CLEAR_DELAY_MS);
          }
        }
      }
    });

    return () => {
      unsubscribe();
      if (clearTimer.current) clearTimeout(clearTimer.current);
    };
  }, [queryClient, checkQuery]);

  return state;
}
