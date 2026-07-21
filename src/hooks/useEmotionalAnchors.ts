import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type EmotionalAnchor = Tables<'emotional_anchors'>;

export function useEmotionalAnchors(contactId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['emotional-anchors', contactId, user?.id];

  const { data: anchors = [], isLoading: loading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('emotional_anchors')
        .select('*')
        .eq('contact_id', contactId!)
        .eq('user_id', user?.id ?? '')
        .order('strength', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!contactId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: async (anchor: Omit<TablesInsert<'emotional_anchors'>, 'user_id'>) => {
      if (!user) throw new Error('Não autenticado');
      const { data, error } = await supabase
        .from('emotional_anchors')
        .insert({ ...anchor, user_id: user!.id })
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Falha ao registrar âncora emocional');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Âncora emocional registrada');
    },
    onError: (err) => {
      logger.error('Error creating emotional anchor:', err);
      toast.error('Erro ao criar âncora emocional');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase.from('emotional_anchors').delete().eq('user_id', user.id).eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<EmotionalAnchor[]>(queryKey);
      queryClient.setQueryData<EmotionalAnchor[]>(queryKey, old => old?.filter(a => a.id !== id) || []);
      return { prev };
    },
    onError: (err, _id, context) => {
      logger.error('Error deleting anchor:', err);
      if (context?.prev) queryClient.setQueryData(queryKey, context.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Âncora removida');
    },
  });

  const createAnchor = useCallback(async (anchor: Omit<TablesInsert<'emotional_anchors'>, 'user_id'>) => {
    return createMutation.mutateAsync(anchor);
  }, [createMutation]);

  const deleteAnchor = useCallback(async (id: string) => {
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  return { anchors, loading, createAnchor, deleteAnchor, refresh: () => queryClient.invalidateQueries({ queryKey }) };
}
