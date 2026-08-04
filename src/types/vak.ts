// VAK (Visual/Auditory/Kinesthetic) Representational System Types

export type VAKType = 'V' | 'A' | 'K' | 'D'; // Visual, Auditory, Kinesthetic, Digital

export interface VAKProfile {
  primary: VAKType | null;
  secondary: VAKType | null;
  scores: {
    visual: number;
    auditory: number;
    kinesthetic: number;
    digital: number;
  };
  confidence: number; // 0-100
  lastAnalyzedAt?: string;
  totalWordsAnalyzed: number;
}

export interface VAKAnalysisResult {
  visual: { score: number; words: string[] };
  auditory: { score: number; words: string[] };
  kinesthetic: { score: number; words: string[] };
  digital: { score: number; words: string[] };
  dominantSystem: VAKType;
  secondarySystem: VAKType | null;
  confidence: number;
}

export const VAK_LABELS: Record<VAKType, { 
  name: string; 
  fullName: string;
  description: string; 
  color: string;
  bgColor: string;
  icon: string;
}> = {
  V: { 
    name: 'Visual', 
    fullName: 'Visual',
    description: 'Pensa em imagens, fala rápido, usa palavras visuais', 
    color: 'text-secondary',
    bgColor: 'bg-secondary/10 border-secondary/20',
    icon: '👁️'
  },
  A: { 
    name: 'Auditivo', 
    fullName: 'Auditivo',
    description: 'Pensa em sons, ritmo equilibrado, valoriza tom de voz', 
    color: 'text-info',
    bgColor: 'bg-info/10 border-info/20',
    icon: '👂'
  },
  K: { 
    name: 'Cinestésico', 
    fullName: 'Cinestésico',
    description: 'Pensa em sensações, fala devagar, valoriza conexão', 
    color: 'text-success',
    bgColor: 'bg-success/10 border-success/20',
    icon: '✋'
  },
  D: { 
    name: 'Digital', 
    fullName: 'Auditivo Digital',
    description: 'Pensa em lógica e dados, analítico, valoriza fatos', 
    color: 'text-muted-foreground',
    bgColor: 'bg-muted border-border',
    icon: '🧠'
  },
};

// Predicados (palavras-chave) para cada sistema representacional
export const VAK_PREDICATES: Record<VAKType, string[]> = {
  V: [
    // Verbos visuais
    'ver', 'olhar', 'observar', 'visualizar', 'imaginar', 'enxergar', 'assistir',
    'mostrar', 'revelar', 'ilustrar', 'focar', 'examinar', 'espiar', 'notar',
    'contemplar', 'aparecer', 'brilhar', 'colorir', 'desenhar', 'esclarecer',
    // Substantivos/adjetivos visuais
    'visão', 'imagem', 'perspectiva', 'ponto de vista', 'horizonte', 'panorama',
    'cena', 'quadro', 'figura', 'aspecto', 'aparência', 'forma', 'cor',
    'claro', 'escuro', 'brilhante', 'opaco', 'transparente', 'nítido', 'turvo',
    'colorido', 'vívido', 'obscuro', 'luminoso', 'ofuscante',
    // Expressões visuais
    'a olhos vistos', 'à primeira vista', 'ao que parece', 'bem claro',
    'dar uma olhada', 'ficar de olho', 'ponto cego', 'visão geral',
    'olho nu', 'saltar aos olhos', 'ver com bons olhos', 'luz no fim do túnel',
    'clarear', 'esclarecer', 'foco', 'imagem clara', 'perspectiva',
  ],
  A: [
    // Verbos auditivos
    'ouvir', 'escutar', 'falar', 'dizer', 'contar', 'narrar', 'soar',
    'ressoar', 'ecoar', 'gritar', 'sussurrar', 'murmurar', 'cantar',
    'proclamar', 'anunciar', 'expressar', 'articular', 'pronunciar',
    // Substantivos/adjetivos auditivos
    'som', 'ruído', 'barulho', 'silêncio', 'voz', 'tom', 'volume',
    'ritmo', 'melodia', 'harmonia', 'nota', 'eco', 'música', 'conversa',
    'alto', 'baixo', 'agudo', 'grave', 'sonoro', 'ruidoso', 'silencioso',
    'estridente', 'melódico', 'harmonioso', 'dissonante',
    // Expressões auditivas
    'dar ouvidos', 'fazer ouvidos moucos', 'música para os ouvidos',
    'em alto e bom som', 'palavra por palavra', 'dar voz', 'tomar a palavra',
    'sintonizar', 'estar na mesma frequência', 'ressoar', 'cair bem',
    'tocar um sino', 'chamou atenção',
  ],
  K: [
    // Verbos cinestésicos
    'sentir', 'tocar', 'pegar', 'segurar', 'abraçar', 'apertar', 'pressionar',
    'empurrar', 'puxar', 'mover', 'mexer', 'agitar', 'sacudir', 'vibrar',
    'acariciar', 'massagear', 'esfregar', 'aquecer', 'esfriar',
    // Substantivos/adjetivos cinestésicos
    'sensação', 'sentimento', 'emoção', 'toque', 'contato', 'textura',
    'peso', 'pressão', 'tensão', 'temperatura', 'calor', 'frio',
    'suave', 'áspero', 'liso', 'rugoso', 'macio', 'duro', 'firme', 'mole',
    'pesado', 'leve', 'quente', 'gelado', 'morno', 'confortável', 'tenso',
    'relaxado', 'agitado', 'calmo', 'intenso', 'sólido', 'concreto',
    // Expressões cinestésicas
    'ter a sensação', 'pegar o jeito', 'manter contato', 'entrar em contato',
    'segurar firme', 'pisar em ovos', 'pé no chão', 'mãos à obra',
    'de coração', 'na pele', 'de arrepiar', 'ficar tocado',
    'botar a mão na massa', 'sentir na pele', 'peso nas costas',
  ],
  D: [
    // Verbos digitais/analíticos
    'pensar', 'analisar', 'considerar', 'avaliar', 'calcular', 'computar',
    'processar', 'entender', 'compreender', 'saber', 'conhecer', 'aprender',
    'estudar', 'pesquisar', 'investigar', 'questionar', 'perguntar',
    'decidir', 'concluir', 'deduzir', 'inferir', 'raciocinar',
    // Substantivos/adjetivos digitais
    'lógica', 'razão', 'motivo', 'causa', 'efeito', 'resultado', 'consequência',
    'processo', 'sistema', 'método', 'estratégia', 'plano', 'objetivo',
    'meta', 'dado', 'fato', 'informação', 'conhecimento', 'teoria',
    'conceito', 'princípio', 'regra', 'lei', 'padrão', 'estatística',
    'lógico', 'racional', 'analítico', 'sistemático', 'metódico',
    'objetivo', 'subjetivo', 'específico', 'geral', 'preciso', 'exato',
    // Expressões digitais
    'faz sentido', 'pensando bem', 'analisando', 'considerando',
    'do ponto de vista lógico', 'em termos de', 'por assim dizer',
    'na prática', 'teoricamente', 'estatisticamente', 'objetivamente',
    'de acordo com', 'baseado em', 'segundo', 'conforme',
  ],
};

