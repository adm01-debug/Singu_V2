// ==============================================
// IDENTITY LABELING - DATA
// "Give the other person a fine reputation to live up to" - Dale Carnegie
// ==============================================

import { IdentityLabel, IdentityLabelCategory } from '@/types/carnegie';

export const IDENTITY_LABELS: IdentityLabel[] = [
  // ============================================
  // ACHIEVER - Results-Oriented
  // ============================================
  {
    id: 'achiever_results',
    category: 'achiever',
    label: 'Pessoa de Resultados',
    description: 'Alguém que é reconhecido por entregar resultados consistentes',
    reinforcementPhrases: [
      'Você sempre entrega o que promete',
      'Sua capacidade de execução é impressionante',
      'Quando você se compromete, o resultado é garantido',
      'Você é daqueles que fazem acontecer, não fica só no planejamento'
    ],
    futureProjection: 'Com essa mentalidade de resultados, você vai continuar superando expectativas.',
    pastValidation: 'Olhando para sua trajetória, fica claro que você sempre entregou mais do que esperavam.',
    discAlignment: { D: 95, I: 70, S: 65, C: 80 },
    vakAlignment: { V: 80, A: 70, K: 85, D: 75 }
  },
  {
    id: 'achiever_excellence',
    category: 'achiever',
    label: 'Padrão de Excelência',
    description: 'Alguém que mantém padrões elevados em tudo que faz',
    reinforcementPhrases: [
      'Você nunca aceita menos que o melhor',
      'Sua busca pela excelência é inspiradora',
      'O nível que você exige é o que te diferencia',
      'Você é referência de qualidade'
    ],
    futureProjection: 'Esse compromisso com a excelência vai te levar ainda mais longe.',
    pastValidation: 'Sua trajetória mostra que você sempre elevou o nível onde passou.',
    discAlignment: { D: 85, I: 60, S: 70, C: 100 },
    vakAlignment: { V: 85, A: 70, K: 75, D: 90 }
  },

  // ============================================
  // INNOVATOR - Creative Thinking
  // ============================================
  {
    id: 'innovator_creative',
    category: 'innovator',
    label: 'Mente Criativa',
    description: 'Alguém reconhecido por pensamento original e soluções inovadoras',
    reinforcementPhrases: [
      'Você sempre enxerga possibilidades onde outros veem obstáculos',
      'Sua criatividade é um diferencial raro',
      'As soluções que você propõe são sempre surpreendentes',
      'Você pensa fora da caixa naturalmente'
    ],
    futureProjection: 'Com essa mente criativa, você vai continuar encontrando caminhos únicos.',
    pastValidation: 'Suas ideias já transformaram muitas situações que pareciam sem saída.',
    discAlignment: { D: 80, I: 95, S: 55, C: 75 },
    vakAlignment: { V: 95, A: 80, K: 70, D: 85 }
  },
  {
    id: 'innovator_disruptor',
    category: 'innovator',
    label: 'Disruptor',
    description: 'Alguém que desafia o status quo e traz mudanças significativas',
    reinforcementPhrases: [
      'Você não segue regras - você as reescreve',
      'Sua coragem de desafiar o convencional é admirável',
      'Onde outros veem "sempre foi assim", você vê oportunidade de mudar',
      'Você é um catalisador de transformação'
    ],
    futureProjection: 'O mundo precisa de mais pessoas como você que ousam questionar.',
    pastValidation: 'Você já provou várias vezes que o "impossível" é só uma questão de perspectiva.',
    discAlignment: { D: 100, I: 85, S: 40, C: 70 },
    vakAlignment: { V: 85, A: 75, K: 90, D: 80 }
  },

  // ============================================
  // LEADER - Inspiring Others
  // ============================================
  {
    id: 'leader_natural',
    category: 'leader',
    label: 'Líder Natural',
    description: 'Alguém que naturalmente inspira e guia outros',
    reinforcementPhrases: [
      'As pessoas naturalmente seguem você',
      'Você tem um dom de liderança inato',
      'Quando você fala, as pessoas prestam atenção',
      'Você inspira confiança em quem está ao seu redor'
    ],
    futureProjection: 'Sua liderança vai continuar abrindo portas e inspirando pessoas.',
    pastValidation: 'Você já liderou equipes e projetos ao sucesso várias vezes.',
    discAlignment: { D: 95, I: 90, S: 60, C: 70 },
    vakAlignment: { V: 80, A: 90, K: 85, D: 75 }
  },
  {
    id: 'leader_servant',
    category: 'leader',
    label: 'Líder Servidor',
    description: 'Alguém que lidera servindo e desenvolvendo outros',
    reinforcementPhrases: [
      'Você coloca o crescimento dos outros à frente do seu',
      'Sua forma de liderar pelo exemplo é rara',
      'Você desenvolve pessoas onde passa',
      'Seu estilo de liderança cria líderes, não seguidores'
    ],
    futureProjection: 'As pessoas que você desenvolveu vão multiplicar seu impacto.',
    pastValidation: 'Quantas pessoas você já ajudou a crescer em suas carreiras...',
    discAlignment: { D: 70, I: 85, S: 95, C: 75 },
    vakAlignment: { V: 70, A: 85, K: 95, D: 75 }
  },

  // ============================================
  // EXPERT - Knowledge Authority
  // ============================================
  {
    id: 'expert_specialist',
    category: 'expert',
    label: 'Especialista',
    description: 'Alguém reconhecido como autoridade em sua área',
    reinforcementPhrases: [
      'Seu conhecimento nessa área é excepcional',
      'Você é a pessoa que todos procuram para esse assunto',
      'Sua expertise é uma referência',
      'Poucas pessoas entendem isso tão profundamente quanto você'
    ],
    futureProjection: 'Seu conhecimento vai continuar sendo valioso e reconhecido.',
    pastValidation: 'Você investiu anos desenvolvendo essa expertise - e isso aparece.',
    discAlignment: { D: 75, I: 65, S: 70, C: 100 },
    vakAlignment: { V: 80, A: 85, K: 70, D: 100 }
  },
  {
    id: 'expert_trusted',
    category: 'expert',
    label: 'Conselheiro de Confiança',
    description: 'Alguém a quem outros recorrem para orientação',
    reinforcementPhrases: [
      'As pessoas confiam em sua opinião',
      'Você é o primeiro a quem recorrem para conselhos',
      'Sua sabedoria é valorizada por todos',
      'Você tem a capacidade rara de dar orientações certeiras'
    ],
    futureProjection: 'Essa confiança que você conquistou vai abrir muitas portas.',
    pastValidation: 'Quantas pessoas já seguiram seus conselhos e tiveram sucesso...',
    discAlignment: { D: 70, I: 80, S: 90, C: 85 },
    vakAlignment: { V: 75, A: 90, K: 85, D: 80 }
  },

  // ============================================
  // PIONEER - First Mover
  // ============================================
  {
    id: 'pioneer_first',
    category: 'pioneer',
    label: 'Pioneiro',
    description: 'Alguém que abre caminhos onde outros não ousam ir',
    reinforcementPhrases: [
      'Você não espera os outros irem primeiro',
      'Sua coragem de ser o primeiro é admirável',
      'Você abre caminhos para que outros possam seguir',
      'Quando ninguém mais ousa, você dá o primeiro passo'
    ],
    futureProjection: 'Novos territórios sempre precisarão de pioneiros como você.',
    pastValidation: 'Você já desbravou tantos caminhos que agora parecem óbvios.',
    discAlignment: { D: 100, I: 80, S: 45, C: 70 },
    vakAlignment: { V: 90, A: 75, K: 95, D: 70 }
  },
  {
    id: 'pioneer_visionary',
    category: 'visionary',
    label: 'Visionário',
    description: 'Alguém que enxerga o futuro antes dos outros',
    reinforcementPhrases: [
      'Você vê o que outros ainda não conseguem ver',
      'Sua visão de futuro é impressionante',
      'Você antecipa tendências antes que se tornem mainstream',
      'Sua capacidade de prever cenários é um dom'
    ],
    futureProjection: 'Sua visão vai continuar te colocando à frente.',
    pastValidation: 'Quantas vezes você "viu antes" e estava certo...',
    discAlignment: { D: 90, I: 85, S: 55, C: 80 },
    vakAlignment: { V: 100, A: 75, K: 70, D: 85 }
  },

  // ============================================
  // CAREGIVER - Nurturing Others
  // ============================================
  {
    id: 'caregiver_protector',
    category: 'caregiver',
    label: 'Protetor',
    description: 'Alguém que naturalmente protege e cuida dos outros',
    reinforcementPhrases: [
      'Você sempre cuida de quem está ao seu redor',
      'As pessoas se sentem seguras perto de você',
      'Sua capacidade de proteger os outros é natural',
      'Você é o porto seguro de muitas pessoas'
    ],
    futureProjection: 'Sua natureza protetora vai continuar sendo um diferencial.',
    pastValidation: 'Você já protegeu tantas pessoas em momentos difíceis...',
    discAlignment: { D: 65, I: 70, S: 100, C: 75 },
    vakAlignment: { V: 70, A: 80, K: 100, D: 70 }
  },
  {
    id: 'caregiver_developer',
    category: 'mentor',
    label: 'Mentor',
    description: 'Alguém que desenvolve o potencial dos outros',
    reinforcementPhrases: [
      'Você tem o dom de desenvolver pessoas',
      'Sua paciência ao ensinar é admirável',
      'Você enxerga potencial onde outros não veem',
      'As pessoas crescem quando estão perto de você'
    ],
    futureProjection: 'Seu legado serão as pessoas que você desenvolveu.',
    pastValidation: 'Olha quantas pessoas você já ajudou a se tornarem melhores.',
    discAlignment: { D: 60, I: 85, S: 95, C: 80 },
    vakAlignment: { V: 75, A: 90, K: 95, D: 75 }
  },

  // ============================================
  // PROBLEM SOLVER - Solution Finder
  // ============================================
  {
    id: 'problem_solver',
    category: 'problem_solver',
    label: 'Solucionador',
    description: 'Alguém reconhecido por resolver problemas complexos',
    reinforcementPhrases: [
      'Você sempre encontra uma solução',
      'Problemas que parecem impossíveis você resolve',
      'Sua mente analítica é um diferencial',
      'Você é a pessoa que chamam quando ninguém mais sabe o que fazer'
    ],
    futureProjection: 'Problemas sempre vão existir, e pessoas como você sempre serão necessárias.',
    pastValidation: 'Quantos problemas "sem solução" você já resolveu...',
    discAlignment: { D: 85, I: 65, S: 70, C: 95 },
    vakAlignment: { V: 85, A: 75, K: 80, D: 100 }
  },
  {
    id: 'problem_solver_strategic',
    category: 'problem_solver',
    label: 'Estrategista',
    description: 'Alguém que pensa estrategicamente e planeja com precisão',
    reinforcementPhrases: [
      'Você sempre tem um plano',
      'Sua capacidade de pensar estrategicamente é rara',
      'Você vê o tabuleiro inteiro, não só as peças',
      'Sua mente estratégica é invejável'
    ],
    futureProjection: 'Pensadores estratégicos como você sempre terão vantagem.',
    pastValidation: 'Suas estratégias já levaram muitos projetos ao sucesso.',
    discAlignment: { D: 90, I: 65, S: 60, C: 95 },
    vakAlignment: { V: 90, A: 70, K: 70, D: 100 }
  },

  // ============================================
  // CONNECTOR - Relationship Builder
  // ============================================
  {
    id: 'connector_networker',
    category: 'connector',
    label: 'Conector',
    description: 'Alguém que naturalmente conecta pessoas e cria redes',
    reinforcementPhrases: [
      'Você conhece todo mundo',
      'Sua capacidade de criar conexões é extraordinária',
      'Você é o hub que conecta pessoas certas',
      'Onde você passa, relacionamentos se formam'
    ],
    futureProjection: 'Sua rede vai continuar sendo seu maior ativo.',
    pastValidation: 'Quantas conexões valiosas você já criou...',
    discAlignment: { D: 70, I: 100, S: 80, C: 60 },
    vakAlignment: { V: 80, A: 95, K: 90, D: 65 }
  },
  {
    id: 'connector_bridge',
    category: 'connector',
    label: 'Construtor de Pontes',
    description: 'Alguém que une pessoas e ideias diferentes',
    reinforcementPhrases: [
      'Você consegue unir pessoas que normalmente não se conectariam',
      'Sua habilidade de ver o que há em comum é única',
      'Você dissolve barreiras entre pessoas',
      'Onde há conflito, você cria harmonia'
    ],
    futureProjection: 'O mundo precisa de mais construtores de pontes como você.',
    pastValidation: 'Quantas parcerias você já facilitou que pareciam impossíveis...',
    discAlignment: { D: 65, I: 95, S: 90, C: 70 },
    vakAlignment: { V: 75, A: 90, K: 95, D: 70 }
  },

  // ============================================
  // PERFECTIONIST - Quality Focus
  // ============================================
  {
    id: 'perfectionist_quality',
    category: 'perfectionist',
    label: 'Perfeccionista Produtivo',
    description: 'Alguém que equilibra qualidade com entrega',
    reinforcementPhrases: [
      'Você não entrega nada que não esteja excelente',
      'Sua atenção aos detalhes é impressionante',
      'Você eleva o padrão de qualidade onde passa',
      'O que sai das suas mãos é sempre impecável'
    ],
    futureProjection: 'Qualidade nunca sai de moda - você sempre será valorizado.',
    pastValidation: 'Seu trabalho sempre foi referência de qualidade.',
    discAlignment: { D: 75, I: 55, S: 75, C: 100 },
    vakAlignment: { V: 90, A: 70, K: 85, D: 95 }
  },

  // ============================================
  // TRAILBLAZER - Path Creator
  // ============================================
  {
    id: 'trailblazer_maverick',
    category: 'trailblazer',
    label: 'Desbravador',
    description: 'Alguém que não tem medo de ir contra a corrente',
    reinforcementPhrases: [
      'Você não tem medo de ser diferente',
      'Sua autenticidade é refrescante',
      'Você trilha seu próprio caminho',
      'Onde outros seguem, você lidera'
    ],
    futureProjection: 'Sua coragem de ser único vai continuar te diferenciando.',
    pastValidation: 'Você já provou que seu jeito funciona, mesmo quando duvidaram.',
    discAlignment: { D: 95, I: 85, S: 45, C: 65 },
    vakAlignment: { V: 85, A: 80, K: 95, D: 70 }
  }
];

