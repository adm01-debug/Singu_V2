// ==============================================
// COPYWRITING ADVANCED DATA - PAS, 4Ps, Storytelling
// Enterprise-grade copywriting frameworks
// ==============================================

import {
  PASTemplate,
  FourPsTemplate,
  StorytellingTemplate,
  EmojiContext
} from '@/types/copywriting';

// ============================================
// 1. PAS TEMPLATES (Problem-Agitate-Solution)
// ============================================
export const PAS_TEMPLATES: PASTemplate[] = [
  {
    id: 'pas-whatsapp-d',
    name: 'WhatsApp - Perfil Dominante',
    channel: 'whatsapp',
    targetProfile: { disc: 'D' },
    sections: [
      {
        stage: 'problem',
        title: 'Identificar o Problema',
        content: '[Nome], você está perdendo [X]% de [RESULTADO] por mês. Isso está custando [VALOR] para seu negócio.',
        techniques: ['Dados específicos', 'Custo da inação'],
        emotionalIntensity: 3,
        tips: ['Use números concretos', 'Seja direto']
      },
      {
        stage: 'agitate',
        title: 'Agitar a Dor',
        content: 'E enquanto você não resolve isso, seus concorrentes estão [GANHANDO VANTAGEM]. Cada dia que passa é dinheiro deixado na mesa.',
        techniques: ['FOMO', 'Comparação competitiva'],
        emotionalIntensity: 4,
        tips: ['Não exagere', 'Mantenha factual']
      },
      {
        stage: 'solution',
        title: 'Apresentar Solução',
        content: 'Tenho uma solução que resolve isso em [TEMPO]. [RESULTADO ESPECÍFICO] garantido. Quer ver como?',
        techniques: ['Promessa clara', 'CTA direto'],
        emotionalIntensity: 2,
        tips: ['Feche com ação', 'Seja objetivo']
      }
    ],
    estimatedConversion: 38
  },
  {
    id: 'pas-whatsapp-s',
    name: 'WhatsApp - Perfil Estável',
    channel: 'whatsapp',
    targetProfile: { disc: 'S' },
    sections: [
      {
        stage: 'problem',
        title: 'Identificar o Problema',
        content: '[Nome], sei que você tem enfrentado [PROBLEMA] e entendo como isso pode ser difícil e estressante.',
        techniques: ['Empatia', 'Validação'],
        emotionalIntensity: 2,
        tips: ['Mostre compreensão', 'Não pressione']
      },
      {
        stage: 'agitate',
        title: 'Agitar a Dor (gentilmente)',
        content: 'O pior é que isso afeta não só o trabalho, mas também sua tranquilidade. Você merece mais paz de espírito.',
        techniques: ['Conexão emocional', 'Aspiração'],
        emotionalIntensity: 3,
        tips: ['Agite com cuidado', 'Foque no bem-estar']
      },
      {
        stage: 'solution',
        title: 'Apresentar Solução',
        content: 'Posso te ajudar com isso de forma segura e sem pressa. Muitos clientes como você já conseguiram [RESULTADO]. Quer que eu te explique como funciona?',
        techniques: ['Segurança', 'Prova social suave'],
        emotionalIntensity: 1,
        tips: ['Ofereça suporte', 'Sem pressão']
      }
    ],
    estimatedConversion: 32
  },
  {
    id: 'pas-email-c',
    name: 'Email - Perfil Analítico',
    channel: 'email',
    targetProfile: { disc: 'C' },
    sections: [
      {
        stage: 'problem',
        title: 'Problema com Dados',
        content: 'Assunto: Análise revela: empresas do seu segmento perdem [X]% por [CAUSA]\n\nPrezado [Nome],\n\nNossa pesquisa com [N] empresas identificou um padrão preocupante: [ESTATÍSTICA PROBLEMA].',
        techniques: ['Autoridade', 'Dados estatísticos'],
        emotionalIntensity: 2,
        tips: ['Use pesquisas', 'Cite fontes']
      },
      {
        stage: 'agitate',
        title: 'Impacto Quantificado',
        content: 'Projetando para os próximos 12 meses, isso representa uma perda potencial de [VALOR] em [MÉTRICA]. A tendência indica agravamento se não houver intervenção.',
        techniques: ['Projeção', 'Lógica'],
        emotionalIntensity: 3,
        tips: ['Mantenha objetividade', 'Mostre tendências']
      },
      {
        stage: 'solution',
        title: 'Solução Metodológica',
        content: 'Desenvolvemos uma metodologia que aborda especificamente [CAUSA]. Resultados documentados: [RESULTADO MENSURÁVEL].\n\nPosso enviar a análise completa e a proposta técnica. Qual o melhor horário para conversarmos?',
        techniques: ['Processo claro', 'Evidências'],
        emotionalIntensity: 1,
        tips: ['Ofereça documentação', 'Seja específico']
      }
    ],
    estimatedConversion: 28
  }
];

