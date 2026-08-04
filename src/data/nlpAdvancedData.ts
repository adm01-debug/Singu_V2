// Advanced NLP Data - Constants, Keywords, and Templates

import { EmotionalState, ValueCategory, ObjectionType, SalesStage } from '@/types/nlp-advanced';

// ============================================
// EMOTIONAL STATES DETECTION
// ============================================
export const EMOTIONAL_STATE_KEYWORDS: Record<EmotionalState, string[]> = {
  excited: [
    'incrível', 'fantástico', 'adorei', 'perfeito', 'maravilhoso', 'excelente',
    'estou animado', 'não vejo a hora', 'empolgado', 'muito bom', 'sensacional',
    'isso é ótimo', 'amei', 'show', 'top', 'demais', 'espetacular'
  ],
  interested: [
    'me conte mais', 'interessante', 'gostaria de saber', 'pode explicar',
    'como funciona', 'quero entender', 'curioso', 'faz sentido', 'legal',
    'bacana', 'isso me interessa', 'quero ver', 'me mostra'
  ],
  curious: [
    'por que', 'como assim', 'o que significa', 'pode detalhar', 'e se',
    'na prática', 'exemplo', 'tipo o que', 'como seria', 'explica melhor'
  ],
  hopeful: [
    'espero que', 'tomara', 'seria bom', 'gostaria muito', 'torço para',
    'acredito que', 'tenho fé', 'vai dar certo', 'otimista', 'esperança'
  ],
  confident: [
    'tenho certeza', 'com certeza', 'sem dúvida', 'obviamente', 'claramente',
    'definitivamente', 'absolutamente', '100%', 'pode contar', 'garantido'
  ],
  neutral: [
    'ok', 'entendi', 'certo', 'tudo bem', 'compreendo', 'aham', 'sim',
    'pode ser', 'talvez', 'vamos ver', 'deixa eu pensar'
  ],
  thoughtful: [
    'preciso pensar', 'vou analisar', 'deixa eu refletir', 'interessante ponto',
    'boa pergunta', 'nunca tinha pensado', 'faz sentido mas', 'por um lado'
  ],
  analytical: [
    'quais os dados', 'estatísticas', 'números', 'comprovação', 'evidências',
    'estudos', 'pesquisa', 'comparativo', 'métricas', 'ROI', 'custo-benefício'
  ],
  hesitant: [
    'não sei', 'talvez', 'vou ver', 'preciso pensar', 'depois a gente vê',
    'deixa eu ver', 'não tenho certeza', 'pode ser', 'quem sabe', 'vamos ver'
  ],
  skeptical: [
    'será que', 'duvido', 'não acredito', 'parece bom demais', 'tem certeza',
    'como posso confiar', 'já ouvi isso antes', 'promessas', 'na teoria'
  ],
  frustrated: [
    'não funciona', 'problema', 'difícil', 'complicado', 'estou cansado',
    'não aguento mais', 'já tentei', 'não resolve', 'perda de tempo', 'chato'
  ],
  anxious: [
    'preocupado', 'medo', 'receio', 'risco', 'e se der errado', 'incerto',
    'inseguro', 'nervoso', 'tenso', 'pressionado', 'urgente', 'deadline'
  ],
  resistant: [
    'não preciso', 'não quero', 'não agora', 'não é para mim', 'não funciona',
    'já tenho', 'não muda nada', 'sempre foi assim', 'não vale a pena'
  ]
};

