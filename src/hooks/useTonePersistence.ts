import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export type ToneType = 'friendly' | 'formal' | 'casual';

export function useTonePersistence(companyId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: preferredTone, isLoading } = useQuery({
    queryKey: ['ai-tone-preferences', companyId, user?.id],
    enabled: !!user,
    staleTime: 30 * 60_000,
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('ai_tone_preferences')
        .select('preferred_tone')
        .eq('user_id', user.id)
        .eq('company_id', companyId || null)
        .maybeSingle();

      if (error) {
        logger.error('Error fetching tone preference:', error);
        return null;
      }

      return data?.preferred_tone as ToneType | null;
    },
  });

  const mutation = useMutation({
    mutationFn: async (tone: ToneType) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('ai_tone_preferences')
        .upsert({
          user_id: user.id,
          company_id: companyId || null,
          preferred_tone: tone,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,company_id'
        });

      if (error) throw error;
      return tone;
    },
    onSuccess: (tone) => {
      queryClient.setQueryData(['ai-tone-preferences', companyId, user?.id], tone);
      queryClient.invalidateQueries({ queryKey: ['ai-tone-preferences', companyId, user?.id] });
      toast.success('Preferência de tom salva!');
    },
    onError: (error) => {
      logger.error('Error saving tone preference:', error);
      toast.error('Erro ao salvar preferência de tom.');
    },
  });

  return {
    preferredTone,
    isLoading,
    saveTone: mutation.mutate,
    isSaving: mutation.isPending,
  };
}
