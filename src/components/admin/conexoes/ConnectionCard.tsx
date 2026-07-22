import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Edit, Trash2, TestTube2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useConnections, type ConnectionConfig } from '@/hooks/useConnections';
import { ConnectionMetricsSparkline } from './ConnectionMetricsSparkline';
import { SchemaDiscoveryCard } from './SchemaDiscoveryCard';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  connection: ConnectionConfig;
  onEdit: () => void;
}

export function ConnectionCard({ connection, onEdit }: Props) {
  const { remove, toggleActive, test } = useConnections();

  const status = connection.last_test_status;
  const StatusIcon = status === 'success' ? CheckCircle2 : status === 'error' ? XCircle : Clock;
  const statusColor = status === 'success' ? 'text-green-500' : status === 'error' ? 'text-destructive' : 'text-muted-foreground';

  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium truncate">{connection.name}</h4>
              <Badge variant={connection.is_active ? 'default' : 'secondary'} className="text-xs">
                {connection.is_active ? 'Ativa' : 'Inativa'}
              </Badge>
            </div>
            {connection.description && (
              <p className="text-sm text-muted-foreground mb-2">{connection.description}</p>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <StatusIcon className={`w-3.5 h-3.5 ${statusColor}`} />
              {connection.last_tested_at ? (
                <>
                  <span>{connection.last_test_message ?? status}</span>
                  {connection.last_test_latency_ms != null && <span>· {connection.last_test_latency_ms}ms</span>}
                  <span>· {formatDistanceToNow(new Date(connection.last_tested_at), { locale: ptBR, addSuffix: true })}</span>
                </>
              ) : (
                <span>Nunca testada</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Switch
              checked={connection.is_active}
              onCheckedChange={(v) => toggleActive.mutate({ id: connection.id, is_active: v })}
            />
            <Button
              size="sm" variant="ghost"
              onClick={() => test.mutate({
                connection_id: connection.id,
                connection_type: connection.connection_type,
                config: connection.config,
              })}
              disabled={test.isPending}
              title="Testar"
            ><TestTube2 className="w-4 h-4" /></Button>
            <Button size="sm" variant="ghost" onClick={onEdit} title="Editar">
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="sm" variant="ghost"
              onClick={() => { if (confirm(`Remover "${connection.name}"?`)) remove.mutate(connection.id); }}
              title="Remover"
              className="text-destructive hover:text-destructive"
            ><Trash2 className="w-4 h-4" /></Button>
          </div>
        </div>
        <Separator className="my-3" />
        <ConnectionMetricsSparkline connectionId={connection.id} />
        {connection.connection_type === 'supabase_external' && (
          <div className="mt-3">
            <SchemaDiscoveryCard
              connectionId={connection.id}
              discoveredSchema={connection.discovered_schema as never}
              discoveredAt={connection.discovered_at}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
