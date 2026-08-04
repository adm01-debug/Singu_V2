// Mental Triggers Types for Client Persuasion System

export type TriggerCategory = 
  | 'urgency'      // Urgência e Escassez
  | 'social'       // Prova Social e Autoridade
  | 'emotional'    // Conexão Emocional
  | 'logic'        // Lógica e Dados
  | 'reciprocity'  // Reciprocidade
  | 'commitment';  // Compromisso e Consistência

export type TriggerType = 
  // Urgência
  | 'scarcity'          // Escassez
  | 'urgency'           // Urgência
  | 'fomo'              // Medo de perder
  | 'exclusivity'       // Exclusividade
  // Social
  | 'social_proof'      // Prova Social
  | 'authority'         // Autoridade
  | 'consensus'         // Consenso
  | 'testimonial'       // Depoimentos
  // Emocional
  | 'storytelling'      // Narrativa
  | 'belonging'         // Pertencimento
  | 'anticipation'      // Antecipação
  | 'empathy'           // Empatia
  // Lógico
  | 'specificity'       // Especificidade
  | 'reason_why'        // Razão/Justificativa
  | 'comparison'        // Comparação
  | 'guarantee'         // Garantia
  // Reciprocidade
  | 'gift'              // Presente/Valor gratuito
  | 'concession'        // Concessão
  | 'personalization'   // Personalização
  // Compromisso
  | 'commitment'        // Compromisso
  | 'consistency'       // Consistência
  | 'small_yes'         // Pequenos sins
  | 'public_commitment'; // Compromisso público

export interface MentalTrigger {
  id: TriggerType;
  name: string;
  category: TriggerCategory;
  description: string;
  effectiveness: number; // 1-10 para o perfil
  icon: string;
  color: string;
  examples: string[];
  bestFor: string[]; // Perfis DISC
  avoidFor: string[]; // Perfis DISC
  timing: 'early' | 'middle' | 'closing' | 'any';
}

export interface TriggerSuggestion {
  trigger: MentalTrigger;
  matchScore: number; // 0-100
  reason: string;
  template: string;
  timing: string;
  context?: string;
}

export type PersuasionScenario = 
  | 'price_objection'           // Objeção de preço
  | 'indecisive_client'         // Cliente indeciso
  | 'lost_client_reactivation'  // Reativação de cliente perdido
  | 'initial_negotiation'       // Negociação inicial
  | 'upsell_crosssell'          // Upsell / Cross-sell
  | 'contract_renewal'          // Renovação de contrato
  | 'timing_objection'          // Objeção de timing
  | 'general';                  // Cenário geral

export interface PersuasionTemplate {
  id: string;
  trigger: TriggerType;
  discProfile: string | null; // null = universal
  relationshipStage: string | null;
  channel: 'whatsapp' | 'email' | 'call' | 'meeting' | 'any';
  title: string;
  template: string;
  variables: string[];
  tips: string[];
  scenario?: PersuasionScenario;
}

export interface ClientTriggerAnalysis {
  contactId: string;
  primaryTriggers: TriggerSuggestion[];
  secondaryTriggers: TriggerSuggestion[];
  avoidTriggers: TriggerType[];
  currentOpportunity: {
    trigger: TriggerType;
    reason: string;
    urgency: 'high' | 'medium' | 'low';
  } | null;
  negotiationTips: string[];
}

