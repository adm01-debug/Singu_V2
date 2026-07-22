import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

const BASE_STORAGE_KEY = 'intel-pres-v1';

function read(storageKey: string): boolean {
  try {
    return localStorage.getItem(storageKey) === '1';
  } catch {
    return false;
  }
}

export function useIntelPresentation() {
  const { user } = useAuth();
  const storageKey = `${BASE_STORAGE_KEY}-${user?.id ?? 'anon'}`;
  const [active, setActive] = useState<boolean>(false);

  useEffect(() => {
    setActive(read(storageKey));
  }, [storageKey]);

  useEffect(() => {
    const root = document.documentElement;
    if (active) root.classList.add('intel-presentation');
    else root.classList.remove('intel-presentation');
    return () => { root.classList.remove('intel-presentation'); };
  }, [active]);

  const toggle = useCallback(() => {
    setActive((prev) => {
      const next = !prev;
      try { localStorage.setItem(storageKey, next ? '1' : '0'); } catch { /* ignore */ }
      return next;
    });
  }, [storageKey]);

  return { active, toggle };
}
