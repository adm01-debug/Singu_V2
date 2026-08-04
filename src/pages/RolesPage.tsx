import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useAuth } from '@/hooks/useAuth';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function RolesPage() {
  const { user } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['all-user-roles', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_roles').select('id, role, user_id')
      .limit(500);
      if (error) return [];
      return Array.isArray(data) ? data : [];
    },
    enabled: isAdmin,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  if (adminLoading || isLoading) return <Skeleton className="h-64 m-6" />;
  if (!isAdmin) return <p className="p-6 text-muted-foreground">Acesso restrito a administradores.</p>;

  const grouped = roles.reduce((acc, r) => {
    acc[r.role] = (acc[r.role] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      <Helmet><title>Roles · SINGU CRM</title></Helmet>
      <div className="container mx-auto p-4 md:p-6 max-w-3xl space-y-4">
        <h1 className="text-2xl font-bold">Gerenciar Roles</h1>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(grouped).map(([role, count]) => (
            <Card key={role}>
              <CardContent className="p-4 text-center">
                <Badge variant="outline" className="mb-2">{role}</Badge>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground">usuários</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader><CardTitle className="text-sm">Atribuições</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {roles.map(r => (
                <div key={r.id} className="flex items-center justify-between p-2 rounded bg-muted/30 text-sm">
                  <span className="font-mono text-xs truncate">{r.user_id}</span>
                  <Badge variant="secondary">{r.role}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