export const EMOTIONAL_STATE_INFO: Record<EmotionalState, {
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
  salesApproach: string;
}> = {
  excited: {
    name: 'Empolgado',
    icon: '🔥',
    color: 'text-warning',
    bgColor: 'bg-warning/10 border-warning/20',
    description: 'Cliente demonstra alto entusiasmo',
    salesApproach: 'Aproveite o momento! Avance para o fechamento.'
  },
  interested: {
    name: 'Interessado',
    icon: '👀',
    color: 'text-info',
    bgColor: 'bg-info/10 border-info/20',
    description: 'Cliente mostra interesse ativo',
    salesApproach: 'Aprofunde os benefícios e mostre casos de sucesso.'
  },
  curious: {
    name: 'Curioso',
    icon: '🤔',
    color: 'text-secondary',
    bgColor: 'bg-secondary/10 border-secondary/20',
    description: 'Cliente quer saber mais',
    salesApproach: 'Forneça informações detalhadas e exemplos práticos.'
  },
  hopeful: {
    name: 'Esperançoso',
    icon: '🌟',
    color: 'text-warning',
    bgColor: 'bg-warning/10 border-warning/20',
    description: 'Cliente tem expectativas positivas',
    salesApproach: 'Reforce a confiança e mostre como alcançar os resultados.'
  },
  confident: {
    name: 'Confiante',
    icon: '💪',
    color: 'text-success',
    bgColor: 'bg-success/10 border-success/20',
    description: 'Cliente seguro na decisão',
    salesApproach: 'Momento ideal para fechar! Seja direto.'
  },
  neutral: {
    name: 'Neutro',
    icon: '😐',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted border-border',
    description: 'Cliente em estado neutro',
    salesApproach: 'Busque criar interesse com perguntas de descoberta.'
  },
  thoughtful: {
    name: 'Pensativo',
    icon: '🧐',
    color: 'text-primary',
    bgColor: 'bg-primary/10 border-primary/20',
    description: 'Cliente está refletindo',
    salesApproach: 'Dê espaço e faça perguntas que ajudem a clarificar.'
  },
  analytical: {
    name: 'Analítico',
    icon: '📊',
    color: 'text-info',
    bgColor: 'bg-info/10 border-info/20',
    description: 'Cliente quer dados e provas',
    salesApproach: 'Apresente números, cases e ROI comprovado.'
  },
  hesitant: {
    name: 'Hesitante',
    icon: '😬',
    color: 'text-warning',
    bgColor: 'bg-warning/10 border-warning/20',
    description: 'Cliente com dúvidas',
    salesApproach: 'Identifique a objeção oculta e ofereça garantias.'
  },
  skeptical: {
    name: 'Cético',
    icon: '🤨',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10 border-destructive/20',
    description: 'Cliente desconfiado',
    salesApproach: 'Use provas sociais, depoimentos e garantias.'
  },
  frustrated: {
    name: 'Frustrado',
    icon: '😤',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10 border-destructive/20',
    description: 'Cliente irritado ou frustrado',
    salesApproach: 'Ouça ativamente, valide sentimentos e ofereça soluções.'
  },
  anxious: {
    name: 'Ansioso',
    icon: '😰',
    color: 'text-secondary',
    bgColor: 'bg-secondary/10 border-secondary/20',
    description: 'Cliente preocupado ou nervoso',
    salesApproach: 'Tranquilize, reduza riscos percebidos e dê segurança.'
  },
  resistant: {
    name: 'Resistente',
    icon: '🛑',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted border-border',
    description: 'Cliente fechado para mudanças',
    salesApproach: 'Não force. Use perguntas para entender a resistência.'
  }
};

