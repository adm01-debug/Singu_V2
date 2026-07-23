import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Gauge, AlertTriangle } from 'lucide-react';
import { useRpcPerfStats, type RpcPerfStat } from '@/hooks/useRpcPerfStats';

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

export function RpcPerfCard() {
  const { data, isLoading, error } = useRpcPerfStats(24);

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

  return (
    <Card variant={anySlow ? 'warning' : undefined}>
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
        <p className="text-xs text-muted-foreground mt-3">
          Threshold de alerta: p95 ≥ {SLOW_P95_MS}ms sustentado por 10 minutos (regra
          <code className="mx-1">AiGatewayHealthRpcSlow</code> no Prometheus).
        </p>
      </CardContent>
    </Card>
  );
}