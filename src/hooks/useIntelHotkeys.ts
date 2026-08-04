import { useEffect } from 'react';

const TAB_BY_KEY: Record<string, string> = {
  g: 'graph',
  e: 'entity',
  c: 'crossref',
  a: 'ask',
};

/**
 * Atalhos globais do Intelligence Hub: pressionar G/E/C/A fora de inputs
 * salta para a aba correspondente.
 */
export function useIntelHotkeys(setTab: (t: string) => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable) return;
      const next = TAB_BY_KEY[e.key.toLowerCase()];
      if (!next) return;
      e.preventDefault();
      setTab(next);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setTab]);
}
