// ==============================================
// DISC ADVANCED DATA - Enterprise Level System
// Complete behavioral intelligence for DISC profiles
// ==============================================

import { DISCProfile } from '@/types';

// ==============================================
// DISC PROFILE CONFIGURATION
// ==============================================

export interface DISCProfileInfo {
  type: DISCProfile;
  name: string;
  shortDescription: string;
  detailedDescription: string;
  
  // Core psychology
  coreDrive: string;
  coreFear: string;
  underPressure: string;
  idealEnvironment: string;
  
  // Communication
  communicationStyle: {
    pace: 'fast' | 'moderate' | 'slow';
    focus: 'task' | 'people' | 'data' | 'harmony';
    preferredFormat: string;
    responseExpectation: string;
  };
  
  // Decision making
  decisionStyle: {
    speed: 'impulsive' | 'fast' | 'moderate' | 'slow' | 'analytical';
    criteria: string[];
    needsFrom: string[];
    avoidsIn: string[];
  };
  
  // Sales strategies
  salesApproach: {
    opening: string[];
    presentation: string[];
    objectionHandling: string[];
    closing: string[];
    followUp: string[];
    warnings: string[];
  };
  
  // Language patterns
  powerWords: string[];
  avoidWords: string[];
  typicalPhrases: string[];
  detectionKeywords: string[];
  
  // Visual
  color: {
    primary: string;
    secondary: string;
    bg: string;
    text: string;
    border: string;
  };
  icon: string;
}

