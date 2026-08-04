import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface EmotionalTrendEntry {
  contact_id?: string;
  user_id?: string;
  full_name?: string;
  current_state?: string;
  trend_direction?: string;
  confidence?: number;
  last_analyzed_at?: string;
  positive_count?: number;
  neutral_count?: number;
  negative_count?: number;
  dominant_emotion?: string;
}

export function useEmotionalTrendList() {
  return useQuery({
    queryKey: ['emotional-trend-list'],
    queryFn: async () => {
      const { data, error } = await queryExternalData<EmotionalTrendEntry>({
        table: 'vw_singu_emotional_trend',
        range: { from: 0, to: 99 },
      });
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useEmotionalTrendByContact(contactId?: string) {
  return useQuery({
    queryKey: ['emotional-trend-singu', contactId],
    queryFn: async () => {
      if (!contactId) return null;
      const { data, error } = await queryExternalData<EmotionalTrendEntry>({
        table: 'vw_singu_emotional_trend',
        filters: [{ type: 'eq', column: 'contact_id', value: contactId }],
        range: { from: 0, to: 0 },
      });
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!contactId,
    staleTime: 10 * 60 * 1000,
  });
}
