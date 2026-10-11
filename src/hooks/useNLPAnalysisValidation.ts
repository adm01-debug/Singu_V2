import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export function useNLPAnalysisValidation() {
  const { user } = useAuth();

  const validateVAK = useCallback(async (id: string, isValidated: boolean, feedback?: string) => {
    if (!user) throw new Error('Não autenticado');
    try {
      const { error } = await supabase
        .from('vak_analysis_history')
        .update({ is_validated: isValidated, user_feedback: feedback })
        .eq('user_id', user!.id)
        .eq('id', id);
      if (error) throw error;
      toast.success(isValidated ? 'Análise VAK validada' : 'Análise VAK atualizada');
    } catch (error) {
      logger.error('Error validating VAK:', error);
      toast.error('Erro ao validar análise VAK');
      throw error;
    }
  }, [user]);

  const validateMetaprogram = useCallback(async (id: string, isValidated: boolean, feedback?: string) => {
    if (!user) throw new Error('Não autenticado');
    try {
      const { error } = await supabase
        .from('metaprogram_analysis')
        .update({ is_validated: isValidated, user_feedback: feedback })
        .eq('user_id', user!.id)
        .eq('id', id);
      if (error) throw error;
      toast.success(isValidated ? 'Metaprograma validado' : 'Metaprograma atualizado');
    } catch (error) {
      logger.error('Error validating Metaprogram:', error);
      toast.error('Erro ao validar metaprograma');
      throw error;
    }
  }, [user]);

  const addReframingFeedback = useCallback(async (id: string, feedback: string) => {
    if (!user) throw new Error('Não autenticado');
    try {
      const { error } = await supabase
        .from('reframing_analysis')
        .update({ feedback })
        .eq('user_id', user!.id)
        .eq('id', id);
      if (error) throw error;
      toast.success('Feedback do reenquadramento salvo');
    } catch (error) {
      logger.error('Error saving reframing feedback:', error);
      toast.error('Erro ao salvar feedback');
      throw error;
    }
  }, [user]);

  return { validateVAK, validateMetaprogram, addReframingFeedback };
}
