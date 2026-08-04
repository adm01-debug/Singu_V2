// ==============================================
// NEUROMARKETING DATA - Complete Neuroscience Reference
// Based on Latest Research 2024-2025
// ==============================================

import { 
  BrainSystem, 
  BrainSystemInfo,
  PrimalStimulus,
  PrimalStimulusInfo,
  Neurochemical,
  NeurochemicalInfo
} from '@/types/neuromarketing';

// ============================================
// THREE-BRAIN MODEL DATA
// ============================================
export const BRAIN_SYSTEM_INFO: Record<BrainSystem, BrainSystemInfo> = {
  reptilian: {
    name: 'Reptilian Brain',
    namePt: 'Cérebro Reptiliano',
    icon: '🦎',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10 border-destructive/30',
    description: 'The oldest brain, focused on survival. Makes the FINAL decision.',
    descriptionPt: 'O cérebro mais antigo, focado em sobrevivência. Toma a DECISÃO FINAL.',
    evolutionAge: '450 milhões de anos',
    mainFunction: 'Sobrevivência, Luta/Fuga, Reprodução',
    decisionRole: 'DECISOR FINAL - Aprova ou bloqueia todas as decisões',
    communicationStyle: [
      'Direto e simples',
      'Focado em "EU"',
      'Visual e concreto',
      'Contraste claro',
      'Início e fim marcantes'
    ],
    keyDrivers: [
      'Medo de perder',
      'Ganho imediato',
      'Segurança',
      'Simplicidade',
      'Urgência'
    ],
    warnings: [
      'Ignora lógica complexa',
      'Não processa números abstratos',
      'Reage a ameaças percebidas',
      'Prefere status quo se não houver urgência'
    ]
  },
  limbic: {
    name: 'Limbic System',
    namePt: 'Sistema Límbico',
    icon: '❤️',
    color: 'text-accent',
    bgColor: 'bg-accent/10 border-accent/30',
    description: 'The emotional brain. Processes feelings and memories.',
    descriptionPt: 'O cérebro emocional. Processa sentimentos e memórias.',
    evolutionAge: '150 milhões de anos',
    mainFunction: 'Emoções, Memórias, Vínculo Social',
    decisionRole: 'INFLUENCIADOR - Colore decisões com emoção e memória',
    communicationStyle: [
      'Histórias e narrativas',
      'Conexão pessoal',
      'Empatia e compreensão',
      'Pertencimento',
      'Valores compartilhados'
    ],
    keyDrivers: [
      'Confiança',
      'Conexão',
      'Reconhecimento',
      'Pertencimento',
      'Prazer'
    ],
    warnings: [
      'Memórias negativas bloqueiam vendas',
      'Precisa de tempo para criar confiança',
      'Sensível a inconsistências',
      'Detecta falsidade rapidamente'
    ]
  },
  neocortex: {
    name: 'Neocortex',
    namePt: 'Neocórtex',
    icon: '🧠',
    color: 'text-info',
    bgColor: 'bg-info/10 border-info/30',
    description: 'The thinking brain. Processes logic, language, and analysis.',
    descriptionPt: 'O cérebro pensante. Processa lógica, linguagem e análise.',
    evolutionAge: '2-3 milhões de anos',
    mainFunction: 'Lógica, Linguagem, Planejamento, Análise',
    decisionRole: 'JUSTIFICADOR - Racionaliza decisões já tomadas',
    communicationStyle: [
      'Dados e estatísticas',
      'Comparações detalhadas',
      'Argumentos lógicos',
      'Provas e evidências',
      'ROI calculado'
    ],
    keyDrivers: [
      'Lógica',
      'Evidências',
      'Comparação',
      'Análise',
      'Planejamento'
    ],
    warnings: [
      'NÃO toma decisões - apenas justifica',
      'Paralisia por análise',
      'Pode criar objeções racionais para medo emocional',
      'Usado para racionalizar decisões emocionais'
    ]
  }
};

