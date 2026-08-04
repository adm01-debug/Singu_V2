// ==============================================
// EAGER WANT MAPPER - DATA
// "Arouse in the other person an eager want" - Dale Carnegie
// ==============================================

import { EagerWant, DesireCategory, EagerWantTechnique } from '@/types/carnegie-extended';

// ============================================
// CORE HUMAN DESIRES (Based on Carnegie + Psychology)
// ============================================
export const EAGER_WANTS: EagerWant[] = [
  // ============================================
  // RECOGNITION - The desire to be important
  // ============================================
  {
    id: 'recognition_importance',
    category: 'recognition',
    name: 'Desejo de Importância',
    description: 'O desejo profundo de ser reconhecido e valorizado pelos outros',
    detectionKeywords: [
      'reconhecimento', 'valorizado', 'importante', 'respeito', 'admiração',
      'destaque', 'mérito', 'contribuição', 'percebido', 'notado', 'creditado'
    ],
    arousalTechniques: [
      {
        id: 'recognition_1',
        technique: 'Reconheça publicamente suas contribuições',
        example: 'Sua liderança nesse projeto fez toda diferença. Todos notaram.',
        whenToUse: 'Quando o cliente demonstra orgulho de realizações'
      },
      {
        id: 'recognition_2',
        technique: 'Peça conselhos como se fosse um especialista',
        example: 'Com sua experiência, o que você recomendaria aqui?',
        whenToUse: 'Para elevar o status e criar engagement'
      },
      {
        id: 'recognition_3',
        technique: 'Mostre como isso aumentará sua visibilidade',
        example: 'Isso vai posicionar você como referência no assunto.',
        whenToUse: 'Ao apresentar benefícios da solução'
      }
    ],
    discAlignment: { D: 95, I: 90, S: 60, C: 70 }
  },
  
  // ============================================
  // SECURITY - The desire for safety
  // ============================================
  {
    id: 'security_safety',
    category: 'security',
    name: 'Desejo de Segurança',
    description: 'A necessidade de se sentir protegido contra riscos e incertezas',
    detectionKeywords: [
      'seguro', 'protegido', 'garantia', 'risco', 'estável', 'confiável',
      'certeza', 'tranquilidade', 'prevenção', 'backup', 'contingência'
    ],
    arousalTechniques: [
      {
        id: 'security_1',
        technique: 'Enfatize proteção contra riscos',
        example: 'Isso vai te proteger contra [risco específico] que você mencionou.',
        whenToUse: 'Quando o cliente expressa preocupação com riscos'
      },
      {
        id: 'security_2',
        technique: 'Ofereça garantias concretas',
        example: 'Você tem garantia total. Se não funcionar, resolvemos.',
        whenToUse: 'Para reduzir percepção de risco'
      },
      {
        id: 'security_3',
        technique: 'Mostre estabilidade e track record',
        example: 'Estamos há 15 anos no mercado atendendo empresas como a sua.',
        whenToUse: 'Para construir confiança'
      }
    ],
    discAlignment: { D: 60, I: 50, S: 100, C: 85 }
  },
  
  // ============================================
  // AUTONOMY - The desire for control
  // ============================================
  {
    id: 'autonomy_control',
    category: 'autonomy',
    name: 'Desejo de Controle',
    description: 'A necessidade de ter poder sobre decisões e circunstâncias',
    detectionKeywords: [
      'controle', 'liberdade', 'escolha', 'decisão', 'independência',
      'autonomia', 'meu jeito', 'flexibilidade', 'opções', 'customização'
    ],
    arousalTechniques: [
      {
        id: 'autonomy_1',
        technique: 'Apresente opções e deixe escolher',
        example: 'Temos três caminhos possíveis. Qual faz mais sentido para você?',
        whenToUse: 'Para dar senso de controle'
      },
      {
        id: 'autonomy_2',
        technique: 'Enfatize customização e flexibilidade',
        example: 'Você pode configurar exatamente do seu jeito.',
        whenToUse: 'Quando o cliente valoriza personalização'
      },
      {
        id: 'autonomy_3',
        technique: 'Mostre como isso aumenta independência',
        example: 'Com isso, você não vai depender de terceiros.',
        whenToUse: 'Para clientes que valorizam self-reliance'
      }
    ],
    discAlignment: { D: 100, I: 75, S: 55, C: 80 }
  },
  
  // ============================================
  // BELONGING - The desire for connection
  // ============================================
  {
    id: 'belonging_connection',
    category: 'belonging',
    name: 'Desejo de Pertencimento',
    description: 'A necessidade de fazer parte de algo maior e conectar-se com outros',
    detectionKeywords: [
      'comunidade', 'grupo', 'time', 'família', 'parceiros', 'juntos',
      'colaboração', 'networking', 'relacionamentos', 'conexão', 'pertencer'
    ],
    arousalTechniques: [
      {
        id: 'belonging_1',
        technique: 'Mostre a comunidade que vem junto',
        example: 'Você vai fazer parte de uma comunidade de líderes como você.',
        whenToUse: 'Para clientes que valorizam networking'
      },
      {
        id: 'belonging_2',
        technique: 'Use linguagem inclusiva (nós)',
        example: 'Juntos, vamos construir algo incrível.',
        whenToUse: 'Para criar senso de parceria'
      },
      {
        id: 'belonging_3',
        technique: 'Mencione outros clientes similares',
        example: 'Outros líderes do seu setor já fazem parte...',
        whenToUse: 'Para validação social'
      }
    ],
    discAlignment: { D: 55, I: 100, S: 95, C: 60 }
  },
  
  // ============================================
  // ACHIEVEMENT - The desire to win
  // ============================================
  {
    id: 'achievement_winning',
    category: 'achievement',
    name: 'Desejo de Conquista',
    description: 'A necessidade de alcançar metas e superar desafios',
    detectionKeywords: [
      'meta', 'objetivo', 'resultado', 'conquista', 'sucesso', 'vitória',
      'superar', 'alcançar', 'atingir', 'desempenho', 'performance', 'ganhar'
    ],
    arousalTechniques: [
      {
        id: 'achievement_1',
        technique: 'Conecte à meta que eles querem alcançar',
        example: 'Isso vai te ajudar a atingir [meta específica] que você mencionou.',
        whenToUse: 'Quando o cliente fala sobre objetivos'
      },
      {
        id: 'achievement_2',
        technique: 'Use linguagem de competição',
        example: 'Isso vai te colocar à frente da concorrência.',
        whenToUse: 'Para clientes competitivos'
      },
      {
        id: 'achievement_3',
        technique: 'Mostre métricas e resultados',
        example: 'Nossos clientes tiveram 40% de melhoria em...',
        whenToUse: 'Para validar com dados'
      }
    ],
    discAlignment: { D: 100, I: 80, S: 60, C: 85 }
  },
  
  // ============================================
  // GROWTH - The desire to improve
  // ============================================
  {
    id: 'growth_development',
    category: 'growth',
    name: 'Desejo de Crescimento',
    description: 'A necessidade de evoluir, aprender e se desenvolver',
    detectionKeywords: [
      'aprender', 'crescer', 'evoluir', 'desenvolver', 'melhorar', 'capacitar',
      'treinar', 'estudar', 'conhecimento', 'habilidade', 'potencial'
    ],
    arousalTechniques: [
      {
        id: 'growth_1',
        technique: 'Enfatize o aprendizado envolvido',
        example: 'Você vai desenvolver habilidades que vão te servir para sempre.',
        whenToUse: 'Para clientes focados em desenvolvimento'
      },
      {
        id: 'growth_2',
        technique: 'Mostre a evolução possível',
        example: 'Imagine onde você estará daqui a 1 ano com isso...',
        whenToUse: 'Para criar visão de futuro'
      },
      {
        id: 'growth_3',
        technique: 'Destaque o investimento em si mesmo',
        example: 'Isso é um investimento no seu próprio desenvolvimento.',
        whenToUse: 'Para justificar valor'
      }
    ],
    discAlignment: { D: 85, I: 80, S: 70, C: 90 }
  },
  
  // ============================================
  // PLEASURE - The desire for enjoyment
  // ============================================
  {
    id: 'pleasure_enjoyment',
    category: 'pleasure',
    name: 'Desejo de Prazer',
    description: 'A busca por experiências agradáveis e evitar dor',
    detectionKeywords: [
      'fácil', 'simples', 'prazer', 'divertido', 'agradável', 'confortável',
      'sem stress', 'tranquilo', 'leve', 'fluido', 'gostoso', 'bom'
    ],
    arousalTechniques: [
      {
        id: 'pleasure_1',
        technique: 'Enfatize facilidade e simplicidade',
        example: 'Isso vai tornar sua vida muito mais simples.',
        whenToUse: 'Para clientes que buscam conveniência'
      },
      {
        id: 'pleasure_2',
        technique: 'Mostre como elimina dores',
        example: 'Você vai se livrar daquela dor de cabeça com [problema].',
        whenToUse: 'Para destacar alívio de problemas'
      },
      {
        id: 'pleasure_3',
        technique: 'Crie visão de experiência positiva',
        example: 'Imagine acordar sem se preocupar com isso...',
        whenToUse: 'Para pintar o depois'
      }
    ],
    discAlignment: { D: 60, I: 95, S: 85, C: 65 }
  },
  
  // ============================================
  // MEANING - The desire for purpose
  // ============================================
  {
    id: 'meaning_purpose',
    category: 'meaning',
    name: 'Desejo de Propósito',
    description: 'A busca por significado e contribuição maior',
    detectionKeywords: [
      'propósito', 'significado', 'impacto', 'diferença', 'legado', 'missão',
      'valores', 'causa', 'contribuir', 'ajudar', 'transformar', 'mundo'
    ],
    arousalTechniques: [
      {
        id: 'meaning_1',
        technique: 'Conecte ao propósito maior',
        example: 'Isso não é só sobre negócios - é sobre o impacto que você vai criar.',
        whenToUse: 'Para clientes orientados a propósito'
      },
      {
        id: 'meaning_2',
        technique: 'Mostre o impacto em outros',
        example: 'Pense em quantas pessoas você vai ajudar com isso.',
        whenToUse: 'Para apelar ao altruísmo'
      },
      {
        id: 'meaning_3',
        technique: 'Fale sobre legado',
        example: 'Isso vai fazer parte do legado que você está construindo.',
        whenToUse: 'Para visão de longo prazo'
      }
    ],
    discAlignment: { D: 75, I: 85, S: 90, C: 80 }
  }
];