// Trigger Definitions
export const MENTAL_TRIGGERS: Record<TriggerType, MentalTrigger> = {
  // URGÊNCIA
  scarcity: {
    id: 'scarcity',
    name: 'Escassez',
    category: 'urgency',
    description: 'Valoriza o que é raro ou limitado',
    effectiveness: 9,
    icon: '⏳',
    color: 'text-destructive bg-destructive/10',
    examples: [
      'Restam apenas 2 vagas',
      'Oferta válida até sexta',
      'Edição limitada',
    ],
    bestFor: ['D', 'I'],
    avoidFor: ['C'],
    timing: 'closing',
  },
  urgency: {
    id: 'urgency',
    name: 'Urgência',
    category: 'urgency',
    description: 'Prazo limitado força decisão rápida',
    effectiveness: 8,
    icon: '⚡',
    color: 'text-warning bg-warning/10',
    examples: [
      'Preciso da resposta até amanhã',
      'O preço muda na próxima semana',
      'Deadline do projeto se aproxima',
    ],
    bestFor: ['D'],
    avoidFor: ['S', 'C'],
    timing: 'closing',
  },
  fomo: {
    id: 'fomo',
    name: 'FOMO',
    category: 'urgency',
    description: 'Medo de perder oportunidade única',
    effectiveness: 8,
    icon: '😰',
    color: 'text-secondary bg-secondary/10',
    examples: [
      'Seus concorrentes já estão usando',
      'Você pode ficar para trás',
      'Outros já aproveitaram',
    ],
    bestFor: ['D', 'I'],
    avoidFor: ['S'],
    timing: 'middle',
  },
  exclusivity: {
    id: 'exclusivity',
    name: 'Exclusividade',
    category: 'urgency',
    description: 'Acesso restrito gera desejo',
    effectiveness: 7,
    icon: '👑',
    color: 'text-warning bg-warning/10',
    examples: [
      'Acesso antecipado para você',
      'Condição especial para parceiros',
      'Grupo seleto de clientes',
    ],
    bestFor: ['I', 'D'],
    avoidFor: [],
    timing: 'any',
  },

  // SOCIAL
  social_proof: {
    id: 'social_proof',
    name: 'Prova Social',
    category: 'social',
    description: 'Se outros fazem, deve ser bom',
    effectiveness: 9,
    icon: '👥',
    color: 'text-info bg-info/10',
    examples: [
      '500+ empresas já usam',
      'Líder de mercado no segmento',
      'Avaliação 4.9/5 estrelas',
    ],
    bestFor: ['I', 'S'],
    avoidFor: [],
    timing: 'early',
  },
  authority: {
    id: 'authority',
    name: 'Autoridade',
    category: 'social',
    description: 'Confiança em especialistas',
    effectiveness: 9,
    icon: '🎓',
    color: 'text-primary bg-primary/10',
    examples: [
      'Segundo pesquisa da Harvard',
      'Recomendado por especialistas',
      '20 anos de experiência',
    ],
    bestFor: ['C', 'D'],
    avoidFor: [],
    timing: 'early',
  },
  consensus: {
    id: 'consensus',
    name: 'Consenso',
    category: 'social',
    description: 'Maioria não pode estar errada',
    effectiveness: 7,
    icon: '✅',
    color: 'text-success bg-success/10',
    examples: [
      '9 em cada 10 recomendam',
      'Escolha preferida do mercado',
      'Tendência mundial',
    ],
    bestFor: ['S', 'I'],
    avoidFor: ['D'],
    timing: 'middle',
  },
  testimonial: {
    id: 'testimonial',
    name: 'Depoimentos',
    category: 'social',
    description: 'Experiências reais de outros',
    effectiveness: 8,
    icon: '💬',
    color: 'text-success bg-success/10',
    examples: [
      'Veja o que o João da empresa X disse',
      'Case de sucesso com resultados reais',
      'Depoimento do diretor da...',
    ],
    bestFor: ['I', 'S', 'C'],
    avoidFor: [],
    timing: 'middle',
  },

  // EMOCIONAL
  storytelling: {
    id: 'storytelling',
    name: 'Storytelling',
    category: 'emotional',
    description: 'Histórias criam conexão',
    effectiveness: 8,
    icon: '📖',
    color: 'text-accent bg-accent/10',
    examples: [
      'Deixa eu te contar como começamos',
      'Um cliente tinha o mesmo problema',
      'A história por trás da solução',
    ],
    bestFor: ['I', 'S'],
    avoidFor: ['D', 'C'],
    timing: 'early',
  },
  belonging: {
    id: 'belonging',
    name: 'Pertencimento',
    category: 'emotional',
    description: 'Fazer parte de algo maior',
    effectiveness: 7,
    icon: '🤝',
    color: 'text-destructive bg-destructive/10',
    examples: [
      'Junte-se à nossa comunidade',
      'Faça parte do movimento',
      'Você será um dos nossos',
    ],
    bestFor: ['I', 'S'],
    avoidFor: ['D'],
    timing: 'closing',
  },
  anticipation: {
    id: 'anticipation',
    name: 'Antecipação',
    category: 'emotional',
    description: 'Expectativa gera dopamina',
    effectiveness: 7,
    icon: '🎁',
    color: 'text-secondary bg-secondary/10',
    examples: [
      'Imagine quando você tiver isso',
      'Pense nos resultados em 6 meses',
      'Em breve você vai ver a diferença',
    ],
    bestFor: ['I'],
    avoidFor: ['C'],
    timing: 'middle',
  },
  empathy: {
    id: 'empathy',
    name: 'Empatia',
    category: 'emotional',
    description: 'Entender a dor do cliente',
    effectiveness: 9,
    icon: '❤️',
    color: 'text-destructive bg-destructive/5',
    examples: [
      'Eu entendo sua frustração',
      'Já passei por isso também',
      'Sei como é difícil essa situação',
    ],
    bestFor: ['S', 'I'],
    avoidFor: [],
    timing: 'early',
  },

  // LÓGICO
  specificity: {
    id: 'specificity',
    name: 'Especificidade',
    category: 'logic',
    description: 'Detalhes geram credibilidade',
    effectiveness: 9,
    icon: '📊',
    color: 'text-info bg-info/10',
    examples: [
      'Aumento de 37,2% nas vendas',
      'Economia de R$ 12.847/mês',
      'Implementação em 14 dias úteis',
    ],
    bestFor: ['C', 'D'],
    avoidFor: [],
    timing: 'middle',
  },
  reason_why: {
    id: 'reason_why',
    name: 'Razão/Porque',
    category: 'logic',
    description: 'Justificativa aumenta aceitação',
    effectiveness: 8,
    icon: '🧠',
    color: 'text-muted-foreground bg-muted',
    examples: [
      'Porque nossa metodologia é única',
      'O motivo é simples: qualidade',
      'Funciona porque foi testado',
    ],
    bestFor: ['C', 'S'],
    avoidFor: [],
    timing: 'any',
  },
  comparison: {
    id: 'comparison',
    name: 'Comparação',
    category: 'logic',
    description: 'Contraste evidencia valor',
    effectiveness: 8,
    icon: '⚖️',
    color: 'text-muted-foreground bg-muted',
    examples: [
      'Comparado ao concorrente X',
      'Antes vs Depois',
      'Investimento vs Retorno',
    ],
    bestFor: ['C', 'D'],
    avoidFor: [],
    timing: 'middle',
  },
  guarantee: {
    id: 'guarantee',
    name: 'Garantia',
    category: 'logic',
    description: 'Reduz risco percebido',
    effectiveness: 9,
    icon: '🛡️',
    color: 'text-success bg-success/10',
    examples: [
      'Garantia de 30 dias ou dinheiro de volta',
      'Sem compromisso, pode cancelar',
      'Risco zero para você',
    ],
    bestFor: ['S', 'C'],
    avoidFor: [],
    timing: 'closing',
  },

  // RECIPROCIDADE
  gift: {
    id: 'gift',
    name: 'Presente/Valor',
    category: 'reciprocity',
    description: 'Dar antes de pedir',
    effectiveness: 9,
    icon: '🎁',
    color: 'text-fuchsia-600 bg-fuchsia-100',
    examples: [
      'Preparei esse relatório para você',
      'Fica com esse material gratuito',
      'Deixa eu te ajudar com isso primeiro',
    ],
    bestFor: ['S', 'I'],
    avoidFor: [],
    timing: 'early',
  },
  concession: {
    id: 'concession',
    name: 'Concessão',
    category: 'reciprocity',
    description: 'Ceder algo para receber',
    effectiveness: 7,
    icon: '🤲',
    color: 'text-lime-600 bg-lime-100',
    examples: [
      'Consigo reduzir 10% se fechar hoje',
      'Posso incluir isso sem custo',
      'Vou abrir uma exceção para você',
    ],
    bestFor: ['D', 'C'],
    avoidFor: [],
    timing: 'closing',
  },
  personalization: {
    id: 'personalization',
    name: 'Personalização',
    category: 'reciprocity',
    description: 'Algo feito especialmente para ele',
    effectiveness: 8,
    icon: '✨',
    color: 'text-warning bg-warning/10',
    examples: [
      'Preparei isso pensando no seu caso',
      'Customizei para sua empresa',
      'Adaptei à sua realidade',
    ],
    bestFor: ['I', 'S', 'C'],
    avoidFor: [],
    timing: 'middle',
  },

  // COMPROMISSO
  commitment: {
    id: 'commitment',
    name: 'Compromisso',
    category: 'commitment',
    description: 'Manter palavra dada',
    effectiveness: 8,
    icon: '🎯',
    color: 'text-sky-600 bg-sky-100',
    examples: [
      'Você mencionou que queria resolver isso',
      'Como combinamos na última reunião',
      'Seguindo seu objetivo de...',
    ],
    bestFor: ['S', 'C'],
    avoidFor: [],
    timing: 'closing',
  },
  consistency: {
    id: 'consistency',
    name: 'Consistência',
    category: 'commitment',
    description: 'Pessoas mantêm comportamentos',
    effectiveness: 7,
    icon: '🔄',
    color: 'text-info bg-info/5',
    examples: [
      'Você sempre foi inovador',
      'Como empresa que preza qualidade',
      'Mantendo sua reputação de...',
    ],
    bestFor: ['S', 'C'],
    avoidFor: ['D'],
    timing: 'middle',
  },
  small_yes: {
    id: 'small_yes',
    name: 'Pequenos Sins',
    category: 'commitment',
    description: 'Sequência de acordos menores',
    effectiveness: 8,
    icon: '👍',
    color: 'text-success bg-success/5',
    examples: [
      'Faz sentido para você?',
      'Concorda com essa análise?',
      'Posso enviar mais detalhes?',
    ],
    bestFor: ['S', 'C'],
    avoidFor: ['D'],
    timing: 'any',
  },
  public_commitment: {
    id: 'public_commitment',
    name: 'Compromisso Público',
    category: 'commitment',
    description: 'Declaração perante outros',
    effectiveness: 7,
    icon: '📢',
    color: 'text-warning bg-warning/5',
    examples: [
      'Posso contar com você no evento?',
      'Confirmo com a equipe então?',
      'Anuncio para o time?',
    ],
    bestFor: ['I', 'D'],
    avoidFor: ['S'],
    timing: 'closing',
  },
};

export const TRIGGER_CATEGORIES: Record<TriggerCategory, { name: string; icon: string; color: string }> = {
  urgency: { name: 'Urgência', icon: '⚡', color: 'text-destructive' },
  social: { name: 'Prova Social', icon: '👥', color: 'text-info' },
  emotional: { name: 'Emocional', icon: '❤️', color: 'text-accent' },
  logic: { name: 'Lógico', icon: '🧠', color: 'text-info' },
  reciprocity: { name: 'Reciprocidade', icon: '🎁', color: 'text-secondary' },
  commitment: { name: 'Compromisso', icon: '🎯', color: 'text-success' },
};
