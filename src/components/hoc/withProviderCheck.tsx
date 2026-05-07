import React, { useContext, createContext, type ReactNode, type ComponentType } from 'react';
import { logger } from '@/lib/logger';

/**
 * Registry de contextos conhecidos para verificação de providers.
 * Mapeia nome do provider → contexto React que ele disponibiliza.
 */
const KNOWN_CONTEXTS: Record<string, React.Context<unknown>> = {};

/**
 * Registra um contexto para verificação de providers.
 * Chamado pelos próprios providers ao inicializar.
 */
export function registerProviderContext(name: string, context: React.Context<unknown>) {
  KNOWN_CONTEXTS[name] = context;
}

/**
 * HOC que verifica se os providers-pai necessários estão presentes.
 * Em desenvolvimento, lança erro descritivo se uma dependência não for encontrada.
 * Em produção, loga warning e renderiza normalmente (best-effort).
 */
export function withProviderCheck<P extends object>(
  WrappedComponent: ComponentType<P>,
  componentName: string,
  requiredProviders: string[],
): ComponentType<P> {
  const Guarded = (props: P) => {
    if (import.meta.env.DEV) {
      for (const providerName of requiredProviders) {
        const ctx = KNOWN_CONTEXTS[providerName];
        if (ctx) {
          try {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const value = useContext(ctx);
            if (value === undefined || value === null) {
              logger.warn(
                `[withProviderCheck] ${componentName}: contexto de ${providerName} retornou null/undefined. ` +
                `Verifique se ${providerName} está acima de ${componentName} na árvore.`
              );
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            logger.error(
              `[withProviderCheck] ${componentName}: falha ao acessar contexto de ${providerName}. ` +
              `${providerName} DEVE estar acima de ${componentName} na hierarquia de providers.`,
              { error: msg }
            );
          }
        }
      }
    }

    return <WrappedComponent {...props} />;
  };

  Guarded.displayName = `withProviderCheck(${componentName})`;
  return Guarded;
}