// ============================================
// SIX PRIMAL STIMULI DATA
// ============================================
export const PRIMAL_STIMULUS_INFO: Record<PrimalStimulus, PrimalStimulusInfo> = {
  self_centered: {
    name: 'Self-Centered',
    namePt: 'Centrado no EU',
    icon: '👤',
    color: 'text-warning',
    description: 'The old brain only cares about itself. Make it about THEM.',
    descriptionPt: 'O cérebro primitivo só se importa consigo. Fale sobre ELE.',
    applicationTips: [
      'Use "você" em vez de "nós" ou "a empresa"',
      'Personalize cada mensagem',
      'Foque nos benefícios DELE, não nas features',
      'Responda: "O que EU ganho com isso?"'
    ],
    messageTemplates: [
      'Você vai [benefício específico]...',
      'Para você que [situação do cliente]...',
      'O seu [resultado desejado] está a um passo...',
      'Imagine você [futuro desejado]...'
    ],
    keywords: [
      'você', 'seu', 'sua', 'para você', 'o seu', 'a sua',
      'seu negócio', 'sua empresa', 'seu time', 'sua vida',
      'você merece', 'você precisa', 'você quer'
    ],
    effectiveness: 10
  },
  contrast: {
    name: 'Contrast',
    namePt: 'Contraste',
    icon: '⚖️',
    color: 'text-secondary',
    description: 'The brain needs contrast to decide. Before/After, With/Without.',
    descriptionPt: 'O cérebro precisa de contraste para decidir. Antes/Depois, Com/Sem.',
    applicationTips: [
      'Mostre ANTES vs DEPOIS',
      'Compare COM vs SEM sua solução',
      'Use números: "De X para Y"',
      'Contraste dor atual vs futuro desejado'
    ],
    messageTemplates: [
      'Antes: [problema]. Depois: [solução]',
      'Sem [produto]: [dor]. Com [produto]: [ganho]',
      'De [situação atual] para [situação desejada]',
      'Outros fazem [X]. Nós fazemos [Y].'
    ],
    keywords: [
      'antes', 'depois', 'com', 'sem', 'de', 'para',
      'diferença', 'comparado', 'versus', 'enquanto',
      'transformação', 'mudança', 'evolução'
    ],
    effectiveness: 9
  },
  tangible: {
    name: 'Tangible',
    namePt: 'Tangível',
    icon: '✋',
    color: 'text-success',
    description: 'The old brain is confused by complexity. Keep it SIMPLE and CONCRETE.',
    descriptionPt: 'O cérebro primitivo se confunde com complexidade. Seja SIMPLES e CONCRETO.',
    applicationTips: [
      'Use números específicos: "37,2%" não "aproximadamente 40%"',
      'Dê exemplos concretos e familiares',
      'Evite jargão técnico',
      'Torne abstrato em palpável'
    ],
    messageTemplates: [
      'Em 14 dias você terá [resultado]',
      'R$ 12.847 economizados por mês',
      'Como [empresa famosa] fez [resultado]',
      '3 passos simples para [benefício]'
    ],
    keywords: [
      'exatamente', 'especificamente', 'precisamente',
      'por exemplo', 'como', 'assim como',
      'simples', 'fácil', 'direto', 'claro',
      'número', 'resultado', 'concreto'
    ],
    effectiveness: 9
  },
  memorable: {
    name: 'Memorable',
    namePt: 'Memorável',
    icon: '🎯',
    color: 'text-destructive',
    description: 'The brain remembers BEGINNING and END. Peak-End Rule.',
    descriptionPt: 'O cérebro lembra do INÍCIO e FIM. Regra do Pico-Fim.',
    applicationTips: [
      'Comece com IMPACTO (hook forte)',
      'Termine com CALL-TO-ACTION claro',
      'Crie um momento "WOW" no meio',
      'Repita a mensagem principal no final'
    ],
    messageTemplates: [
      '[Fato chocante]. Por isso [solução]. [CTA]',
      'O que você faria com [ganho]? [desenvolvimento] Comece agora.',
      '[Dor principal]. [Solução]. [Reforço da dor]. [CTA urgente]',
      '[Pergunta impactante]... [Resposta com produto]'
    ],
    keywords: [
      'primeiro', 'finalmente', 'conclusão', 'resumindo',
      'lembre-se', 'importante', 'crucial', 'essencial',
      'nunca esqueça', 'grave isso', 'memorize'
    ],
    effectiveness: 8
  },
  visual: {
    name: 'Visual',
    namePt: 'Visual',
    icon: '👁️',
    color: 'text-info',
    description: '50% of the brain is dedicated to visual processing. SHOW, don\'t tell.',
    descriptionPt: '50% do cérebro é dedicado ao visual. MOSTRE, não conte.',
    applicationTips: [
      'Use imagens e gráficos ANTES do texto',
      'Mostre a transformação visualmente',
      'Diagrama > Parágrafo',
      'Vídeo > Documento'
    ],
    messageTemplates: [
      '[Imagem do antes] → [Imagem do depois]',
      'Veja o que [cliente] conquistou: [visual]',
      '[Gráfico de crescimento com resultado]',
      '[Screenshot/Demo do produto em ação]'
    ],
    keywords: [
      'veja', 'olhe', 'observe', 'visualize', 'imagine',
      'mostrando', 'ilustrando', 'demonstrando',
      'claro', 'visível', 'aparente', 'evidente'
    ],
    effectiveness: 10
  },
  emotional: {
    name: 'Emotional',
    namePt: 'Emocional',
    icon: '💥',
    color: 'text-warning',
    description: 'Emotions trigger decisions. No emotion = No decision.',
    descriptionPt: 'Emoções disparam decisões. Sem emoção = Sem decisão.',
    applicationTips: [
      'Conecte à DOR real do cliente',
      'Use histórias que geram empatia',
      'Crie urgência emocional (não só lógica)',
      'Mostre o impacto HUMANO, não só financeiro'
    ],
    messageTemplates: [
      'Imagine a frustração de [problema] todo dia...',
      'Quando você finalmente [resultado], vai sentir...',
      'Pense nas noites sem dormir por causa de [dor]...',
      'Sua equipe merece [benefício emocional]'
    ],
    keywords: [
      'sentir', 'emocionar', 'frustração', 'alívio',
      'orgulho', 'medo', 'esperança', 'ansiedade',
      'felicidade', 'paz', 'tranquilidade', 'confiança'
    ],
    effectiveness: 10
  }
};

