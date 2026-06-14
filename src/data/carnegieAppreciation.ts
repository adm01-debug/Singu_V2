// ==============================================
// APPRECIATION TRACKER - DATA
// "Give honest and sincere appreciation" - Dale Carnegie
// ==============================================

import { AppreciationType, AppreciationSuggestion } from '@/types/carnegie';
import type { DiscProfileKey } from '@/types/carnegie-extended';

// ============================================
// APPRECIATION TEMPLATES BY TYPE
// ============================================
export const APPRECIATION_TEMPLATES: Record<AppreciationType, {
  name: string;
  description: string;
  examples: string[];
  whenToUse: string[];
  impact: 'low' | 'medium' | 'high' | 'very_high';
}> = {
  sincere_compliment: {
    name: 'Elogio Sincero',
    description: 'Um elogio genuíno e específico sobre uma qualidade pessoal',
    examples: [
      'Admiro muito sua forma de pensar sobre esse assunto.',
      'Você tem uma energia contagiante que ilumina qualquer conversa.',
      'Sua inteligência emocional é realmente impressionante.',
      'Você tem um dom natural para se conectar com as pessoas.'
    ],
    whenToUse: [
      'Ao iniciar um relacionamento',
      'Quando percebe uma qualidade genuína',
      'Para fortalecer a conexão emocional'
    ],
    impact: 'high'
  },
  
  specific_recognition: {
    name: 'Reconhecimento Específico',
    description: 'Reconhecimento de uma ação ou comportamento específico',
    examples: [
      'A forma como você conduziu aquela reunião foi exemplar.',
      'Aquela sua ideia sobre [X] fez toda a diferença no projeto.',
      'Notei como você lidou com aquela situação difícil - foi muito profissional.',
      'A solução que você encontrou para [X] foi brilhante.'
    ],
    whenToUse: [
      'Após uma ação específica que você presenciou',
      'Quando quer reforçar um comportamento positivo',
      'Para mostrar que você presta atenção'
    ],
    impact: 'very_high'
  },
  
  effort_acknowledgment: {
    name: 'Reconhecimento de Esforço',
    description: 'Valorização do esforço, independente do resultado',
    examples: [
      'Sei o quanto você se dedicou a isso, e isso é admirável.',
      'O esforço que você colocou nisso não passou despercebido.',
      'Mesmo com todos os desafios, você continuou firme - isso é raro.',
      'Seu comprometimento com isso mostra muito sobre quem você é.'
    ],
    whenToUse: [
      'Quando alguém se esforçou muito, mesmo sem resultado perfeito',
      'Em situações desafiadoras',
      'Para motivar após um revés'
    ],
    impact: 'high'
  },
  
  character_praise: {
    name: 'Elogio de Caráter',
    description: 'Reconhecimento de traços de caráter e valores',
    examples: [
      'Sua integridade é algo que admiro profundamente.',
      'Você é uma das pessoas mais honestas que conheço.',
      'Sua lealdade às pessoas que você valoriza é inspiradora.',
      'A forma como você trata todos com respeito diz muito sobre você.'
    ],
    whenToUse: [
      'Após presenciar um ato de integridade',
      'Para fortalecer a relação de confiança',
      'Quando quer comunicar admiração profunda'
    ],
    impact: 'very_high'
  },
  
  achievement_celebration: {
    name: 'Celebração de Conquista',
    description: 'Reconhecimento de uma conquista ou marco alcançado',
    examples: [
      'Parabéns por essa conquista! Você realmente merece.',
      'Esse resultado é fruto do seu trabalho duro - celebre!',
      'Alcançar isso não é para qualquer um - você é excepcional.',
      'Essa vitória é sua, e que venham muitas outras!'
    ],
    whenToUse: [
      'Quando alguém atinge uma meta',
      'Em marcos importantes (promoção, fechamento, etc.)',
      'Para celebrar vitórias pequenas e grandes'
    ],
    impact: 'high'
  },
  
  growth_recognition: {
    name: 'Reconhecimento de Crescimento',
    description: 'Valorização da evolução e desenvolvimento pessoal',
    examples: [
      'Percebo o quanto você evoluiu nos últimos meses.',
      'A mudança em você é visível e inspiradora.',
      'Você realmente cresceu nessa área - é notável.',
      'De onde você começou até onde está agora... que jornada!'
    ],
    whenToUse: [
      'Quando percebe evolução ao longo do tempo',
      'Após alguém superar uma limitação',
      'Para motivar continuidade do desenvolvimento'
    ],
    impact: 'high'
  },
  
  contribution_thanks: {
    name: 'Agradecimento por Contribuição',
    description: 'Gratidão sincera por uma ajuda ou contribuição',
    examples: [
      'Muito obrigado por sua ajuda com [X] - fez toda diferença.',
      'Sua contribuição foi fundamental para o sucesso disso.',
      'Sem você, isso não teria sido possível. Obrigado de verdade.',
      'Agradeço não só pela ajuda, mas pela forma como você a ofereceu.'
    ],
    whenToUse: [
      'Após receber ajuda ou suporte',
      'Quando alguém contribuiu para seu sucesso',
      'Para fortalecer reciprocidade'
    ],
    impact: 'medium'
  },
  
  quality_admiration: {
    name: 'Admiração por Qualidade',
    description: 'Expressão de admiração por uma habilidade ou qualidade específica',
    examples: [
      'Sua habilidade de [X] é realmente admirável.',
      'Fico impressionado toda vez que vejo você fazer [X].',
      'Você tem uma capacidade única de [X] que poucos têm.',
      'Queria ter sua habilidade em [X] - é inspirador.'
    ],
    whenToUse: [
      'Quando presencia uma habilidade excepcional',
      'Para criar rapport através de admiração',
      'Ao identificar pontos fortes únicos'
    ],
    impact: 'medium'
  }
};

