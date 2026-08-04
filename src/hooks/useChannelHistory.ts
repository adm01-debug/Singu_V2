import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

const BASE_KEY = 'channel-combo-history-v1';
const MAX = 5;
const VALID = new Set(['whatsapp', 'call', 'email', 'meeting', 'video_call', 'note']);

function sanitize(arr: unknown): string[] | null {
  if (!Array.isArray(arr)) return null;
  const out: string[] = [];
  const seen = new Set<string>();
  for (const v of arr) {
    if (typeof v !== 'string') continue;
    const lower = v.toLowerCase();
    if (!VALID.has(lower) || seen.has(lower)) continue;
    seen.add(lower);
    out.push(lower);
  }
  return out;
}

function read(storageKey: string): string[][] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const list: string[][] = [];
    for (const item of parsed) {
      const s = sanitize(item);
      // Mantém apenas combinações com >=1 canal (vazio == "todos", já é o default).
      if (s && s.length > 0) list.push(s);
      if (list.length >= MAX) break;
    }
    return list;
  } catch {
    return [];
  }
}

function write(storageKey: string, list: string[][]) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(list));
  } catch { /* noop */ }
}

function sameCombo(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

/**
 * Mantém um histórico MRU (até 5) de combinações de canais aplicadas, isolado por usuário.
 * Persiste em `localStorage` com chave derivada de `channel-combo-history-v1-{userId}`.
 *
 * - `record(combo)`: registra uma combinação não vazia, deduplicada e movida ao topo.
 * - `remove(combo)`: remove uma combinação específica do histórico.
 * - `clear()`: apaga o histórico inteiro.
 */
export function useChannelHistory() {
  const { user } = useAuth();
  const storageKey = `${BASE_KEY}-${user?.id ?? 'anon'}`;

  const [history, setHistory] = useState<string[][]>(() => read(storageKey));

  // Re-hydrate when user changes (login/logout)
  useEffect(() => {
    setHistory(read(storageKey));
  }, [storageKey]);

  // Sincroniza entre abas/janelas que compartilham o mesmo localStorage.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey) setHistory(read(storageKey));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [storageKey]);

  const record = useCallback((combo: string[]) => {
    const sanitized = sanitize(combo) ?? [];
    if (sanitized.length === 0) return;
    setHistory((prev) => {
      const filtered = prev.filter((c) => !sameCombo(c, sanitized));
      const next = [sanitized, ...filtered].slice(0, MAX);
      write(storageKey, next);
      return next;
    });
  }, [storageKey]);

  const remove = useCallback((combo: string[]) => {
    setHistory((prev) => {
      const next = prev.filter((c) => !sameCombo(c, combo));
      write(storageKey, next);
      return next;
    });
  }, [storageKey]);

  const clear = useCallback(() => {
    write(storageKey, []);
    setHistory([]);
  }, [storageKey]);

  return { history, record, remove, clear };
}

export const __test__ = { sanitize, sameCombo, BASE_KEY, MAX };