// ============================================
// 2. 4Ps TEMPLATES (Promise-Picture-Proof-Push)
// ============================================
export const FOUR_PS_TEMPLATES: FourPsTemplate[] = [
  {
    id: '4ps-general',
    name: 'Template Universal',
    channel: 'all',
    sections: [
      {
        stage: 'promise',
        title: '1. PROMESSA',
        content: '[RESULTADO PRINCIPAL] em [TEMPO] ou [GARANTIA]',
        techniques: ['Big promise', 'Especificidade', 'Garantia'],
        powerWords: ['garantido', 'comprovado', 'método', 'sistema']
      },
      {
        stage: 'picture',
        title: '2. PINTURA',
        content: 'Imagine você [CENÁRIO DESEJADO]. Acordando [SENSAÇÃO], sabendo que [BENEFÍCIO]. Sua [ÁREA] finalmente [TRANSFORMAÇÃO].',
        techniques: ['Visualização', 'Future pacing', 'Sensorial'],
        powerWords: ['imagine', 'visualize', 'sinta', 'perceba']
      },
      {
        stage: 'proof',
        title: '3. PROVA',
        content: '[NOME] estava exatamente onde você está. Em [TEMPO], conseguiu [RESULTADO ESPECÍFICO]. Hoje [SITUAÇÃO ATUAL]. E não é só ele: [ESTATÍSTICA] de nossos clientes alcançaram [MÉTRICA].',
        techniques: ['Testemunho', 'Estatísticas', 'Case study'],
        powerWords: ['comprovado', 'documentado', 'real', 'verificável']
      },
      {
        stage: 'push',
        title: '4. EMPURRÃO',
        content: 'Mas isso só vale para quem agir até [PRAZO]. Depois disso, [CONSEQUÊNCIA]. Clique agora e [CTA ESPECÍFICO].',
        techniques: ['Urgência', 'Escassez', 'CTA claro'],
        powerWords: ['agora', 'hoje', 'última', 'restam']
      }
    ],
    bestFor: ['landing pages', 'emails de venda', 'vídeos de vendas']
  },
  {
    id: '4ps-whatsapp',
    name: 'WhatsApp Compacto',
    channel: 'whatsapp',
    sections: [
      {
        stage: 'promise',
        title: 'PROMESSA',
        content: '🎯 [Nome], [RESULTADO] em [TEMPO]. Garantido.',
        techniques: ['Direto', 'Emoji de abertura'],
        powerWords: ['resultado', 'garantido', 'comprovado']
      },
      {
        stage: 'picture',
        title: 'PINTURA',
        content: '💭 Imagina [CENÁRIO] sem [DOR]...',
        techniques: ['Visualização rápida'],
        powerWords: ['imagine', 'visualize', 'pense']
      },
      {
        stage: 'proof',
        title: 'PROVA',
        content: '✅ [X]+ pessoas já conseguiram. O [Nome] fez [RESULTADO] em [TEMPO].',
        techniques: ['Prova social compacta'],
        powerWords: ['comprovado', 'funciona', 'real']
      },
      {
        stage: 'push',
        title: 'EMPURRÃO',
        content: '⏰ Só até [PRAZO]. Responde "QUERO" que te explico.',
        techniques: ['Urgência + CTA simples'],
        powerWords: ['agora', 'hoje', 'última']
      }
    ],
    bestFor: ['primeiro contato', 'follow-up', 'reengajamento']
  }
];

