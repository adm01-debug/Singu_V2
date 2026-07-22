import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Permission {
  id: string;
  name: string;
  description: string | null;
  module: string;
  action: string;
}

export function useRBAC() {
  const { user } = useAuth();

  const { data: userRoles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .limit(20);
      if (error) return [];
      return Array.isArray(data) ? data.map(r => r.role) : [];
    },
    enabled: !!user,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const { data: permissions = [], isLoading: permsLoading } = useQuery({
    queryKey: ['user-permissions', userRoles],
    queryFn: async () => {
      if (userRoles.length === 0) return [];
      const { data, error } = await supabase
        .from('role_permissions')
        .select('permission_id, permissions(id, name, description, module, action)')
        .in('role', userRoles)
        .limit(200);
      if (error || !Array.isArray(data)) return [];
      const perms: Permission[] = [];
      for (const rp of data) {
        const p = rp.permissions as unknown as Permission | null;
        if (p) perms.push(p);
      }
      return perms;
    },
    enabled: userRoles.length > 0,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const hasPermission = (permName: string): boolean =>
    permissions.some(p => p.name === permName);

  const hasRole = (role: string): boolean =>
    userRoles.includes(role as typeof userRoles[number]);

  const hasModuleAccess = (module: string): boolean =>
    permissions.some(p => p.module === module);

  return {
    userRoles,
    permissions,
    hasPermission,
    hasRole,
    hasModuleAccess,
    isLoading: rolesLoading || permsLoading,
  };
}
