import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Database, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useSchemaDriftAlerts,
  useResolveDriftAlert,
  type SchemaDriftAlert,
} from '@/hooks/useSchemaDriftAlerts';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  return `${Math.floor(hours / 24)}d atrás`;
}

function AlertRow({ alert, onResolve }: { alert: SchemaDriftAlert; onResolve: (id: string) => void }) {
  const typeColors: Record<string, string> = {
    missing_column: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    rpc_error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    type_mismatch: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  };

  return (
    <div className="flex items-start justify-between gap-4 p-4 border rounded-lg bg-card">
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={typeColors[alert.error_type] ?? ''}>
            {alert.error_type}
          </Badge>
          <Badge variant="secondary">{alert.entity_type}: {alert.entity_name}</Badge>
          <span className="text-xs text-muted-foreground">{timeAgo(alert.created_at)}</span>
        </div>
        {alert.error_message && (
          <p className="text-sm text-muted-foreground font-mono truncate">{alert.error_message}</p>
        )}
      </div>
      {!alert.resolved && (
        <Button size="sm" variant="outline" onClick={() => onResolve(alert.id)}>
          <CheckCircle2 className="h-4 w-4 mr-1" /> Resolver
        </Button>
      )}
    </div>
  );
}

function StatsCards({ alerts }: { alerts: SchemaDriftAlert[] }) {
  const now = Date.now();
  const last24h = alerts.filter(a => now - new Date(a.created_at).getTime() < 24 * 3600_000).length;
  const last7d = alerts.filter(a => now - new Date(a.created_at).getTime() < 7 * 24 * 3600_000).length;
  const unresolved = alerts.filter(a => !a.resolved).length;

  const stats = [
    { label: 'Não resolvidos', value: unresolved, icon: AlertTriangle, color: 'text-red-500' },
    { label: 'Últimas 24h', value: last24h, icon: Clock, color: 'text-yellow-500' },
    { label: 'Últimos 7 dias', value: last7d, icon: Database, color: 'text-blue-500' },
    { label: 'Total registrado', value: alerts.length, icon: Shield, color: 'text-muted-foreground' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(s => (
        <Card key={s.label}>
          <CardContent className="p-4 flex items-center gap-3">
            <s.icon className={`h-5 w-5 ${s.color}`} />
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AdminSchemaDrift() {
  const [tab, setTab] = useState('unresolved');
  const { data: allAlerts = [], isLoading } = useSchemaDriftAlerts(false);
  const resolveMutation = useResolveDriftAlert();

  const unresolvedAlerts = allAlerts.filter(a => !a.resolved);
  const resolvedAlerts = allAlerts.filter(a => a.resolved);

  const handleResolve = (id: string) => {
    resolveMutation.mutate(id, {
      onSuccess: () => toast.success('Alerta marcado como resolvido'),
      onError: () => toast.error('Erro ao resolver alerta'),
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Schema Drift Monitor</h1>
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Database className="h-6 w-6" /> Schema Drift Monitor
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Monitora inconsistências entre o schema esperado e o banco externo.
        </p>
      </div>

      <StatsCards alerts={allAlerts} />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="unresolved">
            Não resolvidos ({unresolvedAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolvidos ({resolvedAlerts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unresolved" className="space-y-3 mt-4">
          {unresolvedAlerts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                Nenhum alerta de schema drift pendente.
              </CardContent>
            </Card>
          ) : (
            unresolvedAlerts.map(a => (
              <AlertRow key={a.id} alert={a} onResolve={handleResolve} />
            ))
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-3 mt-4">
          {resolvedAlerts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Nenhum alerta resolvido ainda.
              </CardContent>
            </Card>
          ) : (
            resolvedAlerts.map(a => (
              <AlertRow key={a.id} alert={a} onResolve={handleResolve} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
