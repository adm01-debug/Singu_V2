// Big Five (OCEAN) Personality Model Types

export type BigFiveTrait = 'O' | 'C' | 'E' | 'A' | 'N';

export interface BigFiveScore {
  openness: number; // Abertura para Experiência (0-100)
  conscientiousness: number; // Conscienciosidade (0-100)
  extraversion: number; // Extroversão (0-100)
  agreeableness: number; // Amabilidade (0-100)
  neuroticism: number; // Neuroticismo (0-100)
}

export interface BigFiveProfile {
  scores: BigFiveScore;
  dominantTraits: BigFiveTrait[];
  lowTraits: BigFiveTrait[];
  confidence: number;
  analyzedAt: string;
  description: string;
  workStyle: string;
  communicationTips: string[];
  salesApproach: string[];
  potentialChallenges: string[];
}

export interface BigFiveTraitInfo {
  trait: BigFiveTrait;
  name: string;
  fullName: string;
  description: string;
  highDescription: string;
  lowDescription: string;
  color: string;
  bgColor: string;
  icon: string;
  highKeywords: string[];
  lowKeywords: string[];
  salesTipsHigh: string[];
  salesTipsLow: string[];
}

export const BIG_FIVE_TRAITS: Record<BigFiveTrait, BigFiveTraitInfo> = {
  O: {
    trait: 'O',
    name: 'Abertura',
    fullName: 'Abertura para Experiência',
    description: 'Curiosidade intelectual, criatividade e abertura a novas ideias',
    highDescription: 'Criativo, curioso, imaginativo, aprecia arte e novas experiências',
    lowDescription: 'Prático, convencional, prefere rotinas e métodos tradicionais',
    color: 'text-secondary',
    bgColor: 'bg-secondary/10',
    icon: '🎨',
    highKeywords: ['inovador', 'criativo', 'imaginativo', 'curioso', 'artístico', 'original', 'experimental'],
    lowKeywords: ['prático', 'tradicional', 'convencional', 'conservador', 'rotineiro', 'realista'],
    salesTipsHigh: [
      'Apresente soluções inovadoras e criativas',
      'Destaque diferenciais únicos do produto',
      'Use storytelling e analogias criativas',
      'Permita exploração e descoberta'
    ],
    salesTipsLow: [
      'Foque em soluções comprovadas e tradicionais',
      'Mostre casos de sucesso consolidados',
      'Evite mudanças drásticas ou experimentais',
      'Enfatize estabilidade e confiabilidade'
    ]
  },
  C: {
    trait: 'C',
    name: 'Conscienciosidade',
    fullName: 'Conscienciosidade',
    description: 'Organização, disciplina, responsabilidade e orientação a objetivos',
    highDescription: 'Organizado, disciplinado, confiável, orientado a metas e detalhista',
    lowDescription: 'Flexível, espontâneo, adaptável, menos preocupado com detalhes',
    color: 'text-info',
    bgColor: 'bg-info/10',
    icon: '📋',
    highKeywords: ['organizado', 'disciplinado', 'responsável', 'planejado', 'metódico', 'pontual', 'detalhista'],
    lowKeywords: ['flexível', 'espontâneo', 'adaptável', 'descontraído', 'improvisador', 'casual'],
    salesTipsHigh: [
      'Forneça dados detalhados e documentação completa',
      'Cumpra prazos rigorosamente',
      'Apresente cronogramas e planos claros',
      'Seja pontual e organizado nas reuniões'
    ],
    salesTipsLow: [
      'Seja flexível com prazos e processos',
      'Evite sobrecarregar com detalhes',
      'Permita mudanças de última hora',
      'Mantenha comunicação informal'
    ]
  },
  E: {
    trait: 'E',
    name: 'Extroversão',
    fullName: 'Extroversão',
    description: 'Sociabilidade, energia, assertividade e busca por estímulos',
    highDescription: 'Sociável, energético, assertivo, gosta de ser o centro das atenções',
    lowDescription: 'Reservado, introspectivo, prefere ambientes calmos e reflexão',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    icon: '🎉',
    highKeywords: ['sociável', 'energético', 'falante', 'animado', 'entusiasmado', 'assertivo', 'dinâmico'],
    lowKeywords: ['reservado', 'calmo', 'introspectivo', 'quieto', 'reflexivo', 'independente', 'solitário'],
    salesTipsHigh: [
      'Seja entusiasmado e energético',
      'Promova interações sociais e networking',
      'Use reuniões presenciais quando possível',
      'Crie experiências dinâmicas e interativas'
    ],
    salesTipsLow: [
      'Respeite o espaço e tempo para reflexão',
      'Prefira comunicação escrita ou calls individuais',
      'Evite pressão social ou grupos grandes',
      'Dê tempo para processar informações'
    ]
  },
  A: {
    trait: 'A',
    name: 'Amabilidade',
    fullName: 'Amabilidade',
    description: 'Cooperação, confiança, empatia e preocupação com os outros',
    highDescription: 'Cooperativo, confiante, empático, altruísta e harmonioso',
    lowDescription: 'Competitivo, cético, direto, focado em interesses próprios',
    color: 'text-success',
    bgColor: 'bg-success/10',
    icon: '🤝',
    highKeywords: ['cooperativo', 'amigável', 'empático', 'gentil', 'confiante', 'altruísta', 'harmonioso'],
    lowKeywords: ['competitivo', 'direto', 'cético', 'assertivo', 'crítico', 'independente', 'desafiador'],
    salesTipsHigh: [
      'Construa relacionamento antes de vender',
      'Mostre como a solução beneficia a todos',
      'Use testemunhos e referências de outros',
      'Seja genuíno e transparente'
    ],
    salesTipsLow: [
      'Foque em resultados e benefícios diretos',
      'Use dados e fatos, não apenas emoções',
      'Respeite a abordagem direta e objetiva',
      'Mostre vantagem competitiva clara'
    ]
  },
  N: {
    trait: 'N',
    name: 'Neuroticismo',
    fullName: 'Neuroticismo',
    description: 'Tendência à ansiedade, preocupação e instabilidade emocional',
    highDescription: 'Sensível, preocupado, reativo emocionalmente, ansioso',
    lowDescription: 'Calmo, estável, resiliente, lida bem com estresse',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    icon: '🌊',
    highKeywords: ['ansioso', 'preocupado', 'sensível', 'nervoso', 'emotivo', 'reativo', 'inseguro'],
    lowKeywords: ['calmo', 'estável', 'relaxado', 'confiante', 'resiliente', 'seguro', 'equilibrado'],
    salesTipsHigh: [
      'Ofereça garantias e segurança',
      'Seja paciente e tranquilizador',
      'Antecipe objeções e preocupações',
      'Forneça suporte pós-venda robusto'
    ],
    salesTipsLow: [
      'Seja direto sem exagerar em garantias',
      'Confie na capacidade de decisão deles',
      'Não superproteja ou seja condescendente',
      'Apresente desafios como oportunidades'
    ]
  }
};

export const getBigFiveDescription = (scores: BigFiveScore): string => {
  const traits: { trait: BigFiveTrait; score: number }[] = [
    { trait: 'O', score: scores.openness },
    { trait: 'C', score: scores.conscientiousness },
    { trait: 'E', score: scores.extraversion },
    { trait: 'A', score: scores.agreeableness },
    { trait: 'N', score: scores.neuroticism }
  ];

  const highTraits = traits.filter(t => t.score >= 60).sort((a, b) => b.score - a.score);
  const lowTraits = traits.filter(t => t.score <= 40).sort((a, b) => a.score - b.score);

  let description = '';

  if (highTraits.length > 0) {
    const highNames = highTraits.map(t => BIG_FIVE_TRAITS[t.trait].name).join(', ');
    description += `Alto em ${highNames}. `;
  }

  if (lowTraits.length > 0) {
    const lowNames = lowTraits.map(t => BIG_FIVE_TRAITS[t.trait].name).join(', ');
    description += `Baixo em ${lowNames}.`;
  }

  return description || 'Perfil equilibrado em todos os traços.';
};
