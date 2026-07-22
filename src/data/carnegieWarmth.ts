// ==============================================
// WARMTH SCORE - DATA
// "Begin in a friendly way" - Dale Carnegie
// ==============================================

import { WarmthIndicator, ColdIndicator, WarmthSuggestion } from '@/types/carnegie';

// ============================================
// WARMTH INDICATORS
// ============================================
export const WARMTH_PATTERNS = {
  greeting: {
    name: 'Cumprimentos Calorosos',
    patterns: [
      { pattern: /(que bom|que prazer|que alegria)\s+(falar|conversar|ver)/i, score: 10 },
      // eslint-disable-next-line sonarjs/super-linear-regex -- regex verified non-catastrophic (no nested ambiguous quantifiers / bounded)
      { pattern: /(olá|oi|bom dia|boa tarde)\s*,?\s*tudo bem/i, score: 7 },
      { pattern: /como você está\??/i, score: 8 },
      { pattern: /espero que esteja bem/i, score: 9 },
      { pattern: /estava pensando em você/i, score: 10 },
      { pattern: /que saudade/i, score: 10 }
    ],
    coldPatterns: [
      { pattern: /^(olá|oi)\s*$/i, score: -3, alternative: 'Olá! Que bom falar com você!' },
      { pattern: /^bom dia\s*$/i, score: -2, alternative: 'Bom dia! Como você está?' },
      { pattern: /vamos direto ao assunto/i, score: -5, alternative: 'Espero que esteja bem! Tenho um assunto importante...' }
    ]
  },
  
  empathy: {
    name: 'Expressões de Empatia',
    patterns: [
      { pattern: /imagino como (deve ser|você se sente)/i, score: 10 },
      { pattern: /entendo (perfeitamente|completamente|sua|o que)/i, score: 8 },
      { pattern: /compreendo a situação/i, score: 8 },
      { pattern: /faz todo sentido/i, score: 7 },
      { pattern: /no seu lugar/i, score: 9 },
      { pattern: /sei como é/i, score: 7 },
      { pattern: /deve ser (difícil|desafiador|complicado)/i, score: 9 }
    ],
    coldPatterns: [
      { pattern: /não é bem assim/i, score: -6, alternative: 'Entendo seu ponto, e deixa eu compartilhar outra perspectiva...' },
      { pattern: /você está errado/i, score: -10, alternative: 'Interessante perspectiva. Posso compartilhar como vejo isso?' },
      { pattern: /não faz sentido/i, score: -7, alternative: 'Me ajude a entender melhor o que você quer dizer...' }
    ]
  },
  
  personalTouch: {
    name: 'Toques Pessoais',
    patterns: [
      { pattern: /lembrei de você quando/i, score: 10 },
      { pattern: /como está (a família|sua esposa|seu marido|as crianças)/i, score: 10 },
      { pattern: /e aquele projeto|e aquela viagem/i, score: 9 },
      { pattern: /você mencionou que/i, score: 8 },
      { pattern: /na nossa última conversa/i, score: 7 },
      { pattern: /sei que você gosta de/i, score: 9 }
    ],
    coldPatterns: [
      { pattern: /conforme nosso contrato/i, score: -4, alternative: 'Sobre o que conversamos...' },
      { pattern: /de acordo com os termos/i, score: -5, alternative: 'Pensando no que combinamos...' }
    ]
  },
  
  positiveLanguage: {
    name: 'Linguagem Positiva',
    patterns: [
      { pattern: /(adorei|amei|maravilhoso|excelente|fantástico)/i, score: 8 },
      { pattern: /(incrível|impressionante|brilhante|genial)/i, score: 9 },
      { pattern: /(parabéns|muito bem|mandou bem)/i, score: 8 },
      { pattern: /(obrigado|agradeço|gratidão|grato)/i, score: 7 },
      { pattern: /(por favor|se possível|quando puder)/i, score: 5 },
      { pattern: /(com certeza|claro que sim|sem dúvida)/i, score: 6 }
    ],
    coldPatterns: [
      { pattern: /(não|nunca|jamais|impossível)\s/i, score: -4, alternative: 'Substitua negações por alternativas: "O que podemos fazer é..."' },
      { pattern: /infelizmente/i, score: -3, alternative: 'Use: "O que podemos ajustar é..."' },
      { pattern: /problema/i, score: -2, alternative: 'Use: "desafio" ou "situação"' }
    ]
  },
  
  emotionalConnection: {
    name: 'Conexão Emocional',
    patterns: [
      { pattern: /fico feliz (de|em|por)/i, score: 9 },
      { pattern: /me sinto honrado/i, score: 10 },
      { pattern: /significa muito para mim/i, score: 10 },
      { pattern: /valorizo muito/i, score: 9 },
      { pattern: /admiro (você|sua|seu)/i, score: 10 },
      { pattern: /tenho orgulho/i, score: 9 }
    ],
    coldPatterns: [
      { pattern: /não me importa/i, score: -8, alternative: 'Omita ou diga: "O foco principal é..."' },
      { pattern: /tanto faz/i, score: -7, alternative: 'Diga: "Qualquer opção funciona para mim"' }
    ]
  },
  
  genuineInterest: {
    name: 'Interesse Genuíno',
    patterns: [
      { pattern: /me conte mais/i, score: 9 },
      { pattern: /quero saber/i, score: 8 },
      { pattern: /estou curioso/i, score: 8 },
      { pattern: /como foi (isso|aquilo|para você)/i, score: 8 },
      { pattern: /o que você achou/i, score: 7 },
      { pattern: /qual sua opinião/i, score: 7 }
    ],
    coldPatterns: [
      { pattern: /vamos ao que interessa/i, score: -6, alternative: 'Diga: "Adoraria ouvir mais, e também quero compartilhar..."' },
      { pattern: /chega de papo/i, score: -8, alternative: 'Diga: "Que conversa boa! Sobre o que queríamos falar..."' }
    ]
  }
};

