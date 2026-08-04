// ==============================================
// FACE-SAVING TECHNIQUES - DATA
// "Let the other person save face" - Dale Carnegie
// ==============================================

import { FaceSavingTechnique, FaceSavingScenario } from '@/types/carnegie';

export const FACE_SAVING_TECHNIQUES: FaceSavingTechnique[] = [
  // ============================================
  // PRICE OBJECTION
  // ============================================
  {
    id: 'face_price_1',
    name: 'Validação do Investimento Consciente',
    scenario: 'price_objection',
    description: 'Quando o cliente diz que está caro, valide a preocupação sem fazer ele se sentir "pobre"',
    principle: 'Preservar dignidade enquanto mantém valor',
    
    acknowledgmentPhrase: 'Faz todo sentido você considerar cuidadosamente o investimento.',
    bridgePhrase: 'Pessoas inteligentes como você sempre avaliam o retorno antes de decidir.',
    solutionPhrase: 'Deixa eu te mostrar como nossos clientes mais analíticos enxergam esse valor...',
    closingPhrase: 'Qual aspecto do retorno você gostaria que eu detalhasse mais?',
    
    fullScript: `Faz todo sentido você considerar cuidadosamente o investimento. Pessoas inteligentes como você sempre avaliam o retorno antes de decidir - e isso é exatamente o que os melhores decisores fazem. 

Deixa eu te mostrar como nossos clientes mais analíticos enxergam esse valor, porque acho que você vai se identificar com a forma como eles pensaram.

[Apresentar valor]

Qual aspecto do retorno você gostaria que eu detalhasse mais?`,
    
    discVariations: {
      D: 'Você é pragmático e avalia investimentos com critério. Deixa eu te dar os números que vão te convencer.',
      I: 'Sei que você quer fazer a melhor escolha! Vou te contar como outros clientes ficaram empolgados com os resultados.',
      S: 'Entendo perfeitamente sua cautela - é uma decisão importante. Vamos analisar juntos com calma.',
      C: 'Sua análise cuidadosa mostra que você toma decisões baseadas em dados. Deixa eu te fornecer a análise completa.'
    },
    
    doThis: [
      'Valide a preocupação como sinal de inteligência',
      'Compare com clientes "similares" que decidiram positivamente',
      'Foque em valor, não em preço',
      'Ofereça opções se possível'
    ],
    avoidThis: [
      'Nunca diga "é barato" ou minimize a preocupação',
      'Não pressione imediatamente',
      'Evite parecer defensivo',
      'Não faça o cliente se sentir inadequado'
    ]
  },
  {
    id: 'face_price_2',
    name: 'Reframe do Orçamento',
    scenario: 'price_objection',
    description: 'Quando o cliente menciona limite de orçamento',
    principle: 'Transformar limitação em critério inteligente',
    
    acknowledgmentPhrase: 'Trabalhar dentro de um orçamento definido mostra gestão profissional.',
    bridgePhrase: 'E é justamente por isso que quero garantir que você extraia o máximo valor possível.',
    solutionPhrase: 'Vamos estruturar isso de uma forma que faça sentido para sua realidade.',
    closingPhrase: 'O que seria mais útil: ajustar o escopo ou dividir em fases?',
    
    fullScript: `Trabalhar dentro de um orçamento definido mostra gestão profissional - é assim que as melhores empresas operam.

E é justamente por isso que quero garantir que você extraia o máximo valor possível dentro dessa realidade.

Vamos estruturar isso de uma forma que faça sentido para você. O que seria mais útil: ajustarmos o escopo para caber no orçamento atual, ou dividirmos em fases que caibam ao longo do tempo?`,
    
    discVariations: {
      D: 'Você define limites claros - isso é liderança. Vamos encontrar a solução que maximize seu ROI.',
      I: 'Adoro que você tem clareza do que quer! Vamos fazer isso funcionar de um jeito criativo.',
      S: 'Entendo que você precisa de estabilidade financeira. Vamos encontrar um caminho confortável.',
      C: 'Sua disciplina orçamentária é admirável. Vamos analisar as opções matematicamente.'
    },
    
    doThis: [
      'Elogie a gestão orçamentária',
      'Ofereça flexibilidade genuína',
      'Apresente alternativas estruturadas',
      'Mantenha o cliente no controle'
    ],
    avoidThis: [
      'Nunca pareça desapontado',
      'Não force além do limite',
      'Evite parecer que está "rebaixando" a oferta',
      'Não questione a decisão de orçamento'
    ]
  },

  // ============================================
  // PRODUCT LIMITATION
  // ============================================
  {
    id: 'face_limitation_1',
    name: 'Transparência Construtiva',
    scenario: 'product_limitation',
    description: 'Quando o produto não atende 100% das necessidades',
    principle: 'Honestidade que constrói confiança',
    
    acknowledgmentPhrase: 'Você levantou um ponto muito válido.',
    bridgePhrase: 'E quero ser totalmente transparente com você porque valorizo nossa relação.',
    solutionPhrase: 'Hoje, esse aspecto específico funciona assim... E aqui está como clientes na sua situação contornaram isso...',
    closingPhrase: 'Isso funcionaria para o seu contexto?',
    
    fullScript: `Você levantou um ponto muito válido - e quero ser totalmente transparente com você porque valorizo nossa relação.

Hoje, esse aspecto específico funciona [explicar honestamente]. Não vou fingir que é perfeito para essa necessidade.

Dito isso, clientes na sua situação encontraram formas criativas de resolver: [soluções alternativas].

Isso funcionaria para o seu contexto, ou você precisa que isso seja resolvido de outra forma?`,
    
    discVariations: {
      D: 'Você merece a verdade: isso não é nosso ponto forte. Mas aqui está como resolver: [solução rápida].',
      I: 'Adoro sua honestidade em perguntar! Deixa eu ser igualmente honesto e te mostrar uma alternativa legal.',
      S: 'Não quero te deixar desconfortável com essa limitação. Vamos encontrar juntos a melhor alternativa.',
      C: 'Para ser preciso: esse recurso tem limitações. Aqui estão os dados e as alternativas viáveis.'
    },
    
    doThis: [
      'Seja honesto sobre limitações',
      'Apresente soluções alternativas',
      'Mostre como outros resolveram',
      'Demonstre que você prioriza a necessidade dele'
    ],
    avoidThis: [
      'Nunca minta ou exagere capacidades',
      'Não minimize a preocupação',
      'Evite defensividade',
      'Não prometa o que não pode entregar'
    ]
  },

  // ============================================
  // MISSED DEADLINE
  // ============================================
  {
    id: 'face_deadline_1',
    name: 'Responsabilidade com Solução',
    scenario: 'missed_deadline',
    description: 'Quando você ou sua empresa perdeu um prazo',
    principle: 'Assumir responsabilidade preservando dignidade de todos',
    
    acknowledgmentPhrase: 'Você tem todo direito de estar frustrado com esse atraso.',
    bridgePhrase: 'E eu assumo total responsabilidade por isso - você confiou em nós.',
    solutionPhrase: 'Aqui está exatamente o que estou fazendo para resolver e garantir que não aconteça novamente...',
    closingPhrase: 'O que mais posso fazer para reconstruir sua confiança?',
    
    fullScript: `Você tem todo direito de estar frustrado com esse atraso - e eu assumo total responsabilidade por isso. Você confiou em nós e merecemos sua confiança.

Não vou dar desculpas. Aqui está exatamente o que estou fazendo para resolver:
1. [Ação imediata]
2. [Prazo realista]
3. [Prevenção futura]

O que mais posso fazer para reconstruir sua confiança?`,
    
    discVariations: {
      D: 'Falamos. Assumo a responsabilidade. Aqui está o plano de correção: [ações com datas]. Próximos passos?',
      I: 'Sei que te decepcionei e isso me incomoda muito. Deixa eu te mostrar como vou fazer diferente.',
      S: 'Lamento muito ter causado essa preocupação. Sua tranquilidade é prioridade. Veja o que vou fazer...',
      C: 'O prazo foi perdido por [motivo real]. Aqui está a análise do que aconteceu e o plano de correção detalhado.'
    },
    
    doThis: [
      'Assuma responsabilidade imediatamente',
      'Não culpe terceiros ou circunstâncias',
      'Apresente plano de correção concreto',
      'Pergunte o que mais pode fazer'
    ],
    avoidThis: [
      'Nunca minimize o impacto do atraso',
      'Não dê desculpas elaboradas',
      'Evite prometer e não cumprir novamente',
      'Não fique na defensiva'
    ]
  },

  // ============================================
  // SERVICE FAILURE
  // ============================================
  {
    id: 'face_service_1',
    name: 'Recuperação de Serviço',
    scenario: 'service_failure',
    description: 'Quando o serviço falhou e o cliente está insatisfeito',
    principle: 'Transformar falha em oportunidade de demonstrar compromisso',
    
    acknowledgmentPhrase: 'Isso não deveria ter acontecido, e você merece melhor.',
    bridgePhrase: 'Sua satisfação é mais importante que qualquer desculpa que eu possa dar.',
    solutionPhrase: 'Vou pessoalmente garantir que isso seja resolvido. Aqui está o que vou fazer agora mesmo...',
    closingPhrase: 'Posso contar com uma nova chance para mostrar nosso verdadeiro nível de serviço?',
    
    fullScript: `Isso não deveria ter acontecido, e você merece melhor. Sua satisfação é mais importante que qualquer desculpa que eu possa dar.

Vou pessoalmente garantir que isso seja resolvido. Aqui está o que vou fazer agora mesmo:
1. [Correção imediata]
2. [Compensação, se aplicável]
3. [Garantia futura]

Posso contar com uma nova chance para mostrar nosso verdadeiro nível de serviço?`,
    
    discVariations: {
      D: 'Falamos. Isso não foi aceitável. Aqui está minha correção imediata: [ação]. Feito.',
      I: 'Isso me deixou muito mal! Você é importante demais para ter essa experiência. Deixa eu consertar isso com estilo!',
      S: 'Sinto muito ter causado essa preocupação. Vou cuidar pessoalmente para que você se sinta seguro novamente.',
      C: 'Analisei o que deu errado e aqui está meu diagnóstico e plano de correção completo.'
    },
    
    doThis: [
      'Reconheça a falha sem minimizar',
      'Ofereça solução imediata',
      'Vá além do esperado na correção',
      'Faça acompanhamento posterior'
    ],
    avoidThis: [
      'Nunca culpe o cliente',
      'Não minimize a experiência negativa',
      'Evite parecer que é "procedimento padrão"',
      'Não desapareça após resolver'
    ]
  },

  // ============================================
  // MISUNDERSTANDING
  // ============================================
  {
    id: 'face_misunderstanding_1',
    name: 'Clarificação Respeitosa',
    scenario: 'misunderstanding',
    description: 'Quando houve mal-entendido e o cliente entendeu errado',
    principle: 'Corrigir sem fazer o outro se sentir errado',
    
    acknowledgmentPhrase: 'Acho que posso não ter me expressado da melhor forma.',
    bridgePhrase: 'A responsabilidade é minha de garantir que estejamos alinhados.',
    solutionPhrase: 'Deixa eu reformular de uma forma mais clara...',
    closingPhrase: 'Faz mais sentido agora? O que você acha?',
    
    fullScript: `Acho que posso não ter me expressado da melhor forma - a responsabilidade é minha de garantir que estejamos alinhados.

Deixa eu reformular de uma forma mais clara: [explicação clara].

Faz mais sentido agora? O que você acha?`,
    
    discVariations: {
      D: 'Deixa eu ser mais direto: o que quero dizer é [versão direta].',
      I: 'Ai, acho que me enrolei! O que eu queria dizer é [versão simples].',
      S: 'Posso ter complicado - deixa eu explicar de um jeito mais tranquilo.',
      C: 'Deixa eu reformular com mais precisão técnica: [versão detalhada].'
    },
    
    doThis: [
      'Assuma a responsabilidade pela comunicação',
      'Nunca diga "você entendeu errado"',
      'Use "deixa eu reformular"',
      'Confirme entendimento ao final'
    ],
    avoidThis: [
      'Nunca culpe o cliente pelo mal-entendido',
      'Não diga "eu já expliquei"',
      'Evite tom de superioridade',
      'Não demonstre impaciência'
    ]
  },

  // ============================================
  // COMPETITOR COMPARISON
  // ============================================
  {
    id: 'face_competitor_1',
    name: 'Reconhecimento Elegante',
    scenario: 'competitor_comparison',
    description: 'Quando o cliente menciona que o concorrente é melhor em algo',
    principle: 'Nunca depreciar o concorrente, elevando-se naturalmente',
    
    acknowledgmentPhrase: 'Eles realmente fazem um bom trabalho nisso.',
    bridgePhrase: 'E você está certo em comparar - é uma decisão importante.',
    solutionPhrase: 'O que descobrimos é que nossos clientes nos escolhem porque...',
    closingPhrase: 'O que seria mais decisivo para você nessa escolha?',
    
    fullScript: `Eles realmente fazem um bom trabalho nisso - e você está certo em comparar. É uma decisão importante e merece análise cuidadosa.

O que descobrimos é que nossos clientes nos escolhem porque [diferencial genuíno], e isso faz diferença especialmente para quem [perfil do cliente].

O que seria mais decisivo para você nessa escolha?`,
    
    discVariations: {
      D: 'Sim, eles são competentes nisso. Nós ganhamos em [resultado concreto]. Qual é sua prioridade?',
      I: 'Legal que você conhece eles! O que nossos clientes mais amam na gente é [experiência diferenciada].',
      S: 'É bom conhecer todas as opções. O que nossos clientes mais valorizam é [segurança/suporte].',
      C: 'Factualmente correto. Aqui está uma comparação detalhada: [dados comparativos].'
    },
    
    doThis: [
      'Reconheça os méritos do concorrente',
      'Foque nos seus diferenciais genuínos',
      'Pergunte o que é prioritário para o cliente',
      'Deixe o cliente decidir'
    ],
    avoidThis: [
      'Nunca deprecie o concorrente',
      'Não minta sobre capacidades',
      'Evite parecer ameaçado',
      'Não pressione por decisão imediata'
    ]
  },

  // ============================================
  // INTERNAL RESISTANCE
  // ============================================
  {
    id: 'face_internal_1',
    name: 'Aliança Estratégica',
    scenario: 'internal_resistance',
    description: 'Quando o cliente enfrenta resistência interna para aprovar',
    principle: 'Ajudar o cliente a "ganhar" internamente',
    
    acknowledgmentPhrase: 'Faz total sentido que você precise de alinhamento interno.',
    bridgePhrase: 'E quero te ajudar a apresentar isso da forma mais convincente possível.',
    solutionPhrase: 'O que funciona com stakeholders como os seus é...',
    closingPhrase: 'Que materiais posso preparar para facilitar sua apresentação?',
    
    fullScript: `Faz total sentido que você precise de alinhamento interno - as melhores decisões são tomadas em equipe.

Quero te ajudar a apresentar isso da forma mais convincente possível para os outros decisores.

O que funciona com stakeholders como os seus é: [argumentos customizados por perfil].

Que materiais posso preparar para facilitar sua apresentação? Posso inclusive participar da reunião se for útil.`,
    
    discVariations: {
      D: 'Você lidera isso. Deixa eu te dar os argumentos que vão convencer rapidamente.',
      I: 'Vamos fazer você brilhar nessa apresentação! O que vai empolgar seu time é...',
      S: 'Quero que você se sinta seguro ao apresentar. Vamos construir juntos os argumentos.',
      C: 'Preparei uma análise completa que você pode usar. Aqui estão os dados que vão convencer.'
    },
    
    doThis: [
      'Posicione-se como aliado do cliente',
      'Ajude a construir o caso de negócio',
      'Ofereça suporte para apresentação',
      'Prepare materiais customizados'
    ],
    avoidThis: [
      'Nunca critique os outros decisores',
      'Não pressione o cliente',
      'Evite parecer que você tem mais a perder',
      'Não demonstre frustração'
    ]
  },

  // ============================================
  // DELAYED DECISION
  // ============================================
  {
    id: 'face_delay_1',
    name: 'Paciência Estratégica',
    scenario: 'delayed_decision',
    description: 'Quando o cliente adia a decisão repetidamente',
    principle: 'Manter porta aberta sem parecer desesperado',
    
    acknowledgmentPhrase: 'Decisões importantes merecem tempo para serem bem pensadas.',
    bridgePhrase: 'E estou aqui para quando você estiver pronto.',
    solutionPhrase: 'Enquanto isso, posso te enviar alguns insights que podem ajudar na reflexão...',
    closingPhrase: 'Quando seria um bom momento para conversarmos novamente?',
    
    fullScript: `Decisões importantes merecem tempo para serem bem pensadas - e eu respeito completamente seu processo.

Estou aqui para quando você estiver pronto, sem pressa.

Enquanto isso, posso te enviar alguns insights que podem ajudar na reflexão: [materiais de valor].

Quando seria um bom momento para conversarmos novamente? Fico à disposição.`,
    
    discVariations: {
      D: 'Entendo que timing é crucial. Quando você estiver pronto, me avise. Qual seria a melhor semana?',
      I: 'Tranquilo! Quando rolar, vai ser incrível! Vou te mandar umas coisas legais enquanto isso.',
      S: 'Sem pressa nenhuma. Quero que você se sinta completamente confortável. Estarei aqui.',
      C: 'Compreendo que você precisa de mais dados. Aqui está material adicional para sua análise.'
    },
    
    doThis: [
      'Respeite o tempo do cliente',
      'Agregue valor durante a espera',
      'Mantenha contato sem pressionar',
      'Estabeleça próximo passo concreto'
    ],
    avoidThis: [
      'Nunca demonstre frustração',
      'Não pressione com táticas de urgência',
      'Evite parecer desesperado',
      'Não desapareça completamente'
    ]
  },

  // ============================================
  // CHANGED REQUIREMENTS
  // ============================================
  {
    id: 'face_changed_1',
    name: 'Adaptação Positiva',
    scenario: 'changed_requirements',
    description: 'Quando o cliente muda os requisitos no meio do processo',
    principle: 'Abraçar mudança sem causar culpa',
    
    acknowledgmentPhrase: 'Faz total sentido revisar os requisitos com novas informações.',
    bridgePhrase: 'É assim que projetos evoluem para o melhor resultado.',
    solutionPhrase: 'Deixa eu te mostrar como podemos incorporar essa mudança...',
    closingPhrase: 'O que mais você gostaria de ajustar nesse ponto?',
    
    fullScript: `Faz total sentido revisar os requisitos com novas informações - é assim que projetos evoluem para o melhor resultado.

Fico feliz que você trouxe isso agora, antes de avançarmos demais.

Deixa eu te mostrar como podemos incorporar essa mudança: [opções de adaptação].

O que mais você gostaria de ajustar nesse ponto?`,
    
    discVariations: {
      D: 'Mudanças de escopo são normais. Aqui está como ajustamos rapidamente: [plano direto].',
      I: 'Adoro! Novas ideias sempre deixam o projeto melhor! Vamos fazer acontecer!',
      S: 'Não se preocupe com a mudança. Vamos ajustar com calma e garantir que fique perfeito.',
      C: 'Documentei as novas especificações. Aqui está o impacto detalhado e as opções de adaptação.'
    },
    
    doThis: [
      'Trate mudanças como evolução natural',
      'Não demonstre frustração',
      'Apresente opções de adaptação',
      'Agradeça por trazer cedo'
    ],
    avoidThis: [
      'Nunca diga "você deveria ter decidido antes"',
      'Não culpe o cliente pelas mudanças',
      'Evite parecer inflexível',
      'Não use as mudanças como pretexto para aumentar preço'
    ]
  }
];