// ============================================
// VALUE CATEGORIES
// ============================================
export const VALUE_CATEGORY_INFO: Record<ValueCategory, {
  name: string;
  icon: string;
  description: string;
  keywords: string[];
  benefitFraming: string;
}> = {
  security: {
    name: 'Segurança',
    icon: '🛡️',
    description: 'Valoriza estabilidade, proteção e previsibilidade',
    keywords: ['seguro', 'garantia', 'proteção', 'estável', 'confiável', 'risco', 'certeza', 'tranquilo'],
    benefitFraming: 'Isso vai proteger você de...'
  },
  freedom: {
    name: 'Liberdade',
    icon: '🦅',
    description: 'Valoriza autonomia, flexibilidade e independência',
    keywords: ['liberdade', 'flexível', 'autonomia', 'independente', 'livre', 'sem amarras', 'quando quiser'],
    benefitFraming: 'Você terá total liberdade para...'
  },
  growth: {
    name: 'Crescimento',
    icon: '📈',
    description: 'Valoriza desenvolvimento, evolução e aprendizado',
    keywords: ['crescer', 'desenvolver', 'evoluir', 'aprender', 'melhorar', 'expandir', 'escalar'],
    benefitFraming: 'Isso vai acelerar seu crescimento em...'
  },
  recognition: {
    name: 'Reconhecimento',
    icon: '🏆',
    description: 'Valoriza status, prestígio e aprovação',
    keywords: ['reconhecido', 'destaque', 'líder', 'referência', 'admirado', 'respeitado', 'premiado'],
    benefitFraming: 'Você será reconhecido como...'
  },
  connection: {
    name: 'Conexão',
    icon: '🤝',
    description: 'Valoriza relacionamentos, pertencimento e colaboração',
    keywords: ['equipe', 'juntos', 'parceria', 'comunidade', 'família', 'relacionamento', 'confiança'],
    benefitFraming: 'Isso vai fortalecer suas conexões com...'
  },
  achievement: {
    name: 'Realização',
    icon: '🎯',
    description: 'Valoriza conquistas, metas e resultados',
    keywords: ['conquistar', 'alcançar', 'meta', 'objetivo', 'resultado', 'sucesso', 'realizar'],
    benefitFraming: 'Você vai conseguir alcançar...'
  },
  control: {
    name: 'Controle',
    icon: '🎮',
    description: 'Valoriza domínio, gestão e poder de decisão',
    keywords: ['controlar', 'gerenciar', 'dominar', 'decidir', 'comandar', 'poder', 'autoridade'],
    benefitFraming: 'Você terá total controle sobre...'
  },
  innovation: {
    name: 'Inovação',
    icon: '💡',
    description: 'Valoriza novidade, criatividade e pioneirismo',
    keywords: ['novo', 'inovador', 'diferente', 'único', 'revolucionário', 'pioneiro', 'moderno'],
    benefitFraming: 'Você será um dos primeiros a...'
  },
  tradition: {
    name: 'Tradição',
    icon: '🏛️',
    description: 'Valoriza história, consistência e valores estabelecidos',
    keywords: ['tradição', 'história', 'comprovado', 'clássico', 'consolidado', 'sempre funcionou'],
    benefitFraming: 'Baseado em décadas de experiência...'
  },
  balance: {
    name: 'Equilíbrio',
    icon: '⚖️',
    description: 'Valoriza harmonia, bem-estar e qualidade de vida',
    keywords: ['equilibrio', 'qualidade de vida', 'bem-estar', 'saúde', 'família', 'tempo'],
    benefitFraming: 'Isso vai te dar mais tempo para...'
  },
  wealth: {
    name: 'Riqueza',
    icon: '💰',
    description: 'Valoriza dinheiro, recursos e prosperidade',
    keywords: ['dinheiro', 'lucro', 'economia', 'investimento', 'retorno', 'renda', 'patrimônio'],
    benefitFraming: 'Você vai economizar/ganhar...'
  },
  impact: {
    name: 'Impacto',
    icon: '🌍',
    description: 'Valoriza contribuição, legado e fazer a diferença',
    keywords: ['impacto', 'diferença', 'legado', 'contribuir', 'ajudar', 'transformar', 'mudar'],
    benefitFraming: 'Isso vai permitir que você impacte...'
  }
};