export const DISC_PROFILES: Record<Exclude<DISCProfile, null>, DISCProfileInfo> = {
  D: {
    type: 'D',
    name: 'Dominante',
    shortDescription: 'Direto, decisivo, focado em resultados',
    detailedDescription: 'O perfil Dominante é orientado a resultados, competitivo e assertivo. Valoriza eficiência, autoridade e ação rápida. Prefere estar no controle e tomar decisões. Tem baixa tolerância para detalhes e processos lentos.',
    
    coreDrive: 'Resultados e Controle',
    coreFear: 'Perder o controle e ser vulnerável',
    underPressure: 'Torna-se mais agressivo, impaciente e pode atropelar os outros',
    idealEnvironment: 'Ambiente desafiador, com autonomia, onde possa liderar e ver resultados rápidos',
    
    communicationStyle: {
      pace: 'fast',
      focus: 'task',
      preferredFormat: 'Bullet points, executivo, sem rodeios',
      responseExpectation: 'Imediata e decisiva'
    },
    
    decisionStyle: {
      speed: 'fast',
      criteria: ['ROI', 'Velocidade', 'Vantagem competitiva', 'Resultados mensuráveis'],
      needsFrom: ['Dados de resultado', 'Evidência de eficácia', 'Controle sobre processo'],
      avoidsIn: ['Processos lentos', 'Muitos detalhes', 'Falta de autonomia']
    },
    
    salesApproach: {
      opening: [
        'Vou direto ao ponto: tenho algo que pode aumentar seus resultados em X%.',
        'Sei que você valoriza seu tempo. Em 5 minutos, vou mostrar como você pode...',
        'O que eu tenho aqui resolve o problema X que está te custando Y.'
      ],
      presentation: [
        'Foque em 3 benefícios principais máximo',
        'Mostre ROI e resultados mensuráveis',
        'Use cases de líderes de mercado',
        'Deixe ele no controle fazendo perguntas "O que você prefere: A ou B?"'
      ],
      objectionHandling: [
        'Valide a preocupação rapidamente e mostre como superar',
        '"Entendo. E se eu te mostrar como outros líderes superaram isso?"',
        'Use dados e resultados de outros para convencer'
      ],
      closing: [
        '"Quando você quer começar: esta semana ou na próxima?"',
        '"Qual o próximo passo que você quer dar?"',
        '"Vou preparar o contrato para você assinar hoje."'
      ],
      followUp: [
        'Seja breve e focado em próximos passos',
        'Mostre progresso e resultados alcançados',
        'Não enrole - se não tem novidade, não mande mensagem'
      ],
      warnings: [
        '⚠️ Nunca pareça inseguro ou hesitante',
        '⚠️ Não enrole ou dê voltas para chegar ao ponto',
        '⚠️ Não questione a autoridade dele',
        '⚠️ Não seja prolixo ou detalhista demais'
      ]
    },
    
    powerWords: [
      'resultado', 'agora', 'direto', 'rápido', 'eficiente', 'objetivo', 
      'vencer', 'liderar', 'decisão', 'controle', 'poder', 'sucesso',
      'garantido', 'exclusivo', 'primeiro', 'melhor', 'competitivo'
    ],
    avoidWords: [
      'talvez', 'quando puder', 'se der tempo', 'depende', 'vamos ver',
      'processo longo', 'precisamos analisar', 'vou pensar'
    ],
    typicalPhrases: [
      'Vai direto ao ponto',
      'Quanto custa e quando fica pronto?',
      'Qual o resultado?',
      'Não tenho tempo para isso',
      'Me dá o resumo'
    ],
    detectionKeywords: [
      'resultado', 'meta', 'objetivo', 'prazo', 'rápido', 'eficiente',
      'direto', 'decidir', 'resolver', 'ganhar', 'vencer', 'liderar',
      'imediato', 'agora', 'performance', 'produtividade'
    ],
    
    color: {
      primary: 'hsl(0, 84%, 60%)',
      secondary: 'hsl(0, 60%, 50%)',
      bg: 'bg-destructive/5 dark:bg-destructive/10',
      text: 'text-destructive',
      border: 'border-destructive/20 dark:border-red-800'
    },
    icon: '⚡'
  },
  
  I: {
    type: 'I',
    name: 'Influente',
    shortDescription: 'Entusiasta, otimista, focado em pessoas',
    detailedDescription: 'O perfil Influente é sociável, entusiasta e persuasivo. Valoriza relacionamentos, reconhecimento e experiências positivas. Gosta de inspirar e influenciar outros. Pode ter dificuldade com detalhes e follow-through.',
    
    coreDrive: 'Reconhecimento e Conexão Social',
    coreFear: 'Rejeição e perda de aprovação',
    underPressure: 'Torna-se desorganizado, emocional e pode prometer demais',
    idealEnvironment: 'Ambiente social, criativo, com liberdade de expressão e reconhecimento',
    
    communicationStyle: {
      pace: 'fast',
      focus: 'people',
      preferredFormat: 'Conversacional, histórias, entusiasmo',
      responseExpectation: 'Calorosa e engajada'
    },
    
    decisionStyle: {
      speed: 'impulsive',
      criteria: ['Impacto social', 'Inovação', 'Experiência', 'Reconhecimento'],
      needsFrom: ['Entusiasmo', 'Testemunhos', 'Visão inspiradora'],
      avoidsIn: ['Análise fria', 'Muitos detalhes', 'Processos burocráticos']
    },
    
    salesApproach: {
      opening: [
        'Cara, você não vai acreditar no que eu descobri!',
        'Que bom te ver! Preciso compartilhar algo incrível contigo.',
        'Imagina só o impacto que isso vai causar na sua equipe!'
      ],
      presentation: [
        'Use histórias e testemunhos',
        'Mostre o impacto social e reconhecimento',
        'Seja entusiasta e energético',
        'Permita que ele fale e compartilhe ideias'
      ],
      objectionHandling: [
        'Valide os sentimentos primeiro',
        '"Entendo totalmente! Muita gente sentiu isso no começo, mas olha o que aconteceu..."',
        'Use histórias de transformação'
      ],
      closing: [
        '"Vamos fazer parte dessa história juntos?"',
        '"Imagina quando você contar pra galera que foi pioneiro nisso!"',
        '"O que você acha de começarmos agora enquanto a energia está alta?"'
      ],
      followUp: [
        'Seja pessoal e caloroso',
        'Celebre pequenas vitórias juntos',
        'Mantenha a energia e entusiasmo'
      ],
      warnings: [
        '⚠️ Nunca seja frio ou distante',
        '⚠️ Não corte o entusiasmo dele',
        '⚠️ Não foque só em números e dados',
        '⚠️ Não ignore as ideias dele'
      ]
    },
    
    powerWords: [
      'incrível', 'fantástico', 'revolucionário', 'inovador', 'inspirador',
      'divertido', 'emocionante', 'juntos', 'equipe', 'celebrar', 'impacto',
      'reconhecido', 'destaque', 'criativo', 'único', 'experiência'
    ],
    avoidWords: [
      'análise', 'dados frios', 'processo', 'procedimento', 'burocracia',
      'regras', 'limitação', 'rotina', 'repetitivo'
    ],
    typicalPhrases: [
      'Que demais!',
      'Adorei a ideia!',
      'Vamos fazer acontecer!',
      'Imagina só...',
      'A galera vai adorar!'
    ],
    detectionKeywords: [
      'incrível', 'fantástico', 'adorei', 'legal', 'show', 'demais',
      'equipe', 'pessoal', 'juntos', 'celebrar', 'festa', 'divertido',
      'novo', 'inovador', 'criativo', 'impacto', 'reconhecimento'
    ],
    
    color: {
      primary: 'hsl(48, 96%, 53%)',
      secondary: 'hsl(48, 80%, 45%)',
      bg: 'bg-warning/5 dark:bg-warning/10',
      text: 'text-warning',
      border: 'border-warning/20 dark:border-yellow-800'
    },
    icon: '🌟'
  },
  
  S: {
    type: 'S',
    name: 'Estável',
    shortDescription: 'Paciente, confiável, focado em segurança',
    detailedDescription: 'O perfil Estável é leal, paciente e um bom ouvinte. Valoriza harmonia, estabilidade e relacionamentos duradouros. Prefere ambientes previsíveis e mudanças graduais. Pode ter dificuldade com confrontos e mudanças rápidas.',
    
    coreDrive: 'Segurança e Harmonia',
    coreFear: 'Mudanças repentinas e conflitos',
    underPressure: 'Torna-se passivo, indeciso e pode concordar sem realmente aceitar',
    idealEnvironment: 'Ambiente estável, harmonioso, com relacionamentos de longo prazo e mudanças graduais',
    
    communicationStyle: {
      pace: 'slow',
      focus: 'harmony',
      preferredFormat: 'Calmo, passo a passo, com tempo para processar',
      responseExpectation: 'Calorosa mas não apressada'
    },
    
    decisionStyle: {
      speed: 'slow',
      criteria: ['Segurança', 'Estabilidade', 'Impacto na equipe', 'Suporte'],
      needsFrom: ['Garantias', 'Suporte contínuo', 'Tempo para pensar', 'Transição gradual'],
      avoidsIn: ['Pressão', 'Mudanças bruscas', 'Conflitos', 'Incerteza']
    },
    
    salesApproach: {
      opening: [
        'Como você está? Espero que esteja tudo bem com você e sua família.',
        'Não tenha pressa, estou aqui para ajudar no que você precisar.',
        'Muitos clientes como você passaram por essa mesma situação...'
      ],
      presentation: [
        'Vá devagar e seja paciente',
        'Mostre estabilidade e segurança',
        'Envolva a equipe na decisão',
        'Garanta suporte pós-venda'
      ],
      objectionHandling: [
        'Dê tempo para processar',
        '"Entendo sua preocupação. Não precisa decidir agora."',
        'Mostre como outros clientes similares fizeram a transição'
      ],
      closing: [
        '"Quando você se sentir confortável, estou aqui."',
        '"Podemos começar com um teste pequeno, sem compromisso?"',
        '"Que tal revisarmos juntos com calma antes de decidir?"'
      ],
      followUp: [
        'Seja consistente e presente',
        'Não pressione - mostre que você está lá quando ele precisar',
        'Celebre a estabilidade do relacionamento'
      ],
      warnings: [
        '⚠️ Nunca pressione por decisões rápidas',
        '⚠️ Não mude as coisas bruscamente',
        '⚠️ Não ignore as preocupações dele',
        '⚠️ Não seja impaciente ou agressivo'
      ]
    },
    
    powerWords: [
      'seguro', 'estável', 'confiável', 'garantia', 'suporte', 'equipe',
      'juntos', 'passo a passo', 'tranquilo', 'harmonia', 'proteção',
      'comprovado', 'testado', 'sem risco', 'gradual', 'contínuo'
    ],
    avoidWords: [
      'urgente', 'agora', 'rápido', 'mudança radical', 'revolucionário',
      'disruptivo', 'pressão', 'deadline', 'imediato'
    ],
    typicalPhrases: [
      'Deixa eu pensar um pouco...',
      'Preciso conversar com a equipe',
      'Como isso afeta os outros?',
      'Sempre fizemos assim...',
      'E se der errado?'
    ],
    detectionKeywords: [
      'calma', 'paciência', 'segurança', 'estabilidade', 'equipe',
      'família', 'confiança', 'suporte', 'harmonia', 'tradição',
      'sempre', 'continuidade', 'rotina', 'preocupação'
    ],
    
    color: {
      primary: 'hsl(142, 71%, 45%)',
      secondary: 'hsl(142, 60%, 40%)',
      bg: 'bg-success/5 dark:bg-success/10',
      text: 'text-success',
      border: 'border-success/20 dark:border-green-800'
    },
    icon: '🛡️'
  },
  
  C: {
    type: 'C',
    name: 'Conforme',
    shortDescription: 'Analítico, preciso, focado em qualidade',
    detailedDescription: 'O perfil Conforme é sistemático, analítico e orientado a qualidade. Valoriza precisão, lógica e padrões elevados. Prefere trabalhar com dados e processos bem definidos. Pode ter dificuldade com ambiguidade e decisões rápidas.',
    
    coreDrive: 'Qualidade e Precisão',
    coreFear: 'Cometer erros e ser criticado',
    underPressure: 'Torna-se excessivamente crítico, defensivo e pode travar na análise',
    idealEnvironment: 'Ambiente organizado, com regras claras, tempo para análise e padrões de qualidade',
    
    communicationStyle: {
      pace: 'moderate',
      focus: 'data',
      preferredFormat: 'Detalhado, documentado, com dados e referências',
      responseExpectation: 'Precisa e bem fundamentada'
    },
    
    decisionStyle: {
      speed: 'analytical',
      criteria: ['Dados', 'Qualidade', 'Processo', 'Comprovação'],
      needsFrom: ['Documentação completa', 'Tempo para análise', 'Garantias por escrito'],
      avoidsIn: ['Pressão', 'Ambiguidade', 'Falta de dados', 'Promessas vagas']
    },
    
    salesApproach: {
      opening: [
        'Preparei uma análise completa para você revisar.',
        'Vou te passar os dados e métricas para você avaliar.',
        'Tenho toda a documentação técnica aqui.'
      ],
      presentation: [
        'Traga dados, métricas e comprovações',
        'Seja preciso e detalhado',
        'Apresente documentação técnica',
        'Respeite o tempo de análise dele'
      ],
      objectionHandling: [
        'Traga mais dados para responder',
        '"Ótima pergunta. Deixa eu te mostrar os dados sobre isso..."',
        'Valide a análise crítica dele'
      ],
      closing: [
        '"Você gostaria de mais tempo para analisar a proposta?"',
        '"Posso te enviar toda a documentação por escrito?"',
        '"Quando você tiver concluído sua análise, me avisa."'
      ],
      followUp: [
        'Envie documentação adicional proativamente',
        'Responda perguntas com precisão e dados',
        'Não pressione - deixe ele concluir a análise'
      ],
      warnings: [
        '⚠️ Nunca seja vago ou impreciso',
        '⚠️ Não pressione por decisões rápidas',
        '⚠️ Não exagere ou faça promessas que não pode provar',
        '⚠️ Não ignore detalhes técnicos'
      ]
    },
    
    powerWords: [
      'preciso', 'comprovado', 'dados', 'análise', 'qualidade', 'metodologia',
      'processo', 'documentado', 'verificado', 'certificado', 'padrão',
      'correto', 'exato', 'detalhado', 'científico', 'pesquisa'
    ],
    avoidWords: [
      'aproximadamente', 'mais ou menos', 'acho que', 'talvez',
      'confia em mim', 'intuitivamente', 'improviso', 'flexível demais'
    ],
    typicalPhrases: [
      'Preciso analisar os dados',
      'Tem documentação sobre isso?',
      'Qual a metodologia?',
      'Como você chegou nesses números?',
      'Posso ver os detalhes técnicos?'
    ],
    detectionKeywords: [
      'análise', 'dados', 'números', 'estatística', 'metodologia',
      'processo', 'qualidade', 'padrão', 'documentação', 'comprovação',
      'pesquisa', 'estudo', 'precisão', 'detalhes', 'especificação'
    ],
    
    color: {
      primary: 'hsl(217, 91%, 60%)',
      secondary: 'hsl(217, 80%, 50%)',
      bg: 'bg-info/5 dark:bg-info/10',
      text: 'text-info',
      border: 'border-info/20 dark:border-blue-800'
    },
    icon: '📊'
  }
};

