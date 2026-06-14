// ==============================================
// CARNEGIE ANALYSIS HOOK
// Unified analysis using Dale Carnegie principles
// ==============================================

import { useMemo, useCallback } from 'react';
import { Contact } from '@/types';
import { CarnegieScore, TalkRatioAnalysis, WarmthScore } from '@/types/carnegie';
import { getNobleCausesByDISC } from '@/data/carnegieNobleCauses';
import { getTopLabelsForContact } from '@/data/carnegieIdentityLabels';
import { calculateWarmthScore, getWarmthLevel, detectWarmthIndicators, detectColdIndicators, getWarmthSuggestions } from '@/data/carnegieWarmth';
import { detectFaceSavingScenario, getTechniqueForDISC } from '@/data/carnegieFaceSaving';
import { detectProgressType, getCelebrationForDISC } from '@/data/carnegieProgressCelebration';
import { getDominantVAK, getDISCProfile } from '@/lib/contact-utils';

export function useCarnegieAnalysis(contact: Contact | null) {
  const discProfile = contact ? (getDISCProfile(contact) as 'D' | 'I' | 'S' | 'C') || 'S' : 'S';
  const vakProfile = contact ? (getDominantVAK(contact) as 'V' | 'A' | 'K' | 'D') || 'V' : 'V';

  // Get noble causes sorted by DISC compatibility
  const nobleCauses = useMemo(() => {
    return getNobleCausesByDISC(discProfile).slice(0, 5);
  }, [discProfile]);

  // Get identity labels for contact
  const identityLabels = useMemo(() => {
    return getTopLabelsForContact(discProfile, vakProfile, 3);
  }, [discProfile, vakProfile]);

  // Analyze text for warmth
  const analyzeWarmth = useCallback((text: string): WarmthScore => {
    const score = calculateWarmthScore(text);
    const level = getWarmthLevel(score);
    const warmIndicators = detectWarmthIndicators(text);
    const coldIndicators = detectColdIndicators(text);
    const suggestions = getWarmthSuggestions(score, coldIndicators);

    return {
      overall: score,
      components: {
        greetingWarmth: warmIndicators.filter(i => i.type === 'greeting').length * 10,
        empathyIndicators: warmIndicators.filter(i => i.type === 'empathy').length * 10,
        positiveLanguage: warmIndicators.filter(i => i.type === 'positive').length * 10,
        personalTouches: warmIndicators.filter(i => i.type === 'personal').length * 10,
        emotionalConnection: warmIndicators.filter(i => i.type === 'caring').length * 10,
        genuineInterest: warmIndicators.length * 5
      },
      level,
      trend: 'stable',
      warmthIndicators: warmIndicators,
      coldIndicators: coldIndicators,
      improvementSuggestions: suggestions
    };
  }, []);

  // Analyze talk ratio
  const analyzeTalkRatio = useCallback((text: string, isUserSpeaking: boolean = true): TalkRatioAnalysis => {
    const questionPatterns = /\?/g;
    const statementPatterns = /\./g;
    
    const questionCount = (text.match(questionPatterns) || []).length;
    const statementCount = (text.match(statementPatterns) || []).length;
    
    const speakerRatio = isUserSpeaking ? 60 : 40; // Simplified
    const idealRatio = 35;
    const deviation = Math.abs(speakerRatio - idealRatio);

    const quality = 
      deviation <= 10 ? 'excellent' :
      deviation <= 20 ? 'good' :
      deviation <= 35 ? 'needs_improvement' : 'poor';

    return {
      speakerRatio,
      listenerRatio: 100 - speakerRatio,
      idealRatio,
      deviation,
      quality,
      questionCount,
      statementCount,
      interruptionIndicators: 0,
      activeListeningIndicators: questionCount,
      openEndedQuestions: Math.floor(questionCount * 0.3),
      closedQuestions: Math.floor(questionCount * 0.7),
      reflectiveStatements: Math.floor(statementCount * 0.2),
      acknowledgments: Math.floor(statementCount * 0.3),
      recommendations: []
    };
  }, []);

  // Detect face-saving opportunities
  const detectFaceSaving = useCallback((text: string) => {
    const scenario = detectFaceSavingScenario(text);
    if (!scenario) return null;
    return getTechniqueForDISC(scenario, discProfile);
  }, [discProfile]);

  // Detect progress to celebrate
  const detectProgress = useCallback((text: string) => {
    const progressType = detectProgressType(text);
    if (!progressType) return null;
    return getCelebrationForDISC(progressType, discProfile);
  }, [discProfile]);

  // Calculate overall Carnegie score
  const calculateCarnegieScore = useCallback((warmthScore: number): CarnegieScore => {
    const overall = Math.round(warmthScore * 0.4 + 50 * 0.6);
    
    return {
      overall,
      components: {
        nobleCause: 50,
        identityLabeling: 50,
        appreciation: 50,
        talkRatio: 50,
        warmth: warmthScore,
        faceSaving: 50,
        vulnerability: 50,
        progressCelebration: 50
      },
      level: overall >= 80 ? 'master' : overall >= 65 ? 'expert' : overall >= 50 ? 'proficient' : overall >= 35 ? 'developing' : 'novice',
      strengths: warmthScore >= 70 ? ['Comunicação Calorosa'] : [],
      areasForImprovement: warmthScore < 50 ? ['Adicionar mais calor à comunicação'] : [],
      priorityActions: []
    };
  }, []);

  return {
    nobleCauses,
    identityLabels,
    analyzeWarmth,
    analyzeTalkRatio,
    detectFaceSaving,
    detectProgress,
    calculateCarnegieScore,
    discProfile,
    vakProfile
  };
}
