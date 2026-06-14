import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useCohortAnalysis } from '@/hooks/useReportsAnalytics';
import { AlertTriangle, Users, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

function retentionColor(rate: number): string {
  if (rate >= 80) return 'bg-emerald-500/80 text-primary-foreground';
  if (rate >= 60) return 'bg-emerald-500/50 text-foreground';
  if (rate >= 40) return 'bg-warning/50 text-foreground';
  if (rate >= 20) return 'bg-warning/30 text-foreground';
  return 'bg-destructive/30 text-foreground';
}

export const CohortAnalysisAdvanced = React.memo(function CohortAnalysisAdvanced() {
  const { data: cohorts, isLoading, error } = useCohortAnalysis(12);

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-warning" />
          <p className="text-sm">Dados de coorte indisponíveis.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) return <Skeleton className="h-96 rounded-lg" />;

  if (!cohorts?.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Sem dados de coorte suficientes.</p>
          <p className="text-xs mt-1 text-muted-foreground">São necessárias interações em pelo menos 2 meses.</p>
        </CardContent>
      </Card>
    );
  }

  const maxMonths = Math.max(...cohorts.map(c => c.months?.length || 0));

  // Calculate averages per month
  const monthAvgs = Array.from({ length: maxMonths }).map((_, i) => {
    const rates = cohorts.map(c => c.months?.[i]?.retention_rate).filter(Boolean) as number[];
    return rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
  });

  // Overall churn rate (inverse of last month avg retention)
  const lastMonthAvg = monthAvgs[monthAvgs.length - 1] || 0;
  const churnRate = 100 - lastMonthAvg;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Análise de Coorte de Clientes
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Retenção por mês de aquisição — {cohorts.length} coortes
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs gap-1">
              {churnRate > 50 ? <TrendingDown className="h-3 w-3 text-destructive" /> : <TrendingUp className="h-3 w-3 text-emerald-500" />}
              Churn: {churnRate.toFixed(0)}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left p-2 text-muted-foreground font-medium sticky left-0 bg-card z-10">Coorte</th>
                  <th className="text-center p-2 text-muted-foreground font-medium">Tamanho</th>
                  {Array.from({ length: maxMonths }).map((_, i) => (
                    <th key={i} className="text-center p-2 text-muted-foreground font-medium">M{i}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohorts.map((cohort) => (
                  <tr key={cohort.cohort_month} className="border-b border-border/20 hover:bg-muted/30 transition-colors">
                    <td className="p-2 font-medium whitespace-nowrap sticky left-0 bg-card z-10">{cohort.cohort_month}</td>
                    <td className="p-2 text-center text-muted-foreground">
                      {cohort.months?.[0]?.retention_rate ? '—' : '—'}
                    </td>
                    {Array.from({ length: maxMonths }).map((_, i) => {
                      const m = cohort.months?.[i];
                      if (!m) return <td key={i} className="p-1" />;
                      return (
                        <td key={i} className="p-1 text-center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className={cn('rounded px-2 py-1 text-xs font-medium cursor-default transition-all hover:scale-105', retentionColor(m.retention_rate))}>
                                {m.retention_rate.toFixed(0)}%
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-medium">Mês {m.month_number}</p>
                              <p className="text-xs">Retenção: {m.retention_rate.toFixed(1)}%</p>
                              {m.revenue > 0 && <p className="text-xs">Receita: R$ {m.revenue.toLocaleString('pt-BR')}</p>}
                            </TooltipContent>
                          </Tooltip>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {/* Average row */}
                <tr className="border-t-2 border-border bg-muted/30 font-semibold">
                  <td className="p-2 sticky left-0 bg-muted/30 z-10">Média</td>
                  <td className="p-2 text-center">—</td>
                  {monthAvgs.map((avg, i) => (
                    <td key={i} className="p-1 text-center">
                      <div className={cn('rounded px-2 py-1 text-xs font-bold', retentionColor(avg))}>
                        {avg.toFixed(0)}%
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </TooltipProvider>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-500/80" /> ≥80%</span>
          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-500/50" /> ≥60%</span>
          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-warning/50" /> ≥40%</span>
          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-warning/30" /> ≥20%</span>
          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-destructive/30" /> &lt;20%</span>
        </div>
      </CardContent>
    </Card>
  );
});

export default CohortAnalysisAdvanced;
