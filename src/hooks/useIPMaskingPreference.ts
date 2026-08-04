import { useCallback, useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
import { useAuth } from '@/hooks/useAuth';

const BASE_STORAGE_KEY = 'singu:mask-ips';
const CUSTOM_EVENT_KEY = 'singu:mask-ips:changed';

function read(storageKey: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const val = window.localStorage.getItem(storageKey);
    return val === '1';
  } catch (err) {
    logger.warn('[useIPMaskingPreference] Failed to read localStorage:', err);
    return false;
  }
}

function write(storageKey: string, value: boolean) {
  if (typeof window === 'undefined') return;
  const strValue = value ? '1' : '0';
  try {
    window.localStorage.setItem(storageKey, strValue);
  } catch (err) {
    logger.warn('[useIPMaskingPreference] Failed to persist preference:', err);
  }
  window.dispatchEvent(new CustomEvent(CUSTOM_EVENT_KEY, { detail: value }));
}

export function useIPMaskingPreference() {
  const { user } = useAuth();
  const storageKey = `${BASE_STORAGE_KEY}-${user?.id ?? 'anon'}`;
  const [masked, setMaskedState] = useState<boolean>(false);

  useEffect(() => {
    setMaskedState(read(storageKey));
  }, [storageKey]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue !== null) {
        setMaskedState(e.newValue === '1');
      }
    };
    const onCustomChange = (e: Event) => {
      if (!(e instanceof CustomEvent)) return;
      if (typeof e.detail === 'boolean') setMaskedState(e.detail);
    };
    try {
      window.addEventListener('storage', onStorage);
      window.addEventListener(CUSTOM_EVENT_KEY, onCustomChange);
    } catch (err) {
      logger.warn('[useIPMaskingPreference] Failed to attach event listeners:', err);
    }
    return () => {
      try {
        window.removeEventListener('storage', onStorage);
        window.removeEventListener(CUSTOM_EVENT_KEY, onCustomChange);
      } catch { /* ignored */ }
    };
  }, [storageKey]);

  const setMasked = useCallback((v: boolean) => {
    setMaskedState(v);
    write(storageKey, v);
  }, [storageKey]);

  const toggle = useCallback(() => {
    setMaskedState(prev => {
      const next = !prev;
      write(storageKey, next);
      return next;
    });
  }, [storageKey]);

  return { masked, toggle, setMasked };
}

