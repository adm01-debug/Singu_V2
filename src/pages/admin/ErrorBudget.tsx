import { useErrorBudget } from '@/hooks/useErrorBudget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Activity, ShieldCheck, AlertTriangle, OctagonAlert, Info, Bell, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UptimeSparkline } from '@/components/admin/UptimeSparkline';
import { MttaSlaBreachHistoryCard } from '@/components/admin/MttaSlaBreachHistoryCard';
import { MttaSlaThresholdEditor } from '@/components/admin/MttaSlaThresholdEditor';
import { MttaAutoAckHeartbeatCard } from '@/components/admin/MttaAutoAckHeartbeatCard';
import { AiGatewayHealthCard } from '@/components/admin/AiGatewayHealthCard';
import { AiGatewayPartitionsCard } from '@/components/admin/AiGatewayPartitionsCard';
import { RpcPerfCard } from '@/components/admin/RpcPerfCard';
import { RpcPlanSnapshotsCard } from '@/components/admin/RpcPlanSnapshotsCard';

function StatCard({
  title,
  value,
  hint,
  icon: Icon,
  tone = 'default',
}: {
  title: string;
  value: string;
  hint: string;
  icon: React.ElementType;
  tone?: 'default' | 'success' | 'warning' | 'destructive';
}) {
  const toneClasses = {
    default: 'text-foreground',
    success: 'text-success',
    warning: 'text-warning',
    destructive: 'text-destructive',
  } as const;

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={cn('w-4 h-4', toneClasses[tone])} />
      </CardHeader>
      <CardContent>
        <div className={cn('text-3xl font-bold', toneClasses[tone])}>{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{hint}</p>
      </CardContent>
    </Card>
  );
}

export default function ErrorBudget() {
  const { data, isLoading, error } = useErrorBudget();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <header>
          <h1 className="text-3xl font-bold">Error Budget</h1>
          <p className="text-muted-foreground">Carregando snapshots de saúde dos últimos 30 dias…</p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Falha ao calcular Error Budget</AlertTitle>
          <AlertDescription>
            {String((error as Error)?.message || 'Resposta vazia da função error-budget.')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const consumedTone = data.freeze_active ? 'destructive' : data.freeze_warning ? 'warning' : 'success';
  const uptimeTone = data.uptime_pct >= data.slo_target_pct ? 'success' : 'destructive';
  const freezeBadge = data.freeze_active
    ? { variant: 'destructive' as const, label: '🔴 FREEZE ATIVO', tone: 'destructive' as const }
    : data.freeze_warning
      ? { variant: 'secondary' as const, label: '🟡 ATENÇÃO', tone: 'warning' as const }
      : { variant: 'default' as const, label: '🟢 SAUDÁVEL', tone: 'success' as const };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Error Budget</h1>
          <p className="text-muted-foreground">
            Janela de {data.window_hours}h • {data.total_samples} snapshots • atualizado a cada 5 min
          </p>
        </div>
        <Badge variant={freezeBadge.variant} className="text-sm px-3 py-1">{freezeBadge.label}</Badge>
      </header>

      {data.freeze_active && (
        <Alert variant="destructive">
          <OctagonAlert className="h-4 w-4" />
          <AlertTitle>Deploys bloqueados — Error Budget esgotado</AlertTitle>
          <AlertDescription>
            Consumo ≥100% do orçamento mensal. Conforme RUNBOOK §Error Budget Policy: pause feature
            releases, foque em correções de confiabilidade e documente postmortem para cada incidente
            que contribuiu para o estouro.
          </AlertDescription>
        </Alert>
      )}

      {data.freeze_warning && !data.freeze_active && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Atenção — Budget &gt;50% consumido</AlertTitle>
          <AlertDescription>
            Reduza o ritmo de mudanças não-críticas. Priorize hardening e testes de regressão.
          </AlertDescription>
        </Alert>
      )}

      {data.active_alerts && data.active_alerts.length > 0 && (
        <Card variant={data.active_alerts.some(a => a.severity === 'critical') ? 'destructive' : 'warning'}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="w-4 h-4" />
              Alertas ativos ({data.active_alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.active_alerts.map((a) => (
              <div key={a.id} className="flex items-start gap-2 text-sm">
                <Badge
                  variant={a.severity === 'critical' ? 'destructive' : a.severity === 'high' ? 'secondary' : 'outline'}
                  className="shrink-0 mt-0.5"
                >
                  {a.threshold_pct}%
                </Badge>
                <div className="flex-1">
                  <p>{a.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Disparado em {new Date(a.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="SLO Target"
          value={`${data.slo_target_pct}%`}
          hint={`Meta de disponibilidade mensal (${data.budget_total_minutes.toFixed(0)} min/mês)`}
          icon={ShieldCheck}
        />
        <StatCard
          title="Uptime real (30d)"
          value={`${data.uptime_pct.toFixed(2)}%`}
          hint={data.uptime_pct >= data.slo_target_pct ? 'Acima do SLO ✓' : 'Abaixo do SLO'}
          icon={Activity}
          tone={uptimeTone}
        />
        <StatCard
          title="Budget consumido"
          value={`${data.budget_consumed_pct.toFixed(1)}%`}
          hint={`${data.downtime_minutes.toFixed(0)} de ${data.budget_total_minutes.toFixed(0)} min permitidos`}
          icon={AlertTriangle}
          tone={consumedTone}
        />
        <StatCard
          title="Status freeze"
          value={data.freeze_active ? 'BLOQUEADO' : data.freeze_warning ? 'ATENÇÃO' : 'LIBERADO'}
          hint={data.freeze_active ? 'Deploys de feature suspensos' : 'Deploys normais permitidos'}
          icon={OctagonAlert}
          tone={freezeBadge.tone}
        />
      </div>

      {data.daily_uptime && data.daily_uptime.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="w-4 h-4" /> Uptime diário (30d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UptimeSparkline data={data.daily_uptime} sloTarget={data.slo_target_pct} />
          </CardContent>
        </Card>
      )}

      <MttaSlaBreachHistoryCard />

      <MttaSlaThresholdEditor />

      <MttaAutoAckHeartbeatCard />

      <AiGatewayHealthCard />

      <AiGatewayPartitionsCard />

      <RpcPerfCard />
      <RpcPlanSnapshotsCard />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="w-4 h-4" /> Como interpretar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">SLO 99.5%</strong> permite até{' '}
            <strong className="text-foreground">{data.budget_total_minutes.toFixed(0)} minutos</strong> de
            indisponibilidade nos últimos 30 dias. Cada snapshot do <code>system-health</code> conta como{' '}
            {data.sample_interval_minutes} min — degradado vale 50%, unhealthy vale 100%.
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li><span className="text-success font-medium">🟢 &lt;50%</span> — operação normal, todos os deploys liberados</li>
            <li><span className="text-warning font-medium">🟡 50–100%</span> — atenção, reduzir mudanças não-críticas</li>
            <li><span className="text-destructive font-medium">🔴 ≥100%</span> — freeze: bloquear features, focar em confiabilidade</li>
          </ul>
          <p className="pt-2">
            Detalhes completos em <code>docs/RUNBOOK.md</code> §Error Budget Policy.
          </p>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground">
        Amostras: {data.down_samples} unhealthy • {data.degraded_samples} degraded •{' '}
        {data.total_samples - data.down_samples - data.degraded_samples} healthy • Computado em{' '}
        {new Date(data.computed_at).toLocaleString('pt-BR')}
      </div>
    </div>
  );
}
