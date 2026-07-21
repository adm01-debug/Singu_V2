import { useCallback, useState } from 'react';

const STORAGE_KEY = 'intel-graph-layout-v1';

export interface GraphLayoutState {
  period: string;
  etype: string;
  minScore: number;
  /** Marcador de versão para futuras migrações. */
  v: 1;
  savedAt: number;
}

function read(): GraphLayoutState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GraphLayoutState>;
    if (!parsed || parsed.v !== 1) return null;
    return {
      period: String(parsed.period || '30'),
      etype: String(parsed.etype || ''),
      minScore: Number(parsed.minScore || 0),
      v: 1,
      savedAt: Number(parsed.savedAt || 0),
    };
  } catch {
    return null;
  }
}

function write(state: GraphLayoutState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

/**
 * Persistência simples do layout/filtros do Graph.
 * Não captura zoom/pan (o NetworkVisualization recalcula internamente),
 * mas restaura período + tipo + score, que é o estado visualmente significativo.
 */
export function useGraphLayout() {
  const [saved, setSaved] = useState<GraphLayoutState | null>(() => read());

  const save = useCallback((state: Omit<GraphLayoutState, 'v' | 'savedAt'>) => {
    const next: GraphLayoutState = { ...state, v: 1, savedAt: Date.now() };
    write(next);
    setSaved(next);
  }, []);

  const clear = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setSaved(null);
  }, []);

  return { saved, save, clear };
}
