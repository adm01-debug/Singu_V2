import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from "@/lib/logger";

interface UseDISCAutoAnalysisReturn {
  analyzing: boolean;
  analyzeInteraction: (interactionId: string, text: string) => Promise<any>;
  analyzeLatestInteractions: (contactId: string) => Promise<any>;
}

export function useDISCAutoAnalysis(): UseDISCAutoAnalysisReturn {
  const { user } = useAuth();
  const [analyzing, setAnalyzing] = useState(false);

  const analyzeInteraction = useCallback(async (interactionId: string, text: string) => {
    if (!user || !text || text.length < 100) return null;

    setAnalyzing(true);
    try {
      const { data: interaction } = await supabase
        .from('interactions')
        .select('contact_id')
        .eq('id', interactionId)
        .maybeSingle();

      const { data, error } = await supabase.functions.invoke('disc-analyzer', {
        body: { 
          texts: [text], 
          contactId: interaction?.contact_id,
          interactionId 
        }
      });

      if (error) throw error;
      
      if (data?.success) {
        toast.success('Análise comportamental DISC concluída');
        return data.analysis;
      }
      return null;
    } catch (err) {
      logger.error('Error in DISC auto-analysis:', err);
      return null;
    } finally {
      setAnalyzing(false);
    }
  }, [user]);

  const analyzeLatestInteractions = useCallback(async (contactId: string) => {
    if (!user || !contactId) return null;

    setAnalyzing(true);
    try {
      const { data: interactions } = await supabase
        .from('interactions')
        .select('content, transcription')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!interactions || interactions.length === 0) {
        toast.warning('Sem interações recentes para analisar');
        return null;
      }

      const texts = interactions
        .map(i => [i.content, i.transcription].filter(Boolean).join(' '))
        .filter(t => t.length > 50);

      if (texts.length === 0) {
        toast.warning('Conteúdo insuficiente para análise comportamental');
        return null;
      }

      const { data, error } = await supabase.functions.invoke('disc-analyzer', {
        body: { texts, contactId }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Perfil DISC atualizado com base nas últimas interações');
        return data.analysis;
      }
      return null;
    } catch (err) {
      logger.error('Error in DISC contact analysis:', err);
      toast.error('Erro na análise comportamental');
      return null;
    } finally {
      setAnalyzing(false);
    }
  }, [user]);

  return { analyzing, analyzeInteraction, analyzeLatestInteractions };
}