// ============================================
// NEUROCHEMICAL DATA
// ============================================
export const NEUROCHEMICAL_INFO: Record<Neurochemical, NeurochemicalInfo> = {
  dopamine: {
    name: 'Dopamine',
    namePt: 'Dopamina',
    icon: '🎁',
    color: 'text-warning',
    bgColor: 'bg-warning/10 border-warning/30',
    effect: 'Desire, Anticipation, Reward-seeking',
    effectPt: 'Desejo, Antecipação, Busca de Recompensa',
    triggers: [
      'Novidade e surpresa',
      'Antecipação de recompensa',
      'Gamificação e conquistas',
      'Exclusividade',
      'Progresso visível'
    ],
    salesApplication: 'Use para criar desejo e antecipação. Mostre o que eles VÃO ganhar. "Imagine quando você tiver..."',
    warningSignals: [
      'Excesso causa impulsividade',
      'Crash pós-compra se não entregar',
      'Pode parecer manipulativo se exagerado'
    ],
    balanceWith: ['serotonin', 'oxytocin']
  },
  oxytocin: {
    name: 'Oxytocin',
    namePt: 'Ocitocina',
    icon: '🤝',
    color: 'text-accent',
    bgColor: 'bg-accent/10 border-accent/30',
    effect: 'Trust, Bonding, Connection, Generosity',
    effectPt: 'Confiança, Vínculo, Conexão, Generosidade',
    triggers: [
      'Contato visual e físico',
      'Histórias de conexão humana',
      'Dar antes de pedir',
      'Mostrar vulnerabilidade autêntica',
      'Pertencimento a grupo'
    ],
    salesApplication: 'Construa rapport genuíno. Dê valor ANTES de pedir. Mostre que você se IMPORTA com eles, não só com a venda.',
    warningSignals: [
      'Leva tempo para construir',
      'Destruída rapidamente por quebra de confiança',
      'Não substitui produto/serviço real'
    ],
    balanceWith: ['dopamine', 'serotonin']
  },
  cortisol: {
    name: 'Cortisol',
    namePt: 'Cortisol',
    icon: '⚡',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10 border-destructive/30',
    effect: 'Stress, Fear, Urgency, Fight-or-Flight',
    effectPt: 'Estresse, Medo, Urgência, Luta-ou-Fuga',
    triggers: [
      'Ameaça percebida',
      'Escassez e deadline',
      'Perda potencial',
      'Competição',
      'Incerteza'
    ],
    salesApplication: 'Use com MODERAÇÃO para criar urgência. Foque no que eles PERDEM se não agirem. Mas sempre ofereça solução que reduz o cortisol.',
    warningSignals: [
      'Excesso paralisa em vez de motivar',
      'Cria associação negativa com sua marca',
      'Pode causar arrependimento pós-compra',
      'Eticamente questionável se exagerado'
    ],
    balanceWith: ['oxytocin', 'endorphin']
  },
  serotonin: {
    name: 'Serotonin',
    namePt: 'Serotonina',
    icon: '👑',
    color: 'text-info',
    bgColor: 'bg-info/10 border-info/30',
    effect: 'Confidence, Status, Well-being, Pride',
    effectPt: 'Confiança, Status, Bem-estar, Orgulho',
    triggers: [
      'Reconhecimento e status',
      'Conquistas e certificações',
      'Posição de liderança',
      'Exclusividade premium',
      'Respeito e admiração'
    ],
    salesApplication: 'Mostre como seu produto eleva o STATUS deles. Faça-os se sentirem inteligentes e bem-sucedidos por escolher você.',
    warningSignals: [
      'Pode parecer elitista',
      'Precisa entregar o status prometido',
      'Não funciona se cliente prioriza economia'
    ],
    balanceWith: ['oxytocin', 'dopamine']
  },
  endorphin: {
    name: 'Endorphin',
    namePt: 'Endorfina',
    icon: '😊',
    color: 'text-success',
    bgColor: 'bg-success/10 border-success/30',
    effect: 'Pleasure, Pain Relief, Euphoria, Reward',
    effectPt: 'Prazer, Alívio da Dor, Euforia, Recompensa',
    triggers: [
      'Humor e riso',
      'Alívio de problema',
      'Surpresa positiva',
      'Exercício e movimento',
      'Comida e conforto'
    ],
    salesApplication: 'Crie momentos de alívio e prazer. Mostre como seu produto REMOVE a dor que eles sentem. Use humor quando apropriado.',
    warningSignals: [
      'Não sustenta decisão sozinho',
      'Precisa de substância além do prazer',
      'Efeito temporário'
    ],
    balanceWith: ['serotonin', 'dopamine']
  },
  adrenaline: {
    name: 'Adrenaline',
    namePt: 'Adrenalina',
    icon: '🔥',
    color: 'text-warning',
    bgColor: 'bg-warning/10 border-warning/30',
    effect: 'Excitement, Action, Risk-taking, Energy',
    effectPt: 'Excitação, Ação, Risco, Energia',
    triggers: [
      'Oportunidade única',
      'Competição e desafio',
      'Novidade excitante',
      'Risco calculado',
      'Velocidade e movimento'
    ],
    salesApplication: 'Use para clientes com alto perfil D/I (DISC). Crie sensação de oportunidade imperdível. "Agora ou nunca".',
    warningSignals: [
      'Não funciona para perfis S/C',
      'Pode assustar clientes conservadores',
      'Cria expectativa de ação imediata'
    ],
    balanceWith: ['oxytocin', 'serotonin']
  }
};

