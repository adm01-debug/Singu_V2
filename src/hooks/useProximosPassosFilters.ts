import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export type NbaPriority = 'alta' | 'media' | 'baixa';
export type NbaSort = 'sugerido' | 'recomendacao' | 'prioridade' | 'canal';

const VALID_PRIORITIES: readonly NbaPriority[] = ['alta', 'media', 'baixa'];
const VALID_SORTS: readonly NbaSort[] = ['sugerido', 'recomendacao', 'prioridade', 'canal'];
const DEFAULT_SORT: NbaSort = 'sugerido';

/**
 * Sincroniza filtros + ordenação dos "Próximos Passos" da Ficha 360 com a URL.
 * Query params: ?nbaPrio=<csv>&nbaCanal=<csv>&nbaSort=<sort>
 */
export function useProximosPassosFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const priorities = useMemo<NbaPriority[]>(() => {
    const raw = searchParams.get('nbaPrio');
    if (!raw) return [];
    return raw
      .split(',')
      .map((p) => p.trim().toLowerCase())
      .filter((p): p is NbaPriority => (VALID_PRIORITIES as readonly string[]).includes(p));
  }, [searchParams]);

  const channels = useMemo<string[]>(() => {
    const raw = searchParams.get('nbaCanal');
    if (!raw) return [];
    return raw
      .split(',')
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean);
  }, [searchParams]);

  const sort = useMemo<NbaSort>(() => {
    const raw = (searchParams.get('nbaSort') || '').toLowerCase();
    return (VALID_SORTS as readonly string[]).includes(raw) ? (raw as NbaSort) : DEFAULT_SORT;
  }, [searchParams]);

  const setPriorities = useCallback(
    (next: NbaPriority[]) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          if (!Array.isArray(next) || next.length === 0) sp.delete('nbaPrio');
          else sp.set('nbaPrio', next.join(','));
          return sp;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setChannels = useCallback(
    (next: string[]) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          if (!Array.isArray(next) || next.length === 0) sp.delete('nbaCanal');
          else sp.set('nbaCanal', next.join(','));
          return sp;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setSort = useCallback(
    (next: NbaSort) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          if (next === DEFAULT_SORT) sp.delete('nbaSort');
          else sp.set('nbaSort', next);
          return sp;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const clear = useCallback(() => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        sp.delete('nbaPrio');
        sp.delete('nbaCanal');
        sp.delete('nbaSort');
        return sp;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const activeCount =
    (priorities.length > 0 ? 1 : 0) +
    (channels.length > 0 ? 1 : 0) +
    (sort !== DEFAULT_SORT ? 1 : 0);

  return { priorities, channels, sort, setPriorities, setChannels, setSort, clear, activeCount };
}
