import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export type BookmarkType = 'contact' | 'company' | 'deal';

export interface EntityBookmark {
  type: BookmarkType;
  id: string;
  name: string;
  pinnedAt: number;
}

const BASE_KEY = 'intel-bookmarks-v1';
const MAX = 10;

function read(storageKey: string): EntityBookmark[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as EntityBookmark[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(storageKey: string, items: EntityBookmark[]): void {
  try { localStorage.setItem(storageKey, JSON.stringify(items.slice(0, MAX))); } catch { /* ignore */ }
}

/**
 * Bookmarks de entidades persistidos em localStorage (máx 10), isolados por usuário.
 * Sincroniza entre abas via evento 'storage'.
 */
export function useEntityBookmarks() {
  const { user } = useAuth();
  const storageKey = `${BASE_KEY}-${user?.id ?? 'anon'}`;

  const [items, setItems] = useState<EntityBookmark[]>(() => read(storageKey));

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

  const isPinned = useCallback(
    (type: BookmarkType, id: string) => items.some((b) => b.type === type && b.id === id),
    [items]
  );

  const toggle = useCallback((entry: Omit<EntityBookmark, 'pinnedAt'>) => {
    setItems((prev) => {
      const exists = prev.find((b) => b.type === entry.type && b.id === entry.id);
      const next = exists
        ? prev.filter((b) => !(b.type === entry.type && b.id === entry.id))
        : [{ ...entry, pinnedAt: Date.now() }, ...prev].slice(0, MAX);
      write(storageKey, next);
      return next;
    });
  }, [storageKey]);

  const remove = useCallback((type: BookmarkType, id: string) => {
    setItems((prev) => {
      const next = prev.filter((b) => !(b.type === type && b.id === id));
      write(storageKey, next);
      return next;
    });
  }, [storageKey]);

  const clear = useCallback(() => { write(storageKey, []); setItems([]); }, [storageKey]);

  return { items, isPinned, toggle, remove, clear, max: MAX };
}
