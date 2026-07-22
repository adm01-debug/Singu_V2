import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

export function useCommunicationPreferences(contactId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['communication-preferences', contactId, user?.id];

  const { data: prefs = null, isLoading: loading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data } = await supabase
        .from('communication_preferences')
        .select('*')
        .eq('contact_id', contactId)
        .eq('user_id', user!.id)
        .limit(1);
      return (data?.[0] || null) as Tables<'communication_preferences'> | null;
    },
    enabled: !!user && !!contactId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const upsertMutation = useMutation({
    mutationFn: async (updates: Partial<Tables<'communication_preferences'>>) => {
      if (!user) throw new Error('Não autenticado');
      if (prefs) {
        const { error } = await supabase
          .from('communication_preferences')
          .update(updates)
          .eq('user_id', user.id)
          .eq('id', prefs.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('communication_preferences')
          .insert({ contact_id: contactId, user_id: user.id, preferred_channel: 'email', ...updates });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Preferências salvas');
    },
    onError: () => {
      toast.error('Erro ao salvar preferências');
    },
  });

  const upsert = useCallback(async (updates: Partial<Tables<'communication_preferences'>>) => {
    upsertMutation.mutate(updates);
  }, [upsertMutation]);

  return { prefs, loading, upsert };
}