// Dicas de comunicação por sistema VAK
export const VAK_COMMUNICATION_TIPS: Record<VAKType, {
  useWords: string[];
  avoidWords: string[];
  communicationStyle: string;
  salesTips: string[];
  templateExamples: string[];
}> = {
  V: {
    useWords: ['ver', 'visualizar', 'claro', 'perspectiva', 'foco', 'brilhante', 'imagem', 'mostrar'],
    avoidWords: ['sentir', 'tocar', 'ouvir'],
    communicationStyle: 'Use apresentações visuais, gráficos, imagens e vídeos. Fale de forma rápida e objetiva.',
    salesTips: [
      'Use apresentações com muitas imagens e gráficos',
      'Mostre o produto/serviço visualmente',
      'Envie propostas bem formatadas e coloridas',
      'Use metáforas visuais nas explicações',
      'Mantenha contato visual durante reuniões',
    ],
    templateExamples: [
      'Você consegue ver como isso vai transformar seus resultados?',
      'Imagine o panorama de crescimento que teremos...',
      'Deixe-me mostrar uma visão clara do que podemos alcançar.',
      'Olhando para o futuro, a perspectiva é muito brilhante.',
    ],
  },
  A: {
    useWords: ['ouvir', 'escutar', 'som', 'harmonia', 'ressoar', 'conversar', 'tom', 'sintonia'],
    avoidWords: ['ver', 'visualizar', 'sentir'],
    communicationStyle: 'Prefira ligações e reuniões. Varie o tom de voz e dê tempo para processar.',
    salesTips: [
      'Prefira ligações telefônicas a emails',
      'Use variações no tom de voz para enfatizar pontos',
      'Conte histórias e use metáforas sonoras',
      'Envie áudios no WhatsApp quando possível',
      'Pergunte "como isso soa para você?"',
    ],
    templateExamples: [
      'Isso soa interessante para você?',
      'Vamos conversar sobre como harmonizar seus processos.',
      'Escute, tenho uma proposta que vai ressoar com suas necessidades.',
      'O que você tem ouvido sobre resultados como esses?',
    ],
  },
  K: {
    useWords: ['sentir', 'tocar', 'concreto', 'sólido', 'firme', 'conexão', 'conforto', 'segurança'],
    avoidWords: ['ver', 'ouvir', 'analisar'],
    communicationStyle: 'Seja paciente e caloroso. Prefira encontros presenciais e construa conexão emocional.',
    salesTips: [
      'Prefira reuniões presenciais quando possível',
      'Ofereça experiências práticas e demonstrações',
      'Construa relacionamento antes de vender',
      'Use linguagem emocional e empática',
      'Dê tempo para processar - não pressione',
    ],
    templateExamples: [
      'Como você se sente sobre essa possibilidade?',
      'Quero que você sinta segurança ao tomar essa decisão.',
      'Vamos construir algo sólido e duradouro juntos.',
      'Sei que você quer ter certeza de estar em boas mãos.',
    ],
  },
  D: {
    useWords: ['analisar', 'dados', 'lógica', 'processo', 'sistema', 'fato', 'resultado', 'estratégia'],
    avoidWords: ['sentir', 'imaginar', 'intuição'],
    communicationStyle: 'Seja preciso, use dados e fatos. Apresente informações de forma estruturada e lógica.',
    salesTips: [
      'Apresente dados, estatísticas e casos de estudo',
      'Seja preciso e evite exageros',
      'Forneça documentação detalhada',
      'Responda perguntas com fatos comprováveis',
      'Use ROI e métricas para justificar',
    ],
    templateExamples: [
      'Analisando os dados, faz sentido considerarmos...',
      'Os fatos mostram que empresas que implementaram obtiveram X% de melhoria.',
      'Do ponto de vista lógico, essa estratégia oferece o melhor custo-benefício.',
      'Considerando todos os fatores, a conclusão é clara.',
    ],
  },
};
