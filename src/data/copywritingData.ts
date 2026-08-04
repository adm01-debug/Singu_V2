// ==============================================
// COPYWRITING SALES TOOLS - Data & Templates
// Enterprise-grade copywriting templates and data
// ==============================================

import {
  FABTemplate,
  AIDATemplate,
  CTATemplate,
  TransitionWord,
  PersuasiveConnector,
  HeadlineFormula,
  TargetSegment
} from '@/types/copywriting';

// ============================================
// 1. FAB TEMPLATES
// ============================================
export const FAB_TEMPLATES: FABTemplate[] = [
  {
    id: 'fab-software',
    name: 'Software/Tecnologia',
    category: 'product',
    template: {
      featurePrompt: 'Qual funcionalidade técnica você está descrevendo?',
      advantagePrompt: 'O que essa funcionalidade permite fazer na prática?',
      benefitPrompt: 'Como isso impacta a vida/negócio do cliente emocionalmente?'
    },
    example: {
      id: 'ex-1',
      feature: 'Sistema de backup automático em nuvem',
      advantage: 'Seus dados são salvos automaticamente a cada hora sem intervenção',
      benefit: 'Durma tranquilo sabendo que nunca mais vai perder informações importantes',
      emotionalHook: 'Paz de espírito total',
      targetPain: 'Medo de perder dados críticos'
    },
    powerWords: ['automático', 'seguro', 'tranquilidade', 'proteção', 'garantido']
  },
  {
    id: 'fab-service',
    name: 'Serviço/Consultoria',
    category: 'service',
    template: {
      featurePrompt: 'Qual é a característica do serviço?',
      advantagePrompt: 'Como isso beneficia o cliente na prática?',
      benefitPrompt: 'Qual transformação isso traz para a vida dele?'
    },
    example: {
      id: 'ex-2',
      feature: 'Atendimento personalizado 24/7',
      advantage: 'Suporte imediato sempre que precisar, sem filas ou espera',
      benefit: 'Você nunca mais vai se sentir sozinho enfrentando problemas',
      emotionalHook: 'Parceria verdadeira',
      targetPain: 'Frustração com suporte demorado'
    },
    powerWords: ['personalizado', 'exclusivo', 'dedicado', 'prioridade', 'VIP']
  },
  {
    id: 'fab-physical',
    name: 'Produto Físico',
    category: 'product',
    template: {
      featurePrompt: 'Quais são as especificações técnicas?',
      advantagePrompt: 'O que essas especificações permitem fazer?',
      benefitPrompt: 'Como o cliente vai se sentir usando isso?'
    },
    example: {
      id: 'ex-3',
      feature: 'Material resistente à água IPX7',
      advantage: 'Use em qualquer condição climática sem preocupação',
      benefit: 'Liberdade total para viver suas aventuras sem limitações',
      emotionalHook: 'Aventura sem limites',
      targetPain: 'Produtos que quebram facilmente'
    },
    powerWords: ['resistente', 'durável', 'premium', 'profissional', 'liberdade']
  }
];

