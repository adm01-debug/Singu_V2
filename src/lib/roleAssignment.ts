/**
 * Regras da atribuição de papéis em /admin/roles.
 *
 * Fonte da verdade: enum `app_role` e as tabelas `user_roles`, `role_permissions` e
 * `permissions` do Supabase. A escrita em `user_roles` só é liberada por RLS para
 * quem tem o papel `admin`.
 */

export const APP_ROLES = ['admin', 'manager', 'salesperson', 'moderator', 'user'] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Administrador',
  manager: 'Gestor',
  salesperson: 'Vendedor',
  moderator: 'Moderador',
  user: 'Usuário',
};

/** Papéis sem nenhuma linha em `role_permissions`: não concedem nenhuma permissão. */
export const ROLES_WITHOUT_PERMISSIONS: readonly AppRole[] = ['moderator', 'user'];

export interface RoleAssignment {
  id: string;
  user_id: string;
  role: string;
}

export function isAppRole(value: string): value is AppRole {
  return (APP_ROLES as readonly string[]).includes(value);
}

/** `admin`, `manager` e `salesperson` têm permissão mapeada; `moderator` e `user` não. */
export function hasPermissionsMapped(role: AppRole): boolean {
  return !ROLES_WITHOUT_PERMISSIONS.includes(role);
}

export function rolesOfUser(assignments: readonly RoleAssignment[], userId: string): AppRole[] {
  return assignments
    .filter((a) => a.user_id === userId && isAppRole(a.role))
    .map((a) => a.role as AppRole)
    .sort((a, b) => APP_ROLES.indexOf(a) - APP_ROLES.indexOf(b));
}

export function usersWithoutRole(profiles: readonly { id: string }[], assignments: readonly RoleAssignment[]): string[] {
  const comPapel = new Set(assignments.map((a) => a.user_id));
  return profiles.filter((p) => !comPapel.has(p.id)).map((p) => p.id);
}

/**
 * Um admin não pode remover o próprio `admin`: sem ele a tela de papéis fica
 * inacessível e o papel só voltaria por SQL manual.
 */
export function canRemoveRole(
  actingUserId: string | undefined,
  targetUserId: string,
  role: AppRole,
): boolean {
  return !(actingUserId === targetUserId && role === 'admin');
}

export function describeRoleError(error: unknown): string {
  const code = (error as { code?: string } | null)?.code;
  if (code === '23505') return 'Este usuário já tem esse papel.';
  if (code === '23503') return 'Este perfil não tem conta de login; não é possível atribuir papel.';
  if (code === '42501') return 'Sem permissão para alterar papéis (apenas administradores).';
  const message = (error as { message?: string } | null)?.message;
  return message ? `Falha ao salvar: ${message}` : 'Falha ao salvar o papel.';
}