import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useVAKAnalysis } from './useVAKAnalysis';
import { useMetaprogramAnalysis } from './useMetaprogramAnalysis';

export function useFicha360NLP(contactId?: string) {
  const { user } = useAuth();
  const { getContactVAKProfile } = useVAKAnalysis();
  const { getContactMetaprogramProfile } = useMetaprogramAnalysis();

  const { data: vakProfile, isLoading: loadingVak, refetch: refetchVak } = useQuery({
    queryKey: ['vak-profile', contactId],
    queryFn: () => contactId ? getContactVAKProfile(contactId) : null,
    enabled: !!user && !!contactId,
  });

  const { data: metaprogramProfile, isLoading: loadingMetaprograms, refetch: refetchMetaprograms } = useQuery({
    queryKey: ['metaprogram-profile', contactId],
    queryFn: () => contactId ? getContactMetaprogramProfile(contactId) : null,
    enabled: !!user && !!contactId,
  });

  const { data: latestReframings = [], isLoading: loadingReframings } = useQuery({
    queryKey: ['latest-reframings', contactId],
    queryFn: async () => {
      if (!contactId) return [];
      const { data, error } = await supabase
        .from('reframing_analysis')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!contactId,
  });

  return {
    vakProfile,
    metaprogramProfile,
    latestReframings,
    isLoading: loadingVak || loadingMetaprograms || loadingReframings,
    refetch: () => {
      refetchVak();
      refetchMetaprograms();
    }
  };
}
