// Enneagram Personality Type System

export type EnneagramType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type EnneagramWing = `${EnneagramType}w${EnneagramType}`;

export type EnneagramTriad = 'gut' | 'heart' | 'head';

export type EnneagramCenter = 'instinctive' | 'feeling' | 'thinking';

export type EnneagramHealthLevel = 'healthy' | 'average' | 'unhealthy';

export interface EnneagramProfile {
  type: EnneagramType;
  wing: EnneagramType | null;
  tritype?: [EnneagramType, EnneagramType, EnneagramType];
  healthLevel: EnneagramHealthLevel;
  confidence: number;
  analyzedAt: string;
  description: string;
  coreMotivation: string;
  coreFear: string;
  growthPath: string;
  stressPath: string;
  salesApproach: string[];
}

export interface EnneagramTypeInfo {
  type: EnneagramType;
  name: string;
  nickname: string;
  description: string;
  triads: EnneagramTriad;
  center: EnneagramCenter;
  coreDesire: string;
  coreFear: string;
  coreMotivation: string;
  basicWeakness: string;
  wings: [EnneagramType, EnneagramType];
  growthDirection: EnneagramType; // Integração
  stressDirection: EnneagramType; // Desintegração
  color: string;
  bgColor: string;
  icon: string;
  strengths: string[];
  weaknesses: string[];
  communicationStyle: string;
  decisionStyle: string;
  salesTips: string[];
  keywords: string[];
  healthyTraits: string[];
  unhealthyTraits: string[];
}

export const ENNEAGRAM_TRIADS: Record<EnneagramTriad, { name: string; types: EnneagramType[]; description: string }> = {
  gut: {
    name: 'Tríade Visceral',
    types: [8, 9, 1],
    description: 'Reagem através de instinto e ação, lidam com raiva'
  },
  heart: {
    name: 'Tríade do Coração',
    types: [2, 3, 4],
    description: 'Reagem através de emoções, lidam com vergonha e imagem'
  },
  head: {
    name: 'Tríade da Cabeça',
    types: [5, 6, 7],
    description: 'Reagem através de análise, lidam com medo e ansiedade'
  }
};

