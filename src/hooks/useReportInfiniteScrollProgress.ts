import { useEffect } from 'react';

/**
 * Payload do evento global `infinite-scroll-progress`.
 * Permite que listeners (ex.: ScrollToTopButton) consumam progresso de
 * carregamento incremental sem prop drilling — a fonte (ex.: lista de
 * interações) publica e qualquer overlay global pode reagir.
 */
export interface InfiniteScrollProgress {
  /** Identificador da fonte (ex.: 'interacoes', 'ficha-ultimas-<id>'). */
  scope: string;
  /** Itens já revelados pela paginação client-side. */
  totalLoaded: number;
  /** Total de itens disponíveis após filtros. */
  total: number;
  /** Há mais itens a serem carregados? */
  hasMore: boolean;
  /** Rótulo legível do tipo de item (ex.: 'interações', 'contatos'). */
  itemLabel?: string;
}

export const INFINITE_SCROLL_PROGRESS_EVENT = 'infinite-scroll-progress';
export const INFINITE_SCROLL_CLEAR_EVENT = 'infinite-scroll-clear';

/**
 * Publica o progresso de uma lista com infinite scroll em um evento global.
 * Faz cleanup automático no unmount, evitando contagens fantasma após sair da
 * tela. Idempotente: dispara apenas quando algum dos valores muda.
 */
export function useReportInfiniteScrollProgress(
  scope: string,
  totalLoaded: number,
  total: number,
  hasMore: boolean,
  itemLabel = 'itens',
) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const detail: InfiniteScrollProgress = { scope, totalLoaded, total, hasMore, itemLabel };
    window.dispatchEvent(new CustomEvent(INFINITE_SCROLL_PROGRESS_EVENT, { detail }));
    return () => {
      window.dispatchEvent(
        new CustomEvent(INFINITE_SCROLL_CLEAR_EVENT, { detail: { scope } }),
      );
    };
  }, [scope, totalLoaded, total, hasMore, itemLabel]);
}