// ==============================================
// BLEND PROFILES (DI, DC, IS, SC, etc)
// ==============================================

export interface BlendProfileInfo {
  code: string;
  name: string;
  description: string;
  strengthCombination: string;
  weaknessCombination: string;
  keyTips: string[];
}

export const DISC_BLEND_PROFILES: Record<string, BlendProfileInfo> = {
  DI: {
    code: 'DI',
    name: 'Inspirador',
    description: 'Combina orientação a resultados com habilidades sociais. Líder carismático que mobiliza pessoas para ação.',
    strengthCombination: 'Liderança dinâmica + Carisma',
    weaknessCombination: 'Pode atropelar detalhes e pessoas mais lentas',
    keyTips: [
      'Valorize tanto os resultados quanto as pessoas',
      'Dê espaço para ele liderar e brilhar',
      'Seja direto mas também entusiasta'
    ]
  },
  DC: {
    code: 'DC',
    name: 'Desafiador',
    description: 'Combina assertividade com análise. Líder que busca resultados através de processos eficientes.',
    strengthCombination: 'Orientação a resultados + Pensamento estratégico',
    weaknessCombination: 'Pode ser excessivamente crítico e impaciente',
    keyTips: [
      'Traga dados que suportem resultados',
      'Seja direto e eficiente',
      'Mostre competência técnica'
    ]
  },
  ID: {
    code: 'ID',
    name: 'Persuasor',
    description: 'Combina entusiasmo com foco em resultados. Vendedor nato que encanta e fecha.',
    strengthCombination: 'Carisma + Orientação a resultados',
    weaknessCombination: 'Pode prometer demais e negligenciar detalhes',
    keyTips: [
      'Permita criatividade mas mantenha foco',
      'Celebre vitórias e progresso',
      'Seja flexível mas produtivo'
    ]
  },
  IS: {
    code: 'IS',
    name: 'Apoiador',
    description: 'Combina sociabilidade com lealdade. Excelente em construir relacionamentos de longo prazo.',
    strengthCombination: 'Relacionamento + Consistência',
    weaknessCombination: 'Pode evitar confrontos necessários',
    keyTips: [
      'Construa relacionamento genuíno',
      'Dê tempo e segurança',
      'Valorize a lealdade dele'
    ]
  },
  SI: {
    code: 'SI',
    name: 'Facilitador',
    description: 'Combina estabilidade com sociabilidade. Conector que une pessoas e mantém harmonia.',
    strengthCombination: 'Harmonia + Conexão social',
    weaknessCombination: 'Pode ser passivo demais e evitar decisões',
    keyTips: [
      'Envolva o time na decisão',
      'Seja caloroso e paciente',
      'Não pressione'
    ]
  },
  SC: {
    code: 'SC',
    name: 'Técnico',
    description: 'Combina consistência com precisão. Profissional confiável que entrega qualidade.',
    strengthCombination: 'Confiabilidade + Qualidade',
    weaknessCombination: 'Pode ser resistente a mudanças e lento',
    keyTips: [
      'Traga dados e segurança',
      'Dê muito tempo para análise',
      'Mostre estabilidade e processo'
    ]
  },
  CS: {
    code: 'CS',
    name: 'Especialista',
    description: 'Combina análise com estabilidade. Expert técnico que valoriza processos estabelecidos.',
    strengthCombination: 'Expertise + Consistência',
    weaknessCombination: 'Pode ser excessivamente conservador',
    keyTips: [
      'Respeite o conhecimento dele',
      'Traga mudanças graduais',
      'Documente tudo'
    ]
  },
  CD: {
    code: 'CD',
    name: 'Questionador',
    description: 'Combina análise crítica com assertividade. Desafia status quo com dados.',
    strengthCombination: 'Pensamento crítico + Ação',
    weaknessCombination: 'Pode ser excessivamente crítico e direto',
    keyTips: [
      'Esteja preparado para ser questionado',
      'Traga evidências sólidas',
      'Seja objetivo e eficiente'
    ]
  }
};

