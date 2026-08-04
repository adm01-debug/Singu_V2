// ==============================================
// ENCOURAGEMENT SYSTEM - DATA
// "Use encouragement. Make the fault seem easy to correct" - Dale Carnegie
// ==============================================

import { EncouragementTemplate } from '@/types/carnegie-extended';

// ============================================
// ENCOURAGEMENT TEMPLATES
// ============================================
export const ENCOURAGEMENT_TEMPLATES: EncouragementTemplate[] = [
  // ============================================
  // LEARNING / SKILL DEVELOPMENT
  // ============================================
  {
    id: 'encourage_learning_1',
    context: 'Quando o cliente está aprendendo algo novo',
    minimizePhrase: 'Isso é mais simples do que parece...',
    encouragePhrase: 'Você está pegando rápido! A maioria leva mais tempo.',
    confidencePhrase: 'Com sua capacidade, vai dominar isso em pouco tempo.',
    fullScript: `Isso é mais simples do que parece - você já entendeu o conceito principal!

Você está pegando rápido! A maioria das pessoas leva muito mais tempo para chegar onde você já está.

Com sua capacidade de aprendizado, vai dominar isso completamente em muito pouco tempo. Estou impressionado.`,
    discVariation: {
      D: 'Você já entendeu o essencial. O resto é repetição. Vai dominar em tempo recorde.',
      I: 'Você está arrasando! Eu sabia que você ia pegar rápido! Continue assim!',
      S: 'Você está indo muito bem, no seu ritmo. Cada passo conta, e você está evoluindo.',
      C: 'Sua curva de aprendizado está acima da média. Os detalhes vão se encaixar naturalmente.'
    }
  },
  {
    id: 'encourage_learning_2',
    context: 'Quando o cliente cometeu um erro durante aprendizado',
    minimizePhrase: 'Esse erro é super comum no início...',
    encouragePhrase: 'O importante é que você percebeu - isso mostra atenção.',
    confidencePhrase: 'Agora que você viu, não vai cometer de novo.',
    fullScript: `Esse erro? É super comum no início. Praticamente todo mundo passa por isso.

O importante é que você percebeu sozinho - isso mostra que você está prestando atenção e aprendendo ativamente.

Agora que você viu como funciona, não vai cometer de novo. Isso é progresso real.`,
    discVariation: {
      D: 'Erro identificado e corrigido. Próximo!',
      I: 'Relaxa! Todo mundo erra no começo. Você já aprendeu e vai arrasar daqui pra frente!',
      S: 'Não se preocupe com isso. Faz parte do processo. Você está fazendo muito bem.',
      C: 'Esse é um erro estatisticamente comum. Agora você tem o dado para evitar.'
    }
  },
  
  // ============================================
  // DECISION MAKING
  // ============================================
  {
    id: 'encourage_decision_1',
    context: 'Quando o cliente hesita em tomar uma decisão',
    minimizePhrase: 'Essa decisão não é tão arriscada quanto parece...',
    encouragePhrase: 'Você tem todas as informações que precisa.',
    confidencePhrase: 'Sua intuição está certa - confie nela.',
    fullScript: `Essa decisão pode parecer grande, mas não é tão arriscada quanto parece. Você já fez análise suficiente.

Você tem todas as informações que precisa para decidir com segurança.

Sua intuição está te apontando uma direção - e geralmente nossa intuição sabe o que fazer. Confie nela.`,
    discVariation: {
      D: 'Você já sabe a resposta. É hora de agir.',
      I: 'Vai com tudo! Você já sabe o que quer. Vai ser incrível!',
      S: 'Tome seu tempo, mas saiba: você está pronto para isso.',
      C: 'Os dados suportam sua inclinação. É uma decisão fundamentada.'
    }
  },
  
  // ============================================
  // OVERCOMING CHALLENGES
  // ============================================
  {
    id: 'encourage_challenge_1',
    context: 'Quando o cliente enfrenta um desafio',
    minimizePhrase: 'Esse desafio é menor do que parece...',
    encouragePhrase: 'Você já superou coisas mais difíceis.',
    confidencePhrase: 'Dessa vez não vai ser diferente - você vai conseguir.',
    fullScript: `Esse desafio parece grande agora, mas é menor do que parece quando você olha de perto.

Você já superou coisas mais difíceis na sua trajetória - lembra de [exemplo]?

Dessa vez não vai ser diferente. Você tem a experiência, a capacidade e a determinação. Vai conseguir.`,
    discVariation: {
      D: 'Você já venceu coisas piores. Isso é só mais um obstáculo para derrubar.',
      I: 'Ei, você já passou por tanta coisa! Essa vai ser só mais uma história de sucesso.',
      S: 'Passo a passo, você vai superar. Não está sozinho nisso.',
      C: 'Analise como você resolveu desafios similares antes. O método funciona.'
    }
  },
  
  // ============================================
  // STARTING SOMETHING NEW
  // ============================================
  {
    id: 'encourage_start_1',
    context: 'Quando o cliente está começando algo novo',
    minimizePhrase: 'Começar é a parte mais fácil...',
    encouragePhrase: 'O primeiro passo é o mais importante, e você já deu.',
    confidencePhrase: 'A partir daqui, é só momentum.',
    fullScript: `Começar algo novo parece assustador, mas na prática é mais fácil do que imaginamos.

O primeiro passo é o mais importante - e você já deu. Isso é coragem.

A partir daqui, é momentum. Cada pequena ação vai te levar mais perto. E antes que perceba, vai olhar para trás impressionado com o quanto avançou.`,
    discVariation: {
      D: 'Você começou. Agora é executar. Resultados vêm rápido para quem age.',
      I: 'Que emocionante! Novos começos são os melhores! Você vai amar essa jornada!',
      S: 'Um passo de cada vez. Você não precisa resolver tudo agora.',
      C: 'O plano está traçado. Execução sistemática traz resultados previsíveis.'
    }
  },
  
  // ============================================
  // AFTER SETBACK
  // ============================================
  {
    id: 'encourage_setback_1',
    context: 'Quando o cliente teve um revés',
    minimizePhrase: 'Isso é um obstáculo, não um fim...',
    encouragePhrase: 'Você vai sair mais forte dessa.',
    confidencePhrase: 'Já vi você superar - e vou ver de novo.',
    fullScript: `Sei que esse momento é difícil. Mas isso é um obstáculo, não um fim.

Os melhores profissionais que conheço têm histórias de reveses que os fizeram mais fortes. Você vai sair mais forte dessa também.

Já vi você superar desafios antes - e vou ver de novo. Isso é temporário.`,
    discVariation: {
      D: 'Revés temporário. Ajuste o plano e ataque de novo.',
      I: 'Ei, todo sucesso tem uma história de superação por trás. Essa é a sua!',
      S: 'Está tudo bem sentir isso. Mas você não está sozinho, e vai passar.',
      C: 'Analise o que aconteceu, ajuste as variáveis, e reexecute. É método.'
    }
  },
  
  // ============================================
  // SELF-DOUBT
  // ============================================
  {
    id: 'encourage_doubt_1',
    context: 'Quando o cliente duvida de si mesmo',
    minimizePhrase: 'Todo mundo passa por momentos de dúvida...',
    encouragePhrase: 'Olha para trás e veja o que você já conquistou.',
    confidencePhrase: 'Você é mais capaz do que imagina.',
    fullScript: `Todo mundo passa por momentos de dúvida - até os mais bem-sucedidos. É humano.

Mas olha para trás e veja o que você já conquistou. Chegou até aqui por uma razão.

Você é mais capaz do que imagina. Eu vejo isso. E em breve você vai ver também.`,
    discVariation: {
      D: 'Sua trajetória fala por si. Os resultados provam sua capacidade.',
      I: 'Você é incrível! Sério! Todo mundo que te conhece sabe disso!',
      S: 'As pessoas ao seu redor acreditam em você. E eu também.',
      C: 'Os dados da sua performance contradizem a dúvida. Foque nos fatos.'
    }
  }
];

