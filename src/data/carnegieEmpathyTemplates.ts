// ==============================================
// EMPATHY EXPRESSION TEMPLATES - DATA
// "Be sympathetic with the other person's ideas and desires" - Dale Carnegie
// ==============================================

import { EmpathyTemplate, EmpathyType } from '@/types/carnegie-extended';

// ============================================
// EMPATHY TEMPLATES
// ============================================
export const EMPATHY_TEMPLATES: EmpathyTemplate[] = [
  // ============================================
  // VALIDATION
  // ============================================
  {
    id: 'empathy_validation_1',
    type: 'validation',
    name: 'Validação de Sentimentos',
    structure: 'Reconhecer + Normalizar + Apoiar',
    examples: [
      'Faz todo sentido você se sentir assim. Qualquer pessoa na sua situação sentiria o mesmo.',
      'Sua preocupação é completamente válida. Isso mostra que você está prestando atenção ao que importa.',
      'É natural sentir isso. Você está sendo sensato ao considerar todos os aspectos.'
    ],
    whenToUse: [
      'Quando o cliente expressa preocupação ou dúvida',
      'Quando há resistência ou hesitação',
      'Para abrir espaço para diálogo honesto'
    ],
    discVariation: {
      D: 'Sua cautela mostra que você analisa bem antes de agir. Isso é inteligência.',
      I: 'Entendo totalmente! É normal se sentir assim - você não está sozinho nisso.',
      S: 'Sua preocupação com o impacto nos outros mostra o quanto você se importa.',
      C: 'Faz sentido querer mais dados antes de decidir. É uma abordagem prudente.'
    }
  },
  {
    id: 'empathy_validation_2',
    type: 'validation',
    name: 'Validação de Perspectiva',
    structure: 'Entender + Respeitar + Explorar',
    examples: [
      'Vejo exatamente por que você pensa assim. Sua perspectiva faz muito sentido dado o contexto.',
      'Entendo sua posição. Com sua experiência, é natural chegar a essa conclusão.',
      'Seu ponto de vista é muito válido. Deixa eu compartilhar outra perspectiva complementar...'
    ],
    whenToUse: [
      'Quando discorda mas quer manter rapport',
      'Antes de apresentar alternativa',
      'Para clientes que se sentem não ouvidos'
    ],
    discVariation: {
      D: 'Entendo seu raciocínio. Você está certo em considerar isso.',
      I: 'Adorei sua perspectiva! Isso abre novas possibilidades.',
      S: 'Você sempre pensa em todos os envolvidos, né? Isso é admirável.',
      C: 'Sua análise é coerente. Vamos adicionar mais um dado a considerar...'
    }
  },
  
  // ============================================
  // MIRRORING
  // ============================================
  {
    id: 'empathy_mirror_1',
    type: 'mirroring',
    name: 'Espelhamento Emocional',
    structure: 'Observar + Refletir + Conectar',
    examples: [
      'Parece que isso realmente te incomoda, né?',
      'Percebo que você está empolgado com essa possibilidade!',
      'Vejo que esse ponto é muito importante para você.'
    ],
    whenToUse: [
      'Para demonstrar que está atento',
      'Para aprofundar a conexão',
      'Quando percebe emoção não verbalizada'
    ],
    discVariation: {
      D: 'Percebo que você quer resolver isso logo. Vamos direto ao ponto.',
      I: 'Você está animado com isso! Adoro sua energia!',
      S: 'Vejo que você quer garantir que todos fiquem bem com isso.',
      C: 'Parece que você quer entender todos os detalhes antes, certo?'
    }
  },
  
  // ============================================
  // NORMALIZATION
  // ============================================
  {
    id: 'empathy_normalize_1',
    type: 'normalization',
    name: 'Normalização da Experiência',
    structure: 'Reconhecer + Contextualizar + Universalizar',
    examples: [
      'Muitos clientes passam por isso no início. É completamente normal.',
      'Essa dúvida aparece em 90% dos casos. Você está em boa companhia.',
      'Todo mundo que chegou onde você está passou por esse mesmo questionamento.'
    ],
    whenToUse: [
      'Para reduzir ansiedade ou vergonha',
      'Quando cliente se sente "atrasado" ou "diferente"',
      'Para criar senso de comunidade'
    ],
    discVariation: {
      D: 'Líderes como você frequentemente fazem essa mesma pergunta. É sinal de visão.',
      I: 'Muita gente passa por isso! Você não está sozinho - e vai dar tudo certo!',
      S: 'É natural ter essa preocupação. Sua equipe vai agradecer sua cautela.',
      C: 'Os melhores profissionais fazem essa análise. É uma dúvida inteligente.'
    }
  },
  
  // ============================================
  // UNDERSTANDING
  // ============================================
  {
    id: 'empathy_understand_1',
    type: 'understanding',
    name: 'Compreensão Profunda',
    structure: 'Ouvir + Parafrasear + Confirmar',
    examples: [
      'Deixa eu ver se entendi: você está preocupado com [X] porque [Y]. É isso?',
      'Se entendi corretamente, seu principal desafio é [paráfrase]. Estou certo?',
      'Então, o que mais importa para você nessa decisão é [resumo]. Correto?'
    ],
    whenToUse: [
      'Para confirmar entendimento',
      'Quando a situação é complexa',
      'Para mostrar escuta ativa'
    ],
    discVariation: {
      D: 'Resumindo: você quer [resultado], certo?',
      I: 'Então você quer [experiência positiva]? Adorei!',
      S: 'Entendi que você precisa de [segurança/estabilidade]. Vou cuidar disso.',
      C: 'Deixa eu recapitular os pontos: [lista detalhada]. Algo faltou?'
    }
  },
  
  // ============================================
  // SUPPORT
  // ============================================
  {
    id: 'empathy_support_1',
    type: 'support',
    name: 'Oferecimento de Suporte',
    structure: 'Reconhecer desafio + Oferecer ajuda + Empoderar',
    examples: [
      'Sei que isso não é fácil. Estou aqui para te ajudar no que precisar.',
      'Você está enfrentando um desafio real. Vamos resolver juntos.',
      'Não precisa lidar com isso sozinho. Conte comigo.'
    ],
    whenToUse: [
      'Quando cliente está sobrecarregado',
      'Para fortalecer relação de parceria',
      'Em momentos de vulnerabilidade'
    ],
    discVariation: {
      D: 'Isso é desafiador, mas você tem capacidade de resolver. Posso ajudar com [X].',
      I: 'Ei, estamos juntos nisso! Vai dar certo, vamos fazer acontecer!',
      S: 'Estou aqui para o que você precisar. Não tenha pressa, vamos no seu ritmo.',
      C: 'Posso fornecer mais dados ou análises que ajudem. O que seria útil?'
    }
  },
  
  // ============================================
  // SHARED EXPERIENCE
  // ============================================
  {
    id: 'empathy_shared_1',
    type: 'shared_experience',
    name: 'Experiência Compartilhada',
    structure: 'Conectar + Compartilhar + Solidarizar',
    examples: [
      'Já passei por algo parecido e sei como é.',
      'Entendo perfeitamente - já estive nessa situação.',
      'Isso me lembra de quando eu enfrentei [situação similar].'
    ],
    whenToUse: [
      'Para criar conexão através de vulnerabilidade',
      'Quando tem experiência genuinamente similar',
      'Para reduzir distância vendedor-cliente'
    ],
    discVariation: {
      D: 'Também já enfrentei esse tipo de decisão. O que funcionou foi [ação].',
      I: 'Já passei por isso! E sabe o que me ajudou? [história inspiradora]',
      S: 'Entendo totalmente. Quando passei por isso, o que me acalmou foi [processo].',
      C: 'Tive situação similar. A análise que fiz foi [metodologia].'
    }
  }
];

