import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity } from 'lucide-react';
import type { TelemetryRow } from '@/hooks/useTelemetryExport';

function formatDuration(ms: number) {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    day: '2-digit', month: '2-digit',
  });
}

function getSeverityBadge(severity: string) {
  switch (severity) {
    case 'very_slow': return <Badge variant="destructive">🔴 Muito Lenta</Badge>;
    case 'slow': return <Badge className="bg-warning/20 text-warning border-warning/30 text-[10px]">🟡 Lenta</Badge>;
    case 'error': return <Badge variant="destructive">❌ Erro</Badge>;
    default: return <Badge variant="secondary" className="text-[10px]">{severity}</Badge>;
  }
}

interface TelemetryTableProps {
  rows: TelemetryRow[];
  isLoading: boolean;
}

export function TelemetryTable({ rows, isLoading }: TelemetryTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-16 text-muted-foreground">
          <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhuma query lenta registrada</p>
          <p className="text-sm mt-1">Isso é bom! O sistema está performando bem.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-3 font-medium text-muted-foreground">Quando</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Operação</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Tabela/RPC</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Duração</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Records</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Limit</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Offset</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Count</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Severidade</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Erro</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                  <td className="p-3 text-xs text-muted-foreground whitespace-nowrap font-mono">{formatTime(row.created_at)}</td>
                  <td className="p-3"><Badge variant="outline" className="text-[10px] font-mono">{row.operation}</Badge></td>
                  <td className="p-3 font-mono text-xs font-medium">{row.rpc_name || row.table_name || '-'}</td>
                  <td className="p-3 text-right font-mono font-bold tabular-nums">
                    <span className={row.duration_ms >= 8000 ? 'text-destructive' : row.duration_ms >= 3000 ? 'text-warning' : ''}>
                      {formatDuration(row.duration_ms)}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono text-xs tabular-nums">{row.record_count ?? '-'}</td>
                  <td className="p-3 text-right font-mono text-xs tabular-nums text-muted-foreground">{row.query_limit ?? '-'}</td>
                  <td className="p-3 text-right font-mono text-xs tabular-nums text-muted-foreground">{row.query_offset ?? '-'}</td>
                  <td className="p-3 text-xs text-muted-foreground">{row.count_mode || '-'}</td>
                  <td className="p-3">{getSeverityBadge(row.severity)}</td>
                  <td className="p-3 text-xs text-destructive max-w-[200px] truncate" title={row.error_message || ''}>{row.error_message || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
