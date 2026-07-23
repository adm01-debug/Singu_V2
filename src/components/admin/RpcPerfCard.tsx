import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Gauge, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useRpcPerfStats, type RpcPerfStat } from '@/hooks/useRpcPerfStats';
import { useSlowRpcTrend, type SlowRpcTrendRow } from '@/hooks/useSlowRpcTrend';

const SLOW_P95_MS = 800;

function toneForP95(p95: number): 'success' | 'warning' | 'destructive' {
  if (p95 >= SLOW_P95_MS) return 'destructive';
  if (p95 >= SLOW_P95_MS * 0.6) return 'warning';
  return 'success';
}

function StatRow({ stat }: { stat: RpcPerfStat }) {
  const tone = toneForP95(stat.p95_ms);
  const variant =
    tone === 'destructive' ? 'destructive' : tone === 'warning' ? 'secondary' : 'outline';
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{stat.rpc_name}</p>
        <p className="text-xs text-muted-foreground">
          {stat.samples} amostras • última {new Date(stat.last_seen).toLocaleTimeString('pt-BR')}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-muted-foreground">
          p50 <strong className="text-foreground">{stat.p50_ms}</strong>ms
        </span>
        <Badge variant={variant}>
          p95 {stat.p95_ms}ms
        </Badge>
        <span className="text-xs text-muted-foreground">
          max <strong className="text-foreground">{stat.max_ms}</strong>ms
        </span>
      </div>
    </div>
  );
}

function TrendIcon({ ratio }: { ratio: number | null }) {
  if (ratio === null) return <Minus className="w-3 h-3 text-muted-foreground" />;
  if (ratio >= 1.5) return <TrendingUp className="w-3 h-3 text-destructive" />;
  if (ratio <= 0.75) return <TrendingDown className="w-3 h-3 text-success" />;
  return <Minus className="w-3 h-3 text-muted-foreground" />;
}

function TrendRow({ row }: { row: SlowRpcTrendRow }) {
  const variant = row.is_degraded ? 'destructive' : row.ratio && row.ratio >= 1.2 ? 'secondary' : 'outline';
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{row.rpc_name}</p>
        <p className="text-xs text-muted-foreground">
          {row.samples_recent} amostras (1h) • baseline {row.samples_baseline} amostras (24h)
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-muted-foreground">
          24h <strong className="text-foreground">{row.p95_baseline_ms}</strong>ms
        </span>
        <Badge variant={variant} className="gap-1">
          <TrendIcon ratio={row.ratio} />
          1h {row.p95_recent_ms}ms{row.ratio ? ` · ${row.ratio}×` : ''}
        </Badge>
      </div>
    </div>
  );
}

export function RpcPerfCard() {
  const { data, isLoading, error } = useRpcPerfStats(24);
  const trend = useSlowRpcTrend(5);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Gauge className="w-4 h-4" /> Performance de RPCs (24h)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Falha ao carregar performance de RPCs</AlertTitle>
        <AlertDescription>{String((error as Error).message)}</AlertDescription>
      </Alert>
    );
  }

  const stats = data?.stats ?? [];
  const anySlow = stats.some((s) => s.p95_ms >= SLOW_P95_MS);
  const trendRows = trend.data ?? [];
  const anyDegraded = trendRows.some((r) => r.is_degraded);

  return (
    <Card variant={anyDegraded ? 'warning' : anySlow ? 'warning' : undefined}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gauge className="w-4 h-4" /> Performance de RPCs (últimas {data?.window_hours ?? 24}h)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {stats.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma amostra registrada ainda. Assim que RPCs instrumentadas forem chamadas, os
            percentis aparecem aqui automaticamente.
          </p>
        ) : (
          <div className="divide-y">
            {stats.map((s) => <StatRow key={s.rpc_name} stat={s} />)}
          </div>
        )}
        <div className="mt-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Top 5 RPCs mais lentas — tendência 1h vs 24h
          </p>
          {trend.isLoading ? (
            <Skeleton className="h-16" />
          ) : trendRows.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sem amostras recentes para comparar.</p>
          ) : (
            <div className="divide-y">
              {trendRows.map((r) => <TrendRow key={r.rpc_name} row={r} />)}
            </div>
          )}
          {anyDegraded && (
            <p className="text-xs text-destructive mt-2">
              ⚠ Degradação detectada: p95 recente ≥ 1,5× baseline (regra Prometheus
              <code className="mx-1">RpcPerfDegradation</code>).
            </p>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Threshold de alerta: p95 ≥ {SLOW_P95_MS}ms sustentado por 10 minutos (regra
          <code className="mx-1">AiGatewayHealthRpcSlow</code> no Prometheus).
        </p>
      </CardContent>
    </Card>
  );
}