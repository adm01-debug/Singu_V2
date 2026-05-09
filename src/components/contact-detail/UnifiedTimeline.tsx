import React, { useState, useMemo } from 'react';
import { useUnifiedTimeline, type UnifiedTimelineEvent, type UnifiedEventType } from '@/hooks/useUnifiedTimeline';
import { 
  MessageSquare, Phone, Users, FileText, CheckCircle2, 
  Calendar, Search, Filter, Clock, ArrowUpRight, ArrowDownLeft 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const TYPE_CONFIG: Record<UnifiedEventType, { icon: any; label: string; color: string }> = {
  message: { icon: MessageSquare, label: 'Mensagem', color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  call: { icon: Phone, label: 'Ligação', color: 'bg-green-500/10 text-green-600 border-green-200' },
  meeting: { icon: Users, label: 'Reunião', color: 'bg-purple-500/10 text-purple-600 border-purple-200' },
  note: { icon: FileText, label: 'Nota', color: 'bg-gray-500/10 text-gray-600 border-gray-200' },
  task: { icon: CheckCircle2, label: 'Tarefa', color: 'bg-amber-500/10 text-amber-600 border-amber-200' },
  event: { icon: Calendar, label: 'Evento', color: 'bg-rose-500/10 text-rose-600 border-rose-200' },
};

interface UnifiedTimelineProps {
  contactId: string;
}

export const UnifiedTimeline: React.FC<UnifiedTimelineProps> = ({ contactId }) => {
  const { events, loading } = useUnifiedTimeline(contactId);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<UnifiedEventType | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = !searchTerm || 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.content?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = selectedType === 'all' || event.type === selectedType;
      
      return matchesSearch && matchesType;
    });
  }, [events, searchTerm, selectedType]);

  if (loading && events.length === 0) {
    return <div className="p-8 text-center text-muted-foreground">Carregando timeline...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-muted/30 p-3 rounded-lg border">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar no histórico..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={selectedType === 'all' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setSelectedType('all')}
            className="h-8 text-xs"
          >
            Tudo
          </Button>
          {(Object.keys(TYPE_CONFIG) as UnifiedEventType[]).map(type => (
            <Button 
              key={type}
              variant={selectedType === type ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setSelectedType(type)}
              className="h-8 text-xs"
            >
              {TYPE_CONFIG[type].label}
            </Button>
          ))}
        </div>
      </div>

      <div className="relative space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="py-12 text-center">
            <Clock className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhuma interação encontrada com os filtros aplicados.</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-6 top-4 bottom-4 w-px bg-border" />
            
            <div className="space-y-6">
              {filteredEvents.map((event, index) => {
                const config = TYPE_CONFIG[event.type];
                const Icon = config.icon;
                const isExpanded = expandedId === event.id;

                return (
                  <div key={event.id} className="relative pl-14">
                    <div className={cn(
                      "absolute left-3.5 top-1 -translate-x-1/2 z-10 p-1.5 rounded-full border-2 bg-background",
                      config.color
                    )}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>

                    <Card 
                      className={cn(
                        "transition-all duration-200 hover:shadow-md cursor-pointer",
                        isExpanded ? "ring-2 ring-primary/20" : "hover:border-primary/30"
                      )}
                      onClick={() => setExpandedId(isExpanded ? null : event.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-semibold truncate">{event.title}</h4>
                              <Badge variant="outline" className="text-[10px] uppercase tracking-wider h-5">
                                {event.subType || config.label}
                              </Badge>
                              {event.metadata?.initiated_by && (
                                event.metadata.initiated_by === 'us' ? (
                                  <ArrowUpRight className="h-3 w-3 text-blue-500" />
                                ) : (
                                  <ArrowDownLeft className="h-3 w-3 text-green-500" />
                                )
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{format(new Date(event.timestamp), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</span>
                              {event.metadata?.duration && (
                                <>
                                  <span>•</span>
                                  <span>{Math.floor(event.metadata.duration / 60)} min</span>
                                </>
                              )}
                            </div>
                          </div>
                          {event.metadata?.sentiment && (
                             <div className={cn(
                               "w-2 h-2 rounded-full",
                               event.metadata.sentiment === 'positive' ? 'bg-green-500' :
                               event.metadata.sentiment === 'negative' ? 'bg-red-500' : 'bg-yellow-500'
                             )} />
                          )}
                        </div>

                        <AnimatePresence>
                          {(isExpanded || (event.content && event.content.length < 150)) && (
                            <motion.div 
                              initial={isExpanded ? { height: 0, opacity: 0 } : false}
                              animate={{ height: 'auto', opacity: 1 }}
                              className="mt-3 text-sm text-muted-foreground border-t pt-3"
                            >
                              <p className={cn(
                                "whitespace-pre-wrap leading-relaxed",
                                !isExpanded && "line-clamp-3"
                              )}>
                                {event.content || 'Sem descrição adicional.'}
                              </p>
                              
                              {isExpanded && event.metadata && (
                                <div className="mt-4 flex flex-wrap gap-4 text-[11px] border-t pt-3">
                                  {event.metadata.status && (
                                    <div>
                                      <span className="font-medium text-foreground mr-1">Status:</span>
                                      <span className="capitalize">{event.metadata.status}</span>
                                    </div>
                                  )}
                                  {event.metadata.priority && (
                                    <div>
                                      <span className="font-medium text-foreground mr-1">Prioridade:</span>
                                      <span className="capitalize">{event.metadata.priority}</span>
                                    </div>
                                  )}
                                  {event.metadata.due_date && (
                                    <div>
                                      <span className="font-medium text-foreground mr-1">Vencimento:</span>
                                      <span>{format(new Date(event.metadata.due_date), "dd/MM/yyyy")}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
