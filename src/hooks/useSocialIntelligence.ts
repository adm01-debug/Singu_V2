import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useSocialIntelligence(contactId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading: loading } = useQuery({
    queryKey: ['social-intelligence', contactId, user?.id],
    queryFn: async () => {
      const [profRes, behavRes, eventsRes] = await Promise.all([
        supabase.from('social_profiles').select('*').eq('contact_id', contactId).order('updated_at', { ascending: false }),
        supabase.from('social_behavior_analysis').select('*').eq('contact_id', contactId).order('analysis_date', { ascending: false }).limit(1),
        supabase.from('social_life_events').select('*').eq('contact_id', contactId).eq('dismissed', false).order('created_at', { ascending: false }).limit(20),
      ]);

      const profiles = profRes.data || [];
      const behaviorAnalysis = behavRes.data?.[0] || null;

      // Sincronização Automática de Hobbies/Interesses baseada no enriquecimento social
      if (behaviorAnalysis?.interests && Array.isArray(behaviorAnalysis.interests)) {
        const { data: contact } = await supabase.from('contacts').select('interests, hobbies').eq('id', contactId).single();
        if (contact) {
          const newInterests = [...new Set([...(contact.interests || []), ...behaviorAnalysis.interests])];
          // Simple heuristic: if interests look like hobbies, we could split, but for now we just enrich interests
          if (newInterests.length > (contact.interests || []).length) {
             await supabase.from('contacts').update({ interests: newInterests }).eq('id', contactId);
             // Optional: invalidate contact query
             queryClient.invalidateQueries({ queryKey: ['contact', contactId] });
          }
        }
      }

      return {
        profiles,
        behaviorAnalysis,
        lifeEvents: eventsRes.data || [],
      };
    },
    enabled: !!user && !!contactId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const dismissMutation = useMutation({
    mutationFn: async (eventId: string) => {
      await supabase.from('social_life_events').update({ dismissed: true }).eq('id', eventId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-intelligence', contactId] });
    },
  });

  return {
    profiles: data?.profiles || [],
    behaviorAnalysis: data?.behaviorAnalysis || null,
    lifeEvents: data?.lifeEvents || [],
    loading,
    dismissEvent: dismissMutation.mutate,
  };
}
