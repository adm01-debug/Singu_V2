import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Lock, MessageSquare, Zap } from 'lucide-react';
import { useSupportTickets, useTicketComments, SupportTicket } from '@/hooks/useSupportTickets';
import { useCannedResponses } from '@/hooks/useCannedResponses';
import { SLABadge } from './SLABadge';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Props {
  ticket: SupportTicket | null;
  open: boolean;
  onClose: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Aberto', in_progress: 'Em Andamento', waiting: 'Aguardando',
  resolved: 'Resolvido', closed: 'Fechado',
};
const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente',
};

export function TicketDetailDrawer({ ticket, open, onClose }: Props) {
  const { update } = useSupportTickets();
  const { comments, addComment } = useTicketComments(ticket?.id);
  const { responses, use: useCanned } = useCannedResponses();
  const [reply, setReply] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  if (!ticket) return null;

  const handleSend = () => {
    if (!reply.trim()) return;
    addComment.mutate({ content: reply, isInternal });
    setReply('');
    setIsInternal(false);
  };

  const handleUseCanned = async (id: string) => {
    const text = await useCanned.mutateAsync(id);
    setReply(prev => (prev ? prev + '\n\n' + text : text));
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-3 border-b">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-base truncate">{ticket.title}</SheetTitle>
              <SheetDescription className="text-xs mt-1">
                Criado {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: ptBR })}
              </SheetDescription>
            </div>
            <SLABadge deadline={ticket.sla_deadline} resolvedAt={ticket.resolved_at} />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Select
              value={ticket.status}
              onValueChange={(v) => update.mutate({ id: ticket.id, status: v as SupportTicket['status'] })}
            >
              <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={ticket.priority}
              onValueChange={(v) => update.mutate({ id: ticket.id, priority: v as SupportTicket['priority'] })}
            >
              <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {ticket.tags?.length > 0 && ticket.tags.map(t => (
              <Badge key={t} variant="secondary" className="text-[10px] h-5">{t}</Badge>
            ))}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          {ticket.description && (
            <div className="rounded-md bg-muted/40 p-3 text-sm whitespace-pre-wrap mb-4">
              {ticket.description}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{comments.length} comentário(s)</span>
          </div>

          <div className="space-y-3">
            {comments.map(c => (
              <div
                key={c.id}
                className={cn(
                  'rounded-md p-3 text-sm border',
                  c.is_internal
                    ? 'bg-yellow-500/5 border-yellow-500/20'
                    : 'bg-card border-border',
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    {c.is_internal && <Lock className="h-3 w-3 text-yellow-600" />}
                    <span className="text-[10px] text-muted-foreground">
                      {c.is_internal ? 'Nota interna' : 'Resposta'} ·{' '}
                      {format(new Date(c.created_at), "dd/MM HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </div>
                <p className="whitespace-pre-wrap">{c.content}</p>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">
                Nenhum comentário ainda. Inicie a conversa abaixo.
              </p>
            )}
          </div>
        </ScrollArea>

        <div className="border-t bg-muted/20 px-6 py-3 space-y-2">
          {responses.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Zap className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Respostas prontas:</span>
              {responses.slice(0, 4).map(r => (
                <Button
                  key={r.id}
                  size="sm"
                  variant="outline"
                  onClick={() => handleUseCanned(r.id)}
                  className="h-6 text-[10px] px-2"
                >
                  {r.title}
                </Button>
              ))}
            </div>
          )}

          <Textarea
            value={reply}
            onChange={e => setReply(e.target.value)}
            placeholder={isInternal ? 'Nota interna (não visível ao cliente)...' : 'Responder ao cliente...'}
            className="min-h-[80px] text-sm"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch id="internal" checked={isInternal} onCheckedChange={setIsInternal} />
              <Label htmlFor="internal" className="text-xs cursor-pointer">Nota interna</Label>
            </div>
            <Button onClick={handleSend} disabled={!reply.trim() || addComment.isPending} size="sm" className="text-xs">
              <Send className="h-3 w-3 mr-1" /> Enviar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
