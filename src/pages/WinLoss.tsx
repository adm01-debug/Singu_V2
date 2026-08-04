import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, X, Target, Sparkles, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWinLossMetrics, useWinLossInsights, useGenerateInsights, useCompetitors } from '@/hooks/useWinLoss';
import type { WinLossOutcome } from '@/hooks/useWinLoss';
import { LossReasonsChart } from '@/components/win-loss/LossReasonsChart';
import { CompetitorWinRateChart } from '@/components/win-loss/CompetitorWinRateChart';
import { WinLossRecordsTable } from '@/components/win-loss/WinLossRecordsTable';
import { WinLossInsightCard } from '@/components/win-loss/WinLossInsightCard';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { parseApiError } from '@/lib/errorMessages';
import { Helmet } from 'react-helmet-async';

export default function WinLoss() {
  const [period, setPeriod] = useState(90);
  const [outcomeFilter, setOutcomeFilter] = useState<WinLossOutcome | 'all'>('all');
  const [competitorFilter, setCompetitorFilter] = useState<string>('all');

  const { data: metrics, isLoading } = useWinLossMetrics(period);
  const { data: insights } = useWinLossInsights();
  const { data: competitors } = useCompetitors();
  const generate = useGenerateInsights();

  const handleGenerate = async () => {
    try {
      const res = await generate.mutateAsync(period);
      const count = res?.insights?.length ?? 0;
      if (count === 0) {
        toast.warning('Nenhum insight gerado', { description: res?.message ?? 'Dados insuficientes ou erro de IA.' });
      } else {
        toast.success(`${count} insights gerados`);
      }
    } catch (e) {
      toast.error('Erro ao gerar insights', { description: parseApiError(e) });
    }
  };

  return (
    <>
      <Helmet>
        <title>Win/Loss Intelligence | SINGU</title>
        <meta name="description" content="Análise estruturada de deals ganhos e perdidos com insights de IA." />
      </Helmet>
      <div className="container mx-auto p-4 md:p-6 space-y-4 max-w-7xl">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              Win/Loss Intelligence
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Padrões e insights de deals ganhos e perdidos.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={String(period)} onValueChange={(v) => setPeriod(Number(v))}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 dias</SelectItem>
                <SelectItem value="90">90 dias</SelectItem>
                <SelectItem value="180">180 dias</SelectItem>
                <SelectItem value="365">1 ano</SelectItem>
              </SelectContent>
            </Select>
            <Button asChild variant="outline" size="sm">
              <Link to="/win-loss/setup">
                <Settings className="h-4 w-4 mr-1.5" />Configurar
              </Link>
            </Button>
          </div>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPI
            icon={Trophy}
            label="Win Rate"
            value={isLoading ? null : `${metrics?.win_rate ?? 0}%`}
            sub={isLoading ? '' : `${metrics?.won ?? 0} ganhos / ${metrics?.lost ?? 0} perdas`}
            tone="emerald"
          />
          <KPI
            icon={Target}
            label="Ticket médio (won)"
            value={isLoading ? null : `R$ ${(metrics?.avg_won_value ?? 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
            sub={metrics?.avg_cycle_won ? `Ciclo médio: ${metrics.avg_cycle_won}d` : ''}
            tone="primary"
          />
          <KPI
            icon={X}
            label="Top motivo de perda"
            value={isLoading ? null : (metrics?.top_loss_reason?.label ?? '—')}
            sub={metrics?.top_loss_reason ? `${metrics.top_loss_reason.count} perdas` : ''}
            tone="rose"
          />
          <KPI
            icon={Sparkles}
            label="Concorrentes ativos"
            value={isLoading ? null : String(competitors?.length ?? 0)}
            sub={`${metrics?.competitor_distribution?.length ?? 0} em deals`}
            tone="violet"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="records" className="space-y-3">
          <TabsList>
            <TabsTrigger value="records">Registros</TabsTrigger>
            <TabsTrigger value="charts">Gráficos</TabsTrigger>
            <TabsTrigger value="insights">Insights IA</TabsTrigger>
          </TabsList>

          <TabsContent value="records" className="space-y-3">
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Select value={outcomeFilter} onValueChange={(v) => setOutcomeFilter(v as WinLossOutcome | 'all')}>
                    <SelectTrigger className="w-40"><SelectValue placeholder="Resultado" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos resultados</SelectItem>
                      <SelectItem value="won">Ganhos</SelectItem>
                      <SelectItem value="lost">Perdidos</SelectItem>
                      <SelectItem value="no_decision">Sem decisão</SelectItem>
                      <SelectItem value="pending">Pendentes</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={competitorFilter} onValueChange={setCompetitorFilter}>
                    <SelectTrigger className="w-48"><SelectValue placeholder="Concorrente" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos concorrentes</SelectItem>
                      {(competitors ?? []).map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <WinLossRecordsTable
                  outcomeFilter={outcomeFilter === 'all' ? undefined : outcomeFilter}
                  competitorFilter={competitorFilter === 'all' ? undefined : competitorFilter}
                  fromDate={new Date(Date.now() - period * 86400_000).toISOString()}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="charts" className="space-y-3">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {isLoading ? (
                <>
                  <Skeleton className="h-80" /><Skeleton className="h-80" />
                </>
              ) : (
                <>
                  <LossReasonsChart reasons={metrics?.reason_distribution ?? []} />
                  <CompetitorWinRateChart competitors={metrics?.competitor_distribution ?? []} />
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-3">
            <div className="flex justify-end">
              <Button onClick={handleGenerate} disabled={generate.isPending}>
                <Sparkles className="h-4 w-4 mr-1.5" />
                {generate.isPending ? 'Gerando...' : 'Gerar insights com IA'}
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(insights ?? []).map(i => <WinLossInsightCard key={i.id} insight={i} />)}
              {(!insights || insights.length === 0) && (
                <Card className="md:col-span-2">
                  <CardContent className="py-12 text-center text-sm text-muted-foreground">
                    Nenhum insight gerado ainda. Clique em "Gerar insights com IA".
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function KPI({ icon: Icon, label, value, sub, tone }: {
  icon: typeof Trophy; label: string; value: string | null; sub?: string;
  tone: 'emerald' | 'rose' | 'primary' | 'violet';
}) {
  const toneCls = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    rose: 'text-rose-600 dark:text-rose-400',
    primary: 'text-primary',
    violet: 'text-violet-600 dark:text-violet-400',
  }[tone];
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
          <Icon className={`h-3.5 w-3.5 ${toneCls}`} />
          <span>{label}</span>
        </div>
        {value === null ? (
          <Skeleton className="h-7 w-20" />
        ) : (
          <p className="text-2xl font-bold tracking-tight truncate">{value}</p>
        )}
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{sub}</p>}
      </CardContent>
    </Card>
  );
}