// ============================================
// HIDDEN OBJECTION PATTERNS
// ============================================
export const OBJECTION_PATTERNS: Record<ObjectionType, {
  name: string;
  icon: string;
  indicators: string[];
  probeQuestions: string[];
  resolutionStrategies: string[];
}> = {
  price: {
    name: 'Preço',
    icon: '💰',
    indicators: [
      'vou pensar', 'preciso analisar', 'orçamento apertado', 'muito caro',
      'não tenho budget', 'está fora do planejado', 'comparar preços'
    ],
    probeQuestions: [
      'Se o preço não fosse uma questão, você fecharia agora?',
      'Qual seria o investimento ideal para você?',
      'O que você precisa ver para justificar esse investimento?'
    ],
    resolutionStrategies: [
      'Divida o valor em parcelas menores',
      'Mostre o custo de NÃO agir',
      'Compare com o custo de alternativas',
      'Apresente ROI e payback'
    ]
  },
  timing: {
    name: 'Timing',
    icon: '⏰',
    indicators: [
      'não é o momento', 'mais para frente', 'ano que vem', 'depois das férias',
      'quando melhorar', 'agora não dá', 'semestre que vem', 'preciso de tempo'
    ],
    probeQuestions: [
      'O que precisa mudar para ser o momento certo?',
      'Qual seria o impacto de esperar X meses?',
      'Se fosse possível começar sem compromisso, faria diferença?'
    ],
    resolutionStrategies: [
      'Mostre o custo de esperar',
      'Ofereça início gradual',
      'Crie urgência legítima',
      'Reduza o compromisso inicial'
    ]
  },
  authority: {
    name: 'Autoridade',
    icon: '👥',
    indicators: [
      'preciso falar com', 'não decido sozinho', 'meu chefe', 'meu sócio',
      'preciso de aprovação', 'vou consultar', 'a decisão não é só minha'
    ],
    probeQuestions: [
      'Quem mais participa dessa decisão?',
      'Como podemos facilitar essa conversa?',
      'O que essa pessoa precisa saber?'
    ],
    resolutionStrategies: [
      'Ofereça material para compartilhar',
      'Proponha reunião com decisor',
      'Prepare o contato para "vender" internamente',
      'Identifique os critérios do decisor'
    ]
  },
  need: {
    name: 'Necessidade',
    icon: '🤷',
    indicators: [
      'não preciso', 'já tenho', 'estou bem assim', 'não é prioridade',
      'não vejo utilidade', 'funciona sem isso', 'não é pra mim'
    ],
    probeQuestions: [
      'Como você resolve isso hoje?',
      'Qual o custo de manter como está?',
      'O que te faria mudar de ideia?'
    ],
    resolutionStrategies: [
      'Mostre problemas não percebidos',
      'Use cases de clientes similares',
      'Ofereça período de teste',
      'Quantifique perdas atuais'
    ]
  },
  trust: {
    name: 'Confiança',
    icon: '🔒',
    indicators: [
      'não conheço', 'nunca ouvi falar', 'como sei que funciona', 'e se der errado',
      'quem mais usa', 'tem referências', 'posso conversar com clientes'
    ],
    probeQuestions: [
      'O que te faria sentir mais seguro?',
      'Que tipo de garantia você precisa?',
      'Posso te conectar com clientes atuais?'
    ],
    resolutionStrategies: [
      'Apresente depoimentos e cases',
      'Ofereça garantia estendida',
      'Mostre tempo de mercado',
      'Conecte com clientes atuais'
    ]
  },
  competition: {
    name: 'Concorrência',
    icon: '⚔️',
    indicators: [
      'já uso outro', 'estou cotando', 'vi opções mais baratas',
      'o concorrente oferece', 'comparando propostas', 'qual o diferencial'
    ],
    probeQuestions: [
      'O que você valoriza mais em uma solução assim?',
      'Qual critério é mais importante para você?',
      'O que faria você trocar o que já usa?'
    ],
    resolutionStrategies: [
      'Foque em diferenciais únicos',
      'Destaque o que só você oferece',
      'Mostre custo oculto de concorrentes',
      'Enfatize suporte e relacionamento'
    ]
  },
  change_resistance: {
    name: 'Resistência a Mudanças',
    icon: '🚫',
    indicators: [
      'sempre fizemos assim', 'equipe vai resistir', 'muito trabalho pra mudar',
      'curva de aprendizado', 'medo de mudar', 'já tentamos antes'
    ],
    probeQuestions: [
      'O que deu errado nas tentativas anteriores?',
      'Como podemos facilitar a transição?',
      'Qual o custo de continuar como está?'
    ],
    resolutionStrategies: [
      'Ofereça implementação gradual',
      'Mostre suporte na transição',
      'Use casos de mudança bem-sucedida',
      'Reduza percepção de complexidade'
    ]
  },
  past_experience: {
    name: 'Experiência Passada',
    icon: '😔',
    indicators: [
      'já tentei', 'não funcionou', 'tive problema', 'me decepcionei',
      'foi um desastre', 'perdi dinheiro', 'nunca mais'
    ],
    probeQuestions: [
      'O que exatamente deu errado?',
      'O que seria diferente agora?',
      'O que te faria tentar novamente?'
    ],
    resolutionStrategies: [
      'Valide a experiência negativa',
      'Mostre o que é diferente agora',
      'Ofereça garantias específicas',
      'Comece com compromisso mínimo'
    ]
  }
};

