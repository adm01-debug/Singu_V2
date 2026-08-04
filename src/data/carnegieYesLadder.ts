// ==============================================
// YES-LADDER TECHNIQUE - DATA
// "Get the other person saying 'yes, yes' immediately" - Dale Carnegie
// ==============================================

import { YesLadderTemplate } from '@/types/carnegie-extended';

// ============================================
// YES-LADDER TEMPLATES
// ============================================
export const YES_LADDER_TEMPLATES: YesLadderTemplate[] = [
  // ============================================
  // DISCOVERY / NEEDS ANALYSIS
  // ============================================
  {
    id: 'yes_discovery_1',
    name: 'Ladder de Descoberta',
    context: 'Para confirmar necessidades e dores antes de apresentar solução',
    steps: [
      {
        stepNumber: 1,
        question: 'Você mencionou que [problema específico] é um desafio atual, certo?',
        expectedResponse: 'yes',
        purpose: 'Confirmar problema reconhecido',
        transition: 'E isso afeta [área] também, né?'
      },
      {
        stepNumber: 2,
        question: 'Isso provavelmente impacta [consequência], não é?',
        expectedResponse: 'yes',
        purpose: 'Expandir consciência do impacto',
        transition: 'Então faz sentido que...'
      },
      {
        stepNumber: 3,
        question: 'Resolver isso seria uma prioridade importante para você, correto?',
        expectedResponse: 'yes',
        purpose: 'Confirmar importância',
        transition: 'Entendo. E se houvesse uma forma de...'
      },
      {
        stepNumber: 4,
        question: 'Você estaria aberto a conhecer uma solução que já funcionou para casos similares?',
        expectedResponse: 'yes',
        purpose: 'Abrir para apresentação',
        transition: 'Perfeito! Deixa eu te mostrar...'
      }
    ],
    finalAsk: 'Baseado em tudo isso, faz sentido darmos o próximo passo?',
    discVariation: {
      D: [
        { stepNumber: 1, question: 'Esse problema está custando tempo e dinheiro, certo?', expectedResponse: 'yes', purpose: 'Foco em resultados', transition: 'E precisa ser resolvido rápido, né?' },
        { stepNumber: 2, question: 'Uma solução que funcione imediatamente seria o ideal?', expectedResponse: 'yes', purpose: 'Urgência', transition: 'Então...' }
      ],
      I: [
        { stepNumber: 1, question: 'Isso está sendo frustrante pra você, né?', expectedResponse: 'yes', purpose: 'Validação emocional', transition: 'E você merece coisa melhor!' },
        { stepNumber: 2, question: 'Seria incrível se isso fosse resolvido de forma simples?', expectedResponse: 'yes', purpose: 'Criar entusiasmo', transition: 'Vai adorar isso...' }
      ],
      S: [
        { stepNumber: 1, question: 'Ter mais tranquilidade nessa área seria bom, né?', expectedResponse: 'yes', purpose: 'Segurança', transition: 'E sua equipe também ganharia com isso...' },
        { stepNumber: 2, question: 'Uma transição suave seria importante para você?', expectedResponse: 'yes', purpose: 'Mudança gradual', transition: 'Podemos fazer isso juntos...' }
      ],
      C: [
        { stepNumber: 1, question: 'Os dados mostram que isso é um padrão recorrente, correto?', expectedResponse: 'yes', purpose: 'Base factual', transition: 'E a análise indica que...' },
        { stepNumber: 2, question: 'Uma solução validada com métricas seria o ideal?', expectedResponse: 'yes', purpose: 'Prova de conceito', transition: 'Deixa eu mostrar os números...' }
      ]
    }
  },
  
  // ============================================
  // CLOSING / COMMITMENT
  // ============================================
  {
    id: 'yes_closing_1',
    name: 'Ladder de Fechamento',
    context: 'Para construir momentum antes do pedido de decisão',
    steps: [
      {
        stepNumber: 1,
        question: 'Você concorda que essa solução atende sua necessidade de [necessidade]?',
        expectedResponse: 'yes',
        purpose: 'Confirmar adequação',
        transition: 'Ótimo! E...'
      },
      {
        stepNumber: 2,
        question: 'O investimento está dentro do que você tinha em mente?',
        expectedResponse: 'agreement',
        purpose: 'Validar viabilidade',
        transition: 'Perfeito. E o timing...'
      },
      {
        stepNumber: 3,
        question: 'Seria possível começar nas próximas semanas?',
        expectedResponse: 'yes',
        purpose: 'Confirmar timing',
        transition: 'Excelente! Então...'
      },
      {
        stepNumber: 4,
        question: 'Você é a pessoa que pode tomar essa decisão, certo?',
        expectedResponse: 'yes',
        purpose: 'Confirmar autoridade',
        transition: 'Perfeito!'
      }
    ],
    finalAsk: 'Então podemos formalizar e começar?',
    discVariation: {
      D: [
        { stepNumber: 1, question: 'Resolve o problema?', expectedResponse: 'yes', purpose: 'Direto ao ponto', transition: 'Cabe no budget?' },
        { stepNumber: 2, question: 'Podemos fechar agora?', expectedResponse: 'yes', purpose: 'Decisão rápida', transition: 'Feito!' }
      ],
      I: [
        { stepNumber: 1, question: 'Você ficou animado com a solução?', expectedResponse: 'yes', purpose: 'Engajamento emocional', transition: 'Vai ser incrível!' },
        { stepNumber: 2, question: 'Mal vê a hora de começar?', expectedResponse: 'yes', purpose: 'Entusiasmo', transition: 'Vamos fazer acontecer!' }
      ],
      S: [
        { stepNumber: 1, question: 'Você se sente confortável com essa abordagem?', expectedResponse: 'yes', purpose: 'Conforto', transition: 'E sua equipe também, né?' },
        { stepNumber: 2, question: 'Podemos seguir no seu ritmo?', expectedResponse: 'yes', purpose: 'Respeito ao tempo', transition: 'Claro...' }
      ],
      C: [
        { stepNumber: 1, question: 'Os números fazem sentido para você?', expectedResponse: 'yes', purpose: 'Validação analítica', transition: 'E o ROI esperado...' },
        { stepNumber: 2, question: 'Você tem todas as informações que precisa?', expectedResponse: 'yes', purpose: 'Completude', transition: 'Então...' }
      ]
    }
  },
  
  // ============================================
  // OBJECTION HANDLING
  // ============================================
  {
    id: 'yes_objection_1',
    name: 'Ladder para Objeções',
    context: 'Para reverter objeções construindo acordos progressivos',
    steps: [
      {
        stepNumber: 1,
        question: 'Você concorda que resolver [problema] é importante, né?',
        expectedResponse: 'yes',
        purpose: 'Voltar ao problema central',
        transition: 'E você viu que nossa solução...'
      },
      {
        stepNumber: 2,
        question: 'A solução atende tecnicamente o que você precisa, correto?',
        expectedResponse: 'yes',
        purpose: 'Confirmar fit técnico',
        transition: 'O único ponto é...'
      },
      {
        stepNumber: 3,
        question: 'Se conseguíssemos resolver [objeção], faria sentido seguir?',
        expectedResponse: 'yes',
        purpose: 'Isolar objeção',
        transition: 'Então deixa eu te mostrar como...'
      }
    ],
    finalAsk: 'Com isso resolvido, podemos avançar?',
    discVariation: {
      D: [
        { stepNumber: 1, question: 'O problema ainda existe, certo?', expectedResponse: 'yes', purpose: 'Foco no problema', transition: 'E precisa ser resolvido...' }
      ],
      I: [
        { stepNumber: 1, question: 'Você ainda quer resolver isso, né?', expectedResponse: 'yes', purpose: 'Desejo', transition: 'E juntos vamos conseguir...' }
      ],
      S: [
        { stepNumber: 1, question: 'Ter isso resolvido traria paz, né?', expectedResponse: 'yes', purpose: 'Tranquilidade', transition: 'Vamos encontrar uma forma...' }
      ],
      C: [
        { stepNumber: 1, question: 'Os fundamentos ainda estão válidos?', expectedResponse: 'yes', purpose: 'Base lógica', transition: 'O detalhe é...' }
      ]
    }
  }
];

