// MBTI (Myers-Briggs Type Indicator) Personality Types

export type MBTIDichotomy = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';

export type MBTIType = 
  | 'INTJ' | 'INTP' | 'ENTJ' | 'ENTP'
  | 'INFJ' | 'INFP' | 'ENFJ' | 'ENFP'
  | 'ISTJ' | 'ISFJ' | 'ESTJ' | 'ESFJ'
  | 'ISTP' | 'ISFP' | 'ESTP' | 'ESFP';

export interface MBTIPreferences {
  EI: number; // -100 (Introvertido) a +100 (Extrovertido)
  SN: number; // -100 (Sensorial) a +100 (Intuitivo)
  TF: number; // -100 (Pensamento) a +100 (Sentimento)
  JP: number; // -100 (Julgamento) a +100 (Percepção)
}

export interface MBTIProfile {
  type: MBTIType;
  preferences: MBTIPreferences;
  confidence: number;
  analyzedAt: string;
  cognitiveFunctions: string[];
  description: string;
  strengths: string[];
  weaknesses: string[];
  communicationStyle: string;
  salesApproach: string[];
}

export interface MBTITypeInfo {
  type: MBTIType;
  name: string;
  nickname: string;
  description: string;
  cognitiveFunctions: string[];
  strengths: string[];
  weaknesses: string[];
  communicationStyle: string;
  decisionStyle: string;
  color: string;
  bgColor: string;
  icon: string;
  salesTips: string[];
  keywords: string[];
}

export const MBTI_DICHOTOMIES = {
  EI: {
    E: { name: 'Extrovertido', description: 'Energizado por interação social', keywords: ['sociável', 'falante', 'energético'] },
    I: { name: 'Introvertido', description: 'Energizado por tempo sozinho', keywords: ['reservado', 'reflexivo', 'calmo'] }
  },
  SN: {
    S: { name: 'Sensorial', description: 'Foca em fatos e detalhes concretos', keywords: ['prático', 'detalhista', 'realista'] },
    N: { name: 'Intuitivo', description: 'Foca em padrões e possibilidades', keywords: ['imaginativo', 'abstrato', 'visionário'] }
  },
  TF: {
    T: { name: 'Pensamento', description: 'Decide com lógica e objetividade', keywords: ['lógico', 'analítico', 'objetivo'] },
    F: { name: 'Sentimento', description: 'Decide com valores e empatia', keywords: ['empático', 'harmonioso', 'pessoal'] }
  },
  JP: {
    J: { name: 'Julgamento', description: 'Prefere estrutura e planejamento', keywords: ['organizado', 'planejado', 'decidido'] },
    P: { name: 'Percepção', description: 'Prefere flexibilidade e espontaneidade', keywords: ['flexível', 'espontâneo', 'adaptável'] }
  }
};

