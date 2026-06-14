// ==============================================
// NOBLE CAUSE TRIGGER - DATA
// "Appeal to nobler motives" - Dale Carnegie
// ==============================================

import { NobleCause, NobleCauseTemplate } from '@/types/carnegie';

export const NOBLE_CAUSES: NobleCause[] = [
  // ============================================
  // ALTRUISM - Helping Others
  // ============================================
  {
    id: 'altruism_community',
    name: 'Impacto na Comunidade',
    category: 'altruism',
    description: 'O desejo de fazer diferença positiva na comunidade e sociedade',
    emotionalAppeal: 'Você tem o poder de transformar vidas ao seu redor',
    keywords: [
      'ajudar', 'comunidade', 'impacto social', 'fazer diferença', 'contribuir',
      'melhorar vidas', 'transformar', 'responsabilidade social', 'retribuir',
      'próximo', 'sociedade', 'bem comum', 'solidariedade'
    ],
    templates: [
      {
        id: 'altruism_community_1',
        causeId: 'altruism_community',
        opening: 'Sei que você se preocupa genuinamente com as pessoas ao seu redor...',
        bridge: 'E é exatamente por isso que esta solução faz tanto sentido para alguém como você...',
        callToAction: 'Imagine o impacto positivo que isso vai gerar na vida das pessoas que você ajuda.',
        emotionalHook: 'Você não está apenas tomando uma decisão de negócio, está criando um legado de transformação.'
      },
      {
        id: 'altruism_community_2',
        causeId: 'altruism_community',
        opening: 'Pessoas como você são raras - aquelas que realmente pensam no impacto das suas ações...',
        bridge: 'Essa preocupação genuína com os outros é o que diferencia líderes de seguidores...',
        callToAction: 'Com isso em mãos, você vai poder multiplicar o bem que já faz.',
        emotionalHook: 'Cada decisão sua é uma oportunidade de tocar positivamente a vida de alguém.'
      }
    ],
    intensity: 4,
    discCompatibility: { D: 60, I: 90, S: 95, C: 70 }
  },
  {
    id: 'altruism_helping',
    name: 'Servir aos Outros',
    category: 'altruism',
    description: 'A satisfação profunda de ajudar pessoas em suas jornadas',
    emotionalAppeal: 'Sua ajuda pode ser exatamente o que alguém precisa neste momento',
    keywords: [
      'servir', 'apoiar', 'auxiliar', 'facilitar', 'orientar', 'guiar',
      'amparar', 'socorrer', 'assistir', 'cuidar', 'proteger'
    ],
    templates: [
      {
        id: 'altruism_helping_1',
        causeId: 'altruism_helping',
        opening: 'Você tem um dom natural para ajudar pessoas...',
        bridge: 'E quando você tem as ferramentas certas, esse dom se multiplica...',
        callToAction: 'Pense em quantas pessoas mais você vai poder impactar com isso.',
        emotionalHook: 'Ajudar os outros não é apenas o que você faz - é quem você é.'
      }
    ],
    intensity: 5,
    discCompatibility: { D: 50, I: 85, S: 100, C: 65 }
  },

  // ============================================
  // LEGACY - Leaving a Mark
  // ============================================
  {
    id: 'legacy_future',
    name: 'Legado para o Futuro',
    category: 'legacy',
    description: 'O desejo de construir algo que perdure além de si mesmo',
    emotionalAppeal: 'O que você constrói hoje será lembrado por gerações',
    keywords: [
      'legado', 'futuro', 'gerações', 'duradouro', 'permanente', 'história',
      'marca', 'memória', 'construir', 'deixar', 'perpetuar', 'eternizar'
    ],
    templates: [
      {
        id: 'legacy_future_1',
        causeId: 'legacy_future',
        opening: 'Pessoas visionárias como você pensam além do momento presente...',
        bridge: 'Você não está apenas resolvendo um problema de hoje - está construindo para amanhã...',
        callToAction: 'Esta decisão vai fazer parte da história que você está escrevendo.',
        emotionalHook: 'Daqui a 10 anos, você vai olhar para trás e ver este momento como um ponto de virada.'
      },
      {
        id: 'legacy_future_2',
        causeId: 'legacy_future',
        opening: 'Você já pensou no que vai deixar para as próximas gerações?',
        bridge: 'As escolhas que fazemos hoje definem o mundo de amanhã...',
        callToAction: 'Faça parte de algo maior que você mesmo.',
        emotionalHook: 'Seu legado começa com as decisões que você toma agora.'
      }
    ],
    intensity: 5,
    discCompatibility: { D: 95, I: 75, S: 70, C: 80 }
  },
  {
    id: 'legacy_children',
    name: 'Exemplo para os Filhos',
    category: 'legacy',
    description: 'O desejo de ser modelo e inspiração para os filhos',
    emotionalAppeal: 'Seus filhos estão observando e aprendendo com você',
    keywords: [
      'filhos', 'crianças', 'exemplo', 'modelo', 'ensinar', 'mostrar',
      'família', 'herança', 'valores', 'princípios', 'educação'
    ],
    templates: [
      {
        id: 'legacy_children_1',
        causeId: 'legacy_children',
        opening: 'Como pai/mãe, você sabe que suas ações falam mais alto que palavras...',
        bridge: 'Seus filhos estão observando como você toma decisões importantes...',
        callToAction: 'Mostre a eles o que significa agir com visão e coragem.',
        emotionalHook: 'O maior presente que você pode dar aos seus filhos é o exemplo.'
      }
    ],
    intensity: 5,
    discCompatibility: { D: 70, I: 80, S: 100, C: 75 }
  },

  // ============================================
  // FAMILY - Protecting Loved Ones
  // ============================================
  {
    id: 'family_security',
    name: 'Segurança da Família',
    category: 'family',
    description: 'O instinto de proteger e prover para a família',
    emotionalAppeal: 'Sua família conta com você para mantê-los seguros',
    keywords: [
      'família', 'segurança', 'proteção', 'lar', 'esposa', 'marido',
      'pais', 'avós', 'parentes', 'provedor', 'cuidar', 'sustentar'
    ],
    templates: [
      {
        id: 'family_security_1',
        causeId: 'family_security',
        opening: 'Você trabalha duro todos os dias por aqueles que ama...',
        bridge: 'E garantir a segurança deles é sua prioridade número um...',
        callToAction: 'Isso vai dar a você a tranquilidade de saber que sua família está protegida.',
        emotionalHook: 'Não existe amor maior do que garantir o bem-estar de quem amamos.'
      },
      {
        id: 'family_security_2',
        causeId: 'family_security',
        opening: 'Quando você pensa na sua família, o que vem primeiro?',
        bridge: 'A segurança e o bem-estar deles são inegociáveis...',
        callToAction: 'Dê a eles a proteção que merecem.',
        emotionalHook: 'Família é o motivo pelo qual fazemos tudo isso.'
      }
    ],
    intensity: 5,
    discCompatibility: { D: 75, I: 70, S: 100, C: 80 }
  },
  {
    id: 'family_quality_time',
    name: 'Tempo com a Família',
    category: 'family',
    description: 'O desejo de ter mais tempo de qualidade com entes queridos',
    emotionalAppeal: 'Tempo com a família é o bem mais precioso',
    keywords: [
      'tempo', 'qualidade', 'momentos', 'presença', 'estar junto',
      'aproveitar', 'curtir', 'férias', 'lazer', 'diversão', 'memórias'
    ],
    templates: [
      {
        id: 'family_quality_time_1',
        causeId: 'family_quality_time',
        opening: 'O tempo passa rápido, e os momentos com a família são preciosos...',
        bridge: 'Você merece ter mais desses momentos, não menos...',
        callToAction: 'Imagine ter mais tempo livre para estar com quem você ama.',
        emotionalHook: 'No final, são os momentos juntos que realmente importam.'
      }
    ],
    intensity: 4,
    discCompatibility: { D: 60, I: 85, S: 100, C: 70 }
  },

  // ============================================
  // PURPOSE - Greater Meaning
  // ============================================
  {
    id: 'purpose_meaning',
    name: 'Propósito de Vida',
    category: 'purpose',
    description: 'A busca por significado e propósito maior',
    emotionalAppeal: 'Você está aqui para algo muito maior',
    keywords: [
      'propósito', 'sentido', 'significado', 'missão', 'chamado', 'vocação',
      'destino', 'razão', 'por quê', 'para quê', 'motivação maior'
    ],
    templates: [
      {
        id: 'purpose_meaning_1',
        causeId: 'purpose_meaning',
        opening: 'Pessoas como você não fazem as coisas por acaso...',
        bridge: 'Há um propósito maior guiando suas escolhas...',
        callToAction: 'Isso se alinha perfeitamente com o que você está construindo.',
        emotionalHook: 'Quando você age de acordo com seu propósito, tudo faz sentido.'
      },
      {
        id: 'purpose_meaning_2',
        causeId: 'purpose_meaning',
        opening: 'Você já se perguntou por que algumas decisões parecem tão certas?',
        bridge: 'É porque elas estão alinhadas com quem você realmente é...',
        callToAction: 'Siga o que faz sentido para você.',
        emotionalHook: 'Seu propósito não é algo que você encontra - é algo que você cria.'
      }
    ],
    intensity: 5,
    discCompatibility: { D: 85, I: 90, S: 75, C: 80 }
  },

  // ============================================
  // GROWTH - Personal Development
  // ============================================
  {
    id: 'growth_potential',
    name: 'Realização do Potencial',
    category: 'growth',
    description: 'O desejo de se tornar a melhor versão de si mesmo',
    emotionalAppeal: 'Você tem um potencial imenso esperando para ser liberado',
    keywords: [
      'crescer', 'evoluir', 'melhorar', 'desenvolver', 'potencial', 'capacidade',
      'habilidade', 'aprender', 'progredir', 'avançar', 'superar', 'transformar'
    ],
    templates: [
      {
        id: 'growth_potential_1',
        causeId: 'growth_potential',
        opening: 'Você não é do tipo que se acomoda - sempre busca crescer...',
        bridge: 'E cada desafio é uma oportunidade de se tornar ainda melhor...',
        callToAction: 'Isso vai acelerar sua jornada de desenvolvimento.',
        emotionalHook: 'A melhor versão de você está sempre um passo à frente.'
      }
    ],
    intensity: 4,
    discCompatibility: { D: 90, I: 85, S: 65, C: 80 }
  },
  {
    id: 'growth_learning',
    name: 'Aprendizado Contínuo',
    category: 'growth',
    description: 'A paixão por aprender e adquirir novos conhecimentos',
    emotionalAppeal: 'O conhecimento é o único bem que ninguém pode tirar de você',
    keywords: [
      'aprender', 'conhecimento', 'estudo', 'curso', 'formação', 'capacitação',
      'educação', 'descobrir', 'entender', 'compreender', 'dominar'
    ],
    templates: [
      {
        id: 'growth_learning_1',
        causeId: 'growth_learning',
        opening: 'Sua sede de conhecimento é admirável...',
        bridge: 'Quanto mais você aprende, mais capaz você se torna...',
        callToAction: 'Isso vai expandir seus horizontes de formas que você nem imagina.',
        emotionalHook: 'Investir em conhecimento é investir em você mesmo.'
      }
    ],
    intensity: 4,
    discCompatibility: { D: 70, I: 75, S: 70, C: 100 }
  },

  // ============================================
  // JUSTICE - Fairness and Ethics
  // ============================================
  {
    id: 'justice_fairness',
    name: 'Justiça e Equidade',
    category: 'justice',
    description: 'O compromisso com o que é certo e justo',
    emotionalAppeal: 'Fazer o que é certo nem sempre é fácil, mas sempre vale a pena',
    keywords: [
      'justo', 'correto', 'ético', 'honesto', 'íntegro', 'princípios',
      'valores', 'moral', 'transparente', 'verdade', 'equidade'
    ],
    templates: [
      {
        id: 'justice_fairness_1',
        causeId: 'justice_fairness',
        opening: 'Você é alguém que valoriza a integridade acima de tudo...',
        bridge: 'E é exatamente isso que torna você confiável...',
        callToAction: 'Esta é uma decisão alinhada com seus valores mais profundos.',
        emotionalHook: 'Quando dormimos com a consciência tranquila, nenhum sucesso é vazio.'
      }
    ],
    intensity: 4,
    discCompatibility: { D: 75, I: 70, S: 85, C: 95 }
  },

  // ============================================
  // INNOVATION - Creating Change
  // ============================================
  {
    id: 'innovation_change',
    name: 'Inovação e Mudança',
    category: 'innovation',
    description: 'O impulso de criar, inovar e transformar o status quo',
    emotionalAppeal: 'Os que mudam o mundo são aqueles que ousam ser diferentes',
    keywords: [
      'inovar', 'criar', 'mudar', 'transformar', 'revolucionar', 'disruptar',
      'diferente', 'novo', 'original', 'pioneiro', 'vanguarda', 'tendência'
    ],
    templates: [
      {
        id: 'innovation_change_1',
        causeId: 'innovation_change',
        opening: 'Você não segue tendências - você as cria...',
        bridge: 'Pessoas como você são as que realmente movem o mundo para frente...',
        callToAction: 'Seja o primeiro a dar esse passo.',
        emotionalHook: 'A história é escrita por aqueles que ousam ser diferentes.'
      },
      {
        id: 'innovation_change_2',
        causeId: 'innovation_change',
        opening: 'Enquanto outros seguem o caminho seguro, você busca o novo...',
        bridge: 'E é essa mentalidade inovadora que te diferencia...',
        callToAction: 'Lidere essa mudança antes que outros percebam a oportunidade.',
        emotionalHook: 'Inovar é a forma mais pura de criar valor no mundo.'
      }
    ],
    intensity: 4,
    discCompatibility: { D: 95, I: 90, S: 50, C: 75 }
  },

  // ============================================
  // COMMUNITY - Belonging
  // ============================================
  {
    id: 'community_belonging',
    name: 'Senso de Pertencimento',
    category: 'community',
    description: 'O desejo de fazer parte de algo maior, uma tribo',
    emotionalAppeal: 'Você não está sozinho - faz parte de uma comunidade',
    keywords: [
      'comunidade', 'grupo', 'tribo', 'pertencer', 'conexão', 'rede',
      'parceria', 'aliança', 'junto', 'coletivo', 'movimento'
    ],
    templates: [
      {
        id: 'community_belonging_1',
        causeId: 'community_belonging',
        opening: 'Fazer parte de algo maior do que nós mesmos é uma das experiências mais poderosas...',
        bridge: 'E quando nos conectamos com pessoas que pensam como nós...',
        callToAction: 'Junte-se a outros que compartilham dessa visão.',
        emotionalHook: 'Juntos, somos muito mais fortes do que sozinhos.'
      }
    ],
    intensity: 4,
    discCompatibility: { D: 55, I: 100, S: 90, C: 60 }
  }
];

