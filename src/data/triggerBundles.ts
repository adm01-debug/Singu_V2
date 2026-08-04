// ==============================================
// TRIGGER BUNDLES - Pre-built packages for each scenario
// Integrates DISC, VAK, and Metaprograms
// ==============================================

import { AllTriggerTypes } from '@/types/triggers-advanced';
import { PersuasionScenario } from '@/types/triggers';
import { BrainSystem, Neurochemical } from '@/types/neuromarketing';
import type { DiscProfileKey } from '@/types/carnegie-extended';

// ============================================
// BUNDLE TYPE DEFINITION
// ============================================
export interface TriggerBundle {
  id: string;
  name: string;
  nameEn: string;
  scenario: PersuasionScenario;
  description: string;
  
  // Multi-framework targeting
  discProfiles: DiscProfileKey[];
  vakProfiles: ('V' | 'A' | 'K')[];
  metaprograms: string[];
  
  // Trigger sequence
  triggers: AllTriggerTypes[];
  timing: {
    trigger: AllTriggerTypes;
    delayMinutes: number;
    channel?: 'same' | 'different';
    intensityLevel: 1 | 2 | 3 | 4 | 5;
  }[];
  
  // Neural mapping
  neuralPath: {
    brainSequence: BrainSystem[];
    chemicalFlow: Neurochemical[];
  };
  
  // Template examples
  openingTemplate: string;
  closingTemplate: string;
  
  // Stats
  successRate: number;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedDurationMinutes: number;
  
  // Coaching tips
  doList: string[];
  dontList: string[];
  fallbackBundle?: string;
}

