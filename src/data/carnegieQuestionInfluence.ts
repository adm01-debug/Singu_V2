// ==============================================
// QUESTION-BASED INFLUENCE - DATA
// "Ask questions instead of giving direct orders" - Dale Carnegie
// ==============================================

import { QuestionInfluence } from '@/types/carnegie-extended';

// ============================================
// ORDER TO QUESTION CONVERSIONS
// ============================================
export const ORDER_TO_QUESTION: QuestionInfluence[] = [
  // ============================================
  // DIRECTION / ACTION
  // ============================================
  {
    id: 'q_action_1',
    directOrder: 'Faça isso agora',
    questionAlternative: 'Você poderia cuidar disso agora?',
    effect: 'Preserva autonomia enquanto comunica urgência',
    category: 'suggestion'
  },
  {
    id: 'q_action_2',
    directOrder: 'Você precisa mudar isso',
    questionAlternative: 'O que você acha de considerarmos uma abordagem diferente?',
    effect: 'Abre diálogo em vez de impor mudança',
    category: 'exploration'
  },
  {
    id: 'q_action_3',
    directOrder: 'Implemente essa solução',
    questionAlternative: 'Essa solução faz sentido para o seu contexto?',
    effect: 'Dá ao outro a sensação de escolha',
    category: 'commitment'
  },
  {
    id: 'q_action_4',
    directOrder: 'Assine o contrato',
    questionAlternative: 'Você gostaria de formalizar isso para começarmos?',
    effect: 'Transforma ordem em convite',
    category: 'commitment'
  },
  
  // ============================================
  // CORRECTION / FEEDBACK
  // ============================================
  {
    id: 'q_feedback_1',
    directOrder: 'Isso está errado',
    questionAlternative: 'Você já considerou essa outra perspectiva?',
    effect: 'Corrige sem criticar diretamente',
    category: 'exploration'
  },
  {
    id: 'q_feedback_2',
    directOrder: 'Você não deveria ter feito assim',
    questionAlternative: 'O que você acha que poderíamos ter feito diferente?',
    effect: 'Promove autorreflexão',
    category: 'reflection'
  },
  {
    id: 'q_feedback_3',
    directOrder: 'Mude sua abordagem',
    questionAlternative: 'Como você vê o impacto da sua abordagem atual?',
    effect: 'Leva a pessoa a avaliar por si mesma',
    category: 'reflection'
  },
  
  // ============================================
  // PERSUASION / INFLUENCE
  // ============================================
  {
    id: 'q_persuasion_1',
    directOrder: 'Você deveria aceitar isso',
    questionAlternative: 'Quais seriam os benefícios para você se seguíssemos esse caminho?',
    effect: 'Faz o outro articular os benefícios',
    category: 'discovery'
  },
  {
    id: 'q_persuasion_2',
    directOrder: 'Essa é a melhor opção',
    questionAlternative: 'Das opções disponíveis, qual você sente que melhor atende suas necessidades?',
    effect: 'Transfere ownership da escolha',
    category: 'commitment'
  },
  {
    id: 'q_persuasion_3',
    directOrder: 'Confie em mim',
    questionAlternative: 'O que te faria sentir mais seguro sobre isso?',
    effect: 'Entende e endereça objeções reais',
    category: 'discovery'
  },
  
  // ============================================
  // PROBLEM SOLVING
  // ============================================
  {
    id: 'q_problem_1',
    directOrder: 'O problema é esse',
    questionAlternative: 'Na sua visão, qual é o principal desafio aqui?',
    effect: 'Engaja o outro no diagnóstico',
    category: 'discovery'
  },
  {
    id: 'q_problem_2',
    directOrder: 'A solução é essa',
    questionAlternative: 'Que tipo de solução você imagina funcionando aqui?',
    effect: 'Faz o outro co-criar a solução',
    category: 'exploration'
  },
  {
    id: 'q_problem_3',
    directOrder: 'Siga esse processo',
    questionAlternative: 'Como você estruturaria isso para funcionar na sua realidade?',
    effect: 'Adapta à realidade do outro',
    category: 'suggestion'
  },
  
  // ============================================
  // COMMITMENT / NEXT STEPS
  // ============================================
  {
    id: 'q_commit_1',
    directOrder: 'Faça o follow-up',
    questionAlternative: 'Qual seria um bom momento para conversarmos novamente?',
    effect: 'Dá controle sobre timing',
    category: 'commitment'
  },
  {
    id: 'q_commit_2',
    directOrder: 'Decida logo',
    questionAlternative: 'O que você precisaria para se sentir confortável decidindo?',
    effect: 'Entende barreiras sem pressionar',
    category: 'discovery'
  },
  {
    id: 'q_commit_3',
    directOrder: 'Comece imediatamente',
    questionAlternative: 'Quando seria o melhor momento para começarmos?',
    effect: 'Respeita ritmo do outro',
    category: 'commitment'
  }
];