// ============================================
// APPRECIATION TIMING GUIDELINES
// ============================================
export const APPRECIATION_TIMING = {
  frequency: {
    ideal: 'Uma apreciação genuína por contato a cada 2-3 interações',
    minimum: 'Pelo menos uma apreciação significativa por mês',
    maximum: 'Evite mais de 2 por interação para manter autenticidade'
  },
  
  moments: [
    {
      name: 'Abertura Aquecida',
      timing: 'Nos primeiros 2 minutos',
      example: 'Sempre bom falar com você - sua energia é contagiante!'
    },
    {
      name: 'Reconhecimento de Insight',
      timing: 'Quando o cliente diz algo interessante',
      example: 'Que observação perspicaz! Nunca tinha pensado por esse ângulo.'
    },
    {
      name: 'Fechamento Positivo',
      timing: 'Nos últimos minutos da interação',
      example: 'Conversas com você são sempre enriquecedoras. Obrigado pelo seu tempo.'
    },
    {
      name: 'Follow-up de Gratidão',
      timing: '24-48h após uma interação positiva',
      example: 'Ainda pensando na nossa conversa de ontem. Muito obrigado pelos insights.'
    }
  ],
  
  pitfalls: [
    'Elogios genéricos que soam falsos',
    'Muitos elogios em sequência (parecem manipulativos)',
    'Elogiar apenas para conseguir algo',
    'Repetir o mesmo elogio várias vezes',
    'Elogiar apenas resultados, nunca processo ou esforço'
  ]
};

// ============================================
// APPRECIATION BY DISC PROFILE
// ============================================
export const APPRECIATION_BY_DISC: Record<DiscProfileKey, {
  preferredTypes: AppreciationType[];
  toneGuidelines: string[];
  examples: string[];
  avoidThis: string[];
}> = {
  D: {
    preferredTypes: ['achievement_celebration', 'specific_recognition', 'effort_acknowledgment'],
    toneGuidelines: [
      'Seja direto e objetivo',
      'Foque em resultados e impacto',
      'Evite elogios muito emocionais',
      'Reconheça competência e eficiência'
    ],
    examples: [
      'Impressionante como você resolveu isso tão rápido.',
      'Seu resultado nesse projeto foi excepcional.',
      'Você é extremamente eficiente - admiro isso.'
    ],
    avoidThis: [
      'Elogios muito longos ou elaborados',
      'Foco excessivo em sentimentos',
      'Comparações com outros'
    ]
  },
  
  I: {
    preferredTypes: ['sincere_compliment', 'quality_admiration', 'character_praise'],
    toneGuidelines: [
      'Seja entusiasta e expressivo',
      'Reconheça sua presença e energia',
      'Valorize suas ideias criativas',
      'Destaque seu impacto nas pessoas'
    ],
    examples: [
      'Sua energia é contagiante! Adoro conversar com você.',
      'Você tem um dom incrível de conectar pessoas.',
      'Suas ideias são sempre tão criativas e inspiradoras!'
    ],
    avoidThis: [
      'Elogios secos ou formais demais',
      'Ignorar aspectos sociais',
      'Foco apenas em números'
    ]
  },
  
  S: {
    preferredTypes: ['contribution_thanks', 'effort_acknowledgment', 'character_praise'],
    toneGuidelines: [
      'Seja caloroso e genuíno',
      'Reconheça lealdade e consistência',
      'Valorize a ajuda aos outros',
      'Demonstre que nota os detalhes do cuidado'
    ],
    examples: [
      'Você é sempre tão prestativo - isso faz toda diferença.',
      'Sua lealdade e consistência são raras e valiosas.',
      'A forma como você cuida das pessoas é inspiradora.'
    ],
    avoidThis: [
      'Elogios em público que causem constrangimento',
      'Exageros que pareçam insinceros',
      'Ignorar contribuições silenciosas'
    ]
  },
  
  C: {
    preferredTypes: ['specific_recognition', 'quality_admiration', 'growth_recognition'],
    toneGuidelines: [
      'Seja específico e detalhado',
      'Reconheça qualidade e precisão',
      'Valorize expertise e conhecimento',
      'Use fatos e dados quando possível'
    ],
    examples: [
      'A precisão da sua análise foi impressionante.',
      'Seu conhecimento técnico é realmente excepcional.',
      'A qualidade do seu trabalho é notavelmente consistente.'
    ],
    avoidThis: [
      'Elogios vagos ou genéricos',
      'Exageros sem fundamento',
      'Foco em aspectos superficiais'
    ]
  }
};