// ============================================
// 3. STORYTELLING TEMPLATES
// ============================================
export const STORYTELLING_TEMPLATES: StorytellingTemplate[] = [
  {
    id: 'story-hero',
    arc: 'hero_journey',
    name: 'Jornada do Herói',
    description: 'O cliente como herói que supera desafios com sua ajuda como mentor',
    elements: [
      { id: 'e1', name: 'Mundo Comum', description: 'Situação atual do cliente', example: 'João era um empreendedor como tantos outros...', position: 1 },
      { id: 'e2', name: 'Chamado à Aventura', description: 'O momento de decisão', example: 'Até que um dia percebeu que não poderia continuar assim...', position: 2 },
      { id: 'e3', name: 'Encontro com Mentor', description: 'Você/sua solução entra', example: 'Foi quando descobriu [SOLUÇÃO]...', position: 3 },
      { id: 'e4', name: 'Provações', description: 'Desafios enfrentados', example: 'No começo teve dúvidas, mas...', position: 4 },
      { id: 'e5', name: 'Transformação', description: 'A mudança acontece', example: 'Em [TEMPO], tudo mudou...', position: 5 },
      { id: 'e6', name: 'Retorno Vitorioso', description: 'O novo estado', example: 'Hoje João [RESULTADO] e [BENEFÍCIO]...', position: 6 }
    ],
    emotionalPeaks: ['Chamado à Aventura', 'Transformação'],
    bestFor: ['Vídeos de vendas', 'Cases longos', 'Webinars'],
    example: 'João era um empreendedor comum, lutando para fazer 10k/mês. Até que um dia percebeu: não poderia continuar assim. Foi quando descobriu o Método X. No começo teve dúvidas, mas decidiu testar. Em 90 dias, tudo mudou. Hoje João fatura 50k/mês e trabalha 4 dias por semana.'
  },
  {
    id: 'story-before-after',
    arc: 'before_after',
    name: 'Antes e Depois',
    description: 'Contraste dramático entre situação anterior e atual',
    elements: [
      { id: 'e1', name: 'ANTES - A Dor', description: 'Situação problemática', example: 'Antes: acordava às 5h, trabalhava 14h por dia, zero qualidade de vida...', position: 1 },
      { id: 'e2', name: 'O PONTO DE VIRADA', description: 'Decisão de mudar', example: 'Até que decidi que precisava de ajuda...', position: 2 },
      { id: 'e3', name: 'DEPOIS - A Vitória', description: 'Nova realidade', example: 'Agora: trabalho 6h por dia, faturando 3x mais, com tempo para família...', position: 3 }
    ],
    emotionalPeaks: ['ANTES - A Dor', 'DEPOIS - A Vitória'],
    bestFor: ['Depoimentos', 'Posts sociais', 'WhatsApp'],
    example: 'ANTES: Acordava às 5h, trabalhava 14 horas, sem ver meus filhos. Faturamento estagnado. PONTO DE VIRADA: Conheci o método e decidi testar. DEPOIS: Trabalho 6h por dia. Faturo 3x mais. Levo meus filhos na escola todos os dias.'
  },
  {
    id: 'story-rags-riches',
    arc: 'rags_to_riches',
    name: 'Da Lama ao Sucesso',
    description: 'Transformação radical de situação difícil para sucesso',
    elements: [
      { id: 'e1', name: 'O Fundo do Poço', description: 'Momento mais difícil', example: 'Estava devendo R$ 50 mil, sem perspectiva...', position: 1 },
      { id: 'e2', name: 'A Descoberta', description: 'Encontrou a solução', example: 'Foi quando encontrei [SOLUÇÃO]...', position: 2 },
      { id: 'e3', name: 'A Escalada', description: 'O processo de mudança', example: 'Mês a mês, fui aplicando...', position: 3 },
      { id: 'e4', name: 'O Topo', description: 'Conquista final', example: 'Hoje tenho [RESULTADO IMPRESSIONANTE]...', position: 4 }
    ],
    emotionalPeaks: ['O Fundo do Poço', 'O Topo'],
    bestFor: ['Histórias pessoais', 'Lançamentos', 'Webinars'],
    example: 'Há 2 anos estava devendo 50 mil, dormindo mal, sem saber como pagar as contas. Um dia encontrei o método que mudou tudo. Comecei a aplicar. Mês 1: paguei a primeira dívida. Mês 6: zerado. Hoje? Faturei 300k no último ano.'
  },
  {
    id: 'story-transformation',
    arc: 'transformation',
    name: 'Transformação Interna',
    description: 'Mudança de mentalidade e identidade',
    elements: [
      { id: 'e1', name: 'Identidade Antiga', description: 'Quem era antes', example: 'Eu era aquela pessoa que sempre dizia "não levo jeito para..."', position: 1 },
      { id: 'e2', name: 'O Catalisador', description: 'O que provocou a mudança', example: 'Até que [EVENTO] me fez perceber...', position: 2 },
      { id: 'e3', name: 'A Jornada Interior', description: 'Processo de mudança', example: 'Comecei a mudar minha forma de pensar sobre...', position: 3 },
      { id: 'e4', name: 'Nova Identidade', description: 'Quem se tornou', example: 'Hoje me vejo como [NOVA IDENTIDADE]...', position: 4 }
    ],
    emotionalPeaks: ['Identidade Antiga', 'Nova Identidade'],
    bestFor: ['Coaching', 'Desenvolvimento pessoal', 'Cursos'],
    example: 'Eu sempre dizia que não levava jeito para vendas. Tinha vergonha de oferecer qualquer coisa. Até que percebi: não era falta de talento, era falta de método. Comecei a aplicar técnicas certas. Hoje? Sou reconhecido como um dos melhores vendedores da empresa.'
  }
];

