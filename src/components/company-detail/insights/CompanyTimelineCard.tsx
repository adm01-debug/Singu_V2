import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const eventTypeIcons: Record<string, string> = {
  interaction: '💬',
  deal: '💰',
  meeting: '📅',
  task: '✅',
  proposal: '📄',
  contact: '👤',
  alert: '⚠️',
};

interface TimelineEvent {
  event_type: string;
  title: string;
  description?: string;
  event_date: string;
}

export function CompanyTimelineCard({ timeline }: { timeline: TimelineEvent[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <span className="flex items-center gap-2"><Activity className="h-4 w-4" /> Timeline</span>
          <Badge variant="outline" className="text-[10px]">{timeline.length}</Badge>
        </CardTitle>
        <CardDescription className="text-xs">Eventos recentes da empresa</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-0 max-h-80 overflow-y-auto">
          <div className="absolute left-3.5 top-2 bottom-2 w-px bg-border" />
          
          {timeline.map((event, i) => (
            <div key={`${event.event_date}-${i}`} className="relative pl-9 pb-4">
              <div className="absolute left-2 top-1.5 w-3 h-3 rounded-full border-2 border-primary bg-card z-10" />
              
              <div className="p-2 rounded-md hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{eventTypeIcons[event.event_type] || '📌'}</span>
                  <span className="text-sm font-medium truncate">{event.title}</span>
                </div>
                {event.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{event.description}</p>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">
                  {format(new Date(event.event_date), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