// ============================================
// SALES STAGES
// ============================================
export const SALES_STAGE_INFO: Record<SalesStage, {
  name: string;
  icon: string;
  objective: string;
  duration: string;
  keyActions: string[];
  transitionSignals: string[];
}> = {
  rapport: {
    name: 'Rapport',
    icon: '🤝',
    objective: 'Criar conexão e confiança inicial',
    duration: '2-5 minutos',
    keyActions: [
      'Use espelhamento verbal e corporal',
      'Encontre pontos em comum',
      'Demonstre interesse genuíno',
      'Adapte-se ao ritmo do cliente'
    ],
    transitionSignals: [
      'Cliente relaxa e abre linguagem corporal',
      'Começa a compartilhar informações pessoais',
      'Ri ou sorri naturalmente',
      'Faz perguntas sobre você'
    ]
  },
  discovery: {
    name: 'Descoberta',
    icon: '🔍',
    objective: 'Entender necessidades, dores e desejos',
    duration: '10-20 minutos',
    keyActions: [
      'Faça perguntas abertas',
      'Ouça ativamente',
      'Aprofunde com "me conta mais"',
      'Identifique o problema real'
    ],
    transitionSignals: [
      'Cliente expressa claramente a dor',
      'Demonstra urgência em resolver',
      'Pergunta sobre soluções',
      'Compartilha tentativas anteriores'
    ]
  },
  presentation: {
    name: 'Apresentação',
    icon: '🎯',
    objective: 'Mostrar como você resolve o problema',
    duration: '15-30 minutos',
    keyActions: [
      'Conecte benefícios às dores descobertas',
      'Use a linguagem VAK do cliente',
      'Mostre provas e cases',
      'Faça o cliente imaginar usando'
    ],
    transitionSignals: [
      'Cliente faz perguntas específicas',
      'Pede preços ou condições',
      'Menciona próximos passos',
      'Expressa entusiasmo'
    ]
  },
  objection_handling: {
    name: 'Tratamento de Objeções',
    icon: '🛡️',
    objective: 'Resolver dúvidas e resistências',
    duration: '5-15 minutos',
    keyActions: [
      'Valide a preocupação',
      'Aprofunde para entender a raiz',
      'Reframe a objeção',
      'Ofereça provas e garantias'
    ],
    transitionSignals: [
      'Cliente aceita a resposta',
      'Não levanta novas objeções',
      'Muda para perguntas práticas',
      'Relaxa após a explicação'
    ]
  },
  negotiation: {
    name: 'Negociação',
    icon: '⚖️',
    objective: 'Chegar a um acordo mutuamente benéfico',
    duration: '10-20 minutos',
    keyActions: [
      'Entenda prioridades do cliente',
      'Ofereça opções, não descontos',
      'Crie valor antes de ceder',
      'Use concessões estratégicas'
    ],
    transitionSignals: [
      'Acordo sobre termos principais',
      'Cliente pergunta como pagar',
      'Discute implementação',
      'Pede contrato ou proposta'
    ]
  },
  closing: {
    name: 'Fechamento',
    icon: '✅',
    objective: 'Obter o compromisso de compra',
    duration: '5-10 minutos',
    keyActions: [
      'Resuma os benefícios acordados',
      'Peça a decisão diretamente',
      'Lide com hesitações finais',
      'Confirme próximos passos'
    ],
    transitionSignals: [
      'Cliente diz sim',
      'Assina contrato',
      'Faz pagamento',
      'Agenda implementação'
    ]
  },
  follow_up: {
    name: 'Follow-up',
    icon: '🔄',
    objective: 'Manter relacionamento e gerar indicações',
    duration: 'Contínuo',
    keyActions: [
      'Acompanhe implementação',
      'Peça feedback',
      'Identifique novas oportunidades',
      'Solicite indicações'
    ],
    transitionSignals: [
      'Cliente satisfeito',
      'Dá depoimento positivo',
      'Faz indicações',
      'Compra novamente'
    ]
  }
};

