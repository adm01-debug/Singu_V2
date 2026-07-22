import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';
import { useAuth } from './useAuth';

export interface RelationshipScoreEntry {
  id: string;
  user_id: string;
  contact_id: string;
  score: number;
  engagement_score: number | null;
  sentiment_score: number | null;
  responsiveness_score: number | null;
  frequency_score: number | null;
  recency_score: number | null;
  depth_score: number | null;
  factors: unknown;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useRelationshipScoreHistory(contactId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['relationship-score-history', contactId, user?.id],
    queryFn: async () => {
      if (!contactId) return [];
      const { data, error } = await queryExternalData<RelationshipScoreEntry>({
        table: 'relationship_score_history',
        filters: [
          { type: 'eq', column: 'contact_id', value: contactId },
          { type: 'eq', column: 'user_id', value: user?.id },
        ],
        order: { column: 'created_at', ascending: true },
        range: { from: 0, to: 99 },
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!contactId && !!user,
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
}
