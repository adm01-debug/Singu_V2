import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useRBAC } from '@/hooks/useRBAC';

interface RequirePermissionProps {
  permission: string;
  children: ReactNode;
  redirectTo?: string;
}

/**
 * Guard de permissão por rota, sobre a matriz `permissions` x `role_permissions`.
 *
 * Fail-open de propósito: usuário sem papel atribuído e o período de carregamento
 * do RBAC mantêm o acesso legado. Só restringe quem tem papel explícito e não
 * possui a permissão pedida.
 */
export function RequirePermission({ permission, children, redirectTo = '/' }: RequirePermissionProps) {
  const { userRoles, hasPermission, isLoading } = useRBAC();

  if (isLoading || userRoles.length === 0) return <>{children}</>;
  if (hasPermission(permission)) return <>{children}</>;

  return <Navigate to={redirectTo} replace />;
}

export default RequirePermission;