export const MBTI_TYPES: Record<MBTIType, MBTITypeInfo> = {
  INTJ: {
    type: 'INTJ',
    name: 'INTJ',
    nickname: 'O Arquiteto',
    description: 'Estrategistas imaginativos com um plano para tudo',
    cognitiveFunctions: ['Ni', 'Te', 'Fi', 'Se'],
    strengths: ['Estratégico', 'Independente', 'Determinado', 'Inovador'],
    weaknesses: ['Arrogante às vezes', 'Impaciente', 'Crítico demais'],
    communicationStyle: 'Direto, lógico e focado em eficiência',
    decisionStyle: 'Analítico e estratégico, baseado em visão de longo prazo',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    icon: '🏛️',
    salesTips: [
      'Apresente visão estratégica de longo prazo',
      'Use dados e lógica sólida',
      'Respeite a inteligência deles',
      'Seja eficiente e direto ao ponto'
    ],
    keywords: ['estratégico', 'visionário', 'independente', 'analítico', 'perfeccionista']
  },
  INTP: {
    type: 'INTP',
    name: 'INTP',
    nickname: 'O Lógico',
    description: 'Inventores inovadores com sede insaciável por conhecimento',
    cognitiveFunctions: ['Ti', 'Ne', 'Si', 'Fe'],
    strengths: ['Analítico', 'Objetivo', 'Imaginativo', 'Original'],
    weaknesses: ['Distraído', 'Insensível às vezes', 'Procrastinador'],
    communicationStyle: 'Teórico, preciso e focado em ideias',
    decisionStyle: 'Lógico puro, busca a verdade objetiva',
    color: 'text-info',
    bgColor: 'bg-info/10',
    icon: '🔬',
    salesTips: [
      'Permita explorar tecnicamente o produto',
      'Forneça documentação detalhada',
      'Respeite o tempo para análise',
      'Foque em como funciona, não apenas benefícios'
    ],
    keywords: ['lógico', 'teórico', 'curioso', 'inventivo', 'analítico']
  },
  ENTJ: {
    type: 'ENTJ',
    name: 'ENTJ',
    nickname: 'O Comandante',
    description: 'Líderes ousados e imaginativos que encontram um caminho',
    cognitiveFunctions: ['Te', 'Ni', 'Se', 'Fi'],
    strengths: ['Eficiente', 'Energético', 'Autoconfiante', 'Estratégico'],
    weaknesses: ['Teimoso', 'Dominador', 'Impaciente'],
    communicationStyle: 'Assertivo, direto e focado em resultados',
    decisionStyle: 'Rápido e decisivo, orientado a objetivos',
    color: 'text-secondary',
    bgColor: 'bg-secondary/10',
    icon: '👑',
    salesTips: [
      'Seja direto e focado em resultados',
      'Mostre ROI e métricas claras',
      'Respeite o tempo deles',
      'Apresente como líder de mercado'
    ],
    keywords: ['líder', 'decisivo', 'ambicioso', 'estratégico', 'assertivo']
  },
  ENTP: {
    type: 'ENTP',
    name: 'ENTP',
    nickname: 'O Inovador',
    description: 'Pensadores espertos e curiosos que não resistem a um desafio',
    cognitiveFunctions: ['Ne', 'Ti', 'Fe', 'Si'],
    strengths: ['Engenhoso', 'Carismático', 'Energético', 'Debatedor'],
    weaknesses: ['Argumentativo', 'Insensível', 'Não prático'],
    communicationStyle: 'Entusiasmado, debatedor e cheio de ideias',
    decisionStyle: 'Explora todas as possibilidades, adora desafiar',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    icon: '💡',
    salesTips: [
      'Esteja preparado para debates intelectuais',
      'Apresente ideias inovadoras e únicas',
      'Permita que questionem e explorem',
      'Use humor e energia'
    ],
    keywords: ['inovador', 'debatedor', 'carismático', 'curioso', 'energético']
  },
  INFJ: {
    type: 'INFJ',
    name: 'INFJ',
    nickname: 'O Advogado',
    description: 'Idealistas quietos e místicos, mas muito inspiradores',
    cognitiveFunctions: ['Ni', 'Fe', 'Ti', 'Se'],
    strengths: ['Criativo', 'Perspicaz', 'Principiado', 'Apaixonado'],
    weaknesses: ['Perfeccionista', 'Sensível demais', 'Reservado'],
    communicationStyle: 'Empático, profundo e focado em significado',
    decisionStyle: 'Guiado por valores e intuição sobre as pessoas',
    color: 'text-success',
    bgColor: 'bg-success/10',
    icon: '🌟',
    salesTips: [
      'Conecte-se em nível pessoal e autêntico',
      'Mostre propósito maior e impacto',
      'Seja genuíno e transparente',
      'Dê tempo para reflexão'
    ],
    keywords: ['idealista', 'empático', 'visionário', 'reservado', 'principiado']
  },
  INFP: {
    type: 'INFP',
    name: 'INFP',
    nickname: 'O Mediador',
    description: 'Pessoas poéticas, gentis e altruístas, sempre buscando o bem',
    cognitiveFunctions: ['Fi', 'Ne', 'Si', 'Te'],
    strengths: ['Empático', 'Generoso', 'Criativo', 'Mente aberta'],
    weaknesses: ['Idealista demais', 'Impraticável', 'Vulnerável'],
    communicationStyle: 'Gentil, pessoal e focado em valores',
    decisionStyle: 'Baseado em valores pessoais profundos',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    icon: '🕊️',
    salesTips: [
      'Seja autêntico e evite táticas de pressão',
      'Mostre como ajuda pessoas ou causas',
      'Conecte-se emocionalmente',
      'Respeite os valores pessoais'
    ],
    keywords: ['idealista', 'criativo', 'empático', 'gentil', 'reservado']
  },
  ENFJ: {
    type: 'ENFJ',
    name: 'ENFJ',
    nickname: 'O Protagonista',
    description: 'Líderes carismáticos e inspiradores, capazes de hipnotizar ouvintes',
    cognitiveFunctions: ['Fe', 'Ni', 'Se', 'Ti'],
    strengths: ['Carismático', 'Empático', 'Confiável', 'Líder natural'],
    weaknesses: ['Idealista demais', 'Autoconfiante demais', 'Sensível a críticas'],
    communicationStyle: 'Inspirador, caloroso e focado nas pessoas',
    decisionStyle: 'Considera impacto nas pessoas e harmonia',
    color: 'text-success',
    bgColor: 'bg-success/10',
    icon: '🌈',
    salesTips: [
      'Mostre impacto positivo na equipe/empresa',
      'Seja entusiasmado e pessoal',
      'Construa relacionamento genuíno',
      'Foque em como ajuda outros'
    ],
    keywords: ['carismático', 'inspirador', 'empático', 'líder', 'altruísta']
  },
  ENFP: {
    type: 'ENFP',
    name: 'ENFP',
    nickname: 'O Ativista',
    description: 'Espíritos livres entusiasmados, criativos e sociáveis',
    cognitiveFunctions: ['Ne', 'Fi', 'Te', 'Si'],
    strengths: ['Entusiasmado', 'Criativo', 'Sociável', 'Energético'],
    weaknesses: ['Desorganizado', 'Muito emocional', 'Não prático'],
    communicationStyle: 'Entusiasmado, criativo e cheio de possibilidades',
    decisionStyle: 'Guiado por valores e possibilidades empolgantes',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    icon: '🎭',
    salesTips: [
      'Seja entusiasmado e criativo',
      'Mostre possibilidades empolgantes',
      'Permita brainstorming junto',
      'Use storytelling envolvente'
    ],
    keywords: ['entusiasmado', 'criativo', 'sociável', 'espontâneo', 'otimista']
  },
  ISTJ: {
    type: 'ISTJ',
    name: 'ISTJ',
    nickname: 'O Logístico',
    description: 'Indivíduos práticos e focados em fatos, confiáveis',
    cognitiveFunctions: ['Si', 'Te', 'Fi', 'Ne'],
    strengths: ['Honesto', 'Responsável', 'Calmo', 'Determinado'],
    weaknesses: ['Teimoso', 'Insensível', 'Resistente a mudanças'],
    communicationStyle: 'Direto, factual e orientado a detalhes',
    decisionStyle: 'Metódico, baseado em experiência e fatos',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    icon: '📊',
    salesTips: [
      'Forneça dados detalhados e documentação',
      'Seja pontual e organizado',
      'Mostre histórico e casos de sucesso',
      'Respeite processos estabelecidos'
    ],
    keywords: ['responsável', 'prático', 'confiável', 'tradicional', 'detalhista']
  },
  ISFJ: {
    type: 'ISFJ',
    name: 'ISFJ',
    nickname: 'O Defensor',
    description: 'Protetores dedicados e calorosos, sempre prontos a defender',
    cognitiveFunctions: ['Si', 'Fe', 'Ti', 'Ne'],
    strengths: ['Apoiador', 'Confiável', 'Paciente', 'Observador'],
    weaknesses: ['Relutante a mudanças', 'Modesto demais', 'Reprime sentimentos'],
    communicationStyle: 'Caloroso, paciente e focado em ajudar',
    decisionStyle: 'Considera tradição e impacto nas pessoas',
    color: 'text-sky-600',
    bgColor: 'bg-sky-100',
    icon: '🛡️',
    salesTips: [
      'Construa confiança gradualmente',
      'Mostre suporte e garantias',
      'Seja paciente e não pressione',
      'Foque em como ajuda a equipe'
    ],
    keywords: ['protetor', 'leal', 'prático', 'caloroso', 'confiável']
  },
  ESTJ: {
    type: 'ESTJ',
    name: 'ESTJ',
    nickname: 'O Executivo',
    description: 'Administradores excelentes, inigualáveis em gerenciar',
    cognitiveFunctions: ['Te', 'Si', 'Ne', 'Fi'],
    strengths: ['Organizado', 'Lógico', 'Assertivo', 'Dedicado'],
    weaknesses: ['Inflexível', 'Teimoso', 'Julgador'],
    communicationStyle: 'Direto, assertivo e focado em resultados',
    decisionStyle: 'Lógico, rápido e baseado em regras claras',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    icon: '📈',
    salesTips: [
      'Seja organizado e profissional',
      'Apresente ROI e resultados claros',
      'Cumpra prazos rigorosamente',
      'Mostre credibilidade e tradição'
    ],
    keywords: ['executivo', 'organizado', 'decisivo', 'tradicional', 'assertivo']
  },
  ESFJ: {
    type: 'ESFJ',
    name: 'ESFJ',
    nickname: 'O Cônsul',
    description: 'Pessoas extraordinariamente cuidadosas, sociáveis e populares',
    cognitiveFunctions: ['Fe', 'Si', 'Ne', 'Ti'],
    strengths: ['Leal', 'Sociável', 'Cuidadoso', 'Prático'],
    weaknesses: ['Preocupado com status', 'Inflexível', 'Vulnerável a críticas'],
    communicationStyle: 'Caloroso, sociável e focado em harmonia',
    decisionStyle: 'Considera tradição e bem-estar do grupo',
    color: 'text-accent',
    bgColor: 'bg-accent/10',
    icon: '🤗',
    salesTips: [
      'Construa relacionamento pessoal primeiro',
      'Mostre como beneficia a equipe/empresa',
      'Seja caloroso e amigável',
      'Use testemunhos de outros clientes'
    ],
    keywords: ['sociável', 'leal', 'harmonioso', 'tradicional', 'cuidadoso']
  },
  ISTP: {
    type: 'ISTP',
    name: 'ISTP',
    nickname: 'O Virtuoso',
    description: 'Experimentadores ousados e práticos, mestres em ferramentas',
    cognitiveFunctions: ['Ti', 'Se', 'Ni', 'Fe'],
    strengths: ['Otimista', 'Criativo', 'Prático', 'Relaxado'],
    weaknesses: ['Teimoso', 'Insensível', 'Privado demais'],
    communicationStyle: 'Conciso, prático e focado em ação',
    decisionStyle: 'Lógico e prático, baseado em experiência direta',
    color: 'text-zinc-600',
    bgColor: 'bg-zinc-100',
    icon: '🔧',
    salesTips: [
      'Permita testar e experimentar o produto',
      'Seja prático e direto',
      'Mostre como funciona na prática',
      'Evite muita teoria ou abstração'
    ],
    keywords: ['prático', 'lógico', 'adaptável', 'independente', 'analítico']
  },
  ISFP: {
    type: 'ISFP',
    name: 'ISFP',
    nickname: 'O Aventureiro',
    description: 'Artistas flexíveis e charmosos, sempre prontos para explorar',
    cognitiveFunctions: ['Fi', 'Se', 'Ni', 'Te'],
    strengths: ['Charmoso', 'Sensível', 'Imaginativo', 'Apaixonado'],
    weaknesses: ['Imprevisível', 'Facilmente estressado', 'Muito independente'],
    communicationStyle: 'Gentil, artístico e focado no momento presente',
    decisionStyle: 'Guiado por valores e experiência sensorial',
    color: 'text-lime-600',
    bgColor: 'bg-lime-100',
    icon: '🎨',
    salesTips: [
      'Permita experiência sensorial com produto',
      'Seja autêntico e não invasivo',
      'Mostre estética e design',
      'Dê espaço para decidir no tempo deles'
    ],
    keywords: ['artístico', 'gentil', 'sensível', 'espontâneo', 'harmonioso']
  },
  ESTP: {
    type: 'ESTP',
    name: 'ESTP',
    nickname: 'O Empresário',
    description: 'Pessoas inteligentes, energéticas e perceptivas que amam riscos',
    cognitiveFunctions: ['Se', 'Ti', 'Fe', 'Ni'],
    strengths: ['Energético', 'Racional', 'Perceptivo', 'Direto'],
    weaknesses: ['Impaciente', 'Busca risco', 'Insensível'],
    communicationStyle: 'Direto, energético e focado em ação',
    decisionStyle: 'Rápido e pragmático, baseado no momento',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    icon: '⚡',
    salesTips: [
      'Seja dinâmico e energético',
      'Foque em resultados imediatos',
      'Permita ação e experimentação',
      'Use demonstrações práticas'
    ],
    keywords: ['energético', 'pragmático', 'direto', 'aventureiro', 'adaptável']
  },
  ESFP: {
    type: 'ESFP',
    name: 'ESFP',
    nickname: 'O Animador',
    description: 'Animadores espontâneos e energéticos que amam a vida',
    cognitiveFunctions: ['Se', 'Fi', 'Te', 'Ni'],
    strengths: ['Ousado', 'Original', 'Estético', 'Prático'],
    weaknesses: ['Sensível', 'Conflito-avesso', 'Facilmente entediado'],
    communicationStyle: 'Entusiasmado, divertido e focado na experiência',
    decisionStyle: 'Espontâneo, baseado em valores e momento',
    color: 'text-fuchsia-600',
    bgColor: 'bg-fuchsia-100',
    icon: '🎪',
    salesTips: [
      'Seja divertido e entusiasmado',
      'Crie experiência memorável',
      'Use histórias e entretenimento',
      'Mantenha energia alta'
    ],
    keywords: ['animado', 'sociável', 'espontâneo', 'divertido', 'prático']
  }
};

export const getMBTITypeFromPreferences = (prefs: MBTIPreferences): MBTIType => {
  const e = prefs.EI >= 0 ? 'E' : 'I';
  const s = prefs.SN >= 0 ? 'N' : 'S';
  const t = prefs.TF >= 0 ? 'F' : 'T';
  const j = prefs.JP >= 0 ? 'P' : 'J';
  return `${e}${s}${t}${j}` as MBTIType;
};
