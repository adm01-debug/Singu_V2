import { useEffect, useRef, useState, useCallback, startTransition, type RefObject } from 'react';

interface UseInfiniteListResult<T> {
  visible: T[];
  hasMore: boolean;
  loadMore: () => void;
  sentinelRef: RefObject<HTMLDivElement>;
}

interface UseInfiniteListOptions {
  /**
   * Chave opcional para persistir a profundidade revelada em `sessionStorage`.
   * Quando definida, hidrata `count` no mount e grava (debounced) a cada mudança.
   * Reset por `deps` também limpa a chave para evitar profundidade fantasma.
   */
  persistKey?: string;
}

function readPersistedCount(persistKey: string | undefined, pageSize: number): number {
  if (!persistKey) return pageSize;
  try {
    const raw = sessionStorage.getItem(persistKey);
    if (raw == null) return pageSize;
    const n = parseInt(raw, 10);
    if (Number.isFinite(n) && n >= pageSize) return n;
  } catch {
    /* sessionStorage indisponível (SSR / modo privado) — ignora */
  }
  return pageSize;
}

/**
 * Revela progressivamente itens de uma lista in-memory usando IntersectionObserver.
 * Reseta para `pageSize` quando qualquer dependência em `deps` muda.
 * Com `options.persistKey`, restaura a profundidade entre recarregamentos da aba.
 */
export function useInfiniteList<T>(
  items: T[],
  pageSize = 50,
  deps: ReadonlyArray<unknown> = [],
  options: UseInfiniteListOptions = {}
): UseInfiniteListResult<T> {
  const { persistKey } = options;
  const safeItems = Array.isArray(items) ? items : [];
  const [count, setCount] = useState<number>(() => readPersistedCount(persistKey, pageSize));
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isFirstResetRef = useRef(true);

  // Reset quando deps mudam (filtros, sort, etc.) e limpa cache de profundidade.
   
  useEffect(() => {
    // No primeiro mount, NÃO sobrescreve o count hidratado do sessionStorage.
    if (isFirstResetRef.current) {
      isFirstResetRef.current = false;
      return;
    }
    setCount(pageSize);
    if (persistKey) {
      try { sessionStorage.removeItem(persistKey); } catch { /* noop */ }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize, ...deps]);

  // Persistência debounced (200ms) da profundidade atual.
  const writeTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (!persistKey) return;
    if (writeTimerRef.current != null) window.clearTimeout(writeTimerRef.current);
    writeTimerRef.current = window.setTimeout(() => {
      try { sessionStorage.setItem(persistKey, String(count)); } catch { /* noop */ }
    }, 200);
    return () => {
      if (writeTimerRef.current != null) {
        window.clearTimeout(writeTimerRef.current);
        writeTimerRef.current = null;
      }
    };
  }, [count, persistKey]);

  const total = safeItems.length;
  const hasMore = count < total;

  const loadMore = useCallback(() => {
    startTransition(() => setCount(prev => Math.min(prev + pageSize, total === 0 ? prev + pageSize : total)));
  }, [pageSize, total]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: '400px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loadMore]);

  const visible = safeItems.slice(0, count);
  return { visible, hasMore, loadMore, sentinelRef };
}
