import { useCallback, useEffect, useState } from 'react';

export interface SavedView {
  id: string;
  name: string;
  query: string;
  savedAt: number;
}

const STORAGE_KEY = 'intel-saved-views-v1';
const MAX = 20;

function read(): SavedView[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedView[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: SavedView[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX))); } catch { /* ignore */ }
}

/**
 * Saved views do Ask: persiste pares (nome, query) em localStorage.
 */
export function useSavedAskViews() {
  const [items, setItems] = useState<SavedView[]>(() => read());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(read());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const save = useCallback((name: string, query: string) => {
    const trimmed = name.trim() || query.slice(0, 40);
    setItems((prev) => {
      // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const next = [{ id, name: trimmed, query, savedAt: Date.now() }, ...prev].slice(0, MAX);
      write(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((v) => v.id !== id);
      write(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => { write([]); setItems([]); }, []);

  return { items, save, remove, clear, max: MAX };
}
