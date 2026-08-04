import React from 'react';
import { MessageSquare, ArrowUpRight, ArrowDownLeft, Check, CheckCheck, Clock, Image, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWhatsappMessages, WhatsappMessage } from '@/hooks/useWhatsappMessages';
import { ExternalDataCard } from '@/components/ui/external-data-card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  contactId: string;
}

const statusIcon: Record<string, React.ReactNode> = {
  sent: <Check className="h-3 w-3 text-muted-foreground" />,
  delivered: <CheckCheck className="h-3 w-3 text-muted-foreground" />,
  read: <CheckCheck className="h-3 w-3 text-primary" />,
  pending: <Clock className="h-3 w-3 text-warning" />,
};

const typeIcon: Record<string, React.ReactNode> = {
  image: <Image className="h-3 w-3" />,
  document: <FileText className="h-3 w-3" />,
};

function MessageBubble({ msg }: { msg: WhatsappMessage }) {
  const isOutbound = msg.direction === 'outbound' || msg.direction === 'sent';
  const time = msg.sent_at || msg.created_at;

  return (
    <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
          isOutbound
            ? 'bg-primary/10 text-foreground border border-primary/20'
            : 'bg-muted text-foreground border border-border'
        }`}
      >
        {msg.message_type && msg.message_type !== 'text' && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
            {typeIcon[msg.message_type] || null}
            <span className="capitalize">{msg.message_type}</span>
          </div>
        )}
        <p className="whitespace-pre-wrap break-words">{msg.content || '[mídia]'}</p>
        <div className="flex items-center justify-end gap-1 mt-1">
          {time && (
            <span className="text-[10px] text-muted-foreground">
              {format(new Date(time), "dd/MM HH:mm", { locale: ptBR })}
            </span>
          )}
          {isOutbound && statusIcon[msg.status || 'sent']}
        </div>
      </div>
    </div>
  );
}

export const WhatsappMessagesWidget = React.memo(function WhatsappMessagesWidget({ contactId }: Props) {
  const { data: messages, isLoading, error } = useWhatsappMessages(contactId);

  return (
    <ExternalDataCard
      title="WhatsApp"
      icon={<MessageSquare className="h-4 w-4 text-success" />}
      isLoading={isLoading}
      error={error}
      hasData={!!messages && messages.length > 0}
      emptyMessage="Nenhuma mensagem WhatsApp encontrada"
    >
      {messages && messages.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-3">
            <Badge variant="secondary" className="text-xs">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              {messages.filter(m => m.direction === 'outbound' || m.direction === 'sent').length} enviadas
            </Badge>
            <Badge variant="outline" className="text-xs">
              <ArrowDownLeft className="h-3 w-3 mr-1" />
              {messages.filter(m => m.direction === 'inbound' || m.direction === 'received').length} recebidas
            </Badge>
          </div>
          <ScrollArea className="h-[300px]">
            <div className="space-y-1 pr-3">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
            </div>
          </ScrollArea>
        </>
      )}
    </ExternalDataCard>
  );
});
