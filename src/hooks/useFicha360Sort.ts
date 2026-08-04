import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export type Ficha360Sort = 'recente' | 'relevante';

const DEFAULT: Ficha360Sort = 'recente';
const PARAM = 'ordem';

/**
 * Persiste o modo de ordenação das "Últimas Interações" da Ficha 360 na URL
 * via `?ordem=relevante`. Omitido quando = `recente` (default) para manter
 * URLs limpas. Whitelist evita valores inválidos vindos de deeplinks.
 */
export function useFicha360Sort() {
  const [params, setParams] = useSearchParams();
  const raw = params.get(PARAM);
  const sort: Ficha360Sort = raw === 'relevante' ? 'relevante' : DEFAULT;

  const setSort = useCallback(
    (next: Ficha360Sort) => {
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          if (next === DEFAULT) p.delete(PARAM);
          else p.set(PARAM, next);
          return p;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  return { sort, setSort };
}
