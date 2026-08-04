import { toast } from 'sonner';
import type { QueryClient, QueryKey } from '@tanstack/react-query';

/**
 * Toast padronizado para conflitos de edição concorrente (HTTP 409 / CONCURRENT_EDIT).
 *
 * Exibe mensagem destrutiva com ação **Recarregar** que invalida a query relevante
 * via TanStack Query, garantindo que o usuário receba a versão mais recente do registro.
 *
 * Uso:
 *   if (error instanceof ConcurrentEditError) {
 *     showConcurrentEditToast({ entity: 'contato', queryClient, queryKey });
 *   }
 */
export interface ConcurrentEditToastOptions {
  /** Nome da entidade em PT-BR (ex: 'contato', 'empresa', 'oportunidade') */
  entity: string;
  /** QueryClient do TanStack Query para invalidação */
  queryClient: QueryClient;
  /** Chave da query a invalidar ao clicar em "Recarregar" */
  queryKey: QueryKey;
}

export function showConcurrentEditToast({ entity, queryClient, queryKey }: ConcurrentEditToastOptions) {
  toast.error('Edição concorrente detectada', {
    description: `Outro usuário modificou este ${entity}. Recarregue para ver a versão atualizada e tente novamente.`,
    duration: 8000,
    action: {
      label: 'Recarregar',
      onClick: () => {
        queryClient.invalidateQueries({ queryKey }).catch(() => {});
      },
    },
  });
  // Invalidação automática em background mesmo se usuário ignorar a ação
  queryClient.invalidateQueries({ queryKey }).catch(() => {});
}
