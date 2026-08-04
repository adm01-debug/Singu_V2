// ==============================================
// STORYTELLING FRAMEWORK - DATA
// "Dramatize your ideas" - Dale Carnegie
// ==============================================

import { StoryTemplate, StoryType } from '@/types/carnegie-extended';

// ============================================
// STORY TEMPLATES
// ============================================
export const STORY_TEMPLATES: StoryTemplate[] = [
  // ============================================
  // HERO JOURNEY
  // ============================================
  {
    id: 'story_hero_1',
    type: 'hero_journey',
    name: 'A Jornada do Herói',
    structure: {
      hook: 'Era exatamente essa a situação do [cliente/persona]...',
      conflict: 'Eles estavam enfrentando [problema], e parecia impossível resolver.',
      journey: 'Então, eles decidiram [ação]. No início foi difícil, mas...',
      resolution: 'Depois de [tempo], o resultado foi [conquista específica].',
      lesson: 'O que aprendi com eles é que [lição aplicável].'
    },
    example: `Deixa eu te contar sobre a Maria, diretora de uma empresa do seu setor...

Ela estava exatamente onde você está agora - perdendo sono com [problema]. A equipe dela estava desmotivada, os números caindo.

Então ela tomou uma decisão: implementar [solução]. No começo, a equipe resistiu. Mas Maria persistiu.

Três meses depois? Faturamento 40% maior e equipe mais engajada do que nunca.

O que aprendi com a Maria é que às vezes a decisão mais difícil é a mais necessária.`,
    whenToUse: [
      'Para inspirar ação',
      'Para mostrar transformação possível',
      'Com clientes hesitantes'
    ],
    emotionalArc: 'Identificação → Tensão → Esperança → Inspiração'
  },
  
  // ============================================
  // BEFORE/AFTER
  // ============================================
  {
    id: 'story_before_after',
    type: 'before_after',
    name: 'Antes e Depois',
    structure: {
      hook: 'Imagine a diferença entre esses dois cenários...',
      conflict: 'ANTES: [descrição vívida do problema]',
      journey: 'O que mudou foi [transformação]',
      resolution: 'DEPOIS: [descrição vívida do resultado]',
      lesson: 'A diferença não foi sorte - foi [decisão/ação].'
    },
    example: `Vou te mostrar dois cenários...

ANTES: Segunda-feira, 7h da manhã. Você acorda já pensando nos problemas. A pilha de e-mails não lidos. A reunião que você não preparou. O estresse que não sai.

DEPOIS: Segunda-feira, 7h da manhã. Você acorda tranquilo. O sistema rodou durante o fim de semana. Os relatórios estão prontos. Você tem tempo para pensar estratégicamente.

A diferença? Uma decisão. A mesma que você está considerando agora.`,
    whenToUse: [
      'Para contrastar status quo vs. futuro',
      'Para tornar benefícios tangíveis',
      'Com clientes visuais'
    ],
    emotionalArc: 'Desconforto → Contraste → Desejo → Ação'
  },
  
  // ============================================
  // PROBLEM-SOLUTION
  // ============================================
  {
    id: 'story_problem_solution',
    type: 'problem_solution',
    name: 'Problema e Solução',
    structure: {
      hook: 'Você conhece aquele sentimento quando [problema comum]?',
      conflict: 'O desafio é que [obstáculo real].',
      journey: 'O que descobrimos é que a raiz do problema é [causa raiz].',
      resolution: 'A solução? [solução específica] que resolve isso de forma [adjetivo].',
      lesson: 'E o melhor: [benefício adicional inesperado].'
    },
    example: `Você conhece aquele sentimento quando você fecha o mês e os números não batem?

O desafio é que você está ocupado demais apagando incêndios para ver a origem deles.

O que descobrimos é que 80% dessas inconsistências vêm de processos manuais.

A solução? Automação inteligente que elimina esses erros na fonte.

E o melhor: além da precisão, sua equipe ganha 10 horas por semana para focar no que importa.`,
    whenToUse: [
      'Para apresentar soluções',
      'Com clientes analíticos',
      'Em demonstrações de produto'
    ],
    emotionalArc: 'Reconhecimento → Frustração → Clareza → Alívio'
  },
  
  // ============================================
  // TESTIMONIAL
  // ============================================
  {
    id: 'story_testimonial',
    type: 'testimonial',
    name: 'Depoimento Real',
    structure: {
      hook: 'Ontem recebi uma mensagem de um cliente que me emocionou...',
      conflict: 'Ele disse: "[citação sobre o problema]"',
      journey: 'Trabalhamos juntos por [período] e [processo].',
      resolution: 'A mensagem dele foi: "[citação sobre resultado]"',
      lesson: 'Isso me lembrou por que fazemos o que fazemos.'
    },
    example: `Ontem recebi uma mensagem que me emocionou...

O Carlos me escreveu: "Lembra quando eu estava quase desistindo? Você acreditou em mim quando eu mesmo não acreditava."

Trabalhamos juntos por 6 meses. Houve momentos difíceis, dúvidas, ajustes.

A mensagem continuava: "Hoje bati minha maior meta. Minha família está orgulhosa. Obrigado."

Isso me lembrou por que fazemos o que fazemos - não é sobre números, é sobre transformar vidas.`,
    whenToUse: [
      'Para prova social',
      'Para criar conexão emocional',
      'Com clientes indecisos'
    ],
    emotionalArc: 'Curiosidade → Conexão → Emoção → Confiança'
  },
  
  // ============================================
  // ANALOGY
  // ============================================
  {
    id: 'story_analogy',
    type: 'analogy',
    name: 'Analogia Poderosa',
    structure: {
      hook: 'Deixa eu fazer uma comparação...',
      conflict: 'É como quando [situação familiar].',
      journey: 'Você não [ação óbvia errada], certo?',
      resolution: 'Da mesma forma, aqui você [ação correta análoga].',
      lesson: 'Faz sentido?'
    },
    example: `Deixa eu fazer uma comparação...

Investir no seu time sem as ferramentas certas é como tentar construir uma casa com as mãos.

Você pode até conseguir - mas vai demorar 10x mais e o resultado não será o mesmo.

Da mesma forma, quando você dá à equipe as ferramentas certas, a mesma energia produz resultados extraordinários.

Faz sentido?`,
    whenToUse: [
      'Para simplificar conceitos complexos',
      'Para criar "aha moments"',
      'Com qualquer perfil'
    ],
    emotionalArc: 'Atenção → Reconhecimento → Clareza → Concordância'
  },
  
  // ============================================
  // CONTRAST
  // ============================================
  {
    id: 'story_contrast',
    type: 'contrast',
    name: 'O Contraste',
    structure: {
      hook: 'Existem dois tipos de [categoria]...',
      conflict: 'O primeiro [descrição negativa].',
      journey: 'O segundo [descrição positiva].',
      resolution: 'A diferença está em [fator chave].',
      lesson: 'Qual você quer ser?'
    },
    example: `Existem dois tipos de líderes nessa situação...

O primeiro espera o problema explodir para agir. Trabalha apagando incêndios, sempre correndo atrás, sempre estressado.

O segundo se antecipa. Implementa sistemas que previnem problemas. Dorme tranquilo sabendo que está protegido.

A diferença? Não é talento ou sorte. É uma decisão.

Qual você quer ser?`,
    whenToUse: [
      'Para polarizar opções',
      'Para criar urgência',
      'Com perfis D (que gostam de ganhar)'
    ],
    emotionalArc: 'Comparação → Identificação → Escolha → Decisão'
  },
  
  // ============================================
  // VISION
  // ============================================
  {
    id: 'story_vision',
    type: 'vision',
    name: 'A Visão do Futuro',
    structure: {
      hook: 'Fecha os olhos e imagina...',
      conflict: 'É daqui a [tempo]. Você acordou e [cenário ideal].',
      journey: 'Suas preocupações com [problema atual] simplesmente não existem mais.',
      resolution: 'Você finalmente tem [desejo realizado].',
      lesson: 'Esse futuro começa com uma decisão hoje.'
    },
    example: `Fecha os olhos por um segundo e imagina...

É daqui a 6 meses. Você acordou e pela primeira vez em muito tempo, não pensou em [problema].

Suas preocupações com [desafio atual] simplesmente não existem mais. O sistema cuida disso.

Você finalmente tem tempo para pensar estratégicamente, para estar presente com sua família, para liderar de verdade.

Esse futuro? Ele começa com uma decisão. A decisão que você está considerando agora.`,
    whenToUse: [
      'Para pintar o futuro desejado',
      'Com clientes emocionais (I/S)',
      'No fechamento'
    ],
    emotionalArc: 'Imaginação → Desejo → Esperança → Ação'
  }
];