// ==============================================
// COMPATIBILITY MATRIX - EXPANDED
// ==============================================

export interface CompatibilityInfo {
  score: number; // 0-100
  dynamic: string;
  tips: string[];
  challenges: string[];
  opportunities: string[];
}

export const DISC_COMPATIBILITY_MATRIX: Record<string, Record<string, CompatibilityInfo>> = {
  D: {
    D: {
      score: 60,
      dynamic: 'Dois líderes podem colidir ou criar sinergia explosiva',
      tips: ['Defina papéis claros', 'Foque em resultados comuns', 'Evite competição desnecessária'],
      challenges: ['Conflito de ego', 'Quem manda?', 'Atropelo mútuo'],
      opportunities: ['Resultados rápidos', 'Decisões ágeis', 'Alta energia']
    },
    I: {
      score: 85,
      dynamic: 'Excelente! D traz foco, I traz energia e relacionamento',
      tips: ['D pode se inspirar no entusiasmo de I', 'I pode se beneficiar do foco de D'],
      challenges: ['D pode achar I muito falador', 'I pode achar D muito duro'],
      opportunities: ['Liderança inspiradora', 'Fechamentos rápidos', 'Ambiente energizado']
    },
    S: {
      score: 50,
      dynamic: 'Desafiadora - D precisa desacelerar muito',
      tips: ['D deve praticar paciência', 'Dar segurança e tempo', 'Não pressionar'],
      challenges: ['Ritmos muito diferentes', 'D pode intimidar S', 'S pode travar'],
      opportunities: ['D pode aprender paciência', 'S pode se sentir seguro com liderança clara']
    },
    C: {
      score: 70,
      dynamic: 'Pode funcionar se D respeitar a análise de C',
      tips: ['D deve trazer dados', 'C deve ser mais ágil', 'Foco em resultados com qualidade'],
      challenges: ['D impaciente com análises', 'C pode travar D'],
      opportunities: ['Decisões rápidas e bem fundamentadas', 'Resultados com qualidade']
    }
  },
  I: {
    D: {
      score: 85,
      dynamic: 'I admira a assertividade de D, D se energiza com I',
      tips: ['I pode moderar a dureza de D', 'D pode focar a energia de I'],
      challenges: ['I pode se sentir controlado', 'D pode achar I disperso'],
      opportunities: ['Apresentações impactantes', 'Networking + Fechamento']
    },
    I: {
      score: 70,
      dynamic: 'Alta energia mas pode faltar foco',
      tips: ['Definir responsabilidades claras', 'Ter alguém de fora para manter foco'],
      challenges: ['Muita conversa, pouca ação', 'Competição por atenção'],
      opportunities: ['Ideias criativas', 'Ambiente divertido', 'Networking forte']
    },
    S: {
      score: 80,
      dynamic: 'I anima S, S acalma I - boa complementaridade',
      tips: ['I deve dar tempo para S processar', 'S pode se energizar com I'],
      challenges: ['I pode sobrecarregar S', 'S pode achar I agitado demais'],
      opportunities: ['Relacionamentos duradouros', 'Ambiente acolhedor']
    },
    C: {
      score: 55,
      dynamic: 'Desafiadora - estilos muito diferentes',
      tips: ['I deve trazer mais dados', 'C deve ser mais flexível'],
      challenges: ['I acha C frio', 'C acha I superficial'],
      opportunities: ['I pode humanizar C', 'C pode organizar I']
    }
  },
  S: {
    D: {
      score: 50,
      dynamic: 'S precisa de tempo, D precisa de ação - tensão natural',
      tips: ['D deve praticar paciência extrema', 'S deve se preparar para ritmo mais rápido'],
      challenges: ['D intimida S', 'S trava com pressão'],
      opportunities: ['S pode estabilizar D', 'D pode mobilizar S']
    },
    I: {
      score: 80,
      dynamic: 'I energiza S de forma positiva e calorosa',
      tips: ['I deve respeitar o ritmo de S', 'S pode se beneficiar da energia de I'],
      challenges: ['I pode ser muito intenso', 'S pode achar I superficial'],
      opportunities: ['Ambiente acolhedor e estável', 'Relacionamentos genuínos']
    },
    S: {
      score: 75,
      dynamic: 'Harmonia natural mas pode faltar iniciativa',
      tips: ['Definir quem toma iniciativa', 'Trazer elemento de ação de fora'],
      challenges: ['Passividade mútua', 'Evitam confrontos necessários'],
      opportunities: ['Relacionamento muito estável', 'Confiança mútua alta']
    },
    C: {
      score: 85,
      dynamic: 'Excelente! S traz harmonia, C traz qualidade',
      tips: ['Ambos valorizam processos e estabilidade'],
      challenges: ['Podem ser lentos demais juntos', 'Resistência a mudanças'],
      opportunities: ['Trabalho de alta qualidade', 'Relacionamento confiável']
    }
  },
  C: {
    D: {
      score: 70,
      dynamic: 'C traz dados, D traz ação - pode ser produtivo',
      tips: ['C deve ser mais ágil', 'D deve respeitar a análise'],
      challenges: ['D impaciente', 'C pode travar processo'],
      opportunities: ['Decisões bem fundamentadas e rápidas']
    },
    I: {
      score: 55,
      dynamic: 'Estilos muito diferentes - precisa esforço',
      tips: ['I deve trazer mais substância', 'C deve ser mais aberto'],
      challenges: ['C acha I superficial', 'I acha C frio'],
      opportunities: ['I pode inspirar C', 'C pode organizar I']
    },
    S: {
      score: 85,
      dynamic: 'Excelente! Ambos valorizam qualidade e processo',
      tips: ['Construam em cima da confiança mútua'],
      challenges: ['Podem ser lentos', 'Resistentes a mudanças'],
      opportunities: ['Trabalho consistente e de qualidade']
    },
    C: {
      score: 65,
      dynamic: 'Dois analíticos podem travar em análise',
      tips: ['Definir deadlines', 'Ter tomador de decisão externo'],
      challenges: ['Paralisia por análise', 'Excesso de crítica'],
      opportunities: ['Trabalho altamente preciso', 'Análises profundas']
    }
  }
};

