import { useEffect, useRef, useCallback } from 'react';

type IdleDeadline = { didTimeout: boolean; timeRemaining: () => number };
type IdleCallback = (deadline: IdleDeadline) => void;

interface IdleWindow {
  requestIdleCallback?: (cb: IdleCallback, opts?: { timeout?: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
}

function scheduleIdle(cb: IdleCallback, timeout = 200): number {
  const w = (typeof window !== 'undefined' ? window : undefined) as IdleWindow | undefined;
  if (w?.requestIdleCallback) return w.requestIdleCallback(cb, { timeout });
  return (setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 0 }), 1) as unknown) as number;
}

function cancelIdle(handle: number): void {
  const w = (typeof window !== 'undefined' ? window : undefined) as IdleWindow | undefined;
  if (w?.cancelIdleCallback) {
    w.cancelIdleCallback(handle);
    return;
  }
  clearTimeout(handle as unknown as ReturnType<typeof setTimeout>);
}

interface Options<T> {
  /** Dataset completo já filtrado/ordenado. */
  items: readonly T[];
  /** Página atual (1-indexada). */
  page: number;
  /** Itens por página. */
  perPage: number;
  /** Total de páginas — usado para evitar prefetch além do fim. */
  totalPages: number;
}

interface PrefetchApi<T> {
  /** Slice pré-computado da próxima página (ou `null`). */
  nextSlice: T[] | null;
  /** Handler para `onMouseEnter`/`onFocus` no botão "Próxima". */
  warmNext: () => void;
}

/**
 * Pré-calcula o slice da próxima página em idle time, e expõe um warm-up
 * sob demanda (hover/focus do botão "Próxima") para tornar a troca instantânea.
 *
 * Trabalho 100% client-side: não há fetch envolvido — apenas evitamos pagar
 * o custo de `slice + render` no clique, antecipando-o.
 */
export function useNextPagePrefetch<T>({ items, page, perPage, totalPages }: Options<T>): PrefetchApi<T> {
  const cacheRef = useRef<{ key: string; slice: T[] } | null>(null);

  const nextPage = page + 1;
  const canPrefetch = nextPage <= totalPages && perPage > 0;
  const cacheKey = `${nextPage}:${perPage}:${items.length}`;

  const compute = useCallback((): T[] | null => {
    if (!canPrefetch) return null;
    if (cacheRef.current?.key === cacheKey) return cacheRef.current.slice;
    const start = (nextPage - 1) * perPage;
    const slice = items.slice(start, start + perPage);
    cacheRef.current = { key: cacheKey, slice };
    return slice;
  }, [canPrefetch, cacheKey, items, nextPage, perPage]);

  // Agenda prefetch em idle time sempre que dataset/página mudarem.
  useEffect(() => {
    if (!canPrefetch) {
      cacheRef.current = null;
      return;
    }
    const handle = scheduleIdle(() => {
      compute();
    }, 250);
    return () => cancelIdle(handle);
  }, [canPrefetch, compute]);

  const warmNext = useCallback(() => {
    compute();
  }, [compute]);

  return { nextSlice: cacheRef.current?.key === cacheKey ? cacheRef.current.slice : null, warmNext };
}
