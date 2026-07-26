import { useMemo } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useRpcPlanChurnTimeline } from '@/hooks/useRpcPlanChurnTimeline';

interface RpcPlanChurnTimelineChartProps {
  /** null = todas as RPCs monitoradas */
  rpcName: string | null;
  hours?: number;
}

/**
 * Rodada 68/10 — timeline horária: barras = trocas de plano, linha = p95 (ms).
 * Permite ver visualmente se a degradação de latência acompanha a troca de plano.
 */
export function RpcPlanChurnTimelineChart({ rpcName, hours = 24 }: RpcPlanChurnTimelineChartProps) {
  const { data, isLoading, error } = useRpcPlanChurnTimeline(rpcName, hours);

  const points = useMemo(
    () =>
      (Array.isArray(data) ? data : []).map((p) => ({
        ...p,
        label: new Date(p.bucket).toLocaleTimeString('pt-BR', { hour: '2-digit' }) + 'h',
      })),
    [data],
  );

  const hasSignal = points.some((p) => p.plan_changes > 0 || p.samples > 0);

  if (isLoading) return <Skeleton className="h-48" />;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="w-4 h-4" />
        <AlertTitle>Falha ao carregar a timeline</AlertTitle>
        <AlertDescription>Tente novamente em alguns instantes.</AlertDescription>
      </Alert>
    );
  }

  if (!hasSignal) {
    return (
      <p className="text-sm text-muted-foreground">
        Sem trocas de plano nem amostras de latência nas últimas {hours} horas.
      </p>
    );
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11 }}
            stroke="hsl(var(--muted-foreground))"
          />
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 6,
              fontSize: 12,
              color: 'hsl(var(--popover-foreground))',
            }}
            formatter={(value: number, name: string) =>
              name === 'p95_ms' ? [`${value} ms`, 'p95'] : [value, 'trocas de plano']
            }
          />
          <Bar
            yAxisId="left"
            dataKey="plan_changes"
            fill="hsl(var(--destructive))"
            radius={[2, 2, 0, 0]}
            maxBarSize={18}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="p95_ms"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
