import { useMemo } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
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

/** Limite de latência aceitável (ms) — alinhado ao alerta RpcPerfDegradation. */
const P95_THRESHOLD_MS = 800;

/**
 * Rodada 68-69/10 — timeline horária: barras = trocas de plano, linha = p95 (ms),
 * com anotação visual do threshold de 800ms e legenda.
 * Permite ver visualmente se a degradação de latência acompanha a troca de plano.
 */
export function RpcPlanChurnTimelineChart({ rpcName, hours = 24 }: RpcPlanChurnTimelineChartProps) {
  const { data, isLoading, error } = useRpcPlanChurnTimeline(rpcName, hours);

  const points = useMemo(() => {
    const rows = Array.isArray(data) ? data : [];
    // Janelas longas (>48h) precisam de dia no rótulo para não repetir a mesma hora.
    const longWindow = hours > 48;
    return rows.map((p) => {
      const d = new Date(p.bucket);
      return {
        ...p,
        label: longWindow
          ? d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
          : `${d.toLocaleTimeString('pt-BR', { hour: '2-digit' })}h`,
      };
    });
  }, [data, hours]);

  const hasSignal = points.some((p) => p.plan_changes > 0 || p.samples > 0);
  const maxP95 = points.reduce((acc, p) => Math.max(acc, p.p95_ms), 0);
  const rightDomainMax = Math.max(maxP95 * 1.15, P95_THRESHOLD_MS * 1.2);

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
            domain={[0, Math.ceil(rightDomainMax)]}
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
          <Legend
            wrapperStyle={{ fontSize: 11 }}
            formatter={(value: string) => (value === 'p95_ms' ? 'p95 (ms)' : 'trocas de plano')}
          />
          <ReferenceLine
            yAxisId="right"
            y={P95_THRESHOLD_MS}
            stroke="hsl(var(--destructive))"
            strokeDasharray="4 4"
            label={{
              value: `limite ${P95_THRESHOLD_MS}ms`,
              position: 'insideTopRight',
              fill: 'hsl(var(--destructive))',
              fontSize: 10,
            }}
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
