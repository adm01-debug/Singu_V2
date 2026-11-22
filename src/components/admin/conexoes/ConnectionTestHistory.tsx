import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useConnectionTestLogs } from '@/hooks/useConnections';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  connectionId: string;
}

export function ConnectionTestHistory({ connectionId }: Props) {
  const { data: logs, isLoading } = useConnectionTestLogs(connectionId);

  if (isLoading) {
    return <div className="space-y-1">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}</div>;
  }

  const rows = logs ?? [];
  if (rows.length === 0) {
    return <p className="text-xs text-muted-foreground">Nenhum teste registrado ainda.</p>;
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">Últimos testes</p>
      <ul className="space-y-1">
        {rows.map(l => (
          <li key={l.id} className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant={l.status === 'success' ? 'default' : 'destructive'} className="text-[10px] px-1.5 py-0">
              {l.status === 'success' ? 'ok' : 'falha'}
            </Badge>
            <span className="truncate">{l.message ?? l.status}</span>
            {l.latency_ms != null && <span className="shrink-0">· {l.latency_ms}ms</span>}
            <span className="shrink-0 ml-auto">{formatDistanceToNow(new Date(l.created_at), { locale: ptBR, addSuffix: true })}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