// ==============================================
// STRESS PROFILES - How DISC changes under pressure
// ==============================================

export const DISC_STRESS_SHIFTS: Record<Exclude<DISCProfile, null>, {
  becomesMore: string[];
  becomesLess: string[];
  typicalShift: DISCProfile | null;
  copingMechanism: string;
  deEscalationTips: string[];
}> = {
  D: {
    becomesMore: ['Agressivo', 'Impaciente', 'Controlador', 'Crítico'],
    becomesLess: ['Ouvinte', 'Paciente', 'Empático'],
    typicalShift: null, // D intensifica
    copingMechanism: 'Tenta controlar mais e eliminar obstáculos',
    deEscalationTips: [
      'Deixe-o sentir que está no controle',
      'Dê opções ao invés de ordens',
      'Mostre progresso rápido',
      'Seja direto sobre o problema e solução'
    ]
  },
  I: {
    becomesMore: ['Desorganizado', 'Emocional', 'Falador', 'Disperso'],
    becomesLess: ['Focado', 'Produtivo', 'Objetivo'],
    typicalShift: null,
    copingMechanism: 'Busca apoio social e validação',
    deEscalationTips: [
      'Ofereça suporte emocional',
      'Ouça antes de propor soluções',
      'Ajude a organizar pensamentos',
      'Celebre pequenas vitórias'
    ]
  },
  S: {
    becomesMore: ['Passivo', 'Indeciso', 'Concordante', 'Travado'],
    becomesLess: ['Expressivo', 'Assertivo', 'Iniciativo'],
    typicalShift: null,
    copingMechanism: 'Evita o conflito e busca estabilidade',
    deEscalationTips: [
      'Não pressione por decisões',
      'Dê tempo e espaço',
      'Mostre que você está do lado dele',
      'Ofereça segurança e suporte'
    ]
  },
  C: {
    becomesMore: ['Crítico', 'Defensivo', 'Detalhista', 'Analítico ao extremo'],
    becomesLess: ['Flexível', 'Rápido', 'Tolerante a erros'],
    typicalShift: null,
    copingMechanism: 'Mergulha em análise e busca mais dados',
    deEscalationTips: [
      'Traga fatos e dados',
      'Valide sua análise',
      'Dê tempo para processar',
      'Não force decisões rápidas'
    ]
  }
};

