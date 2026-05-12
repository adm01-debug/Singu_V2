import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export function useEdgeFunctionActions() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const invoke = useCallback(async (fnName: string, body: Record<string, unknown>, successMsg?: string) => {
    if (!user) return null;
    setLoading(prev => ({ ...prev, [fnName]: true }));
    try {
      const { data, error } = await supabase.functions.invoke(fnName, { body: { ...body, userId: user.id } });
      if (error) throw error;
      if (successMsg) toast.success(successMsg);
      return data;
    } catch (err) {
      logger.error(`Edge function ${fnName} error:`, err);
      toast.error(`Erro ao executar ${fnName}`);
      return null;
    } finally {
      setLoading(prev => ({ ...prev, [fnName]: false }));
    }
  }, [user]);

  const generateOfferSuggestions = useCallback((contactId: string) =>
    invoke('generate-offer-suggestions', { contactId }, '✨ Sugestões de oferta geradas'), [invoke]);

  const runRFMAnalyzer = useCallback((contactId?: string) =>
    invoke('rfm-analyzer', { contactId: contactId || 'all' }, '📊 Análise RFM atualizada'), [invoke]);

  const suggestNextAction = useCallback((contactId: string) =>
    invoke('suggest-next-action', { contactId }, '🎯 Próxima ação sugerida'), [invoke]);

  const scrapeProfile = useCallback((contactId: string, url: string) =>
    invoke('social-profile-scraper', { contactId, url }, '🔍 Perfil social coletado'), [invoke]);

  const analyzeSocialBehavior = useCallback((contactId: string) =>
    invoke('social-behavior-analyzer', { contactId }, '🧠 Comportamento social analisado'), [invoke]);

  const detectSocialEvents = useCallback((contactId: string) =>
    invoke('social-events-detector', { contactId }, '📅 Eventos sociais detectados'), [invoke]);

  const enrichLinkedIn = useCallback((contactId: string, linkedinUrl: string) =>
    invoke('enrichlayer-linkedin', { contactId, linkedinUrl }, '💼 LinkedIn enriquecido'), [invoke]);

  const firecrawlScrape = useCallback((url: string, entityId: string, entityType: string) =>
    invoke('firecrawl-scrape', { url, entityId, entityType }, '🌐 Dados coletados do site'), [invoke]);

  return {
    loading,
    invoke,
    generateOfferSuggestions,
    runRFMAnalyzer,
    suggestNextAction,
    scrapeProfile,
    analyzeSocialBehavior,
    detectSocialEvents,
    enrichLinkedIn,
    firecrawlScrape,
  };
}
