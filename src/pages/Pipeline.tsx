import React, { useMemo, useCallback, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PipelinePageSkeleton } from '@/components/skeletons/PageSkeletons';
import { SEOHead } from '@/components/seo/SEOHead';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, DollarSign, Clock, Target, ArrowRight, Loader2, AlertTriangle, Gauge, Plus } from 'lucide-react';
import { useDealsPipeline, usePipelineSummary, useWeightedForecast, useMoveDeal, useStageVelocity, useStalledDeals, useVelocityMetrics, type PipelineDeal, type WeightedForecast } from '@/hooks/usePipeline';
import { useDealSlipRisk } from '@/hooks/useDealSlipRisk';
import { useDealForecastConfidence } from '@/hooks/useDealForecastConfidence';
import { DealRiskBadge } from '@/components/pipeline/DealRiskBadge';
import { DealRiskDrawer } from '@/components/pipeline/DealRiskDrawer';
import { DealDetailDrawer } from '@/components/pipeline/DealDetailDrawer';
import { DealDialog } from '@/components/pipeline/DealDialog';
import { DealConfidenceBadge } from '@/components/pipeline/DealConfidenceBadge';
import { ForecastConfidencePanel } from '@/components/pipeline/ForecastConfidencePanel';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STAGES = [
  { id: 'lead', name: 'Novo Lead', probability: 10, color: 'bg-muted' },
  { id: 'primeiro_contato', name: '1º Contato', probability: 20, color: 'bg-info/20' },
  { id: 'qualificacao', name: 'Qualificação', probability: 30, color: 'bg-info/40' },
  { id: 'proposta', name: 'Proposta', probability: 50, color: 'bg-warning/30' },
  { id: 'negociacao', name: 'Negociação', probability: 70, color: 'bg-warning/50' },
  { id: 'fechamento', name: 'Fechamento', probability: 90, color: 'bg-success/30' },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);

// ── Deal Card ──────────────────────────────────────

const DealCard = React.memo(function DealCard({
  deal,
  onOpenRisk,
  onEdit,
}: {
  deal: PipelineDeal;
  onOpenRisk: (deal: PipelineDeal) => void;
  onEdit: (deal: PipelineDeal) => void;
}) {
  const risk = useDealSlipRisk(deal);
  const conf = useDealForecastConfidence(deal);
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData('dealId', deal.id)}
      onClick={() => onEdit(deal)}
      className="p-3 rounded-lg border bg-card cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group relative"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-sm truncate flex-1">{deal.titulo}</p>
        <DealRiskBadge
          score={risk.score}
          level={risk.level}
          onClick={(e) => {
            e.stopPropagation();
            onOpenRisk(deal);
          }}
          dealId={deal.id}
          dealTitle={deal.titulo}
          factors={risk.factors}
          recommendations={risk.recommendations}
        />
      </div>
      {deal.company_name && (
        <p className="text-xs text-muted-foreground truncate mt-0.5">{deal.company_name}</p>
      )}
      <div className="flex items-center justify-between mt-2 gap-2">
        <span className="text-sm font-semibold text-primary">{formatCurrency(deal.valor)}</span>
        <DealConfidenceBadge
          confidence={conf.confidence}
          level={conf.level}
          expectedValue={conf.expectedCloseValue}
          dealId={deal.id}
          dealTitle={deal.titulo}
          factors={conf.factors}
        />
      </div>
      {(deal.dias_no_estagio_atual ?? 0) > 7 && (
        <div className="flex justify-end mt-1.5">
          <Badge variant="outline" className="text-xs text-warning">
            <Clock className="h-3 w-3 mr-1" />
            {deal.dias_no_estagio_atual}d
          </Badge>
        </div>
      )}
    </div>
  );
});

// ── Pipeline Column ────────────────────────────────

