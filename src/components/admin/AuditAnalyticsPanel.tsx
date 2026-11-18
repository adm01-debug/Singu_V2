import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Layers, Gauge } from 'lucide-react';
import { useAuditAnalytics } from '@/hooks/useAuditAnalytics';

/** Rótulos em português para as ações registradas no log. */
const ROTULO_ACAO: Record<string, string> = {
  INSERT: 'Criação',
  UPDATE: 'Alteração',
  DELETE: 'Exclusão',
  SELECT: 'Leitura',
};

function rotuloAcao(acao: string) {
  return ROTULO_ACAO[acao.toUpperCase()] ?? acao;
}

/**
 * Resumo agregado dos últimos 30 dias do Audit Trail.
 *
 * Consome a edge function `audit-analytics`, que já estava publicada e sem
 * nenhum chamador no front.
 */
export function AuditAnalyticsPanel() {
  const { data, isLoading, error } = useAuditAnalytics();

  if (error) {
    return (
      <Card className="border-destructive/40">
        <CardContent className="pt-6 text-sm text-destructive">
          Não foi possível carregar o resumo dos últimos 30 dias.
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[0, 1, 2].map(i => <Skeleton key={i} className="h-32" />)}
      </div>
    );
  }

  if (!data || data.total_logs === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Nenhum registro de auditoria nos últimos 30 dias.
        </CardContent>
      </Card>
    );
  }

  const porHora = data.activity_by_hour ?? [];
  const picos = [...porHora].sort((a, b) => b.count - a.count)[0];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Registros (30 dias)</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total_logs.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">
              {picos ? `Hora de pico: ${String(picos.hour).padStart(2, '0')}h` : 'Sem pico definido'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Entidades mais alteradas</CardTitle>
            <Layers className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-1">
            {(data.top_entities ?? []).slice(0, 4).map(e => (
              <div key={e.entity} className="flex justify-between text-xs">
                <span className="text-muted-foreground truncate">{e.entity}</span>
                <span className="font-medium">{e.count.toLocaleString('pt-BR')}</span>
              </div>
            ))}
            {(data.top_entities ?? []).length === 0 && (
              <p className="text-xs text-muted-foreground">Sem entidades no período.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Operações por tipo</CardTitle>
            <Gauge className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-1">
            {(data.operations_by_type ?? []).slice(0, 4).map(o => (
              <div key={o.action} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{rotuloAcao(o.action)}</span>
                <span className="font-medium">{o.count.toLocaleString('pt-BR')}</span>
              </div>
            ))}
            {(data.operations_by_type ?? []).length === 0 && (
              <p className="text-xs text-muted-foreground">Sem operações no período.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Atividade por hora do dia</CardTitle>
        </CardHeader>
        <CardContent className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={porHora}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
              <XAxis
                dataKey="hour"
                tickFormatter={h => `${String(h).padStart(2, '0')}h`}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                interval={2}
              />
              <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <Tooltip
                labelFormatter={h => `${String(h).padStart(2, '0')}h`}
                formatter={(v: number) => [v.toLocaleString('pt-BR'), 'Registros']}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
