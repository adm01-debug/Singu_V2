import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export type GlobalDensity = 'comfortable' | 'compact';

const BASE_STORAGE_KEY = 'singu-global-density-v1';
const CLASS_NAME = 'density-compact';

function readInitial(storageKey: string): GlobalDensity {
  if (typeof window === 'undefined') return 'comfortable';
  try {
    const v = window.localStorage.getItem(storageKey);
    return v === 'compact' ? 'compact' : 'comfortable';
  } catch {
    return 'comfortable';
  }
}

export function useGlobalDensity() {
  const { user } = useAuth();
  const storageKey = `${BASE_STORAGE_KEY}-${user?.id ?? 'anon'}`;
  const [density, setDensity] = useState<GlobalDensity>('comfortable');

  useEffect(() => {
    setDensity(readInitial(storageKey));
  }, [storageKey]);

  useEffect(() => {
    const root = document.documentElement;
    if (density === 'compact') root.classList.add(CLASS_NAME);
    else root.classList.remove(CLASS_NAME);
    try {
      window.localStorage.setItem(storageKey, density);
    } catch {
      /* noop */
    }
  }, [density, storageKey]);

  const toggle = useCallback(() => {
    setDensity((prev) => (prev === 'compact' ? 'comfortable' : 'compact'));
  }, []);

  return { density, isCompact: density === 'compact', toggle, setDensity };
}
