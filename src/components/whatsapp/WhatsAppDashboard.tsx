 import { MessageCircle, Wifi, WifiOff, Send, Inbox, Eye, Clock, Users, FileAudio, FileText, Brain } from 'lucide-react';
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

   const { data: indexedMessages } = useQuery({
     queryKey: ['whatsapp-indexed', contactId],
     queryFn: async () => {
       if (!contactId) return [];
       const { data, error } = await supabase
         .from('whatsapp_messages_index')
         .select('*')
         .eq('contact_id', contactId)
         .order('received_at', { ascending: false });
       if (error) throw error;
       return data;
     },
     enabled: !!contactId
   });
 
   return (
     <div className="space-y-4 animate-in fade-in duration-500">
       {/* Indexed Profile Messages (WhatsApp Capture & Indexing) */}
       {indexedMessages && indexedMessages.length > 0 && (
         <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-50/50 to-white">
           <CardHeader className="pb-3">
             <CardTitle className="flex items-center gap-2 text-sm">
               <Brain className="h-4 w-4 text-indigo-500" />
               Captura & Indexação de Perfil (WhatsApp)
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="space-y-3">
               {indexedMessages.map(msg => (
                 <div key={msg.id} className="rounded-lg border bg-white p-3 text-xs shadow-sm hover:border-indigo-300 transition-colors">
                   <div className="flex items-center justify-between mb-2">
                     <Badge variant="outline" className="text-[10px] uppercase font-bold">
                       {msg.message_type === 'audio' ? <><FileAudio className="h-3 w-3 mr-1 inline" /> Áudio</> : <><FileText className="h-3 w-3 mr-1 inline" /> Texto</>}
                     </Badge>
                     <span className="text-[10px] text-muted-foreground">{format(new Date(msg.received_at), 'dd/MM HH:mm')}</span>
                   </div>
                   
                   {msg.content && <p className="mb-2 italic text-muted-foreground">"{msg.content}"</p>}
                   
                   {msg.transcription && (
                     <div className="bg-indigo-50/50 p-2 rounded border border-indigo-100 mb-2">
                       <p className="font-semibold text-indigo-900 mb-1 flex items-center gap-1">
                         <FileAudio className="h-3 w-3" /> Transcrição:
                       </p>
                       <p className="text-indigo-800/80">{msg.transcription}</p>
                     </div>
                   )}
 
                   <div className="flex flex-wrap gap-1 mt-2">
                     {msg.sentiment && (
                       <Badge variant="secondary" className={cn(
                         "text-[9px] uppercase font-bold",
                         msg.sentiment === 'positive' ? "bg-emerald-100 text-emerald-700" : 
                         msg.sentiment === 'negative' ? "bg-rose-100 text-rose-700" : "bg-slate-100"
                       )}>
                         Sentimento: {msg.sentiment}
                       </Badge>
                     )}
                     {msg.intent && (
                       <Badge variant="outline" className="text-[9px] uppercase font-bold text-indigo-600 border-indigo-200">
                         Intento: {msg.intent}
                       </Badge>
                     )}
                     {(msg.neuro_tags as string[])?.map((tag: string) => (
                       <Badge key={tag} className="text-[9px] bg-primary/10 text-primary border-none">
                         #{tag}
                       </Badge>
                     ))}
                   </div>
                 </div>
               ))}
             </div>
           </CardContent>
         </Card>
       )}
 
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
                  {msg.metadata?.message_type && msg.metadata.message_type !== 'text' && (
                    <Badge variant="secondary" className="text-xs mt-1 capitalize">
                      {msg.metadata.message_type}
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