export const ENNEAGRAM_TYPES: Record<EnneagramType, EnneagramTypeInfo> = {
  1: {
    type: 1,
    name: 'Tipo 1',
    nickname: 'O Perfeccionista',
    description: 'Racional, idealista, principiado, determinado e auto-controlado',
    triads: 'gut',
    center: 'instinctive',
    coreDesire: 'Ser bom, ter integridade, ser equilibrado',
    coreFear: 'Ser corrupto, mau, imperfeito',
    coreMotivation: 'Melhorar tudo, ser consistente com ideais, justificar-se, evitar críticas',
    basicWeakness: 'Raiva, ressentimento, impaciência',
    wings: [9, 2],
    growthDirection: 7,
    stressDirection: 4,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    icon: '⚖️',
    strengths: ['Ético', 'Confiável', 'Produtivo', 'Idealista', 'Justo'],
    weaknesses: ['Crítico', 'Impaciente', 'Perfeccionista demais', 'Reprime raiva'],
    communicationStyle: 'Direto, preciso e focado em melhorias',
    decisionStyle: 'Baseado em princípios e padrões éticos',
    salesTips: [
      'Demonstre qualidade e excelência do produto',
      'Seja ético e transparente em tudo',
      'Mostre como ajuda a melhorar processos',
      'Forneça garantias de qualidade'
    ],
    keywords: ['perfeccionista', 'ético', 'crítico', 'organizado', 'principiado'],
    healthyTraits: ['Sábio', 'Discernidor', 'Realista', 'Aceita imperfeições'],
    unhealthyTraits: ['Obsessivo', 'Crítico extremo', 'Auto-justiceiro', 'Inflexível']
  },
  2: {
    type: 2,
    name: 'Tipo 2',
    nickname: 'O Ajudador',
    description: 'Generoso, demonstrativo, orientado às pessoas, possessivo',
    triads: 'heart',
    center: 'feeling',
    coreDesire: 'Ser amado, apreciado e necessário',
    coreFear: 'Ser indesejado, indigno de ser amado',
    coreMotivation: 'Ser amado, expressar sentimentos, ser necessário',
    basicWeakness: 'Orgulho, autoenganação sobre próprias necessidades',
    wings: [1, 3],
    growthDirection: 4,
    stressDirection: 8,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    icon: '💝',
    strengths: ['Generoso', 'Empático', 'Caloroso', 'Encorajador', 'Prestativo'],
    weaknesses: ['Possessivo', 'Intrusivo', 'Dependente', 'Manipulador quando estressado'],
    communicationStyle: 'Caloroso, pessoal e focado em relacionamentos',
    decisionStyle: 'Considera impacto nas pessoas e relacionamentos',
    salesTips: [
      'Construa relacionamento pessoal genuíno',
      'Mostre como você pode ajudá-los',
      'Seja grato e reconheça suas contribuições',
      'Foque em pessoas, não apenas produtos'
    ],
    keywords: ['ajudador', 'empático', 'generoso', 'carente', 'relacional'],
    healthyTraits: ['Altruísta', 'Amoroso incondicionalmente', 'Humilde'],
    unhealthyTraits: ['Manipulador', 'Mártir', 'Coercitivo', 'Vitimizado']
  },
  3: {
    type: 3,
    name: 'Tipo 3',
    nickname: 'O Realizador',
    description: 'Orientado ao sucesso, pragmático, adaptável, excelente, orientado à imagem',
    triads: 'heart',
    center: 'feeling',
    coreDesire: 'Ser valioso, ter sucesso e admiração',
    coreFear: 'Ser inútil, sem valor ou não ter sucesso',
    coreMotivation: 'Ser afirmado, distinguir-se, ter atenção, ser admirado',
    basicWeakness: 'Engano, ser falso para impressionar',
    wings: [2, 4],
    growthDirection: 6,
    stressDirection: 9,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    icon: '🏆',
    strengths: ['Ambicioso', 'Eficiente', 'Adaptável', 'Charmoso', 'Motivado'],
    weaknesses: ['Workaholic', 'Superficial', 'Competitivo demais', 'Vaidoso'],
    communicationStyle: 'Confiante, eficiente e orientado a resultados',
    decisionStyle: 'Pragmático, focado em resultados e sucesso',
    salesTips: [
      'Mostre como aumenta produtividade e sucesso',
      'Use casos de sucesso e números impressionantes',
      'Seja eficiente e respeite o tempo deles',
      'Destaque como diferencia dos competidores'
    ],
    keywords: ['realizador', 'ambicioso', 'eficiente', 'imagem', 'sucesso'],
    healthyTraits: ['Autêntico', 'Modelo inspirador', 'Eficaz', 'Verdadeiro'],
    unhealthyTraits: ['Enganador', 'Hostil', 'Oportunista', 'Narcisista']
  },
  4: {
    type: 4,
    name: 'Tipo 4',
    nickname: 'O Individualista',
    description: 'Sensível, expressivo, dramático, ensimesmado e temperamental',
    triads: 'heart',
    center: 'feeling',
    coreDesire: 'Encontrar sua identidade, criar algo significativo',
    coreFear: 'Não ter identidade ou significado pessoal',
    coreMotivation: 'Expressar-se, ser único, criar beleza',
    basicWeakness: 'Inveja, sentir que falta algo nos outros',
    wings: [3, 5],
    growthDirection: 1,
    stressDirection: 2,
    color: 'text-secondary',
    bgColor: 'bg-secondary/10',
    icon: '🎭',
    strengths: ['Criativo', 'Introspectivo', 'Autêntico', 'Sensível', 'Apaixonado'],
    weaknesses: ['Melancólico', 'Dramático', 'Invejoso', 'Autocentrado'],
    communicationStyle: 'Profundo, emocional e focado em significado',
    decisionStyle: 'Guiado por emoções e busca de autenticidade',
    salesTips: [
      'Conecte-se emocionalmente e profundamente',
      'Mostre singularidade e exclusividade',
      'Permita expressão criativa',
      'Evite ser superficial ou genérico'
    ],
    keywords: ['individualista', 'criativo', 'sensível', 'melancólico', 'único'],
    healthyTraits: ['Inspirado', 'Renovador', 'Auto-transformador'],
    unhealthyTraits: ['Auto-destrutivo', 'Alienado', 'Torturado', 'Deprimido']
  },
  5: {
    type: 5,
    name: 'Tipo 5',
    nickname: 'O Investigador',
    description: 'Intenso, cerebral, perceptivo, inovador, secretivo e isolado',
    triads: 'head',
    center: 'thinking',
    coreDesire: 'Ser capaz e competente, entender o ambiente',
    coreFear: 'Ser inútil, incapaz ou incompetente',
    coreMotivation: 'Possuir conhecimento, entender, ser autossuficiente',
    basicWeakness: 'Avareza, reter tempo, energia e conhecimento',
    wings: [4, 6],
    growthDirection: 8,
    stressDirection: 7,
    color: 'text-info',
    bgColor: 'bg-info/10',
    icon: '🔍',
    strengths: ['Analítico', 'Objetivo', 'Perceptivo', 'Original', 'Independente'],
    weaknesses: ['Isolado', 'Provocativo', 'Arrogante', 'Distante'],
    communicationStyle: 'Preciso, analítico e focado em informações',
    decisionStyle: 'Baseado em análise profunda e conhecimento',
    salesTips: [
      'Forneça informações técnicas detalhadas',
      'Respeite necessidade de tempo para análise',
      'Seja preciso e evite exageros',
      'Permita que estudem por conta própria'
    ],
    keywords: ['investigador', 'analítico', 'reservado', 'intelectual', 'independente'],
    healthyTraits: ['Visionário', 'Descobridor', 'Inovador pioneiro'],
    unhealthyTraits: ['Excêntrico', 'Niilista', 'Isolado extremo', 'Paranoico']
  },
  6: {
    type: 6,
    name: 'Tipo 6',
    nickname: 'O Lealista',
    description: 'Comprometido, orientado à segurança, engajado, responsável e ansioso',
    triads: 'head',
    center: 'thinking',
    coreDesire: 'Ter segurança e suporte',
    coreFear: 'Estar sem suporte ou orientação',
    coreMotivation: 'Ter segurança, garantia, lutar contra ansiedade',
    basicWeakness: 'Medo, ansiedade e dúvida constante',
    wings: [5, 7],
    growthDirection: 9,
    stressDirection: 3,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    icon: '🛡️',
    strengths: ['Leal', 'Responsável', 'Trabalhador', 'Corajoso', 'Confiável'],
    weaknesses: ['Ansioso', 'Desconfiado', 'Indeciso', 'Defensivo'],
    communicationStyle: 'Cauteloso, questionador e focado em segurança',
    decisionStyle: 'Considera riscos e busca garantias',
    salesTips: [
      'Ofereça garantias e suporte sólido',
      'Seja consistente e previsível',
      'Antecipe perguntas e objeções',
      'Construa confiança gradualmente'
    ],
    keywords: ['lealista', 'ansioso', 'desconfiado', 'responsável', 'cauteloso'],
    healthyTraits: ['Corajoso', 'Líder positivo', 'Auto-confiante'],
    unhealthyTraits: ['Paranoico', 'Extremamente ansioso', 'Autopunitivo']
  },
  7: {
    type: 7,
    name: 'Tipo 7',
    nickname: 'O Entusiasta',
    description: 'Ocupado, otimista, espontâneo, versátil, distraído e disperso',
    triads: 'head',
    center: 'thinking',
    coreDesire: 'Ser satisfeito, ter necessidades atendidas',
    coreFear: 'Ser privado e estar com dor',
    coreMotivation: 'Manter liberdade, evitar dor, ser feliz',
    basicWeakness: 'Gula, querer mais experiências e estímulos',
    wings: [6, 8],
    growthDirection: 5,
    stressDirection: 1,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    icon: '🎉',
    strengths: ['Otimista', 'Entusiasmado', 'Versátil', 'Espontâneo', 'Divertido'],
    weaknesses: ['Impulsivo', 'Distraído', 'Insaciável', 'Narcisista'],
    communicationStyle: 'Entusiasmado, otimista e focado em possibilidades',
    decisionStyle: 'Rápido, espontâneo, busca prazer e evita dor',
    salesTips: [
      'Seja entusiasmado e divertido',
      'Mostre variedade de opções e possibilidades',
      'Evite focar em problemas ou limitações',
      'Crie experiência empolgante e leve'
    ],
    keywords: ['entusiasta', 'otimista', 'espontâneo', 'aventureiro', 'disperso'],
    healthyTraits: ['Focado', 'Profundamente grato', 'Apreciativo', 'Satisfeito'],
    unhealthyTraits: ['Maníaco', 'Impulsivo extremo', 'Fugitivo', 'Viciado']
  },
  8: {
    type: 8,
    name: 'Tipo 8',
    nickname: 'O Desafiador',
    description: 'Poderoso, dominador, auto-confiante, decidido e confrontador',
    triads: 'gut',
    center: 'instinctive',
    coreDesire: 'Proteger-se, estar no controle',
    coreFear: 'Ser controlado ou prejudicado por outros',
    coreMotivation: 'Ser autossuficiente, provar força, resistir fraqueza',
    basicWeakness: 'Luxúria, desejo de controle e intensidade',
    wings: [7, 9],
    growthDirection: 2,
    stressDirection: 5,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    icon: '💪',
    strengths: ['Líder', 'Protetor', 'Direto', 'Decidido', 'Magnânimo'],
    weaknesses: ['Dominador', 'Intimidador', 'Insensível', 'Vingativo'],
    communicationStyle: 'Direto, assertivo e focado em poder',
    decisionStyle: 'Rápido, decidido, baseado em força e instinto',
    salesTips: [
      'Seja direto e nunca manipulador',
      'Respeite a força e autoridade deles',
      'Mostre como ganham controle ou poder',
      'Não seja fraco ou evasivo'
    ],
    keywords: ['desafiador', 'poderoso', 'assertivo', 'protetor', 'confrontador'],
    healthyTraits: ['Magnânimo', 'Heroico', 'Protetor dos fracos'],
    unhealthyTraits: ['Ditatorial', 'Destrutivo', 'Sociopático', 'Megalomaníaco']
  },
  9: {
    type: 9,
    name: 'Tipo 9',
    nickname: 'O Pacificador',
    description: 'Receptivo, tranquilizador, agradável, complacente e resignado',
    triads: 'gut',
    center: 'instinctive',
    coreDesire: 'Ter paz interior e harmonia',
    coreFear: 'Perda, separação, fragmentação',
    coreMotivation: 'Manter paz, evitar conflito, preservar coisas como estão',
    basicWeakness: 'Preguiça, negligência de si mesmo',
    wings: [8, 1],
    growthDirection: 3,
    stressDirection: 6,
    color: 'text-success',
    bgColor: 'bg-success/10',
    icon: '☮️',
    strengths: ['Pacífico', 'Receptivo', 'Estável', 'Criativo', 'Suportivo'],
    weaknesses: ['Passivo', 'Teimoso', 'Complacente', 'Distraído'],
    communicationStyle: 'Calmo, receptivo e focado em harmonia',
    decisionStyle: 'Evita conflito, busca consenso, pode procrastinar',
    salesTips: [
      'Seja calmo e não pressione',
      'Mostre como traz paz e simplifica',
      'Dê tempo para decidir',
      'Evite criar conflito ou urgência extrema'
    ],
    keywords: ['pacificador', 'calmo', 'harmonioso', 'complacente', 'estável'],
    healthyTraits: ['Autônomo', 'Ativo', 'Energético', 'Presente'],
    unhealthyTraits: ['Dissociado', 'Negligente', 'Obstinado', 'Apático']
  }
};

export const getEnneagramTriad = (type: EnneagramType): EnneagramTriad => {
  if ([8, 9, 1].includes(type)) return 'gut';
  if ([2, 3, 4].includes(type)) return 'heart';
  return 'head';
};

export const getWingOptions = (type: EnneagramType): [EnneagramType, EnneagramType] => {
  return ENNEAGRAM_TYPES[type].wings;
};