// ============================================
// 2. AIDA TEMPLATES
// ============================================
export const AIDA_TEMPLATES: AIDATemplate[] = [
  {
    id: 'aida-whatsapp-d',
    name: 'WhatsApp - Perfil Dominante',
    channel: 'whatsapp',
    targetProfile: { disc: 'D' },
    sections: [
      {
        stage: 'attention',
        title: 'Abertura Direta',
        content: '[Nome], resultados em [X] dias. Tenho uma proposta.',
        techniques: ['Direto ao ponto', 'Promessa de resultado'],
        powerWords: ['resultado', 'agora', 'direto'],
        duration: '5 seg',
        transitionPhrase: 'Veja os números:'
      },
      {
        stage: 'interest',
        title: 'Dados Concretos',
        content: 'Clientes como você alcançaram [RESULTADO ESPECÍFICO] em [TEMPO].',
        techniques: ['Prova social', 'Especificidade'],
        powerWords: ['comprovado', 'mensurável', 'ROI'],
        duration: '10 seg',
        transitionPhrase: 'O que isso significa:'
      },
      {
        stage: 'desire',
        title: 'Projeção de Ganhos',
        content: 'Imagine seu [MÉTRICA] aumentando [X]% já no primeiro mês.',
        techniques: ['Future pacing', 'Ancoragem numérica'],
        powerWords: ['crescimento', 'expansão', 'domínio'],
        duration: '10 seg',
        transitionPhrase: 'Para começar:'
      },
      {
        stage: 'action',
        title: 'CTA Direto',
        content: 'Quer ver como? Responda "SIM" e envio os detalhes agora.',
        techniques: ['Simplicidade', 'Baixa fricção'],
        powerWords: ['agora', 'imediato', 'hoje'],
        duration: '5 seg'
      }
    ],
    estimatedConversion: 35,
    tips: ['Seja breve', 'Use números', 'Evite rodeios']
  },
  {
    id: 'aida-whatsapp-i',
    name: 'WhatsApp - Perfil Influente',
    channel: 'whatsapp',
    targetProfile: { disc: 'I' },
    sections: [
      {
        stage: 'attention',
        title: 'Abertura Entusiasmada',
        content: '[Nome]! 🎉 Tenho uma novidade INCRÍVEL pra te contar!',
        techniques: ['Entusiasmo', 'Exclusividade'],
        powerWords: ['incrível', 'novidade', 'exclusivo'],
        duration: '5 seg',
        transitionPhrase: 'Olha só que demais:'
      },
      {
        stage: 'interest',
        title: 'História Inspiradora',
        content: 'O João, que era igualzinho a você, conseguiu [RESULTADO] e agora [TRANSFORMAÇÃO]!',
        techniques: ['Storytelling', 'Identificação'],
        powerWords: ['transformação', 'sucesso', 'reconhecimento'],
        duration: '15 seg',
        transitionPhrase: 'E o melhor:'
      },
      {
        stage: 'desire',
        title: 'Visão do Futuro',
        content: 'Imagina você sendo reconhecido como [IDENTIDADE DESEJADA]? Isso é totalmente possível!',
        techniques: ['Identity labeling', 'Aspiração'],
        powerWords: ['reconhecimento', 'destaque', 'admiração'],
        duration: '10 seg',
        transitionPhrase: 'Vamos juntos?'
      },
      {
        stage: 'action',
        title: 'CTA Social',
        content: 'Manda um "QUERO" que te conto tudo! Vai ser demais! 🚀',
        techniques: ['Energia positiva', 'Inclusão'],
        powerWords: ['juntos', 'parceria', 'vamos'],
        duration: '5 seg'
      }
    ],
    estimatedConversion: 40,
    tips: ['Use emojis', 'Conte histórias', 'Seja entusiasta']
  },
  {
    id: 'aida-email-formal',
    name: 'Email - Formal/Corporativo',
    channel: 'email',
    targetProfile: { disc: 'C' },
    sections: [
      {
        stage: 'attention',
        title: 'Assunto + Abertura',
        content: 'Assunto: Análise de [ÁREA] revela oportunidade de [X]%\n\nPrezado(a) [Nome],',
        techniques: ['Especificidade', 'Dados no assunto'],
        powerWords: ['análise', 'dados', 'oportunidade'],
        duration: '10 seg',
        transitionPhrase: 'Conforme estudo recente:'
      },
      {
        stage: 'interest',
        title: 'Apresentação de Dados',
        content: 'Nossa pesquisa com [N] empresas do seu segmento identificou que [INSIGHT RELEVANTE].',
        techniques: ['Autoridade', 'Pesquisa'],
        powerWords: ['pesquisa', 'identificou', 'segmento'],
        duration: '30 seg',
        transitionPhrase: 'A metodologia aplicada:'
      },
      {
        stage: 'desire',
        title: 'Solução Detalhada',
        content: 'Nossa solução aborda especificamente [DOR], através de [MÉTODO], resultando em [BENEFÍCIO MENSURÁVEL].',
        techniques: ['Lógica', 'Processo'],
        powerWords: ['metodologia', 'processo', 'sistemático'],
        duration: '45 seg',
        transitionPhrase: 'Próximos passos sugeridos:'
      },
      {
        stage: 'action',
        title: 'CTA Estruturado',
        content: 'Proponho uma reunião de 30 minutos para apresentar a análise completa. Seguem opções de horário: [DATAS]',
        techniques: ['Opções', 'Agenda clara'],
        powerWords: ['análise', 'apresentação', 'proposta'],
        duration: '15 seg'
      }
    ],
    estimatedConversion: 25,
    tips: ['Seja preciso', 'Use dados', 'Estruture bem']
  }
];

