import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';

export type GroupBy = 'company' | 'contact';

export interface TimelineEventItem {
   id: string;
   type: string;
   title: string;
   content: string | null;
   created_at: string;
   sentiment: string | null;
   follow_up_required: boolean | null;
   transcription?: string | null;
   transcription_metadata?: Record<string, unknown> | null;
}

export interface TimelineGroup {
  entity_id: string;
  entity_name: string;
  entity_type: GroupBy;
  events: TimelineEventItem[];
  last_event_at: string;
}

export interface UseTimelineByEntityParams {
  groupBy: GroupBy;
  dateFrom?: Date;
  dateTo?: Date;
  channels?: string[];
}

type InteractionRow = Tables<'interactions'>;

export function useTimelineByEntity(params: UseTimelineByEntityParams) {
  const { groupBy, dateFrom, dateTo, channels } = params;
  const { user } = useAuth();

  return useQuery({
    queryKey: [
      'timeline-by-entity',
      groupBy,
      dateFrom?.toISOString() ?? null,
      dateTo?.toISOString() ?? null,
      channels?.slice().sort().join(',') ?? '',
      user?.id,
    ],
    enabled: !!user,
    queryFn: async (): Promise<TimelineGroup[]> => {
      if (!user) return [];
      // Build base query (client-side fallback — sempre funciona)
      let query = supabase
        .from('interactions')
        .select('id, type, title, content, created_at, sentiment, follow_up_required, contact_id, company_id, transcription, transcription_metadata')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(500);

      if (dateFrom) query = query.gte('created_at', dateFrom.toISOString());
      if (dateTo) query = query.lte('created_at', dateTo.toISOString());
      if (Array.isArray(channels) && channels.length > 0) query = query.in('type', channels);

      const { data: interactions, error } = await query;
      if (error) throw error;
      if (!Array.isArray(interactions) || interactions.length === 0) return [];

      // Coletar IDs únicos para resolver nomes
      const entityIds = new Set<string>();
      for (const it of interactions) {
        const id = groupBy === 'company' ? it.company_id : it.contact_id;
        if (id) entityIds.add(id);
      }

      const idList = Array.from(entityIds);
      const nameMap = new Map<string, string>();

      if (idList.length > 0) {
        if (groupBy === 'company') {
          const { data: companies } = await supabase
            .from('companies')
            .select('id, name, nome_fantasia')
            .in('id', idList)
            .limit(500);
          if (Array.isArray(companies)) {
            for (const c of companies) {
              nameMap.set(c.id, c.nome_fantasia || c.name || 'Empresa sem nome');
            }
          }
        } else {
          const { data: contacts } = await supabase
            .from('contacts')
            .select('id, first_name, last_name')
            .in('id', idList)
            .limit(500);
          if (Array.isArray(contacts)) {
            for (const c of contacts) {
              const fullName = `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim();
              nameMap.set(c.id, fullName || 'Contato sem nome');
            }
          }
        }
      }

      // Agrupar
      const groupsMap = new Map<string, TimelineGroup>();
      for (const it of interactions as InteractionRow[]) {
        const entityId = groupBy === 'company' ? it.company_id : it.contact_id;
        if (!entityId) continue;
        const existing = groupsMap.get(entityId);
         const event: TimelineEventItem = {
           id: it.id,
           type: it.type,
           title: it.title,
           content: it.content,
           created_at: it.created_at,
           sentiment: it.sentiment,
           follow_up_required: it.follow_up_required,
           transcription: it.transcription,
           transcription_metadata: (it.transcription_metadata ?? null) as Record<string, unknown> | null,
         };
        if (existing) {
          existing.events.push(event);
          if (it.created_at > existing.last_event_at) existing.last_event_at = it.created_at;
        } else {
          groupsMap.set(entityId, {
            entity_id: entityId,
            entity_name: nameMap.get(entityId) || (groupBy === 'company' ? 'Empresa' : 'Contato'),
            entity_type: groupBy,
            events: [event],
            last_event_at: it.created_at,
          });
        }
      }

      // Ordenar grupos por última atividade desc
      return Array.from(groupsMap.values()).sort((a, b) =>
        b.last_event_at.localeCompare(a.last_event_at)
      );
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    gcTime: 10 * 60 * 1000,
  });
}
