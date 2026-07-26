import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, GitCompare } from 'lucide-react';
import { useRpcPlanSnapshots, type RpcPlanSnapshotRow } from '@/hooks/useRpcPlanSnapshots';

function SnapshotRow({ row }: { row: RpcPlanSnapshotRow }) {
  const changed = row.plan_changed === true;
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{row.rpc_name}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(row.captured_at).toLocaleString('pt-BR')} • motivo: {row.reason} • hash{' '}
          <code>{row.plan_hash.slice(0, 8)}</code>
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {row.total_cost !== null && (
          <span className="text-xs text-muted-foreground">
            custo <strong className="text-foreground">{Math.round(row.total_cost)}</strong>
          </span>
        )}
        <Badge variant={changed ? 'destructive' : 'outline'}>
          {changed ? 'plano alterado' : 'estável'}
          {row.execution_ms !== null ? ` · ${Math.round(row.execution_ms)}ms` : ''}
        </Badge>
      </div>
    </div>
  );
}

/**
 * Rodada 63/10 — snapshots de plano capturados quando uma RPC degrada,
 * permitindo identificar regressão de plano (index scan -> seq scan, etc.).
 */
export function RpcPlanSnapshotsCard() {
  const { data, isLoading, error } = useRpcPlanSnapshots(undefined, 10);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GitCompare className="w-4 h-4" /> Snapshots de plano de execução
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Falha ao carregar snapshots de plano</AlertTitle>
        <AlertDescription>{String((error as Error).message)}</AlertDescription>
      </Alert>
    );
  }

  const rows = data ?? [];
  const anyChanged = rows.some((r) => r.plan_changed === true);

  return (
    <Card variant={anyChanged ? 'warning' : undefined}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <GitCompare className="w-4 h-4" /> Snapshots de plano de execução
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum snapshot capturado. Planos são registrados automaticamente quando uma RPC entra
            em degradação (p95 1h ≥ 1,5× baseline 24h).
          </p>
        ) : (
          <div className="divide-y">
            {rows.map((r) => <SnapshotRow key={r.id} row={r} />)}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-3">
          Retenção de 30 dias. Hash estrutural ignora tempos/linhas, então mudança de hash indica
          regressão real de plano.
        </p>
      </CardContent>
    </Card>
  );
}
