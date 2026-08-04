// ==============================================
// TRIGGER RELATIONS - Chains, Conflicts, Synergies, Timing & Fallbacks
// Extracted from triggersAdvancedData.ts for modularity
// ==============================================

import type {
  TriggerChain,
  TriggerConflict,
  TriggerSynergy,
  NeurochemicalTiming,
  TriggerFallback,
  IntensityLevel,
} from '@/types/triggers-advanced';

// ============================================
// TRIGGER CHAINS (COMBOS VALIDADOS)
// ============================================
export const VALIDATED_TRIGGER_CHAINS: TriggerChain[] = [
  {
    id: 'chain-discovery-close-d',
    name: 'Dominance Quick Close',
    description: 'Cadeia rápida para perfil D: Autoridade → Especificidade → Loss Aversion',
    triggers: ['authority', 'specificity', 'loss_aversion'],
    intensity: 'aggressive',
    timing: [
      { trigger: 'authority', delayMinutes: 0, channel: 'same' },
      { trigger: 'specificity', delayMinutes: 2, channel: 'same' },
      { trigger: 'loss_aversion', delayMinutes: 5, channel: 'same' },
    ],
    bestFor: ['D'],
    scenario: 'negotiation',
    successRate: 78,
    neuralPath: {
      brainSequence: ['neocortex', 'neocortex', 'reptilian'],
      chemicalFlow: ['serotonin', 'serotonin', 'cortisol'],
    },
  },
  {
    id: 'chain-relationship-i',
    name: 'Influence Warmth Path',
    description: 'Cadeia relacional para perfil I: Storytelling → Social Proof → Future Pacing',
    triggers: ['storytelling', 'social_proof', 'future_pacing'],
    intensity: 'gentle',
    timing: [
      { trigger: 'storytelling', delayMinutes: 0, channel: 'same' },
      { trigger: 'social_proof', delayMinutes: 5, channel: 'same' },
      { trigger: 'future_pacing', delayMinutes: 10, channel: 'same' },
    ],
    bestFor: ['I'],
    scenario: 'initial_negotiation',
    successRate: 72,
    neuralPath: {
      brainSequence: ['limbic', 'limbic', 'limbic'],
      chemicalFlow: ['oxytocin', 'oxytocin', 'dopamine'],
    },
  },
  {
    id: 'chain-safety-s',
    name: 'Stability Safety Net',
    description: 'Cadeia segura para perfil S: Empatia → Garantia → Cognitive Ease → Small Yes',
    triggers: ['empathy', 'guarantee', 'cognitive_ease', 'small_yes'],
    intensity: 'gentle',
    timing: [
      { trigger: 'empathy', delayMinutes: 0, channel: 'same' },
      { trigger: 'guarantee', delayMinutes: 5, channel: 'same' },
      { trigger: 'cognitive_ease', delayMinutes: 10, channel: 'same' },
      { trigger: 'small_yes', delayMinutes: 15, channel: 'same' },
    ],
    bestFor: ['S'],
    scenario: 'indecisive_client',
    successRate: 68,
    neuralPath: {
      brainSequence: ['limbic', 'reptilian', 'reptilian', 'neocortex'],
      chemicalFlow: ['oxytocin', 'serotonin', 'serotonin', 'dopamine'],
    },
  },
  {
    id: 'chain-logic-c',
    name: 'Analytical Proof Path',
    description: 'Cadeia lógica para perfil C: Especificidade → Comparação → Reason Why → Garantia',
    triggers: ['specificity', 'comparison', 'reason_why', 'guarantee'],
    intensity: 'moderate',
    timing: [
      { trigger: 'specificity', delayMinutes: 0, channel: 'same' },
      { trigger: 'comparison', delayMinutes: 5, channel: 'same' },
      { trigger: 'reason_why', delayMinutes: 10, channel: 'same' },
      { trigger: 'guarantee', delayMinutes: 15, channel: 'same' },
    ],
    bestFor: ['C'],
    scenario: 'price_objection',
    successRate: 74,
    neuralPath: {
      brainSequence: ['neocortex', 'neocortex', 'neocortex', 'reptilian'],
      chemicalFlow: ['serotonin', 'serotonin', 'serotonin', 'serotonin'],
    },
  },
  {
    id: 'chain-reactivation',
    name: 'Lost Client Recovery',
    description: 'Cadeia para reativação: Gift → Empathy → Social Proof → Exclusivity',
    triggers: ['gift', 'empathy', 'social_proof', 'exclusivity'],
    intensity: 'gentle',
    timing: [
      { trigger: 'gift', delayMinutes: 0, channel: 'same' },
      { trigger: 'empathy', delayMinutes: 1440, channel: 'different' },
      { trigger: 'social_proof', delayMinutes: 4320, channel: 'different' },
      { trigger: 'exclusivity', delayMinutes: 10080, channel: 'different' },
    ],
    bestFor: ['I', 'S'],
    scenario: 'lost_client_reactivation',
    successRate: 45,
    neuralPath: {
      brainSequence: ['limbic', 'limbic', 'limbic', 'limbic'],
      chemicalFlow: ['oxytocin', 'oxytocin', 'dopamine', 'dopamine'],
    },
  },
  {
    id: 'chain-closing-universal',
    name: 'Universal Closing Sequence',
    description: 'Sequência universal de fechamento: Commitment → Scarcity → Double Bind',
    triggers: ['commitment', 'scarcity', 'paradox_double_bind'],
    intensity: 'moderate',
    timing: [
      { trigger: 'commitment', delayMinutes: 0, channel: 'same' },
      { trigger: 'scarcity', delayMinutes: 3, channel: 'same' },
      { trigger: 'paradox_double_bind', delayMinutes: 5, channel: 'same' },
    ],
    bestFor: ['D', 'I', 'S', 'C'],
    scenario: 'negotiation',
    successRate: 65,
    neuralPath: {
      brainSequence: ['neocortex', 'reptilian', 'neocortex'],
      chemicalFlow: ['serotonin', 'cortisol', 'serotonin'],
    },
  },
];