// ============================================
// STORYTELLING ELEMENTS
// ============================================
export const STORY_ELEMENTS = {
  hooks: [
    'Deixa eu te contar uma história...',
    'Isso me lembra de um cliente...',
    'Vou te mostrar algo interessante...',
    'Sabe o que aconteceu semana passada?',
    'Imagina a seguinte situação...'
  ],
  
  transitions: [
    'Mas então algo mudou...',
    'E foi aí que tudo mudou...',
    'O ponto de virada foi...',
    'O que ninguém esperava foi...',
    'Mas aqui está o interessante...'
  ],
  
  emotionalWords: [
    'incrível', 'assustador', 'emocionante', 'frustrante', 'libertador',
    'surpreendente', 'devastador', 'inspirador', 'doloroso', 'gratificante'
  ],
  
  sensoryDetails: [
    'Imagine acordar e...',
    'Você pode ver...',
    'Sente aquele alívio de...',
    'Ouve o feedback positivo...',
    'Toca nos resultados...'
  ],
  
  closings: [
    'E essa é a história de como...',
    'O resto, como dizem, é história.',
    'E isso, meu amigo, é apenas o começo.',
    'Seu próximo capítulo começa agora.',
    'Essa história pode ser a sua também.'
  ]
};

// ============================================
// STORY BY DISC
// ============================================
export const STORY_BY_DISC: Record<'D' | 'I' | 'S' | 'C', {
  preferredTypes: StoryType[];
  style: string;
  length: 'short' | 'medium' | 'long';
  focus: string;
}> = {
  D: {
    preferredTypes: ['contrast', 'before_after', 'problem_solution'],
    style: 'Direto, focado em resultados, com números',
    length: 'short',
    focus: 'Resultado final, tempo economizado, competição vencida'
  },
  I: {
    preferredTypes: ['hero_journey', 'testimonial', 'vision'],
    style: 'Emocional, com personagens, inspirador',
    length: 'long',
    focus: 'Pessoas, emoções, reconhecimento, experiência'
  },
  S: {
    preferredTypes: ['testimonial', 'hero_journey', 'vision'],
    style: 'Caloroso, focado em pessoas, seguro',
    length: 'medium',
    focus: 'Equipe, família, estabilidade, harmonia'
  },
  C: {
    preferredTypes: ['problem_solution', 'analogy', 'before_after'],
    style: 'Lógico, com dados, estruturado',
    length: 'medium',
    focus: 'Processo, dados, análise, precisão'
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================
export function getStoryTemplateByType(type: StoryType): StoryTemplate | undefined {
  return STORY_TEMPLATES.find(s => s.type === type);
}

export function getStoriesForDISC(discProfile: 'D' | 'I' | 'S' | 'C'): StoryTemplate[] {
  const profile = STORY_BY_DISC[discProfile];
  return profile.preferredTypes.map(type => getStoryTemplateByType(type)).filter(Boolean) as StoryTemplate[];
}

export function analyzeStorytellingInText(text: string): {
  usesStorytelling: boolean;
  elements: string[];
  score: number;
} {
  const elements: string[] = [];
  let score = 0;
  
  // Check for hooks
  for (const hook of STORY_ELEMENTS.hooks) {
    if (text.toLowerCase().includes(hook.toLowerCase().split('...')[0])) {
      elements.push('Hook');
      score += 20;
      break;
    }
  }
  
  // Check for transitions
  for (const transition of STORY_ELEMENTS.transitions) {
    if (text.toLowerCase().includes(transition.toLowerCase().split('...')[0])) {
      elements.push('Transition');
      score += 15;
      break;
    }
  }
  
  // Check for emotional words
  for (const word of STORY_ELEMENTS.emotionalWords) {
    if (text.toLowerCase().includes(word)) {
      elements.push('Emotional Language');
      score += 10;
      break;
    }
  }
  
  // Check for sensory details
  for (const sensory of STORY_ELEMENTS.sensoryDetails) {
    if (text.toLowerCase().includes(sensory.toLowerCase().split('...')[0])) {
      elements.push('Sensory Details');
      score += 15;
      break;
    }
  }
  
  return {
    usesStorytelling: score >= 30,
    elements,
    score: Math.min(100, score)
  };
}

export function generateStoryOutline(
  type: StoryType,
  context: { problem: string; solution: string; result: string }
): string {
  const template = getStoryTemplateByType(type);
  if (!template) return '';
  
  return `
## ${template.name}

**Hook:** ${template.structure.hook}

**Conflict:** ${context.problem}

**Journey:** ${template.structure.journey}

**Resolution:** ${context.result}

**Lesson:** ${template.structure.lesson}
  `.trim();
}
