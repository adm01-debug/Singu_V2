import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SectionFrame } from './SectionFrame';
import { IntelBadge } from './IntelBadge';
import { IntelEmptyState } from './IntelEmptyState';
import { CalendarDays } from 'lucide-react';
import type { Entity360TimelineEvent } from '@/hooks/useEntity360';

interface EntityMonthlyTimelineProps {
  events: Entity360TimelineEvent[];
  onClose?: () => void;
}

interface MonthGroup {
  key: string;
  label: string;
  events: Entity360TimelineEvent[];
}

type KindFilter = 'all' | 'interaction' | 'deal' | 'event';
const FILTER_KEY = 'intel-timeline-filter-v1';

const FILTERS: { value: KindFilter; label: string }[] = [
  { value: 'all', label: 'ALL' },
  { value: 'interaction', label: 'INTERACTION' },
  { value: 'deal', label: 'DEAL' },
  { value: 'event', label: 'EVENT' },
];

function readFilter(): KindFilter {
  try {
    const raw = localStorage.getItem(FILTER_KEY);
    if (raw === 'interaction' || raw === 'deal' || raw === 'event' || raw === 'all') return raw;
  } catch { /* ignore */ }
  return 'all';
}

function matchesKind(kind: string, f: KindFilter): boolean {
  if (f === 'all') return true;
  const k = kind.toLowerCase();
  if (f === 'interaction') return k.includes('interac') || k.includes('call') || k.includes('email') || k.includes('whatsapp') || k.includes('meeting');
  if (f === 'deal') return k.includes('deal') || k.includes('opportunity') || k.includes('pipeline');
  if (f === 'event') return k.includes('event') || k.includes('intel') || k.includes('change') || k.includes('role') || k.includes('company');
  return true;
}

/**
 * Visualização vertical agrupada por mês (estilo "log temporal") para o Entity 360.
 * Renderiza interações + deals + eventos de people-intelligence numa faixa única.
 * Filtro por kind persistido em localStorage.
 */
export const EntityMonthlyTimeline = ({ events, onClose }: EntityMonthlyTimelineProps) => {
  const { user } = useAuth();
  const filterKey = `${FILTER_KEY}-${user?.id ?? 'anon'}`;
  const [filter, setFilter] = useState<KindFilter>('all');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(filterKey);
      if (raw === 'interaction' || raw === 'deal' || raw === 'event' || raw === 'all') setFilter(raw);
    } catch { /* ignore */ }
  }, [filterKey]);

  useEffect(() => {
    try { localStorage.setItem(filterKey, filter); } catch { /* ignore */ }
  }, [filter, filterKey]);

  const filtered = useMemo(
    () => events.filter((e) => matchesKind(e.kind, filter)),
    [events, filter]
  );

  const groups = useMemo<MonthGroup[]>(() => {
    const map = new Map<string, MonthGroup>();
    [...filtered]
      .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
      .forEach((ev) => {
        let date: Date;
        try {
          date = parseISO(ev.occurred_at);
          if (Number.isNaN(date.getTime())) date = new Date(ev.occurred_at);
        } catch {
          date = new Date();
        }
        const key = format(date, 'yyyy-MM');
        const label = format(date, "MMMM yyyy", { locale: ptBR }).toUpperCase();
        if (!map.has(key)) map.set(key, { key, label, events: [] });
        map.get(key)!.events.push(ev);
      });
    return Array.from(map.values());
  }, [filtered]);

  return (
    <SectionFrame
      title="TIMELINE_MENSAL"
      meta={`${filtered.length}/${events.length} EVENTS · ${groups.length} MESES`}
      cornerFrame
      actions={
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5" role="group" aria-label="Filtrar tipo de evento">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                aria-pressed={filter === f.value}
                className={`intel-mono text-[10px] px-1.5 py-0.5 border rounded-sm ${
                  filter === f.value
                    ? 'border-[hsl(var(--intel-accent))] text-[hsl(var(--intel-accent))] bg-[hsl(var(--intel-accent)/0.1)]'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="intel-mono text-[10px] text-muted-foreground hover:text-foreground ml-1"
              aria-label="Fechar timeline"
            >
              ✕ FECHAR
            </button>
          )}
        </div>
      }
    >
      {groups.length === 0 ? (
        <IntelEmptyState
          icon={CalendarDays}
          title="NO_EVENTS"
          description={
            filter === 'all'
              ? 'Sem eventos cronológicos para exibir nesta entidade.'
              : `Sem eventos do tipo ${filter.toUpperCase()} nesta entidade.`
          }
        />
      ) : (
        <ol className="relative pl-4 max-h-[520px] overflow-y-auto" aria-label="Linha do tempo">
          <span
            className="absolute left-1 top-0 bottom-0 w-px bg-[hsl(var(--intel-border))]"
            aria-hidden
          />
          {groups.map((g) => (
            <li key={g.key} className="mb-3">
              <div className="flex items-center gap-2 mb-2 sticky top-0 bg-[hsl(var(--intel-surface-1))] z-[1] py-1">
                <span
                  className="absolute -left-0.5 h-2 w-2 rounded-full bg-[hsl(var(--intel-accent))]"
                  aria-hidden
                />
                <span className="intel-eyebrow text-foreground">{g.label}</span>
                <span className="intel-mono text-[10px] text-muted-foreground">
                  [{g.events.length.toString().padStart(2, '0')}]
                </span>
              </div>
              <ul className="space-y-1.5">
                {g.events.map((ev) => {
                  let when = '—';
                  try {
                    when = format(parseISO(ev.occurred_at), 'dd/MM HH:mm');
                  } catch { /* ignore */ }
                  return (
                    <li
                      key={ev.id}
                      className="intel-card intel-card-hover px-2 py-1.5 text-xs flex gap-2"
                    >
                      <span className="intel-mono text-muted-foreground w-20 shrink-0">{when}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 flex-wrap">
                          <IntelBadge severity="info">{ev.kind}</IntelBadge>
                          <span className="text-foreground truncate">{ev.title}</span>
                        </div>
                        {ev.detail && (
                          <p className="text-muted-foreground truncate mt-0.5">{ev.detail}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </SectionFrame>
  );
};
