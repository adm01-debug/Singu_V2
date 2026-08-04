import { Phone, Mail, MessageSquare, Video, Calendar, ArrowUpRight, ArrowDownLeft, Clock, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useExternalInteractions } from '@/hooks/useExternalInteractions';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

interface Props {
  contactId: string;
}

const CHANNEL_CONFIG: Record<string, { icon: typeof Phone; color: string; label: string }> = {
  whatsapp: { icon: MessageSquare, color: 'text-success', label: 'WhatsApp' },
  email: { icon: Mail, color: 'text-info', label: 'Email' },
  phone: { icon: Phone, color: 'text-primary', label: 'Telefone' },
  call: { icon: Phone, color: 'text-primary', label: 'Ligação' },
  meeting: { icon: Video, color: 'text-warning', label: 'Reunião' },
  video: { icon: Video, color: 'text-warning', label: 'Vídeo' },
  presencial: { icon: Calendar, color: 'text-accent', label: 'Presencial' },
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m${s}s` : `${m}m`;
}

export function ExternalInteractionsTimeline({ contactId }: Props) {
  const { data: interactions = [], isLoading } = useExternalInteractions(contactId, 20);

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3"><div className="h-4 w-40 bg-muted rounded" /></CardHeader>
        <CardContent><div className="h-48 bg-muted rounded" /></CardContent>
      </Card>
    );
  }

  if (interactions.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Timeline Enriquecida
          </div>
          <Badge variant="secondary" className="text-[10px]">{interactions.length} registros</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[400px]">
          <div className="relative space-y-0">
            {/* Timeline line */}
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

            {interactions.map((ix, i) => {
              const channel = CHANNEL_CONFIG[ix.channel || ''] || CHANNEL_CONFIG.phone;
              const ChannelIcon = channel.icon;
              const isInbound = ix.direction === 'inbound' || ix.direction === 'entrada';
              const DirectionIcon = isInbound ? ArrowDownLeft : ArrowUpRight;

              return (
                <div key={ix.id || i} className="relative flex gap-3 pb-3 pl-1">
                  {/* Dot */}
                  <div className={cn('relative z-10 flex h-[30px] w-[30px] items-center justify-center rounded-full border bg-card', channel.color)}>
                    <ChannelIcon className="h-3.5 w-3.5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 rounded-lg border p-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-medium">{ix.assunto || channel.label}</span>
                          <Badge variant="outline" className="text-[9px] gap-0.5">
                            <DirectionIcon className="h-2.5 w-2.5" />
                            {isInbound ? 'Entrada' : 'Saída'}
                          </Badge>
                          {ix.status && (
                            <Badge variant="secondary" className="text-[9px] capitalize">{ix.status}</Badge>
                          )}
                        </div>
                        {ix.resumo && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{ix.resumo}</p>
                        )}
                        {ix.empresa_nome && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-0.5">
                            <Building2 className="h-2.5 w-2.5" /> {ix.empresa_nome}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        {ix.data_interacao && (
                          <p className="text-[10px] text-muted-foreground">
                            {format(parseISO(ix.data_interacao), 'dd/MM HH:mm')}
                          </p>
                        )}
                        {ix.duracao_segundos != null && ix.duracao_segundos > 0 && (
                          <p className="text-[10px] text-muted-foreground">
                            <Clock className="h-2.5 w-2.5 inline mr-0.5" />
                            {formatDuration(ix.duracao_segundos)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