// ============================================
// DETECTION KEYWORDS BY CATEGORY
// ============================================
export const NOBLE_CAUSE_KEYWORDS = {
  altruism: [
    'ajudar', 'outros', 'pessoas', 'comunidade', 'impacto', 'diferença',
    'contribuir', 'servir', 'apoiar', 'voluntário', 'causa', 'social',
    'próximo', 'solidariedade', 'caridade', 'doação', 'benevolente'
  ],
  legacy: [
    'legado', 'futuro', 'gerações', 'filhos', 'história', 'marca',
    'lembrado', 'construir', 'duradouro', 'permanente', 'herança',
    'eternizar', 'perpetuar', 'memória'
  ],
  family: [
    'família', 'filhos', 'esposa', 'marido', 'pais', 'avós', 'lar',
    'casa', 'segurança', 'proteção', 'juntos', 'amor', 'cuidar',
    'prover', 'sustentar'
  ],
  purpose: [
    'propósito', 'missão', 'sentido', 'significado', 'chamado', 'vocação',
    'destino', 'razão', 'motivação', 'por quê', 'objetivo maior'
  ],
  growth: [
    'crescer', 'evoluir', 'melhorar', 'aprender', 'desenvolver', 'potencial',
    'capacidade', 'habilidade', 'progresso', 'avanço', 'superação'
  ],
  justice: [
    'justo', 'correto', 'ético', 'honesto', 'íntegro', 'valores',
    'princípios', 'moral', 'verdade', 'transparência', 'equidade'
  ],
  innovation: [
    'inovar', 'criar', 'mudar', 'transformar', 'novo', 'diferente',
    'pioneiro', 'vanguarda', 'revolucionar', 'disruptar', 'original'
  ],
  community: [
    'comunidade', 'grupo', 'tribo', 'pertencer', 'juntos', 'coletivo',
    'movimento', 'parceria', 'aliança', 'rede', 'conexão'
  ]
};

