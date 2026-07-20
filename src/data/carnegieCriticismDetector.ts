// ==============================================
// CRITICISM DETECTOR - DATA
// "Don't criticize, condemn, or complain" - Dale Carnegie
// ==============================================

import { CriticalPhrase, CriticalLanguageType } from '@/types/carnegie-extended';

// ============================================
// CRITICAL LANGUAGE PATTERNS
// ============================================
export const CRITICAL_PATTERNS: Record<CriticalLanguageType, {
  name: string;
  description: string;
  patterns: RegExp[];
  examples: string[];
  severity: 'low' | 'medium' | 'high';
}> = {
  direct_criticism: {
    name: 'Crítica Direta',
    description: 'Afirmações que atacam diretamente a pessoa ou suas ações',
    patterns: [
      /você errou/i, /isso está errado/i, /você fez (tudo )?errado/i,
      /você não (deveria|devia)/i, /você sempre/i, /você nunca/i,
      /isso é (um )?erro/i, /você falhou/i, /você não consegue/i
    ],
    examples: [
      'Você errou completamente nisso',
      'Isso está errado',
      'Você nunca faz isso direito'
    ],
    severity: 'high'
  },
  
  passive_aggressive: {
    name: 'Passivo-Agressivo',
    description: 'Críticas disfarçadas de comentários neutros ou positivos',
    patterns: [
      /se você (tivesse|soubesse)/i, /como eu já disse/i,
      /interessante (que|como) você/i, /boa sorte com isso/i,
      /se você acha/i, /você que sabe/i, /tá bom então/i
    ],
    examples: [
      'Se você tivesse prestado atenção...',
      'Interessante como você sempre chega a essa conclusão',
      'Você que sabe, né'
    ],
    severity: 'medium'
  },
  
  complaint: {
    name: 'Reclamação',
    description: 'Expressões de insatisfação focadas no problema, não na solução',
    patterns: [
      /sempre acontece/i, /nunca funciona/i, /não aguento mais/i,
      /estou (cansado|farto) de/i, /de novo isso/i, /mais uma vez/i,
      /toda vez/i, /que saco/i, /que droga/i
    ],
    examples: [
      'Isso sempre acontece comigo',
      'Não aguento mais essas reuniões',
      'De novo a mesma história'
    ],
    severity: 'low'
  },
  
  condemnation: {
    name: 'Condenação',
    description: 'Julgamentos definitivos sobre caráter ou capacidade',
    patterns: [
      /você é (incompetente|incapaz)/i, /impossível trabalhar com/i,
      /você não serve para/i, /desista/i, /não tem jeito/i,
      /caso perdido/i, /sem esperança/i
    ],
    examples: [
      'Você é incompetente',
      'Não tem jeito, você não aprende',
      'É um caso perdido'
    ],
    severity: 'high'
  },
  
  blame: {
    name: 'Culpa',
    description: 'Atribuição de responsabilidade negativa',
    patterns: [
      /por sua culpa/i, /você (é o |foi o )?responsável/i, /culpa sua/i,
      /você que (causou|provocou)/i, /se não fosse você/i,
      /graças a você/i, /por causa de você/i
    ],
    examples: [
      'Isso aconteceu por sua culpa',
      'Você é o responsável por esse problema',
      'Se não fosse você, isso não teria acontecido'
    ],
    severity: 'high'
  },
  
  sarcasm: {
    name: 'Sarcasmo',
    description: 'Uso de ironia para criticar ou diminuir',
    patterns: [
      /parabéns, hein/i, /que ótimo/i, /muito (obrigado|esperto)/i,
      /genial/i, /brilhante/i, /impressionante/i, /que novidade/i
    ],
    examples: [
      'Parabéns, você conseguiu estragar tudo',
      'Que ótimo, mais um problema',
      'Genial, essa sua ideia'
    ],
    severity: 'medium'
  },
  
  negative_comparison: {
    name: 'Comparação Negativa',
    description: 'Comparações que diminuem a pessoa',
    patterns: [
      /diferente de você/i, /ao contrário de você/i, /melhor que você/i,
      /você deveria ser como/i, /por que você não é como/i,
      /até [ao] \w+ consegue/i
    ],
    examples: [
      'Ao contrário de você, ele faz direito',
      'Até a Maria consegue fazer isso',
      'Por que você não é como os outros?'
    ],
    severity: 'medium'
  },
  
  dismissive: {
    name: 'Desdém',
    description: 'Desconsideração das ideias ou sentimentos do outro',
    patterns: [
      /tanto faz/i, /não importa/i, /deixa pra lá/i, /esquece/i,
      /que seja/i, /não é (bem )?assim/i, /você não entende/i,
      /não é (tão )?simples/i
    ],
    examples: [
      'Tanto faz o que você pensa',
      'Você não entende',
      'Não é assim que funciona'
    ],
    severity: 'medium'
  }
};

