import { useMemo } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Phone, Mail, MessageSquare, Video, Calendar, Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Interaction } from '@/hooks/useContactDetail';

interface TimelineEvent {
  id: string;
  date: Date;
  type: 'interaction' | 'score_change' | 'stage_change' | 'life_event' | 'insight';
  title: string;
  description?: string;
  icon: React.ElementType;
  color: string;
  metadata?: Record<string, unknown>;
}

interface RelationshipTimelineProps {
  interactions: Interaction[];
  contact: {
    relationship_score?: number | null;
    relationship_stage?: string | null;
    created_at: string;
  };
  className?: string;
}

const interactionIcons: Record<string, React.ElementType> = {
  call: Phone,
  email: Mail,
  whatsapp: MessageSquare,
  meeting: Video,
  note: MessageSquare,
};

const interactionColors: Record<string, string> = {
  call: 'bg-success/15 text-success ring-success/20',
  email: 'bg-info/15 text-info ring-info/20',
  whatsapp: 'bg-success/15 text-success ring-success/20',
  meeting: 'bg-accent/15 text-accent ring-accent/20',
  note: 'bg-muted text-muted-foreground ring-border',
};

export function RelationshipTimeline({ interactions, contact, className }: RelationshipTimelineProps) {
  const events = useMemo<TimelineEvent[]>(() => {
    const items: TimelineEvent[] = [];

    // Add interactions
    interactions.forEach(interaction => {
      const Icon = interactionIcons[interaction.type] || MessageSquare;
      const color = interactionColors[interaction.type] || interactionColors.note;
      items.push({
        id: `int-${interaction.id}`,
        date: new Date(interaction.created_at),
        type: 'interaction',
        title: interaction.title,
        description: interaction.content?.slice(0, 120) || undefined,
        icon: Icon,
        color,
        metadata: {
          sentiment: interaction.sentiment,
          type: interaction.type,
          followUp: interaction.follow_up_required,
        },
      });
    });

    // Add contact creation
    items.push({
      id: 'created',
      date: new Date(contact.created_at),
      type: 'life_event',
      title: 'Contato criado',
      description: 'Início do relacionamento',
      icon: Star,
      color: 'bg-primary/15 text-primary ring-primary/20',
    });

    // Sort by date descending
    return items.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [interactions, contact.created_at]);

  // Group events by month
  const groupedEvents = useMemo(() => {
    const groups: Record<string, TimelineEvent[]> = {};
    events.forEach(event => {
      const key = format(event.date, 'MMMM yyyy', { locale: ptBR });
      if (!groups[key]) groups[key] = [];
      groups[key].push(event);
    });
    return groups;
  }, [events]);

  const sentimentBadge = (sentiment: string | undefined) => {
    if (!sentiment) return null;
    const config: Record<string, { label: string; className: string }> = {
      positive: { label: 'Positivo', className: 'bg-success/10 text-success border-success/20' },
      neutral: { label: 'Neutro', className: 'bg-muted text-muted-foreground border-border' },
      negative: { label: 'Negativo', className: 'bg-destructive/10 text-destructive border-destructive/20' },
    };
    const c = config[sentiment];
    if (!c) return null;
    return <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', c.className)}>{c.label}</Badge>;
  };

  if (events.length <= 1) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Timeline do Relacionamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Registre interações para visualizar a timeline.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Timeline do Relacionamento
          <Badge variant="secondary" className="text-[10px] ml-auto">
            {events.length} eventos
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[500px] pr-2">
          <div className="space-y-6">
            {Object.entries(groupedEvents).map(([month, monthEvents]) => (
              <div key={month}>
                <div className="sticky top-0 bg-card z-10 pb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider capitalize">
                    {month}
                  </span>
                </div>
                <div className="relative ml-3 border-l-2 border-border/50 pl-6 space-y-4">
                  {monthEvents.map((event) => {
                    const Icon = event.icon;
                    return (
                      <div key={event.id} className="relative group">
                        {/* Timeline dot */}
                        <div className={cn(
                          'absolute -left-[31px] top-1 w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-card',
                          event.color
                        )}>
                          <Icon className="w-2.5 h-2.5" />
                        </div>

                        {/* Content */}
                        <div className="rounded-lg border border-border/50 p-3 hover:border-border hover:bg-muted/30 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-foreground leading-tight">
                              {event.title}
                            </p>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                              {formatDistanceToNow(event.date, { locale: ptBR, addSuffix: true })}
                            </span>
                          </div>
                          {event.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {event.description}
                            </p>
                          )}
                          {event.metadata?.sentiment && (
                            <div className="mt-2 flex items-center gap-1.5">
                              {sentimentBadge(event.metadata.sentiment as string)}
                              {event.metadata.followUp && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-warning/10 text-warning border-warning/20">
                                  Follow-up
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
