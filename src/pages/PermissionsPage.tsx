import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function PermissionsPage() {
  const { user } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ['all-permissions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('permissions').select('*').order('module')
      .limit(1000);
      if (error) return [];
      return Array.isArray(data) ? data : [];
    },
    enabled: isAdmin,
    staleTime: 60_000,
  });

  if (adminLoading || isLoading) return <Skeleton className="h-64 m-6" />;
  if (!isAdmin) return <p className="p-6 text-muted-foreground">Acesso restrito.</p>;

  const grouped = permissions.reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {} as Record<string, typeof permissions>);

  return (
    <>
      <Helmet><title>Permissões · SINGU CRM</title></Helmet>
      <div className="container mx-auto p-4 md:p-6 max-w-3xl space-y-4">
        <h1 className="text-2xl font-bold">Permissões do Sistema</h1>
        {Object.entries(grouped).map(([module, perms]) => (
          <Card key={module}>
            <CardHeader><CardTitle className="text-sm capitalize">{module}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {perms.map(p => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded bg-muted/30">
                  <div>
                    <p className="text-sm font-mono">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{p.action}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