// ============================================
// BRAIN-TRIGGER MAPPING
// ============================================
export const TRIGGER_BRAIN_MAPPING: Record<string, {
  brainSystem: BrainSystem;
  primaryStimulus: PrimalStimulus;
  neurochemical: Neurochemical;
}> = {
  // Urgência → Reptiliano
  scarcity: { brainSystem: 'reptilian', primaryStimulus: 'emotional', neurochemical: 'cortisol' },
  urgency: { brainSystem: 'reptilian', primaryStimulus: 'emotional', neurochemical: 'adrenaline' },
  fomo: { brainSystem: 'reptilian', primaryStimulus: 'emotional', neurochemical: 'cortisol' },
  exclusivity: { brainSystem: 'limbic', primaryStimulus: 'self_centered', neurochemical: 'serotonin' },
  
  // Social → Límbico
  social_proof: { brainSystem: 'limbic', primaryStimulus: 'tangible', neurochemical: 'oxytocin' },
  authority: { brainSystem: 'neocortex', primaryStimulus: 'tangible', neurochemical: 'serotonin' },
  consensus: { brainSystem: 'limbic', primaryStimulus: 'emotional', neurochemical: 'oxytocin' },
  testimonial: { brainSystem: 'limbic', primaryStimulus: 'memorable', neurochemical: 'oxytocin' },
  
  // Emocional → Límbico
  storytelling: { brainSystem: 'limbic', primaryStimulus: 'emotional', neurochemical: 'oxytocin' },
  belonging: { brainSystem: 'limbic', primaryStimulus: 'emotional', neurochemical: 'oxytocin' },
  anticipation: { brainSystem: 'limbic', primaryStimulus: 'emotional', neurochemical: 'dopamine' },
  empathy: { brainSystem: 'limbic', primaryStimulus: 'emotional', neurochemical: 'oxytocin' },
  
  // Lógico → Neocórtex
  specificity: { brainSystem: 'neocortex', primaryStimulus: 'tangible', neurochemical: 'serotonin' },
  reason_why: { brainSystem: 'neocortex', primaryStimulus: 'tangible', neurochemical: 'serotonin' },
  comparison: { brainSystem: 'neocortex', primaryStimulus: 'contrast', neurochemical: 'dopamine' },
  guarantee: { brainSystem: 'reptilian', primaryStimulus: 'tangible', neurochemical: 'endorphin' },
  
  // Reciprocidade → Límbico
  gift: { brainSystem: 'limbic', primaryStimulus: 'emotional', neurochemical: 'oxytocin' },
  concession: { brainSystem: 'limbic', primaryStimulus: 'contrast', neurochemical: 'dopamine' },
  personalization: { brainSystem: 'limbic', primaryStimulus: 'self_centered', neurochemical: 'oxytocin' },
  
  // Compromisso → Neocórtex
  commitment: { brainSystem: 'neocortex', primaryStimulus: 'memorable', neurochemical: 'serotonin' },
  consistency: { brainSystem: 'neocortex', primaryStimulus: 'tangible', neurochemical: 'serotonin' },
  small_yes: { brainSystem: 'limbic', primaryStimulus: 'memorable', neurochemical: 'dopamine' },
  public_commitment: { brainSystem: 'limbic', primaryStimulus: 'emotional', neurochemical: 'serotonin' }
};