// ============================================
// POSITIVE ALTERNATIVES
// ============================================
export const POSITIVE_ALTERNATIVES: Record<string, {
  negative: string;
  positive: string;
  principle: string;
}[]> = {
  direct_criticism: [
    {
      negative: 'Você errou nisso',
      positive: 'Vejo uma oportunidade de melhoria aqui',
      principle: 'Foque no que pode ser melhorado, não no erro'
    },
    {
      negative: 'Isso está errado',
      positive: 'Vamos ver uma abordagem diferente?',
      principle: 'Convide para explorar alternativas'
    },
    {
      negative: 'Você não deveria ter feito assim',
      positive: 'O que você acha de tentarmos dessa forma?',
      principle: 'Use perguntas em vez de afirmações'
    }
  ],
  
  passive_aggressive: [
    {
      negative: 'Se você tivesse prestado atenção...',
      positive: 'Deixa eu esclarecer esse ponto importante',
      principle: 'Assuma responsabilidade pela clareza'
    },
    {
      negative: 'Interessante como você sempre chega a essa conclusão',
      positive: 'Ajude-me a entender seu raciocínio',
      principle: 'Demonstre curiosidade genuína'
    }
  ],
  
  complaint: [
    {
      negative: 'Não aguento mais isso',
      positive: 'Como podemos melhorar essa situação?',
      principle: 'Transforme reclamação em pergunta de solução'
    },
    {
      negative: 'Sempre acontece a mesma coisa',
      positive: 'O que podemos fazer diferente desta vez?',
      principle: 'Foque no futuro, não no padrão passado'
    }
  ],
  
  blame: [
    {
      negative: 'Por sua culpa isso aconteceu',
      positive: 'Vamos focar em como resolver juntos',
      principle: 'Substitua culpa por colaboração'
    },
    {
      negative: 'Você é o responsável por esse problema',
      positive: 'Como podemos prevenir isso no futuro?',
      principle: 'Olhe para frente, não para trás'
    }
  ],
  
  dismissive: [
    {
      negative: 'Você não entende',
      positive: 'Deixa eu explicar de outra forma',
      principle: 'Assuma responsabilidade pela comunicação'
    },
    {
      negative: 'Não é assim que funciona',
      positive: 'Posso compartilhar como vejo isso?',
      principle: 'Peça permissão para compartilhar perspectiva'
    }
  ]
};

// ============================================
// CARNEGIE PRINCIPLES FOR CRITICISM
// ============================================
export const CRITICISM_PRINCIPLES = {
  core: [
    {
      principle: 'Nunca critique diretamente',
      explanation: 'Crítica coloca pessoas na defensiva e mata a vontade de mudar',
      alternative: 'Use perguntas que levem a pessoa a descobrir por si mesma'
    },
    {
      principle: 'Comece com elogio sincero',
      explanation: 'O elogio abre a mente para ouvir sugestões',
      alternative: 'Encontre algo genuíno para reconhecer antes de qualquer feedback'
    },
    {
      principle: 'Fale de seus próprios erros primeiro',
      explanation: 'Mostra humildade e reduz defensividade',
      alternative: 'Compartilhe um erro similar que você cometeu antes'
    },
    {
      principle: 'Faça perguntas em vez de dar ordens',
      explanation: 'Perguntas preservam dignidade e geram buy-in',
      alternative: 'Transforme "faça isso" em "o que você acha de..."'
    },
    {
      principle: 'Deixe a pessoa salvar a face',
      explanation: 'Preservar dignidade é mais importante que estar certo',
      alternative: 'Encontre uma interpretação positiva para ações passadas'
    }
  ],
  
  reframing: {
    'mas': 'e',
    'porém': 'ao mesmo tempo',
    'entretanto': 'além disso',
    'você errou': 'vamos ver outra abordagem',
    'está errado': 'podemos melhorar',
    'nunca': 'às vezes',
    'sempre': 'frequentemente',
    'você deveria': 'você poderia considerar',
    'você precisa': 'seria útil'
  }
};

// ============================================
// ANALYSIS FUNCTIONS
// ============================================
export function detectCriticalLanguage(text: string): CriticalPhrase[] {
  const detected: CriticalPhrase[] = [];
  
  for (const [type, config] of Object.entries(CRITICAL_PATTERNS)) {
    for (const pattern of config.patterns) {
      // Use matchAll with global flag to detect ALL occurrences, not just the first
      const globalPattern = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
      const matches = Array.from(text.matchAll(globalPattern));
      
      for (const match of matches) {
        const alternatives = POSITIVE_ALTERNATIVES[type] || [];
        const alternative = alternatives[0]?.positive || 'Reformule de forma positiva';
        
        detected.push({
          phrase: match[0],
          type: type as CriticalLanguageType,
          severity: config.severity,
          alternative,
          impact: config.description
        });
      }
    }
  }
  
  return detected;
}

export function calculateCriticismScore(text: string): number {
  const criticalPhrases = detectCriticalLanguage(text);
  
  if (criticalPhrases.length === 0) return 100;
  
  let penalty = 0;
  for (const phrase of criticalPhrases) {
    switch (phrase.severity) {
      case 'high': penalty += 25; break;
      case 'medium': penalty += 15; break;
      case 'low': penalty += 8; break;
    }
  }
  
  return Math.max(0, 100 - penalty);
}

export function rewriteWithoutCriticism(text: string): string {
  let result = text;
  
  for (const [negative, positive] of Object.entries(CRITICISM_PRINCIPLES.reframing)) {
    const regex = new RegExp(negative, 'gi');
    result = result.replace(regex, positive);
  }
  
  return result;
}

export function getCriticismTone(score: number): 'critical' | 'neutral' | 'positive' | 'very_positive' {
  if (score >= 90) return 'very_positive';
  if (score >= 70) return 'positive';
  if (score >= 50) return 'neutral';
  return 'critical';
}
