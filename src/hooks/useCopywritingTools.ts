// ==============================================
// COPYWRITING SALES TOOLS - Hook
// Enterprise-grade copywriting generation hook
// ==============================================

import { useMemo, useCallback } from 'react';
import { Contact, DISCProfile } from '@/types';
import {
  FABElement,
  FABAnalysis,
  AIDAScript,
  AIDASection,
  CTATemplate,
  CTAVariation,
  IdealForSection,
  CopywritingProfile,
  CopywritingGenerationOptions,
  HeadlineFormula
} from '@/types/copywriting';
import {
  FAB_TEMPLATES,
  AIDA_TEMPLATES,
  CTA_TEMPLATES,
  TRANSITION_WORDS,
  PERSUASIVE_CONNECTORS,
  HEADLINE_FORMULAS,
  DEFAULT_SEGMENTS,
  POWER_WORDS_CATEGORIES
} from '@/data/copywritingData';
import { getDominantVAK, getDISCProfile as getBehaviorDISC } from '@/lib/contact-utils';

export function useCopywritingTools(contact?: Contact) {
  // Get contact profile
  const discProfile = useMemo(() => {
    if (!contact) return 'D';
    return (getBehaviorDISC(contact) as DISCProfile) || 'D';
  }, [contact]);

  const vakType = useMemo(() => {
    if (!contact) return 'V';
    return getDominantVAK(contact) || 'V';
  }, [contact]);

  // ============================================
  // FAB GENERATION
  // ============================================
  const generateFAB = useCallback((
    feature: string,
    category: 'product' | 'service' | 'feature' | 'solution' = 'product'
  ): FABElement => {
    const template = FAB_TEMPLATES.find(t => t.category === category) || FAB_TEMPLATES[0];
    
    // Generate advantage and benefit based on DISC profile
    const advantagePrefix = discProfile === 'D' ? 'Isso permite você' :
      discProfile === 'I' ? 'Com isso você pode' :
      discProfile === 'S' ? 'Isso garante que você' :
      'Tecnicamente, isso possibilita';
    
    const benefitPrefix = discProfile === 'D' ? 'Resultado:' :
      discProfile === 'I' ? 'Imagine:' :
      discProfile === 'S' ? 'Você vai ter:' :
      'Na prática:';

    return {
      id: `fab-${Date.now()}`,
      feature,
      advantage: `${advantagePrefix} [completar com vantagem prática]`,
      benefit: `${benefitPrefix} [completar com benefício emocional]`,
      emotionalHook: template.example.emotionalHook,
      targetPain: template.example.targetPain
    };
  }, [discProfile]);

  const analyzeFAB = useCallback((elements: FABElement[]): FABAnalysis => {
    const hasEmotionalHooks = elements.every(e => e.emotionalHook && e.emotionalHook.length > 0);
    const hasTargetPains = elements.every(e => e.targetPain && e.targetPain.length > 0);
    
    const strength = Math.round(
      (elements.length > 0 ? 30 : 0) +
      (hasEmotionalHooks ? 35 : 0) +
      (hasTargetPains ? 35 : 0)
    );

    const suggestions: string[] = [];
    if (!hasEmotionalHooks) suggestions.push('Adicione ganchos emocionais para cada FAB');
    if (!hasTargetPains) suggestions.push('Conecte cada benefício a uma dor específica do cliente');
    if (elements.length < 3) suggestions.push('Adicione mais elementos FAB para uma apresentação completa');

    return {
      elements,
      overallStrength: strength,
      missingEmotionalHooks: !hasEmotionalHooks,
      suggestions
    };
  }, []);

  // ============================================
  // AIDA GENERATION
  // ============================================
  const generateAIDAScript = useCallback((
    options: CopywritingGenerationOptions
  ): AIDAScript => {
    // Find best matching template
    const template = AIDA_TEMPLATES.find(t => 
      t.channel === options.channel && 
      t.targetProfile?.disc === (options.targetDisc || discProfile)
    ) || AIDA_TEMPLATES.find(t => t.channel === options.channel) || AIDA_TEMPLATES[0];

    // Adapt sections based on options
    const adaptedSections: AIDASection[] = template.sections.map(section => {
      let content = section.content;
      
      // Replace placeholders
      if (options.productOrService) {
        content = content.replace(/\[PRODUTO\]|\[SOLUÇÃO\]/g, options.productOrService);
      }
      if (options.mainBenefit) {
        content = content.replace(/\[BENEFÍCIO\]|\[RESULTADO\]/g, options.mainBenefit);
      }
      if (options.mainPain) {
        content = content.replace(/\[DOR\]|\[PROBLEMA\]/g, options.mainPain);
      }
      if (contact?.firstName) {
        content = content.replace(/\[Nome\]/g, contact.firstName);
      }

      // Add emoji if requested
      if (options.includeEmoji && options.channel === 'whatsapp') {
        if (section.stage === 'attention') content = '🎯 ' + content;
        if (section.stage === 'interest') content = '💡 ' + content;
        if (section.stage === 'desire') content = '🚀 ' + content;
        if (section.stage === 'action') content = '👉 ' + content;
      }

      return {
        ...section,
        content
      };
    });

    return {
      id: `aida-${Date.now()}`,
      contactId: contact?.id,
      channel: options.channel,
      sections: adaptedSections,
      totalDuration: template.sections.reduce((acc, s) => {
        const duration = parseInt(s.duration || '0');
        return acc + duration;
      }, 0) + ' seg',
      adaptations: {
        ifPositive: 'Avance rapidamente para o fechamento',
        ifNegative: 'Retorne para fase de interesse com nova abordagem',
        ifNeutral: 'Adicione mais prova social e exemplos'
      },
      generatedAt: new Date().toISOString()
    };
  }, [contact, discProfile]);

  // ============================================
  // CTA GENERATION
  // ============================================
  const getRecommendedCTAs = useCallback((
    urgencyLevel: number = 3,
    channel?: string
  ): CTATemplate[] => {
    return CTA_TEMPLATES
      .filter(cta => {
        // Filter by urgency compatibility
        const urgencyMatch = Math.abs(cta.urgencyLevel - urgencyLevel) <= 1;
        // Filter by DISC compatibility (threshold: 60)
        const discMatch = cta.discCompatibility[discProfile as keyof typeof cta.discCompatibility] >= 60;
        return urgencyMatch && discMatch;
      })
      .sort((a, b) => {
        // Sort by DISC compatibility
        const aScore = a.discCompatibility[discProfile as keyof typeof a.discCompatibility];
        const bScore = b.discCompatibility[discProfile as keyof typeof b.discCompatibility];
        return bScore - aScore;
      })
      .slice(0, 5);
  }, [discProfile]);

  const generateCTAVariations = useCallback((
    baseText: string,
    productOrService?: string
  ): CTAVariation => {
    const variations = CTA_TEMPLATES.slice(0, 4).map(template => {
      let text = template.example;
      if (productOrService) {
        text = text.replace(/\[PRODUTO\]|\[BENEFÍCIO\]|\[OFERTA\]/g, productOrService);
      }
      return {
        text,
        type: template.type,
        strength: template.discCompatibility[discProfile as keyof typeof template.discCompatibility]
      };
    });

    return {
      original: baseText,
      variations,
      recommendedFor: {
        disc: discProfile,
        channel: 'whatsapp'
      }
    };
  }, [discProfile]);

  // ============================================
  // SEGMENTATION
  // ============================================
  const generateIdealForSection = useCallback((
    productDescription?: string
  ): IdealForSection => {
    // Use first segment as primary based on contact data
    const primarySegment = DEFAULT_SEGMENTS[0];
    
    return {
      primaryAudience: `${primarySegment.name}: ${primarySegment.description}`,
      secondaryAudiences: DEFAULT_SEGMENTS.slice(1, 3).map(s => s.name),
      notIdealFor: [
        'Quem busca resultados sem esforço',
        'Quem não está disposto a investir em crescimento',
        'Quem prefere soluções genéricas de mercado'
      ],
      qualifyingQuestions: [
        'Você está buscando crescer seu negócio nos próximos 12 meses?',
        'Está disposto a implementar novas estratégias?',
        'Tem capacidade de investimento para crescer?'
      ],
      disqualifyingSignals: [
        'Não tem orçamento definido',
        'Não é o decisor',
        'Busca apenas preço baixo'
      ]
    };
  }, []);

  // ============================================
  // HEADLINE GENERATION
  // ============================================
  const getHeadlineFormulas = useCallback((
    type?: string
  ): HeadlineFormula[] => {
    if (type) {
      return HEADLINE_FORMULAS.filter(h => h.type === type);
    }
    // Return top formulas by effectiveness
    return [...HEADLINE_FORMULAS].sort((a, b) => b.effectiveness - a.effectiveness).slice(0, 5);
  }, []);

  const generateHeadline = useCallback((
    formula: HeadlineFormula,
    variables: Record<string, string>
  ): string => {
    let headline = formula.formula;
    Object.entries(variables).forEach(([key, value]) => {
      headline = headline.replace(new RegExp(`\\[${key}\\]`, 'g'), value);
    });
    return headline;
  }, []);

  // ============================================
  // TRANSITION WORDS & CONNECTORS
  // ============================================
  const getTransitionWords = useCallback((category?: string) => {
    if (category) {
      return TRANSITION_WORDS.filter(t => t.category === category);
    }
    return TRANSITION_WORDS;
  }, []);

  const getPersuasiveConnectors = useCallback(() => {
    return PERSUASIVE_CONNECTORS;
  }, []);

  const getPowerWords = useCallback((category?: keyof typeof POWER_WORDS_CATEGORIES) => {
    if (category) {
      return POWER_WORDS_CATEGORIES[category];
    }
    return Object.values(POWER_WORDS_CATEGORIES).flat();
  }, []);

  // ============================================
  // COMPLETE PROFILE GENERATION
  // ============================================
  const generateCopywritingProfile = useCallback((
    options: CopywritingGenerationOptions
  ): CopywritingProfile => {
    const fabElements = [generateFAB(options.productOrService || 'Seu produto', 'product')];
    
    return {
      contactId: contact?.id,
      fabAnalysis: analyzeFAB(fabElements),
      aidaScript: generateAIDAScript(options),
      recommendedCTAs: getRecommendedCTAs(options.urgencyLevel),
      segmentation: {
        detectedSegments: DEFAULT_SEGMENTS,
        idealForSection: generateIdealForSection(options.productOrService),
        messagingRecommendations: DEFAULT_SEGMENTS.slice(0, 2).map(seg => ({
          segment: seg.name,
          keyMessage: seg.desires[0],
          avoidMessage: seg.objections[0]
        })),
        confidence: 75
      },
      headlines: getHeadlineFormulas(),
      transitionWords: getTransitionWords(),
      overallScore: 80,
      generatedAt: new Date().toISOString()
    };
  }, [contact, generateFAB, analyzeFAB, generateAIDAScript, getRecommendedCTAs, generateIdealForSection, getHeadlineFormulas, getTransitionWords]);

  return {
    // FAB
    generateFAB,
    analyzeFAB,
    fabTemplates: FAB_TEMPLATES,
    
    // AIDA
    generateAIDAScript,
    aidaTemplates: AIDA_TEMPLATES,
    
    // CTA
    getRecommendedCTAs,
    generateCTAVariations,
    ctaTemplates: CTA_TEMPLATES,
    
    // Segmentation
    generateIdealForSection,
    defaultSegments: DEFAULT_SEGMENTS,
    
    // Headlines
    getHeadlineFormulas,
    generateHeadline,
    headlineFormulas: HEADLINE_FORMULAS,
    
    // Transitions & Connectors
    getTransitionWords,
    getPersuasiveConnectors,
    getPowerWords,
    transitionWords: TRANSITION_WORDS,
    persuasiveConnectors: PERSUASIVE_CONNECTORS,
    powerWordsCategories: POWER_WORDS_CATEGORIES,
    
    // Complete Profile
    generateCopywritingProfile,
    
    // Contact Profile
    discProfile,
    vakType
  };
}