// ============================================
// SCENARIO BUNDLES
// ============================================
export const TRIGGER_BUNDLES: TriggerBundle[] = [
  // =============================================
  // BUNDLE 1: PRICE OBJECTION
  // =============================================
  {
    id: 'bundle-price-objection',
    name: 'Objeção de Preço',
    nameEn: 'Price Objection Handler',
    scenario: 'price_objection',
    description: 'Sequência para transformar objeção de preço em percepção de valor',
    
    discProfiles: ['D', 'I', 'S', 'C'],
    vakProfiles: ['V', 'A', 'K'],
    metaprograms: ['toward', 'away_from', 'options'],
    
    triggers: ['reason_why', 'comparison', 'specificity', 'loss_aversion', 'guarantee'],
    timing: [
      { trigger: 'reason_why', delayMinutes: 0, channel: 'same', intensityLevel: 2 },
      { trigger: 'comparison', delayMinutes: 2, channel: 'same', intensityLevel: 3 },
      { trigger: 'specificity', delayMinutes: 4, channel: 'same', intensityLevel: 3 },
      { trigger: 'loss_aversion', delayMinutes: 6, channel: 'same', intensityLevel: 4 },
      { trigger: 'guarantee', delayMinutes: 8, channel: 'same', intensityLevel: 3 },
    ],
    
    neuralPath: {
      brainSequence: ['neocortex', 'neocortex', 'neocortex', 'reptilian', 'reptilian'],
      chemicalFlow: ['serotonin', 'serotonin', 'dopamine', 'cortisol', 'serotonin'],
    },
    
    openingTemplate: '{nome}, entendo a preocupação com investimento. Deixa eu te mostrar por que empresas como {referencia} consideraram isso o melhor ROI que já tiveram...',
    closingTemplate: 'E se eu te oferecer {garantia}? Assim você testa, vê os resultados, e decide com segurança.',
    
    successRate: 72,
    difficultyLevel: 'intermediate',
    estimatedDurationMinutes: 15,
    
    doList: [
      'Valide a objeção antes de contra-argumentar',
      'Use números específicos (não arredondados)',
      'Compare com custo de NÃO resolver',
      'Ofereça garantia como fechamento',
    ],
    dontList: [
      'Nunca justifique preço diretamente',
      'Evite dar desconto de graça',
      'Não pressione se cliente estiver irritado',
      'Não use loss aversion com perfil S sensível',
    ],
    fallbackBundle: 'bundle-relationship-recovery',
  },

  // =============================================
  // BUNDLE 2: INDECISIVE CLIENT
  // =============================================
  {
    id: 'bundle-indecisive',
    name: 'Cliente Indeciso',
    nameEn: 'Indecisive Client Converter',
    scenario: 'indecisive_client',
    description: 'Sequência suave para ajudar cliente indeciso a tomar decisão',
    
    discProfiles: ['S', 'C', 'I'],
    vakProfiles: ['V', 'K'],
    metaprograms: ['procedures', 'away_from', 'external'],
    
    triggers: ['empathy', 'small_yes', 'social_proof', 'cognitive_ease', 'paradox_double_bind'],
    timing: [
      { trigger: 'empathy', delayMinutes: 0, channel: 'same', intensityLevel: 2 },
      { trigger: 'small_yes', delayMinutes: 3, channel: 'same', intensityLevel: 1 },
      { trigger: 'social_proof', delayMinutes: 5, channel: 'same', intensityLevel: 2 },
      { trigger: 'cognitive_ease', delayMinutes: 8, channel: 'same', intensityLevel: 2 },
      { trigger: 'paradox_double_bind', delayMinutes: 10, channel: 'same', intensityLevel: 2 },
    ],
    
    neuralPath: {
      brainSequence: ['limbic', 'neocortex', 'limbic', 'reptilian', 'neocortex'],
      chemicalFlow: ['oxytocin', 'serotonin', 'oxytocin', 'serotonin', 'dopamine'],
    },
    
    openingTemplate: '{nome}, é completamente normal ter dúvidas. Aliás, nossos melhores clientes também tiveram. Posso te ajudar a esclarecer o que está pesando na decisão?',
    closingTemplate: 'Podemos começar pelo plano {opcaoA} ou {opcaoB} - qual funciona melhor pro seu momento?',
    
    successRate: 68,
    difficultyLevel: 'intermediate',
    estimatedDurationMinutes: 20,
    
    doList: [
      'Ouça mais do que fale',
      'Faça perguntas abertas sobre preocupações',
      'Ofereça opções (não "sim ou não")',
      'Use testemunhos de clientes similares',
    ],
    dontList: [
      'Nunca pressione por decisão rápida',
      'Evite urgência artificial',
      'Não mostre impaciência',
      'Não use loss aversion agressivo',
    ],
    fallbackBundle: 'bundle-relationship-recovery',
  },

  // =============================================
  // BUNDLE 3: LOST CLIENT REACTIVATION
  // =============================================
  {
    id: 'bundle-reactivation',
    name: 'Reativação de Cliente Perdido',
    nameEn: 'Lost Client Recovery',
    scenario: 'lost_client_reactivation',
    description: 'Sequência para reconquistar clientes perdidos ou inativos',
    
    discProfiles: ['I', 'S'],
    vakProfiles: ['A', 'K'],
    metaprograms: ['toward', 'external', 'options'],
    
    triggers: ['gift', 'empathy', 'storytelling', 'exclusivity', 'anticipation'],
    timing: [
      { trigger: 'gift', delayMinutes: 0, channel: 'same', intensityLevel: 1 },
      { trigger: 'empathy', delayMinutes: 1440, channel: 'different', intensityLevel: 2 }, // +1 day
      { trigger: 'storytelling', delayMinutes: 4320, channel: 'different', intensityLevel: 2 }, // +3 days
      { trigger: 'exclusivity', delayMinutes: 7200, channel: 'same', intensityLevel: 3 }, // +5 days
      { trigger: 'anticipation', delayMinutes: 10080, channel: 'same', intensityLevel: 3 }, // +7 days
    ],
    
    neuralPath: {
      brainSequence: ['limbic', 'limbic', 'limbic', 'limbic', 'limbic'],
      chemicalFlow: ['oxytocin', 'oxytocin', 'dopamine', 'dopamine', 'dopamine'],
    },
    
    openingTemplate: '{nome}, preparei algo especial pensando em você: {gift}. Sem compromisso, é um agradecimento por ter sido nosso cliente.',
    closingTemplate: 'Temos algo novo que poucos clientes vão ter acesso. Lembrei de você - quer saber mais?',
    
    successRate: 45,
    difficultyLevel: 'advanced',
    estimatedDurationMinutes: 7 * 24 * 60, // 7 days campaign
    
    doList: [
      'Comece dando valor sem pedir nada',
      'Reconheça que perdeu contato',
      'Mostre o que mudou/melhorou',
      'Ofereça benefício exclusivo para retorno',
    ],
    dontList: [
      'Nunca culpe o cliente por ter saído',
      'Evite pressão nas primeiras interações',
      'Não mencione concorrência de forma negativa',
      'Não use abordagem transacional imediata',
    ],
  },

  // =============================================
  // BUNDLE 4: INITIAL NEGOTIATION
  // =============================================
  {
    id: 'bundle-initial-negotiation',
    name: 'Negociação Inicial',
    nameEn: 'First Contact Discovery',
    scenario: 'initial_negotiation',
    description: 'Sequência para primeira negociação com lead qualificado',
    
    discProfiles: ['D', 'I', 'S', 'C'],
    vakProfiles: ['V', 'A', 'K'],
    metaprograms: ['toward', 'internal', 'proactive'],
    
    triggers: ['authority', 'social_proof', 'empathy', 'specificity', 'future_pacing'],
    timing: [
      { trigger: 'authority', delayMinutes: 0, channel: 'same', intensityLevel: 2 },
      { trigger: 'social_proof', delayMinutes: 2, channel: 'same', intensityLevel: 2 },
      { trigger: 'empathy', delayMinutes: 5, channel: 'same', intensityLevel: 2 },
      { trigger: 'specificity', delayMinutes: 10, channel: 'same', intensityLevel: 3 },
      { trigger: 'future_pacing', delayMinutes: 15, channel: 'same', intensityLevel: 3 },
    ],
    
    neuralPath: {
      brainSequence: ['neocortex', 'limbic', 'limbic', 'neocortex', 'limbic'],
      chemicalFlow: ['serotonin', 'oxytocin', 'oxytocin', 'serotonin', 'dopamine'],
    },
    
    openingTemplate: '{nome}, {credencial_autoridade}. Ajudamos empresas como {referencia} a {resultado}.',
    closingTemplate: 'Imagine daqui {tempo}, {visao_futuro}. Podemos marcar uma conversa para explorar como chegar lá?',
    
    successRate: 65,
    difficultyLevel: 'beginner',
    estimatedDurationMinutes: 20,
    
    doList: [
      'Estabeleça credibilidade rapidamente',
      'Descubra as dores antes de apresentar solução',
      'Use casos de sucesso relevantes',
      'Termine com próximo passo claro',
    ],
    dontList: [
      'Não fale demais sobre você/empresa',
      'Evite apresentar preço na primeira conversa',
      'Não prometa o que não pode entregar',
      'Não pule etapa de descoberta',
    ],
  },

  // =============================================
  // BUNDLE 5: UPSELL/CROSS-SELL
  // =============================================
  {
    id: 'bundle-upsell',
    name: 'Upsell / Cross-sell',
    nameEn: 'Expansion Revenue',
    scenario: 'upsell_crosssell',
    description: 'Sequência para expandir valor de clientes existentes',
    
    discProfiles: ['D', 'I'],
    vakProfiles: ['V', 'A'],
    metaprograms: ['toward', 'options', 'proactive'],
    
    triggers: ['personalization', 'anticipation', 'exclusivity', 'comparison', 'identity_shift'],
    timing: [
      { trigger: 'personalization', delayMinutes: 0, channel: 'same', intensityLevel: 2 },
      { trigger: 'anticipation', delayMinutes: 3, channel: 'same', intensityLevel: 3 },
      { trigger: 'exclusivity', delayMinutes: 5, channel: 'same', intensityLevel: 3 },
      { trigger: 'comparison', delayMinutes: 8, channel: 'same', intensityLevel: 3 },
      { trigger: 'identity_shift', delayMinutes: 10, channel: 'same', intensityLevel: 4 },
    ],
    
    neuralPath: {
      brainSequence: ['limbic', 'limbic', 'limbic', 'neocortex', 'limbic'],
      chemicalFlow: ['oxytocin', 'dopamine', 'dopamine', 'serotonin', 'serotonin'],
    },
    
    openingTemplate: '{nome}, baseado nos resultados que vocês tiveram com {produto_atual}, identifiquei uma oportunidade interessante...',
    closingTemplate: 'Empresas líderes como {referencia} já deram esse passo. Você é do tipo que lidera ou segue?',
    
    successRate: 58,
    difficultyLevel: 'intermediate',
    estimatedDurationMinutes: 15,
    
    doList: [
      'Conecte com resultados já obtidos',
      'Mostre ROI incremental claro',
      'Use comparação com casos similares',
      'Posicione como evolução natural',
    ],
    dontList: [
      'Não pareça que só quer mais dinheiro',
      'Evite abordagem se cliente está insatisfeito',
      'Não ignore problemas atuais',
      'Não pressione se timing não for bom',
    ],
  },

  // =============================================
  // BUNDLE 6: CONTRACT RENEWAL
  // =============================================
  {
    id: 'bundle-renewal',
    name: 'Renovação de Contrato',
    nameEn: 'Contract Renewal',
    scenario: 'contract_renewal',
    description: 'Sequência para garantir renovação com termos favoráveis',
    
    discProfiles: ['S', 'C'],
    vakProfiles: ['K', 'A'],
    metaprograms: ['away_from', 'procedures', 'external'],
    
    triggers: ['commitment', 'consistency', 'tribal_belonging', 'guarantee', 'cognitive_ease'],
    timing: [
      { trigger: 'commitment', delayMinutes: 0, channel: 'same', intensityLevel: 2 },
      { trigger: 'consistency', delayMinutes: 2, channel: 'same', intensityLevel: 2 },
      { trigger: 'tribal_belonging', delayMinutes: 5, channel: 'same', intensityLevel: 3 },
      { trigger: 'guarantee', delayMinutes: 8, channel: 'same', intensityLevel: 2 },
      { trigger: 'cognitive_ease', delayMinutes: 10, channel: 'same', intensityLevel: 3 },
    ],
    
    neuralPath: {
      brainSequence: ['neocortex', 'neocortex', 'limbic', 'reptilian', 'reptilian'],
      chemicalFlow: ['serotonin', 'serotonin', 'oxytocin', 'serotonin', 'serotonin'],
    },
    
    openingTemplate: '{nome}, seu contrato está chegando ao fim e quero garantir que a transição seja tranquila. Você mencionou {objetivo} quando começamos - como está esse progresso?',
    closingTemplate: 'A renovação é simples: {processo_simples}. Podemos fazer tudo em 5 minutos.',
    
    successRate: 78,
    difficultyLevel: 'beginner',
    estimatedDurationMinutes: 15,
    
    doList: [
      'Inicie renovação 60-90 dias antes',
      'Relembre resultados obtidos',
      'Destaque melhorias do período',
      'Simplifique processo de renovação',
    ],
    dontList: [
      'Não espere última hora',
      'Evite parecer desesperado',
      'Não ignore problemas não resolvidos',
      'Não mude condições drasticamente',
    ],
  },

  // =============================================
  // BUNDLE 7: TIMING OBJECTION
  // =============================================
  {
    id: 'bundle-timing',
    name: 'Objeção de Timing',
    nameEn: 'Timing Objection Handler',
    scenario: 'timing_objection',
    description: 'Sequência para quando cliente diz "não é o momento"',
    
    discProfiles: ['D', 'C'],
    vakProfiles: ['V', 'A'],
    metaprograms: ['toward', 'proactive', 'options'],
    
    triggers: ['empathy', 'reason_why', 'comparison', 'urgency', 'fomo'],
    timing: [
      { trigger: 'empathy', delayMinutes: 0, channel: 'same', intensityLevel: 2 },
      { trigger: 'reason_why', delayMinutes: 3, channel: 'same', intensityLevel: 2 },
      { trigger: 'comparison', delayMinutes: 5, channel: 'same', intensityLevel: 3 },
      { trigger: 'urgency', delayMinutes: 8, channel: 'same', intensityLevel: 3 },
      { trigger: 'fomo', delayMinutes: 10, channel: 'same', intensityLevel: 3 },
    ],
    
    neuralPath: {
      brainSequence: ['limbic', 'neocortex', 'neocortex', 'reptilian', 'reptilian'],
      chemicalFlow: ['oxytocin', 'serotonin', 'serotonin', 'cortisol', 'cortisol'],
    },
    
    openingTemplate: '{nome}, entendo que timing é crucial. Posso perguntar: o que precisa acontecer para que seja o momento certo?',
    closingTemplate: 'Enquanto você espera o "momento perfeito", {consequencia}. Não acha melhor começar pequeno agora?',
    
    successRate: 55,
    difficultyLevel: 'advanced',
    estimatedDurationMinutes: 15,
    
    doList: [
      'Entenda a objeção real por trás do timing',
      'Mostre custo de esperar',
      'Ofereça início menor/piloto',
      'Crie referência de tempo concreto',
    ],
    dontList: [
      'Não pressione excessivamente',
      'Evite ignorar a objeção',
      'Não pareça desesperado',
      'Não desista na primeira objeção',
    ],
  },

  // =============================================
  // BUNDLE 8: RELATIONSHIP RECOVERY
  // =============================================
  {
    id: 'bundle-relationship-recovery',
    name: 'Recuperação de Relacionamento',
    nameEn: 'Relationship Recovery',
    scenario: 'general',
    description: 'Sequência para recuperar rapport após interação negativa',
    
    discProfiles: ['I', 'S'],
    vakProfiles: ['K', 'A'],
    metaprograms: ['away_from', 'external', 'reactive'],
    
    triggers: ['empathy', 'gift', 'storytelling', 'small_yes', 'belonging'],
    timing: [
      { trigger: 'empathy', delayMinutes: 0, channel: 'same', intensityLevel: 1 },
      { trigger: 'gift', delayMinutes: 1440, channel: 'different', intensityLevel: 1 }, // +1 day
      { trigger: 'storytelling', delayMinutes: 2880, channel: 'different', intensityLevel: 2 }, // +2 days
      { trigger: 'small_yes', delayMinutes: 4320, channel: 'same', intensityLevel: 1 }, // +3 days
      { trigger: 'belonging', delayMinutes: 5760, channel: 'same', intensityLevel: 2 }, // +4 days
    ],
    
    neuralPath: {
      brainSequence: ['limbic', 'limbic', 'limbic', 'neocortex', 'limbic'],
      chemicalFlow: ['oxytocin', 'oxytocin', 'dopamine', 'serotonin', 'oxytocin'],
    },
    
    openingTemplate: '{nome}, percebi que nossa última conversa não foi das melhores. Peço desculpas se pressionei demais.',
    closingTemplate: 'Nossos melhores clientes passaram por momentos difíceis conosco - hoje são parceiros de verdade. Espero que possamos construir isso.',
    
    successRate: 40,
    difficultyLevel: 'expert',
    estimatedDurationMinutes: 4 * 24 * 60, // 4 days
    
    doList: [
      'Assuma responsabilidade genuinamente',
      'Dê tempo antes de retomar contato',
      'Foque em valor, não em venda',
      'Reconstrua confiança gradualmente',
    ],
    dontList: [
      'Nunca culpe o cliente',
      'Evite retomar muito rápido',
      'Não mencione a venda por dias',
      'Não use gatilhos agressivos',
    ],
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================
export function getBundleByScenario(scenario: PersuasionScenario): TriggerBundle | undefined {
  return TRIGGER_BUNDLES.find(b => b.scenario === scenario);
}

export function getBundlesForProfile(
  discProfile?: string,
  vakProfile?: string
): TriggerBundle[] {
  return TRIGGER_BUNDLES.filter(bundle => {
    if (discProfile && !bundle.discProfiles.includes(discProfile as DiscProfileKey)) {
      return false;
    }
    if (vakProfile && !bundle.vakProfiles.includes(vakProfile as 'V' | 'A' | 'K')) {
      return false;
    }
    return true;
  });
}

export function getBundleById(bundleId: string): TriggerBundle | undefined {
  return TRIGGER_BUNDLES.find(b => b.id === bundleId);
}

export function getRecommendedBundle(
  scenario: PersuasionScenario,
  discProfile?: string,
  vakProfile?: string
): TriggerBundle | undefined {
  const scenarioBundle = getBundleByScenario(scenario);
  if (scenarioBundle) {
    // Check if profile matches
    if (discProfile && !scenarioBundle.discProfiles.includes(discProfile as DiscProfileKey)) {
      // Find alternative bundle for the profile
      const alternatives = getBundlesForProfile(discProfile, vakProfile);
      return alternatives[0] || scenarioBundle;
    }
    return scenarioBundle;
  }
  
  // Fallback to profile-based recommendation
  return getBundlesForProfile(discProfile, vakProfile)[0];
}
