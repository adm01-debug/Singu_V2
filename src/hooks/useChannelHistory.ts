import { useCallback, useEffect, useState } from 'react';

const KEY = 'channel-combo-history-v1';
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

function read(): string[][] {
  try {
    const raw = localStorage.getItem(KEY);
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

function write(list: string[][]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch { /* noop */ }
}

function sameCombo(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

/**
 * Mantém um histórico MRU (até 5) de combinações de canais aplicadas.
 * Persiste em `localStorage` na chave `channel-combo-history-v1`.
 *
 * - `record(combo)`: registra uma combinação não vazia, deduplicada e movida ao topo.
 * - `remove(combo)`: remove uma combinação específica do histórico.
 * - `clear()`: apaga o histórico inteiro.
 */
export function useChannelHistory() {
  const [history, setHistory] = useState<string[][]>(() => read());

  // Sincroniza entre abas/janelas que compartilham o mesmo localStorage.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setHistory(read());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const record = useCallback((combo: string[]) => {
    const sanitized = sanitize(combo) ?? [];
    if (sanitized.length === 0) return;
    setHistory((prev) => {
      const filtered = prev.filter((c) => !sameCombo(c, sanitized));
      const next = [sanitized, ...filtered].slice(0, MAX);
      write(next);
      return next;
    });
  }, []);

  const remove = useCallback((combo: string[]) => {
    setHistory((prev) => {
      const next = prev.filter((c) => !sameCombo(c, combo));
      write(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    write([]);
    setHistory([]);
  }, []);

  return { history, record, remove, clear };
}

export const __test__ = { sanitize, sameCombo, KEY, MAX };