// ============================================
// 3. CTA TEMPLATES
// ============================================
export const CTA_TEMPLATES: CTATemplate[] = [
  // Primary CTAs
  {
    id: 'cta-discover',
    type: 'primary',
    verb: 'descobrir',
    template: 'Descubra como [BENEFÍCIO] agora mesmo',
    example: 'Descubra como dobrar suas vendas agora mesmo',
    urgencyLevel: 3,
    bestFor: ['lançamentos', 'novidades', 'curiosidade'],
    avoidFor: ['urgência extrema', 'ofertas limitadas'],
    discCompatibility: { D: 70, I: 90, S: 60, C: 80 }
  },
  {
    id: 'cta-guarantee',
    type: 'primary',
    verb: 'garantir',
    template: 'Garanta [BENEFÍCIO] antes que [ESCASSEZ]',
    example: 'Garanta sua vaga antes que as inscrições fechem',
    urgencyLevel: 4,
    bestFor: ['escassez real', 'eventos', 'cursos'],
    avoidFor: ['produtos sempre disponíveis'],
    discCompatibility: { D: 95, I: 75, S: 50, C: 60 }
  },
  {
    id: 'cta-reserve',
    type: 'primary',
    verb: 'reservar',
    template: 'Reserve [OFERTA] com [CONDIÇÃO ESPECIAL]',
    example: 'Reserve seu lugar com 50% de desconto',
    urgencyLevel: 4,
    bestFor: ['eventos', 'lançamentos', 'pré-vendas'],
    avoidFor: ['produtos digitais ilimitados'],
    discCompatibility: { D: 85, I: 80, S: 65, C: 70 }
  },
  {
    id: 'cta-access',
    type: 'primary',
    verb: 'acessar',
    template: 'Acesse [CONTEÚDO] gratuitamente',
    example: 'Acesse o guia completo gratuitamente',
    urgencyLevel: 2,
    bestFor: ['lead magnets', 'conteúdo', 'trials'],
    avoidFor: ['vendas diretas'],
    discCompatibility: { D: 60, I: 85, S: 75, C: 90 }
  },
  {
    id: 'cta-start',
    type: 'primary',
    verb: 'começar',
    template: 'Comece [AÇÃO] em [TEMPO]',
    example: 'Comece a economizar em 5 minutos',
    urgencyLevel: 3,
    bestFor: ['onboarding', 'trials', 'simplicidade'],
    avoidFor: ['produtos complexos'],
    discCompatibility: { D: 90, I: 85, S: 70, C: 65 }
  },
  // Soft CTAs
  {
    id: 'cta-learn',
    type: 'soft',
    verb: 'descobrir',
    template: 'Saiba mais sobre [TEMA]',
    example: 'Saiba mais sobre nossa metodologia',
    urgencyLevel: 1,
    bestFor: ['educacional', 'awareness', 'perfil C'],
    avoidFor: ['vendas urgentes'],
    discCompatibility: { D: 40, I: 60, S: 80, C: 95 }
  },
  {
    id: 'cta-experiment',
    type: 'soft',
    verb: 'experimentar',
    template: 'Experimente [PRODUTO] sem compromisso',
    example: 'Experimente por 7 dias sem compromisso',
    urgencyLevel: 2,
    bestFor: ['trials', 'SaaS', 'serviços'],
    avoidFor: ['produtos físicos', 'urgência'],
    discCompatibility: { D: 55, I: 75, S: 90, C: 85 }
  },
  // Urgent CTAs
  {
    id: 'cta-now',
    type: 'urgent',
    verb: 'aproveitar',
    template: 'Aproveite AGORA - [ESCASSEZ]',
    example: 'Aproveite AGORA - últimas 5 unidades!',
    urgencyLevel: 5,
    bestFor: ['escassez real', 'promoções flash'],
    avoidFor: ['relacionamento longo', 'perfil S'],
    discCompatibility: { D: 95, I: 70, S: 30, C: 50 }
  },
  {
    id: 'cta-unlock',
    type: 'exclusive',
    verb: 'desbloquear',
    template: 'Desbloqueie [BENEFÍCIO EXCLUSIVO] hoje',
    example: 'Desbloqueie acesso VIP hoje',
    urgencyLevel: 4,
    bestFor: ['exclusividade', 'memberships', 'upgrade'],
    avoidFor: ['produtos básicos'],
    discCompatibility: { D: 80, I: 95, S: 55, C: 60 }
  },
  // Social CTAs
  {
    id: 'cta-join',
    type: 'social',
    verb: 'conquistar',
    template: 'Junte-se a [NÚMERO] [PESSOAS] que já [RESULTADO]',
    example: 'Junte-se a 10.000+ empreendedores que já dobraram seu faturamento',
    urgencyLevel: 3,
    bestFor: ['comunidades', 'prova social forte'],
    avoidFor: ['sem prova social'],
    discCompatibility: { D: 65, I: 95, S: 85, C: 70 }
  },
  // Guarantee CTAs
  {
    id: 'cta-risk-free',
    type: 'guarantee',
    verb: 'experimentar',
    template: 'Teste [PRODUTO] - Satisfação garantida ou [GARANTIA]',
    example: 'Teste por 30 dias - Satisfação garantida ou seu dinheiro de volta',
    urgencyLevel: 3,
    bestFor: ['eliminar objeções', 'perfil S', 'alto ticket'],
    avoidFor: ['baixo ticket', 'sem garantia real'],
    discCompatibility: { D: 70, I: 65, S: 95, C: 90 }
  }
];

