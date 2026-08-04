import { useMemo } from 'react';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useContactSentimentTrend, type TrendDirection } from '@/hooks/useContactSentimentTrend';
import { cn } from '@/lib/utils';

interface Props {
  contactId: string;
}

const TREND_LABEL: Record<TrendDirection, string> = {
  up: 'Melhorando',
  stable: 'Estável',
  down: 'Piorando',
};

const TREND_COLOR: Record<TrendDirection, string> = {
  up: 'text-success bg-success/10 border-success/30',
  stable: 'text-muted-foreground bg-muted border-border',
  down: 'text-destructive bg-destructive/10 border-destructive/30',
};

const TREND_ICON: Record<TrendDirection, typeof TrendingUp> = {
  up: TrendingUp,
  stable: Minus,
  down: TrendingDown,
};

const sentimentLabel = (v: number): string => {
  if (v >= 0.5) return 'Muito positivo';
  if (v >= 0.15) return 'Positivo';
  if (v > -0.15) return 'Neutro';
  if (v > -0.5) return 'Negativo';
  return 'Muito negativo';
};

export function SentimentTrendChart({ contactId }: Props) {
  const { data, isLoading, error } = useContactSentimentTrend(contactId);

  const tooltipFormatter = useMemo(
    () => (value: number, _name: string, payload: { payload?: { count?: number; avg?: number } }) => {
      const count = payload?.payload?.count ?? 0;
      return [`${sentimentLabel(value)} (${value.toFixed(2)})`, `${count} interaç${count === 1 ? 'ão' : 'ões'}`];
    },
    [],
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4 text-primary" /> Tendência de Sentimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data || data.points.length < 3) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4 text-muted-foreground" /> Tendência de Sentimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground py-6 text-center">
            Sem dados de sentimento suficientes (mín. 3 interações nos últimos 90 dias).
          </p>
        </CardContent>
      </Card>
    );
  }

  const TrendIcon = TREND_ICON[data.trend.direction];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4 text-primary" /> Tendência de Sentimento
            <span className="text-xs font-normal text-muted-foreground">(últimos 90 dias)</span>
          </CardTitle>
          <Badge variant="outline" className={cn('gap-1 text-[10px]', TREND_COLOR[data.trend.direction])}>
            <TrendIcon className="h-3 w-3" />
            {TREND_LABEL[data.trend.direction]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="rounded border p-1.5">
            <p className="font-semibold text-foreground">{data.stats.total}</p>
            <p className="text-muted-foreground">Interações</p>
          </div>
          <div className="rounded border p-1.5">
            <p className="font-semibold text-foreground">{data.stats.avg.toFixed(2)}</p>
            <p className="text-muted-foreground">Média</p>
          </div>
          <div className="rounded border p-1.5">
            <p className="font-semibold text-success">{data.stats.positivePct}%</p>
            <p className="text-muted-foreground">Positivas</p>
          </div>
          <div className="rounded border p-1.5">
            <p className="font-semibold text-destructive">{data.stats.negativePct}%</p>
            <p className="text-muted-foreground">Negativas</p>
          </div>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.points} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="sentTrendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.5} />
                  <stop offset="50%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis
                domain={[-1, 1]}
                ticks={[-1, 0, 1]}
                tick={{ fontSize: 10 }}
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(v) => (v === 1 ? '+' : v === -1 ? '−' : '·')}
              />
              <ReferenceLine y={0} stroke="hsl(var(--border))" />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 6,
                  fontSize: 11,
                }}
                formatter={tooltipFormatter}
                labelFormatter={(l: string) => `Semana de ${l}`}
              />
              <Area
                type="monotone"
                dataKey="smoothed"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#sentTrendGrad)"
                name="Sentimento"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
