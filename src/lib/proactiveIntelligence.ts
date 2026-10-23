// ============================================
// TIPOS
// ============================================

export type ActionPriority = 'critical' | 'high' | 'medium' | 'low';
export type ActionCategory = 'follow_up' | 'relationship' | 'closing' | 'rescue' | 'nurture' | 'celebrate' | 'intelligence';

export interface NextBestAction {
  id: string;
  title: string;
  description: string;
  priority: ActionPriority;
  category: ActionCategory;
  icon: string;
  script?: string;
  channel: string;
  timing: string;
  reason: string;
  frameworks: string[]; // Modelos que geraram a ação
  confidence: number;
  estimatedImpact: number; // 0-100
}

export interface ApproachScript {
  id: string;
  title: string;
  scenario: string;
  opening: string;
  body: string;
  closing: string;
  channel: string;
  tone: string;
  adaptedFor: string; // Adaptação DISC+VAK
  keyPhrases: string[];
  wordsToAvoid: string[];
  emotionalHook: string;
  neuralTarget: string; // Sistema cerebral
}

export interface IntelligenceInsight {
  id: string;
  label: string;
  value: string;
  trend: 'up' | 'down' | 'stable' | 'warning';
  framework: string;
  detail: string;
}

export interface ProactiveIntelligenceResult {
  actions: NextBestAction[];
  scripts: ApproachScript[];
  insights: IntelligenceInsight[];
  healthScore: number;
  urgencyLevel: ActionPriority;
  summary: string;
}

// ============================================
// MAPAS DE LINGUAGEM DISC + VAK
// ============================================

export const DISC_APPROACH_STYLE: Record<string, { tone: string; pace: string; focus: string; openWith: string; avoid: string }> = {
  D: { tone: 'Direto e assertivo', pace: 'Rápido, sem rodeios', focus: 'Resultados e ROI', openWith: 'Benefício tangível imediato', avoid: 'Detalhes excessivos e conversa fiada' },
  I: { tone: 'Entusiasmado e sociável', pace: 'Dinâmico e envolvente', focus: 'Relacionamento e reconhecimento', openWith: 'Elogio genuíno ou novidade empolgante', avoid: 'Dados frios e formalidade excessiva' },
  S: { tone: 'Calmo e acolhedor', pace: 'Gradual e seguro', focus: 'Estabilidade e suporte', openWith: 'Referência ao relacionamento existente', avoid: 'Pressão, urgência artificial e mudanças bruscas' },
  C: { tone: 'Preciso e fundamentado', pace: 'Metódico com dados', focus: 'Qualidade e detalhes técnicos', openWith: 'Dado ou estatística relevante', avoid: 'Informalidade e promessas vagas' },
};

export const VAK_LANGUAGE: Record<string, { verbs: string[]; phrases: string[]; hook: string }> = {
  visual: { verbs: ['veja', 'observe', 'imagine', 'visualize', 'note'], phrases: ['fica claro que', 'a perspectiva é', 'o panorama mostra'], hook: 'Deixa eu te mostrar uma visão clara de' },
  auditory: { verbs: ['ouça', 'escute', 'me diga', 'converse', 'comente'], phrases: ['isso soa como', 'em harmonia com', 'faz eco com'], hook: 'Quero te contar algo que vai ressoar com você' },
  kinesthetic: { verbs: ['sinta', 'toque', 'experimente', 'construa', 'mova'], phrases: ['a sensação é de', 'concretamente falando', 'na prática'], hook: 'Quero que você sinta o impacto real de' },
  digital: { verbs: ['analise', 'considere', 'avalie', 'processe', 'entenda'], phrases: ['os dados indicam', 'logicamente falando', 'a análise mostra'], hook: 'Os números mostram algo muito interessante' },
};

export const NEURO_BRAIN_HOOKS: Record<string, { trigger: string; approach: string }> = {
  reptilian: { trigger: 'Senso de urgência + proteção', approach: 'Mostrar o que pode PERDER se não agir' },
  limbic: { trigger: 'Conexão emocional + pertencimento', approach: 'Conectar com histórias e valores pessoais' },
  neocortex: { trigger: 'Dados + lógica comprovada', approach: 'Apresentar evidências e comparativos racionais' },
};

export const CARNEGIE_PRINCIPLES: string[] = [
  'Demonstre interesse genuíno',
  'Sorria e use o nome da pessoa',
  'Deixe a outra pessoa falar',
  'Fale sobre interesses do outro',
  'Faça a pessoa se sentir importante',
  'Evite discussões e críticas',
  'Admita erros rapidamente',
  'Comece de forma amigável',
  'Obtenha "sim" logo cedo',
  'Apele para motivos nobres',
];
