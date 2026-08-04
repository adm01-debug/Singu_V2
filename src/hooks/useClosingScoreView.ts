import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface ClosingScoreView {
  contact_id: string;
  contact_name: string;
  email: string | null;
  company_name: string | null;
  segment: string | null;
  owner_name: string | null;
  closing_score: number | null;
  score_date: string | null;
  ranking_geral: number | null;
  ranking_segmento: number | null;
  interactions_30d: number | null;
  last_interaction: string | null;
  disc_type: string | null;
  visual_score: number | null;
  auditory_score: number | null;
  kinesthetic_score: number | null;
}

export function useClosingScoreView(contactId: string | undefined) {
  return useQuery({
    queryKey: ['closing-score-view', contactId],
    queryFn: async () => {
      if (!contactId) return null;
      const { data, error } = await queryExternalData<ClosingScoreView>({
        table: 'vw_closing_score_ranking',
        filters: [{ type: 'eq', column: 'contact_id', value: contactId }],
        range: { from: 0, to: 0 },
      });
      if (error) throw error;
      return data?.[0] ?? null;
    },
    enabled: !!contactId,
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
}