// ============================================
// RAPPORT TEMPLATES
// ============================================
export const RAPPORT_TEMPLATES = {
  mirroring: {
    visual: [
      'Vejo que você tem uma visão muito clara sobre isso...',
      'Fica evidente o panorama que você enxerga...',
      'Olhando da sua perspectiva, faz total sentido...'
    ],
    auditory: [
      'Ouço claramente sua preocupação...',
      'Isso ressoa muito com o que outros clientes dizem...',
      'O que você está me contando soa muito familiar...'
    ],
    kinesthetic: [
      'Sinto que você está no caminho certo...',
      'Dá para sentir a solidez do seu raciocínio...',
      'Tenho a sensação de que nos conectamos bem...'
    ],
    digital: [
      'Faz total sentido lógico o que você diz...',
      'Analisando os pontos que você levantou...',
      'Do ponto de vista racional, concordo plenamente...'
    ]
  },
  pacing: {
    D: [
      'Vamos direto ao ponto então...',
      'Resumindo em 3 pontos principais...',
      'Aqui está o que você precisa saber...'
    ],
    I: [
      'Que história incrível você tem!',
      'Adorei conhecer mais sobre você!',
      'Você tem uma energia contagiante!'
    ],
    S: [
      'Não tenha pressa, estou aqui para ajudar...',
      'Vamos com calma, um passo de cada vez...',
      'Entendo sua preocupação em fazer a coisa certa...'
    ],
    C: [
      'Vou te passar os detalhes com precisão...',
      'Tenho todos os dados aqui para você analisar...',
      'Vamos verificar cada ponto com cuidado...'
    ]
  }
};

// ============================================
// POWER WORDS BY PROFILE
// ============================================
export const POWER_WORDS = {
  vak: {
    V: ['ver', 'olhar', 'claro', 'brilhante', 'perspectiva', 'visualizar', 'foco', 'imagem', 'mostrar'],
    A: ['ouvir', 'soar', 'ressoar', 'harmonia', 'tom', 'conversar', 'dizer', 'contar', 'eco'],
    K: ['sentir', 'tocar', 'sólido', 'firme', 'confortável', 'seguro', 'conexão', 'peso', 'caloroso'],
    D: ['analisar', 'lógico', 'dados', 'fatos', 'processo', 'sistema', 'estratégia', 'raciocinar', 'considerar']
  },
  disc: {
    D: ['resultado', 'rápido', 'agora', 'objetivo', 'direto', 'eficiente', 'ganhar', 'liderar', 'decisão'],
    I: ['incrível', 'fantástico', 'divertido', 'emocionante', 'inovador', 'inspirador', 'juntos', 'celebrar'],
    S: ['seguro', 'estável', 'confiável', 'passo a passo', 'suporte', 'garantia', 'tranquilo', 'equipe'],
    C: ['preciso', 'detalhado', 'comprovado', 'qualidade', 'correto', 'exato', 'verificado', 'metodologia']
  },
  metaprograms: {
    toward: ['alcançar', 'conquistar', 'ganhar', 'obter', 'crescer', 'objetivo', 'meta', 'sucesso'],
    away_from: ['evitar', 'prevenir', 'eliminar', 'proteger', 'resolver', 'escapar', 'parar de perder'],
    internal: ['você decide', 'sua análise', 'seu critério', 'na sua opinião', 'você vai perceber'],
    external: ['outros dizem', 'pesquisas mostram', 'especialistas', 'clientes confirmam', 'dados indicam'],
    options: ['alternativas', 'possibilidades', 'você pode escolher', 'várias formas', 'flexível'],
    procedures: ['primeiro', 'depois', 'passo a passo', 'processo', 'metodologia', 'em seguida']
  }
};
