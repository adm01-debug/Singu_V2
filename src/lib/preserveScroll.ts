/**
 * Preserva a posição vertical de scroll do `window` ao redor de uma mutação
 * que pode encurtar o documento (ex.: remover um chip de filtro que reduz a
 * lista visível em uma página longa).
 *
 * Por que isso é necessário:
 *  - Quando o documento encolhe abaixo de `window.scrollY`, o navegador
 *    *clampa* o scroll silenciosamente para `documentElement.scrollHeight -
 *    innerHeight`. Em listas longas, isso é percebido como um "salto" da
 *    página para cima.
 *  - O *scroll anchoring* nativo do Chrome/Firefox ajuda em alguns casos, mas
 *    é desativado em sticky bars, em containers com `overflow:auto`, e quando
 *    a mudança de altura ocorre acima da viewport — exatamente o cenário dos
 *    filtros aplicados na sticky bar.
 *
 * Estratégia:
 *  1. Captura `scrollY` ANTES da mutação.
 *  2. Em dois `requestAnimationFrame` (commit + layout estabilizado),
 *     re-aplica `scrollTo` clampado pela nova altura, com `behavior: 'auto'`
 *     para evitar animação visível.
 *  3. Se a posição não mudaria (delta < 1px), não chama `scrollTo` —
 *     evita acionar listeners de scroll desnecessariamente.
 *
 * Retorna um restaurador que pode ser chamado manualmente caso o consumidor
 * precise controlar o timing (ex.: depois de uma promise). Por padrão, o
 * agendamento já é feito automaticamente.
 */
export interface PreserveScrollHandle {
  /** Posição capturada no momento da chamada. */
  readonly y: number;
  /** Reaplica a posição manualmente (clampada). Idempotente. */
  restore: () => void;
}

export function preserveScroll(): PreserveScrollHandle {
  // SSR / ambiente sem DOM: no-op seguro.
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { y: 0, restore: () => {} };
  }

  const y = window.scrollY;

  const restore = () => {
    const doc = document.documentElement;
    const maxY = Math.max(0, (doc?.scrollHeight ?? 0) - window.innerHeight);
    const target = Math.min(y, maxY);
    if (Math.abs(window.scrollY - target) < 1) return;
    window.scrollTo({ top: target, left: window.scrollX, behavior: 'auto' });
  };

  // Dois rAFs: o primeiro garante que o React aplicou o commit; o segundo
  // garante que o browser concluiu layout/paint e a nova altura já está
  // refletida em `scrollHeight`. Sem isso, o `scrollHeight` lido pode ser o
  // antigo e o clamp seria incorreto.
  requestAnimationFrame(() => {
    requestAnimationFrame(restore);
  });

  return { y, restore };
}
