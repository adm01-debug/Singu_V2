import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mail, MousePointerClick, Eye, MessageCircle, AlertCircle, Send } from 'lucide-react';
import { useSequenceEvents, useSequenceMetrics, useSequenceSendLogs } from '@/hooks/useSequenceEvents';
import type { Sequence } from '@/hooks/useSequences';

interface Props {
  sequence: Sequence | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EVENT_ICONS: Record<string, typeof Mail> = {
  sent: Send,
  opened: Eye,
  clicked: MousePointerClick,
  replied: MessageCircle,
  bounced: AlertCircle,
  failed: AlertCircle,
};

const EVENT_COLORS: Record<string, string> = {
  sent: 'text-primary',
  opened: 'text-warning',
  clicked: 'text-success',
  replied: 'text-success',
  bounced: 'text-destructive',
  failed: 'text-destructive',
};

export function SequenceDetailDrawer({ sequence, open, onOpenChange }: Props) {
  const { data: metrics } = useSequenceMetrics(sequence?.id);
  const { data: events = [] } = useSequenceEvents(sequence?.id);
  const { data: sendLogs = [] } = useSequenceSendLogs(sequence?.id);

  if (!sequence) return null;

  const funnel = [
    { label: 'Enviados', value: metrics?.sent ?? 0, icon: Send, cls: 'bg-primary/10 text-primary' },
    { label: 'Abertos', value: metrics?.opened ?? 0, icon: Eye, cls: 'bg-warning/10 text-warning', rate: metrics?.openRate },
    { label: 'Cliques', value: metrics?.clicked ?? 0, icon: MousePointerClick, cls: 'bg-accent/10 text-accent-foreground', rate: metrics?.clickRate },
    { label: 'Respostas', value: metrics?.replied ?? 0, icon: MessageCircle, cls: 'bg-success/10 text-success', rate: metrics?.replyRate },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-base">{sequence.name}</SheetTitle>
          {sequence.description && (
            <p className="text-xs text-muted-foreground">{sequence.description}</p>
          )}
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Funil */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Funil de Performance</h4>
            <div className="grid grid-cols-4 gap-2">
              {funnel.map(f => (
                <Card key={f.label}>
                  <CardContent className="p-3 text-center">
                    <div className={`w-8 h-8 rounded-lg ${f.cls} flex items-center justify-center mx-auto mb-1`}>
                      <f.icon className="w-4 h-4" />
                    </div>
                    <p className="text-lg font-bold">{f.value}</p>
                    <p className="text-[10px] text-muted-foreground">{f.label}</p>
                    {f.rate !== undefined && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{f.rate.toFixed(1)}%</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Eventos recentes */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
              Eventos Recentes ({events.length})
            </h4>
            <ScrollArea className="h-64 rounded-md border border-border/40">
              {events.length === 0 ? (
                <p className="text-xs text-muted-foreground p-4 text-center">Nenhum evento ainda.</p>
              ) : (
                <div className="divide-y divide-border/30">
                  {events.slice(0, 50).map(ev => {
                    const Icon = EVENT_ICONS[ev.event_type] ?? Mail;
                    const cls = EVENT_COLORS[ev.event_type] ?? 'text-muted-foreground';
                    return (
                      <div key={ev.id} className="flex items-center gap-2 px-3 py-2 text-xs">
                        <Icon className={`w-3.5 h-3.5 ${cls} shrink-0`} />
                        <Badge variant="outline" className="text-[10px] h-5">step {ev.step_order ?? '-'}</Badge>
                        <span className="capitalize">{ev.event_type}</span>
                        <span className="ml-auto text-muted-foreground text-[10px]">
                          {new Date(ev.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Send Logs */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
              Log de Envios ({sendLogs.length})
            </h4>
            <ScrollArea className="h-48 rounded-md border border-border/40">
              {sendLogs.length === 0 ? (
                <p className="text-xs text-muted-foreground p-4 text-center">Nenhum envio registrado.</p>
              ) : (
                <div className="divide-y divide-border/30">
                  {sendLogs.slice(0, 50).map(log => (
                    <div key={log.id} className="px-3 py-2 text-xs space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={log.status === 'sent' ? 'default' : 'destructive'}
                          className="text-[10px] h-5"
                        >
                          {log.status}
                        </Badge>
                        <span className="text-muted-foreground">step {log.step_order} · {log.channel}</span>
                        <span className="ml-auto text-muted-foreground text-[10px]">
                          {new Date(log.sent_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      {log.error_message && (
                        <p className="text-destructive text-[10px] pl-1">{log.error_message}</p>
                      )}
                      {(log.opened_at || log.clicked_at) && (
                        <div className="flex gap-3 text-[10px] text-muted-foreground pl-1">
                          {log.opened_at && <span>👁 aberto</span>}
                          {log.clicked_at && <span>🖱 clicou</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
