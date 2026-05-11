import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { 
import { useNLPAutoAnalysis } from "./useNLPAutoAnalysis";
  VAKType, 
  VAKProfile, 
  VAKAnalysisResult, 
  VAK_PREDICATES 
} from '@/types/vak';
import { logger } from "@/lib/logger";

interface VAKAnalysisHistory {
  id: string;
  contact_id: string;
  interaction_id: string | null;
  visual_score: number;
  auditory_score: number;
  kinesthetic_score: number;
  digital_score: number;
  visual_words: string[];
  auditory_words: string[];
  kinesthetic_words: string[];
  digital_words: string[];
  analyzed_text: string;
  created_at: string;
}

export function useVAKAnalysis() {
  const { user } = useAuth();
  const [analyzing, setAnalyzing] = useState(false);

  // Normalize text for analysis (lowercase, remove accents)
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Analyze text and detect VAK predicates
  const analyzeText = useCallback((text: string): VAKAnalysisResult => {
    const normalizedText = normalizeText(text);
    const words = normalizedText.split(' ');
    
    const results: Record<VAKType, { count: number; words: string[] }> = {
      V: { count: 0, words: [] },
      A: { count: 0, words: [] },
      K: { count: 0, words: [] },
      D: { count: 0, words: [] },
    };

    // Check each word against predicates
    words.forEach(word => {
      if (word.length < 3) return; // Skip very short words
      
      (Object.keys(VAK_PREDICATES) as VAKType[]).forEach(type => {
        const predicates = VAK_PREDICATES[type];
        const normalizedPredicates = predicates.map(p => normalizeText(p));
        
        // Check for exact match or partial match (for verb conjugations)
        const match = normalizedPredicates.find(pred => {
          // Exact match
          if (pred === word) return true;
          // Partial match for verb stems (e.g., "visualizo" matches "visualizar")
          if (pred.length > 4 && word.length > 4) {
            const stem = pred.slice(0, -2);
            return word.startsWith(stem);
          }
          return false;
        });

        if (match) {
          results[type].count++;
          if (!results[type].words.includes(word)) {
            results[type].words.push(word);
          }
        }
      });

      // Also check for multi-word expressions
      const textLower = normalizedText;
      (Object.keys(VAK_PREDICATES) as VAKType[]).forEach(type => {
        VAK_PREDICATES[type].forEach(pred => {
          if (pred.includes(' ')) {
            const normalizedPred = normalizeText(pred);
            if (textLower.includes(normalizedPred)) {
              results[type].count++;
              if (!results[type].words.includes(pred)) {
                results[type].words.push(pred);
              }
            }
          }
        });
      });
    });

    // Calculate scores (percentage of total detected predicates)
    const totalCount = results.V.count + results.A.count + results.K.count + results.D.count;
    
    const scores = {
      visual: totalCount > 0 ? (results.V.count / totalCount) * 100 : 0,
      auditory: totalCount > 0 ? (results.A.count / totalCount) * 100 : 0,
      kinesthetic: totalCount > 0 ? (results.K.count / totalCount) * 100 : 0,
      digital: totalCount > 0 ? (results.D.count / totalCount) * 100 : 0,
    };

    // Determine dominant and secondary systems
    const sortedTypes = (Object.keys(scores) as Array<keyof typeof scores>)
      .sort((a, b) => scores[b] - scores[a]);
    
    const typeMap: Record<string, VAKType> = {
      visual: 'V',
      auditory: 'A',
      kinesthetic: 'K',
      digital: 'D',
    };

    const dominantSystem = typeMap[sortedTypes[0]];
    const secondarySystem = scores[sortedTypes[1]] > 20 ? typeMap[sortedTypes[1]] : null;

    // Calculate confidence based on total words analyzed and score difference
    const scoreDiff = scores[sortedTypes[0]] - scores[sortedTypes[1]];
    const confidence = Math.min(100, Math.max(0, 
      (totalCount * 5) + (scoreDiff * 2)
    ));

    return {
      visual: { score: scores.visual, words: results.V.words },
      auditory: { score: scores.auditory, words: results.A.words },
      kinesthetic: { score: scores.kinesthetic, words: results.K.words },
      digital: { score: scores.digital, words: results.D.words },
      dominantSystem,
      secondarySystem,
      confidence: Math.round(confidence),
  const { triggerAnalysis } = useNLPAutoAnalysis();
    };
  }, []);

  // Save analysis to database
  const saveAnalysis = useCallback(async (
    contactId: string,
    analysis: VAKAnalysisResult,
    text: string,
    interactionId?: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase.from('vak_analysis_history')
        .insert({
          user_id: user.id,
          contact_id: contactId,
          interaction_id: interactionId || null,
          visual_score: analysis.visual.score,
          auditory_score: analysis.auditory.score,
          kinesthetic_score: analysis.kinesthetic.score,
          digital_score: analysis.digital.score,
          visual_words: analysis.visual.words,
          auditory_words: analysis.auditory.words,
          kinesthetic_words: analysis.kinesthetic.words,
          digital_words: analysis.digital.words,
          analyzed_text: text.substring(0, 1000), // Limit stored text
          is_validated: false
      // Auto-trigger aggregated analysis update
      if (user && contactId) {
        triggerAnalysis(contactId, interactionId || "", text, null, "whatsapp", false);
      }
        });

      if (error) throw error;
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error saving VAK analysis:', { error: msg });
      return false;
    }
  }, [user]);

  // Get aggregated VAK profile for a contact
  const getContactVAKProfile = useCallback(async (contactId: string): Promise<VAKProfile | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('vak_analysis_history')
        .select('*')
        .eq('contact_id', contactId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const history = data as VAKAnalysisHistory[];

      // Aggregate scores from all analyses
      const totals = history.reduce((acc, entry) => {
        acc.visual += entry.visual_score;
        acc.auditory += entry.auditory_score;
        acc.kinesthetic += entry.kinesthetic_score;
        acc.digital += entry.digital_score;
        acc.count++;
        acc.totalWords += (
          entry.visual_words.length +
          entry.auditory_words.length +
          entry.kinesthetic_words.length +
          entry.digital_words.length
        );
        return acc;
      }, { visual: 0, auditory: 0, kinesthetic: 0, digital: 0, count: 0, totalWords: 0 });

      const avgScores = {
        visual: totals.visual / totals.count,
        auditory: totals.auditory / totals.count,
        kinesthetic: totals.kinesthetic / totals.count,
        digital: totals.digital / totals.count,
      };

      // Determine primary and secondary
      const sortedTypes = (Object.entries(avgScores) as [string, number][])
        .sort((a, b) => b[1] - a[1]);

      const typeMap: Record<string, VAKType> = {
        visual: 'V',
        auditory: 'A',
        kinesthetic: 'K',
        digital: 'D',
      };

      const primary = typeMap[sortedTypes[0][0]];
      const secondary = sortedTypes[1][1] > 20 ? typeMap[sortedTypes[1][0]] : null;

      // Confidence based on number of analyses and score clarity
      const scoreDiff = sortedTypes[0][1] - sortedTypes[1][1];
      const confidence = Math.min(100, Math.max(0,
        (totals.count * 15) + (scoreDiff * 1.5) + (totals.totalWords * 0.5)
      ));

      return {
        primary,
        secondary,
        scores: avgScores,
        confidence: Math.round(confidence),
        lastAnalyzedAt: history[0].created_at,
        totalWordsAnalyzed: totals.totalWords,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error getting VAK profile:', { error: msg });
      return null;
    }
  }, [user]);

  // Analyze all interactions for a contact
  const analyzeContactInteractions = useCallback(async (contactId: string): Promise<VAKProfile | null> => {
    if (!user) return null;
    setAnalyzing(true);

    try {
      // Fetch all interactions for this contact
      const { data: interactions, error } = await supabase
        .from('interactions')
        .select('id, content, transcription')
        .eq('contact_id', contactId)
        .eq('user_id', user.id);

      if (error) throw error;
      if (!interactions || interactions.length === 0) return null;

      // Analyze each interaction
      for (const interaction of interactions) {
        const textToAnalyze = [
          interaction.content,
          interaction.transcription,
        ].filter(Boolean).join(' ');

        if (textToAnalyze.trim().length > 10) {
          const analysis = analyzeText(textToAnalyze);
          await saveAnalysis(contactId, analysis, textToAnalyze, interaction.id);
        }
      }

      // Return aggregated profile
      return await getContactVAKProfile(contactId);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error analyzing contact interactions:', { error: msg });
      return null;
    } finally {
      setAnalyzing(false);
    }
  }, [user, analyzeText, saveAnalysis, getContactVAKProfile]);

  // Clear analysis history for a contact
  const clearContactAnalysis = useCallback(async (contactId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('vak_analysis_history')
        .delete()
        .eq('contact_id', contactId)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error clearing VAK analysis:', { error: msg });
      return false;
    }
  }, [user]);

  return {
    analyzing,
    analyzeText,
    saveAnalysis,
    getContactVAKProfile,
    analyzeContactInteractions,
    clearContactAnalysis,
  };
}
