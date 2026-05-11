import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useNLPAutoAnalysis } from "./useNLPAutoAnalysis";
import { 
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
  const { triggerAnalysis } = useNLPAutoAnalysis();
  const [analyzing, setAnalyzing] = useState(false);

  const normalizeText = (text: string): string => {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  };

  const analyzeText = useCallback((text: string): VAKAnalysisResult => {
    const normalizedText = normalizeText(text);
    const words = normalizedText.split(' ');
    const results: Record<VAKType, { count: number; words: string[] }> = { V: { count: 0, words: [] }, A: { count: 0, words: [] }, K: { count: 0, words: [] }, D: { count: 0, words: [] } };

    words.forEach(word => {
      if (word.length < 3) return;
      (Object.keys(VAK_PREDICATES) as VAKType[]).forEach(type => {
        const predicates = VAK_PREDICATES[type].map(p => normalizeText(p));
        const match = predicates.find(pred => pred === word || (pred.length > 4 && word.length > 4 && word.startsWith(pred.slice(0, -2))));
        if (match) {
          results[type].count++;
          if (!results[type].words.includes(word)) results[type].words.push(word);
        }
      });
    });

    const totalCount = results.V.count + results.A.count + results.K.count + results.D.count;
    const scores = {
      visual: totalCount > 0 ? (results.V.count / totalCount) * 100 : 0,
      auditory: totalCount > 0 ? (results.A.count / totalCount) * 100 : 0,
      kinesthetic: totalCount > 0 ? (results.K.count / totalCount) * 100 : 0,
      digital: totalCount > 0 ? (results.D.count / totalCount) * 100 : 0,
    };

    const sortedTypes = (Object.keys(scores) as Array<keyof typeof scores>).sort((a, b) => scores[b] - scores[a]);
    const typeMap: Record<string, VAKType> = { visual: 'V', auditory: 'A', kinesthetic: 'K', digital: 'D' };
    const dominantSystem = typeMap[sortedTypes[0]];
    const secondarySystem = scores[sortedTypes[1]] > 20 ? typeMap[sortedTypes[1]] : null;

    return {
      visual: { score: scores.visual, words: results.V.words },
      auditory: { score: scores.auditory, words: results.A.words },
      kinesthetic: { score: scores.kinesthetic, words: results.K.words },
      digital: { score: scores.digital, words: results.D.words },
      dominantSystem, secondarySystem,
      confidence: Math.round(Math.min(100, Math.max(0, (totalCount * 5) + ((scores[sortedTypes[0]] - scores[sortedTypes[1]]) * 2)))),
    };
  }, []);

  const saveAnalysis = useCallback(async (contactId: string, analysis: VAKAnalysisResult, text: string, interactionId?: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const { error } = await supabase.from('vak_analysis_history').insert({
        user_id: user.id, contact_id: contactId, interaction_id: interactionId || null,
        visual_score: analysis.visual.score, auditory_score: analysis.auditory.score,
        kinesthetic_score: analysis.kinesthetic.score, digital_score: analysis.digital.score,
        visual_words: analysis.visual.words, auditory_words: analysis.auditory.words,
        kinesthetic_words: analysis.kinesthetic.words, digital_words: analysis.digital.words,
        analyzed_text: text.substring(0, 1000), is_validated: false
      });
      if (error) throw error;
      if (contactId) {
        triggerAnalysis(contactId, interactionId || "manual", text, null, "whatsapp", false);
      }
      return true;
    } catch (error) {
      logger.error('Error saving VAK analysis:', error);
      return false;
    }
  }, [user, triggerAnalysis]);

  const getContactVAKProfile = useCallback(async (contactId: string): Promise<VAKProfile | null> => {
    if (!user) return null;
    try {
      const { data, error } = await supabase.from('vak_analysis_history').select('*').eq('contact_id', contactId).eq('user_id', user.id).order('created_at', { ascending: false });
      if (error || !data || data.length === 0) return null;
      const history = data as VAKAnalysisHistory[];
      const totals = history.reduce((acc, entry) => {
        acc.visual += entry.visual_score; acc.auditory += entry.auditory_score; acc.kinesthetic += entry.kinesthetic_score; acc.digital += entry.digital_score; acc.count++;
        acc.totalWords += (entry.visual_words.length + entry.auditory_words.length + entry.kinesthetic_words.length + entry.digital_words.length);
        return acc;
      }, { visual: 0, auditory: 0, kinesthetic: 0, digital: 0, count: 0, totalWords: 0 });
      const avgScores = { visual: totals.visual / totals.count, auditory: totals.auditory / totals.count, kinesthetic: totals.kinesthetic / totals.count, digital: totals.digital / totals.count };
      const sortedTypes = (Object.entries(avgScores) as [string, number][]).sort((a, b) => b[1] - a[1]);
      const typeMap: Record<string, VAKType> = { visual: 'V', auditory: 'A', kinesthetic: 'K', digital: 'D' };
      return {
        primary: typeMap[sortedTypes[0][0]], secondary: sortedTypes[1][1] > 20 ? typeMap[sortedTypes[1][0]] : null,
        scores: avgScores, confidence: Math.round(Math.min(100, Math.max(0, (totals.count * 15) + ((sortedTypes[0][1] - sortedTypes[1][1]) * 1.5) + (totals.totalWords * 0.5)))),
        lastAnalyzedAt: history[0].created_at, totalWordsAnalyzed: totals.totalWords,
      };
    } catch (error) {
      logger.error('Error getting VAK profile:', error);
      return null;
    }
  }, [user]);

  const analyzeContactInteractions = useCallback(async (contactId: string): Promise<VAKProfile | null> => {
    if (!user) return null;
    setAnalyzing(true);
    try {
      const { data: interactions, error } = await supabase.from('interactions').select('id, content, transcription').eq('contact_id', contactId).eq('user_id', user.id);
      if (error || !interactions) return null;
      for (const interaction of interactions) {
        const text = [interaction.content, interaction.transcription].filter(Boolean).join(' ');
        if (text.trim().length > 10) await saveAnalysis(contactId, analyzeText(text), text, interaction.id);
      }
      return await getContactVAKProfile(contactId);
    } finally {
      setAnalyzing(false);
    }
  }, [user, analyzeText, saveAnalysis, getContactVAKProfile]);

  const clearContactAnalysis = useCallback(async (contactId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const { error } = await supabase.from('vak_analysis_history').delete().eq('contact_id', contactId).eq('user_id', user.id);
      return !error;
    } catch (error) {
      return false;
    }
  }, [user]);

  return { analyzing, analyzeText, saveAnalysis, getContactVAKProfile, analyzeContactInteractions, clearContactAnalysis };
}
