import { Tables } from '@/integrations/supabase/types';
import { format, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, Star, Award, TrendingUp } from 'lucide-react';

interface LifeEventsTimelineProps {
  lifeEvents: Tables<'life_events'>[];
}

export function LifeEventsTimeline({ lifeEvents }: LifeEventsTimelineProps) {
  const sortedEvents = [...lifeEvents].sort((a, b) => {
    const dateA = new Date(a.event_date);
    const dateB = new Date(b.event_date);
    return dateA.getTime() - dateB.getTime();
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'birthday': return <Star className="h-3 w-3 text-warning" />;
      case 'promotion': return <TrendingUp className="h-3 w-3 text-success" />;
      case 'achievement': return <Award className="h-3 w-3 text-primary" />;
      default: return <CalendarDays className="h-3 w-3 text-muted-foreground" />;
    }
  };

  if (lifeEvents.length === 0) return null;

  return (
    <div className="bg-muted/20 rounded-xl p-4 border border-border/50">
      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
        <TrendingUp className="h-3 w-3" />
        Timeline Visual de Marcos
      </h4>
      
      <div className="relative pt-2 pb-6 px-2">
        {/* Horizontal Line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2" />
        
        <div className="flex justify-between items-center relative z-10">
          {sortedEvents.map((event, idx) => {
            const eventDate = new Date(event.event_date);
            const isPast = isBefore(eventDate, new Date());
            
            return (
              <div key={event.id} className="flex flex-col items-center group">
                {/* Connector Point */}
                <div className={`h-4 w-4 rounded-full border-2 bg-background flex items-center justify-center transition-all group-hover:scale-125 ${
                  isPast ? 'border-primary' : 'border-muted-foreground/30'
                }`}>
                  {getEventIcon(event.event_type)}
                </div>
                
                {/* Label Top */}
                <div className="absolute -top-6 text-center w-24 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-[9px] p-1 rounded shadow-sm border pointer-events-none">
                  {event.title}
                </div>
                
                {/* Label Bottom */}
                <div className="mt-2 text-center">
                  <p className="text-[10px] font-bold">
                    {format(eventDate, "MMM", { locale: ptBR }).toUpperCase()}
                  </p>
                  <p className="text-[9px] text-muted-foreground">
                    {format(eventDate, "yyyy")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-2 pt-4 border-t border-border/50">
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase font-semibold">Total de Marcos</p>
          <p className="text-xl font-bold">{lifeEvents.length}</p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[10px] text-muted-foreground uppercase font-semibold">Próximo Marco</p>
          <p className="text-xs font-bold text-primary">
            {sortedEvents.find(e => !isBefore(new Date(e.event_date), new Date()))?.title || 'Nenhum próximo'}
          </p>
        </div>
      </div>
    </div>
  );
}
