import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type ProbabilityFilter = 'all' | 'high' | 'medium' | 'low' | 'very_low';
export type PeriodFilter = '7d' | '30d' | '90d' | 'all';

interface RankingItem {
  contact: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  score: number;
  probability: 'high' | 'medium' | 'low' | 'very_low';
  trend: 'up' | 'down' | 'stable';
  interactionCount: number;
  lastInteractionDays: number | null;
  topStrength: string;
  mainWeakness: string;
  nextAction: string;
}

function getScoreProbability(score: number): 'high' | 'medium' | 'low' | 'very_low' {
  if (score >= 70) return 'high';
  if (score >= 45) return 'medium';
  if (score >= 20) return 'low';
  return 'very_low';
}

export function useClosingScoreRanking(probabilityFilter: ProbabilityFilter = 'all', _periodFilter: PeriodFilter = '30d') {
  const { user } = useAuth();

  // probabilityFilter excluded from queryKey — filtering is pure client-side derivation.
  // All filter values are served from a single cached response.
  const { data, isLoading: loading, refetch, isFetching: refreshing } = useQuery({
    queryKey: ['closing-score-ranking', user?.id],
    queryFn: async () => {
      if (!user) return { rankings: [], stats: defaultStats() };

      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, avatar_url, relationship_score, sentiment')
        .eq('user_id', user.id)
        .not('relationship_score', 'is', null)
        .order('relationship_score', { ascending: false })
        .limit(50);

      if (!contacts || contacts.length === 0) return { rankings: [], stats: defaultStats() };

      const rankings: RankingItem[] = contacts.map(c => {
        const score = c.relationship_score || 0;
        const probability = getScoreProbability(score);
        return {
          contact: { id: c.id, first_name: c.first_name, last_name: c.last_name, avatar_url: c.avatar_url },
          score,
          probability,
          trend: 'stable' as const,
          interactionCount: 0,
          lastInteractionDays: null,
          topStrength: c.sentiment === 'positive' ? 'Sentimento positivo' : 'Engajamento ativo',
          mainWeakness: 'Nenhuma',
          nextAction: score >= 70 ? 'Momento de fechar' : 'Aumentar engajamento',
        };
      });

      const stats = {
        totalContacts: rankings.length,
        averageScore: Math.round(rankings.reduce((s, r) => s + r.score, 0) / (rankings.length || 1)),
        highProbability: rankings.filter(r => r.probability === 'high').length,
        mediumProbability: rankings.filter(r => r.probability === 'medium').length,
        lowProbability: rankings.filter(r => r.probability === 'low').length,
        veryLowProbability: rankings.filter(r => r.probability === 'very_low').length,
      };

      return { rankings, stats };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const filteredRankings = useMemo(() => {
    const all = data?.rankings ?? [];
    return probabilityFilter === 'all' ? all : all.filter(r => r.probability === probabilityFilter);
  }, [data?.rankings, probabilityFilter]);

  return {
    rankings: filteredRankings,
    loading,
    refreshing,
    stats: data?.stats || defaultStats(),
    refresh: () => { refetch(); },
  };
}

function defaultStats() {
  return { totalContacts: 0, averageScore: 0, highProbability: 0, mediumProbability: 0, lowProbability: 0, veryLowProbability: 0 };
}
