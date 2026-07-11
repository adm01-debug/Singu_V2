import { type ComponentType, type ReactNode, createElement, Fragment } from 'react';

export type ProviderEntry =
  | ComponentType<{ children: ReactNode }>
  | [ComponentType<Record<string, unknown>>, Record<string, unknown>];

/**
 * Compõe uma lista de providers em uma única árvore aninhada, evitando
 * pirâmide de indentação. A ordem do array define a ordem de aninhamento
 * (primeiro = mais externo).
 *
 * @example
 *   composeProviders([HelmetProvider, [ErrorBoundary, { showDetails: true }]], <App />)
 */
export function composeProviders(providers: ProviderEntry[], children: ReactNode): ReactNode {
  return providers.reduceRight<ReactNode>((acc, entry) => {
    if (Array.isArray(entry)) {
      const [Component, props] = entry;
      return createElement(Component, props, acc);
    }
    return createElement(entry, null, acc);
  }, createElement(Fragment, null, children));
}