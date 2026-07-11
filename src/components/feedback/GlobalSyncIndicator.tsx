import { useIsFetching } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Indicador global e discreto de sincronização em segundo plano.
 * Aparece no rodapé quando há queries ativas do TanStack Query.
 * Não bloqueia UI, apenas comunica atividade.
 */
export const GlobalSyncIndicator = () => {
  const fetching = useIsFetching();
  const visible = fetching > 0;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        'pointer-events-none fixed bottom-3 right-3 z-40 flex items-center gap-2 rounded-full border border-border/50 bg-background/80 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur transition-opacity duration-200',
        visible ? 'opacity-100' : 'opacity-0',
      )}
      role="status"
    >
      <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
      <span>Sincronizando…</span>
    </div>
  );
};

export default GlobalSyncIndicator;