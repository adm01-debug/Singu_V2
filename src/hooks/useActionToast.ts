import { useCallback } from 'react';
import { toast } from 'sonner';
import { useAriaLiveRegion } from '@/components/feedback/AriaLiveRegion';

interface UndoOptions {
  /** Texto exibido no toast */
  message: string;
  /** Callback executado se o usuário clicar em "Desfazer" */
  onUndo: () => void | Promise<void>;
  /** Descrição secundária opcional */
  description?: string;
  /** Tempo (ms) até confirmar a ação. Default: 5000 */
  timeoutMs?: number;
}

/**
 * Wrapper unificado de feedback para mutations:
 * - success / error / info / warning padronizados (com ARIA)
 * - destructive(): toast com botão "Desfazer" usando Sonner
 *
 * Uso:
 *   const { destructive } = useActionToast();
 *   destructive({ message: 'Contato excluído', onUndo: () => restore(id) });
 */
export function useActionToast() {
  const { announce } = useAriaLiveRegion();

  const success = useCallback((message: string, description?: string) => {
    toast.success(message, { description });
    announce(message, 'polite');
  }, [announce]);

  const error = useCallback((message: string, description?: string) => {
    toast.error(message, { description });
    announce(message, 'assertive');
  }, [announce]);

  const info = useCallback((message: string, description?: string) => {
    toast.info(message, { description });
    announce(message, 'polite');
  }, [announce]);

  const warning = useCallback((message: string, description?: string) => {
    toast.warning(message, { description });
    announce(message, 'polite');
  }, [announce]);

  const destructive = useCallback(({ message, onUndo, description, timeoutMs = 5000 }: UndoOptions) => {
    toast(message, {
      description,
      duration: timeoutMs,
      action: {
        label: 'Desfazer',
        onClick: () => {
          try {
            const result = onUndo();
            if (result instanceof Promise) result.catch(() => undefined);
          } catch {
            // swallow — feedback do erro fica a cargo do chamador
          }
        },
      },
    });
    announce(message, 'polite');
  }, [announce]);

  return { success, error, info, warning, destructive };
}
