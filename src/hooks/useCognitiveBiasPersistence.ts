import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { BiasAnalysisResult, CognitiveBiasType, BiasCategory, DetectedBias } from '@/types/cognitive-biases';
import { Json } from '@/integrations/supabase/types';

interface BiasHistoryRecord {
  id: string;
  contactId: string;
  interactionId?: string;
  detectedBiases: DetectedBias[];
  categoryDistribution: Record<BiasCategory, number>;
  dominantBiases: CognitiveBiasType[];
  vulnerabilities: CognitiveBiasType[];
  resistances: CognitiveBiasType[];
  profileSummary?: string;
  analyzedAt: string;
  createdAt: string;
}

interface BiasEvolutionData {
  history: BiasHistoryRecord[];
  mostFrequentBiases: { bias: CognitiveBiasType; count: number }[];
  biasFrequencyOverTime: { date: string; count: number }[];
  dominantCategory: BiasCategory | null;
  categoryTrends: Record<BiasCategory, 'increasing' | 'stable' | 'decreasing'>;
}

// Helper to safely convert Json to array
const convertDetectedBiases = (json: Json | null): DetectedBias[] => {
  if (!json || !Array.isArray(json)) return [];
  return json as unknown as DetectedBias[];
};

const convertCategoryDistribution = (json: Json | null): Record<BiasCategory, number> => {
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return {
      decision_making: 0,
      social: 0,
      memory: 0,
      probability: 0,
      self_perception: 0
    };
  }
  return json as unknown as Record<BiasCategory, number>;
};

export function useCognitiveBiasPersistence(contactId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch bias history for a contact
  const { data: history, isLoading, error } = useQuery({
    queryKey: ['bias-history', contactId, user?.id],
    staleTime: 30 * 60_000,
    queryFn: async (): Promise<BiasHistoryRecord[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('cognitive_bias_history')
        .select('id, contact_id, interaction_id, detected_biases, category_distribution, dominant_biases, vulnerabilities, resistances, profile_summary, analyzed_at, created_at')
        .eq('contact_id', contactId)
        .eq('user_id', user.id)
        .order('analyzed_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data || []).map(record => ({
        id: record.id,
        contactId: record.contact_id,
        interactionId: record.interaction_id || undefined,
        detectedBiases: convertDetectedBiases(record.detected_biases),
        categoryDistribution: convertCategoryDistribution(record.category_distribution),
        dominantBiases: (record.dominant_biases || []) as CognitiveBiasType[],
        vulnerabilities: (record.vulnerabilities || []) as CognitiveBiasType[],
        resistances: (record.resistances || []) as CognitiveBiasType[],
        profileSummary: record.profile_summary || undefined,
        analyzedAt: record.analyzed_at,
        createdAt: record.created_at
      }));
    },
    enabled: !!user?.id && !!contactId
  });

  // Save bias analysis result
  const saveAnalysisMutation = useMutation({
    mutationFn: async (analysis: BiasAnalysisResult & { interactionId?: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('cognitive_bias_history')
        .insert({
          user_id: user.id,
          contact_id: contactId,
          interaction_id: analysis.interactionId || null,
          detected_biases: analysis.detectedBiases as unknown as Json,
          category_distribution: analysis.biasProfile.categoryDistribution as unknown as Json,
          dominant_biases: analysis.biasProfile.dominantBiases,
          vulnerabilities: analysis.vulnerabilities.map(v => v.bias),
          resistances: analysis.resistances.map(r => r.bias),
          sales_strategies: analysis.salesStrategies as unknown as Json,
          profile_summary: analysis.profileSummary
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Falha ao salvar análise de viés');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bias-history', contactId, user?.id] });
    },
    onError: () => toast.error('Erro ao salvar análise de viés cognitivo'),
  });

  // Calculate evolution data
  const getEvolutionData = (): BiasEvolutionData | null => {
    if (!history || history.length === 0) return null;

    // Count bias frequency across all history
    const biasCount: Record<string, number> = {};
    history.forEach(record => {
      record.dominantBiases.forEach(bias => {
        biasCount[bias] = (biasCount[bias] || 0) + 1;
      });
    });

    const mostFrequentBiases = Object.entries(biasCount)
      .map(([bias, count]) => ({ bias: bias as CognitiveBiasType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate bias frequency over time
    const biasFrequencyOverTime = history
      .slice(0, 10)
      .reverse()
      .map(record => ({
        date: new Date(record.analyzedAt).toLocaleDateString('pt-BR'),
        count: record.detectedBiases.length
      }));

    // Find dominant category
    const categoryCount: Record<string, number> = {};
    history.forEach(record => {
      Object.entries(record.categoryDistribution).forEach(([category, count]) => {
        categoryCount[category] = (categoryCount[category] || 0) + count;
      });
    });

    const dominantCategory = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])[0]?.[0] as BiasCategory | null;

    // Calculate category trends
    const categories: BiasCategory[] = ['decision_making', 'social', 'memory', 'probability', 'self_perception'];
    const categoryTrends = categories.reduce((acc, category) => {
      acc[category] = 'stable';
      return acc;
    }, {} as Record<BiasCategory, 'increasing' | 'stable' | 'decreasing'>);

    categories.forEach(category => {
      if (history.length >= 2) {
        const recentCount = history.slice(0, Math.min(3, history.length))
          .reduce((sum, r) => sum + (r.categoryDistribution[category] || 0), 0);
        const olderCount = history.slice(Math.min(3, history.length))
          .reduce((sum, r) => sum + (r.categoryDistribution[category] || 0), 0);
        
        const avgRecent = recentCount / Math.min(3, history.length);
        const avgOlder = olderCount / Math.max(1, history.length - 3);
        
        if (avgRecent > avgOlder + 1) categoryTrends[category] = 'increasing';
        else if (avgRecent < avgOlder - 1) categoryTrends[category] = 'decreasing';
        else categoryTrends[category] = 'stable';
      } else {
        categoryTrends[category] = 'stable';
      }
    });

    return {
      history,
      mostFrequentBiases,
      biasFrequencyOverTime,
      dominantCategory,
      categoryTrends
    };
  };

  return {
    history: history || [],
    isLoading,
    error,
    saveAnalysis: saveAnalysisMutation.mutate,
    isSaving: saveAnalysisMutation.isPending,
    evolutionData: getEvolutionData()
  };
}
