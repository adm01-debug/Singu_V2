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
          const currentInterests = contact.interests || [];
          const suggestedInterests = behaviorAnalysis.interests.filter(i => !currentInterests.includes(i));
          
          if (suggestedInterests.length > 0) {
            // Em vez de salvar direto, criar sugestões pendentes para o usuário aprovar
            const suggestions = suggestedInterests.map(val => ({
              contact_id: contactId,
              user_id: user.id,
              type: 'interest' as const,
              value: val,
              source: 'linkedin', // Simplificado, poderia vir da análise
              status: 'pending' as const
            }));

            // Evitar duplicatas nas sugestões pendentes
            const { data: existingPending } = await supabase
              .from('suggested_rapport_intel')
              .select('value')
              .eq('contact_id', contactId)
              .eq('status', 'pending');
            
            const pendingValues = new Set(existingPending?.map(p => p.value) || []);
            const newSuggestions = suggestions.filter(s => !pendingValues.has(s.value));

            if (newSuggestions.length > 0) {
              await supabase.from('suggested_rapport_intel').insert(newSuggestions);
              queryClient.invalidateQueries({ queryKey: ['suggested-rapport', contactId] });
            }
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