// ============================================
// TRIGGER CONFLICTS
// ============================================
export const TRIGGER_CONFLICTS: TriggerConflict[] = [
  {
    trigger1: 'empathy',
    trigger2: 'urgency',
    conflictLevel: 'severe',
    reason: 'Empatia requer paciência; urgência cria pressão. Dissonância cognitiva.',
    resolution: 'Use empathy primeiro, espere 24h, depois urgency suave.',
  },
  {
    trigger1: 'gift',
    trigger2: 'scarcity',
    conflictLevel: 'moderate',
    reason: 'Dar algo grátis e depois pressionar parece manipulador.',
    resolution: 'Separe por pelo menos 2 dias.',
  },
  {
    trigger1: 'guarantee',
    trigger2: 'loss_aversion',
    conflictLevel: 'moderate',
    reason: 'Garantia reduz medo; loss aversion amplifica medo.',
    resolution: 'Use loss aversion primeiro, depois guarantee como solução.',
  },
  {
    trigger1: 'cognitive_ease',
    trigger2: 'specificity',
    conflictLevel: 'minor',
    reason: 'Simplicidade vs detalhes podem confundir.',
    resolution: 'Simplifique a mensagem principal, detalhe em anexo.',
  },
  {
    trigger1: 'pattern_interrupt',
    trigger2: 'empathy',
    conflictLevel: 'severe',
    reason: 'Interrupção agressiva destrói rapport.',
    resolution: 'Escolha um ou outro, nunca juntos.',
  },
  {
    trigger1: 'identity_shift',
    trigger2: 'small_yes',
    conflictLevel: 'moderate',
    reason: 'Identity é forte; small_yes é sutil. Confunde a abordagem.',
    resolution: 'Use small_yes para esquentar, identity_shift para fechar.',
  },
];

// ============================================
// TRIGGER SYNERGIES
// ============================================
export const TRIGGER_SYNERGIES: TriggerSynergy[] = [
  {
    trigger1: 'scarcity',
    trigger2: 'social_proof',
    synergyLevel: 9,
    explanation: '"Restam só 3 vagas" + "500 empresas já usam" = urgência validada',
    combinedEffect: 'Cria FOMO legitimado por validação social',
  },
  {
    trigger1: 'authority',
    trigger2: 'specificity',
    synergyLevel: 10,
    explanation: 'Especialista + números precisos = máxima credibilidade',
    combinedEffect: 'Autoridade inquestionável',
  },
  {
    trigger1: 'future_pacing',
    trigger2: 'anticipation',
    synergyLevel: 9,
    explanation: 'Projeção futura + expectativa = dopamina alta',
    combinedEffect: 'Cliente "sente" os resultados antes',
  },
  {
    trigger1: 'gift',
    trigger2: 'personalization',
    synergyLevel: 10,
    explanation: 'Presente personalizado = reciprocidade máxima',
    combinedEffect: 'Obrigação moral de retribuir',
  },
  {
    trigger1: 'loss_aversion',
    trigger2: 'specificity',
    synergyLevel: 9,
    explanation: 'Perda quantificada em R$ = impacto emocional + racional',
    combinedEffect: 'Medo calculado e justificado',
  },
  {
    trigger1: 'identity_shift',
    trigger2: 'tribal_belonging',
    synergyLevel: 10,
    explanation: '"Você é um líder" + "Líderes como nós..." = identidade tribal',
    combinedEffect: 'Comprometimento profundo de identidade',
  },
  {
    trigger1: 'cognitive_ease',
    trigger2: 'guarantee',
    synergyLevel: 9,
    explanation: 'Fácil + sem risco = decisão óbvia',
    combinedEffect: 'Remove todas as barreiras de decisão',
  },
];