// ============================================
// 4. TRANSITION WORDS
// ============================================
export const TRANSITION_WORDS: TransitionWord[] = [
  // Contrast
  { word: 'Mas aqui está o diferencial:', category: 'contrast', usage: 'Introduzir vantagem competitiva', example: 'Muitos prometem. Mas aqui está o diferencial: nós garantimos.', formalLevel: 'neutral', persuasionStrength: 5 },
  { word: 'No entanto,', category: 'contrast', usage: 'Contrapor objeção', example: 'Parece caro. No entanto, o retorno é 10x.', formalLevel: 'formal', persuasionStrength: 3 },
  { word: 'Por outro lado,', category: 'contrast', usage: 'Apresentar alternativa', example: 'Você pode continuar assim. Por outro lado, existe uma forma melhor.', formalLevel: 'formal', persuasionStrength: 4 },
  
  // Addition
  { word: 'E não é só isso:', category: 'addition', usage: 'Adicionar benefício extra', example: 'Você economiza tempo. E não é só isso: também economiza dinheiro.', formalLevel: 'neutral', persuasionStrength: 5 },
  { word: 'Além de tudo,', category: 'addition', usage: 'Empilhar benefícios', example: 'Além de tudo, você ainda recebe suporte vitalício.', formalLevel: 'neutral', persuasionStrength: 4 },
  { word: 'Melhor ainda:', category: 'addition', usage: 'Surpreender com extra', example: 'Entrega em 24h. Melhor ainda: frete grátis!', formalLevel: 'informal', persuasionStrength: 5 },
  
  // Cause
  { word: 'Isso porque', category: 'cause', usage: 'Justificar afirmação', example: 'Nossos clientes ficam. Isso porque entregamos resultado real.', formalLevel: 'neutral', persuasionStrength: 4 },
  { word: 'A razão é simples:', category: 'cause', usage: 'Explicar de forma acessível', example: 'Funciona. A razão é simples: focamos no que importa.', formalLevel: 'neutral', persuasionStrength: 4 },
  { word: 'Justamente por isso,', category: 'cause', usage: 'Conectar problema à solução', example: 'Você está cansado de perder tempo. Justamente por isso, criamos esta ferramenta.', formalLevel: 'formal', persuasionStrength: 5 },
  
  // Consequence
  { word: 'O resultado?', category: 'consequence', usage: 'Criar expectativa', example: 'Aplicamos o método. O resultado? 300% de aumento em vendas.', formalLevel: 'neutral', persuasionStrength: 5 },
  { word: 'Isso significa que', category: 'consequence', usage: 'Traduzir em benefício', example: 'Automatizamos tudo. Isso significa que você trabalha menos.', formalLevel: 'neutral', persuasionStrength: 4 },
  { word: 'Na prática:', category: 'consequence', usage: 'Tornar tangível', example: 'Sistema inteligente. Na prática: você economiza 10h por semana.', formalLevel: 'neutral', persuasionStrength: 5 },
  
  // Emphasis
  { word: 'O mais importante:', category: 'emphasis', usage: 'Destacar ponto-chave', example: 'Temos várias vantagens. O mais importante: garantia total.', formalLevel: 'neutral', persuasionStrength: 5 },
  { word: 'A verdade é:', category: 'emphasis', usage: 'Criar credibilidade', example: 'A verdade é: 90% dos negócios falham por falta de método.', formalLevel: 'neutral', persuasionStrength: 5 },
  { word: 'Aqui está o segredo:', category: 'emphasis', usage: 'Revelar insight exclusivo', example: 'Aqui está o segredo: consistência vale mais que intensidade.', formalLevel: 'informal', persuasionStrength: 5 },
  
  // Example
  { word: 'Para você ter uma ideia,', category: 'example', usage: 'Ilustrar com caso real', example: 'Para você ter uma ideia, o João triplicou o faturamento em 3 meses.', formalLevel: 'informal', persuasionStrength: 4 },
  { word: 'Veja o caso de', category: 'example', usage: 'Apresentar prova social', example: 'Veja o caso de Maria: de CLT para 6 dígitos.', formalLevel: 'neutral', persuasionStrength: 5 },
  
  // Conclusion
  { word: 'Resumindo:', category: 'conclusion', usage: 'Sintetizar proposta', example: 'Resumindo: mais resultado, menos esforço, zero risco.', formalLevel: 'neutral', persuasionStrength: 4 },
  { word: 'A pergunta é:', category: 'conclusion', usage: 'Provocar decisão', example: 'A pergunta é: você vai continuar do mesmo jeito ou vai agir?', formalLevel: 'neutral', persuasionStrength: 5 },
  { word: 'Agora a decisão é sua:', category: 'conclusion', usage: 'Transferir responsabilidade', example: 'Mostrei o caminho. Agora a decisão é sua.', formalLevel: 'informal', persuasionStrength: 5 }
];

