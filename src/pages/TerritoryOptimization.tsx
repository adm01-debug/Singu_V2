import { Helmet } from 'react-helmet-async';
import { MapPinned, RefreshCw, Sparkles, Target, Users, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTerritoryOptimization } from '@/hooks/useTerritoryOptimization';
import { TerritoryHealthBanner } from '@/components/territory-optimization/TerritoryHealthBanner';
import { TerritoryRecommendationCard } from '@/components/territory-optimization/TerritoryRecommendationCard';
import { TerritoryLoadChart } from '@/components/territory-optimization/TerritoryLoadChart';
import { TerritoryStatusTable } from '@/components/territory-optimization/TerritoryStatusTable';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'default',
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'success' | 'warning' | 'destructive';
}) {
  const toneCls =
    tone === 'success'
      ? 'text-success'
      : tone === 'warning'
        ? 'text-warning'
        : tone === 'destructive'
          ? 'text-destructive'
          : 'text-primary';
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </span>
          <Icon className={`h-4 w-4 ${toneCls}`} />
        </div>
        <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export default function TerritoryOptimization() {
  const { data, isLoading, isFetching, refetch } = useTerritoryOptimization();
  const qc = useQueryClient();

  const handleRefresh = async () => {
    await qc.invalidateQueries({ queryKey: ['territory-optimization'] });
    await refetch();
    toast.success('Análise atualizada');
  };

  return (
    <>
      <Helmet>
        <title>Otimização de Territórios | SINGU</title>
        <meta
          name="description"
          content="Análise inteligente de cobertura, balanceamento e recomendações para sua malha de territórios comerciais."
        />
      </Helmet>

      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* ─── Breadcrumb + Header ─── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <nav className="text-xs text-muted-foreground mb-1.5" aria-label="breadcrumb">
              Operacional / Territórios /{' '}
              <span className="text-foreground font-medium">Otimização AI</span>
            </nav>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <MapPinned className="h-6 w-6 text-primary" />
              Otimização de Territórios AI
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Análise de cobertura, balanceamento e recomendações inteligentes.
            </p>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
            Atualizar análise
          </Button>
        </div>

        {/* ─── Loading ─── */}
        {isLoading || !data ? (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
            <Skeleton className="h-72 w-full" />
          </div>
        ) : (
          <>
            <TerritoryHealthBanner
              healthScore={data.healthScore}
              totalTerritories={data.totalTerritories}
              underservedCount={data.underservedCount}
              analyzedAt={data.analyzedAt}
            />

            {/* ─── KPIs ─── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiCard
                icon={Target}
                label="Cobertura"
                value={`${Math.round(data.coverage * 100)}%`}
                hint={`${data.assignedCount}/${data.totalTerritories} atribuídos`}
                tone={data.coverage >= 0.8 ? 'success' : data.coverage >= 0.5 ? 'warning' : 'destructive'}
              />
              <KpiCard
                icon={Users}
                label="Balanceamento"
                value={(1 - data.giniIndex).toFixed(2)}
                hint={`Gini: ${data.giniIndex.toFixed(2)}`}
                tone={data.giniIndex <= 0.3 ? 'success' : data.giniIndex <= 0.5 ? 'warning' : 'destructive'}
              />
              <KpiCard
                icon={AlertTriangle}
                label="Sub-atendidos"
                value={String(data.underservedCount)}
                hint="Empresas/rep acima da média"
                tone={data.underservedCount === 0 ? 'success' : 'warning'}
              />
              <KpiCard
                icon={Sparkles}
                label="Recomendações IA"
                value={String(data.recommendations.length)}
                hint="Ações sugeridas"
              />
            </div>

            {/* ─── Recommendations ─── */}
            <section>
              <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Recomendações Inteligentes
              </h2>
              {data.recommendations.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-sm text-muted-foreground">
                    Nenhuma recomendação ativa. Sua malha parece estar em bom estado ou ainda não
                    há dados suficientes para análise.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.recommendations.map((rec, i) => (
                    <TerritoryRecommendationCard
                      key={`${rec.territory_id ?? rec.territory_name}-${i}`}
                      rec={rec}
                      index={i}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* ─── Chart + Table ─── */}
            <TerritoryLoadChart data={data.chartData} />
            <TerritoryStatusTable rows={data.tableData} />
          </>
        )}
      </div>
    </>
  );
}