// ============================================
// MINIMIZATION PHRASES
// ============================================
export const MINIMIZATION_PHRASES = {
  difficulty: [
    'Não é tão difícil quanto parece',
    'Isso é mais simples do que você imagina',
    'A curva de aprendizado é menor do que você pensa',
    'Muitos já fizeram isso antes de você'
  ],
  
  mistakes: [
    'Esse erro é super comum',
    'Isso acontece com todo mundo',
    'É uma coisa pequena, fácil de corrigir',
    'Não é nada que não possa ser resolvido'
  ],
  
  challenges: [
    'Isso é só um obstáculo temporário',
    'Você já enfrentou coisas piores',
    'É menor do que parece',
    'Daqui a pouco você nem vai lembrar disso'
  ]
};

// ============================================
// CONFIDENCE BOOSTERS
// ============================================
export const CONFIDENCE_BOOSTERS = {
  past_success: [
    'Você já fez isso antes',
    'Lembra quando você [conquista]? Isso é igual',
    'Sua trajetória prova que você consegue',
    'Olha para trás - você sempre supera'
  ],
  
  inherent_ability: [
    'Você tem talento natural para isso',
    'Essa é uma das suas forças',
    'Você é mais capaz do que imagina',
    'Poucas pessoas têm sua habilidade nisso'
  ],
  
  future_success: [
    'Vai dar certo, tenho certeza',
    'Já estou vendo você celebrando essa vitória',
    'Daqui a pouco você vai olhar para trás e rir',
    'Esse vai ser só mais um sucesso na sua lista'
  ]
};

