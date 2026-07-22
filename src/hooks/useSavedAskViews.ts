import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export interface SavedView {
  id: string;
  name: string;
  query: string;
  savedAt: number;
}

const BASE_KEY = 'intel-saved-views-v1';
const MAX = 20;

function read(storageKey: string): SavedView[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedView[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(storageKey: string, items: SavedView[]): void {
  try { localStorage.setItem(storageKey, JSON.stringify(items.slice(0, MAX))); } catch { /* ignore */ }
}

/**
 * Saved views do Ask: persiste pares (nome, query) em localStorage, isolados por usuário.
 */
export function useSavedAskViews() {
  const { user } = useAuth();
  const storageKey = `${BASE_KEY}-${user?.id ?? 'anon'}`;

  const [items, setItems] = useState<SavedView[]>(() => read(storageKey));

  // Re-hydrate when user changes (login/logout)
  useEffect(() => {
    setItems(read(storageKey));
  }, [storageKey]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey) setItems(read(storageKey));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [storageKey]);

  const save = useCallback((name: string, query: string) => {
    const trimmed = name.trim() || query.slice(0, 40);
    setItems((prev) => {
      // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const next = [{ id, name: trimmed, query, savedAt: Date.now() }, ...prev].slice(0, MAX);
      write(storageKey, next);
      return next;
    });
  }, [storageKey]);

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((v) => v.id !== id);
      write(storageKey, next);
      return next;
    });
  }, [storageKey]);

  const clear = useCallback(() => { write(storageKey, []); setItems([]); }, [storageKey]);

  return { items, save, remove, clear, max: MAX };
}
