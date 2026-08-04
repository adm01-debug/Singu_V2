// Metaprograms Types for NLP-based client profiling

// The six core metaprograms
export type MotivationDirection = 'toward' | 'away_from' | 'balanced';
export type ReferenceFrame = 'internal' | 'external' | 'balanced';
export type WorkingStyle = 'options' | 'procedures' | 'balanced';
export type ChunkSize = 'general' | 'specific' | 'balanced';
export type ActionFilter = 'proactive' | 'reactive' | 'balanced';
export type ComparisonStyle = 'sameness' | 'difference' | 'balanced';

export interface MetaprogramScores {
  // Motivation Direction
  toward: number;
  awayFrom: number;
  
  // Reference Frame
  internal: number;
  external: number;
  
  // Working Style
  options: number;
  procedures: number;
  
  // Chunk Size (General/Specific)
  general: number;
  specific: number;
  
  // Action Filter (Proactive/Reactive)
  proactive: number;
  reactive: number;
  
  // Comparison Style (Sameness/Difference)
  sameness: number;
  difference: number;
}

export interface MetaprogramProfile {
  motivationDirection: MotivationDirection;
  motivationConfidence: number;
  
  referenceFrame: ReferenceFrame;
  referenceConfidence: number;
  
  workingStyle: WorkingStyle;
  workingConfidence: number;
  
  chunkSize: ChunkSize;
  chunkConfidence: number;
  
  actionFilter: ActionFilter;
  actionConfidence: number;
  
  comparisonStyle: ComparisonStyle;
  comparisonConfidence: number;
  
  overallConfidence: number;
  analyzedInteractions: number;
}

export interface MetaprogramAnalysisResult {
  scores: MetaprogramScores;
  detectedWords: {
    toward: string[];
    awayFrom: string[];
    internal: string[];
    external: string[];
    options: string[];
    procedures: string[];
    general: string[];
    specific: string[];
    proactive: string[];
    reactive: string[];
    sameness: string[];
    difference: string[];
  };
}