// ============================================
// 5. PERSUASIVE CONNECTORS
// ============================================
export const PERSUASIVE_CONNECTORS: PersuasiveConnector[] = [
  {
    id: 'pc-1',
    phrase: 'O grande diferencial está em...',
    purpose: 'Posicionar vantagem competitiva',
    example: 'O grande diferencial está em nossa metodologia exclusiva.',
    bestAfter: ['contrast', 'cause'],
    bestBefore: ['emphasis', 'example'],
    emotionalImpact: 'high'
  },
  {
    id: 'pc-2',
    phrase: 'E é exatamente por isso que...',
    purpose: 'Conectar problema à solução',
    example: 'E é exatamente por isso que desenvolvemos esta solução.',
    bestAfter: ['cause', 'example'],
    bestBefore: ['consequence', 'emphasis'],
    emotionalImpact: 'medium'
  },
  {
    id: 'pc-3',
    phrase: 'O que poucos sabem é que...',
    purpose: 'Criar exclusividade de informação',
    example: 'O que poucos sabem é que 80% do resultado vem de 20% das ações.',
    bestAfter: ['contrast', 'emphasis'],
    bestBefore: ['cause', 'example'],
    emotionalImpact: 'high'
  },
  {
    id: 'pc-4',
    phrase: 'Imagine só...',
    purpose: 'Ativar visualização do futuro',
    example: 'Imagine só você tendo liberdade financeira em 12 meses.',
    bestAfter: ['consequence', 'example'],
    bestBefore: ['conclusion', 'emphasis'],
    emotionalImpact: 'high'
  },
  {
    id: 'pc-5',
    phrase: 'A boa notícia é:',
    purpose: 'Transição para solução',
    example: 'O mercado está difícil. A boa notícia é: temos a estratégia certa.',
    bestAfter: ['contrast', 'cause'],
    bestBefore: ['addition', 'consequence'],
    emotionalImpact: 'medium'
  },
  {
    id: 'pc-6',
    phrase: 'Deixa eu te mostrar...',
    purpose: 'Criar proximidade e conduzir (VAK Visual)',
    example: 'Deixa eu te mostrar como funciona na prática.',
    bestAfter: ['emphasis', 'contrast'],
    bestBefore: ['example', 'consequence'],
    emotionalImpact: 'medium'
  },
  {
    id: 'pc-7',
    phrase: 'O fato é:',
    purpose: 'Estabelecer credibilidade objetiva',
    example: 'O fato é: 97% dos nossos clientes renovam.',
    bestAfter: ['contrast', 'example'],
    bestBefore: ['cause', 'conclusion'],
    emotionalImpact: 'medium'
  },
  {
    id: 'pc-8',
    phrase: 'Sabe o que mais me impressiona?',
    purpose: 'Criar curiosidade e engajamento',
    example: 'Sabe o que mais me impressiona? Os resultados aparecem na primeira semana.',
    bestAfter: ['example', 'consequence'],
    bestBefore: ['emphasis', 'addition'],
    emotionalImpact: 'high'
  }
];

