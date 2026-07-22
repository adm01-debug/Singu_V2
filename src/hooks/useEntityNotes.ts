import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

const BASE_STORAGE_PREFIX = 'intel-notes-v1:';
const DEBOUNCE_MS = 500;

export interface EntityNote {
  text: string;
  updatedAt: number;
}

function readNote(key: string, STORAGE_PREFIX: string): EntityNote {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return { text: '', updatedAt: 0 };
    const parsed = JSON.parse(raw) as Partial<EntityNote>;
    return { text: String(parsed.text || ''), updatedAt: Number(parsed.updatedAt || 0) };
  } catch {
    return { text: '', updatedAt: 0 };
  }
}

function writeNote(key: string, note: EntityNote, STORAGE_PREFIX: string): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(note));
  } catch {
    /* ignore */
  }
}

/**
 * Persistência de anotações livres por entidade no Intelligence Hub.
 * Autosave com debounce de 500ms. Identifica a entidade via `entityKey` (ex: "contact:abc123").
 */
export function useEntityNotes(entityKey: string | null) {
  const { user } = useAuth();
  const storagePrefix = `${BASE_STORAGE_PREFIX}${user?.id ?? 'anon'}:`;
  const [text, setText] = useState('');
  const [updatedAt, setUpdatedAt] = useState(0);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<number | null>(null);
  const keyRef = useRef<string | null>(null);

  // Carrega ao trocar entidade ou usuário (apenas read local).
  useEffect(() => {
    const fullKey = entityKey ? storagePrefix + entityKey : null;
    keyRef.current = fullKey;
    if (!fullKey) {
      setText('');
      setUpdatedAt(0);
      return;
    }
    const n = readNote(fullKey);
    setText(n.text);
    setUpdatedAt(n.updatedAt);
  }, [entityKey, storagePrefix]);

  const update = useCallback((next: string) => {
    setText(next);
    setSaving(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      const key = keyRef.current;
      if (!key) {
        setSaving(false);
        return;
      }
      const ts = Date.now();
      writeNote(key, { text: next, updatedAt: ts });
      setUpdatedAt(ts);
      setSaving(false);
    }, DEBOUNCE_MS);
  }, []);

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  const clear = useCallback(() => {
    if (!keyRef.current) return;
    try { localStorage.removeItem(keyRef.current); } catch { /* ignore */ }
    setText('');
    setUpdatedAt(0);
  }, []);

  return { text, updatedAt, saving, update, clear };
}
