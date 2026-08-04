import { Gift, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { InlineEmptyState } from '@/components/ui/empty-state';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

interface LifeEventsSectionProps {
  lifeEvents: Tables<'life_events'>[];
}

export function LifeEventsSection({ lifeEvents }: LifeEventsSectionProps) {
  return (
    <CollapsibleSection
      title="Eventos de Vida"
      icon={Gift}
      iconColor="text-success"
      badge={lifeEvents.length}
      defaultOpen={lifeEvents.length > 0}
      className="md:col-span-2 lg:col-span-3"
    >
      {lifeEvents.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {lifeEvents.map((event) => (
            <div key={event.id} className="flex items-start gap-2 rounded-lg border p-2.5 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium text-foreground">{event.title}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(event.event_date), "dd/MM/yyyy")} · {event.event_type}
                  {event.recurring && ' · Recorrente'}
                </p>
                {event.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{event.description}</p>
                )}
                {event.reminder_days_before != null && (
                  <Badge variant="outline" className="text-[10px] mt-1">
                    Lembrete: {event.reminder_days_before}d antes
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <InlineEmptyState icon={Calendar} title="Nenhum evento de vida" description="Registre aniversários, promoções ou marcos importantes" />
      )}
    </CollapsibleSection>
  );
}