// ============================================
// WARMTH LEVEL DEFINITIONS
// ============================================
export const WARMTH_LEVELS = {
  cold: {
    range: { min: 0, max: 30 },
    label: 'Frio',
    description: 'Comunicação distante e impessoal',
    color: 'text-sky-600 bg-sky-50',
    icon: '❄️',
    suggestions: [
      'Adicione cumprimentos mais calorosos',
      'Use o nome da pessoa mais vezes',
      'Demonstre interesse pessoal',
      'Adicione expressões de empatia'
    ]
  },
  neutral: {
    range: { min: 31, max: 55 },
    label: 'Neutro',
    description: 'Comunicação educada mas sem calor especial',
    color: 'text-muted-foreground bg-muted/50',
    icon: '😐',
    suggestions: [
      'Adicione mais toques pessoais',
      'Use linguagem mais positiva',
      'Demonstre mais entusiasmo'
    ]
  },
  warm: {
    range: { min: 56, max: 75 },
    label: 'Caloroso',
    description: 'Comunicação acolhedora e agradável',
    color: 'text-warning bg-warning/10',
    icon: '☀️',
    suggestions: [
      'Mantenha esse nível de calor',
      'Adicione conexões emocionais ocasionais'
    ]
  },
  very_warm: {
    range: { min: 76, max: 90 },
    label: 'Muito Caloroso',
    description: 'Comunicação que transmite genuíno afeto',
    color: 'text-warning bg-warning/10',
    icon: '🔥',
    suggestions: [
      'Excelente! Continue assim',
      'Cuidado para não parecer excessivo'
    ]
  },
  exceptional: {
    range: { min: 91, max: 100 },
    label: 'Excepcional',
    description: 'Comunicação que cria conexão profunda',
    color: 'text-destructive bg-destructive/10',
    icon: '💖',
    suggestions: [
      'Perfeito! Mantenha a autenticidade'
    ]
  }
};

