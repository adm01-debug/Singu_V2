import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export type IntelTheme = 'cyan' | 'amber';
const BASE_STORAGE_KEY = 'intel-theme-v1';
const CLASS_PREFIX = 'intel-theme-';

function read(storageKey: string): IntelTheme {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw === 'amber' ? 'amber' : 'cyan';
  } catch {
    return 'cyan';
  }
}

function applyClass(theme: IntelTheme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove(`${CLASS_PREFIX}cyan`, `${CLASS_PREFIX}amber`);
  root.classList.add(`${CLASS_PREFIX}${theme}`);
}

export function useIntelTheme() {
  const { user } = useAuth();
  const storageKey = `${BASE_STORAGE_KEY}-${user?.id ?? 'anon'}`;
  const [theme, setTheme] = useState<IntelTheme>('cyan');

  useEffect(() => {
    setTheme(read(storageKey));
  }, [storageKey]);

  useEffect(() => {
    applyClass(theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: IntelTheme = prev === 'cyan' ? 'amber' : 'cyan';
      try { localStorage.setItem(storageKey, next); } catch { /* ignore */ }
      return next;
    });
  }, [storageKey]);

  const set = useCallback((next: IntelTheme) => {
    setTheme(next);
    try { localStorage.setItem(storageKey, next); } catch { /* ignore */ }
  }, [storageKey]);

  return { theme, toggle, set };
}