// ============================================
// DETECTION PATTERNS
// ============================================
export const FACE_SAVING_DETECTION: Record<FaceSavingScenario, string[]> = {
  price_objection: [
    'caro', 'preço', 'orçamento', 'custo', 'investimento alto', 'muito dinheiro',
    'não cabe', 'fora do budget', 'mais barato'
  ],
  product_limitation: [
    'não faz', 'não tem', 'falta', 'limitação', 'não consegue', 'não suporta',
    'preciso de', 'o concorrente tem'
  ],
  missed_deadline: [
    'atrasou', 'perdeu prazo', 'não entregou', 'quando vai', 'estava prometido',
    'combinamos que'
  ],
  service_failure: [
    'não funcionou', 'deu errado', 'problema', 'erro', 'insatisfeito', 'frustrado',
    'decepcionado', 'péssimo', 'horrível'
  ],
  misunderstanding: [
    'entendi que', 'achei que', 'você disse', 'confuso', 'não ficou claro',
    'pensei que', 'era diferente'
  ],
  competitor_comparison: [
    'concorrente', 'outro fornecedor', 'opção mais', 'eles fazem', 'lá tem',
    'comparando com', 'alternativa'
  ],
  budget_constraint: [
    'orçamento', 'budget', 'limite', 'teto', 'verba', 'disponível',
    'aprovado', 'liberado'
  ],
  internal_resistance: [
    'preciso convencer', 'meu chefe', 'diretoria', 'aprovação', 'comitê',
    'outros decisores', 'stakeholders', 'preciso de apoio'
  ],
  changed_requirements: [
    'mudou', 'diferente agora', 'preciso mudar', 'novo requisito', 'revisar',
    'alterar', 'não é mais assim'
  ],
  delayed_decision: [
    'ainda pensando', 'preciso de tempo', 'não agora', 'mais pra frente',
    'depois vejo', 'vou avaliar', 'não é o momento'
  ]
};

// ============================================
// HELPER FUNCTIONS
// ============================================
export function detectFaceSavingScenario(text: string): FaceSavingScenario | null {
  const textLower = text.toLowerCase();
  
  for (const [scenario, keywords] of Object.entries(FACE_SAVING_DETECTION)) {
    for (const keyword of keywords) {
      if (textLower.includes(keyword)) {
        return scenario as FaceSavingScenario;
      }
    }
  }
  
  return null;
}

export function getTechniqueForScenario(scenario: FaceSavingScenario): FaceSavingTechnique | null {
  return FACE_SAVING_TECHNIQUES.find(t => t.scenario === scenario) || null;
}

export function getTechniqueForDISC(
  scenario: FaceSavingScenario,
  discProfile: 'D' | 'I' | 'S' | 'C'
): { technique: FaceSavingTechnique; adaptedScript: string } | null {
  const technique = getTechniqueForScenario(scenario);
  if (!technique) return null;
  
  return {
    technique,
    adaptedScript: technique.discVariations[discProfile]
  };
}

export function getAllTechniquesForScenario(scenario: FaceSavingScenario): FaceSavingTechnique[] {
  return FACE_SAVING_TECHNIQUES.filter(t => t.scenario === scenario);
}
