import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface SuggestedRapportIntel {
  id: string;
  contact_id: string;
  type: 'hobby' | 'interest';
  value: string;
  source: 'whatsapp' | 'call' | 'linkedin' | 'instagram' | 'twitter';
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export function useAIApprovals(contactId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['suggested-rapport', contactId],
    queryFn: async () => {
      if (!contactId || !user) return [];
      const { data, error } = await supabase
        .from('suggested_rapport_intel')
        .select('*')
        .eq('contact_id', contactId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SuggestedRapportIntel[];
    },
    enabled: !!contactId && !!user,
  });

  const approveMutation = useMutation({
    mutationFn: async (suggestion: SuggestedRapportIntel) => {
      if (!user) throw new Error('Usuário não autenticado');

      // 1. Mark as approved
      const { error: updateError } = await supabase
        .from('suggested_rapport_intel')
        .update({ status: 'approved' })
        .eq('id', suggestion.id);

      if (updateError) throw updateError;

      // 2. Add to contact's hobbies or interests
      const field = suggestion.type === 'hobby' ? 'hobbies' : 'interests';
      
      // Get current values first
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select(field)
        .eq('id', suggestion.contact_id)
        .single();

      if (contactError) throw contactError;

      const currentValues = contact[field] || [];
      if (!currentValues.includes(suggestion.value)) {
        const { error: saveError } = await supabase
          .from('contacts')
          .update({ [field]: [...currentValues, suggestion.value] })
          .eq('id', suggestion.contact_id);
        
        if (saveError) throw saveError;
      }

      return suggestion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggested-rapport', contactId] });
      queryClient.invalidateQueries({ queryKey: ['rapport-intel', contactId] });
      queryClient.invalidateQueries({ queryKey: ['contact', contactId] });
      toast.success('Sugestão aprovada e adicionada ao perfil');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      const { error } = await supabase
        .from('suggested_rapport_intel')
        .update({ status: 'rejected' })
        .eq('id', suggestionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggested-rapport', contactId] });
      toast.info('Sugestão ignorada');
    },
  });

  return {
    suggestions: query.data || [],
    isLoading: query.isLoading,
    approve: approveMutation.mutate,
    reject: rejectMutation.mutate,
  };
}
