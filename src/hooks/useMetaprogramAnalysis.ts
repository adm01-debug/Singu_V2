import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import { useNLPAutoAnalysis } from "./useNLPAutoAnalysis";
import {
  MetaprogramProfile,
  MetaprogramAnalysisResult,
  METAPROGRAM_KEYWORDS
} from '@/types/metaprograms';
import { logger } from "@/lib/logger";

export function useMetaprogramAnalysis() {
  const { user } = useAuth();
  const { triggerAnalysis } = useNLPAutoAnalysis();
  const [loading, setLoading] = useState(false);

  // Analyze text for metaprogram patterns
  const analyzeText = useCallback((text: string): MetaprogramAnalysisResult => {
    const lowerText = text.toLowerCase();
    const result: MetaprogramAnalysisResult = {
      scores: {
        toward: 0, awayFrom: 0, internal: 0, external: 0,
        options: 0, procedures: 0, general: 0, specific: 0,
        proactive: 0, reactive: 0, sameness: 0, difference: 0
      },
      detectedWords: {
        toward: [], awayFrom: [], internal: [], external: [],
        options: [], procedures: [], general: [], specific: [],
        proactive: [], reactive: [], sameness: [], difference: []
      }
    };

    (Object.keys(METAPROGRAM_KEYWORDS) as Array<keyof typeof METAPROGRAM_KEYWORDS>).forEach(key => {
      METAPROGRAM_KEYWORDS[key].forEach(keyword => {
        if (lowerText.includes(keyword.toLowerCase())) {
          result.scores[key]++;
          if (!result.detectedWords[key].includes(keyword)) {
            result.detectedWords[key].push(keyword);
          }
        }
      });
    });

    return result;
  }, []);

  // Save analysis to database
  const saveAnalysis = useCallback(async (
    contactId: string,
    interactionId: string | null,
    analysisResult: MetaprogramAnalysisResult,
    analyzedText: string
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('metaprogram_analysis')
        .insert({
          user_id: user.id,
          contact_id: contactId,
          interaction_id: interactionId,
          toward_score: analysisResult.scores.toward,
          away_from_score: analysisResult.scores.awayFrom,
          toward_words: analysisResult.detectedWords.toward,
          away_from_words: analysisResult.detectedWords.awayFrom,
          internal_score: analysisResult.scores.internal,
          external_score: analysisResult.scores.external,
          internal_words: analysisResult.detectedWords.internal,
          external_words: analysisResult.detectedWords.external,
          options_score: analysisResult.scores.options,
          procedures_score: analysisResult.scores.procedures,
          options_words: analysisResult.detectedWords.options,
          procedures_words: analysisResult.detectedWords.procedures,
          analyzed_text: analyzedText.substring(0, 1000),
          is_validated: false
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      // Auto-trigger aggregated analysis update
      if (contactId) {
        triggerAnalysis(contactId, interactionId || "manual", analyzedText, null, "whatsapp", false);
      }

      return data;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error saving metaprogram analysis:', { error: msg });
      return null;
    }
  }, [user, triggerAnalysis]);

  // Get aggregated profile for a contact
  const getContactMetaprogramProfile = useCallback(async (
    contactId: string
  ): Promise<MetaprogramProfile | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('metaprogram_analysis')
        .select('*')
        .eq('contact_id', contactId)
        .eq('user_id', user.id);

      if (error) throw error;
      if (!data || data.length === 0) return null;

      type MetaprogramRecord = {
        toward_score?: number | null; away_from_score?: number | null;
        internal_score?: number | null; external_score?: number | null;
        options_score?: number | null; procedures_score?: number | null;
        general_score?: number | null; specific_score?: number | null;
        proactive_score?: number | null; reactive_score?: number | null;
        sameness_score?: number | null; difference_score?: number | null;
      };
      const totals = (data as MetaprogramRecord[]).reduce((acc, record) => ({
        toward: acc.toward + (record.toward_score || 0),
        awayFrom: acc.awayFrom + (record.away_from_score || 0),
        internal: acc.internal + (record.internal_score || 0),
        external: acc.external + (record.external_score || 0),
        options: acc.options + (record.options_score || 0),
        procedures: acc.procedures + (record.procedures_score || 0),
        general: acc.general + (record.general_score || 0),
        specific: acc.specific + (record.specific_score || 0),
        proactive: acc.proactive + (record.proactive_score || 0),
        reactive: acc.reactive + (record.reactive_score || 0),
        sameness: acc.sameness + (record.sameness_score || 0),
        difference: acc.difference + (record.difference_score || 0)
      }), { 
        toward: 0, awayFrom: 0, internal: 0, external: 0, 
        options: 0, procedures: 0, general: 0, specific: 0,
        proactive: 0, reactive: 0, sameness: 0, difference: 0 
      });

      const getDirectionAndConfidence = (score1: number, score2: number): { direction: 'first' | 'second' | 'balanced', confidence: number } => {
        const total = score1 + score2;
        if (total === 0) return { direction: 'balanced', confidence: 0 };
        const ratio = Math.abs(score1 - score2) / total;
        const confidence = Math.round(ratio * 100);
        if (ratio < 0.2) return { direction: 'balanced', confidence: 50 };
        return { direction: score1 > score2 ? 'first' : 'second', confidence: Math.min(95, 50 + confidence) };
      };

      const motivation = getDirectionAndConfidence(totals.toward, totals.awayFrom);
      const reference = getDirectionAndConfidence(totals.internal, totals.external);
      const working = getDirectionAndConfidence(totals.options, totals.procedures);
      const chunk = getDirectionAndConfidence(totals.general, totals.specific);
      const action = getDirectionAndConfidence(totals.proactive, totals.reactive);
      const comparison = getDirectionAndConfidence(totals.sameness, totals.difference);

      return {
        motivationDirection: motivation.direction === 'first' ? 'toward' : motivation.direction === 'second' ? 'away_from' : 'balanced',
        motivationConfidence: motivation.confidence,
        referenceFrame: reference.direction === 'first' ? 'internal' : reference.direction === 'second' ? 'external' : 'balanced',
        referenceConfidence: reference.confidence,
        workingStyle: working.direction === 'first' ? 'options' : working.direction === 'second' ? 'procedures' : 'balanced',
        workingConfidence: working.confidence,
        chunkSize: chunk.direction === 'first' ? 'general' : chunk.direction === 'second' ? 'specific' : 'balanced',
        chunkConfidence: chunk.confidence,
        actionFilter: action.direction === 'first' ? 'proactive' : action.direction === 'second' ? 'reactive' : 'balanced',
        actionConfidence: action.confidence,
        comparisonStyle: comparison.direction === 'first' ? 'sameness' : comparison.direction === 'second' ? 'difference' : 'balanced',
        comparisonConfidence: comparison.confidence,
        overallConfidence: Math.round((motivation.confidence + reference.confidence + working.confidence + chunk.confidence + action.confidence + comparison.confidence) / 6),
        analyzedInteractions: data.length
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error getting metaprogram profile:', { error: msg });
      return null;
    }
  }, [user]);

  const analyzeContactInteractions = useCallback(async (contactId: string, interactions: Array<{ id: string; transcription?: string | null; content?: string | null }>) => {
    if (!user) return;
    setLoading(true);
    try {
      const eligible = interactions.filter(i => {
        const text = i.transcription || i.content;
        if (!text || text.length < 20) return false;
        const totalScore = Object.values(analyzeText(text).scores).reduce((a, b) => a + b, 0);
        return totalScore > 0;
      });
      await Promise.all(
        eligible.map(i => {
          const text = i.transcription || i.content as string;
          return saveAnalysis(contactId, i.id, analyzeText(text), text);
        })
      );
      toast({ title: "Análise concluída", description: `${eligible.length} interações analisadas` });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error analyzing interactions:', { error: msg });
    } finally {
      setLoading(false);
    }
  }, [user, analyzeText, saveAnalysis]);

  const clearContactAnalysis = useCallback(async (contactId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('metaprogram_analysis').delete().eq('contact_id', contactId).eq('user_id', user.id);
      if (error) throw error;
      toast({ title: "Análise limpa", description: "Histórico removido" });
    } catch (error) {
      logger.error('Error clearing analysis:', error);
    }
  }, [user]);

  return {
    loading, analyzeText, saveAnalysis, getContactMetaprogramProfile,
    analyzeContactInteractions, clearContactAnalysis
  };
}
