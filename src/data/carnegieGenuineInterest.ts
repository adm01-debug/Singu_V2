// ==============================================
// GENUINE INTEREST TRACKER - DATA
// "Become genuinely interested in other people" - Dale Carnegie
// ==============================================

import { InterestIndicator } from '@/types/carnegie-extended';

type InterestLevel = 'low' | 'moderate' | 'high' | 'exceptional';

// ============================================
// INTEREST INDICATORS
// ============================================
export const INTEREST_INDICATORS: InterestIndicator[] = [
  {
    type: 'question_asked',
    description: 'Perguntas feitas sobre a pessoa, não apenas sobre negócios',
    example: 'Como foi seu final de semana?',
    weight: 2
  },
  {
    type: 'follow_up',
    description: 'Perguntas de acompanhamento mostrando que ouviu',
    example: 'Você mencionou seu filho antes - como ele está?',
    weight: 3
  },
  {
    type: 'memory_reference',
    description: 'Referências a conversas anteriores',
    example: 'Lembro que você tinha aquele projeto importante...',
    weight: 4
  },
  {
    type: 'active_listening',
    description: 'Sinais verbais de escuta ativa',
    example: 'Interessante! Me conte mais sobre isso.',
    weight: 2
  },
  {
    type: 'personal_detail',
    description: 'Menção de detalhes pessoais que você lembrou',
    example: 'Sei que você é fã do Flamengo - viu o jogo?',
    weight: 4
  }
];

// ============================================
// GENUINE INTEREST PATTERNS
// ============================================
export const GENUINE_INTEREST_PATTERNS = {
  questions: {
    personal: [
      /como (está|foi|vai|anda)/i,
      /me (conte|fale|diga) (mais )?sobre/i,
      /o que você acha/i,
      /qual sua opinião/i,
      /como você se sente/i,
      /o que te (motiva|inspira)/i
    ],
    follow_up: [
      /você mencionou/i,
      /sobre (aquilo|isso) que você (disse|falou)/i,
      /lembro que você/i,
      /na última vez/i,
      /voltando ao que você disse/i
    ],
    exploratory: [
      /por que você/i,
      /o que te levou/i,
      /como você chegou/i,
      /me ajude a entender/i,
      /pode me explicar/i
    ]
  },
  
  listening: {
    acknowledgment: [
      /entendo/i, /compreendo/i, /faz sentido/i, /interessante/i,
      /uhum/i, /sei/i, /claro/i, /certo/i
    ],
    reflection: [
      /então você/i, /ou seja/i, /em outras palavras/i,
      /se entendi bem/i, /deixa eu ver se entendi/i
    ],
    empathy: [
      /imagino/i, /deve ser/i, /entendo como/i,
      /compreendo sua/i, /faz sentido você/i
    ]
  }
};

// ============================================
// INTEREST DEMONSTRATION TECHNIQUES
// ============================================
export const INTEREST_TECHNIQUES = {
  before_meeting: [
    {
      technique: 'Pesquise sobre a pessoa antes',
      examples: [
        'Olhe o LinkedIn e encontre pontos em comum',
        'Verifique publicações ou artigos que a pessoa escreveu',
        'Conheça hobbies e interesses mencionados nas redes sociais'
      ]
    },
    {
      technique: 'Prepare perguntas pessoais genuínas',
      examples: [
        'Vi que você é de [cidade] - como é viver lá?',
        'Notei que você gosta de [hobby] - como começou?',
        'Seu artigo sobre [tema] foi interessante - o que te inspirou?'
      ]
    }
  ],
  
  during_conversation: [
    {
      technique: 'Faça perguntas sobre a pessoa, não só sobre negócios',
      examples: [
        'Antes de falarmos de trabalho, como você está?',
        'O que você está achando do home office?',
        'Tem conseguido equilibrar trabalho e vida pessoal?'
      ]
    },
    {
      technique: 'Use o nome da pessoa com frequência',
      examples: [
        'João, isso que você disse é muito importante',
        'Maria, quero entender melhor sua perspectiva',
        'Carlos, sua experiência nessa área é valiosa'
      ]
    },
    {
      technique: 'Peça conselhos e opiniões',
      examples: [
        'O que você faria no meu lugar?',
        'Qual sua recomendação sobre isso?',
        'Como você vê essa situação?'
      ]
    },
    {
      technique: 'Demonstre curiosidade com follow-ups',
      examples: [
        'Interessante! Me conte mais...',
        'E o que aconteceu depois?',
        'Como você se sentiu com isso?'
      ]
    }
  ],
  
  after_conversation: [
    {
      technique: 'Anote detalhes pessoais para lembrar depois',
      examples: [
        'Nome dos filhos, hobbies, times que torce',
        'Projetos importantes mencionados',
        'Preocupações e desejos expressos'
      ]
    },
    {
      technique: 'Faça follow-up sobre temas pessoais',
      examples: [
        'Lembrei de você quando vi [algo relacionado ao hobby]',
        'Como foi aquele evento que você ia participar?',
        'Seu projeto deve estar finalizado - como foi?'
      ]
    }
  ]
};

