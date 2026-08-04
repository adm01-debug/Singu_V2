/**
 * Provider Hierarchy Guard
 * 
 * Validates the order of providers in App.tsx to prevent white-screen crashes
 * caused by missing context dependencies.
 * 
 * ORDEM OBRIGATÓRIA (de fora para dentro):
 * 1. HelmetProvider       — sem dependências
 * 2. ErrorBoundary        — sem dependências
 * 3. QueryClientProvider  — sem dependências
 * 4. CelebrationProvider  — sem dependências
 * 5. AriaLiveProvider     — sem dependências
 * 6. TooltipProvider      — sem dependências
 * 7. BrowserRouter        — sem dependências
 * 8. AuthProvider         — depende de BrowserRouter, QueryClientProvider
 * 9. NavigationStackProvider — depende de BrowserRouter
 * 10. EasterEggsProvider  — depende de AuthProvider
 */

export interface ProviderDependency {
  name: string;
  requires: string[];
  contextHook?: string;
}

/** Canonical provider order with dependency declarations */
export const PROVIDER_ORDER: ProviderDependency[] = [
  { name: 'HelmetProvider', requires: [] },
  { name: 'ErrorBoundary', requires: [] },
  { name: 'QueryClientProvider', requires: [], contextHook: 'useQueryClient' },
  { name: 'CelebrationProvider', requires: [] },
  { name: 'AriaLiveProvider', requires: [] },
  { name: 'TooltipProvider', requires: [] },
  { name: 'BrowserRouter', requires: [] },
  { name: 'AuthProvider', requires: ['BrowserRouter', 'QueryClientProvider'], contextHook: 'useAuth' },
  { name: 'NavigationStackProvider', requires: ['BrowserRouter'] },
  { name: 'EasterEggsProvider', requires: ['AuthProvider'] },
];

/**
 * Validates that a provider's dependencies are satisfied by providers above it in the tree.
 * Returns a list of violations.
 */
export function validateProviderOrder(currentOrder: string[]): string[] {
  const violations: string[] = [];
  const seen = new Set<string>();

  for (const name of currentOrder) {
    const def = PROVIDER_ORDER.find(p => p.name === name);
    if (def) {
      for (const req of def.requires) {
        if (!seen.has(req)) {
          violations.push(
            `❌ ${name} requer ${req} como provider pai, mas ${req} não foi encontrado acima na árvore.`
          );
        }
      }
    }
    seen.add(name);
  }

  return violations;
}

/**
 * DEV-only: log provider order warnings to console.
 * Call once at app startup.
 */
export function assertProviderOrder(currentOrder: string[]): void {
  if (!import.meta.env.DEV) return;

  const violations = validateProviderOrder(currentOrder);
  if (violations.length > 0) {
    console.error(
      '%c🚨 PROVIDER HIERARCHY VIOLATION 🚨',
      'color: red; font-weight: bold; font-size: 14px;'
    );
    violations.forEach(v => console.error(v));
    console.error(
      'Ordem esperada:',
      PROVIDER_ORDER.map(p => p.name).join(' → ')
    );
  }
}

/**
 * Detects common "context not found" errors from provider ordering issues.
 */
export function isProviderOrderError(error: Error): boolean {
  const msg = error.message.toLowerCase();
  return (
    msg.includes('usecontext') ||
    msg.includes('must be used within') ||
    msg.includes('may only be used in') ||
    msg.includes('no queryClient set') ||
    msg.includes('usenavigate() may be used only') ||
    msg.includes('context of') ||
    msg.includes('provider')
  );
}
