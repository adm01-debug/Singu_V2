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
  const activeIntervals = useRef<Set<ReturnType<typeof setInterval>>>(new Set());
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
              activeIntervals.current.delete(interval);
              return;
            }
            checkQuery(key, start);
          }, 1000);
          activeIntervals.current.add(interval);
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

              setState(prev => ({ ...prev, isSlowQuery: false }));
            }, CLEAR_DELAY_MS);
          }
        }
      }
    });

    return () => {
      unsubscribe();
      if (clearTimer.current) clearTimeout(clearTimer.current);
      activeIntervals.current.forEach(clearInterval);
      // eslint-disable-next-line react-hooks/exhaustive-deps -- deps estáveis (storage keys/user id/refs) — adicionar causaria re-execução desnecessária ou loop
      activeIntervals.current.clear();
    };
  }, [queryClient, checkQuery]);

  return state;
}
