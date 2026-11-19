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
import {
  INTERRUPTION_INDICATORS,
  LISTENING_INDICATORS,
  QUESTION_PATTERNS,
  getRecommendations,
} from '@/data/carnegieTalkRatio';
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

  // Analise de proporcao de fala.
  //
  // Antes esta funcao inventava quase tudo: `speakerRatio = isUserSpeaking ? 60 : 40`,
  // `idealRatio = 35`, `openEndedQuestions = questionCount * 0.3`,
  // `closedQuestions * 0.7`, `reflectiveStatements * 0.2`,
  // `acknowledgments * 0.3` e `interruptionIndicators: 0` — nenhum lia o texto.
  //
  // Os padroes que faltavam ja existiam em data/carnegieTalkRatio.ts (410 linhas
  // que nenhum arquivo importava): QUESTION_PATTERNS separa pergunta aberta,
  // fechada e reflexiva; LISTENING_INDICATORS marca escuta ativa;
  // INTERRUPTION_INDICATORS marca interrupcao. Agora sao eles que contam.
  //
  // O que continua sem medicao: proporcao de fala. O painel recebe um lado so
  // da conversa, e a proporcao exige os dois lados com duracao — por isso
  // speakerRatio, listenerRatio, idealRatio, deviation e quality vao como null.
  const analyzeTalkRatio = useCallback((text: string): TalkRatioAnalysis => {
    const frases = text
      .split(/(?<=[.!?])\s+/)
      .map(frase => frase.trim())
      .filter(Boolean);
    const perguntas = frases.filter(frase => frase.endsWith('?'));
    const afirmacoes = frases.filter(frase => !frase.endsWith('?'));

    const casam = (alvos: string[], padroes: readonly RegExp[]) =>
      alvos.filter(alvo => padroes.some(padrao => padrao.test(alvo))).length;

    // Cada pergunta entra em UMA categoria, da mais especifica para a menos.
    // `closed.patterns` inclui /\?$/, que casa com qualquer pergunta: sem
    // precedencia, toda pergunta seria contada tambem como fechada.
    const classificar = (pergunta: string) => {
      if (QUESTION_PATTERNS.reflective.patterns.some(padrao => padrao.test(pergunta))) return 'reflexiva';
      if (QUESTION_PATTERNS.openEnded.patterns.some(padrao => padrao.test(pergunta))) return 'aberta';
      if (QUESTION_PATTERNS.clarifying.patterns.some(padrao => padrao.test(pergunta))) return 'clarificacao';
      return 'fechada';
    };
    const categorias = perguntas.map(classificar);
    const openEndedQuestions = categorias.filter(c => c === 'aberta').length;
    const closedQuestions = categorias.filter(c => c === 'fechada').length;
    const reflectiveStatements = categorias.filter(c => c === 'reflexiva').length;
    const acknowledgments = casam(frases, LISTENING_INDICATORS.active.patterns);

    // Escuta ativa soma todos os grupos de LISTENING_INDICATORS que tenham padroes.
    const gruposDeEscuta = Object.values(LISTENING_INDICATORS)
      .map(grupo => (grupo as { patterns?: readonly RegExp[] }).patterns)
      .filter((padroes): padroes is readonly RegExp[] => Array.isArray(padroes));
    const activeListeningIndicators = frases.filter(frase =>
      gruposDeEscuta.some(padroes => padroes.some(padrao => padrao.test(frase))),
    ).length;

    const interruptionIndicators = casam(frases, INTERRUPTION_INDICATORS.patterns);

    return {
      speakerRatio: null,
      listenerRatio: null,
      idealRatio: null,
      deviation: null,
      quality: null,
      questionCount: perguntas.length,
      statementCount: afirmacoes.length,
      interruptionIndicators,
      activeListeningIndicators,
      openEndedQuestions,
      closedQuestions,
      reflectiveStatements,
      acknowledgments,
      // Os dois primeiros argumentos governam a recomendacao por proporcao de
      // fala, que nao medimos: 0 e 0 desligam esse ramo (0 > 0 + 15 e falso) e
      // deixam valer as recomendacoes por numero de perguntas e reconhecimentos.
      recommendations: getRecommendations(0, 0, perguntas.length, acknowledgments),
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

  // Pontuacao Carnegie a partir de uma analise real de texto.
  //
  // Antes esta funcao devolvia 50 fixo em sete dos oito componentes e um
  // `overall` que nao dependia de nada medido. Dos modulos Carnegie, so
  // carnegieWarmth tem funcao de pontuacao (calculateWarmthScore); os demais
  // detectam cenarios ou sugerem abordagens, e nao produzem nota. Por isso os
  // sete entram como `null` ("nao medido") e o geral e o proprio calor humano.
  const calculateCarnegieScore = useCallback((warmthScore: number): CarnegieScore => {
    const overall = Math.round(warmthScore);
    
    return {
      overall,
      components: {
        nobleCause: null,
        identityLabeling: null,
        appreciation: null,
        talkRatio: null,
        warmth: warmthScore,
        faceSaving: null,
        vulnerability: null,
        progressCelebration: null
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