// ============================================
// DETECTION KEYWORDS FLATTENED
// ============================================
export const ALL_EAGER_WANT_KEYWORDS: Record<DesireCategory, string[]> = {
  recognition: [
    'reconhecimento', 'valorizado', 'importante', 'respeito', 'admiração',
    'destaque', 'mérito', 'contribuição', 'percebido', 'notado', 'creditado',
    'reputação', 'status', 'visibilidade', 'referência'
  ],
  security: [
    'seguro', 'protegido', 'garantia', 'risco', 'estável', 'confiável',
    'certeza', 'tranquilidade', 'prevenção', 'backup', 'contingência',
    'preservar', 'manter', 'conservar'
  ],
  autonomy: [
    'controle', 'liberdade', 'escolha', 'decisão', 'independência',
    'autonomia', 'meu jeito', 'flexibilidade', 'opções', 'customização',
    'próprio', 'sem depender', 'self-service'
  ],
  belonging: [
    'comunidade', 'grupo', 'time', 'família', 'parceiros', 'juntos',
    'colaboração', 'networking', 'relacionamentos', 'conexão', 'pertencer',
    'incluído', 'parte de', 'junto com'
  ],
  achievement: [
    'meta', 'objetivo', 'resultado', 'conquista', 'sucesso', 'vitória',
    'superar', 'alcançar', 'atingir', 'desempenho', 'performance', 'ganhar',
    'vencer', 'primeiro', 'melhor'
  ],
  growth: [
    'aprender', 'crescer', 'evoluir', 'desenvolver', 'melhorar', 'capacitar',
    'treinar', 'estudar', 'conhecimento', 'habilidade', 'potencial',
    'transformar', 'upgrade', 'next level'
  ],
  pleasure: [
    'fácil', 'simples', 'prazer', 'divertido', 'agradável', 'confortável',
    'sem stress', 'tranquilo', 'leve', 'fluido', 'gostoso', 'bom',
    'curtir', 'relaxar', 'descansar'
  ],
  meaning: [
    'propósito', 'significado', 'impacto', 'diferença', 'legado', 'missão',
    'valores', 'causa', 'contribuir', 'ajudar', 'transformar', 'mundo',
    'gerações', 'futuro', 'história'
  ]
};

