import { useCallback, useEffect, useState } from 'react';
import type { BookmarkType } from './useEntityBookmarks';

export interface HistoryEntry {
  type: BookmarkType;
  id: string;
  name: string;
}

interface State {
  stack: HistoryEntry[];
  cursor: number;
}

/**
 * Pilha de navegação do Entity 360 com back/forward (estilo browser).
 * Atalhos: Alt+← / Alt+→.
 */
export function useEntityHistory() {
  const [state, setState] = useState<State>({ stack: [], cursor: -1 });

  const current = state.cursor >= 0 ? state.stack[state.cursor] ?? null : null;
  const canBack = state.cursor > 0;
  const canForward = state.cursor >= 0 && state.cursor < state.stack.length - 1;

  const push = useCallback((entry: HistoryEntry) => {
    setState((prev) => {
      const truncated = prev.stack.slice(0, prev.cursor + 1);
      const last = truncated[truncated.length - 1];
      if (last && last.type === entry.type && last.id === entry.id) return prev;
      const stack = [...truncated, entry];
      return { stack, cursor: stack.length - 1 };
    });
  }, []);

  const back = useCallback(() => {
    setState((prev) => prev.cursor > 0 ? { ...prev, cursor: prev.cursor - 1 } : prev);
  }, []);

  const forward = useCallback(() => {
    setState((prev) =>
      prev.cursor < prev.stack.length - 1 ? { ...prev, cursor: prev.cursor + 1 } : prev
    );
  }, []);

  const reset = useCallback(() => setState({ stack: [], cursor: -1 }), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) return;
      if (e.key === 'ArrowLeft' && canBack) { e.preventDefault(); back(); }
      if (e.key === 'ArrowRight' && canForward) { e.preventDefault(); forward(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [back, forward, canBack, canForward]);

  return { current, stack: state.stack, cursor: state.cursor, canBack, canForward, push, back, forward, reset };
}