// ============================================
// 6. HEADLINE FORMULAS
// ============================================
export const HEADLINE_FORMULAS: HeadlineFormula[] = [
  {
    id: 'hl-how-to',
    type: 'how_to',
    formula: 'Como [AÇÃO] em [TEMPO] sem [OBJEÇÃO]',
    example: 'Como dobrar suas vendas em 30 dias sem aumentar o investimento',
    variables: ['AÇÃO', 'TEMPO', 'OBJEÇÃO'],
    effectiveness: 9,
    bestFor: ['tutoriais', 'cursos', 'soluções práticas'],
    powerWordsToUse: ['simples', 'fácil', 'rápido', 'garantido']
  },
  {
    id: 'hl-number',
    type: 'number_list',
    formula: '[NÚMERO] [ESTRATÉGIAS] para [RESULTADO] (a #[N] vai te surpreender)',
    example: '7 estratégias para fechar mais vendas (a #5 vai te surpreender)',
    variables: ['NÚMERO', 'ESTRATÉGIAS', 'RESULTADO', 'N'],
    effectiveness: 8,
    bestFor: ['artigos', 'listas', 'conteúdo educativo'],
    powerWordsToUse: ['comprovadas', 'secretas', 'poderosas', 'infalíveis']
  },
  {
    id: 'hl-question',
    type: 'question',
    formula: 'Você sabia que [FATO SURPREENDENTE]?',
    example: 'Você sabia que 80% das vendas acontecem após o 5º follow-up?',
    variables: ['FATO SURPREENDENTE'],
    effectiveness: 7,
    bestFor: ['emails', 'posts', 'abertura de conversas'],
    powerWordsToUse: ['maioria', 'poucos', 'descobriram', 'revelou']
  },
  {
    id: 'hl-command',
    type: 'command',
    formula: '[VERBO IMPERATIVO] o [SEGREDO/MÉTODO] que [RESULTADO]',
    example: 'Descubra o método que transformou iniciantes em top vendedores',
    variables: ['VERBO IMPERATIVO', 'SEGREDO/MÉTODO', 'RESULTADO'],
    effectiveness: 8,
    bestFor: ['CTAs', 'landing pages', 'anúncios'],
    powerWordsToUse: ['descubra', 'aprenda', 'domine', 'conquiste']
  },
  {
    id: 'hl-testimonial',
    type: 'testimonial',
    formula: '"[RESULTADO ESPECÍFICO]" - [NOME], [CREDENCIAL]',
    example: '"Aumentei 340% em faturamento" - João Silva, CEO da TechCorp',
    variables: ['RESULTADO ESPECÍFICO', 'NOME', 'CREDENCIAL'],
    effectiveness: 9,
    bestFor: ['prova social', 'cases', 'credibilidade'],
    powerWordsToUse: ['real', 'verdadeiro', 'comprovado', 'documentado']
  },
  {
    id: 'hl-secret',
    type: 'secret',
    formula: 'O segredo [QUE/POR TRÁS DE] [REFERÊNCIA DE SUCESSO] para [RESULTADO]',
    example: 'O segredo por trás das empresas que crescem 10x ao ano',
    variables: ['QUE/POR TRÁS DE', 'REFERÊNCIA DE SUCESSO', 'RESULTADO'],
    effectiveness: 8,
    bestFor: ['exclusividade', 'curiosidade', 'premium'],
    powerWordsToUse: ['revelado', 'exclusivo', 'insider', 'confidencial']
  },
  {
    id: 'hl-warning',
    type: 'warning',
    formula: '[ALERTA]: [ERRO COMUM] está [CONSEQUÊNCIA NEGATIVA]',
    example: 'ATENÇÃO: Este erro de iniciante está custando 50% das suas vendas',
    variables: ['ALERTA', 'ERRO COMUM', 'CONSEQUÊNCIA NEGATIVA'],
    effectiveness: 8,
    bestFor: ['urgência', 'prevenção', 'educação'],
    powerWordsToUse: ['cuidado', 'atenção', 'alerta', 'evite']
  },
  {
    id: 'hl-guarantee',
    type: 'guarantee',
    formula: '[RESULTADO] garantido ou [COMPENSAÇÃO]',
    example: 'Aumento de vendas garantido ou devolvemos seu investimento',
    variables: ['RESULTADO', 'COMPENSAÇÃO'],
    effectiveness: 9,
    bestFor: ['eliminar risco', 'conversão', 'alto ticket'],
    powerWordsToUse: ['garantido', 'sem risco', '100%', 'promessa']
  }
];

