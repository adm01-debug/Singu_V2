// ==============================================
// TALK RATIO ANALYZER - DATA
// "Be a good listener. Encourage others to talk about themselves." - Dale Carnegie
// ==============================================

import { TalkRatioRecommendation } from '@/types/carnegie';

// ============================================
// IDEAL RATIOS
// ============================================
export const IDEAL_TALK_RATIOS = {
  discovery: {
    name: 'Descoberta',
    speakerIdeal: 20,
    listenerIdeal: 80,
    description: 'Na fase de descoberta, ouça muito mais do que fala'
  },
  presentation: {
    name: 'Apresentação',
    speakerIdeal: 60,
    listenerIdeal: 40,
    description: 'Durante apresentação, fale mais mas mantenha interatividade'
  },
  negotiation: {
    name: 'Negociação',
    speakerIdeal: 40,
    listenerIdeal: 60,
    description: 'Em negociação, ouça mais para entender objeções'
  },
  relationship: {
    name: 'Relacionamento',
    speakerIdeal: 35,
    listenerIdeal: 65,
    description: 'Para construir relacionamento, deixe o outro falar mais'
  },
  support: {
    name: 'Suporte',
    speakerIdeal: 30,
    listenerIdeal: 70,
    description: 'Em suporte, entenda completamente antes de responder'
  }
};

// ============================================
// QUESTION PATTERNS
// ============================================
export const QUESTION_PATTERNS = {
  openEnded: {
    name: 'Perguntas Abertas',
    description: 'Perguntas que estimulam respostas elaboradas',
    patterns: [
      /^(como|por que|o que|qual|quais|me conte|me fale|me explique)/i,
      /(você poderia|você pode me contar|gostaria de saber)/i,
      /(o que você acha|como você vê|qual sua opinião)/i,
      /(me ajude a entender|poderia elaborar)/i
    ],
    examples: [
      'Como você chegou a essa conclusão?',
      'O que te levou a pensar assim?',
      'Me conte mais sobre isso...',
      'Qual sua visão sobre esse assunto?'
    ],
    weight: 2 // Mais valor para o talk ratio
  },
  
  closed: {
    name: 'Perguntas Fechadas',
    description: 'Perguntas que geram respostas curtas (sim/não)',
    patterns: [
      /^(você|vocês|é|está|foi|será|tem|pode|consegue|quer)/i,
      /\?$/,
      /(certo\?|né\?|correto\?)/i
    ],
    examples: [
      'Você concorda?',
      'Isso faz sentido?',
      'Podemos seguir?'
    ],
    weight: 0.5
  },
  
  reflective: {
    name: 'Perguntas Reflexivas',
    description: 'Perguntas que fazem o outro pensar mais profundamente',
    patterns: [
      /(e se|imagine se|supondo que|caso)/i,
      /(o que significaria|como seria|qual seria)/i,
      /(já pensou|já considerou|já refletiu)/i
    ],
    examples: [
      'E se você pudesse fazer diferente, o que mudaria?',
      'O que isso significaria para você?',
      'Já pensou em como isso te afeta?'
    ],
    weight: 3
  },
  
  clarifying: {
    name: 'Perguntas de Clarificação',
    description: 'Perguntas para entender melhor',
    patterns: [
      /(pode me dar um exemplo|tipo o que|como assim)/i,
      /(o que você quer dizer|em que sentido)/i,
      /(me explica melhor|pode detalhar)/i
    ],
    examples: [
      'Pode me dar um exemplo concreto?',
      'O que você quer dizer com isso?',
      'Em que sentido você está falando?'
    ],
    weight: 2
  }
};

