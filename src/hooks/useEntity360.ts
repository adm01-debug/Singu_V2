import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';
import { supabase } from '@/integrations/supabase/client';

export type Entity360Type = 'contact' | 'company' | 'deal';

export interface Entity360TimelineEvent {
  id: string;
  occurred_at: string;
  kind: string;
  title: string;
  detail?: string;
}

export interface Entity360Related {
  id: string;
  type: Entity360Type | string;
  name: string;
  meta?: string;
}

export interface Entity360Result {
  type: Entity360Type;
  id: string;
  metadata: Record<string, unknown>;
  timeline: Entity360TimelineEvent[];
  related: Entity360Related[];
}

const tableMap: Record<Entity360Type, string> = {
  contact: 'contacts',
  company: 'companies',
  deal: 'deals',
};

async function fetchPeopleIntel(contactId: string): Promise<Entity360TimelineEvent[]> {
  try {
    const { data } = await supabase
      .from('people_intelligence_events')
      .select('id, event_type, field_name, old_value, new_value, detected_at')
      .eq('contact_id', contactId)
      .order('detected_at', { ascending: false })
      .limit(20);
    return (data || []).map((e) => {
      const change = e.old_value && e.new_value
        ? `${e.field_name || 'campo'}: "${e.old_value}" → "${e.new_value}"`
        : e.new_value
          ? `${e.field_name || 'campo'}: "${e.new_value}"`
          : 'Evento de inteligência';
      return {
        id: String(e.id),
        occurred_at: String(e.detected_at),
        kind: String(e.event_type || 'INTEL').toUpperCase().slice(0, 12),
        title: change,
      };
    });
  } catch {
    return [];
  }
}

async function fetchRelatives(contactId: string): Promise<Entity360Related[]> {
  try {
    const { data } = await supabase
      .from('contact_relatives')
      .select('id, name, relationship_type, occupation')
      .eq('contact_id', contactId)
      .limit(10);
    return (data || []).map((r) => ({
      id: String(r.id),
      type: 'RELATIVE',
      name: String(r.name || 'Sem nome'),
      meta: r.relationship_type ? String(r.relationship_type) : undefined,
    }));
  } catch {
    return [];
  }
}

export function useEntity360(type: Entity360Type | null, id: string | null) {
  return useQuery({
    queryKey: ['entity-360', type, id],
    enabled: !!type && !!id,
    staleTime: 2 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<Entity360Result | null> => {
      if (!type || !id) return null;
      const table = tableMap[type];

      const { data: rows } = await queryExternalData<Record<string, unknown>>({
        table,
        select: '*',
        filters: [{ type: 'eq', column: 'id', value: id }],
        range: { from: 0, to: 0 },
      });
      const meta = rows?.[0] || {};

      const timeline: Entity360TimelineEvent[] = [];
      const related: Entity360Related[] = [];

      if (type === 'contact') {
        const [{ data: ints }, intel, relatives] = await Promise.all([
          queryExternalData<Record<string, unknown>>({
            table: 'interactions',
            select: 'id, type, channel, content, occurred_at',
            filters: [{ type: 'eq', column: 'contact_id', value: id }],
            order: { column: 'occurred_at', ascending: false },
            range: { from: 0, to: 49 },
          }),
          fetchPeopleIntel(id),
          fetchRelatives(id),
        ]);

        (ints || []).forEach((i) => {
          timeline.push({
            id: String(i.id),
            occurred_at: String(i.occurred_at),
            kind: String(i.channel || i.type || 'INT').toUpperCase().slice(0, 12),
            title: String(i.type || 'Interação'),
            detail: typeof i.content === 'string' ? i.content.slice(0, 160) : undefined,
          });
        });
        timeline.push(...intel);
        related.push(...relatives);

        if (meta.company_id) {
          const { data: comp } = await queryExternalData<Record<string, unknown>>({
            table: 'companies',
            select: 'id, name, industry',
            filters: [{ type: 'eq', column: 'id', value: meta.company_id }],
            range: { from: 0, to: 0 },
          });
          if (comp?.[0]) {
            related.push({
              id: String(comp[0].id),
              type: 'company',
              name: String(comp[0].name),
              meta: comp[0].industry ? String(comp[0].industry) : undefined,
            });
          }
        }
      }

      if (type === 'company') {
        const [{ data: contacts }, { data: deals }] = await Promise.all([
          queryExternalData<Record<string, unknown>>({
            table: 'contacts',
            select: 'id, full_name, role',
            filters: [{ type: 'eq', column: 'company_id', value: id }],
            range: { from: 0, to: 19 },
          }),
          queryExternalData<Record<string, unknown>>({
            table: 'deals',
            select: 'id, title, stage, value, created_at',
            filters: [{ type: 'eq', column: 'company_id', value: id }],
            order: { column: 'created_at', ascending: false },
            range: { from: 0, to: 19 },
          }),
        ]);
        (contacts || []).forEach((c) => {
          related.push({
            id: String(c.id),
            type: 'contact',
            name: String(c.full_name || 'Sem nome'),
            meta: c.role ? String(c.role) : undefined,
          });
        });
        (deals || []).forEach((d) => {
          related.push({
            id: String(d.id),
            type: 'deal',
            name: String(d.title || 'Sem título'),
            meta: d.stage ? String(d.stage) : undefined,
          });
          timeline.push({
            id: `deal-${d.id}`,
            occurred_at: String(d.created_at || new Date().toISOString()),
            kind: 'DEAL',
            title: String(d.title || 'Deal'),
            detail: `Estágio: ${d.stage || '—'} · R$ ${Number(d.value || 0).toLocaleString('pt-BR')}`,
          });
        });
      }

      if (type === 'deal') {
        if (meta.contact_id) {
          const { data: ct } = await queryExternalData<Record<string, unknown>>({
            table: 'contacts',
            select: 'id, full_name, role',
            filters: [{ type: 'eq', column: 'id', value: meta.contact_id }],
            range: { from: 0, to: 0 },
          });
          if (ct?.[0]) {
            related.push({
              id: String(ct[0].id),
              type: 'contact',
              name: String(ct[0].full_name || 'Sem nome'),
              meta: ct[0].role ? String(ct[0].role) : undefined,
            });
          }
        }
        if (meta.company_id) {
          const { data: cp } = await queryExternalData<Record<string, unknown>>({
            table: 'companies',
            select: 'id, name',
            filters: [{ type: 'eq', column: 'id', value: meta.company_id }],
            range: { from: 0, to: 0 },
          });
          if (cp?.[0]) {
            related.push({ id: String(cp[0].id), type: 'company', name: String(cp[0].name) });
          }
        }
      }

      timeline.sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));

      return { type, id, metadata: meta, timeline, related };
    },
  });
}
