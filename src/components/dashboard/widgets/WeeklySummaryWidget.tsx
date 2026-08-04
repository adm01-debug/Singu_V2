import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useWeeklySummary } from '@/hooks/useWeeklySummary';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

export const WeeklySummaryWidget = React.memo(function WeeklySummaryWidget() {
  const { data: summary, isLoading, error } = useWeeklySummary();

  if (error) return null;
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Resumo Semanal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-5 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) return null;

  const metrics = [
    { label: 'Interações', value: summary.total_interactions },
    { label: 'Deals Criados', value: summary.deals_created },
    { label: 'Deals Ganhos', value: summary.deals_won },
    { label: 'Deals Perdidos', value: summary.deals_lost },
    { label: 'Receita', value: formatCurrency(summary.revenue || 0) },
  ];

  const rate = summary.conversion_rate ?? 0;
  const TrendIcon = rate > 50 ? TrendingUp : rate > 20 ? Minus : TrendingDown;
  const trendColor = rate > 50 ? 'text-success' : rate > 20 ? 'text-warning' : 'text-destructive';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          Resumo Semanal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Taxa de Conversão</span>
          <div className="flex items-center gap-1">
            <TrendIcon className={`h-4 w-4 ${trendColor}`} />
            <span className={`font-bold ${trendColor}`}>{rate.toFixed(0)}%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {metrics.map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between rounded-md bg-muted/30 px-2.5 py-1.5">
              <span className="text-[11px] text-muted-foreground">{label}</span>
              <span className="text-sm font-semibold">{value}</span>
            </div>
          ))}
        </div>

        {summary.highlights && summary.highlights.length > 0 && (
          <div className="space-y-1 pt-1 border-t">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Destaques</span>
            {summary.highlights.slice(0, 3).map((h, i) => (
              <p key={i} className="text-xs text-foreground/80">• {h}</p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
