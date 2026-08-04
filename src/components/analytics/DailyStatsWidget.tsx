import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDailyStats } from '@/hooks/useDailyKpis';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const DailyStatsWidget = React.memo(function DailyStatsWidget() {
  const { data: stats, isLoading } = useDailyStats();

  if (isLoading) return <Skeleton className="h-32 rounded-lg" />;
  if (!stats || stats.length === 0) return null;

  const today = stats[0];
  const yesterday = stats.length > 1 ? stats[1] : null;

  const metrics = [
    { label: 'Pipeline', value: today.pipeline_value, prev: yesterday?.pipeline_value, fmt: (v: number) => `R$ ${(v / 1000).toFixed(0)}k` },
    { label: 'Deals Abertos', value: today.open_deals, prev: yesterday?.open_deals },
    { label: 'Receita Mensal', value: today.monthly_revenue, prev: yesterday?.monthly_revenue, fmt: (v: number) => `R$ ${(v / 1000).toFixed(0)}k` },
    { label: 'Interações/Mês', value: today.monthly_interactions, prev: yesterday?.monthly_interactions },
    { label: 'Tasks Atrasadas', value: today.overdue_tasks, prev: yesterday?.overdue_tasks, invert: true },
    { label: 'Follow-ups Atrasados', value: today.overdue_followups, prev: yesterday?.overdue_followups, invert: true },
  ].filter(m => m.value != null);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />Métricas Diárias
          {today.stats_date && <Badge variant="outline" className="text-[10px] ml-auto">{new Date(today.stats_date).toLocaleDateString('pt-BR')}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {metrics.map(m => {
            const delta = m.prev != null && m.value != null ? m.value - m.prev : null;
            const positive = m.invert ? (delta != null && delta < 0) : (delta != null && delta > 0);
            const DeltaIcon = positive ? TrendingUp : TrendingDown;
            return (
              <div key={m.label} className="rounded-lg bg-muted/30 p-2">
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
                <p className="text-base font-bold">{m.fmt ? m.fmt(m.value!) : m.value}</p>
                {delta != null && delta !== 0 && (
                  <span className={cn("text-[9px] flex items-center gap-0.5", positive ? "text-success" : "text-destructive")}>
                    <DeltaIcon className="h-2.5 w-2.5" />{Math.abs(delta)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});

export default DailyStatsWidget;
