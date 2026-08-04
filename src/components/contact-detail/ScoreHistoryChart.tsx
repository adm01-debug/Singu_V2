import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useScoreHistory } from '@/hooks/useScoreHistory';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  contactId: string;
}

interface ChartPoint {
  date: string;
  label: string;
  score: number;
  scoreType: string;
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'bg-emerald-500';
  if (score >= 40) return 'bg-warning';
  return 'bg-destructive';
}

function getScoreTextColor(score: number): string {
  if (score >= 70) return 'text-emerald-500';
  if (score >= 40) return 'text-warning';
  return 'text-destructive';
}

export function ScoreHistoryChart({ contactId }: Props) {
  const { history, loading } = useScoreHistory(contactId);

  const chartData = useMemo<ChartPoint[]>(() => {
    if (!Array.isArray(history) || history.length === 0) return [];

    // Group by date, take last entry per day
    const byDate = new Map<string, ChartPoint>();

    const sorted = [...history].sort(
      (a, b) => new Date(a.calculated_at).getTime() - new Date(b.calculated_at).getTime()
    );

    for (const entry of sorted) {
      const dateKey = format(new Date(entry.calculated_at), 'yyyy-MM-dd');
      byDate.set(dateKey, {
        date: dateKey,
        label: format(new Date(entry.calculated_at), "dd/MM", { locale: ptBR }),
        score: entry.score_value ?? 0,
        scoreType: entry.score_type ?? 'lead_score',
      });
    }

    return Array.from(byDate.values()).slice(-20);
  }, [history]);

  const trend = useMemo(() => {
    if (chartData.length < 2) return 'stable' as const;
    const recent = chartData.slice(-3);
    const older = chartData.slice(-6, -3);
    if (older.length === 0) return 'stable' as const;
    const recentAvg = recent.reduce((s, p) => s + p.score, 0) / recent.length;
    const olderAvg = older.reduce((s, p) => s + p.score, 0) / older.length;
    if (recentAvg > olderAvg + 5) return 'up' as const;
    if (recentAvg < olderAvg - 5) return 'down' as const;
    return 'stable' as const;
  }, [chartData]);

  if (loading) return <Skeleton className="h-48 rounded-lg" />;

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4 text-primary" />
            Evolução do Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Sem histórico de scores registrado ainda.
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxScore = Math.max(...chartData.map(p => p.score), 100);
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendLabel = trend === 'up' ? 'Subindo' : trend === 'down' ? 'Caindo' : 'Estável';
  const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground';
  const lastScore = chartData[chartData.length - 1]?.score ?? 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <BarChart3 className="h-4 w-4 text-primary" />
          Evolução do Score
          <Badge variant="outline" className={cn('ml-auto text-[10px]', trendColor)}>
            <TrendIcon className="h-3 w-3 mr-1" />
            {trendLabel}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Current score */}
        <div className="flex items-baseline gap-2">
          <span className={cn('text-2xl font-bold', getScoreTextColor(lastScore))}>
            {lastScore}
          </span>
          <span className="text-xs text-muted-foreground">pts atual</span>
        </div>

        {/* Bar chart */}
        <TooltipProvider delayDuration={100}>
          <div className="flex items-end gap-0.5 h-24">
            {chartData.map((point) => {
              const height = Math.max(4, (point.score / maxScore) * 100);
              return (
                <Tooltip key={point.date}>
                  <TooltipTrigger asChild>
                    <div
                      className="flex-1 min-w-0 cursor-default rounded-t transition-all hover:opacity-80"
                      style={{ height: `${height}%` }}
                    >
                      <div
                        className={cn('w-full h-full rounded-t', getScoreColor(point.score))}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <p className="font-medium">{point.label}</p>
                    <p>Score: {point.score} pts</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>

        {/* Date labels */}
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{chartData[0]?.label}</span>
          <span>{chartData[chartData.length - 1]?.label}</span>
        </div>
      </CardContent>
    </Card>
  );
}