// ============================================
// EMPATHY PHRASES BY SITUATION
// ============================================
export const EMPATHY_PHRASES: Record<string, string[]> = {
  preocupação: [
    'Entendo sua preocupação.',
    'Faz sentido você se preocupar com isso.',
    'Sua cautela é compreensível.'
  ],
  frustração: [
    'Imagino como deve ser frustrante.',
    'Entendo por que você está frustrado.',
    'Isso realmente é irritante, né?'
  ],
  dúvida: [
    'É natural ter dúvidas.',
    'Faz sentido querer ter certeza.',
    'Sua pergunta é muito válida.'
  ],
  medo: [
    'Entendo o receio.',
    'É normal sentir isso diante de algo novo.',
    'Sua cautela mostra sabedoria.'
  ],
  entusiasmo: [
    'Que bom que você está animado!',
    'Adoro sua empolgação!',
    'Isso é muito empolgante mesmo!'
  ],
  estresse: [
    'Sei que você está sob pressão.',
    'Deve estar sendo um período intenso.',
    'É muito para lidar, né?'
  ],
  decepção: [
    'Lamento que tenha sido assim.',
    'Entendo a decepção.',
    'Isso não era o que você esperava, né?'
  ]
};

// ============================================
// EMPATHY DETECTION PATTERNS
// ============================================
export const EMPATHY_DETECTION = {
  positive: [
    /entendo (como|sua|seu|que)/i,
    /compreendo/i,
    /faz sentido/i,
    /imagino (como|que)/i,
    /deve ser (difícil|frustrante|desafiador)/i,
    /é natural/i,
    /é normal/i,
    /você tem razão/i
  ],
  negative: [
    /mas você/i,
    /você deveria/i,
    /não é bem assim/i,
    /você está errado/i,
    /isso não faz sentido/i
  ]
};

// ============================================
// HELPER FUNCTIONS
// ============================================
export function getEmpathyTemplatesByType(type: EmpathyType): EmpathyTemplate[] {
  return EMPATHY_TEMPLATES.filter(t => t.type === type);
}

export function getEmpathyForSituation(situation: string): string[] {
  return EMPATHY_PHRASES[situation] || EMPATHY_PHRASES.preocupação;
}

export function analyzeEmpathyInText(text: string): {
  empathyScore: number;
  empathyStatements: string[];
  missedMoments: string[];
} {
  const empathyStatements: string[] = [];
  let empathyScore = 50; // Start neutral
  
  // Check for positive empathy patterns
  for (const pattern of EMPATHY_DETECTION.positive) {
    const match = text.match(pattern);
    if (match) {
      empathyStatements.push(match[0]);
      empathyScore += 10;
    }
  }
  
  // Check for negative patterns (reduce score)
  for (const pattern of EMPATHY_DETECTION.negative) {
    if (pattern.test(text)) {
      empathyScore -= 15;
    }
  }
  
  // Identify missed moments
  const missedMoments: string[] = [];
  if (!text.match(/entendo/i) && text.includes('?')) {
    missedMoments.push('Poderia validar sentimentos antes de responder');
  }
  if (text.match(/mas/i) && !text.match(/entendo.*mas/i)) {
    missedMoments.push('Use "E" em vez de "Mas" para manter conexão');
  }
  
  return {
    empathyScore: Math.min(100, Math.max(0, empathyScore)),
    empathyStatements,
    missedMoments
  };
}

export function getEmpathyTemplateForDISC(
  type: EmpathyType, 
  discProfile: 'D' | 'I' | 'S' | 'C'
): string {
  const template = EMPATHY_TEMPLATES.find(t => t.type === type);
  return template?.discVariation[discProfile] || template?.examples[0] || '';
}
