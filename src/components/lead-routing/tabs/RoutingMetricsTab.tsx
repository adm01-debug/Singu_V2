import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRoutingMetrics } from '@/hooks/useRoutingMetrics';
import { useRodizioExecucoes } from '@/hooks/useRodizioOndas';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp, Users, BarChart3, Download, Trophy, Medal, Snowflake, ShieldAlert, History,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EXECUCAO_TIPO_LABELS } from '@/types/rodizio';

function MetricCard({
  title, value, subtitle, icon: Icon, color,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card className="border hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`p-2.5 rounded-xl ${color}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Seção "Auditoria" (antiga aba RedistributionLogTab): reversões de execução
 * (`foi_revertida = true`), lidas da mesma view de execuções usada na aba
 * Ondas — não há mais uma tabela separada de log de redistribuição.
 */
function ReversoesRecentes() {
  const { data: execucoes = [], isLoading } = useRodizioExecucoes();
  const revertidas = useMemo(() => execucoes.filter((e) => e.foi_revertida), [execucoes]);

  if (isLoading) {
    return <Skeleton className="h-24 w-full" />;
  }

  if (revertidas.length === 0) {
    return <p className="text-xs text-muted-foreground">Nenhuma execução foi revertida.</p>;
  }

  return (
    <div className="space-y-2">
      {revertidas.slice(0, 15).map((e) => (
        <div key={e.id} className="flex items-center justify-between gap-3 text-xs border-b last:border-0 pb-2 last:pb-0">
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="text-[10px]">Revertida</Badge>
            <span>{EXECUCAO_TIPO_LABELS[e.tipo]} · {e.executado_por_nome ?? 'Sistema'}</span>
          </div>
          <span className="text-muted-foreground">
            {format(new Date(e.iniciado_em), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
            {' · '}
            {formatDistanceToNow(new Date(e.iniciado_em), { addSuffix: true, locale: ptBR })}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function RoutingMetricsTab() {
  const { data: kpis, isLoading } = useRoutingMetrics();

  if (isLoading || !kpis) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
    );
  }

  const totals = kpis.reduce(
    (acc, k) => {
      acc.ativo += k.total_ativo;
      acc.naoAtivado += k.total_nao_ativado;
      acc.inativo += k.total_inativo;
      acc.poolFrio += k.total_pool_frio;
      acc.bloqueiosMes += k.bloqueios_mes;
      acc.recebidos30d += k.clientes_recebidos_30d;
      acc.vendasPosRotacao += k.vendas_pos_rotacao;
      return acc;
    },
    { ativo: 0, naoAtivado: 0, inativo: 0, poolFrio: 0, bloqueiosMes: 0, recebidos30d: 0, vendasPosRotacao: 0 },
  );
  const totalCarteira = totals.ativo + totals.naoAtivado + totals.inativo;
  const taxaAtivacaoMedia = kpis.length > 0
    ? Math.round((kpis.reduce((s, k) => s + k.taxa_ativacao_pct, 0) / kpis.length) * 10) / 10
    : 0;

  const ranked = [...kpis].sort((a, b) => b.total_ativo - a.total_ativo).slice(0, 10);
  const maxAtivo = ranked[0]?.total_ativo || 1;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Clientes Ativos" value={totals.ativo} subtitle={`de ${totalCarteira} na carteira`} icon={Users} color="bg-success/10 text-success" />
        <MetricCard title="Taxa de Ativação Média" value={`${taxaAtivacaoMedia}%`} icon={TrendingUp} color={taxaAtivacaoMedia >= 50 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'} />
        <MetricCard title="Não Ativados" value={totals.naoAtivado} icon={BarChart3} color="bg-info/10 text-info" />
        <MetricCard title="Pool Frio" value={totals.poolFrio} icon={Snowflake} color="bg-muted text-muted-foreground" />
        <MetricCard title="Bloqueios no Mês" value={totals.bloqueiosMes} icon={ShieldAlert} color="bg-warning/10 text-warning" />
        <MetricCard title="Recebidos (30d)" value={totals.recebidos30d} icon={Users} color="bg-primary/10 text-primary" />
        <MetricCard title="Vendas Pós-Rotação" value={totals.vendasPosRotacao} icon={TrendingUp} color="bg-success/10 text-success" />
        <MetricCard title="Closers na Base" value={kpis.length} icon={Users} color="bg-info/10 text-info" />
      </div>

      {/* Ranking + Auditoria */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4 text-warning" />
              Ranking por Clientes Ativos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {ranked.map((k, i) => {
              const pct = maxAtivo > 0 ? Math.round((k.total_ativo / maxAtivo) * 100) : 0;
              return (
                <div key={k.closer_id} className="flex items-center gap-3">
                  <div className="w-6 text-center shrink-0">
                    {i === 0 ? <Trophy className="h-4 w-4 text-warning mx-auto" /> :
                     i === 1 ? <Medal className="h-4 w-4 text-muted-foreground mx-auto" /> :
                     <span className="text-xs text-muted-foreground">{i + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate">{k.closer_nome}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{k.total_ativo} ativos</span>
                        <span>{k.taxa_ativacao_pct}% ativação</span>
                      </div>
                    </div>
                    <Progress value={pct} className="h-1.5 mt-1" />
                  </div>
                </div>
              );
            })}
            {ranked.length === 0 && <p className="text-xs text-muted-foreground">Sem dados de closers.</p>}
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="h-4 w-4" />
              Auditoria — Execuções Revertidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReversoesRecentes />
          </CardContent>
        </Card>
      </div>

      {/* Export */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => exportKpisCsv(kpis)}>
          <Download className="h-4 w-4 mr-1" />
          Exportar CSV
        </Button>
      </div>
    </div>
  );
}

/* ─── CSV Export ─── */
function exportKpisCsv(kpis: NonNullable<ReturnType<typeof useRoutingMetrics>['data']>) {
  const lines = [
    'Closer,Ativos,Não Ativados,Inativos,Pool Frio,Taxa Ativação %,Bloqueios Mês,Recebidos 30d,Vendas Pós-Rotação',
    ...kpis.map((k) =>
      [
        k.closer_nome, k.total_ativo, k.total_nao_ativado, k.total_inativo,
        k.total_pool_frio, k.taxa_ativacao_pct, k.bloqueios_mes,
        k.clientes_recebidos_30d, k.vendas_pos_rotacao,
      ].join(','),
    ),
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kpis-rodizio-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
