export type TemperamentType = 'sanguine' | 'choleric' | 'melancholic' | 'phlegmatic';

export interface TemperamentProfile {
  primary: TemperamentType;
  secondary: TemperamentType | null;
  scores: Record<TemperamentType, number>;
  confidence: number;
  analyzedAt: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  communicationStyle: string;
  salesApproach: string[];
}

export interface TemperamentInfo {
  name: string;
  nickname: string;
  element: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
  traits: string[];
  strengths: string[];
  weaknesses: string[];
  communicationStyle: string;
  decisionStyle: string;
  motivators: string[];
  stressors: string[];
  salesTips: string[];
  keywords: string[];
}

export const TEMPERAMENT_TYPES: Record<TemperamentType, TemperamentInfo> = {
  sanguine: {
    name: 'Sanguíneo',
    nickname: 'O Entusiasta',
    element: 'Ar',
    icon: '🌟',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    description: 'Extrovertido, otimista e sociável. Adora pessoas, diversão e novas experiências.',
    traits: ['Extrovertido', 'Otimista', 'Sociável', 'Espontâneo', 'Entusiasta'],
    strengths: ['Comunicativo', 'Carismático', 'Criativo', 'Adaptável', 'Motivador'],
    weaknesses: ['Impulsivo', 'Desorganizado', 'Superficial às vezes', 'Dificuldade com detalhes'],
    communicationStyle: 'Animado, expressivo, gosta de histórias e humor',
    decisionStyle: 'Rápido e emocional, baseado em entusiasmo',
    motivators: ['Reconhecimento', 'Diversão', 'Variedade', 'Interação social'],
    stressors: ['Rotina', 'Isolamento', 'Detalhes excessivos', 'Críticas'],
    salesTips: [
      'Use energia e entusiasmo na abordagem',
      'Conte histórias e cases de sucesso',
      'Destaque benefícios sociais e de status',
      'Mantenha a conversa leve e dinâmica',
      'Ofereça variedade e novidades'
    ],
    keywords: ['incrível', 'fantástico', 'adorei', 'divertido', 'festa', 'amigos', 'novidade', 'empolgado', 'animado', 'legal']
  },
  choleric: {
    name: 'Colérico',
    nickname: 'O Líder',
    element: 'Fogo',
    icon: '🔥',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    description: 'Determinado, ambicioso e orientado a resultados. Natural líder que busca controle.',
    traits: ['Determinado', 'Ambicioso', 'Decisivo', 'Competitivo', 'Direto'],
    strengths: ['Liderança', 'Foco em resultados', 'Confiante', 'Produtivo', 'Visionário'],
    weaknesses: ['Impaciente', 'Dominador', 'Insensível às vezes', 'Workaholic'],
    communicationStyle: 'Direto, objetivo, focado em resultados',
    decisionStyle: 'Rápido e lógico, orientado a metas',
    motivators: ['Desafios', 'Controle', 'Resultados', 'Reconhecimento de competência'],
    stressors: ['Perda de controle', 'Ineficiência', 'Indecisão alheia', 'Falta de progresso'],
    salesTips: [
      'Seja direto e vá ao ponto',
      'Apresente resultados e ROI claros',
      'Respeite o tempo deles',
      'Ofereça opções para eles escolherem',
      'Destaque vantagens competitivas'
    ],
    keywords: ['resultado', 'meta', 'objetivo', 'conquista', 'liderar', 'controle', 'eficiência', 'decisão', 'agora', 'rápido']
  },
  melancholic: {
    name: 'Melancólico',
    nickname: 'O Analítico',
    element: 'Terra',
    icon: '📊',
    color: 'text-info',
    bgColor: 'bg-info/10',
    description: 'Perfeccionista, analítico e detalhista. Valoriza qualidade, ordem e profundidade.',
    traits: ['Perfeccionista', 'Analítico', 'Detalhista', 'Organizado', 'Profundo'],
    strengths: ['Precisão', 'Qualidade', 'Planejamento', 'Lealdade', 'Criatividade artística'],
    weaknesses: ['Pessimista', 'Crítico demais', 'Lento para decidir', 'Sensível a críticas'],
    communicationStyle: 'Detalhado, preciso, prefere comunicação escrita',
    decisionStyle: 'Lento e analítico, precisa de todos os dados',
    motivators: ['Qualidade', 'Ordem', 'Propósito', 'Perfeição'],
    stressors: ['Caos', 'Pressão por decisões rápidas', 'Superficialidade', 'Erros'],
    salesTips: [
      'Forneça dados e estatísticas detalhados',
      'Dê tempo para análise',
      'Seja preciso e consistente',
      'Documente tudo por escrito',
      'Não pressione por decisões rápidas'
    ],
    keywords: ['análise', 'detalhe', 'qualidade', 'precisão', 'pesquisa', 'dados', 'perfeito', 'cuidado', 'planejamento', 'organização']
  },
  phlegmatic: {
    name: 'Fleumático',
    nickname: 'O Pacificador',
    element: 'Água',
    icon: '🕊️',
    color: 'text-success',
    bgColor: 'bg-success/10',
    description: 'Calmo, paciente e confiável. Busca harmonia e estabilidade em tudo.',
    traits: ['Calmo', 'Paciente', 'Confiável', 'Diplomático', 'Consistente'],
    strengths: ['Estabilidade', 'Mediação', 'Lealdade', 'Bom ouvinte', 'Cooperativo'],
    weaknesses: ['Passivo', 'Indeciso', 'Resistente a mudanças', 'Evita conflitos'],
    communicationStyle: 'Calmo, paciente, prefere conversas um a um',
    decisionStyle: 'Lento e consensual, busca aprovação',
    motivators: ['Harmonia', 'Estabilidade', 'Reconhecimento sincero', 'Segurança'],
    stressors: ['Conflitos', 'Mudanças bruscas', 'Pressão', 'Confrontos'],
    salesTips: [
      'Construa relacionamento antes de vender',
      'Seja paciente e não pressione',
      'Ofereça garantias e segurança',
      'Mostre como a mudança será suave',
      'Inclua depoimentos de pessoas satisfeitas'
    ],
    keywords: ['tranquilo', 'calma', 'paz', 'estável', 'seguro', 'confiança', 'harmonia', 'equipe', 'apoio', 'paciência']
  }
};

export function getTemperamentBlend(primary: TemperamentType, secondary: TemperamentType | null): string {
  if (!secondary) return TEMPERAMENT_TYPES[primary].name;
  return `${TEMPERAMENT_TYPES[primary].name}-${TEMPERAMENT_TYPES[secondary].name}`;
}
