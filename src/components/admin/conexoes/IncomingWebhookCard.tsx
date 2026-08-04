import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, RefreshCw, Copy, Activity, ShieldCheck, Code2 } from 'lucide-react';
import { useIncomingWebhooks, type IncomingWebhook } from '@/hooks/useIncomingWebhooks';
import { toast } from 'sonner';
import { useState } from 'react';
import { IncomingWebhookLogsDialog } from './IncomingWebhookLogsDialog';
import { WebhookQuotaBar } from './WebhookQuotaBar';
import { WebhookSnippetsSheet } from './WebhookSnippetsSheet';
import { Separator } from '@/components/ui/separator';

interface Props {
  webhook: IncomingWebhook;
  onEdit: () => void;
}

export function IncomingWebhookCard({ webhook, onEdit }: Props) {
  const { remove, rotateToken } = useIncomingWebhooks();
  const [showLogs, setShowLogs] = useState(false);
  const [showSnippets, setShowSnippets] = useState(false);

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const url = `https://${projectId}.functions.supabase.co/incoming-webhook/${webhook.token}`;

  const copy = async (txt: string, msg: string) => {
    try {
      await navigator.clipboard.writeText(txt);
      toast.success(msg);
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  return (
    <>
      <Card className="border-border/60">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h4 className="font-medium truncate">{webhook.name}</h4>
                <Badge variant={webhook.is_active ? 'default' : 'secondary'} className="text-xs">
                  {webhook.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
                <Badge variant="outline" className="text-xs">{webhook.target_entity}</Badge>
                {webhook.require_signature && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <ShieldCheck className="w-3 h-3" /> HMAC
                  </Badge>
                )}
              </div>
              {webhook.description && (
                <p className="text-sm text-muted-foreground mb-2">{webhook.description}</p>
              )}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span><Activity className="w-3 h-3 inline mr-1" />{webhook.total_calls} chamadas</span>
                {webhook.total_errors > 0 && <span className="text-destructive">{webhook.total_errors} erros</span>}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button size="sm" variant="ghost" onClick={() => setShowLogs(true)} title="Logs">
                <Activity className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowSnippets(true)} title="Ver exemplos de integração">
                <Code2 className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={onEdit} title="Editar">
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                size="sm" variant="ghost"
                onClick={() => { if (confirm('Rotacionar token? URLs antigas deixarão de funcionar.')) rotateToken.mutate(webhook.id); }}
                title="Rotacionar token"
              ><RefreshCw className="w-4 h-4" /></Button>
              <Button
                size="sm" variant="ghost"
                onClick={() => { if (confirm(`Remover "${webhook.name}"?`)) remove.mutate(webhook.id); }}
                className="text-destructive hover:text-destructive"
              ><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>

          <div className="bg-muted/40 rounded-md p-2 flex items-center gap-2">
            <code className="text-xs flex-1 truncate font-mono">{url}</code>
            <Button size="sm" variant="ghost" onClick={() => copy(url, 'URL copiada')}>
              <Copy className="w-3.5 h-3.5" />
            </Button>
          </div>

          <Separator />
          <WebhookQuotaBar webhookId={webhook.id} />
        </CardContent>
      </Card>

      {showLogs && (
        <IncomingWebhookLogsDialog
          open={showLogs} onOpenChange={setShowLogs}
          webhookId={webhook.id} webhookName={webhook.name} webhookToken={webhook.token}
        />
      )}
      {showSnippets && (
        <WebhookSnippetsSheet
          open={showSnippets} onOpenChange={setShowSnippets}
          webhook={webhook} url={url}
        />
      )}
    </>
  );
}
