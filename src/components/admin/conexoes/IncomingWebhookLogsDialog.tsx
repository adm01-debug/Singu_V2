import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIncomingWebhookLogs } from '@/hooks/useIncomingWebhooks';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { WebhookReplayButton } from './WebhookReplayButton';
import { IPDisplay } from '@/components/security/IPDisplay';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  webhookId: string;
  webhookName: string;
  webhookToken: string;
}

export function IncomingWebhookLogsDialog({ open, onOpenChange, webhookId, webhookName, webhookToken }: Props) {
  const { data: logs = [], isLoading } = useIncomingWebhookLogs(webhookId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Logs — {webhookName}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {!isLoading && logs.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">Sem chamadas ainda.</p>
          )}
          <div className="space-y-2">
            {logs.map(l => (
              <div key={l.id} className="border border-border/60 rounded-md p-3 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={l.status === 'success' ? 'default' : 'destructive'} className="text-xs">
                      {l.status} · HTTP {l.http_status ?? '—'}
                    </Badge>
                    {l.latency_ms != null && <span className="text-muted-foreground">{l.latency_ms}ms</span>}
                    <IPDisplay ip={l.source_ip} className="text-muted-foreground" />
                  </div>
                  <span className="text-muted-foreground">
                    {formatDistanceToNow(new Date(l.created_at), { locale: ptBR, addSuffix: true })}
                  </span>
                </div>
                {l.error_message && <p className="text-destructive">{l.error_message}</p>}
                {l.payload && (
                  <details>
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Payload</summary>
                    <pre className="mt-1 bg-muted/40 p-2 rounded font-mono overflow-x-auto">
                      {JSON.stringify(l.payload, null, 2)}
                    </pre>
                    <WebhookReplayButton webhookToken={webhookToken} payload={l.payload} />
                  </details>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