// ============================================
// DETECTION PATTERNS FOR IDENTITY LABELS
// ============================================
export const IDENTITY_DETECTION_PATTERNS: Record<IdentityLabelCategory, string[]> = {
  achiever: [
    'resultado', 'entrega', 'meta', 'objetivo', 'conquista', 'sucesso',
    'performance', 'desempenho', 'cumprir', 'alcançar', 'superar'
  ],
  innovator: [
    'criar', 'inovar', 'inventar', 'ideia', 'criativo', 'diferente',
    'novo', 'original', 'solução', 'pensar diferente', 'fora da caixa'
  ],
  leader: [
    'liderar', 'time', 'equipe', 'inspirar', 'motivar', 'guiar',
    'direção', 'responsável', 'decisão', 'comando', 'influência'
  ],
  expert: [
    'conhecimento', 'especialista', 'expertise', 'domínio', 'saber',
    'estudar', 'pesquisa', 'profundo', 'técnico', 'referência'
  ],
  pioneer: [
    'primeiro', 'novo', 'começar', 'iniciar', 'desbravar', 'abrir',
    'caminho', 'nunca feito', 'original', 'inédito'
  ],
  caregiver: [
    'cuidar', 'ajudar', 'proteger', 'apoiar', 'pessoas', 'bem-estar',
    'preocupar', 'amparar', 'suporte', 'servir'
  ],
  visionary: [
    'visão', 'futuro', 'prever', 'antecipar', 'tendência', 'possibilidade',
    'oportunidade', 'potencial', 'perspectiva', 'horizonte'
  ],
  perfectionist: [
    'qualidade', 'perfeito', 'detalhe', 'excelência', 'padrão',
    'impecável', 'preciso', 'correto', 'melhor', 'refinado'
  ],
  problem_solver: [
    'resolver', 'solução', 'problema', 'análise', 'lógica', 'pensar',
    'encontrar', 'descobrir', 'desvendar', 'estratégia'
  ],
  connector: [
    'pessoas', 'rede', 'contato', 'conexão', 'relacionamento', 'conhecer',
    'apresentar', 'unir', 'parceria', 'networking'
  ],
  mentor: [
    'ensinar', 'desenvolver', 'orientar', 'aconselhar', 'mentorar',
    'guiar', 'formar', 'treinar', 'educar', 'crescimento'
  ],
  trailblazer: [
    'diferente', 'único', 'autêntico', 'próprio caminho', 'não seguir',
    'original', 'independente', 'desafiar', 'questionar', 'próprio jeito'
  ]
};