function PipelineColumn({
  stage,
  deals,
  onDrop,
  onOpenRisk,
  onEditDeal,
}: {
  stage: typeof STAGES[number];
  deals: PipelineDeal[];
  onDrop: (dealId: string, stageId: string) => void;
  onOpenRisk: (deal: PipelineDeal) => void;
  onEditDeal: (deal: PipelineDeal) => void;
}) {
  const totalValue = deals.reduce((sum, d) => sum + (d.valor || 0), 0);

  return (
    <div
      className="snap-center shrink-0 w-[85vw] sm:w-auto sm:flex-1 sm:min-w-[220px] sm:max-w-[280px]"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const dealId = e.dataTransfer.getData('dealId');
        if (dealId) onDrop(dealId, stage.id);
      }}
    >
      <div className={`rounded-t-lg px-3 py-2 ${stage.color}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{stage.name}</h3>
          <Badge variant="secondary" className="text-xs">{stage.probability}%</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {deals.length} deals · {formatCurrency(totalValue)}
        </p>
      </div>
      <div className="space-y-2 p-2 bg-muted/30 rounded-b-lg min-h-[200px] border border-t-0">
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} onOpenRisk={onOpenRisk} onEdit={onEditDeal} />
        ))}
        {deals.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">
            Arraste deals para cá
          </p>
        )}
      </div>
    </div>
  );
}

// ── Summary Cards ──────────────────────────────────

function SummaryCards({ forecast }: { forecast: WeightedForecast[] | null | undefined }) {
  const totals = useMemo(() => {
    if (!forecast) return { total: 0, weighted: 0, count: 0 };
    return forecast.reduce(
      (acc, f) => ({
        total: acc.total + (f.total_value || 0),
        weighted: acc.weighted + (f.weighted_value || 0),
        count: acc.count + (f.count || 0),
      }),
      { total: 0, weighted: 0, count: 0 }
    );
  }, [forecast]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Target className="h-4 w-4" />
            Deals Abertos
          </div>
          <p className="text-2xl font-bold mt-1">{totals.count}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <DollarSign className="h-4 w-4" />
            Valor Total
          </div>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totals.total)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <TrendingUp className="h-4 w-4" />
            Forecast Ponderado
          </div>
          <p className="text-2xl font-bold mt-1 text-success">{formatCurrency(totals.weighted)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <ArrowRight className="h-4 w-4" />
            Taxa Conversão
          </div>
          <p className="text-2xl font-bold mt-1">
            {totals.total > 0 ? ((totals.weighted / totals.total) * 100).toFixed(0) : 0}%
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Velocity Metrics Panel ─────────────────────────

function VelocityPanel() {
  const { data: velocity } = useVelocityMetrics();
  const { data: stageVel } = useStageVelocity();

  if (!velocity) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Gauge className="h-4 w-4 text-info" /> Velocidade do Pipeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border p-3 bg-muted/30">
            <p className="text-[11px] text-muted-foreground">Ciclo Médio</p>
            <p className="text-lg font-bold">{velocity.avg_cycle_days?.toFixed(0) ?? '—'}d</p>
          </div>
          <div className="rounded-lg border p-3 bg-muted/30">
            <p className="text-[11px] text-muted-foreground">Win Rate</p>
            <p className="text-lg font-bold text-success">{velocity.win_rate?.toFixed(0) ?? '—'}%</p>
          </div>
          <div className="rounded-lg border p-3 bg-muted/30">
            <p className="text-[11px] text-muted-foreground">Ticket Médio</p>
            <p className="text-lg font-bold">{formatCurrency(velocity.avg_deal_size ?? 0)}</p>
          </div>
          <div className="rounded-lg border p-3 bg-muted/30">
            <p className="text-[11px] text-muted-foreground">Velocity Score</p>
            <p className="text-lg font-bold text-primary">{velocity.velocity_score?.toFixed(1) ?? '—'}</p>
          </div>
        </div>
        {stageVel && stageVel.length > 0 && (
          <div className="space-y-1.5 mt-2">
            <p className="text-xs text-muted-foreground font-medium">Tempo por Estágio</p>
            {stageVel.map(sv => (
              <div key={sv.stage} className="flex items-center justify-between text-xs">
                <span>{sv.stage}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{sv.avg_days?.toFixed(1)}d avg</span>
                  <span className="text-muted-foreground">({sv.deal_count} deals)</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Stalled Deals Panel ───────────────────────────

function StalledDealsPanel() {
  const { data: stalled } = useStalledDeals(14);

  if (!stalled || stalled.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" /> Deals Parados
          <Badge variant="destructive" className="text-[10px] ml-auto">{stalled.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[280px] overflow-y-auto">
          {stalled.map(deal => (
            <div key={deal.id} className="flex items-center justify-between p-2.5 rounded-lg bg-destructive/5 border border-destructive/10">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{deal.titulo}</p>
                <p className="text-xs text-muted-foreground">{deal.company_name} · {deal.stage}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold">{formatCurrency(deal.valor)}</span>
                <Badge variant="outline" className={cn('text-[10px]', deal.days_stalled > 30 ? 'text-destructive' : 'text-warning')}>
                  {deal.days_stalled}d parado
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ──────────────────────────────────────

export default function Pipeline() {
  const { data: deals, isLoading: dealsLoading, error: dealsError } = useDealsPipeline();
  const { data: forecast } = useWeightedForecast();
  const moveDeal = useMoveDeal();
  const [riskDeal, setRiskDeal] = useState<PipelineDeal | null>(null);
  const [editDeal, setEditDeal] = useState<PipelineDeal | null>(null);
  const [isDealDialogOpen, setIsDealDialogOpen] = useState(false);

  const dealsByStage = useMemo(() => {
    const map: Record<string, PipelineDeal[]> = {};
    STAGES.forEach((s) => (map[s.id] = []));
    (deals || []).forEach((deal) => {
      const stage = deal.pipeline_stage || 'lead';
      if (!map[stage]) map[stage] = [];
      map[stage].push(deal);
    });
    return map;
  }, [deals]);

  const handleDrop = useCallback(
    (dealId: string, stageId: string) => {
      const stage = STAGES.find((s) => s.id === stageId);
      if (!stage) return;
      moveDeal.mutate(
        { dealId, newStage: stageId, probability: stage.probability },
        {
          onSuccess: () => toast.success(`Deal movido para ${stage.name}`),
          onError: () => toast.error('Erro ao mover deal'),
        }
      );
    },
    [moveDeal]
  );

  if (dealsLoading) {
    return (
      <AppLayout title="Pipeline">
        <PipelinePageSkeleton />
      </AppLayout>
    );
  }

  if (dealsError) {
    return (
      <AppLayout title="Pipeline">
        <div className="text-center py-20 text-destructive">
          <p>Erro ao carregar pipeline</p>
          <p className="text-sm text-muted-foreground mt-1">{(dealsError as Error).message}</p>
        </div>
      </AppLayout>
    );
  }
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
          <PipelineFilterBar 
            search={searchTerm} 
            onSearchChange={setSearchTerm} 
            onFilterChange={() => {}} 
          />
        </div>

  return (
    <AppLayout title="Pipeline">
      <SEOHead title="Pipeline de Vendas" description="Gerencie seus deals com drag & drop" />
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Pipeline de Vendas</h1>
            <p className="text-muted-foreground text-sm">Gerencie seus deals com drag & drop</p>
          </div>
          <Button onClick={() => setIsDealDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Deal
          </Button>
        </div>

        <DashboardErrorBoundary sectionName="Resumo do Pipeline">
          <SummaryCards forecast={forecast} />
        </DashboardErrorBoundary>

        <DashboardErrorBoundary sectionName="Confiança do Forecast">
          <ForecastConfidencePanel />
        </DashboardErrorBoundary>

        <p className="sm:hidden text-[11px] text-muted-foreground text-center -mb-1">← deslize para ver os estágios →</p>
        <DashboardErrorBoundary sectionName="Kanban de Deals">
          <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory sm:snap-none -mx-4 px-4 sm:mx-0 sm:px-0">
            {STAGES.map((stage) => (
              <PipelineColumn
                key={stage.id}
                stage={stage}
                deals={dealsByStage[stage.id] || []}
                onDrop={handleDrop}
                onOpenRisk={setRiskDeal}
                onEditDeal={setEditDeal}
              />
            ))}
          </div>
        </DashboardErrorBoundary>

        {/* Velocity & Stalled Deals */}
        <div className="grid gap-4 md:grid-cols-2">
          <DashboardErrorBoundary sectionName="Velocidade do Pipeline">
            <VelocityPanel />
          </DashboardErrorBoundary>
          <DashboardErrorBoundary sectionName="Deals Estagnados">
            <StalledDealsPanel />
          </DashboardErrorBoundary>
        </div>
      </div>

      <DealRiskDrawer
        deal={riskDeal}
        open={!!riskDeal}
        onOpenChange={(o) => !o && setRiskDeal(null)}
      />

      <DealDialog 
        open={isDealDialogOpen}
        onOpenChange={setIsDealDialogOpen}
      />

      <DealDetailDrawer
        deal={editDeal}
        open={!!editDeal}
        onOpenChange={(o) => !o && setEditDeal(null)}
      />
    </AppLayout>
  );
}