// ============================================
// WARMTH TEMPLATES BY SITUATION
// ============================================
export const WARMTH_TEMPLATES = {
  openings: {
    first_contact: [
      'Olá [Nome]! É um prazer conhecê-lo(a). Ouvi falar muito bem de você!',
      '[Nome], muito prazer em fazer contato! Estava ansioso(a) por essa conversa.',
      'Que alegria finalmente conversarmos, [Nome]! Como você está?'
    ],
    follow_up: [
      '[Nome]! Que bom falar com você novamente! Como tem passado?',
      'Olá [Nome]! Estava justamente pensando em você. Tudo bem por aí?',
      '[Nome], que prazer retomar nossa conversa! Espero que esteja tudo bem!'
    ],
    after_long_time: [
      '[Nome]! Que saudade! Faz tempo que não conversamos. Como você está?',
      'Nossa, [Nome]! Quanto tempo! Fico feliz em falar com você novamente.',
      '[Nome]! Que bom te encontrar de novo! Me conta, o que tem feito de bom?'
    ]
  },
  
  transitions: {
    to_business: [
      'Que conversa boa! Bom, sobre o que queríamos falar...',
      'Adorei colocar o papo em dia! Vamos ao que te trouxe aqui?',
      'Sempre bom conversar com você! Deixa eu te contar o motivo do meu contato...'
    ],
    after_difficult_topic: [
      'Sei que isso não é fácil de discutir, e agradeço sua abertura.',
      'Obrigado por compartilhar isso comigo. Significa muito.',
      'Entendo que esse é um assunto sensível. Estou aqui para ajudar.'
    ]
  },
  
  closings: {
    standard: [
      'Foi ótimo conversar com você, [Nome]! Até a próxima!',
      '[Nome], obrigado(a) pelo seu tempo. Valorizo muito nossa conversa!',
      'Sempre um prazer, [Nome]! Cuide-se e até logo!'
    ],
    after_good_meeting: [
      '[Nome], que conversa incrível! Saio daqui energizado(a). Muito obrigado(a)!',
      'Adorei nossa conversa! Você sempre traz insights valiosos. Até breve!',
      'Que papo bom! Obrigado(a) por compartilhar tanto. Até a próxima!'
    ],
    after_difficult_meeting: [
      'Agradeço sua paciência e abertura, [Nome]. Vamos resolver isso juntos.',
      'Sei que não foi uma conversa fácil. Obrigado(a) por confiar em mim.',
      'Valorizoprofundamente sua honestidade, [Nome]. Estou aqui para o que precisar.'
    ]
  },
  
  empathy_responses: {
    frustration: [
      'Imagino como isso deve ser frustrante. Vamos encontrar uma solução juntos.',
      'Entendo completamente sua frustração. Isso não deveria ter acontecido.',
      'Faz todo sentido você se sentir assim. Deixa eu ver como posso ajudar.'
    ],
    excitement: [
      'Que notícia maravilhosa! Fico muito feliz por você!',
      'Isso é fantástico! Você merece essa conquista!',
      'Que incrível! Adorei ver você tão animado(a) com isso!'
    ],
    worry: [
      'Entendo sua preocupação. Vamos trabalhar nisso passo a passo.',
      'É natural se preocupar com isso. Estou aqui para ajudar.',
      'Sua preocupação é válida. Vamos encontrar a melhor solução.'
    ]
  }
};

