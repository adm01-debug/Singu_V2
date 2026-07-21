 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
 import { toast } from 'sonner';
 import { logger } from '@/lib/logger';

export function useSocialIntelligence(contactId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading: loading } = useQuery({
    queryKey: ['social-intelligence', contactId, user?.id],
    queryFn: async () => {
      const [profRes, behavRes, eventsRes] = await Promise.all([
        supabase.from('social_profiles').select('*').eq('contact_id', contactId).order('updated_at', { ascending: false }).limit(10),
        supabase.from('social_behavior_analysis').select('*').eq('contact_id', contactId).order('analysis_date', { ascending: false }).limit(1),
        supabase.from('social_life_events').select('*').eq('contact_id', contactId).eq('dismissed', false).order('created_at', { ascending: false }).limit(20),
      ]);

      const profiles = profRes.data || [];
      const behaviorAnalysis = behavRes.data?.[0] || null;

      // Sincronização Automática de Hobbies/Interesses baseada no enriquecimento social
      if (behaviorAnalysis?.interests && Array.isArray(behaviorAnalysis.interests)) {
        const [{ data: contact }, { data: existingPending }] = await Promise.all([
          supabase.from('contacts').select('interests, hobbies').eq('id', contactId).maybeSingle(),
          supabase.from('suggested_rapport_intel').select('value').eq('contact_id', contactId).eq('status', 'pending').limit(50),
        ]);
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
    refetchOnWindowFocus: false,
  });

  const dismissMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase.from('social_life_events').update({ dismissed: true }).eq('id', eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-intelligence', contactId] });
    },
    onError: () => toast.error('Erro ao dispensar evento'),
  });

   const syncToPsychographic = useMutation({
     mutationFn: async () => {
       if (!user) return;
       
       // 1. Get current social behavior analysis
       const { data: analysis } = await supabase
         .from('social_behavior_analysis')
         .select('*')
         .eq('contact_id', contactId)
         .order('analysis_date', { ascending: false })
          .limit(1)
          .maybeSingle();
 
       if (!analysis) {
         throw new Error('Nenhuma análise de comportamento social disponível para sincronização.');
       }
 
       // 2. Prepare psychographic data from social insights
       const preferences = {
         social_interests: analysis.interests || [],
         topics_of_influence: analysis.topics || [],
         influence_score: analysis.influence_score,
         social_keywords: analysis.keywords || [],
         sales_insights: analysis.sales_insights || {}
       };
 
       const communicationStyle = typeof analysis.communication_style === 'string' 
         ? analysis.communication_style 
         : JSON.stringify(analysis.communication_style);
 
       // 3+4. Update analytical profile and core contact fields in parallel
       const [{ error: profileError }, { error: contactError }] = await Promise.all([
         supabase.from('contact_analytical_profiles').upsert({
           contact_id: contactId,
           user_id: user.id,
           preferences,
           recurrent_topics: analysis.topics || [],
           communication_style: communicationStyle,
           sentiment_trend: analysis.overall_sentiment,
           last_updated_at: new Date().toISOString()
         }, { onConflict: 'contact_id' }),
         supabase.from('contacts').update({
           interests: analysis.interests || [],
           notes: `Perfil psicográfico atualizado via IA Social em ${new Date().toLocaleDateString('pt-BR')}`
         }).eq('id', contactId),
       ]);

       if (profileError) throw profileError;
       if (contactError) throw contactError;
 
       // 5. Trigger offer regeneration (simulation/edge function call)
       try {
         await supabase.functions.invoke('generate-offer-suggestions', { 
           body: { contactId, userId: user.id, enriched: true } 
         });
       } catch {
         logger.warn('Failed to auto-trigger offer suggestions, but psychographics were updated');
       }
 
       return true;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['social-intelligence', contactId] });
       queryClient.invalidateQueries({ queryKey: ['contact-analytical-profiles', contactId] });
       queryClient.invalidateQueries({ queryKey: ['offer-suggestions-elite', contactId] });
       toast.success('🧠 Perfil Psicográfico Sincronizado!', {
         description: 'As preferências sociais foram integradas e as sugestões de oferta estão sendo recalculadas.'
       });
     },
     onError: (error) => {
       toast.error('Erro ao sincronizar perfil', { description: error instanceof Error ? error.message : 'Tente novamente.' });
     }
   });
 
  return {
    profiles: data?.profiles || [],
    behaviorAnalysis: data?.behaviorAnalysis || null,
    lifeEvents: data?.lifeEvents || [],
    loading,
    dismissEvent: dismissMutation.mutate,
     syncToPsychographic: syncToPsychographic.mutate,
     isSyncing: syncToPsychographic.isPending,
  };
}