// ============================================
// NEUROCHEMICAL TIMING
// ============================================
export const NEUROCHEMICAL_TIMING: NeurochemicalTiming[] = [
  {
    chemical: 'cortisol',
    optimalHours: [8, 9, 10, 11],
    peakDays: ['monday', 'tuesday'],
    avoidHours: [12, 13, 14, 15, 20, 21, 22],
    reasoning: 'Cortisol pico manhã = mais receptivo a urgência. Evite tarde (fadiga) e noite (relaxamento).',
    relatedTriggers: ['urgency', 'scarcity', 'fomo', 'loss_aversion'],
  },
  {
    chemical: 'dopamine',
    optimalHours: [14, 15, 16, 17],
    peakDays: ['wednesday', 'thursday'],
    avoidHours: [7, 8, 22, 23],
    reasoning: 'Dopamina sobe à tarde quando pensamos em recompensas. Ideal para antecipação.',
    relatedTriggers: ['anticipation', 'future_pacing', 'exclusivity', 'gift'],
  },
  {
    chemical: 'oxytocin',
    optimalHours: [10, 11, 15, 16],
    peakDays: ['tuesday', 'wednesday', 'thursday'],
    avoidHours: [8, 9, 18, 19],
    reasoning: 'Oxitocina estável em momentos calmos. Ideal para rapport e conexão.',
    relatedTriggers: ['empathy', 'storytelling', 'belonging', 'tribal_belonging'],
  },
  {
    chemical: 'serotonin',
    optimalHours: [10, 11, 12, 14, 15],
    peakDays: ['wednesday', 'thursday', 'friday'],
    avoidHours: [7, 8, 21, 22, 23],
    reasoning: 'Serotonina alta = confiança e bem-estar. Ótimo para decisões ponderadas.',
    relatedTriggers: ['authority', 'guarantee', 'commitment', 'identity_shift'],
  },
  {
    chemical: 'adrenaline',
    optimalHours: [9, 10, 14, 15],
    peakDays: ['monday', 'tuesday'],
    avoidHours: [12, 13, 19, 20, 21],
    reasoning: 'Adrenalina para ação rápida. Use no início da semana quando energia é alta.',
    relatedTriggers: ['pattern_interrupt', 'urgency', 'scarcity'],
  },
  {
    chemical: 'endorphin',
    optimalHours: [11, 12, 16, 17],
    peakDays: ['thursday', 'friday'],
    avoidHours: [8, 9, 21, 22],
    reasoning: 'Endorfina = prazer e alívio. Bom para fechamentos e celebrações.',
    relatedTriggers: ['gift', 'belonging', 'anticipation', 'cognitive_ease'],
  },
];