// ============================================
// WARMTH BY DISC PROFILE
// ============================================
export const WARMTH_BY_DISC: Record<'D' | 'I' | 'S' | 'C', {
  preferredWarmthLevel: 'moderate' | 'high' | 'very_high';
  doThis: string[];
  avoidThis: string[];
  examples: string[];
}> = {
  D: {
    preferredWarmthLevel: 'moderate',
    doThis: [
      'Seja caloroso mas direto',
      'Respeite o tempo deles',
      'Mostre entusiasmo por resultados',
      'Demonstre respeito por conquistas'
    ],
    avoidThis: [
      'Excesso de conversa pessoal',
      'Elogios que pareçam bajulação',
      'Demora para chegar ao ponto'
    ],
    examples: [
      '[Nome]! Bom falar com você. Sei que seu tempo é valioso, então vou direto ao ponto.',
      'Sempre um prazer conversar com quem entrega resultados como você.',
      'Admiro sua objetividade. Vamos ao que interessa!'
    ]
  },
  
  I: {
    preferredWarmthLevel: 'very_high',
    doThis: [
      'Seja muito expressivo e entusiasta',
      'Elogie com energia',
      'Mostre interesse na vida pessoal',
      'Use humor e leveza'
    ],
    avoidThis: [
      'Ser seco ou muito formal',
      'Ignorar pequenas vitórias',
      'Pular direto para negócios'
    ],
    examples: [
      '[Nome]!! Que alegria falar com você! Como foi aquela viagem que você me contou?',
      'Amei te encontrar! Você sempre deixa qualquer conversa mais divertida!',
      'Nossa, que energia boa você transmite! Amo nossos papos!'
    ]
  },
  
  S: {
    preferredWarmthLevel: 'high',
    doThis: [
      'Seja genuinamente caloroso',
      'Pergunte sobre família e pessoas queridas',
      'Demonstre cuidado sincero',
      'Ofereça suporte e estabilidade'
    ],
    avoidThis: [
      'Pressionar por respostas rápidas',
      'Parecer apenas interessado em negócios',
      'Ignorar o lado humano'
    ],
    examples: [
      '[Nome], que bom falar com você! Como está a família? E como você está se sentindo?',
      'Estava pensando em você esses dias. Espero que esteja tudo tranquilo por aí.',
      'Você é sempre tão acolhedor(a). Obrigado(a) por esse carinho.'
    ]
  },
  
  C: {
    preferredWarmthLevel: 'moderate',
    doThis: [
      'Seja educado e respeitoso',
      'Reconheça expertise e conhecimento',
      'Mantenha profissionalismo com toque pessoal',
      'Seja consistente na comunicação'
    ],
    avoidThis: [
      'Exagerar nas emoções',
      'Parecer superficial',
      'Interromper com excesso de perguntas pessoais'
    ],
    examples: [
      '[Nome], espero que esteja bem. Agradeço seu tempo para conversarmos.',
      'Sempre aprendo algo novo quando conversamos. Obrigado(a) por compartilhar seu conhecimento.',
      'Valorizo sua precisão e atenção aos detalhes. É um diferencial raro.'
    ]
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================
export function detectWarmthIndicators(text: string): WarmthIndicator[] {
  const indicators: WarmthIndicator[] = [];
  
  Object.entries(WARMTH_PATTERNS).forEach(([category, data]) => {
    data.patterns.forEach(({ pattern, score }) => {
      const match = text.match(pattern);
      if (match) {
        indicators.push({
          type: category as WarmthIndicator['type'],
          phrase: match[0],
          impact: score
        });
      }
    });
  });
  
  return indicators;
}

export function detectColdIndicators(text: string): ColdIndicator[] {
  const indicators: ColdIndicator[] = [];
  
  Object.entries(WARMTH_PATTERNS).forEach(([_, data]) => {
    data.coldPatterns?.forEach(({ pattern, score, alternative }) => {
      const match = text.match(pattern);
      if (match) {
        indicators.push({
          type: 'impersonal',
          phrase: match[0],
          impact: score,
          alternative
        });
      }
    });
  });
  
  return indicators;
}

export function calculateWarmthScore(text: string): number {
  const warmIndicators = detectWarmthIndicators(text);
  const coldIndicators = detectColdIndicators(text);
  
  const warmScore = warmIndicators.reduce((sum, ind) => sum + ind.impact, 0);
  const coldScore = coldIndicators.reduce((sum, ind) => sum + Math.abs(ind.impact), 0);
  
  // Base score of 50, modified by indicators
  const rawScore = 50 + (warmScore * 2) - (coldScore * 3);
  
  // Clamp between 0-100
  return Math.max(0, Math.min(100, rawScore));
}

export function getWarmthLevel(score: number): keyof typeof WARMTH_LEVELS {
  if (score <= 30) return 'cold';
  if (score <= 55) return 'neutral';
  if (score <= 75) return 'warm';
  if (score <= 90) return 'very_warm';
  return 'exceptional';
}

export function getWarmthSuggestions(
  score: number,
  coldIndicators: ColdIndicator[]
): WarmthSuggestion[] {
  const level = getWarmthLevel(score);
  const suggestions: WarmthSuggestion[] = [];
  
  // Add suggestions based on cold indicators
  coldIndicators.forEach(indicator => {
    suggestions.push({
      area: 'Linguagem',
      currentState: `Detectado: "${indicator.phrase}"`,
      suggestion: indicator.alternative,
      template: indicator.alternative,
      impact: 'high'
    });
  });
  
  // Add general suggestions based on level
  WARMTH_LEVELS[level].suggestions.forEach(suggestion => {
    suggestions.push({
      area: 'Geral',
      currentState: `Nível atual: ${WARMTH_LEVELS[level].label}`,
      suggestion,
      template: suggestion,
      impact: 'medium'
    });
  });
  
  return suggestions;
}
