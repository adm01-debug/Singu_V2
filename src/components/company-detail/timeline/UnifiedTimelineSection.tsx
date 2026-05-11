 import { memo, useMemo, useState } from 'react';
  import { 
    MessageSquare, Phone, Mail, Users, FileText, Search, Clock, 
    ArrowUpRight, ArrowDownLeft, Filter, Calendar as CalendarIcon,
    User, Headphones, FileJson 
  } from 'lucide-react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { Input } from '@/components/ui/input';
 import { Button } from '@/components/ui/button';
  import { ScrollArea } from '@/components/ui/scroll-area';
  import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
  import { Calendar } from '@/components/ui/calendar';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { format } from 'date-fns';
 import { ptBR } from 'date-fns/locale';
 import { cn } from '@/lib/utils';
 import { useUnifiedCommunicationHistory, type InteractionHistoryItem } from '@/hooks/useInteractionsRpc';
 
 interface Props {
   companyId: string;
 }
 
  const channelIcons: Record<string, any> = {
    whatsapp: MessageSquare,
    call: Phone,
    email: Mail,
    meeting: Users,
    note: FileText,
    audio: Headphones,
    transcript: FileJson,
  };
 
 const channelColors: Record<string, string> = {
   whatsapp: 'bg-success/10 text-success border-success/20',
   call: 'bg-info/10 text-info border-info/20',
   email: 'bg-primary/10 text-primary border-primary/20',
   meeting: 'bg-warning/10 text-warning border-warning/20',
   note: 'bg-muted text-muted-foreground border-border/50',
 };
 
  export const UnifiedTimelineSection = memo(({ companyId }: Props) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterPerson, setFilterPerson] = useState<string>('all');
    const [date, setDate] = useState<Date | undefined>(undefined);
    const { data: history, isLoading } = useUnifiedCommunicationHistory(companyId, 100, 'company');
  
    const uniqueContacts = useMemo(() => {
      if (!history) return [];
      const names = history
        .map(item => item.contact_name)
        .filter((name): name is string => !!name);
      return Array.from(new Set(names));
    }, [history]);
  
    const filteredHistory = useMemo(() => {
      if (!history) return [];
      return history.filter(item => {
        const matchesSearch = !searchTerm.trim() || 
          (item.resumo?.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesType = filterType === 'all' || item.channel === filterType || item.type === filterType;
        const matchesPerson = filterPerson === 'all' || item.contact_name === filterPerson;
        
        const matchesDate = !date || 
          format(new Date(item.data_interacao), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
  
        return matchesSearch && matchesType && matchesPerson && matchesDate;
      });
    }, [history, searchTerm, filterType, filterPerson, date]);
 
   return (
     <Card className="flex flex-col h-[500px]">
       <CardHeader className="pb-3 border-b border-border/50 shrink-0">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Timeline Unificada
            </CardTitle>
            <Badge variant="outline" className="text-[10px]">
              {filteredHistory.length} interações
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Palavra-chave..."
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
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="call">Ligações</SelectItem>
                <SelectItem value="email">Emails</SelectItem>
                <SelectItem value="audio">Áudios</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPerson} onValueChange={setFilterPerson}>
              <SelectTrigger className="h-8 text-[11px]">
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3" />
                  <SelectValue placeholder="Pessoa" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Pessoas</SelectItem>
                {uniqueContacts.map(name => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-8 text-[11px] justify-start px-2 font-normal">
                  <CalendarIcon className="mr-2 h-3 w-3" />
                  {date ? format(date, "dd/MM/yy") : "Filtrar por data"}
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
         {isLoading ? (
           <div className="p-8 text-center text-xs text-muted-foreground animate-pulse">
             Carregando histórico unificado...
           </div>
         ) : filteredHistory.length === 0 ? (
           <div className="p-12 text-center">
             <MessageSquare className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
             <p className="text-sm text-muted-foreground italic">Nenhuma interação encontrada.</p>
           </div>
         ) : (
           <ScrollArea className="h-full">
             <div className="p-3 space-y-4 relative">
               <div className="absolute left-7 top-4 bottom-4 w-px bg-border/50" />
               
               {filteredHistory.map((item) => {
                 const channel = item.channel || item.type || 'note';
                 const Icon = channelIcons[channel] || MessageSquare;
                 const colorClass = channelColors[channel] || channelColors.note;
                 
                 return (
                   <div key={item.id} className="relative pl-10">
                     <div className={cn(
                       "absolute left-4 top-0 -translate-x-1/2 z-10 w-6 h-6 rounded-full border flex items-center justify-center bg-background shadow-xs",
                       colorClass
                     )}>
                       <Icon className="h-3 w-3" />
                     </div>
                     
                     <div className="space-y-1">
                       <div className="flex items-center justify-between gap-2">
                         <div className="flex items-center gap-1.5 flex-wrap">
                           <span className="text-xs font-bold text-foreground">
                             {item.resumo || (item.type === 'call' ? 'Chamada realizada' : item.type)}
                           </span>
                           {item.direction && (
                             item.direction === 'inbound' 
                               ? <ArrowDownLeft className="h-3 w-3 text-success" />
                               : <ArrowUpRight className="h-3 w-3 text-blue-500" />
                           )}
                         </div>
                         <span className="text-[10px] text-muted-foreground tabular-nums">
                           {format(new Date(item.data_interacao), "dd/MM HH:mm", { locale: ptBR })}
                         </span>
                       </div>
                       
                       <div className="flex items-center gap-2">
                         {item.contact_name && (
                           <Badge variant="outline" className="text-[9px] h-4 py-0 font-medium">
                             {item.contact_name}
                           </Badge>
                         )}
                         <span className="text-[10px] text-muted-foreground uppercase tracking-tight font-bold opacity-70">
                           {channel}
                         </span>
                       </div>
                     </div>
                   </div>
                 );
               })}
             </div>
           </ScrollArea>
         )}
       </CardContent>
     </Card>
   );
 });
 UnifiedTimelineSection.displayName = 'UnifiedTimelineSection';