// ==============================================
// COPYWRITING ADVANCED HOOK
// Enterprise-grade copywriting analysis & generation
// ==============================================

import { useCallback, useMemo } from 'react';
import { Contact, DISCProfile } from '@/types';
import {
  ReadabilityMetrics,
  TriggerDensity,
  CopyAnalysis,
  EmojiSuggestion,
  ChannelPreview,
  PASScript
} from '@/types/copywriting';
import {
  PAS_TEMPLATES,
  FOUR_PS_TEMPLATES,
  STORYTELLING_TEMPLATES,
  EMOJI_CONTEXTS,
  CHANNEL_LIMITS,
  READABILITY_LEVELS,
  TRIGGER_DETECTION_WORDS
} from '@/data/copywritingAdvancedData';
import { getDominantVAK, getDISCProfile as getBehaviorDISC } from '@/lib/contact-utils';

export function useCopywritingAdvanced(contact?: Contact) {
  const discProfile = useMemo(() => {
    if (!contact) return 'D';
    return (getBehaviorDISC(contact) as DISCProfile) || 'D';
  }, [contact]);

  const vakType = useMemo(() => {
    if (!contact) return 'V';
    return getDominantVAK(contact) || 'V';
  }, [contact]);

  // ============================================
  // READABILITY ANALYSIS (Flesch PT-BR adapted)
  // ============================================
  const analyzeReadability = useCallback((text: string): ReadabilityMetrics => {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const syllables = words.reduce((acc, word) => {
      // Robust PT-BR syllable count
      const w = word.toLowerCase().trim();
      if (w.length <= 2) return acc + 1;
      
      // Count vowel clusters as potential syllables
      // Handling common Portuguese diphthongs and triphthongs
      let count = 0;
      let vowels = "aeiouáéíóúâêîôûãõàèìòù";
      let isPrevVowel = false;
      
      for (let i = 0; i < w.length; i++) {
        const char = w[i];
        const isVowel = vowels.indexOf(char) !== -1;
        
        if (isVowel && !isPrevVowel) {
          count++;
        }
        isPrevVowel = isVowel;
      }
      
      // Adjustment for common hiatus cases and clusters
      // This is a heuristic that works well for Flesch metrics
      return acc + Math.max(1, count);
    }, 0);

    const avgSentenceLength = words.length / Math.max(1, sentences.length);
    const avgWordLength = words.reduce((acc, w) => acc + w.length, 0) / Math.max(1, words.length);
    const avgSyllablesPerWord = syllables / Math.max(1, words.length);

    // Flesch Reading Ease adapted for Portuguese
    // Formula: 248.835 - (1.015 × ASL) - (84.6 × ASW)
    const fleschScore = Math.max(0, Math.min(100, 
      248.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord)
    ));

    const complexWords = words.filter(w => {
      const vowelGroups = w.toLowerCase().match(/[aeiouáéíóúâêîôûãõàèìòù]+/gi) || [];
      return vowelGroups.length >= 4;
    });
    const complexWordPercentage = (complexWords.length / Math.max(1, words.length)) * 100;

    let level: ReadabilityMetrics['level'] = 'medio';
    let recommendation = '';

    if (fleschScore >= 75) {
      level = 'muito_facil';
      recommendation = 'Excelente! Texto extremamente acessível (nível fundamental).';
    } else if (fleschScore >= 50) {
      level = 'facil';
      recommendation = 'Bom nível de leitura para o público geral (nível médio).';
    } else if (fleschScore >= 25) {
      level = 'medio';
      recommendation = 'Considere simplificar. Texto adequado para público universitário.';
    } else if (fleschScore >= 10) {
      level = 'dificil';
      recommendation = 'Texto acadêmico ou técnico. Complexidade elevada.';
    } else {
      level = 'muito_dificil';
      recommendation = 'Texto extremamente denso. Requer esforço cognitivo alto.';
    }

    return {
      fleschScore: Math.round(fleschScore),
      avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
      avgWordLength: Math.round(avgWordLength * 10) / 10,
      complexWordPercentage: Math.round(complexWordPercentage),
      level,
      recommendation
    };
  }, []);

  // ============================================
  // TRIGGER DENSITY ANALYSIS
  // ============================================
  const analyzeTriggerDensity = useCallback((text: string): TriggerDensity => {
    const textLower = text.toLowerCase();
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    const foundTriggers: Record<string, number> = {};
    const missingCategories: string[] = [];
    
    Object.entries(TRIGGER_DETECTION_WORDS).forEach(([category, words]) => {
      const found = words.filter(word => textLower.includes(word.toLowerCase()));
      if (found.length > 0) {
        foundTriggers[category] = found.length;
      } else {
        missingCategories.push(category);
      }
    });

    const totalTriggers = Object.values(foundTriggers).reduce((a, b) => a + b, 0);
    const triggersPerSentence = totalTriggers / Math.max(1, sentences.length);
    
    const dominantTriggers = Object.entries(foundTriggers)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);

    let saturationLevel: TriggerDensity['saturationLevel'] = 'optimal';
    let recommendation = '';

    if (triggersPerSentence < 0.3) {
      saturationLevel = 'low';
      recommendation = `Texto pouco persuasivo. Adicione gatilhos de: ${missingCategories.slice(0, 2).join(', ')}.`;
    } else if (triggersPerSentence > 1.5) {
      saturationLevel = 'high';
      recommendation = 'Excesso de gatilhos pode parecer manipulativo. Reduza a intensidade.';
    } else {
      recommendation = 'Boa densidade de gatilhos. Texto persuasivo e equilibrado.';
    }

    return {
      totalTriggers,
      triggersPerSentence: Math.round(triggersPerSentence * 100) / 100,
      dominantTriggers,
      missingTriggers: missingCategories,
      saturationLevel,
      recommendation
    };
  }, []);

  const analyzeSentiment = useCallback((text: string): 'positive' | 'neutral' | 'negative' => {
    const positiveWords = ['excelente', 'ótimo', 'incrível', 'sucesso', 'crescimento', 'benefício', 'fácil', 'bom', 'ajuda', 'resolvido'];
    const negativeWords = ['problema', 'difícil', 'ruim', 'erro', 'perda', 'falha', 'custo', 'caro', 'risco', 'atraso'];
    
    const textLower = text.toLowerCase();
    let posCount = 0;
    let negCount = 0;

    positiveWords.forEach(w => { if (textLower.includes(w)) posCount++; });
    negativeWords.forEach(w => { if (textLower.includes(w)) negCount++; });

    if (posCount > negCount + 1) return 'positive';
    if (negCount > posCount) return 'negative';
    return 'neutral';
  }, []);

  const analyzeEmotionalProfile = useCallback((text: string): any => {
    const textLower = text.toLowerCase();
    const profile = {
      joy: (textLower.match(/alegria|feliz|contente|maravilhoso|sucesso|conquista/g) || []).length * 15,
      trust: (textLower.match(/confiança|seguro|garantido|comprovado|transparente|parceiro/g) || []).length * 15,
      fear: (textLower.match(/medo|perigo|risco|perda|evite|cuidado/g) || []).length * 15,
      urgency: (textLower.match(/agora|rápido|imediato|hoje|última|acabando/g) || []).length * 20,
      anticipation: (textLower.match(/em breve|próximo|novidade|lançamento|descubra/g) || []).length * 15,
    };

    // Normalize to 0-100
    Object.keys(profile).forEach(k => {
      profile[k as keyof typeof profile] = Math.min(100, profile[k as keyof typeof profile]);
    });

    return profile;
  }, []);

  // ============================================
  // FULL COPY ANALYSIS
  // ============================================
  const analyzeCopy = useCallback((text: string): CopyAnalysis => {
    const readability = analyzeReadability(text);
    const triggerDensity = analyzeTriggerDensity(text);
    const sentiment = analyzeSentiment(text);
    const emotionalProfile = analyzeEmotionalProfile(text);
    
    const issues: CopyAnalysis['issues'] = [];
    const strengths: string[] = [];

    // Check for CTAs
    const ctaPatterns = /\b(clique|responda|envie|acesse|garanta|descubra|comece|experimente)\b/gi;
    const hasCTA = ctaPatterns.test(text);
    
    if (!hasCTA) {
      issues.push({
        issue: 'Sem Call-to-Action claro',
        severity: 'high',
        suggestion: 'Adicione um CTA direto como "Clique aqui" ou "Responda SIM"'
      });
    } else {
      strengths.push('CTA presente no texto');
    }

    // Check sentence length
    if (readability.avgSentenceLength > 25) {
      issues.push({
        issue: 'Frases muito longas',
        severity: 'medium',
        suggestion: 'Quebre frases com mais de 20 palavras para melhor leitura'
      });
    } else {
      strengths.push('Frases com bom tamanho para leitura');
    }

    // Check trigger balance
    if (triggerDensity.saturationLevel === 'low') {
      issues.push({
        issue: 'Poucos gatilhos persuasivos',
        severity: 'medium',
        suggestion: `Adicione gatilhos de ${triggerDensity.missingTriggers.slice(0, 2).join(' e ')}`
      });
    } else if (triggerDensity.saturationLevel === 'optimal') {
      strengths.push('Boa densidade de gatilhos mentais');
    }

    // Check for power words
    const powerWordsFound = text.match(/\b(grátis|garantido|exclusivo|limitado|novo|comprovado|resultado|transformação)\b/gi) || [];
    if (powerWordsFound.length === 0) {
      issues.push({
        issue: 'Sem power words',
        severity: 'low',
        suggestion: 'Use palavras de poder como: garantido, exclusivo, transformação'
      });
    } else {
      strengths.push(`${powerWordsFound.length} power words encontradas`);
    }

    // Calculate scores
    const persuasionScore = Math.min(100, 
      50 + 
      (triggerDensity.dominantTriggers.length * 10) + 
      (hasCTA ? 20 : 0) +
      (powerWordsFound.length * 5)
    );

    const emotionalScore = Math.min(100,
      30 +
      (triggerDensity.dominantTriggers.includes('fear') ? 15 : 0) +
      (triggerDensity.dominantTriggers.includes('curiosity') ? 15 : 0) +
      (text.match(/[!?]/g)?.length || 0) * 5 +
      (text.match(/😊|🎉|💪|🚀|❤️/g)?.length || 0) * 5
    );

    const clarityScore = readability.fleschScore;
    const ctaStrength = hasCTA ? 
      (text.match(/agora|hoje|imediato/gi) ? 90 : 60) : 0;

    const highlightedTriggers: any[] = [];
    Object.entries(TRIGGER_DETECTION_WORDS).forEach(([category, words]) => {
      words.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        let match;
        while ((match = regex.exec(text)) !== null) {
          highlightedTriggers.push({
            text: match[0],
            category,
            startIndex: match.index,
            endIndex: match.index + match[0].length
          });
        }
      });
    });

    return {
      id: `analysis-${Date.now()}`,
      originalText: text,
      readability,
      triggerDensity,
      sentiment,
      emotionalProfile,
      persuasionScore,
      emotionalScore,
      clarityScore,
      ctaStrength,
      highlightedTriggers: highlightedTriggers.sort((a, b) => a.startIndex - b.startIndex),
      issues,
      strengths,
      generatedAt: new Date().toISOString()
    };
  }, [analyzeReadability, analyzeTriggerDensity, analyzeSentiment, analyzeEmotionalProfile]);

  // ============================================
  // PAS GENERATION
  // ============================================
  const generatePAS = useCallback((
    problem: string,
    agitation: string,
    solution: string
  ): PASScript => {
    return {
      id: `pas-${Date.now()}`,
      problem,
      agitate: agitation,
      solution,
      generatedAt: new Date().toISOString()
    };
  }, []);

  // ============================================
  // EMOJI SUGGESTIONS
  // ============================================
  const getEmojiSuggestions = useCallback((
    text: string,
    channel: 'whatsapp' | 'email' | 'call' = 'whatsapp'
  ): EmojiSuggestion[] => {
    const suggestions: EmojiSuggestion[] = [];
    const textLower = text.toLowerCase();

    // Check channel compatibility
    const channelKey = channel as keyof typeof CHANNEL_LIMITS;
    if (!CHANNEL_LIMITS[channelKey]?.supportsEmoji) {
      return [];
    }

    // Analyze text for emoji opportunities
    EMOJI_CONTEXTS.forEach(context => {
      const discScore = context.discCompatibility[discProfile as keyof typeof context.discCompatibility] || 50;
      const channelScore = context.channelCompatibility[channel as keyof typeof context.channelCompatibility] || 50;
      
      if (discScore < 50 || channelScore < 50) return;

      // Check for context triggers in text
      let shouldAdd = false;
      let position: EmojiSuggestion['position'] = 'inline';

      if (context.category === 'urgency' && /\b(agora|hoje|urgent|rápido)\b/i.test(textLower)) {
        shouldAdd = true;
      } else if (context.category === 'growth' && /\b(crescimento|resultado|aumento)\b/i.test(textLower)) {
        shouldAdd = true;
      } else if (context.category === 'trust' && /\b(garantido|comprovado|seguro)\b/i.test(textLower)) {
        shouldAdd = true;
      } else if (context.category === 'action' && /\b(clique|responda|acesse)\b/i.test(textLower)) {
        shouldAdd = true;
        position = 'start';
      } else if (context.category === 'celebration' && /\b(parabéns|conquist|sucesso)\b/i.test(textLower)) {
        shouldAdd = true;
        position = 'end';
      }

      if (shouldAdd) {
        suggestions.push({
          position,
          emoji: context.emojis[0],
          context: context.usage,
          impact: discScore > 80 ? 'high' : discScore > 60 ? 'medium' : 'low'
        });
      }
    });

    return suggestions.slice(0, 5);
  }, [discProfile]);

  // ============================================
  // MULTI-CHANNEL PREVIEW
  // ============================================
  const generateChannelPreviews = useCallback((
    text: string
  ): ChannelPreview[] => {
    const previews: ChannelPreview[] = [];

    (Object.entries(CHANNEL_LIMITS) as [keyof typeof CHANNEL_LIMITS, typeof CHANNEL_LIMITS[keyof typeof CHANNEL_LIMITS]][]).forEach(([channel, limits]) => {
      let formattedText = text;
      const suggestions: string[] = [];

      // WhatsApp formatting
      if (channel === 'whatsapp') {
        // Add formatting suggestions
        if (!text.includes('*')) {
          suggestions.push('Use *texto* para negrito em pontos-chave');
        }
      }

      // Character limit check
      const isWithinLimit = limits.characterLimit === null || text.length <= limits.characterLimit;
      if (!isWithinLimit && limits.characterLimit) {
        suggestions.push(`Reduza ${text.length - limits.characterLimit} caracteres`);
      }

      // Ideal length check
      if (text.length > limits.idealLength * 1.5) {
        suggestions.push(`Texto longo. Ideal: até ${limits.idealLength} caracteres`);
      }

      previews.push({
        channel: channel as ChannelPreview['channel'],
        formattedText,
        characterCount: text.length,
        characterLimit: limits.characterLimit || undefined,
        isWithinLimit,
        suggestions,
        preview: {
          style: channel === 'whatsapp' ? 'bubble' : channel === 'email' ? 'card' : 'plain',
          backgroundColor: channel === 'whatsapp' ? '#dcf8c6' : undefined,
          textColor: '#000'
        }
      });
    });

    return previews;
  }, []);

  return {
    // Analysis
    analyzeReadability,
    analyzeTriggerDensity,
    analyzeCopy,
    
    // Generation
    generatePAS,
    getEmojiSuggestions,
    generateChannelPreviews,
    
    // Templates
    pasTemplates: PAS_TEMPLATES,
    fourPsTemplates: FOUR_PS_TEMPLATES,
    storytellingTemplates: STORYTELLING_TEMPLATES,
    emojiContexts: EMOJI_CONTEXTS,
    
    // Reference Data
    channelLimits: CHANNEL_LIMITS,
    readabilityLevels: READABILITY_LEVELS,
    triggerWords: TRIGGER_DETECTION_WORDS,
    
    // Profile
    discProfile,
    vakType
  };
}
