import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
        const contact = item.contacts;
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

      const { data: contact, error: contactError } = await supabase.from('contacts')
        .select('hobbies, interests').eq('id', suggestion.contact_id).eq('user_id', user.id).maybeSingle();
      if (contactError) throw contactError;
      if (!contact) throw new Error('Contato não encontrado');

      const currentValues = contact[field] ?? [];
      if (!currentValues.includes(suggestion.value)) {
        const newValues = [...currentValues, suggestion.value];

        const { error: saveError } = await supabase
          .from('contacts')
          .update(field === 'hobbies' ? { hobbies: newValues } : { interests: newValues })
          .eq('user_id', user.id)
          .eq('id', suggestion.contact_id);
        
        if (saveError) throw saveError;
      }

      // A origem permanece no registro de sugestão; o perfil não possui rapport_metadata.
      const { error: updateError } = await supabase.from('suggested_rapport_intel')
        .update({ status: 'approved' }).eq('user_id', user.id).eq('id', suggestion.id);
      if (updateError) throw updateError;
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