// ============================================
// BIAS-BRAIN MAPPING
// ============================================
export const BIAS_BRAIN_MAPPING: Record<string, {
  brainSystem: BrainSystem;
  neurochemical: Neurochemical;
}> = {
  // Decision Making → Mix
  anchoring: { brainSystem: 'neocortex', neurochemical: 'serotonin' },
  loss_aversion: { brainSystem: 'reptilian', neurochemical: 'cortisol' },
  sunk_cost: { brainSystem: 'reptilian', neurochemical: 'cortisol' },
  status_quo: { brainSystem: 'reptilian', neurochemical: 'cortisol' },
  choice_overload: { brainSystem: 'neocortex', neurochemical: 'cortisol' },
  framing_effect: { brainSystem: 'neocortex', neurochemical: 'dopamine' },
  
  // Social → Límbico
  halo_effect: { brainSystem: 'limbic', neurochemical: 'oxytocin' },
  authority_bias: { brainSystem: 'limbic', neurochemical: 'serotonin' },
  bandwagon_effect: { brainSystem: 'limbic', neurochemical: 'oxytocin' },
  in_group_bias: { brainSystem: 'limbic', neurochemical: 'oxytocin' },
  liking_bias: { brainSystem: 'limbic', neurochemical: 'oxytocin' },
  
  // Memory → Neocórtex/Límbico
  recency_bias: { brainSystem: 'limbic', neurochemical: 'dopamine' },
  primacy_effect: { brainSystem: 'limbic', neurochemical: 'dopamine' },
  availability_heuristic: { brainSystem: 'limbic', neurochemical: 'cortisol' },
  peak_end_rule: { brainSystem: 'limbic', neurochemical: 'endorphin' },
  
  // Probability → Neocórtex
  optimism_bias: { brainSystem: 'neocortex', neurochemical: 'dopamine' },
  pessimism_bias: { brainSystem: 'reptilian', neurochemical: 'cortisol' },
  confirmation_bias: { brainSystem: 'neocortex', neurochemical: 'serotonin' }
};