// ============================================
// UNIVERSAL YES-QUESTIONS
// ============================================
export const UNIVERSAL_YES_QUESTIONS = {
  agreement: [
    'Faz sentido?',
    'Você concorda?',
    'Certo?',
    'Não é mesmo?',
    'Correto?'
  ],
  
  validation: [
    'Isso é importante para você, né?',
    'Você valoriza isso, certo?',
    'Esse é um ponto relevante, não é?'
  ],
  
  confirmation: [
    'Posso continuar?',
    'Isso ajuda a esclarecer?',
    'Estamos alinhados até aqui?'
  ],
  
  commitment: [
    'Você gostaria de saber como resolver?',
    'Seria útil ter uma solução para isso?',
    'Vale a pena explorar opções?'
  ]
};

// ============================================
// YES-MOMENTUM PRINCIPLES
// ============================================
export const YES_MOMENTUM_PRINCIPLES = [
  {
    principle: 'Comece com acordos óbvios',
    explanation: 'As primeiras perguntas devem ter "sim" quase garantido',
    example: 'Você quer aumentar suas vendas, certo?'
  },
  {
    principle: 'Construa progressivamente',
    explanation: 'Cada "sim" torna o próximo mais provável',
    example: 'Após 3-4 "sims", a pessoa está mais aberta'
  },
  {
    principle: 'Use linguagem afirmativa',
    explanation: 'Evite perguntas com "não" ou negativas',
    example: '"Você quer..." em vez de "Você não quer..."'
  },
  {
    principle: 'Faça pausas após cada sim',
    explanation: 'Deixe o acordo se solidificar antes de continuar',
    example: 'Acene, sorria, então prossiga'
  },
  {
    principle: 'Nunca force um "sim"',
    explanation: 'Se sentir resistência, volte a construir',
    example: 'Se houver hesitação, faça pergunta mais fácil'
  }
];

