// ==============================================
// NLP Auto Analysis - Enterprise Automation Hook
// Automatically analyzes interactions for VAK, Metaprograms, and Emotional States
// ==============================================

import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useVAKAnalysis } from './useVAKAnalysis';
import { useMetaprogramAnalysis } from './useMetaprogramAnalysis';
import { useEmotionalStates } from './useEmotionalStates';
import { toast } from 'sonner';
import { logger } from "@/lib/logger";

import { SLEIGHT_TEMPLATES } from '@/data/sleightOfMouth';

interface NLPAnalysisResult {
  vak: {
    primary: string | null;
    scores: Record<string, number>;
    detectedWords: string[];
  };
  metaprograms: {
    motivationDirection: string;
    referenceFrame: string;
    workingStyle: string;
    chunkSize: string;
    actionFilter: string;
    comparisonStyle: string;
  };
  emotional: {
    currentState: string;
    trend: 'improving' | 'stable' | 'declining';
    confidence: number;
  };
  overallConfidence: number;
  analyzedAt: string;
}

// Minimum text length to trigger analysis
const MIN_TEXT_LENGTH = 100;

// Types that should trigger analysis
const ANALYZABLE_INTERACTION_TYPES = ['call', 'meeting', 'whatsapp', 'email'];

export function useNLPAutoAnalysis() {
  const { user } = useAuth();
  const { analyzeText: analyzeVAK, saveAnalysis: saveVAKAnalysis } = useVAKAnalysis();
  const { analyzeText: analyzeMetaprograms, saveAnalysis: saveMetaprogramAnalysis } = useMetaprogramAnalysis();
  const { detectEmotionalState, analyzeEmotionalHistory } = useEmotionalStates();
  
  const analysisQueue = useRef<Set<string>>(new Set());

  // Check if interaction should be analyzed
  const shouldAnalyze = useCallback((
    type: string,
    content: string | null,
    transcription: string | null
  ): boolean => {
    if (!ANALYZABLE_INTERACTION_TYPES.includes(type)) return false;
    
    const text = transcription || content || '';
    return text.length >= MIN_TEXT_LENGTH;
  }, []);

  // Perform comprehensive NLP analysis
  const analyzeInteraction = useCallback(async (
    contactId: string,
    interactionId: string,
    content: string | null,
    transcription: string | null,
    type: string
  ): Promise<NLPAnalysisResult | null> => {
    if (!user) return null;
    
    // Prevent duplicate analysis
    const analysisKey = `${contactId}-${interactionId}`;
    if (analysisQueue.current.has(analysisKey)) return null;
    
    const text = transcription || content || '';
    if (!shouldAnalyze(type, content, transcription)) return null;

    analysisQueue.current.add(analysisKey);

    try {
      if (import.meta.env.DEV) logger.log('🧠 NLP Auto-Analysis starting for interaction:', interactionId);

      // 1. VAK Analysis
      const vakResult = analyzeVAK(text);
      await saveVAKAnalysis(contactId, vakResult, text, interactionId);

      // 2. Metaprogram Analysis
      const metaResult = analyzeMetaprograms(text);
      await saveMetaprogramAnalysis(contactId, interactionId, metaResult, text);

      // 3. Emotional State Analysis
      const emotionalResult = detectEmotionalState(text);
      
      // Save emotional state to history
      const { error: emotionalInsertError } = await supabase.from('emotional_states_history').insert({
        user_id: user.id,
        contact_id: contactId,
        interaction_id: interactionId,
        emotional_state: emotionalResult.state,
        confidence: emotionalResult.confidence,
        trigger: emotionalResult.matchedWords[0] || null,
        context: text.substring(0, 200)
      });

      if (emotionalInsertError) throw emotionalInsertError;

      // 4. Update the contact record with aggregated behavioral data
      const mostFrequentObjection = SLEIGHT_TEMPLATES.find(t => 
        text.toLowerCase().includes(t.objection.toLowerCase().substring(0, 15))
      )?.objectionCategory;

      await supabase.from('contacts').update({
        vak_dominant: vakResult.dominantSystem,
        motivation_direction: metaResult.scores.toward >= metaResult.scores.awayFrom ? 'toward' : 'away_from',
        working_style: metaResult.scores.options >= metaResult.scores.procedures ? 'options' : 'procedures',
        reference_frame: metaResult.scores.internal >= metaResult.scores.external ? 'internal' : 'external',
        chunk_size: metaResult.scores.general >= metaResult.scores.specific ? 'general' : 'specific',
        action_filter: metaResult.scores.proactive >= metaResult.scores.reactive ? 'proactive' : 'reactive',
        comparison_style: metaResult.scores.sameness >= metaResult.scores.difference ? 'sameness' : 'difference',
        ...(mostFrequentObjection && { most_frequent_objection: mostFrequentObjection })
      }).eq('id', contactId);

      // 5. Calculate overall confidence
      const overallConfidence = Math.round(
        (vakResult.confidence + emotionalResult.confidence + 50) / 3
      );

      const result: NLPAnalysisResult = {
        vak: {
          primary: vakResult.dominantSystem,
          scores: {
            visual: vakResult.visual.score,
            auditory: vakResult.auditory.score,
            kinesthetic: vakResult.kinesthetic.score,
            digital: vakResult.digital.score
          },
          detectedWords: [
            ...vakResult.visual.words.slice(0, 3),
            ...vakResult.auditory.words.slice(0, 3),
            ...vakResult.kinesthetic.words.slice(0, 3),
            ...vakResult.digital.words.slice(0, 3)
          ]
        },
        metaprograms: {
          motivationDirection: metaResult.scores.toward > metaResult.scores.awayFrom ? 'toward' : 'away_from',
          referenceFrame: metaResult.scores.internal > metaResult.scores.external ? 'internal' : 'external',
          workingStyle: metaResult.scores.options > metaResult.scores.procedures ? 'options' : 'procedures',
          chunkSize: metaResult.scores.general > metaResult.scores.specific ? 'general' : 'specific',
          actionFilter: metaResult.scores.proactive > metaResult.scores.reactive ? 'proactive' : 'reactive',
          comparisonStyle: metaResult.scores.sameness > metaResult.scores.difference ? 'sameness' : 'difference'
        },
        emotional: {
          currentState: emotionalResult.state,
          trend: 'stable',
          confidence: emotionalResult.confidence
        },
        overallConfidence,
        analyzedAt: new Date().toISOString()
      };

      if (import.meta.env.DEV) logger.log('✅ NLP Auto-Analysis complete');

      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('❌ NLP Auto-Analysis error:', { error: msg });
      return null;
    } finally {
      analysisQueue.current.delete(analysisKey);
    }
  }, [user, analyzeVAK, saveVAKAnalysis, analyzeMetaprograms, saveMetaprogramAnalysis, detectEmotionalState, shouldAnalyze]);

  // Trigger analysis with optional toast notification
  const triggerAnalysis = useCallback(async (
    contactId: string,
    interactionId: string,
    content: string | null,
    transcription: string | null,
    type: string,
    showToast = false
  ): Promise<void> => {
    const result = await analyzeInteraction(contactId, interactionId, content, transcription, type);
    
    if (result && showToast) {
      toast.success('Análise PNL concluída', {
        description: `VAK: ${result.vak.primary} | Estado: ${result.emotional.currentState}`,
        duration: 3000
      });
    }
  }, [analyzeInteraction]);

  // Batch analyze all interactions for a contact
  const analyzeAllContactInteractions = useCallback(async (
    contactId: string
  ): Promise<{ analyzed: number; total: number }> => {
    if (!user) return { analyzed: 0, total: 0 };

    try {
      const { data: interactions, error } = await supabase
        .from('interactions')
        .select('id, type, content, transcription')
        .eq('contact_id', contactId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!interactions) return { analyzed: 0, total: 0 };

      let analyzed = 0;
      for (const interaction of interactions) {
        if (shouldAnalyze(interaction.type, interaction.content, interaction.transcription)) {
          await analyzeInteraction(
            contactId,
            interaction.id,
            interaction.content,
            interaction.transcription,
            interaction.type
          );
          analyzed++;
        }
      }

      return { analyzed, total: interactions.length };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error batch analyzing interactions:', { error: msg });
      return { analyzed: 0, total: 0 };
    }
  }, [user, shouldAnalyze, analyzeInteraction]);

  // Get comprehensive NLP profile for a contact
  const getContactNLPProfile = useCallback(async (contactId: string) => {
    if (!user) return null;

    try {
      // Fetch all analysis data in parallel
      const [vakData, metaData, emotionalData] = await Promise.all([
        supabase
          .from('vak_analysis_history')
          .select('*')
          .eq('contact_id', contactId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('metaprogram_analysis')
          .select('*')
          .eq('contact_id', contactId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('emotional_states_history')
          .select('*')
          .eq('contact_id', contactId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20)
      ]);

      if (vakData.error || metaData.error || emotionalData.error) {
        throw vakData.error || metaData.error || emotionalData.error;
      }

      return {
        vak: vakData.data || [],
        metaprograms: metaData.data || [],
        emotional: emotionalData.data || [],
        lastAnalyzed: vakData.data?.[0]?.created_at || null
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error fetching NLP profile:', { error: msg });
      return null;
    }
  }, [user]);

  return {
    shouldAnalyze,
    analyzeInteraction,
    triggerAnalysis,
    analyzeAllContactInteractions,
    getContactNLPProfile
  };
}