// ============================================
// DISC-BRAIN CORRELATION
// ============================================
export const DISC_BRAIN_CORRELATION: Record<string, {
  primaryBrain: BrainSystem;
  secondaryBrain: BrainSystem;
  dominantNeurochemical: Neurochemical;
  responsiveStimuli: PrimalStimulus[];
}> = {
  D: {
    primaryBrain: 'reptilian',
    secondaryBrain: 'neocortex',
    dominantNeurochemical: 'adrenaline',
    responsiveStimuli: ['contrast', 'tangible', 'self_centered']
  },
  I: {
    primaryBrain: 'limbic',
    secondaryBrain: 'reptilian',
    dominantNeurochemical: 'dopamine',
    responsiveStimuli: ['emotional', 'visual', 'self_centered']
  },
  S: {
    primaryBrain: 'limbic',
    secondaryBrain: 'neocortex',
    dominantNeurochemical: 'oxytocin',
    responsiveStimuli: ['emotional', 'memorable', 'tangible']
  },
  C: {
    primaryBrain: 'neocortex',
    secondaryBrain: 'reptilian',
    dominantNeurochemical: 'serotonin',
    responsiveStimuli: ['tangible', 'contrast', 'memorable']
  }
};

// ============================================
// PAIN DETECTION KEYWORDS
// ============================================
export const PAIN_KEYWORDS = {
  high_intensity: [
    'impossível', 'insuportável', 'desespero', 'urgente', 'crítico',
    'não aguento mais', 'estou perdendo', 'vou falir', 'crise',
    'desastre', 'catástrofe', 'fim', 'acabou', 'sem saída'
  ],
  medium_intensity: [
    'problema', 'dificuldade', 'desafio', 'preocupado', 'frustrado',
    'atrasado', 'caro demais', 'não funciona', 'complicado',
    'perdendo tempo', 'perdendo dinheiro', 'ineficiente'
  ],
  low_intensity: [
    'poderia melhorar', 'gostaria de', 'seria bom', 'talvez',
    'não ideal', 'dá trabalho', 'chateia', 'incômodo'
  ]
};

// ============================================
// GAIN DETECTION KEYWORDS
// ============================================
export const GAIN_KEYWORDS = {
  financial: [
    'lucro', 'receita', 'faturamento', 'economia', 'redução de custos',
    'ROI', 'retorno', 'margem', 'rentabilidade', 'dinheiro'
  ],
  strategic: [
    'vantagem competitiva', 'liderança', 'mercado', 'crescimento',
    'expansão', 'escala', 'inovação', 'diferencial', 'posicionamento'
  ],
  personal: [
    'tempo livre', 'paz', 'tranquilidade', 'reconhecimento', 'promoção',
    'férias', 'família', 'saúde', 'equilíbrio', 'realização'
  ]
};