// ============================================
// NOBLE CAUSE INTENSITY PHRASES
// ============================================
export const NOBLE_CAUSE_INTENSIFIERS = {
  low: [
    'é bom', 'seria legal', 'talvez', 'quem sabe', 'pode ser'
  ],
  medium: [
    'é importante', 'faz diferença', 'vale a pena', 'preciso', 'quero'
  ],
  high: [
    'é fundamental', 'é essencial', 'não posso deixar de', 'tenho que',
    'é minha missão', 'é meu dever', 'acredito profundamente'
  ],
  extreme: [
    'é minha vida', 'vivo para isso', 'nasceu para', 'é minha razão de existir',
    'dedicar tudo', 'sacrificaria por', 'morreria por'
  ]
};

// ============================================
// HELPER FUNCTIONS
// ============================================
export function getNobleCausesByCategory(category: NobleCause['category']): NobleCause[] {
  return NOBLE_CAUSES.filter(cause => cause.category === category);
}

export function getNobleCausesByDISC(discProfile: 'D' | 'I' | 'S' | 'C'): NobleCause[] {
  return [...NOBLE_CAUSES].sort((a, b) => 
    b.discCompatibility[discProfile] - a.discCompatibility[discProfile]
  );
}

export function getRandomTemplate(causeId: string): NobleCauseTemplate | null {
  const cause = NOBLE_CAUSES.find(c => c.id === causeId);
  if (!cause || cause.templates.length === 0) return null;
  // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
  return cause.templates[Math.floor(Math.random() * cause.templates.length)];
}