// ============================================
// DISCOURAGMENT DETECTION
// ============================================
export const DISCOURAGEMENT_PATTERNS = [
  /isso é (muito )?difícil/i,
  /você não (vai )?consegue/i,
  /é complicado/i,
  /talvez não seja para você/i,
  /poucas pessoas conseguem/i,
  /é arriscado/i,
  /cuidado com/i,
  /não é fácil/i
];

// ============================================
// HELPER FUNCTIONS
// ============================================
export function getEncouragementForContext(context: string): EncouragementTemplate | undefined {
  const contextLower = context.toLowerCase();
  
  if (contextLower.includes('aprend') || contextLower.includes('novo')) {
    return ENCOURAGEMENT_TEMPLATES.find(t => t.context.includes('aprendendo'));
  }
  if (contextLower.includes('decis') || contextLower.includes('escolh')) {
    return ENCOURAGEMENT_TEMPLATES.find(t => t.context.includes('decisão'));
  }
  if (contextLower.includes('desafi') || contextLower.includes('difícil')) {
    return ENCOURAGEMENT_TEMPLATES.find(t => t.context.includes('desafio'));
  }
  if (contextLower.includes('dúvid') || contextLower.includes('insegur')) {
    return ENCOURAGEMENT_TEMPLATES.find(t => t.context.includes('duvida'));
  }
  if (contextLower.includes('erro') || contextLower.includes('falh')) {
    return ENCOURAGEMENT_TEMPLATES.find(t => t.context.includes('revés'));
  }
  
  return ENCOURAGEMENT_TEMPLATES[0]; // Default
}

export function detectDiscouragement(text: string): string[] {
  const detected: string[] = [];
  
  for (const pattern of DISCOURAGEMENT_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      detected.push(match[0]);
    }
  }
  
  return detected;
}

export function generateEncouragementScript(
  discProfile: 'D' | 'I' | 'S' | 'C',
  context: string
): string {
  const template = getEncouragementForContext(context);
  if (!template) return '';
  
  return template.discVariation[discProfile];
}

export function calculateEncouragementScore(text: string): number {
  let score = 50; // Start neutral
  const textLower = text.toLowerCase();
  
  // Check for minimization (positive) - use fuzzy matching with key words
  for (const phrases of Object.values(MINIMIZATION_PHRASES)) {
    for (const phrase of phrases) {
      const phraseLower = phrase.toLowerCase();
      // Direct match
      if (textLower.includes(phraseLower)) {
        score += 15;
        continue;
      }
      // Fuzzy match: extract key words (3+ chars) and check if most are present
      const keyWords = phraseLower.split(/\s+/).filter(w => w.length >= 3 && !['que', 'com', 'para', 'uma', 'dos', 'das', 'não', 'tão'].includes(w));
      if (keyWords.length >= 2) {
        const matchCount = keyWords.filter(w => textLower.includes(w)).length;
        if (matchCount >= Math.ceil(keyWords.length * 0.6)) {
          score += 10; // Partial match gets slightly less
        }
      }
    }
  }
  
  // Check for confidence boosters (positive) - improved matching
  for (const phrases of Object.values(CONFIDENCE_BOOSTERS)) {
    for (const phrase of phrases) {
      const cleanPhrase = phrase.toLowerCase().split('[')[0].trim();
      if (textLower.includes(cleanPhrase)) {
        score += 10;
        continue;
      }
      // Fuzzy match for boosters too
      const keyWords = cleanPhrase.split(/\s+/).filter(w => w.length >= 3 && !['que', 'com', 'para', 'uma'].includes(w));
      if (keyWords.length >= 2) {
        const matchCount = keyWords.filter(w => textLower.includes(w)).length;
        if (matchCount >= Math.ceil(keyWords.length * 0.6)) {
          score += 7;
        }
      }
    }
  }
  
  // Check for discouragement (negative)
  const discouragement = detectDiscouragement(text);
  score -= discouragement.length * 20;
  
  return Math.min(100, Math.max(0, score));
}