// ============================================
// 4. EMOJI INTELLIGENCE
// ============================================
export const EMOJI_CONTEXTS: EmojiContext[] = [
  {
    category: 'urgency',
    emojis: ['⏰', '🚨', '⚡', '🔥', '⏳', '🏃'],
    usage: 'Criar senso de urgência e ação imediata',
    discCompatibility: { D: 85, I: 75, S: 40, C: 50 },
    channelCompatibility: { whatsapp: 95, email: 60, call: 0 }
  },
  {
    category: 'celebration',
    emojis: ['🎉', '🎊', '🥳', '🏆', '⭐', '✨', '💫'],
    usage: 'Comemorar conquistas e resultados',
    discCompatibility: { D: 60, I: 95, S: 70, C: 45 },
    channelCompatibility: { whatsapp: 95, email: 70, call: 0 }
  },
  {
    category: 'trust',
    emojis: ['✅', '💯', '🔒', '🤝', '👍', '💪'],
    usage: 'Transmitir confiança e credibilidade',
    discCompatibility: { D: 80, I: 70, S: 90, C: 85 },
    channelCompatibility: { whatsapp: 90, email: 75, call: 0 }
  },
  {
    category: 'growth',
    emojis: ['📈', '🚀', '💹', '🌱', '📊', '⬆️'],
    usage: 'Indicar crescimento e resultados',
    discCompatibility: { D: 95, I: 80, S: 65, C: 90 },
    channelCompatibility: { whatsapp: 90, email: 80, call: 0 }
  },
  {
    category: 'money',
    emojis: ['💰', '💵', '💎', '🤑', '💲', '🏦'],
    usage: 'Falar sobre dinheiro e investimento',
    discCompatibility: { D: 85, I: 70, S: 50, C: 75 },
    channelCompatibility: { whatsapp: 85, email: 60, call: 0 }
  },
  {
    category: 'action',
    emojis: ['👉', '▶️', '🎯', '✍️', '📲', '🔗'],
    usage: 'Direcionar para CTAs e próximos passos',
    discCompatibility: { D: 90, I: 85, S: 70, C: 80 },
    channelCompatibility: { whatsapp: 95, email: 75, call: 0 }
  },
  {
    category: 'warning',
    emojis: ['⚠️', '🚫', '❌', '⛔', '🔴', '❗'],
    usage: 'Alertar sobre riscos ou erros',
    discCompatibility: { D: 70, I: 50, S: 60, C: 85 },
    channelCompatibility: { whatsapp: 80, email: 65, call: 0 }
  },
  {
    category: 'love',
    emojis: ['❤️', '💙', '🧡', '💚', '💜', '🥰'],
    usage: 'Conexão emocional e cuidado',
    discCompatibility: { D: 40, I: 95, S: 90, C: 35 },
    channelCompatibility: { whatsapp: 90, email: 50, call: 0 }
  },
  {
    category: 'question',
    emojis: ['❓', '🤔', '💭', '🧐', '❔', '💡'],
    usage: 'Provocar reflexão e engajamento',
    discCompatibility: { D: 65, I: 80, S: 75, C: 90 },
    channelCompatibility: { whatsapp: 85, email: 70, call: 0 }
  }
];

