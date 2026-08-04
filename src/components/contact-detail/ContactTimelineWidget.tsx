import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useContactTimeline, type TimelineEvent } from '@/hooks/useContactTimeline';
import { Clock, MessageSquare, Phone, Mail, Users, Star, TrendingUp, FileText, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const eventIcons: Record<string, typeof Clock> = {
  interaction: MessageSquare, call: Phone, email: Mail, meeting: Users,
  deal: TrendingUp, note: FileText, milestone: Star, alert: Zap,
};
const eventColors: Record<string, string> = {
  interaction: 'bg-primary/10 text-primary border-primary/20',
  call: 'bg-info/10 text-info border-info/20',
  email: 'bg-primary/10 text-primary border-primary/20',
  meeting: 'bg-warning/10 text-warning border-warning/20',
  deal: 'bg-success/10 text-success border-success/20',
  note: 'bg-muted text-muted-foreground border-border',
  milestone: 'bg-warning/10 text-warning border-warning/20',
  alert: 'bg-destructive/10 text-destructive border-destructive/20',
};

export const ContactTimelineWidget = React.memo(function ContactTimelineWidget({ contactId }: { contactId: string }) {
  const { data: events, isLoading } = useContactTimeline(contactId);

  if (isLoading) return <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Linha do Tempo</CardTitle></CardHeader><CardContent><Skeleton className="h-48" /></CardContent></Card>;
  if (!events || events.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />Linha do Tempo
          <Badge variant="outline" className="text-[10px] ml-auto">{events.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-0 max-h-[400px] overflow-y-auto">
          <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
          {events.map((event: TimelineEvent, idx: number) => {
            const Icon = eventIcons[event.event_type] || Clock;
            const colorClass = eventColors[event.event_type] || eventColors.note;
            return (
              <div key={event.id ?? `${event.event_type}-${event.event_date}-${idx}`} className="relative flex gap-3 py-2.5 pl-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 border ${colorClass}`}><Icon className="h-3.5 w-3.5" /></div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">{event.title}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0">{format(new Date(event.event_date), "dd/MM HH:mm", { locale: ptBR })}</span>
                  </div>
                  {event.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{event.description}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});

export default ContactTimelineWidget;