// ============================================
// HELPER FUNCTIONS
// ============================================
// Minimum word length to avoid false positives on common short words
const MIN_KEYWORD_LENGTH_FOR_STANDALONE = 4;

// Common words that should only match in meaningful context
const CONTEXTUAL_KEYWORDS: Record<string, RegExp> = {
  'bom': /(?:muito |realmente |é )bom|bom (?:resultado|trabalho|desempenho|produto|serviço|negócio)/i,
  'bem': /(?:muito |realmente |está )bem|bem-(?:estar|sucedido)/i,
  'paz': /(?:em |ter |quero |preciso de )paz/i,
};

export function detectEagerWants(text: string): DesireCategory[] {
  const detected: DesireCategory[] = [];
  const textLower = text.toLowerCase();
  
  for (const [category, keywords] of Object.entries(ALL_EAGER_WANT_KEYWORDS)) {
    let found = false;
    for (const keyword of keywords) {
      // For short common words, require contextual match
      if (keyword.length < MIN_KEYWORD_LENGTH_FOR_STANDALONE && CONTEXTUAL_KEYWORDS[keyword]) {
        if (CONTEXTUAL_KEYWORDS[keyword].test(text)) {
          found = true;
          break;
        }
        continue;
      }
      
      // Stemming support: match keyword root as word boundary
      // Use ~60% of keyword length (min 5, max 8) to catch Portuguese morphological variants
      if (keyword.length >= 5) {
        const stemLen = Math.min(8, Math.max(5, Math.floor(keyword.length * 0.6)));
        const stem = keyword.slice(0, stemLen);
        const stemRegex = new RegExp(`\\b${stem}`, 'i');
        if (stemRegex.test(textLower)) {
          found = true;
          break;
        }
      } else if (textLower.includes(keyword)) {
        found = true;
        break;
      }
    }
    
    if (found && !detected.includes(category as DesireCategory)) {
      detected.push(category as DesireCategory);
    }
  }
  
  return detected;
}

export function getEagerWantByCategory(category: DesireCategory): EagerWant | undefined {
  return EAGER_WANTS.find(w => w.category === category);
}

export function getTechniquesForWant(category: DesireCategory): EagerWantTechnique[] {
  const want = getEagerWantByCategory(category);
  return want?.arousalTechniques || [];
}

export function getEagerWantsByDISC(discProfile: 'D' | 'I' | 'S' | 'C'): EagerWant[] {
  return [...EAGER_WANTS].sort((a, b) => 
    b.discAlignment[discProfile] - a.discAlignment[discProfile]
  );
}

export function generateEagerWantScript(category: DesireCategory, context?: string): string {
  const want = getEagerWantByCategory(category);
  if (!want) return '';
  
  const techniques = want.arousalTechniques;
  // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
  const tech = techniques[Math.floor(Math.random() * techniques.length)];
  
  return `${tech.technique}\n\nExemplo: "${tech.example}"`;
}