// ==============================================
// DETECTION PATTERNS FOR AI ANALYSIS
// ==============================================

export interface DetectionPattern {
  profile: Exclude<DISCProfile, null>;
  weight: number;
  patterns: RegExp[];
  phrases: string[];
  behaviorIndicators: string[];
}

export const DISC_DETECTION_PATTERNS: DetectionPattern[] = [
  {
    profile: 'D',
    weight: 1,
    patterns: [
      /\b(resultado|meta|objetivo|prazo|rápido|imediato|agora|direto)\b/gi,
      /\b(resolver|decidir|ganhar|vencer|liderar)\b/gi,
      /\b(performance|produtividade|eficiência|eficaz)\b/gi,
      /quanto (custa|tempo|demora)/gi,
      /vai direto/gi
    ],
    phrases: [
      'vai direto ao ponto',
      'qual o resultado',
      'quanto custa',
      'quando fica pronto',
      'não tenho tempo',
      'me dá o resumo',
      'bottom line'
    ],
    behaviorIndicators: [
      'Respostas curtas e diretas',
      'Interrompe frequentemente',
      'Toma decisões rápidas',
      'Foca em números e resultados',
      'Impaciente com detalhes'
    ]
  },
  {
    profile: 'I',
    weight: 1,
    patterns: [
      /\b(incrível|fantástico|adorei|maravilhoso|demais|show|top)\b/gi,
      /\b(equipe|pessoal|galera|juntos|celebrar)\b/gi,
      /\b(novo|inovador|criativo|diferente|único)\b/gi,
      /imagina só/gi,
      /que (legal|demais|show)/gi
    ],
    phrases: [
      'que demais',
      'adorei a ideia',
      'vamos fazer acontecer',
      'a galera vai adorar',
      'imagina só',
      'isso é incrível'
    ],
    behaviorIndicators: [
      'Fala muito e com entusiasmo',
      'Conta histórias',
      'Muda de assunto facilmente',
      'Busca aprovação social',
      'Expressivo e gestual'
    ]
  },
  {
    profile: 'S',
    weight: 1,
    patterns: [
      /\b(calma|paciência|segurança|estabilidade|confiança)\b/gi,
      /\b(equipe|família|apoio|suporte|harmonia)\b/gi,
      /\b(sempre|tradição|continuidade|rotina)\b/gi,
      /deixa eu pensar/gi,
      /preciso conversar com/gi
    ],
    phrases: [
      'deixa eu pensar',
      'preciso conversar com',
      'como isso afeta',
      'sempre fizemos assim',
      'e se der errado',
      'não tenho certeza'
    ],
    behaviorIndicators: [
      'Fala devagar e com calma',
      'Pede tempo para pensar',
      'Consulta outras pessoas',
      'Evita conflitos',
      'Valoriza relacionamentos de longo prazo'
    ]
  },
  {
    profile: 'C',
    weight: 1,
    patterns: [
      /\b(análise|dados|números|estatística|metodologia)\b/gi,
      /\b(processo|qualidade|padrão|documentação|comprovação)\b/gi,
      /\b(preciso|exato|correto|detalhado|específico)\b/gi,
      /como (você chegou|funciona exatamente)/gi,
      /tem (dados|documentação|comprovação)/gi
    ],
    phrases: [
      'preciso analisar',
      'tem documentação',
      'qual a metodologia',
      'como você chegou nesses números',
      'posso ver os detalhes',
      'quais são os dados'
    ],
    behaviorIndicators: [
      'Faz muitas perguntas detalhadas',
      'Pede documentação',
      'Analisa antes de decidir',
      'Crítico e questionador',
      'Valoriza precisão'
    ]
  }
];

