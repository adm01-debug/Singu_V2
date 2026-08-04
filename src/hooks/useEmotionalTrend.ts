import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface EmotionalTrend {
  contact_id: string;
  contact_name: string;
  email: string | null;
  company_name: string | null;
  trend_direction: string | null;
  trend_strength: number | null;
  dominant_emotion: string | null;
  avg_sentiment_score: number | null;
  emotion_distribution: unknown;
  positive_interactions: number | null;
  neutral_interactions: number | null;
  negative_interactions: number | null;
  total_interactions: number | null;
  period_start: string | null;
  period_end: string | null;
  patterns_identified: string[] | null;
  triggers_positive: string[] | null;
  triggers_negative: string[] | null;
  trend_status: string | null;
  alert_message: string | null;
  recommended_actions: string[] | null;
}

export function useEmotionalTrend(contactId: string | undefined) {
  return useQuery({
    queryKey: ['emotional-trend', contactId],
    queryFn: async () => {
      if (!contactId) return null;
      const { data, error } = await queryExternalData<EmotionalTrend>({
        table: 'vw_emotional_trend_by_contact',
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
