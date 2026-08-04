import { useMemo } from 'react';
import { format } from 'date-fns';
import { SectionFrame } from './SectionFrame';
import { IntelBadge } from './IntelBadge';
import { IntelEmptyState } from './IntelEmptyState';
import { Calendar } from 'lucide-react';

export interface InteractionLite {
  id: string;
  occurred_at: string;
  type: string;
  channel: string;
  contact_id?: string | null;
  company_id?: string | null;
}

interface CommonEventsTimelineProps {
  /** Interações já filtradas pelo IN(entityIds) — agrupadas por id de interação */
  interactions: Array<InteractionLite & { matchedIds: string[] }>;
  totalEntities: number;
}

/**
 * Lista cronológica de interações que envolvem TODAS as entidades selecionadas
 * (interseção real, calculada a partir de matchedIds vs totalEntities).
 */
export const CommonEventsTimeline = ({ interactions, totalEntities }: CommonEventsTimelineProps) => {
  const common = useMemo(
    () => interactions.filter((i) => i.matchedIds.length >= totalEntities),
    [interactions, totalEntities]
  );

  return (
    <SectionFrame title="COMMON_EVENTS_TIMELINE" meta={`${common.length} EVENTS`} count={common.length}>
      {common.length === 0 ? (
        <IntelEmptyState
          icon={Calendar}
          title="NO_COMMON_EVENTS"
          description="Nenhuma interação envolve todas as entidades selecionadas simultaneamente."
        />
      ) : (
        <ol className="space-y-1.5 max-h-[320px] overflow-y-auto">
          {common.map((ev) => (
            <li
              key={ev.id}
              className="flex items-start gap-2 text-xs border-l-2 border-[hsl(var(--intel-accent))] pl-2 py-1"
            >
              <span className="intel-mono text-muted-foreground w-24 shrink-0">
                {format(new Date(ev.occurred_at), 'dd/MM/yy HH:mm')}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <IntelBadge severity="info">{ev.type}</IntelBadge>
                <IntelBadge severity="info">{ev.channel}</IntelBadge>
                <span className="text-foreground intel-mono text-[10px]">
                  ×{ev.matchedIds.length}/{totalEntities}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </SectionFrame>
  );
};
