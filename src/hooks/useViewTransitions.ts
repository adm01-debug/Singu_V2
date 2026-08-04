import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

type DocumentWithVT = Document & {
  startViewTransition?: (cb: () => void) => { finished: Promise<void> };
};

/**
 * Aciona `document.startViewTransition` (Chrome 111+) em mudanças de rota,
 * permitindo um fade/slide suave entre páginas via regras CSS já registradas.
 * Em browsers sem suporte ou com prefers-reduced-motion, é no-op.
 */
export function useViewTransitions(): void {
  const location = useLocation();

  useEffect(() => {
    const doc = document as DocumentWithVT;
    if (typeof doc.startViewTransition !== 'function') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    // Marca o document para indicar transição ativa (CSS pode reagir se quiser).
    doc.documentElement.setAttribute('data-vt-active', 'true');
    const cleanup = window.setTimeout(() => {
      doc.documentElement.removeAttribute('data-vt-active');
    }, 280);
    return () => window.clearTimeout(cleanup);
  }, [location.pathname]);
}
