import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

export function useFavoriteTemplates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['favorite_templates', user?.id];

  const { data: favorites = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('favorite_templates')
        .select('template_id')
        .eq('user_id', user.id)
        .limit(200);
      if (error) throw error;
      return (data || []).map(f => f.template_id);
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
  });

  const toggleFavorite = useMutation({
    mutationFn: async (templateId: string) => {
      if (!user) throw new Error('Not authenticated');
      const isFav = favorites.includes(templateId);
      if (isFav) {
        const { error } = await supabase
          .from('favorite_templates')
          .delete()
          .eq('user_id', user.id)
          .eq('template_id', templateId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favorite_templates')
          .insert([{ user_id: user.id, template_id: templateId }]);
        if (error) throw error;
      }
      return { templateId, added: !isFav };
    },
    onMutate: async (templateId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<string[]>(queryKey);
      queryClient.setQueryData<string[]>(queryKey, prev => {
        const current = prev || [];
        return current.includes(templateId)
          ? current.filter(id => id !== templateId)
          : [...current, templateId];
      });
      return { previous };
    },
    onError: (_err, _var, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      logger.warn('Failed to toggle favorite template');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    favorites,
    isLoading,
    isFavorite: (templateId: string) => favorites.includes(templateId),
    toggleFavorite: (templateId: string) => toggleFavorite.mutate(templateId),
  };
}