// ============================================
// LISTENING INDICATORS
// ============================================
export const LISTENING_INDICATORS = {
  active: {
    name: 'Escuta Ativa',
    patterns: [
      /(entendo|compreendo|faz sentido|interessante)/i,
      /(você está dizendo que|se entendi bem|deixa eu ver se entendi)/i,
      /(hum|uhum|sei|certo|claro|com certeza)/i,
      /(me conte mais|continue|e então)/i
    ],
    examples: [
      'Interessante, me conte mais...',
      'Entendo o que você está dizendo...',
      'Se eu entendi bem, você está dizendo que...'
    ],
    weight: 2
  },
  
  paraphrasing: {
    name: 'Paráfrase',
    patterns: [
      /(então você|ou seja|em outras palavras)/i,
      /(se entendi corretamente|deixa eu resumir)/i,
      /(o que você está me dizendo é|basicamente)/i
    ],
    examples: [
      'Então você está me dizendo que...',
      'Em outras palavras, o principal desafio é...',
      'Se entendi corretamente, a prioridade é...'
    ],
    weight: 3
  },
  
  empathy: {
    name: 'Empatia',
    patterns: [
      /(imagino como|deve ser difícil|entendo sua frustração)/i,
      /(compreendo a situação|faz todo sentido sentir)/i,
      /(no seu lugar|se eu estivesse)/i
    ],
    examples: [
      'Imagino como isso deve ser desafiador...',
      'Entendo perfeitamente sua preocupação...',
      'Faz todo sentido você se sentir assim...'
    ],
    weight: 3
  },
  
  acknowledgment: {
    name: 'Reconhecimento',
    patterns: [
      /(isso é importante|isso é válido|você tem razão)/i,
      /(bom ponto|boa observação|excelente pergunta)/i,
      /(concordo|faz sentido|é verdade)/i
    ],
    examples: [
      'Isso é um ponto muito válido...',
      'Boa observação, não tinha pensado por esse ângulo...',
      'Você tem razão em se preocupar com isso...'
    ],
    weight: 2
  }
};

// ============================================
// INTERRUPTION INDICATORS
// ============================================
export const INTERRUPTION_INDICATORS = {
  patterns: [
    /(mas|porém|entretanto|no entanto)/i, // Início de frase com objeção
    /(deixa eu|espera|peraí|um momento)/i,
    /(na verdade|na realidade|o que acontece é)/i,
    /\.\.\.\s*(eu|a gente|nós|você)/i // Continua antes do outro terminar
  ],
  
  warning_signs: [
    'Frases começando com "Mas..."',
    'Interjeições antes do outro terminar',
    'Mudanças abruptas de assunto',
    'Respostas antes da pergunta terminar'
  ],
  
  alternatives: [
    {
      instead: 'Interromper para discordar',
      do: 'Espere a pessoa terminar, depois diga: "Interessante. Deixa eu compartilhar uma perspectiva diferente..."'
    },
    {
      instead: 'Completar a frase do outro',
      do: 'Faça uma pausa de 2-3 segundos após a pessoa parar de falar'
    },
    {
      instead: 'Mudar de assunto abruptamente',
      do: 'Use transições: "Isso me lembra de algo relacionado..."'
    }
  ]
};

// ============================================
// TALK RATIO RECOMMENDATIONS
// ============================================
export const TALK_RATIO_RECOMMENDATIONS: TalkRatioRecommendation[] = [
  // Ask More
  {
    type: 'ask_more',
    priority: 'high',
    suggestion: 'Faça mais perguntas abertas para estimular o cliente a falar',
    template: 'Me conte mais sobre [tópico que ele mencionou]... O que você acha que seria o cenário ideal?'
  },
  {
    type: 'ask_more',
    priority: 'medium',
    suggestion: 'Use perguntas de aprofundamento para entender melhor',
    template: 'Interessante. Pode me dar um exemplo concreto de quando isso aconteceu?'
  },
  {
    type: 'ask_more',
    priority: 'low',
    suggestion: 'Inclua perguntas reflexivas para estimular o pensamento',
    template: 'E se você pudesse resolver isso completamente, como seria o resultado ideal?'
  },
  
  // Listen More
  {
    type: 'listen_more',
    priority: 'high',
    suggestion: 'Você está falando muito. Reduza suas respostas e ouça mais',
    template: 'Antes de eu continuar, quero ter certeza que estou no caminho certo. O que você pensa sobre isso?'
  },
  {
    type: 'listen_more',
    priority: 'medium',
    suggestion: 'Faça pausas mais longas após as respostas do cliente',
    template: '[Pausa de 3 segundos] ... Interessante. E o que mais?'
  },
  
  // Reflect More
  {
    type: 'reflect_more',
    priority: 'high',
    suggestion: 'Use mais paráfrases para mostrar que está ouvindo',
    template: 'Deixa eu ver se entendi corretamente: você está dizendo que [paráfrase]. É isso mesmo?'
  },
  {
    type: 'reflect_more',
    priority: 'medium',
    suggestion: 'Resuma periodicamente o que o cliente disse',
    template: 'Então, resumindo os pontos principais: [lista]. Falta alguma coisa importante?'
  },
  
  // Acknowledge More
  {
    type: 'acknowledge_more',
    priority: 'high',
    suggestion: 'Reconheça mais as contribuições do cliente',
    template: 'Esse é um ponto muito válido que você trouxe. Isso muda a forma como devemos abordar...'
  },
  {
    type: 'acknowledge_more',
    priority: 'medium',
    suggestion: 'Valide os sentimentos e preocupações do cliente',
    template: 'Entendo completamente sua preocupação com isso. Faz total sentido...'
  },
  
  // Reduce Interruptions
  {
    type: 'reduce_interruptions',
    priority: 'high',
    suggestion: 'Evite interromper - espere o cliente terminar completamente',
    template: '[Quando tiver vontade de interromper, anote o ponto e espere]'
  },
  {
    type: 'reduce_interruptions',
    priority: 'medium',
    suggestion: 'Substitua "mas" por "e" ou "além disso"',
    template: 'Em vez de "Mas eu acho que...", diga "E além disso, uma perspectiva é..."'
  }
];