// ============================================
// FALLBACK TREES
// ============================================
export const TRIGGER_FALLBACKS: TriggerFallback[] = [
  {
    primaryTrigger: 'urgency',
    failureIndicators: ['não me pressione', 'preciso de tempo', 'vou pensar'],
    fallbackSequence: [
      { trigger: 'reason_why', condition: 'Cliente quer justificativa', timing: 'immediate' },
      { trigger: 'guarantee', condition: 'Cliente tem medo', timing: 'immediate' },
      { trigger: 'gift', condition: 'Cliente esfriou', timing: 'next_contact' },
    ],
  },
  {
    primaryTrigger: 'scarcity',
    failureIndicators: ['não acredito', 'parece falso', 'marketing'],
    fallbackSequence: [
      { trigger: 'social_proof', condition: 'Cliente cético', timing: 'immediate' },
      { trigger: 'specificity', condition: 'Quer provas', timing: 'immediate' },
      { trigger: 'authority', condition: 'Precisa de credibilidade', timing: 'next_contact' },
    ],
  },
  {
    primaryTrigger: 'loss_aversion',
    failureIndicators: ['está me ameaçando', 'manipulação', 'não me assusto'],
    fallbackSequence: [
      { trigger: 'empathy', condition: 'Cliente irritado', timing: 'immediate' },
      { trigger: 'gift', condition: 'Precisa reconstruir rapport', timing: 'wait_24h' },
      { trigger: 'cognitive_ease', condition: 'Simplificar abordagem', timing: 'next_contact' },
    ],
  },
  {
    primaryTrigger: 'identity_shift',
    failureIndicators: ['não me conhece', 'presunçoso', 'quem você pensa que é'],
    fallbackSequence: [
      { trigger: 'empathy', condition: 'Cliente ofendido', timing: 'immediate' },
      { trigger: 'small_yes', condition: 'Reconstruir gradualmente', timing: 'immediate' },
      { trigger: 'social_proof', condition: 'Provar com outros', timing: 'next_contact' },
    ],
  },
  {
    primaryTrigger: 'pattern_interrupt',
    failureIndicators: ['calma', 'está me assustando', 'agressivo'],
    fallbackSequence: [
      { trigger: 'empathy', condition: 'Cliente assustado', timing: 'immediate' },
      { trigger: 'gift', condition: 'Reconstruir confiança', timing: 'wait_24h' },
      { trigger: 'storytelling', condition: 'Abordagem suave', timing: 'next_contact' },
    ],
  },
];

// ============================================
// INTENSITY LEVELS
// ============================================
export const INTENSITY_LEVELS: IntensityLevel[] = [
  {
    level: 1,
    name: 'Sutil',
    description: 'Abordagem leve, sugestiva, não diretiva',
    languageModifiers: ['talvez', 'poderia', 'uma opção seria', 'você já pensou'],
    urgencyWords: ['quando puder', 'sem pressa', 'no seu tempo'],
    emotionalIntensity: 'subtle',
  },
  {
    level: 2,
    name: 'Moderado',
    description: 'Abordagem equilibrada, direta mas respeitosa',
    languageModifiers: ['recomendo', 'seria bom', 'faz sentido', 'vale a pena'],
    urgencyWords: ['em breve', 'nos próximos dias', 'quando possível'],
    emotionalIntensity: 'moderate',
  },
  {
    level: 3,
    name: 'Assertivo',
    description: 'Abordagem confiante, persuasiva',
    languageModifiers: ['você precisa', 'é importante', 'não pode perder', 'deveria'],
    urgencyWords: ['esta semana', 'até sexta', 'em poucos dias'],
    emotionalIntensity: 'strong',
  },
  {
    level: 4,
    name: 'Intenso',
    description: 'Abordagem urgente, emocional',
    languageModifiers: ['é crítico', 'não pode esperar', 'urgente', 'fundamental'],
    urgencyWords: ['hoje', 'agora', 'imediatamente', 'antes que'],
    emotionalIntensity: 'intense',
  },
  {
    level: 5,
    name: 'Máximo',
    description: 'Abordagem de última instância, alto risco',
    languageModifiers: ['última chance', 'definitivo', 'irreversível', 'ponto sem volta'],
    urgencyWords: ['agora ou nunca', 'última oportunidade', 'fechando'],
    emotionalIntensity: 'maximum',
  },
];

// ============================================
// ALL TRIGGER IDS (COMBINED)
// ============================================
export const ALL_TRIGGER_IDS: string[] = [
  'scarcity', 'urgency', 'fomo', 'exclusivity',
  'social_proof', 'authority', 'consensus', 'testimonial',
  'storytelling', 'belonging', 'anticipation', 'empathy',
  'specificity', 'reason_why', 'comparison', 'guarantee',
  'gift', 'concession', 'personalization',
  'commitment', 'consistency', 'small_yes', 'public_commitment',
  'future_pacing', 'pattern_interrupt', 'nested_loops', 'paradox_double_bind',
  'loss_aversion', 'identity_shift', 'tribal_belonging', 'cognitive_ease',
  'priming', 'anchoring', 'decoy_effect', 'framing', 'curiosity_gap',
  'peak_end_rule', 'endowment_effect', 'sunk_cost', 'bandwagon',
  'halo_effect', 'contrast_principle', 'unity',
];