// ============================================
// INTEREST SCORE CALCULATION
// ============================================
export const INTEREST_SCORING = {
  components: {
    questionsAsked: { weight: 0.20, max: 5 },
    followUpsMade: { weight: 0.25, max: 3 },
    memoryReferences: { weight: 0.30, max: 2 },
    activeListeningSignals: { weight: 0.15, max: 5 },
    personalDetailsRemembered: { weight: 0.10, max: 3 }
  },
  
  levels: {
    low: { min: 0, max: 30, description: 'Demonstra pouco interesse genuíno' },
    moderate: { min: 31, max: 60, description: 'Interesse adequado, pode melhorar' },
    high: { min: 61, max: 85, description: 'Bom nível de interesse genuíno' },
    exceptional: { min: 86, max: 100, description: 'Interesse genuíno exemplar' }
  }
};

// ============================================
// SUGGESTIONS BY LEVEL
// ============================================
export const INTEREST_SUGGESTIONS: Record<InterestLevel, string[]> = {
  low: [
    'Comece cada interação com uma pergunta pessoal genuína',
    'Anote pelo menos 3 detalhes pessoais sobre cada cliente',
    'Pesquise sobre a pessoa antes de reuniões importantes',
    'Pergunte sobre família, hobbies, sonhos - não só sobre negócios',
    'Use o nome da pessoa pelo menos 3x por conversa'
  ],
  moderate: [
    'Aumente as perguntas de follow-up: "Me conte mais..."',
    'Faça referências a conversas anteriores',
    'Pergunte sobre projetos pessoais mencionados antes',
    'Demonstre que lembra de detalhes importantes'
  ],
  high: [
    'Continue mantendo o nível atual',
    'Experimente conexões mais profundas sobre valores e sonhos',
    'Compartilhe também aspectos pessoais seus para criar reciprocidade'
  ],
  exceptional: [
    'Você é um exemplo de interesse genuíno!',
    'Considere ensinar outros sobre suas técnicas',
    'Continue cultivando esse dom natural'
  ]
};

// ============================================
// HELPER FUNCTIONS
// ============================================
export function countInterestIndicators(text: string): Record<string, number> {
  const counts: Record<string, number> = {
    questionsAsked: 0,
    followUpsMade: 0,
    memoryReferences: 0,
    activeListeningSignals: 0,
    personalDetailsRemembered: 0
  };
  
  // Count personal questions
  for (const pattern of GENUINE_INTEREST_PATTERNS.questions.personal) {
    const matches = text.match(pattern);
    if (matches) counts.questionsAsked += matches.length;
  }
  
  // Count follow-ups
  for (const pattern of GENUINE_INTEREST_PATTERNS.questions.follow_up) {
    const matches = text.match(pattern);
    if (matches) counts.followUpsMade += matches.length;
  }
  
  // Count listening signals
  for (const pattern of GENUINE_INTEREST_PATTERNS.listening.acknowledgment) {
    const matches = text.match(pattern);
    if (matches) counts.activeListeningSignals += matches.length;
  }
  
  return counts;
}

export function calculateInterestScore(counts: Record<string, number>): number {
  let score = 0;
  
  for (const [key, config] of Object.entries(INTEREST_SCORING.components)) {
    const count = counts[key] || 0;
    const normalizedCount = Math.min(count, config.max) / config.max;
    score += normalizedCount * config.weight * 100;
  }
  
  return Math.round(score);
}

export function getInterestLevel(score: number): InterestLevel {
  if (score >= 86) return 'exceptional';
  if (score >= 61) return 'high';
  if (score >= 31) return 'moderate';
  return 'low';
}

export function getInterestSuggestions(level: InterestLevel): string[] {
  return INTEREST_SUGGESTIONS[level];
}
