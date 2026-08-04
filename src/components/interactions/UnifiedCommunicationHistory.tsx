import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useUnifiedCommunicationHistory } from '@/hooks/useInteractionsRpc';
import { 
  MessageSquare, Phone, Mail, Globe, Users, Edit, 
  Search, Filter, Calendar as CalendarIcon, ArrowUpRight, ArrowDownLeft,
   Headphones, FileJson, Smile, Frown, Meh
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type ItemWithSentiment = {
  sentiment_label?: string | null;
  emotions?: string[] | null;
};

const channelIcons: Record<string, LucideIcon> = {
  whatsapp: MessageSquare,
  call: Phone,
  email: Mail,
  meeting: Users,
  note: Edit,
  social: Globe,
  audio: Headphones,
   transcript: FileJson,
   sentiment: Smile,
};
const sentimentIcons: Record<string, LucideIcon> = {
  positive: Smile,
  negative: Frown,
  neutral: Meh,
};

const sentimentColors: Record<string, string> = {
  positive: 'text-success',
  negative: 'text-destructive',
  neutral: 'text-muted-foreground',
};


const channelColors: Record<string, string> = {
  whatsapp: 'bg-success/10 text-success border-success/20',
  call: 'bg-info/10 text-info border-info/20',
  email: 'bg-primary/10 text-primary border-primary/20',
  meeting: 'bg-warning/10 text-warning border-warning/20',
  note: 'bg-muted text-muted-foreground border-border/50',
  social: 'bg-accent text-accent-foreground border-accent/20',
};

export const UnifiedCommunicationHistory = React.memo(function UnifiedCommunicationHistory({ 
  contactId, 
  companyId 
}: { 
  contactId?: string; 
  companyId?: string 
}) {
  const entityId = contactId || companyId;
  const entityType = contactId ? 'contact' : 'company';
  const { data: history, isLoading } = useUnifiedCommunicationHistory(entityId, 100, entityType as 'contact' | 'company');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [date, setDate] = useState<Date | undefined>(undefined);

  const filteredHistory = useMemo(() => {
    if (!history) return [];
    return history.filter(item => {
      const matchesSearch = !searchTerm.trim() || 
        (item.resumo?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.type?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = filterType === 'all' || item.channel === filterType || item.type === filterType;
      
      const matchesDate = !date || 
        format(new Date(item.data_interacao), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');

      return matchesSearch && matchesType && matchesDate;
    });
  }, [history, searchTerm, filterType, date]);

  if (isLoading) return <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Histórico Unificado</CardTitle></CardHeader><CardContent><Skeleton className="h-40" /></CardContent></Card>;
  
  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="pb-3 border-b border-border/50 shrink-0">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Histórico de Comunicação Unificada
            </CardTitle>
            <Badge variant="outline" className="text-[10px]">
              {filteredHistory.length} registros
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar no histórico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-[11px]"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-8 text-[11px]">
                <div className="flex items-center gap-2">
                  <Filter className="h-3 w-3" />
                  <SelectValue placeholder="Tipo" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Canais</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="call">Ligações</SelectItem>
                <SelectItem value="email">Emails</SelectItem>
                <SelectItem value="audio">Áudios / Transcrições</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-8 text-[11px] justify-start px-2 font-normal">
                  <CalendarIcon className="mr-2 h-3 w-3" />
                  {date ? format(date, "dd/MM/yy") : "Filtrar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
                {date && (
                  <div className="p-2 border-t flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setDate(undefined)} className="h-7 text-[10px]">Limpar</Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        {filteredHistory.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground italic">Nenhuma interação encontrada com os filtros atuais.</p>
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-3 space-y-3">
            {filteredHistory.map((item) => {
              const channel = item.channel || item.type || 'note';
              const Icon = channelIcons[channel] || MessageSquare;
              const colorClass = channelColors[channel] || channelColors.note;
              
               const extra = item as unknown as ItemWithSentiment;
               const sentiment = extra.sentiment_label || 'neutral';
               const SentimentIcon = sentimentIcons[sentiment] || Meh;
               const sentimentColor = sentimentColors[sentiment];

               return (
                 <div key={item.id} className="flex flex-col gap-2 p-3 rounded-xl hover:bg-muted/30 transition-all border border-border/30 group">
                   <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm transition-transform group-hover:scale-105",
                    colorClass
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm font-bold text-foreground truncate">
                          {item.resumo || (item.type === 'call' ? 'Chamada de Áudio' : item.type)}
                        </span>
                        {item.direction && (
                          item.direction === 'inbound' 
                            ? <ArrowDownLeft className="h-3 w-3 text-success shrink-0" />
                            : <ArrowUpRight className="h-3 w-3 text-blue-500 shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground tabular-nums shrink-0 font-medium">
                        {format(new Date(item.data_interacao), "dd MMM, HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[9px] h-4 py-0 uppercase font-bold tracking-tight opacity-70">
                        {channel}
                      </Badge>
                      {item.contact_name && companyId && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {item.contact_name}
                        </span>
                      )}
                      {item.type === 'whatsapp' && (
                        <Badge variant="secondary" className="text-[9px] h-4 py-0 bg-green-500/10 text-green-600 border-none">
                          Verificada
                        </Badge>
                      )}
                    </div>

                    {item.resumo && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-3 italic leading-relaxed">
                        "{item.resumo}"
                      </p>
                    )}

                     <div className="flex items-center gap-3 mt-2 border-t border-border/30 pt-2">
                        <div className="flex items-center gap-1">
                          <SentimentIcon className={cn("h-3 w-3", sentimentColor)} />
                          <span className={cn("text-[10px] font-medium", sentimentColor)}>
                            {sentiment === 'positive' ? 'Positivo' : sentiment === 'negative' ? 'Negativo' : 'Neutro'}
                          </span>
                        </div>
                        {extra.emotions && (
                          <div className="flex items-center gap-1 overflow-hidden">
                            {extra.emotions.slice(0, 2).map((emo, idx) => (
                              <Badge key={idx} variant="secondary" className="text-[8px] h-3 px-1 py-0 bg-primary/5 text-primary/70 border-none">
                                {emo}
                              </Badge>
                            ))}
                          </div>
                        )}
                     </div>
                   </div>
                 </div>
               </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default UnifiedCommunicationHistory;