// ============================================
// ANALYSIS HELPERS
// ============================================
export function countYesOpportunities(text: string): number {
  let count = 0;
  
  // Statements that could be questions
  const statementPatterns = [
    /é importante/i, /você quer/i, /seria bom/i, /faz sentido/i,
    /vale a pena/i, /você precisa/i, /você gostaria/i
  ];
  
  for (const pattern of statementPatterns) {
    if (pattern.test(text)) count++;
  }
  
  return count;
}

export function suggestYesQuestions(context: string): string[] {
  const suggestions: string[] = [];
  
  // Based on context, suggest appropriate yes-questions
  if (context.includes('problema') || context.includes('desafio')) {
    suggestions.push('Resolver isso é uma prioridade, certo?');
    suggestions.push('Você quer eliminar esse problema, né?');
  }
  
  if (context.includes('resultado') || context.includes('meta')) {
    suggestions.push('Atingir essa meta seria importante para você?');
    suggestions.push('Você quer ver esses resultados, correto?');
  }
  
  if (context.includes('equipe') || context.includes('time')) {
    suggestions.push('Sua equipe se beneficiaria com isso, né?');
    suggestions.push('Ter apoio nisso facilitaria as coisas, certo?');
  }
  
  // Add some universal ones
  suggestions.push(...UNIVERSAL_YES_QUESTIONS.agreement.slice(0, 2));
  
  return suggestions;
}

export function calculateYesReadiness(yesCount: number): number {
  // Based on research: after 3-4 yeses, closing probability increases significantly
  if (yesCount >= 5) return 95;
  if (yesCount >= 4) return 85;
  if (yesCount >= 3) return 70;
  if (yesCount >= 2) return 50;
  if (yesCount >= 1) return 30;
  return 10;
}
