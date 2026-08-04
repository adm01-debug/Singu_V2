import { QueryClient } from '@tanstack/react-query';

/**
 * Query client singleton — extraído de App.tsx na Rodada O (Ação 8).
 * Configura retry inteligente (não retry em 4xx) e backoff exponencial.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof Error && 'status' in error) {
          const status = (error as { status: number }).status;
          if (status >= 400 && status < 500) return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// Rodada F — telemetria de erros: pluga QueryCache/MutationCache no errorReporting central
import('@/lib/queryErrorReporter').then(({ attachQueryErrorReporter }) => {
  attachQueryErrorReporter(queryClient);
}).catch(() => undefined);