// ==============================================
// EXPORT HELPER FUNCTIONS
// ==============================================

export function getProfileInfo(profile: DISCProfile): DISCProfileInfo | null {
  if (!profile) return null;
  return DISC_PROFILES[profile];
}

export function getBlendProfile(primary: DISCProfile, secondary: DISCProfile | null): BlendProfileInfo | null {
  if (!primary || !secondary || primary === secondary) return null;
  const code = `${primary}${secondary}`;
  return DISC_BLEND_PROFILES[code] || null;
}

export function getCompatibility(profile1: DISCProfile, profile2: DISCProfile): CompatibilityInfo | null {
  if (!profile1 || !profile2) return null;
  return DISC_COMPATIBILITY_MATRIX[profile1]?.[profile2] || null;
}

export function calculateBlendCode(dScore: number, iScore: number, sScore: number, cScore: number): {
  primary: Exclude<DISCProfile, null>;
  secondary: Exclude<DISCProfile, null> | null;
  blend: string | null;
} {
  const scores: { type: Exclude<DISCProfile, null>; score: number }[] = [
    { type: 'D', score: dScore },
    { type: 'I', score: iScore },
    { type: 'S', score: sScore },
    { type: 'C', score: cScore }
  ];
  
  const sorted = scores.sort((a, b) => b.score - a.score);
  const primary = sorted[0].type;
  const secondary = sorted[1].score >= 40 ? sorted[1].type : null;
  const blend = secondary ? `${primary}${secondary}` : null;
  
  return { primary, secondary, blend };
}
