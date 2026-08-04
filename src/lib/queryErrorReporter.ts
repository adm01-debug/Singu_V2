/**
 * Integração TanStack Query → errorReporting.
 * Registra QueryCache/MutationCache.onError para capturar erros de servidor
 * sem precisar embrulhar cada hook manualmente.
 */
import type { QueryClient } from '@tanstack/react-query';
import { captureError } from '@/lib/errorReporting';

export function attachQueryErrorReporter(queryClient: QueryClient): void {
  const queryCache = queryClient.getQueryCache();
  const mutationCache = queryClient.getMutationCache();

  queryCache.subscribe((event) => {
    if (event.type === 'updated' && event.action.type === 'error') {
      const err = event.action.error;
      if (err instanceof Error) {
        captureError(err, undefined, {
          source: 'tanstack-query',
          queryKey: event.query.queryKey,
          route: typeof window !== 'undefined' ? window.location.pathname : undefined,
        });
      }
    }
  });

  mutationCache.subscribe((event) => {
    if (event.type === 'updated' && event.action.type === 'error') {
      const err = event.action.error;
      if (err instanceof Error) {
        captureError(err, undefined, {
          source: 'tanstack-mutation',
          mutationKey: event.mutation.options.mutationKey,
          route: typeof window !== 'undefined' ? window.location.pathname : undefined,
        });
      }
    }
  });
}
