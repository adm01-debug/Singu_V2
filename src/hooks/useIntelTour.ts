import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

const BASE_STORAGE_KEY = 'intel-tour-v1';
const VERSION = 1;

interface StoredTour {
  v: number;
  completed: boolean;
  completedAt?: number;
}

function read(storageKey: string): StoredTour {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return { v: VERSION, completed: false };
    const parsed = JSON.parse(raw) as Partial<StoredTour>;
    if (parsed.v !== VERSION) return { v: VERSION, completed: false };
    return { v: VERSION, completed: !!parsed.completed, completedAt: parsed.completedAt };
  } catch {
    return { v: VERSION, completed: false };
  }
}

function write(storageKey: string, state: StoredTour): void {
  try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* ignore */ }
}

/**
 * Persistência simples do estado do tour de onboarding do Intelligence Hub.
 */
export function useIntelTour() {
  const { user } = useAuth();
  const storageKey = `${BASE_STORAGE_KEY}-${user?.id ?? 'anon'}`;
  const [open, setOpen] = useState(false);
  const [completed, setCompleted] = useState<boolean>(false);

  useEffect(() => {
    const state = read(storageKey);
    setCompleted(state.completed);
    if (!state.completed) setOpen(true);
  }, [storageKey]);

  const complete = useCallback(() => {
    const state: StoredTour = { v: VERSION, completed: true, completedAt: Date.now() };
    write(storageKey, state);
    setCompleted(true);
    setOpen(false);
  }, [storageKey]);

  const reopen = useCallback(() => setOpen(true), []);

  const reset = useCallback(() => {
    write(storageKey, { v: VERSION, completed: false });
    setCompleted(false);
    setOpen(true);
  }, [storageKey]);

  return { open, completed, complete, reopen, reset, setOpen };
}