// ============================================
// 5. CHANNEL LIMITS & FORMATTING
// ============================================
export const CHANNEL_LIMITS = {
  whatsapp: { 
    characterLimit: 4096, 
    idealLength: 300,
    supportsFormatting: true,
    supportsEmoji: true,
    formattingGuide: '*negrito* _itálico_ ~riscado~ ```código```'
  },
  sms: { 
    characterLimit: 160, 
    idealLength: 140,
    supportsFormatting: false,
    supportsEmoji: true,
    formattingGuide: 'Apenas texto simples'
  },
  email: { 
    characterLimit: null, 
    idealLength: 500,
    supportsFormatting: true,
    supportsEmoji: true,
    formattingGuide: 'HTML completo'
  },
  instagram: { 
    characterLimit: 2200, 
    idealLength: 400,
    supportsFormatting: false,
    supportsEmoji: true,
    formattingGuide: 'Use quebras de linha e emojis'
  },
  linkedin: { 
    characterLimit: 3000, 
    idealLength: 600,
    supportsFormatting: true,
    supportsEmoji: true,
    formattingGuide: '**negrito** para ênfase'
  }
};

// ============================================
// 6. READABILITY REFERENCE (PT-BR)
// ============================================
export const READABILITY_LEVELS = {
  muito_facil: { min: 80, max: 100, description: 'Muito fácil - Ensino fundamental', color: 'green' },
  facil: { min: 60, max: 79, description: 'Fácil - Público geral', color: 'emerald' },
  medio: { min: 40, max: 59, description: 'Médio - Ensino médio', color: 'yellow' },
  dificil: { min: 20, max: 39, description: 'Difícil - Ensino superior', color: 'orange' },
  muito_dificil: { min: 0, max: 19, description: 'Muito difícil - Especialistas', color: 'red' }
};

// ============================================
// 7. TRIGGER WORDS FOR DETECTION
// ============================================
export const TRIGGER_DETECTION_WORDS = {
  urgency: ['agora', 'hoje', 'última', 'urgente', 'imediato', 'restam', 'acabando', 'limitado'],
  scarcity: ['último', 'restam', 'esgotando', 'vagas limitadas', 'exclusivo', 'único'],
  authority: ['especialista', 'certificado', 'líder', 'referência', 'comprovado', 'científico'],
  socialProof: ['milhares', 'clientes', 'depoimento', 'case', 'resultado', 'transformação'],
  reciprocity: ['grátis', 'bônus', 'presente', 'cortesia', 'brinde', 'exclusivo para você'],
  commitment: ['primeiro passo', 'comece', 'experimente', 'teste', 'sem compromisso'],
  curiosity: ['segredo', 'descubra', 'revelado', 'pouco sabem', 'verdade sobre'],
  fear: ['perder', 'risco', 'cuidado', 'erro', 'evite', 'problema']
};
