/**
 * Mapa rota -> permissao da matriz RBAC (`permissions` x `role_permissions`).
 *
 * Fonte unica para a guarda de rota (`RequirePermission`) e para os menus: o menu
 * nao anuncia uma pagina que o guarda vai bloquear. Rota fora do mapa e liberada.
 */
export const ROUTE_PERMISSIONS: Record<string, string> = {
  '/analytics': 'view_analytics',
  '/nlp-analytics': 'view_analytics',
  '/configuracoes': 'view_settings',
  '/intelligence/auditoria': 'view_audit',
  '/metas': 'view_goals',
  '/sequencias': 'view_cadences',
  '/playbooks': 'view_playbooks',
};

/**
 * Fail-open igual ao `RequirePermission`: sem papel atribuido ou RBAC ainda
 * carregando, o item continua visivel (acesso legado preservado).
 */
export function canAccessRoute(
  url: string,
  hasPermission: (permission: string) => boolean,
  userRoles: readonly string[],
  isLoading: boolean,
): boolean {
  const required = ROUTE_PERMISSIONS[url];
  if (!required) return true;
  if (isLoading || userRoles.length === 0) return true;
  return hasPermission(required);
}
