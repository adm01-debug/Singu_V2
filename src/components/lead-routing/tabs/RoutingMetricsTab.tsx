import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useRoutingMetrics } from '@/hooks/useRoutingMetrics';
import { useSalesTeam } from '@/hooks/useSalesTeam';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp, Clock, Users, CheckCircle2,
  BarChart3, ArrowRightLeft, RefreshCw, Activity,
  Target, Zap, AlertTriangle, Download, Trophy, Medal,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ROLE_LABELS } from '@/types/leadRouting';

const TYPE_LABELS: Record<string, string> = {
  auto_round_robin: 'Round-Robin',
  auto_weighted: 'Ponderado',
  auto_territory: 'Território',
  manual: 'Manual',
  handoff: 'Handoff',
  redistribution: 'Redistribuição',
};

const TYPE_COLORS: Record<string, string> = {
  auto_round_robin: 'bg-primary',
  auto_weighted: 'bg-info',
  auto_territory: 'bg-success',
  manual: 'bg-warning',
  handoff: 'bg-accent',
  redistribution: 'bg-muted-foreground',
};

function MetricCard({
  title, value, subtitle, icon: Icon, color, progress, trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  progress?: number;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <Card className="border hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-bold">{value}</p>
              {trend === 'up' && <TrendingUp className="h-3.5 w-3.5 text-success" />}
              {trend === 'down' && <AlertTriangle className="h-3.5 w-3.5 text-warning" />}
            </div>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            {progress !== undefined && (
              <Progress value={progress} className="h-1.5 mt-2" />
            )}
          </div>
          <div className={`p-2.5 rounded-xl ${color}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DistributionChart({ byType }: { byType: Record<string, number> }) {
  const entries = useMemo(() =>
    Object.entries(byType)
      .sort(([, a], [, b]) => (b as number) - (a as number)),
    [byType],
  );
  const total = entries.reduce((s, [, v]) => s + (v as number), 0);
  if (total === 0) return null;

  return (
    <Card className="border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Distribuições por Tipo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {/* Visual bar chart */}
        <div className="flex h-8 rounded-lg overflow-hidden mb-4">
          {entries.map(([type, count]) => {
            const pct = Math.round(((count as number) / total) * 100);
            if (pct < 1) return null;
            return (
              <div
                key={type}
                className={`${TYPE_COLORS[type] ?? 'bg-muted'} flex items-center justify-center text-[10px] font-medium text-primary-foreground transition-all`}
                style={{ width: `${pct}%` }}
                title={`${TYPE_LABELS[type] ?? type}: ${count} (${pct}%)`}
              >
                {pct >= 10 ? `${pct}%` : ''}
              </div>
            );
          })}
        </div>

        {/* Legend with details */}
        <div className="grid grid-cols-2 gap-2">
          {entries.map(([type, count]) => {
            const pct = Math.round(((count as number) / total) * 100);
            return (
              <div key={type} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${TYPE_COLORS[type] ?? 'bg-muted'}`} />
                  <span className="text-xs">{TYPE_LABELS[type] ?? type.replace(/_/g, ' ')}</span>
                </div>
                <div className="text-xs font-semibold">
                  {count as number} <span className="text-muted-foreground font-normal">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function HealthScore({ metrics }: { metrics: { slaCompliance: number; avgFirstContactHours: number; pendingHandoffs: number } }) {
  const slaScore = Math.min(metrics.slaCompliance, 100);
  const speedScore = metrics.avgFirstContactHours <= 1 ? 100 : metrics.avgFirstContactHours <= 2 ? 80 : metrics.avgFirstContactHours <= 4 ? 60 : 30;
  const handoffScore = metrics.pendingHandoffs === 0 ? 100 : metrics.pendingHandoffs <= 3 ? 70 : 40;
  const overall = Math.round((slaScore * 0.4 + speedScore * 0.35 + handoffScore * 0.25));
  const label = overall >= 85 ? 'Excelente' : overall >= 70 ? 'Bom' : overall >= 50 ? 'Regular' : 'Crítico';
  const color = overall >= 85 ? 'text-success' : overall >= 70 ? 'text-info' : overall >= 50 ? 'text-warning' : 'text-destructive';

  return (
    <Card className="border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Target className="h-4 w-4" />
          Saúde da Distribuição
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="relative w-20 h-20">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9155" fill="none" strokeWidth="3" className="stroke-muted" />
              <circle
                cx="18" cy="18" r="15.9155" fill="none" strokeWidth="3"
                className={overall >= 85 ? 'stroke-success' : overall >= 70 ? 'stroke-info' : overall >= 50 ? 'stroke-warning' : 'stroke-destructive'}
                strokeDasharray={`${overall}, 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-lg font-bold ${color}`}>{overall}</span>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <Badge variant="outline" className={color}>{label}</Badge>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">SLA Compliance</span>
                <span className="font-medium">{slaScore}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Velocidade</span>
                <span className="font-medium">{speedScore}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Handoff Queue</span>
                <span className="font-medium">{handoffScore}%</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RoutingMetricsTab() {
  const { data: metrics, isLoading } = useRoutingMetrics();

  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total de Distribuições"
          value={metrics.totalAssignments}
          icon={BarChart3}
          color="bg-primary/10 text-primary"
        />
        <MetricCard
          title="Leads Ativos"
          value={metrics.activeAssignments}
          subtitle="Em carteira agora"
          icon={Users}
          color="bg-info/10 text-info"
        />
        <MetricCard
          title="SLA Compliance"
          value={`${metrics.slaCompliance}%`}
          subtitle={metrics.slaCompliance >= 80 ? 'Saudável' : 'Atenção necessária'}
          icon={CheckCircle2}
          color={metrics.slaCompliance >= 80 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}
          progress={metrics.slaCompliance}
          trend={metrics.slaCompliance >= 80 ? 'up' : 'down'}
        />
        <MetricCard
          title="Tempo Médio 1º Contato"
          value={`${metrics.avgFirstContactHours}h`}
          subtitle={metrics.avgFirstContactHours <= 2 ? 'Excelente' : metrics.avgFirstContactHours <= 4 ? 'Bom' : 'Lento'}
          icon={Clock}
          color="bg-accent/10 text-accent-foreground"
          trend={metrics.avgFirstContactHours <= 2 ? 'up' : metrics.avgFirstContactHours > 4 ? 'down' : 'neutral'}
        />
        <MetricCard
          title="SDRs Ativos"
          value={metrics.byRole.sdr}
          icon={Zap}
          color="bg-info/10 text-info"
        />
        <MetricCard
          title="Closers Ativos"
          value={metrics.byRole.closer}
          icon={Target}
          color="bg-success/10 text-success"
        />
        <MetricCard
          title="Handoffs Pendentes"
          value={metrics.pendingHandoffs}
          subtitle={metrics.pendingHandoffs > 0 ? 'Requer ação' : 'Tudo em dia'}
          icon={ArrowRightLeft}
          color={metrics.pendingHandoffs > 0 ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'}
          trend={metrics.pendingHandoffs > 0 ? 'down' : 'up'}
        />
        <MetricCard
          title="Redistribuições"
          value={metrics.redistributions}
          subtitle="Total histórico"
          icon={RefreshCw}
          color="bg-muted text-muted-foreground"
        />
      </div>

      {/* Health Score + Distribution Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HealthScore metrics={metrics} />
        <DistributionChart byType={metrics.byType as Record<string, number>} />
      </div>

      {/* Member Performance Ranking */}
      <MemberPerformanceRanking />

      {/* Export */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => exportMetricsCsv(metrics)}>
          <Download className="h-4 w-4 mr-1" />
          Exportar CSV
        </Button>
      </div>
    </div>
  );
}

/* ─── Member Performance Ranking ─── */
function MemberPerformanceRanking() {
  const { data: members = [] } = useSalesTeam();

  const ranked = useMemo(() => {
    if (!Array.isArray(members) || members.length === 0) return [];
    return [...members]
      .filter((m) => m.is_active)
      .sort((a, b) => b.current_lead_count - a.current_lead_count)
      .slice(0, 10);
  }, [members]);

  if (ranked.length === 0) return null;

  const maxLeads = ranked[0]?.current_lead_count || 1;

  return (
    <Card className="border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Trophy className="h-4 w-4 text-warning" />
          Ranking de Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {ranked.map((m, i) => {
          const pct = maxLeads > 0 ? Math.round((m.current_lead_count / maxLeads) * 100) : 0;
          const utilDay = m.max_leads_day > 0 ? Math.round((m.leads_today / m.max_leads_day) * 100) : 0;
          return (
            <div key={m.id} className="flex items-center gap-3">
              <div className="w-6 text-center shrink-0">
                {i === 0 ? <Trophy className="h-4 w-4 text-warning mx-auto" /> :
                 i === 1 ? <Medal className="h-4 w-4 text-muted-foreground mx-auto" /> :
                 <span className="text-xs text-muted-foreground">{i + 1}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium truncate">{m.name}</span>
                    <Badge variant="outline" className="text-[10px] px-1">{ROLE_LABELS[m.role]}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{m.current_lead_count} leads</span>
                    <span className={utilDay >= 90 ? 'text-destructive' : utilDay >= 70 ? 'text-warning' : ''}>
                      {utilDay}% dia
                    </span>
                  </div>
                </div>
                <Progress value={pct} className="h-1.5 mt-1" />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

/* ─── CSV Export ─── */
function exportMetricsCsv(metrics: {
  totalAssignments: number;
  activeAssignments: number;
  slaCompliance: number;
  avgFirstContactHours: number;
  redistributions: number;
  pendingHandoffs: number;
  byRole: { sdr: number; closer: number };
  byType: Record<string, number>;
}) {
  const lines = [
    'Métrica,Valor',
    `Total Distribuições,${metrics.totalAssignments}`,
    `Leads Ativos,${metrics.activeAssignments}`,
    `SLA Compliance,${metrics.slaCompliance}%`,
    `Tempo Médio 1º Contato,${metrics.avgFirstContactHours}h`,
    `Redistribuições,${metrics.redistributions}`,
    `Handoffs Pendentes,${metrics.pendingHandoffs}`,
    `SDRs Ativos,${metrics.byRole.sdr}`,
    `Closers Ativos,${metrics.byRole.closer}`,
    '',
    'Tipo Distribuição,Quantidade',
    ...Object.entries(metrics.byType).map(([k, v]) => `${k},${v}`),
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `metricas-rodizio-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
