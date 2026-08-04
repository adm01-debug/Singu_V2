// Cognitive Biases Data for Sales Intelligence

import { 
  CognitiveBiasType, 
  BiasCategory, 
  CognitiveBiasInfo,
  BiasCategoryInfo 
} from '@/types/cognitive-biases';

// ============================================
// CATEGORY INFORMATION
// ============================================
export const BIAS_CATEGORY_INFO: Record<BiasCategory, BiasCategoryInfo> = {
  decision_making: {
    name: 'Decision Making',
    namePt: 'Tomada de Decisão',
    icon: '🎯',
    description: 'Vieses que afetam como decisões são tomadas',
    color: 'text-info'
  },
  social: {
    name: 'Social',
    namePt: 'Social',
    icon: '👥',
    description: 'Vieses relacionados a influência social',
    color: 'text-secondary'
  },
  memory: {
    name: 'Memory',
    namePt: 'Memória',
    icon: '🧠',
    description: 'Vieses que afetam lembrança e percepção',
    color: 'text-accent'
  },
  probability: {
    name: 'Probability',
    namePt: 'Probabilidade',
    icon: '🎲',
    description: 'Vieses na avaliação de riscos e chances',
    color: 'text-warning'
  },
  self_perception: {
    name: 'Self-Perception',
    namePt: 'Autopercepção',
    icon: '🪞',
    description: 'Vieses na visão de si mesmo',
    color: 'text-success'
  }
};