// Labels and descriptions for each metaprogram
export const METAPROGRAM_LABELS = {
  motivationDirection: {
    toward: {
      name: 'Em Direção A',
      icon: '🎯',
      color: 'bg-success/10 text-success border-success/20',
      description: 'Motivado por objetivos, conquistas e ganhos. Foca no que quer alcançar.',
      communicationTips: [
        'Use palavras como: alcançar, conquistar, obter, ganhar, realizar',
        'Foque nos benefícios e resultados positivos',
        'Mostre o que ele vai GANHAR',
        'Estabeleça metas claras e atraentes'
      ]
    },
    away_from: {
      name: 'Afastar-se De',
      icon: '🛡️',
      color: 'bg-warning/10 text-warning border-warning/20',
      description: 'Motivado por evitar problemas, dores e riscos. Foca no que quer evitar.',
      communicationTips: [
        'Use palavras como: evitar, prevenir, eliminar, resolver, proteger',
        'Destaque os problemas que será resolvidos',
        'Mostre o que ele vai EVITAR',
        'Apresente os riscos de não agir'
      ]
    },
    balanced: {
      name: 'Equilibrado',
      icon: '⚖️',
      color: 'bg-muted text-muted-foreground border-border',
      description: 'Usa ambas as direções motivacionais dependendo do contexto.',
      communicationTips: [
        'Combine benefícios com prevenção de problemas',
        'Mostre o que ganha E o que evita',
        'Adapte conforme o assunto específico'
      ]
    }
  },
  referenceFrame: {
    internal: {
      name: 'Interno',
      icon: '🧭',
      color: 'bg-secondary/10 text-secondary border-secondary/20',
      description: 'Toma decisões baseado em seus próprios critérios e intuição.',
      communicationTips: [
        'Use frases como: "Você vai perceber que...", "Na sua avaliação..."',
        'Deixe espaço para ele decidir por conta própria',
        'Não force opiniões externas',
        'Pergunte: "O que você acha?"'
      ]
    },
    external: {
      name: 'Externo',
      icon: '👥',
      color: 'bg-sky-100 text-sky-700 border-sky-200',
      description: 'Toma decisões baseado em feedback externo, dados e opiniões de outros.',
      communicationTips: [
        'Use depoimentos e casos de sucesso',
        'Mostre estatísticas e dados de mercado',
        'Mencione especialistas e referências',
        'Pergunte: "O que os outros dizem?"'
      ]
    },
    balanced: {
      name: 'Equilibrado',
      icon: '⚖️',
      color: 'bg-muted text-muted-foreground border-border',
      description: 'Usa referência interna e externa dependendo do contexto.',
      communicationTips: [
        'Combine dados externos com espaço para avaliação pessoal',
        'Apresente evidências mas respeite a opinião dele'
      ]
    }
  },
  workingStyle: {
    options: {
      name: 'Opções',
      icon: '🔀',
      color: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
      description: 'Gosta de ter alternativas, flexibilidade e possibilidades.',
      communicationTips: [
        'Ofereça múltiplas alternativas',
        'Use: "Você pode escolher entre...", "Há várias opções..."',
        'Destaque a flexibilidade',
        'Evite processos rígidos'
      ]
    },
    procedures: {
      name: 'Procedimentos',
      icon: '📋',
      color: 'bg-warning/10 text-warning border-warning/20',
      description: 'Prefere processos claros, passo a passo e métodos estruturados.',
      communicationTips: [
        'Apresente um processo passo a passo',
        'Use: "Primeiro... depois... então..."',
        'Mostre metodologias comprovadas',
        'Dê um caminho claro a seguir'
      ]
    },
    balanced: {
      name: 'Equilibrado',
      icon: '⚖️',
      color: 'bg-muted text-muted-foreground border-border',
      description: 'Usa opções e procedimentos dependendo do contexto.',
      communicationTips: [
        'Ofereça opções dentro de um processo estruturado',
        'Combine flexibilidade com clareza'
      ]
    }
  },
  chunkSize: {
    general: {
      name: 'Geral',
      icon: '🌐',
      color: 'bg-primary/10 text-primary border-primary/20',
      description: 'Prefere visão geral, conceitos amplos e o "big picture".',
      communicationTips: [
        'Comece com o panorama geral antes dos detalhes',
        'Use: "Em resumo...", "O conceito principal é..."',
        'Evite excesso de detalhes no início',
        'Mostre como tudo se conecta'
      ]
    },
    specific: {
      name: 'Específico',
      icon: '🔍',
      color: 'bg-info/10 text-info border-info/20',
      description: 'Prefere detalhes, especificidades e informações granulares.',
      communicationTips: [
        'Forneça dados e números específicos',
        'Use: "Especificamente...", "Por exemplo..."',
        'Detalhe cada passo e componente',
        'Responda perguntas com precisão'
      ]
    },
    balanced: {
      name: 'Equilibrado',
      icon: '⚖️',
      color: 'bg-muted text-muted-foreground border-border',
      description: 'Alterna entre visão geral e detalhes conforme necessário.',
      communicationTips: [
        'Comece geral e aprofunde quando pedido',
        'Pergunte: "Quer que eu detalhe?"'
      ]
    }
  },
  actionFilter: {
    proactive: {
      name: 'Proativo',
      icon: '🚀',
      color: 'bg-destructive/10 text-destructive border-destructive/20',
      description: 'Age primeiro, analisa depois. Inicia ações sem esperar.',
      communicationTips: [
        'Use: "Vamos fazer!", "Comece agora!"',
        'Dê autonomia para ele agir',
        'Minimize explicações longas',
        'Foque na ação imediata'
      ]
    },
    reactive: {
      name: 'Reativo',
      icon: '⏳',
      color: 'bg-success/10 text-success border-success/20',
      description: 'Analisa primeiro, age depois. Espera o momento certo.',
      communicationTips: [
        'Use: "Pense sobre isso...", "Quando estiver pronto..."',
        'Dê tempo para análise',
        'Apresente todas as informações antes',
        'Não pressione por decisões imediatas'
      ]
    },
    balanced: {
      name: 'Equilibrado',
      icon: '⚖️',
      color: 'bg-muted text-muted-foreground border-border',
      description: 'Alterna entre ação e análise conforme a situação.',
      communicationTips: [
        'Ofereça opção de agir ou analisar mais',
        'Adapte o ritmo ao contexto'
      ]
    }
  },
  comparisonStyle: {
    sameness: {
      name: 'Igualador',
      icon: '🔗',
      color: 'bg-lime-100 text-lime-700 border-lime-200',
      description: 'Foca em semelhanças, padrões e no que permanece igual.',
      communicationTips: [
        'Use: "Igual ao que você já conhece...", "Similar a..."',
        'Mostre consistência e estabilidade',
        'Destaque o que é familiar',
        'Evite mudanças bruscas na abordagem'
      ]
    },
    difference: {
      name: 'Diferenciador',
      icon: '✨',
      color: 'bg-accent/10 text-accent border-accent/20',
      description: 'Foca em diferenças, novidades e no que é único.',
      communicationTips: [
        'Use: "Diferente de...", "Novo!", "Único!"',
        'Destaque inovação e mudanças',
        'Mostre o que é revolucionário',
        'Apresente contrastes e melhorias'
      ]
    },
    balanced: {
      name: 'Equilibrado',
      icon: '⚖️',
      color: 'bg-muted text-muted-foreground border-border',
      description: 'Valoriza tanto continuidade quanto inovação.',
      communicationTips: [
        'Combine familiaridade com novidade',
        'Mostre evolução gradual'
      ]
    }
  }
};

