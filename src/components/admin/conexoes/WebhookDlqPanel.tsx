import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useWebhookDlq } from '@/hooks/useWebhookDlq';
import { AlertTriangle, RefreshCw, PlayCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function WebhookDlqPanel() {
  const { items, isLoading, reprocess, reprocessAll } = useWebhookDlq();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            Falhas Pendentes (DLQ)
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Reprocesso automático a cada 5 min com backoff exponencial (2,4,8,16,32 min).
          </p>
        </div>
        <Button
          size="sm" variant="outline"
          disabled={!items.length || reprocessAll.isPending}
          onClick={() => reprocessAll.mutate()}
        >
          <PlayCircle className="w-4 h-4 mr-1.5" />
          Reprocessar lote
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="Nenhuma falha pendente"
            description="Todos os webhooks foram processados com sucesso."
          />
        ) : (
          <ScrollArea className="h-[420px] pr-2">
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.id} className="border border-border/60 rounded-md p-3 bg-card/50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant={item.status === 'failed' ? 'destructive' : 'secondary'} className="capitalize text-xs">
                          {item.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">
                          tentativa {item.attempts}/{item.max_attempts}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          · próx. {formatDistanceToNow(new Date(item.next_retry_at), { locale: ptBR, addSuffix: true })}
                        </span>
                      </div>
                      {item.last_error && (
                        <p className="text-xs text-destructive line-clamp-2 mb-1">{item.last_error}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Criado {formatDistanceToNow(new Date(item.created_at), { locale: ptBR, addSuffix: true })}
                        {item.source_ip && ` · IP ${item.source_ip}`}
                      </p>
                    </div>
                    <Button
                      size="sm" variant="ghost"
                      disabled={reprocess.isPending}
                      onClick={() => reprocess.mutate(item.id)}
                      title="Reprocessar agora"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
