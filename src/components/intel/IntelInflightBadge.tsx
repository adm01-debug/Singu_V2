import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * Badge "⟳ N" mostrando queries em voo em tempo real, com tooltip listando os primeiros 3 queryKeys ativos.
 */
export const IntelInflightBadge = () => {
  const fetching = useIsFetching();
  const qc = useQueryClient();

  const activeKeys = useMemo(() => {
    if (fetching === 0) return [];
    try {
      return qc
        .getQueryCache()
        .findAll({ fetchStatus: 'fetching' })
        .slice(0, 3)
        .map((q) => {
          try {
            return JSON.stringify(q.queryKey).slice(0, 60);
          } catch {
            return '[?]';
          }
        });
    } catch {
      return [];
    }
  }, [fetching, qc]);

  const tooltip =
    fetching === 0
      ? 'Sem queries em execução'
      : `Queries ativas (${fetching}):\n${activeKeys.join('\n')}`;

  return (
    <span
      className="hidden sm:inline-flex items-center gap-1.5"
      title={tooltip}
      aria-label={`${fetching} queries em execução`}
    >
      <RefreshCw
        className={`h-3 w-3 ${
          fetching > 0
            ? 'text-[hsl(var(--intel-accent))] animate-spin'
            : 'text-muted-foreground opacity-50'
        }`}
        aria-hidden
      />
      <span className={fetching > 0 ? 'text-[hsl(var(--intel-accent))]' : 'text-muted-foreground'}>
        INFLIGHT:{fetching}
      </span>
    </span>
  );
};
