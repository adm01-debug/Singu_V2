import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export type ChannelSyncMode = 'auto' | 'manual';
const BASE_KEY = 'channel-sync-mode';

export function useChannelSyncMode() {
  const { user } = useAuth();
  const storageKey = `${BASE_KEY}-${user?.id ?? 'anon'}`;
  const [mode, setModeState] = useState<ChannelSyncMode>('auto');

  useEffect(() => {
    try {
      const v = localStorage.getItem(storageKey);
      setModeState(v === 'manual' || v === 'auto' ? v : 'auto');
    } catch {
      setModeState('auto');
    }
  }, [storageKey]);

  const setMode = useCallback((next: ChannelSyncMode) => {
    setModeState(next);
    try { localStorage.setItem(storageKey, next); } catch { /* noop */ }
  }, [storageKey]);

  const toggle = useCallback(() => {
    setModeState((prev) => {
      const next: ChannelSyncMode = prev === 'auto' ? 'manual' : 'auto';
      try { localStorage.setItem(storageKey, next); } catch { /* noop */ }
      return next;
    });
  }, [storageKey]);

  return { mode, setMode, toggle };
}
