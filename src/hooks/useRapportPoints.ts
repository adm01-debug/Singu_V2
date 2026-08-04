import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface RapportPoints {
  contact_id: string;
  contact_name: string;
  company_name: string | null;
  pace: string | null;
  tone: string | null;
  detail_preference: string | null;
  decision_style: string | null;
  prefers_data: boolean | null;
  prefers_stories: boolean | null;
  prefers_visuals: boolean | null;
  frequent_words: string[] | null;
  mirroring_tips: string[] | null;
  shared_interests: string[] | null;
  rapport_score: number | null;
  rapport_level: string | null;
  improvement_suggestions: string[] | null;
  rapport_status: string | null;
}

export function useRapportPoints(contactId: string | undefined) {
  return useQuery({
    queryKey: ['rapport-points', contactId],
    queryFn: async () => {
      if (!contactId) return null;
      const { data, error } = await queryExternalData<RapportPoints>({
        table: 'vw_rapport_points',
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