// ============================================
// QUESTION TYPES & PURPOSES
// ============================================
export const QUESTION_TYPES = {
  suggestion: {
    name: 'Perguntas de Sugestão',
    description: 'Sugerem uma ação de forma que preserve escolha',
    patterns: [
      'Você poderia...?',
      'O que você acha de...?',
      'Seria possível...?',
      'Você consideraria...?'
    ],
    effect: 'Preserva autonomia enquanto direciona'
  },
  
  exploration: {
    name: 'Perguntas de Exploração',
    description: 'Abrem novas perspectivas sem impor',
    patterns: [
      'Você já pensou em...?',
      'E se...?',
      'Como seria se...?',
      'Que tal...?'
    ],
    effect: 'Expande pensamento sem ameaçar posição atual'
  },
  
  reflection: {
    name: 'Perguntas de Reflexão',
    description: 'Levam a pessoa a avaliar por si mesma',
    patterns: [
      'Como você vê...?',
      'O que você acha que...?',
      'Qual o impacto de...?',
      'Como isso afeta...?'
    ],
    effect: 'Promove autoanálise e descoberta'
  },
  
  commitment: {
    name: 'Perguntas de Compromisso',
    description: 'Conduzem ao próximo passo de forma suave',
    patterns: [
      'Quando poderíamos...?',
      'Você gostaria de...?',
      'Faz sentido...?',
      'Podemos...?'
    ],
    effect: 'Cria compromisso sem pressão'
  },
  
  discovery: {
    name: 'Perguntas de Descoberta',
    description: 'Revelam necessidades e motivações ocultas',
    patterns: [
      'O que te levou a...?',
      'O que seria importante para você...?',
      'O que te faria...?',
      'O que você espera de...?'
    ],
    effect: 'Entende profundamente o outro'
  }
};

// ============================================
// ORDER DETECTION PATTERNS
// ============================================
export const ORDER_PATTERNS = [
  /você (precisa|tem que|deve)/i,
  /faça/i,
  /(implemente|execute|realize)/i,
  /(mude|altere|modifique)/i,
  /(assine|confirme|finalize)/i,
  /é (necessário|obrigatório|preciso)/i,
  /(comece|inicie|termine)/i
];

// ============================================
// QUESTION SOFTENERS BY DISC
// ============================================
export const QUESTION_BY_DISC: Record<'D' | 'I' | 'S' | 'C', {
  style: string;
  patterns: string[];
  avoid: string[];
}> = {
  D: {
    style: 'Direto mas preservando autonomia',
    patterns: [
      'Qual sua decisão sobre...?',
      'Faz sentido seguir com...?',
      'Você está pronto para...?'
    ],
    avoid: ['Perguntas muito longas', 'Hesitação excessiva', 'Muitas opções']
  },
  I: {
    style: 'Entusiasmado e colaborativo',
    patterns: [
      'O que você acha disso?!',
      'Não seria incrível se...?',
      'Vamos fazer isso juntos?'
    ],
    avoid: ['Perguntas secas', 'Tom formal demais', 'Foco só em dados']
  },
  S: {
    style: 'Gentil e sem pressão',
    patterns: [
      'Quando você se sentir confortável...?',
      'O que seria melhor para você...?',
      'Podemos ver isso juntos...?'
    ],
    avoid: ['Pressão por decisão', 'Urgência forçada', 'Mudanças abruptas']
  },
  C: {
    style: 'Lógico e fundamentado',
    patterns: [
      'Baseado nos dados, você concorda que...?',
      'Faz sentido do ponto de vista de...?',
      'Os números indicam que... concorda?'
    ],
    avoid: ['Apelos emocionais', 'Falta de fundamento', 'Generalidades']
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================
export function detectOrders(text: string): string[] {
  const orders: string[] = [];
  
  for (const pattern of ORDER_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      orders.push(match[0]);
    }
  }
  
  return orders;
}

export function countQuestionsVsOrders(text: string): { questions: number; orders: number; ratio: number } {
  const questions = (text.match(/\?/g) || []).length;
  const orders = detectOrders(text).length;
  
  const ratio = orders === 0 ? 100 : Math.round((questions / (questions + orders)) * 100);
  
  return { questions, orders, ratio };
}

export function getQuestionAlternative(order: string): QuestionInfluence | undefined {
  const orderLower = order.toLowerCase();
  
  return ORDER_TO_QUESTION.find(q => 
    orderLower.includes(q.directOrder.toLowerCase().split(' ')[0])
  );
}

export function suggestQuestions(text: string, discProfile: 'D' | 'I' | 'S' | 'C'): string[] {
  const orders = detectOrders(text);
  const suggestions: string[] = [];
  
  for (const order of orders.slice(0, 3)) {
    const alternative = getQuestionAlternative(order);
    if (alternative) {
      suggestions.push(alternative.questionAlternative);
    }
  }
  
  // Add DISC-specific patterns if not enough
  if (suggestions.length < 3) {
    suggestions.push(...QUESTION_BY_DISC[discProfile].patterns.slice(0, 3 - suggestions.length));
  }
  
  return suggestions;
}

export function analyzeQuestionInfluence(text: string): {
  score: number;
  ordersFound: string[];
  suggestedAlternatives: QuestionInfluence[];
} {
  const ordersFound = detectOrders(text);
  const { ratio } = countQuestionsVsOrders(text);
  
  const suggestedAlternatives = ordersFound
    .map(order => getQuestionAlternative(order))
    .filter(Boolean) as QuestionInfluence[];
  
  return {
    score: ratio,
    ordersFound,
    suggestedAlternatives
  };
}