// ============================================
// TALK RATIO QUALITY LEVELS
// ============================================
export const TALK_RATIO_QUALITY = {
  excellent: {
    range: { min: 0, max: 20 }, // Deviation from ideal
    label: 'Excelente',
    description: 'Equilíbrio perfeito entre falar e ouvir',
    color: 'text-success',
    emoji: '🎯'
  },
  good: {
    range: { min: 21, max: 35 },
    label: 'Bom',
    description: 'Bom equilíbrio com pequenos ajustes necessários',
    color: 'text-sky-600',
    emoji: '👍'
  },
  needs_improvement: {
    range: { min: 36, max: 50 },
    label: 'Precisa Melhorar',
    description: 'Desequilíbrio notável que afeta a qualidade',
    color: 'text-warning',
    emoji: '⚠️'
  },
  poor: {
    range: { min: 51, max: 100 },
    label: 'Crítico',
    description: 'Desequilíbrio significativo prejudicando a comunicação',
    color: 'text-destructive',
    emoji: '🚨'
  }
};

// ============================================
// SILENCE VALUE
// ============================================
export const SILENCE_TECHNIQUES = {
  strategic_pause: {
    name: 'Pausa Estratégica',
    duration: '3-5 segundos',
    when: 'Após uma pergunta importante ou afirmação do cliente',
    effect: 'Encoraja o cliente a elaborar mais',
    example: 'Faça a pergunta, depois conte mentalmente até 5 antes de falar novamente'
  },
  
  reflective_silence: {
    name: 'Silêncio Reflexivo',
    duration: '5-10 segundos',
    when: 'Quando o cliente está processando uma informação importante',
    effect: 'Demonstra respeito e permite pensamento profundo',
    example: 'Quando o cliente diz "Isso me fez pensar...", espere em silêncio'
  },
  
  expectant_pause: {
    name: 'Pausa de Expectativa',
    duration: '2-3 segundos',
    when: 'Após o cliente terminar de falar',
    effect: 'Mostra que você não vai interromper',
    example: 'Sempre conte até 3 mentalmente antes de responder'
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================
export function getIdealRatio(context: keyof typeof IDEAL_TALK_RATIOS): {
  speakerIdeal: number;
  listenerIdeal: number;
} {
  return {
    speakerIdeal: IDEAL_TALK_RATIOS[context].speakerIdeal,
    listenerIdeal: IDEAL_TALK_RATIOS[context].listenerIdeal
  };
}

export function calculateQuality(deviation: number): keyof typeof TALK_RATIO_QUALITY {
  if (deviation <= 20) return 'excellent';
  if (deviation <= 35) return 'good';
  if (deviation <= 50) return 'needs_improvement';
  return 'poor';
}

export function getRecommendations(
  speakerRatio: number,
  idealRatio: number,
  questionCount: number,
  acknowledgmentCount: number
): TalkRatioRecommendation[] {
  const recommendations: TalkRatioRecommendation[] = [];
  
  // Falando demais
  if (speakerRatio > idealRatio + 15) {
    recommendations.push(
      TALK_RATIO_RECOMMENDATIONS.find(r => r.type === 'listen_more' && r.priority === 'high')!,
      TALK_RATIO_RECOMMENDATIONS.find(r => r.type === 'ask_more' && r.priority === 'high')!
    );
  }
  
  // Poucas perguntas
  if (questionCount < 3) {
    recommendations.push(
      TALK_RATIO_RECOMMENDATIONS.find(r => r.type === 'ask_more' && r.priority === 'high')!
    );
  }
  
  // Poucos reconhecimentos
  if (acknowledgmentCount < 2) {
    recommendations.push(
      TALK_RATIO_RECOMMENDATIONS.find(r => r.type === 'acknowledge_more' && r.priority === 'high')!
    );
  }
  
  return recommendations.filter(Boolean);
}
