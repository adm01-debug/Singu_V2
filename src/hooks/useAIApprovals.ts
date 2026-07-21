import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface SuggestedRapportIntel {
  id: string;
  contact_id: string;
  contact_name?: string;
  type: 'hobby' | 'interest';
  value: string;
  source: 'whatsapp' | 'call' | 'linkedin' | 'instagram' | 'twitter' | 'other';
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export function useAIApprovals(contactId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['suggested-rapport', user?.id, contactId],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from('suggested_rapport_intel')
        .select(`
          *,
          contacts:contact_id (
            full_name
          )
        `)
        .eq('status', 'pending')
        .eq('user_id', user.id);
      
      if (contactId) {
        query = query.eq('contact_id', contactId);
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(500);

      if (error) throw error;
      return (data || []).map(item => {
        const contact = item.contacts as unknown as { full_name: string } | null;
        return {
          ...item,
          contact_name: contact?.full_name || 'Contato'
        };
      }) as SuggestedRapportIntel[];
    },
    enabled: !!user,
    staleTime: 2 * 60_000,
    refetchOnWindowFocus: false,
  });

  const approveMutation = useMutation({
    mutationFn: async (suggestion: SuggestedRapportIntel) => {
      if (!user) throw new Error('Usuário não autenticado');

      const field = suggestion.type === 'hobby' ? 'hobbies' : 'interests';

      const [{ error: updateError }, { data: contact, error: contactError }] = await Promise.all([
        supabase.from('suggested_rapport_intel').update({ status: 'approved' }).eq('user_id', user!.id).eq('id', suggestion.id),
        supabase.from('contacts').select('hobbies, interests, rapport_metadata').eq('id', suggestion.contact_id).eq('user_id', user.id).maybeSingle(),
      ]);

      if (updateError) throw updateError;
      if (contactError) throw contactError;

      const contactData = contact as { hobbies: string[] | null, interests: string[] | null, rapport_metadata: Record<string, Record<string, unknown>> | null } | null;
      const currentValues = (contactData?.[field as keyof typeof contactData] || []) as string[];
      const currentMetadata = (contactData?.rapport_metadata || {}) as Record<string, Record<string, unknown>>;
      
      // Ensure metadata has the correct structure for hobby/interest
      const updatedMetadata = { ...currentMetadata };
      if (!updatedMetadata[field]) updatedMetadata[field] = {};
      
      if (!currentValues.includes(suggestion.value)) {
        const newValues = [...currentValues, suggestion.value];
        updatedMetadata[field][suggestion.value] = suggestion.source;

        const { error: saveError } = await supabase
          .from('contacts')
          .update({
            [field]: newValues,
            rapport_metadata: updatedMetadata as unknown as Json
          })
          .eq('user_id', user.id)
          .eq('id', suggestion.contact_id);
        
        if (saveError) throw saveError;
      }

      return suggestion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggested-rapport'] });
      queryClient.invalidateQueries({ queryKey: ['rapport-intel'] });
      queryClient.invalidateQueries({ queryKey: ['contact'] });
      toast.success('Sugestão aprovada e adicionada ao perfil');
    },
    onError: () => {
      toast.error('Erro ao aprovar sugestão. Tente novamente.');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase
        .from('suggested_rapport_intel')
        .update({ status: 'rejected' })
        .eq('user_id', user!.id)
        .eq('id', suggestionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggested-rapport'] });
      toast.info('Sugestão ignorada');
    },
    onError: () => {
      toast.error('Erro ao ignorar sugestão. Tente novamente.');
    },
  });

  return {
    suggestions: query.data || [],
    isLoading: query.isLoading,
    approve: approveMutation,
    reject: rejectMutation,
  };
}

