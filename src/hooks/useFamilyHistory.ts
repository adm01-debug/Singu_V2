import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface FamilyHistoryEntry {
  id: string;
  contact_id: string;
  family_info: string;
  changed_at: string;
}

export function useFamilyHistory(contactId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['family-history', contactId],
    queryFn: async () => {
      if (!contactId || !user) return [];
      const { data, error } = await supabase
        .from('contact_family_history')
        .select('*')
        .eq('contact_id', contactId)
        .order('changed_at', { ascending: false });

      if (error) throw error;
      return (data || []) as FamilyHistoryEntry[];
    },
    enabled: !!contactId && !!user,
  });

  const revertMutation = useMutation({
    mutationFn: async (historyEntry: FamilyHistoryEntry) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('contacts')
        .update({ family_info: historyEntry.family_info })
        .eq('id', contactId);

      if (error) throw error;
      return historyEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact', contactId] });
      queryClient.invalidateQueries({ queryKey: ['rapport-intel', contactId] });
      queryClient.invalidateQueries({ queryKey: ['family-history', contactId] });
      toast.success('Informações familiares revertidas com sucesso');
    },
    onError: () => toast.error('Erro ao reverter informações familiares'),
  });

  return {
    history: query.data || [],
    isLoading: query.isLoading,
    revert: revertMutation.mutate,
  };
}