// ============================================
// 7. DEFAULT TARGET SEGMENTS
// ============================================
export const DEFAULT_SEGMENTS: TargetSegment[] = [
  {
    id: 'seg-empreendedor',
    name: 'Empreendedor Digital',
    description: 'Profissional que busca escalar seu negócio online',
    painPoints: ['Falta de tempo', 'Dificuldade de escalar', 'Concorrência acirrada'],
    desires: ['Automatização', 'Liberdade financeira', 'Reconhecimento'],
    objections: ['Já tentei e não funcionou', 'Não tenho tempo', 'É caro demais'],
    demographics: {
      ageRange: '25-45',
      profession: 'Empreendedor/Autônomo',
      industry: 'Digital/Tecnologia'
    },
    psychographics: {
      values: ['Liberdade', 'Crescimento', 'Inovação'],
      fears: ['Ficar para trás', 'Perder oportunidades', 'Fracasso público'],
      aspirations: ['6 dígitos mensais', 'Trabalhar de qualquer lugar', 'Ser referência']
    }
  },
  {
    id: 'seg-gestor',
    name: 'Gestor Corporativo',
    description: 'Líder que precisa entregar resultados e gerenciar equipes',
    painPoints: ['Pressão por resultados', 'Equipe desmotivada', 'Processos ineficientes'],
    desires: ['Reconhecimento profissional', 'Promoção', 'Equipe engajada'],
    objections: ['Preciso aprovar com superiores', 'Não é prioridade agora', 'Orçamento limitado'],
    demographics: {
      ageRange: '30-55',
      profession: 'Gerente/Diretor',
      companySize: 'Médio a Grande porte'
    },
    psychographics: {
      values: ['Resultados', 'Liderança', 'Eficiência'],
      fears: ['Perder o cargo', 'Não bater metas', 'Ser ultrapassado'],
      aspirations: ['Promoção', 'Reconhecimento', 'Deixar legado']
    }
  },
  {
    id: 'seg-profissional-liberal',
    name: 'Profissional Liberal',
    description: 'Advogado, médico, contador que busca crescer a carteira de clientes',
    painPoints: ['Depende de indicações', 'Dificuldade em precificar', 'Falta de diferenciação'],
    desires: ['Mais clientes qualificados', 'Autoridade no mercado', 'Precificação justa'],
    objections: ['Minha área é diferente', 'Não tenho tempo para marketing', 'Não combina com minha profissão'],
    demographics: {
      ageRange: '28-60',
      profession: 'Advogado/Médico/Contador/Arquiteto',
      industry: 'Serviços Profissionais'
    },
    psychographics: {
      values: ['Ética', 'Competência', 'Reputação'],
      fears: ['Manchar reputação', 'Parecer vendedor', 'Perder clientes'],
      aspirations: ['Ser referência', 'Escolher clientes', 'Premium pricing']
    }
  }
];

// ============================================
// 8. POWER WORDS BY CATEGORY
// ============================================
export const POWER_WORDS_CATEGORIES = {
  urgency: ['agora', 'hoje', 'imediato', 'último', 'urgente', 'limitado', 'encerra', 'restam'],
  exclusivity: ['exclusivo', 'VIP', 'selecionado', 'privado', 'restrito', 'insider', 'primeiro'],
  authority: ['comprovado', 'científico', 'especialista', 'líder', 'referência', 'autoridade', 'certificado'],
  trust: ['garantido', 'seguro', 'confiável', 'transparente', 'honesto', 'verdadeiro', 'autêntico'],
  benefit: ['resultado', 'transformação', 'sucesso', 'conquista', 'vitória', 'liberdade', 'crescimento'],
  ease: ['simples', 'fácil', 'rápido', 'sem esforço', 'automático', 'prático', 'descomplicado'],
  emotion: ['incrível', 'extraordinário', 'poderoso', 'revolucionário', 'transformador', 'impressionante'],
  action: ['descubra', 'aprenda', 'domine', 'conquiste', 'garanta', 'acesse', 'desbloqueie', 'ative']
};