// Detection keywords for each metaprogram (Portuguese)
export const METAPROGRAM_KEYWORDS = {
  toward: [
    'alcançar', 'conquistar', 'obter', 'ganhar', 'realizar', 'conseguir',
    'atingir', 'chegar', 'crescer', 'melhorar', 'avançar', 'progredir',
    'sucesso', 'objetivo', 'meta', 'sonho', 'ambição', 'desejo',
    'oportunidade', 'possibilidade', 'potencial', 'vantagem', 'benefício',
    'quero', 'preciso ter', 'meu objetivo', 'busco', 'aspiro',
    'almejo', 'pretendo', 'planejo conquistar', 'vou alcançar'
  ],
  awayFrom: [
    'evitar', 'prevenir', 'eliminar', 'resolver', 'proteger', 'escapar',
    'fugir', 'livrar', 'sair de', 'não quero', 'problema', 'dor',
    'risco', 'perigo', 'ameaça', 'medo', 'preocupação', 'cuidado',
    'dificuldade', 'obstáculo', 'barreira', 'impedimento', 'não posso',
    'não dá', 'tenho que resolver', 'preciso acabar com', 'me livrar de',
    'não suporto', 'não aguento', 'chega de', 'basta de'
  ],
  internal: [
    'eu sei', 'eu sinto', 'na minha opinião', 'eu acho', 'eu decido',
    'minha experiência', 'meu feeling', 'minha intuição', 'eu percebo',
    'para mim', 'no meu entendimento', 'eu avalio', 'eu julgo',
    'meu critério', 'minha análise', 'eu determino', 'eu escolho',
    'já me convenci', 'tenho certeza', 'eu defino', 'eu prefiro',
    'minha visão', 'do meu ponto de vista', 'pessoalmente'
  ],
  external: [
    'o que você acha', 'os outros dizem', 'todo mundo', 'as pessoas',
    'pesquisas mostram', 'dados indicam', 'estatísticas', 'estudos',
    'especialistas', 'referências', 'depoimentos', 'feedback',
    'aprovação', 'reconhecimento', 'validação', 'opinião de',
    'recomendação', 'sugestão', 'o mercado', 'a empresa',
    'meu chefe', 'minha equipe', 'clientes dizem', 'concorrência'
  ],
  options: [
    'opções', 'alternativas', 'possibilidades', 'escolhas', 'variedade',
    'flexibilidade', 'liberdade', 'depende', 'pode ser', 'ou então',
    'outra forma', 'diferentes maneiras', 'vários caminhos', 'explorar',
    'experimentar', 'testar', 'ver o que funciona', 'adaptar',
    'modificar', 'personalizar', 'customizar', 'ajustar', 'variar',
    'diversificar', 'não me prenda', 'quero poder mudar'
  ],
  procedures: [
    'processo', 'passo a passo', 'metodologia', 'sistema', 'estrutura',
    'primeiro', 'depois', 'então', 'em seguida', 'por último',
    'etapa', 'fase', 'sequência', 'ordem', 'rotina', 'padrão',
    'procedimento', 'protocolo', 'regra', 'método', 'como funciona',
    'qual o caminho', 'me explica como', 'preciso de um guia',
    'passo por passo', 'na ordem certa', 'seguindo o processo'
  ],
  general: [
    'em geral', 'no geral', 'basicamente', 'resumindo', 'conceito',
    'visão geral', 'panorama', 'big picture', 'ideia principal',
    'essencialmente', 'fundamentalmente', 'grosso modo', 'de forma ampla',
    'o todo', 'como um todo', 'a grande ideia', 'o principal é',
    'não preciso de detalhes', 'só o essencial', 'me dá o resumo'
  ],
  specific: [
    'especificamente', 'detalhadamente', 'exatamente', 'precisamente',
    'qual exatamente', 'me explica em detalhes', 'passo a passo',
    'cada detalhe', 'minuciosamente', 'com precisão', 'números exatos',
    'quanto especificamente', 'como exatamente', 'onde especificamente',
    'quero entender cada parte', 'me dá os detalhes', 'seja específico',
    'por exemplo', 'como funciona cada', 'explica melhor isso'
  ],
  proactive: [
    'vamos fazer', 'vou começar', 'já comecei', 'vou em frente',
    'tomar iniciativa', 'agir agora', 'não espero', 'faço acontecer',
    'mãos à obra', 'bora', 'partiu', 'já era para ter feito',
    'não perco tempo', 'ação imediata', 'começo já', 'vou lá',
    'iniciativa', 'liderar', 'fazer primeiro', 'não fico parado'
  ],
  reactive: [
    'preciso pensar', 'vou analisar', 'deixa eu ver', 'preciso entender',
    'vou estudar', 'me dá um tempo', 'quando estiver pronto',
    'deixa eu processar', 'vou refletir', 'preciso de mais informações',
    'vou considerar', 'depois eu vejo', 'não tenho pressa',
    'vamos com calma', 'espera um pouco', 'quando for o momento',
    'primeiro preciso', 'antes de agir', 'vou avaliar com cuidado'
  ],
  sameness: [
    'igual', 'mesmo', 'similar', 'parecido', 'como antes',
    'continuar', 'manter', 'consistente', 'estável', 'familiar',
    'conhecido', 'tradicional', 'assim como', 'da mesma forma',
    'não muda', 'sempre foi assim', 'funciona igual', 'sem mudanças',
    'mantém o padrão', 'como sempre', 'do mesmo jeito', 'idêntico'
  ],
  difference: [
    'diferente', 'novo', 'inovador', 'mudança', 'revolucionário',
    'único', 'exclusivo', 'inédito', 'original', 'melhorado',
    'atualizado', 'moderno', 'nova versão', 'completamente diferente',
    'não é igual', 'ao contrário', 'diferencia', 'se destaca',
    'o que há de novo', 'novidade', 'inovação', 'nunca visto antes'
  ]
};
