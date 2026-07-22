import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

const BASE_KEY = 'intel-graph-layout-v1';

export interface GraphLayoutState {
  period: string;
  etype: string;
  minScore: number;
  /** Marcador de versão para futuras migrações. */
  v: 1;
  savedAt: number;
}

function read(storageKey: string): GraphLayoutState | null {
  try {
    const raw = localStorage.getItem(storageKey);
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

function write(storageKey: string, state: GraphLayoutState): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

/**
 * Persistência simples do layout/filtros do Graph, isolada por usuário.
 * Não captura zoom/pan (o NetworkVisualization recalcula internamente),
 * mas restaura período + tipo + score, que é o estado visualmente significativo.
 */
export function useGraphLayout() {
  const { user } = useAuth();
  const storageKey = `${BASE_KEY}-${user?.id ?? 'anon'}`;

  const [saved, setSaved] = useState<GraphLayoutState | null>(() => read(storageKey));

  // Re-hydrate when user changes (login/logout)
  useEffect(() => {
    setSaved(read(storageKey));
  }, [storageKey]);

  const save = useCallback((state: Omit<GraphLayoutState, 'v' | 'savedAt'>) => {
    const next: GraphLayoutState = { ...state, v: 1, savedAt: Date.now() };
    write(storageKey, next);
    setSaved(next);
  }, [storageKey]);

  const clear = useCallback(() => {
    try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
    setSaved(null);
  }, [storageKey]);

  return { saved, save, clear };
}
