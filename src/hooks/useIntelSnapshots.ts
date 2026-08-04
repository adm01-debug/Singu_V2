import { useCallback, useEffect, useState } from 'react';
import {
  BASE_STORAGE_KEY,
  encodeSnapshot,
  pushRecentSnapshot,
  readRecentSnapshots,
  type IntelSnapshotPayload,
  type RecentSnapshot,
} from '@/lib/intelSnapshot';
import { useAuth } from '@/hooks/useAuth';

/**
 * Gerencia snapshots locais do Intelligence Hub (máx 5).
 * Cria snapshot a partir de um payload e mantém histórico em localStorage.
 */
export function useIntelSnapshots() {
  const { user } = useAuth();
  const storageKey = `${BASE_STORAGE_KEY}-${user?.id ?? 'anon'}`;
  const [items, setItems] = useState<RecentSnapshot[]>([]);

  useEffect(() => {
    setItems(readRecentSnapshots(storageKey));
  }, [storageKey]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey) setItems(readRecentSnapshots(storageKey));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [storageKey]);

  const create = useCallback((payload: IntelSnapshotPayload, label: string) => {
    const hash = encodeSnapshot(payload);
    const next = pushRecentSnapshot({ label, hash }, storageKey);
    setItems(next);
    return hash;
  }, [storageKey]);

  return { items, create };
}
