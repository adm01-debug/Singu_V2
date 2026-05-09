import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

/**
 * Extended interaction data from the external DB view vw_interaction_timeline.
 * Contains fields not present in the local interactions table:
 * channel, direction, assunto, resumo, duracao_segundos, etc.
 */
export interface ExternalInteraction {
  id: string;
  company_id: string | null;
  contact_id: string;
  channel: string | null;
  direction: string | null;
  status: string | null;
  assunto: string | null;
  resumo: string | null;
  data_interacao: string | null;
  duracao_segundos: number | null;
  audio_url: string | null;
  transcription: string | null;
  created_at: string;
  contato_nome: string | null;
  contato_email: string | null;
  contato_phone: string | null;
  empresa_nome: string | null;
  empresa_razao_social: string | null;
  empresa_cnpj: string | null;
}

interface Options {
  days?: number;
  channels?: string[];
}

export function useExternalInteractions(
  contactId: string | undefined,
  limit = 50,
  options: Options = {},
) {
  const { days, channels } = options;
  const normalizedChannels = Array.isArray(channels)
    ? [...channels].map((c) => c.toLowerCase()).sort()
    : [];

  return useQuery({
    queryKey: ['external-interactions', contactId, limit, days ?? null, normalizedChannels],
    queryFn: async () => {
      if (!contactId) return [];

      const filters: Array<{
        type: 'eq' | 'ilike' | 'in' | 'neq' | 'is';
        column: string;
        value: unknown;
      }> = [{ type: 'eq', column: 'contact_id', value: contactId }];

      if (normalizedChannels.length > 0) {
        filters.push({ type: 'in', column: 'channel', value: normalizedChannels });
      }

      const { data, error } = await queryExternalData<ExternalInteraction>({
        table: 'vw_interaction_timeline',
        filters,
        order: { column: 'data_interacao', ascending: false },
        range: { from: 0, to: limit - 1 },
      });
      if (error) throw error;
      const list = Array.isArray(data) ? data : [];
      if (typeof days === 'number' && days > 0) {
        const sinceMs = Date.now() - days * 24 * 60 * 60 * 1000;
        return list.filter((it) => {
          const ref = it.data_interacao || it.created_at;
          if (!ref) return false;
          const t = new Date(ref).getTime();
          return Number.isFinite(t) && t >= sinceMs;
        });
      }
      return list;
    },
    enabled: !!contactId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
