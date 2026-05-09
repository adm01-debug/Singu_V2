import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'singu:mask-ips';
const CUSTOM_EVENT_KEY = 'singu:mask-ips:changed';

/**
 * Robustly reads the preference from localStorage.
 * Handles SSR and environment issues (like private mode or disabled storage).
 */
function read(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const val = window.localStorage.getItem(STORAGE_KEY);
    // Security default: false. Only activate if explicitly '1'.
    return val === '1';
  } catch (err) {
    // In some environments, accessing localStorage might throw even without reading/writing
    console.warn('[useIPMaskingPreference] Failed to read localStorage:', err);
    return false;
  }
}

/**
 * Persists value and notifies other instances/tabs.
 */
function write(value: boolean) {
  if (typeof window === 'undefined') return;
  const strValue = value ? '1' : '0';
  
  try {
    window.localStorage.setItem(STORAGE_KEY, strValue);
  } catch (err) {
    // Private mode or quota exceeded should not crash the app
    console.warn('[useIPMaskingPreference] Failed to persist preference:', err);
  }

  // Notify other hook instances IN THE SAME tab via explicit CustomEvent.
  // We use this instead of relying on local StorageEvents (which aren't triggered for the current window).
  window.dispatchEvent(new CustomEvent(CUSTOM_EVENT_KEY, { detail: value }));
}

/**
 * Hook to manage global IP masking preference.
 * Synchronizes state across multiple instances in the same tab and between different tabs.
 */
export function useIPMaskingPreference() {
  const [masked, setMaskedState] = useState<boolean>(read);

  useEffect(() => {
    // 1. Sync BETWEEN tabs (native browser 'storage' event)
    const onStorage = (e: StorageEvent) => {
      // Browsers trigger this event only when storage is changed by ANOTHER tab.
      if (e.key === STORAGE_KEY && e.newValue !== null) {
        setMaskedState(e.newValue === '1');
      }
    };

    // 2. Sync IN SAME tab (explicit internal CustomEvent)
    // This allows instances in the same window to react immediately to changes.
    const onCustomChange = (e: Event) => {
      if (!(e instanceof CustomEvent)) return;
      if (typeof e.detail === 'boolean') {
        setMaskedState(e.detail);
      }
    };

    try {
      window.addEventListener('storage', onStorage);
      window.addEventListener(CUSTOM_EVENT_KEY, onCustomChange);
    } catch (err) {
      console.warn('[useIPMaskingPreference] Failed to attach event listeners:', err);
    }
    
    return () => {
      try {
        window.removeEventListener('storage', onStorage);
        window.removeEventListener(CUSTOM_EVENT_KEY, onCustomChange);
      } catch (err) {
        // Ignored
      }
    };
  }, []);

  const setMasked = useCallback((v: boolean) => {
    setMaskedState(v);
    write(v);
  }, []);

  const toggle = useCallback(() => {
    setMaskedState(prev => {
      const next = !prev;
      write(next);
      return next;
    });
  }, []);

  return { masked, toggle, setMasked };
}