// ============================================
// COMPREHENSIVE BIAS INFORMATION
// ============================================
export const COGNITIVE_BIAS_INFO: Record<CognitiveBiasType, CognitiveBiasInfo> = {
  // === DECISION MAKING BIASES ===
  anchoring: {
    name: 'Anchoring',
    namePt: 'Ancoragem',
    category: 'decision_making',
    icon: '⚓',
    color: 'text-info',
    bgColor: 'bg-info/10 border-info/20',
    description: 'Relying too heavily on the first piece of information encountered',
    descriptionPt: 'Tendência a dar peso excessivo à primeira informação recebida',
    example: 'Se você menciona um preço alto primeiro, valores menores parecerão mais razoáveis',
    salesApplication: {
      howToLeverage: 'Apresente primeiro o pacote premium ou valor total. Ancoras altas fazem ofertas subsequentes parecerem mais atrativas.',
      howToCounter: 'Se cliente já tem âncora baixa (concorrente), reframe o valor antes de dar preço.',
      ethicalNote: 'Use âncoras baseadas em valor real, não valores inflados artificialmente.'
    },
    indicators: [
      'o primeiro', 'inicialmente pensei', 'minha primeira impressão',
      'quando vi o preço', 'comparando com', 'em relação a',
      'era mais caro', 'pensei que custava', 'esperava pagar',
      'o original era', 'de acordo com', 'baseado no que vi antes'
    ]
  },
  loss_aversion: {
    name: 'Loss Aversion',
    namePt: 'Aversão à Perda',
    category: 'decision_making',
    icon: '😰',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10 border-destructive/20',
    description: 'Preferring to avoid losses over acquiring equivalent gains',
    descriptionPt: 'Dor de perder é 2x maior que prazer de ganhar o equivalente',
    example: 'Perder R$100 dói mais do que ganhar R$100 agrada',
    salesApplication: {
      howToLeverage: 'Enfatize o que o cliente PERDE ao não agir: "Cada dia sem isso, você perde X"',
      howToCounter: 'Se cliente está preso ao medo de perder dinheiro, mostre perdas maiores de não agir.',
      ethicalNote: 'Destaque perdas reais, não crie medo artificial.'
    },
    indicators: [
      'medo de perder', 'não quero arriscar', 'e se der errado',
      'posso perder', 'prejuízo', 'desperdiçar', 'jogar fora',
      'não posso me dar ao luxo', 'risco demais', 'muito arriscado',
      'perda', 'perdendo', 'vou perder', 'já perdi muito'
    ]
  },
  sunk_cost: {
    name: 'Sunk Cost Fallacy',
    namePt: 'Falácia do Custo Afundado',
    category: 'decision_making',
    icon: '💸',
    color: 'text-warning',
    bgColor: 'bg-warning/10 border-warning/20',
    description: 'Continuing a behavior due to previously invested resources',
    descriptionPt: 'Continuar algo porque já investiu muito, mesmo não fazendo sentido',
    example: 'Ficar num sistema ruim porque já gastou muito com ele',
    salesApplication: {
      howToLeverage: 'Para mudar: "Você já investiu X, não jogue isso fora - migre agora antes de investir mais"',
      howToCounter: 'Ajude cliente a separar investimento passado de decisão futura.',
      ethicalNote: 'Ajude cliente a tomar melhor decisão, não a se prender ainda mais.'
    },
    indicators: [
      'já investi tanto', 'gastei muito com', 'não posso desistir agora',
      'depois de tudo que', 'já paguei', 'já está pago',
      'seria desperdício', 'não vou jogar fora', 'até aqui já',
      'já estou tão envolvido', 'já coloquei muito'
    ]
  },
  status_quo: {
    name: 'Status Quo Bias',
    namePt: 'Viés do Status Quo',
    category: 'decision_making',
    icon: '🔒',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted border-border',
    description: 'Preference for the current state of affairs',
    descriptionPt: 'Preferência por manter as coisas como estão',
    example: 'Resistir a trocar de fornecedor mesmo com opção melhor',
    salesApplication: {
      howToLeverage: 'Mostre custo oculto de ficar parado: "Quanto custa continuar como está?"',
      howToCounter: 'Reduza fricção da mudança ao máximo. Ofereça transição suave.',
      ethicalNote: 'Às vezes ficar parado é a melhor opção - seja honesto.'
    },
    indicators: [
      'sempre fizemos assim', 'está funcionando', 'por que mudar',
      'não precisa mexer', 'deixa como está', 'estou acostumado',
      'já conheço', 'prefiro o que sei', 'não gosto de mudanças',
      'melhor não arriscar', 'time que está ganhando'
    ]
  },
  choice_overload: {
    name: 'Choice Overload',
    namePt: 'Sobrecarga de Escolhas',
    category: 'decision_making',
    icon: '😵',
    color: 'text-secondary',
    bgColor: 'bg-secondary/10 border-secondary/20',
    description: 'Difficulty making a decision when faced with many options',
    descriptionPt: 'Dificuldade de decidir quando há opções demais',
    example: 'Não conseguir escolher entre 15 planos diferentes',
    salesApplication: {
      howToLeverage: 'Simplifique para 2-3 opções. Faça recomendação clara.',
      howToCounter: 'Se cliente está paralisado, escolha por ele: "Baseado no que disse, recomendo X"',
      ethicalNote: 'Recomende genuinamente a melhor opção, não a mais cara.'
    },
    indicators: [
      'muitas opções', 'não sei qual escolher', 'são tantas possibilidades',
      'preciso pensar mais', 'estou confuso', 'qual a diferença entre',
      'me perdi', 'vou analisar tudo', 'difícil decidir',
      'cada um tem vantagens', 'não consigo comparar'
    ]
  },
  framing_effect: {
    name: 'Framing Effect',
    namePt: 'Efeito de Enquadramento',
    category: 'decision_making',
    icon: '🖼️',
    color: 'text-primary',
    bgColor: 'bg-primary/10 border-primary/20',
    description: 'Drawing different conclusions from the same information depending on how it is presented',
    descriptionPt: 'Mesma informação gera conclusões diferentes baseado em como é apresentada',
    example: '"90% taxa de sucesso" soa melhor que "10% falham"',
    salesApplication: {
      howToLeverage: 'Frame benefícios positivamente. "Você ganha X" vs "Você deixa de perder X"',
      howToCounter: 'Reframe objeções: "Não é gasto, é investimento"',
      ethicalNote: 'Não distorça fatos, apenas apresente da forma mais clara.'
    },
    indicators: [
      'depende de como você olha', 'por um lado', 'por outro lado',
      'se pensar bem', 'de certa forma', 'pode-se dizer que',
      'na verdade é', 'mas se você considerar', 'pensando por esse ângulo'
    ]
  },

  // === SOCIAL BIASES ===
  halo_effect: {
    name: 'Halo Effect',
    namePt: 'Efeito Halo',
    category: 'social',
    icon: '😇',
    color: 'text-warning',
    bgColor: 'bg-warning/10 border-warning/20',
    description: 'Overall impression of a person influences how we feel about their character',
    descriptionPt: 'Uma qualidade positiva influencia percepção geral da pessoa/empresa',
    example: 'Se a pessoa é bonita, assumimos que também é competente',
    salesApplication: {
      howToLeverage: 'Destaque seu ponto mais forte primeiro. Crie primeira impressão excelente.',
      howToCounter: 'Se concorrente tem "halo", destaque falhas específicas deles.',
      ethicalNote: 'Seja autêntico - halos artificiais são descobertos.'
    },
    indicators: [
      'se eles são bons nisso', 'empresa grande', 'marca famosa',
      'conheço a reputação', 'parece profissional', 'primeira impressão',
      'gostei do atendimento', 'site bonito', 'escritório impressionante',
      'pessoa simpática', 'ele parece confiável'
    ]
  },
  authority_bias: {
    name: 'Authority Bias',
    namePt: 'Viés de Autoridade',
    category: 'social',
    icon: '👔',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted border-border',
    description: 'Tendency to attribute greater accuracy to the opinion of an authority figure',
    descriptionPt: 'Tendência a aceitar opinião de figuras de autoridade sem questionar',
    example: 'Se um especialista disse, deve ser verdade',
    salesApplication: {
      howToLeverage: 'Use depoimentos de especialistas, certificações, prêmios, endorsements.',
      howToCounter: 'Se concorrente usa autoridade, questione relevância: "Especialista em que?"',
      ethicalNote: 'Use autoridades genuínas e relevantes ao contexto.'
    },
    indicators: [
      'o especialista disse', 'segundo o estudo', 'a pesquisa mostra',
      'os dados indicam', 'o doutor recomenda', 'certificado por',
      'premiado', 'reconhecido como', 'líder do setor',
      'autoridade no assunto', 'referência em'
    ]
  },
  bandwagon_effect: {
    name: 'Bandwagon Effect',
    namePt: 'Efeito Manada',
    category: 'social',
    icon: '🐑',
    color: 'text-info',
    bgColor: 'bg-info/10 border-info/20',
    description: 'Tendency to do something because many other people do the same',
    descriptionPt: 'Fazer algo porque muitos outros fazem',
    example: 'Comprar produto porque é bestseller',
    salesApplication: {
      howToLeverage: 'Use prova social: "X mil clientes", "Mais vendido", "Tendência do mercado"',
      howToCounter: 'Se não tem números grandes, foque em qualidade: "Seleto grupo de clientes"',
      ethicalNote: 'Números devem ser reais e verificáveis.'
    },
    indicators: [
      'todo mundo usa', 'é tendência', 'o mercado está',
      'as empresas estão', 'meus concorrentes', 'vi que muitos',
      'está na moda', 'é o que está funcionando', 'best seller',
      'mais vendido', 'popular', 'viral'
    ]
  },
  in_group_bias: {
    name: 'In-Group Bias',
    namePt: 'Viés de Grupo',
    category: 'social',
    icon: '🤝',
    color: 'text-success',
    bgColor: 'bg-success/10 border-success/20',
    description: 'Favoring members of one\'s own group over outsiders',
    descriptionPt: 'Favorecer pessoas do seu próprio grupo',
    example: 'Preferir fornecedor que é do mesmo setor/região',
    salesApplication: {
      howToLeverage: 'Encontre pontos em comum: mesma cidade, setor, desafios, valores.',
      howToCounter: 'Crie senso de pertencimento: "Nossos clientes são empresas como a sua"',
      ethicalNote: 'Conexões devem ser genuínas, não fabricadas.'
    },
    indicators: [
      'nós do setor', 'empresas como a minha', 'entende nossa realidade',
      'somos do mesmo', 'conhece nosso mercado', 'fala nossa língua',
      'parceiro', 'faz parte de', 'membro de', 'da nossa comunidade',
      'nosso grupo', 'entre nós'
    ]
  },
  liking_bias: {
    name: 'Liking Bias',
    namePt: 'Viés de Afinidade',
    category: 'social',
    icon: '❤️',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10 border-destructive/20',
    description: 'Tendency to agree with people we like',
    descriptionPt: 'Tendência a concordar com pessoas que gostamos',
    example: 'Comprar de vendedor simpático mesmo com produto pior',
    salesApplication: {
      howToLeverage: 'Construa rapport genuíno. Seja agradável e encontre interesses comuns.',
      howToCounter: 'Se cliente gosta do concorrente, não ataque - construa seu próprio rapport.',
      ethicalNote: 'Seja genuinamente simpático, não manipulador.'
    },
    indicators: [
      'gostei de você', 'me identifico', 'simpatizei',
      'somos parecidos', 'você me entende', 'boa conexão',
      'fácil de conversar', 'gosto de fazer negócio com',
      'pessoa agradável', 'me sinto confortável'
    ]
  },

  // === MEMORY BIASES ===
  recency_bias: {
    name: 'Recency Bias',
    namePt: 'Viés de Recência',
    category: 'memory',
    icon: '🕐',
    color: 'text-accent',
    bgColor: 'bg-accent/10 border-accent/20',
    description: 'Giving greater importance to recent events over historic ones',
    descriptionPt: 'Dar mais peso a eventos recentes que a histórico geral',
    example: 'Julgar empresa por último atendimento, não por anos de relacionamento',
    salesApplication: {
      howToLeverage: 'Termine reuniões com nota alta. Último contato deve ser positivo.',
      howToCounter: 'Se última experiência do cliente foi ruim, reconheça e mostre mudanças.',
      ethicalNote: 'Use para reforçar valor real, não esconder problemas.'
    },
    indicators: [
      'ultimamente', 'recentemente', 'outro dia',
      'semana passada', 'acabou de acontecer', 'na última vez',
      'mais recente', 'por último', 'nos últimos tempos',
      'atualmente', 'hoje em dia', 'agora'
    ]
  },
  primacy_effect: {
    name: 'Primacy Effect',
    namePt: 'Efeito de Primazia',
    category: 'memory',
    icon: '1️⃣',
    color: 'text-success',
    bgColor: 'bg-success/10 border-success/20',
    description: 'Remembering information presented first better than information presented later',
    descriptionPt: 'Lembrar melhor das primeiras informações apresentadas',
    example: 'Primeiro item de uma lista é mais lembrado',
    salesApplication: {
      howToLeverage: 'Comece com seu diferencial mais forte. Primeira impressão conta mais.',
      howToCounter: 'Se não foi o primeiro a apresentar, faça algo memorável para se destacar.',
      ethicalNote: 'Primeiras informações devem ser as mais importantes, não enganosas.'
    },
    indicators: [
      'a primeira coisa', 'desde o início', 'quando conheci',
      'minha primeira impressão', 'no começo', 'de início',
      'primeiramente', 'antes de tudo', 'lembro que primeiro',
      'o que me marcou foi'
    ]
  },
  availability_heuristic: {
    name: 'Availability Heuristic',
    namePt: 'Heurística de Disponibilidade',
    category: 'memory',
    icon: '💭',
    color: 'text-secondary',
    bgColor: 'bg-secondary/10 border-secondary/20',
    description: 'Overestimating likelihood of events that are easily recalled',
    descriptionPt: 'Superestimar probabilidade de eventos que lembramos facilmente',
    example: 'Temer avião após ver notícia de acidente, ignorando estatísticas',
    salesApplication: {
      howToLeverage: 'Conte histórias vívidas e memoráveis de sucesso.',
      howToCounter: 'Se cliente lembra de caso negativo, conte múltiplos casos positivos.',
      ethicalNote: 'Use exemplos representativos, não apenas os mais dramáticos.'
    },
    indicators: [
      'lembro de um caso', 'vi acontecer', 'conheço alguém que',
      'já ouvi falar', 'tem muitos casos', 'sempre vejo isso',
      'é comum acontecer', 'acontece muito', 'frequentemente',
      'eu mesmo passei por', 'minha experiência foi'
    ]
  },
  peak_end_rule: {
    name: 'Peak-End Rule',
    namePt: 'Regra do Pico-Fim',
    category: 'memory',
    icon: '📈',
    color: 'text-fuchsia-600',
    bgColor: 'bg-fuchsia-100 border-fuchsia-200',
    description: 'Judging an experience based on how we felt at its peak and end',
    descriptionPt: 'Julgar experiência pelo momento mais intenso e pelo final',
    example: 'Lembrar de viagem pelo melhor momento e último dia',
    salesApplication: {
      howToLeverage: 'Crie um momento "wow" e termine forte. Follow-up deve ser positivo.',
      howToCounter: 'Se apresentação teve problema, recupere no final com algo excepcional.',
      ethicalNote: 'Entrega consistente é melhor que apenas picos artificiais.'
    },
    indicators: [
      'o melhor momento foi', 'mas no final', 'o que mais marcou',
      'o ponto alto', 'culminou em', 'o ápice foi',
      'terminou bem', 'terminou mal', 'no fechamento'
    ]
  },

  // === PROBABILITY BIASES ===
  optimism_bias: {
    name: 'Optimism Bias',
    namePt: 'Viés de Otimismo',
    category: 'probability',
    icon: '🌈',
    color: 'text-sky-600',
    bgColor: 'bg-sky-100 border-sky-200',
    description: 'Believing that we are less likely to experience negative events',
    descriptionPt: 'Acreditar que coisas ruins são menos prováveis de acontecer conosco',
    example: 'Achar que não precisa de seguro porque "não vai acontecer comigo"',
    salesApplication: {
      howToLeverage: 'Explore visão positiva do futuro com seu produto/serviço.',
      howToCounter: 'Para produtos de proteção, mostre que "também pode acontecer com você".',
      ethicalNote: 'Não destrua otimismo saudável, apenas adicione realismo quando necessário.'
    },
    indicators: [
      'vai dar certo', 'tenho certeza que', 'não vai acontecer comigo',
      'sou sortudo', 'sempre dá certo', 'confio que',
      'não me preocupo com', 'tudo vai fluir', 'otimista',
      'vai ser tranquilo', 'não preciso me preocupar'
    ]
  },
  pessimism_bias: {
    name: 'Pessimism Bias',
    namePt: 'Viés de Pessimismo',
    category: 'probability',
    icon: '🌧️',
    color: 'text-stone-600',
    bgColor: 'bg-stone-100 border-stone-200',
    description: 'Overestimating the likelihood of negative events',
    descriptionPt: 'Superestimar probabilidade de coisas ruins acontecerem',
    example: 'Assumir que todo projeto vai dar errado',
    salesApplication: {
      howToLeverage: 'Mostre garantias e reduza riscos percebidos.',
      howToCounter: 'Apresente dados reais de sucesso. Use depoimentos específicos.',
      ethicalNote: 'Não minimize preocupações legítimas.'
    },
    indicators: [
      'e se der errado', 'não vai funcionar', 'duvido que',
      'pessimista', 'espero o pior', 'sempre dá problema',
      'minha experiência diz', 'não acredito que', 'preocupado',
      'com medo de', 'tenho receio', 'não vai rolar'
    ]
  },
  gambler_fallacy: {
    name: 'Gambler\'s Fallacy',
    namePt: 'Falácia do Jogador',
    category: 'probability',
    icon: '🎰',
    color: 'text-warning',
    bgColor: 'bg-warning/10 border-warning/20',
    description: 'Believing that past events affect future independent events',
    descriptionPt: 'Acreditar que eventos passados afetam eventos futuros independentes',
    example: 'Após 5 derrotas, "agora vai" - mas probabilidade é a mesma',
    salesApplication: {
      howToLeverage: 'Use padrões genuínos (se existem) para mostrar tendências.',
      howToCounter: 'Se cliente espera "sorte virar", mostre que precisa de ação, não sorte.',
      ethicalNote: 'Nunca explore falácias para vender - eduque o cliente.'
    },
    indicators: [
      'agora vai', 'é a vez de', 'minha hora chegou',
      'depois de tantos', 'na próxima', 'a sorte vai virar',
      'estatisticamente tem que', 'já errei tanto que',
      'não pode dar errado de novo', 'lei das médias'
    ]
  },
  base_rate_neglect: {
    name: 'Base Rate Neglect',
    namePt: 'Negligência da Taxa Base',
    category: 'probability',
    icon: '📊',
    color: 'text-zinc-600',
    bgColor: 'bg-zinc-100 border-zinc-200',
    description: 'Ignoring general statistical information in favor of specific information',
    descriptionPt: 'Ignorar estatísticas gerais em favor de casos específicos',
    example: 'Focar no único caso de sucesso ignorando 99% de falhas',
    salesApplication: {
      howToLeverage: 'Use estatísticas favoráveis quando genuínas.',
      howToCounter: 'Se cliente usa caso isolado, mostre estatísticas gerais.',
      ethicalNote: 'Seja transparente sobre taxas de sucesso reais.'
    },
    indicators: [
      'conheço um que', 'mas nesse caso', 'tem exceções',
      'nem sempre', 'depende', 'já vi funcionar',
      'um amigo conseguiu', 'há casos onde', 'quando deu certo'
    ]
  },

  // === SELF-PERCEPTION BIASES ===
  confirmation_bias: {
    name: 'Confirmation Bias',
    namePt: 'Viés de Confirmação',
    category: 'self_perception',
    icon: '✅',
    color: 'text-success',
    bgColor: 'bg-success/10 border-success/20',
    description: 'Searching for information that confirms existing beliefs',
    descriptionPt: 'Buscar informações que confirmam crenças existentes',
    example: 'Ignorar reviews negativos de produto que já quer comprar',
    salesApplication: {
      howToLeverage: 'Descubra crenças do cliente e alinhe argumentos a elas.',
      howToCounter: 'Se cliente tem crença contrária, não confronte - reframe gradualmente.',
      ethicalNote: 'Nunca reforce crenças prejudiciais ao cliente.'
    },
    indicators: [
      'eu sabia', 'como eu imaginava', 'isso confirma',
      'é o que eu pensava', 'prova que', 'veja, eu estava certo',
      'sempre achei que', 'tenho certeza de que', 'confirma minha suspeita',
      'não me surpreende', 'era óbvio'
    ]
  },
  dunning_kruger: {
    name: 'Dunning-Kruger Effect',
    namePt: 'Efeito Dunning-Kruger',
    category: 'self_perception',
    icon: '📉',
    color: 'text-warning',
    bgColor: 'bg-warning/10 border-warning/20',
    description: 'People with limited knowledge overestimate their own competence',
    descriptionPt: 'Pessoas com pouco conhecimento superestimam sua competência',
    example: 'Iniciante acha que sabe tudo; expert reconhece complexidade',
    salesApplication: {
      howToLeverage: 'Eduque com respeito. Mostre valor sem humilhar.',
      howToCounter: 'Use perguntas que revelam complexidade naturalmente.',
      ethicalNote: 'Nunca faça cliente se sentir burro. Eleve-o.'
    },
    indicators: [
      'é simples', 'sei fazer isso', 'não preciso de ajuda',
      'já domino', 'fácil', 'não é complicado',
      'posso fazer sozinho', 'não é rocket science',
      'qualquer um consegue', 'óbvio'
    ]
  },
  overconfidence: {
    name: 'Overconfidence Bias',
    namePt: 'Excesso de Confiança',
    category: 'self_perception',
    icon: '💪',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10 border-destructive/20',
    description: 'Having excessive confidence in one\'s own abilities or judgments',
    descriptionPt: 'Confiança excessiva nas próprias habilidades ou julgamentos',
    example: 'Gestor acha que não precisa de treinamento de vendas',
    salesApplication: {
      howToLeverage: 'Valide confiança do cliente e adicione expertise complementar.',
      howToCounter: 'Use dados que mostrem gaps sem confrontar diretamente.',
      ethicalNote: 'Ajude cliente a ver realidade sem destruir autoestima.'
    },
    indicators: [
      'tenho certeza absoluta', 'sem dúvida', 'impossível errar',
      'sempre acerto', 'confio 100%', 'garanto que',
      'pode apostar', 'nunca falho', 'expertise completa',
      'domino totalmente', 'sou o melhor em'
    ]
  },
  self_serving: {
    name: 'Self-Serving Bias',
    namePt: 'Viés Autosservidor',
    category: 'self_perception',
    icon: '🎖️',
    color: 'text-warning',
    bgColor: 'bg-warning/10 border-warning/20',
    description: 'Attributing positive outcomes to oneself and negative outcomes to external factors',
    descriptionPt: 'Atribuir sucessos a si mesmo e fracassos a fatores externos',
    example: 'Venda = meu talento. Perda = culpa do cliente/mercado',
    salesApplication: {
      howToLeverage: 'Deixe cliente "ser dono" do sucesso. Você só facilitou.',
      howToCounter: 'Se cliente culpa externos por problema que você resolve, mostre controle.',
      ethicalNote: 'Promova responsabilidade saudável, não culpa.'
    },
    indicators: [
      'meu mérito', 'consegui porque', 'graças a mim',
      'culpa do mercado', 'o cliente não quis', 'a economia',
      'não tinha como', 'foi azar', 'não depende de mim',
      'fiz minha parte', 'o problema foi'
    ]
  },
  hindsight_bias: {
    name: 'Hindsight Bias',
    namePt: 'Viés Retrospectivo',
    category: 'self_perception',
    icon: '🔮',
    color: 'text-secondary',
    bgColor: 'bg-secondary/10 border-secondary/20',
    description: 'Believing that past events were predictable after they happened',
    descriptionPt: 'Acreditar que eventos passados eram previsíveis depois que aconteceram',
    example: 'Após crise: "Eu sabia que ia acontecer" (mas não agiu)',
    salesApplication: {
      howToLeverage: 'Use para validar: "Você sabia que precisava disso, agora é a hora"',
      howToCounter: 'Se cliente diz "eu sabia", pergunte "o que vai fazer diferente agora?"',
      ethicalNote: 'Ajude cliente a agir no presente, não ruminar no passado.'
    },
    indicators: [
      'eu sabia que ia acontecer', 'era óbvio', 'previsível',
      'já imaginava', 'todo mundo viu', 'estava na cara',
      'não me surpreendeu', 'era questão de tempo',
      'qualquer um teria previsto', 'já esperava'
    ]
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================
export function getBiasesByCategory(category: BiasCategory): CognitiveBiasType[] {
  return (Object.entries(COGNITIVE_BIAS_INFO) as [CognitiveBiasType, CognitiveBiasInfo][])
    .filter(([_, info]) => info.category === category)
    .map(([type, _]) => type);
}

export function getAllBiasIndicators(): Record<CognitiveBiasType, string[]> {
  const result = {} as Record<CognitiveBiasType, string[]>;
  (Object.entries(COGNITIVE_BIAS_INFO) as [CognitiveBiasType, CognitiveBiasInfo][]).forEach(
    ([type, info]) => {
      result[type] = info.indicators;
    }
  );
  return result;
}
