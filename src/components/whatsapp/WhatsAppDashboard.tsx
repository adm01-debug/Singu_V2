import { MessageCircle, Wifi, WifiOff, Send, Inbox, Eye, Clock, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useWhatsAppData } from '@/hooks/useWhatsAppData';
import { format } from 'date-fns';

interface Props {
  contactId?: string;
}

export function WhatsAppDashboard({ contactId }: Props) {
  const { instances, messages, kpis, loading } = useWhatsAppData(contactId);

  if (loading) return null;

  const hasData = instances.length > 0 || messages.length > 0 || kpis;
  if (!hasData) return null;

  return (
    <div className="space-y-4">
      {/* Instances */}
      {instances.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <MessageCircle className="h-4 w-4 text-success" />
              Instâncias WhatsApp ({instances.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {instances.map(inst => (
              <div key={inst.id} className="flex items-center justify-between rounded-lg border p-2.5 text-sm">
                <div className="flex items-center gap-2">
                  {inst.status === 'connected' ? (
                    <Wifi className="h-4 w-4 text-success" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-destructive" />
                  )}
                  <div>
                    <p className="font-medium text-foreground">{inst.instance_name}</p>
                    {inst.phone_number && (
                      <p className="text-xs text-muted-foreground">{inst.phone_number}</p>
                    )}
                  </div>
                </div>
                <Badge
                  variant={inst.status === 'connected' ? 'default' : 'secondary'}
                  className="text-xs capitalize"
                >
                  {inst.status === 'connected' ? 'Conectado' : inst.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      {kpis && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <MessageCircle className="h-4 w-4 text-primary" />
              KPIs WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg border p-2.5 text-center">
                <Send className="h-4 w-4 mx-auto text-primary mb-1" />
                <p className="text-xs text-muted-foreground">Enviadas</p>
                <p className="text-lg font-bold text-foreground">{kpis.messages_sent || 0}</p>
              </div>
              <div className="rounded-lg border p-2.5 text-center">
                <Inbox className="h-4 w-4 mx-auto text-info mb-1" />
                <p className="text-xs text-muted-foreground">Recebidas</p>
                <p className="text-lg font-bold text-foreground">{kpis.messages_received || 0}</p>
              </div>
              <div className="rounded-lg border p-2.5 text-center">
                <Eye className="h-4 w-4 mx-auto text-success mb-1" />
                <p className="text-xs text-muted-foreground">Lidas</p>
                <p className="text-lg font-bold text-foreground">{kpis.messages_read || 0}</p>
              </div>
              <div className="rounded-lg border p-2.5 text-center">
                <Users className="h-4 w-4 mx-auto text-warning mb-1" />
                <p className="text-xs text-muted-foreground">Contatos Únicos</p>
                <p className="text-lg font-bold text-foreground">{kpis.unique_contacts || 0}</p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {kpis.delivery_rate != null && (
                <div className="flex items-center gap-2">
                  <span className="w-28 text-xs text-muted-foreground">Taxa Entrega</span>
                  <Progress value={Number(kpis.delivery_rate)} className="h-2 flex-1" />
                  <span className="w-12 text-right text-xs font-medium text-foreground">{Number(kpis.delivery_rate).toFixed(0)}%</span>
                </div>
              )}
              {kpis.read_rate != null && (
                <div className="flex items-center gap-2">
                  <span className="w-28 text-xs text-muted-foreground">Taxa Leitura</span>
                  <Progress value={Number(kpis.read_rate)} className="h-2 flex-1" />
                  <span className="w-12 text-right text-xs font-medium text-foreground">{Number(kpis.read_rate).toFixed(0)}%</span>
                </div>
              )}
              {kpis.avg_response_time_seconds != null && (
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Tempo médio de resposta:</span>
                  <span className="text-xs font-medium text-foreground">
                    {Math.round(kpis.avg_response_time_seconds / 60)} min
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Messages */}
      {messages.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              Mensagens Recentes ({messages.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={cn(
                    'rounded-lg p-2.5 text-sm max-w-[85%]',
                    msg.direction === 'outbound'
                      ? 'ml-auto bg-primary/10 border border-primary/20'
                      : 'bg-muted border'
                  )}
                >
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-xs font-medium text-foreground">
                      {msg.direction === 'outbound' ? 'Você' : 'Contato'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(msg.created_at), 'dd/MM HH:mm')}
                    </span>
                  </div>
                  {msg.content && (
                    <p className="text-xs text-foreground whitespace-pre-wrap">{msg.content}</p>
                  )}
                  {msg.message_type !== 'text' && msg.message_type !== 'conversation' && (
                    <Badge variant="secondary" className="text-xs mt-1 capitalize">
                      {msg.message_type}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
