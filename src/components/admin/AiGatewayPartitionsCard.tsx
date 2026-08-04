import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, AlertTriangle } from 'lucide-react';
import { useAiGatewayPartitionStats, type AiGatewayPartitionStat } from '@/hooks/useAiGatewayPartitionStats';

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function partitionBadge(p: AiGatewayPartitionStat) {
  if (p.is_expiring) return { variant: 'destructive' as const, label: 'Expira' };
  if (p.is_current) return { variant: 'default' as const, label: 'Atual' };
  if (p.is_future) return { variant: 'secondary' as const, label: 'Futura' };
  return { variant: 'outline' as const, label: 'Ativa' };
}

export function AiGatewayPartitionsCard() {
  const { data, isLoading, error } = useAiGatewayPartitionStats();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="w-4 h-4" />
          Partições de métricas — AI Gateway
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}
          </div>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Falha ao carregar estatísticas de partição: {String((error as Error).message)}
            </AlertDescription>
          </Alert>
        )}
        {!isLoading && !error && data && data.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma partição encontrada.</p>
        )}
        {!isLoading && !error && data && data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b">
                  <th className="py-2 pr-3">Partição</th>
                  <th className="py-2 pr-3">Faixa</th>
                  <th className="py-2 pr-3 text-right">Linhas</th>
                  <th className="py-2 pr-3 text-right">Tamanho</th>
                  <th className="py-2 pr-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((p) => {
                  const badge = partitionBadge(p);
                  const start = new Date(p.range_start).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
                  return (
                    <tr key={p.partition_name} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-mono text-xs">{p.partition_name}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{start}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {p.estimated_rows.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">{formatBytes(p.total_bytes)}</td>
                      <td className="py-2 pr-3">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-xs text-muted-foreground mt-3">
              Partições &gt;90 dias são removidas automaticamente aos domingos 04:00 UTC. Nova partição
              do mês seguinte é criada diariamente às 03:15 UTC.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}