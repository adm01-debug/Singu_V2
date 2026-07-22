import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export type IntelDensity = 'compact' | 'comfortable';

const BASE_STORAGE_KEY = 'intel-density-v1';

function read(storageKey: string): IntelDensity {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw === 'compact' ? 'compact' : 'comfortable';
  } catch {
    return 'comfortable';
  }
}

export function useIntelDensity() {
  const { user } = useAuth();
  const storageKey = `${BASE_STORAGE_KEY}-${user?.id ?? 'anon'}`;
  const [density, setDensityState] = useState<IntelDensity>('comfortable');

  useEffect(() => {
    setDensityState(read(storageKey));
  }, [storageKey]);

  useEffect(() => {
    const root = document.documentElement;
    if (density === 'compact') root.classList.add('intel-density-compact');
    else root.classList.remove('intel-density-compact');
    return () => { root.classList.remove('intel-density-compact'); };
  }, [density]);

  const setDensity = useCallback((d: IntelDensity) => {
    setDensityState(d);
    try { localStorage.setItem(storageKey, d); } catch { /* ignore */ }
  }, [storageKey]);

  const toggle = useCallback(() => {
    setDensityState((prev) => {
      const next: IntelDensity = prev === 'compact' ? 'comfortable' : 'compact';
      try { localStorage.setItem(storageKey, next); } catch { /* ignore */ }
      return next;
    });
  }, [storageKey]);

  return { density, setDensity, toggle, isCompact: density === 'compact' };
}