// ============================================
// APPRECIATION GAP ALERTS
// ============================================
export const APPRECIATION_GAP_THRESHOLDS = {
  warning: 14, // dias
  critical: 30, // dias
  
  messages: {
    warning: 'Considere dar uma apreciação sincera a este contato em breve.',
    critical: 'Este contato não recebe apreciação há muito tempo. Priorize um reconhecimento genuíno.',
    suggestion: 'Baseado no histórico, uma apreciação de "%type%" seria bem recebida.'
  }
};

// ============================================
// APPRECIATION FORMULAS (Frameworks)
// ============================================
export const APPRECIATION_FORMULAS = {
  // Specific-Impact-Future (SIF)
  sif: {
    name: 'SIF - Específico, Impacto, Futuro',
    structure: [
      '1. ESPECÍFICO: O que exatamente você admira',
      '2. IMPACTO: Qual diferença isso fez',
      '3. FUTURO: O que isso significa para frente'
    ],
    example: 'A forma como você conduziu aquela negociação (específico) salvou a conta e abriu portas para novos negócios (impacto). Com essa habilidade, você vai longe na carreira (futuro).'
  },
  
  // Notice-Appreciate-Meaning (NAM)
  nam: {
    name: 'NAM - Notar, Apreciar, Significado',
    structure: [
      '1. NOTAR: O que você observou',
      '2. APRECIAR: Sua reação emocional',
      '3. SIGNIFICADO: O que isso diz sobre a pessoa'
    ],
    example: 'Notei como você se ofereceu para ajudar mesmo estando ocupado (notar). Fiquei realmente tocado com sua generosidade (apreciar). Isso mostra muito sobre o tipo de pessoa que você é (significado).'
  },
  
  // What-Why-Wish (WWW)
  www: {
    name: 'WWW - O Quê, Por Quê, Desejo',
    structure: [
      '1. O QUÊ: A qualidade ou ação específica',
      '2. POR QUÊ: Por que isso importa',
      '3. DESEJO: O que você espera/deseja'
    ],
    example: 'Sua honestidade (o quê) é algo que valorizo muito porque é rara hoje em dia (por quê). Espero que saiba que isso te torna uma pessoa especial aos meus olhos (desejo).'
  }
};

// ============================================
// RECIPROCITY INDICATORS
// ============================================
export const RECIPROCITY_INDICATORS = {
  positive: [
    'Retornou com elogio ou agradecimento',
    'Demonstrou emoção positiva (sorriso, surpresa)',
    'Mencionou a apreciação posteriormente',
    'Aumentou abertura na conversa',
    'Ofereceu ajuda ou favor'
  ],
  
  neutral: [
    'Agradeceu educadamente',
    'Continuou a conversa normalmente',
    'Não houve reação visível'
  ],
  
  negative: [
    'Pareceu desconfortável',
    'Minimizou ou rejeitou o elogio',
    'Mudou de assunto abruptamente',
    'Demonstrou desconfiança'
  ]
};

// ============================================
// HELPER FUNCTIONS
// ============================================
export function getAppreciationTemplates(type: AppreciationType): string[] {
  return APPRECIATION_TEMPLATES[type]?.examples || [];
}

export function getAppreciationForDISC(discProfile: DiscProfileKey): {
  preferredTypes: AppreciationType[];
  examples: string[];
} {
  const profile = APPRECIATION_BY_DISC[discProfile];
  return {
    preferredTypes: profile.preferredTypes,
    examples: profile.examples
  };
}

export function generateAppreciationSuggestion(
  contactName: string,
  discProfile: DiscProfileKey,
  daysSinceLast: number
): AppreciationSuggestion | null {
  const profile = APPRECIATION_BY_DISC[discProfile];
  const preferredType = profile.preferredTypes[0];
  const template = APPRECIATION_TEMPLATES[preferredType];
  
  if (!template) return null;
  
  const urgency: 'low' | 'medium' | 'high' = 
    daysSinceLast > APPRECIATION_GAP_THRESHOLDS.critical ? 'high' :
    daysSinceLast > APPRECIATION_GAP_THRESHOLDS.warning ? 'medium' : 'low';
  
  return {
    contactId: '', // To be filled by caller
    contactName,
    type: preferredType,
    reason: `${contactName} não recebe apreciação há ${daysSinceLast} dias. Perfil ${discProfile} responde bem a ${template.name.toLowerCase()}.`,
    template: template.examples[0],
    urgency,
    daysSinceLastAppreciation: daysSinceLast
  };
}