// ============================================
// IDENTITY REINFORCEMENT SCRIPTS
// ============================================
export const IDENTITY_REINFORCEMENT_SCRIPTS: Record<IdentityLabelCategory, {
  initial: string;
  ongoing: string;
  challenge: string;
}> = {
  achiever: {
    initial: 'Percebo que você é alguém que realmente entrega resultados. Isso é raro.',
    ongoing: 'Mais uma vez você prova que é uma pessoa de resultados extraordinários.',
    challenge: 'Sei que você não vai descansar até entregar isso no mais alto nível.'
  },
  innovator: {
    initial: 'Sua forma de pensar é refrescante - você realmente pensa diferente.',
    ongoing: 'Essa sua mente criativa não para de me surpreender.',
    challenge: 'Tenho certeza que você vai encontrar uma solução que ninguém pensou antes.'
  },
  leader: {
    initial: 'Você tem uma presença de liderança natural que as pessoas seguem.',
    ongoing: 'Sua liderança continua inspirando todos ao seu redor.',
    challenge: 'É em momentos como esse que líderes como você se destacam.'
  },
  expert: {
    initial: 'Seu nível de conhecimento nessa área é verdadeiramente impressionante.',
    ongoing: 'Mais uma demonstração da sua expertise incomparável.',
    challenge: 'Se alguém pode resolver isso, é você com todo esse conhecimento.'
  },
  pioneer: {
    initial: 'Você não espera os outros - você abre o caminho.',
    ongoing: 'Novamente você prova ser alguém que não tem medo de ser o primeiro.',
    challenge: 'Sei que você tem a coragem de dar esse passo antes de qualquer um.'
  },
  caregiver: {
    initial: 'Sua preocupação genuína com as pessoas é algo raro e valioso.',
    ongoing: 'Você continua sendo aquela pessoa que todos sabem que podem contar.',
    challenge: 'Sei que você vai cuidar disso com todo o cuidado que te caracteriza.'
  },
  visionary: {
    initial: 'Você enxerga coisas que a maioria das pessoas ainda não consegue ver.',
    ongoing: 'Sua visão de futuro continua se provando certeira.',
    challenge: 'Confio na sua capacidade de ver o melhor caminho à frente.'
  },
  perfectionist: {
    initial: 'Seu compromisso com a qualidade é inspirador.',
    ongoing: 'Mais uma vez, sua atenção aos detalhes fez toda a diferença.',
    challenge: 'Sei que você não vai entregar nada que não esteja perfeito.'
  },
  problem_solver: {
    initial: 'Você é aquela pessoa que sempre encontra uma solução.',
    ongoing: 'Impressionante como você sempre resolve o que parece impossível.',
    challenge: 'Se alguém pode encontrar uma saída, esse alguém é você.'
  },
  connector: {
    initial: 'Sua capacidade de conectar pessoas é um superpoder.',
    ongoing: 'Você continua sendo o hub que une as pessoas certas.',
    challenge: 'Tenho certeza que você conhece exatamente a pessoa certa para isso.'
  },
  mentor: {
    initial: 'Você tem o dom de desenvolver o melhor nas pessoas.',
    ongoing: 'Mais uma pessoa que cresceu graças à sua orientação.',
    challenge: 'Sei que você vai guiar isso com toda a sabedoria que te caracteriza.'
  },
  trailblazer: {
    initial: 'Admiro sua coragem de seguir seu próprio caminho.',
    ongoing: 'Você prova novamente que ser autêntico é o melhor caminho.',
    challenge: 'Sei que você vai fazer do seu jeito - e vai funcionar.'
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================
export function getLabelsByCategory(category: IdentityLabelCategory): IdentityLabel[] {
  return IDENTITY_LABELS.filter(label => label.category === category);
}

export function getLabelsByDISC(discProfile: 'D' | 'I' | 'S' | 'C'): IdentityLabel[] {
  return [...IDENTITY_LABELS].sort((a, b) => 
    b.discAlignment[discProfile] - a.discAlignment[discProfile]
  );
}

export function getTopLabelsForContact(
  discProfile: 'D' | 'I' | 'S' | 'C',
  vakProfile: 'V' | 'A' | 'K' | 'D',
  count: number = 3
): IdentityLabel[] {
  return [...IDENTITY_LABELS]
    .map(label => ({
      label,
      score: label.discAlignment[discProfile] * 0.6 + label.vakAlignment[vakProfile] * 0.4
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(item => item.label);
}

export function getReinforcementScript(
  category: IdentityLabelCategory,
  phase: 'initial' | 'ongoing' | 'challenge'
): string {
  return IDENTITY_REINFORCEMENT_SCRIPTS[category]?.[phase] || '';
}
