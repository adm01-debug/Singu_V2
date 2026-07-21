import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function RolePermissionsPage() {
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();

  const { data, isLoading } = useQuery({
    queryKey: ['role-permissions-matrix'],
    queryFn: async () => {
      const { data: rp, error } = await supabase
        .from('role_permissions')
        .select('role, permission_id, permissions(name, module, action)')
        .limit(200);
      if (error || !Array.isArray(rp)) return [];
      return rp.map(r => ({
        role: r.role,
        permissionName: (r.permissions as unknown as { name: string })?.name ?? r.permission_id,
        module: (r.permissions as unknown as { module: string })?.module ?? '',
        action: (r.permissions as unknown as { action: string })?.action ?? '',
      }));
    },
    enabled: isAdmin,
    staleTime: 60_000,
  });

  if (adminLoading || isLoading) return <Skeleton className="h-64 m-6" />;
  if (!isAdmin) return <p className="p-6 text-muted-foreground">Acesso restrito.</p>;

  const grouped = (data ?? []).reduce((acc, r) => {
    if (!acc[r.role]) acc[r.role] = [];
    acc[r.role].push(r);
    return acc;
  }, {} as Record<string, typeof data>);

  return (
    <>
      <Helmet><title>Role-Permissões · SINGU CRM</title></Helmet>
      <div className="container mx-auto p-4 md:p-6 max-w-3xl space-y-4">
        <h1 className="text-2xl font-bold">Mapa Role × Permissões</h1>
        {Object.entries(grouped).map(([role, perms]) => (
          <Card key={role}>
            <CardHeader>
              <CardTitle className="text-sm"><Badge variant="default">{role}</Badge></CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {(perms ?? []).map((p, i) => (
                  <Badge key={i} variant="outline" className="text-[10px]">{p.permissionName}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        {Object.keys(grouped).length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma associação role↔permissão configurada.</p>
        )}
      </div>
    </>
  );
}
