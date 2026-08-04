import { useConnectionMetrics } from '@/hooks/useConnectionMetrics';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Line, LineChart, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';

interface Props {
  connectionId: string;
}

function healthTone(rate: number) {
  if (rate >= 95) return { label: 'Saudável', cls: 'bg-success/15 text-success border-success/30' };
  if (rate >= 80) return { label: 'Atenção', cls: 'bg-warning/15 text-warning border-warning/30' };
  return { label: 'Crítico', cls: 'bg-destructive/15 text-destructive border-destructive/30' };
}

export function ConnectionMetricsSparkline({ connectionId }: Props) {
  const { data, isLoading } = useConnectionMetrics(connectionId);

  if (isLoading) return <Skeleton className="h-12 w-full" />;
  if (!data || data.metrics.total_calls === 0) {
    return <p className="text-xs text-muted-foreground">Sem dados de teste nos últimos 7 dias.</p>;
  }

  const { metrics, sparkline } = data;
  const tone = healthTone(metrics.success_rate);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-xs">
          <Badge variant="outline" className={cn('font-medium', tone.cls)}>
            {tone.label} · {metrics.success_rate}%
          </Badge>
          <span className="text-muted-foreground font-mono">
            p50 {Math.round(metrics.p50)}ms · p95 {Math.round(metrics.p95)}ms · p99 {Math.round(metrics.p99)}ms
          </span>
        </div>
        <span className="text-xs text-muted-foreground">{metrics.total_calls} testes</span>
      </div>
      {sparkline.length > 1 && (
        <div className="h-10 w-full">
          <ResponsiveContainer>
            <LineChart data={sparkline} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 6, fontSize: 11,
                }}
                labelFormatter={() => ''}
                formatter={(v: number) => [`${v}ms`, 'latência']}
              />
              <Line
                type="monotone" dataKey="latency"
                stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
