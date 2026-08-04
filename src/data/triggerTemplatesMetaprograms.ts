// ==============================================
// METAPROGRAM-SPECIFIC TRIGGER TEMPLATES
// Templates adaptados por Metaprogramas (Direção, Referência, Ação, Opções)
// ==============================================

import { TriggerType } from '@/types/triggers';

export type MetaprogramType = 
  | 'toward'       // Motivado por ganhos
  | 'away_from'    // Motivado por evitar dor
  | 'internal'     // Decide baseado em si mesmo
  | 'external'     // Decide baseado em outros
  | 'proactive'    // Age primeiro
  | 'reactive'     // Espera, analisa
  | 'options'      // Quer possibilidades
  | 'procedures';  // Quer passos claros

export interface MetaprogramTriggerTemplate {
  id: string;
  triggerId: TriggerType | string;
  metaprogram: MetaprogramType;
  template: string;
  keywords: string[];
  tips: string[];
}

// ============================================
// TEMPLATES POR TRIGGER E METAPROGRAMA
// ============================================
export const METAPROGRAM_TRIGGER_TEMPLATES: MetaprogramTriggerTemplate[] = [
  // ========== TOWARD vs AWAY_FROM ==========
  
  // Scarcity - Toward (foco no que ganha)
  { id: 'scarcity-toward', triggerId: 'scarcity', metaprogram: 'toward', template: '{nome}, restam {quantidade} vagas para garantir {benefício_principal}. Você está dentro?', keywords: ['garantir', 'conquistar', 'alcançar', 'obter'], tips: ['Foque no benefício de estar dentro', 'Destaque o que ganha'] },
  // Scarcity - Away From (foco no que perde)
  { id: 'scarcity-away_from', triggerId: 'scarcity', metaprogram: 'away_from', template: '{nome}, restam {quantidade} vagas. Depois disso, você perde a chance de {benefício_principal}.', keywords: ['perder', 'evitar', 'escapar', 'proteger'], tips: ['Foque na perda de não agir', 'Destaque o que deixa de ter'] },

  // Urgency - Toward
  { id: 'urgency-toward', triggerId: 'urgency', metaprogram: 'toward', template: '{nome}, até {data} você pode conquistar {resultado}. Vamos garantir isso?', keywords: ['conquistar', 'garantir', 'aproveitar', 'conseguir'], tips: ['Prazo para ganhar algo', 'Foco na recompensa'] },
  // Urgency - Away From
  { id: 'urgency-away_from', triggerId: 'urgency', metaprogram: 'away_from', template: '{nome}, depois de {data} você perde {benefício}. Não deixe isso escapar.', keywords: ['perde', 'escapar', 'acabar', 'desaparecer'], tips: ['Prazo para evitar perda', 'Foco na consequência negativa'] },

  // Loss Aversion - Toward
  { id: 'loss_aversion-toward', triggerId: 'loss_aversion', metaprogram: 'toward', template: '{nome}, você pode recuperar R$ {valor}/mês que está deixando na mesa. Vamos capturar isso?', keywords: ['recuperar', 'capturar', 'resgatar', 'aproveitar'], tips: ['Reframe perda como ganho potencial', 'Foco em oportunidade'] },
  // Loss Aversion - Away From
  { id: 'loss_aversion-away_from', triggerId: 'loss_aversion', metaprogram: 'away_from', template: '{nome}, cada dia você perde R$ {valor}. Quanto mais espera, mais escapa do seu bolso.', keywords: ['perde', 'escapa', 'desperdiça', 'joga fora'], tips: ['Maximize a dor da perda', 'Use linguagem de escape'] },

  // Future Pacing - Toward
  { id: 'future_pacing-toward', triggerId: 'future_pacing', metaprogram: 'toward', template: '{nome}, imagine daqui 6 meses celebrando {conquista}. Como você se sente atingindo esse objetivo?', keywords: ['celebrando', 'atingindo', 'conquistando', 'alcançando'], tips: ['Projete sucesso positivo', 'Use linguagem de celebração'] },
  // Future Pacing - Away From
  { id: 'future_pacing-away_from', triggerId: 'future_pacing', metaprogram: 'away_from', template: '{nome}, imagine daqui 6 meses livre de {problema}. Como é não ter mais essa dor de cabeça?', keywords: ['livre', 'sem', 'acabou', 'resolvido'], tips: ['Projete ausência de problema', 'Use linguagem de alívio'] },

  // Guarantee - Toward
  { id: 'guarantee-toward', triggerId: 'guarantee', metaprogram: 'toward', template: '{nome}, com nossa garantia, você só tem a ganhar: {garantia}. É só upside.', keywords: ['ganhar', 'upside', 'vantagem', 'benefício'], tips: ['Posicione garantia como bônus', 'Foco no que ganha'] },
  // Guarantee - Away From
  { id: 'guarantee-away_from', triggerId: 'guarantee', metaprogram: 'away_from', template: '{nome}, com nossa garantia você elimina qualquer risco: {garantia}. Zero chance de perder.', keywords: ['elimina', 'zero', 'protege', 'evita'], tips: ['Posicione garantia como proteção', 'Foco no que não perde'] },

  // ========== INTERNAL vs EXTERNAL ==========
  
  // Authority - Internal
  { id: 'authority-internal', triggerId: 'authority', metaprogram: 'internal', template: '{nome}, com base na sua própria análise: {dados}. O que seu instinto diz?', keywords: ['sua análise', 'você decide', 'seu critério', 'sua avaliação'], tips: ['Valide a autonomia decisória', 'Apresente dados para ELE avaliar'] },
  // Authority - External
  { id: 'authority-external', triggerId: 'authority', metaprogram: 'external', template: '{nome}, {fonte} e {especialista} recomendam isso. O mercado inteiro valida.', keywords: ['recomendam', 'validam', 'aprovam', 'confiam'], tips: ['Use autoridades externas', 'Mostre validação de terceiros'] },

  // Social Proof - Internal
  { id: 'social_proof-internal', triggerId: 'social_proof', metaprogram: 'internal', template: '{nome}, {quantidade} empresas escolheram isso. Mas o que importa é: faz sentido PRA VOCÊ?', keywords: ['pra você', 'seu caso', 'sua situação', 'você decide'], tips: ['Apresente dados mas devolva decisão', 'Respeite autonomia'] },
  // Social Proof - External
  { id: 'social_proof-external', triggerId: 'social_proof', metaprogram: 'external', template: '{nome}, {quantidade} empresas já validaram isso. {referência} e {referência2} aprovam. O consenso é claro.', keywords: ['validaram', 'aprovam', 'consenso', 'todos'], tips: ['Maximize vozes externas', 'Mostre aprovação coletiva'] },

  // Testimonial - Internal
  { id: 'testimonial-internal', triggerId: 'testimonial', metaprogram: 'internal', template: '{nome}, {cliente} teve esses resultados: {resultado}. Você pode avaliar se aplicaria ao seu caso.', keywords: ['você pode avaliar', 'seu caso', 'analisar', 'decidir'], tips: ['Apresente caso para análise própria', 'Não force conclusão'] },
  // Testimonial - External
  { id: 'testimonial-external', triggerId: 'testimonial', metaprogram: 'external', template: '{nome}, {cliente} diz: "{depoimento}". Quando {quantidade} clientes dizem isso, vale ouvir.', keywords: ['dizem', 'afirmam', 'recomendam', 'clientes'], tips: ['Use muitas vozes', 'Enfatize quantidade de validações'] },

  // Identity Shift - Internal
  { id: 'identity_shift-internal', triggerId: 'identity_shift', metaprogram: 'internal', template: '{nome}, no fundo, você sabe que tipo de profissional você é. Essa decisão reflete isso.', keywords: ['você sabe', 'sua essência', 'quem você é', 'seu padrão'], tips: ['Apele para autoconhecimento', 'Deixe cliente definir identidade'] },
  // Identity Shift - External
  { id: 'identity_shift-external', triggerId: 'identity_shift', metaprogram: 'external', template: '{nome}, o mercado vê você como {identidade}. Líderes como {referência} fazem essa escolha.', keywords: ['o mercado vê', 'líderes', 'reconhecem', 'classificam'], tips: ['Use percepção externa', 'Cite como outros o veem'] },

  // ========== PROACTIVE vs REACTIVE ==========

  // Urgency - Proactive
  { id: 'urgency-proactive', triggerId: 'urgency', metaprogram: 'proactive', template: '{nome}, vamos agir agora: até {data} fechamos isso. Qual o primeiro passo?', keywords: ['agir', 'fazer', 'executar', 'começar'], tips: ['Proponha ação imediata', 'Use linguagem de movimento'] },
  // Urgency - Reactive
  { id: 'urgency-reactive', triggerId: 'urgency', metaprogram: 'reactive', template: '{nome}, entendo que você precisa analisar. Até {data} temos tempo - quando você terá uma resposta?', keywords: ['analisar', 'considerar', 'avaliar', 'refletir'], tips: ['Dê tempo para processar', 'Mas estabeleça prazo'] },

  // Small Yes - Proactive
  { id: 'small_yes-proactive', triggerId: 'small_yes', metaprogram: 'proactive', template: '{nome}, vamos dar o primeiro passo agora? Posso {pequena_ação}?', keywords: ['vamos', 'agora', 'fazer', 'começar'], tips: ['Proponha ação pequena imediata', 'Use "vamos"'] },
  // Small Yes - Reactive
  { id: 'small_yes-reactive', triggerId: 'small_yes', metaprogram: 'reactive', template: '{nome}, sem compromisso por agora: posso te enviar {material} para você analisar?', keywords: ['analisar', 'considerar', 'sem compromisso', 'avaliar'], tips: ['Dê material para processar', 'Remova pressão'] },

  // Commitment - Proactive
  { id: 'commitment-proactive', triggerId: 'commitment', metaprogram: 'proactive', template: '{nome}, você mencionou que queria {objetivo}. Vamos fazer acontecer agora?', keywords: ['fazer acontecer', 'executar', 'realizar', 'agir'], tips: ['Conecte compromisso a ação', 'Proponha movimento'] },
  // Commitment - Reactive
  { id: 'commitment-reactive', triggerId: 'commitment', metaprogram: 'reactive', template: '{nome}, você mencionou que queria {objetivo}. Quando você acha que será o momento certo para isso?', keywords: ['acha', 'momento', 'quando', 'considera'], tips: ['Pergunte sobre timing', 'Deixe cliente definir ritmo'] },

  // Pattern Interrupt - Proactive
  { id: 'pattern_interrupt-proactive', triggerId: 'pattern_interrupt', metaprogram: 'proactive', template: '{nome}, para tudo! Vamos fazer diferente: {proposta_inesperada}. Topa?', keywords: ['fazer', 'vamos', 'topa', 'ação'], tips: ['Proponha ação inesperada', 'Use energia alta'] },
  // Pattern Interrupt - Reactive
  { id: 'pattern_interrupt-reactive', triggerId: 'pattern_interrupt', metaprogram: 'reactive', template: '{nome}, antes de você responder, considere isso: {insight_inesperado}. Faz você pensar diferente?', keywords: ['considere', 'pensar', 'refletir', 'antes'], tips: ['Dê algo para processar', 'Mude a perspectiva'] },

  // ========== OPTIONS vs PROCEDURES ==========

  // Guarantee - Options
  { id: 'guarantee-options', triggerId: 'guarantee', metaprogram: 'options', template: '{nome}, você tem várias formas de garantia: {opção1}, {opção2} ou {opção3}. Qual combina mais?', keywords: ['opções', 'formas', 'alternativas', 'escolher'], tips: ['Ofereça múltiplas garantias', 'Deixe escolher'] },
  // Guarantee - Procedures
  { id: 'guarantee-procedures', triggerId: 'guarantee', metaprogram: 'procedures', template: '{nome}, funciona assim: passo 1 - você testa. Passo 2 - se não funcionar, fazemos {reversão}. Simples.', keywords: ['passo', 'processo', 'funciona assim', 'primeiro'], tips: ['Explique o processo', 'Use sequência clara'] },

  // Double Bind - Options
  { id: 'paradox_double_bind-options', triggerId: 'paradox_double_bind', metaprogram: 'options', template: '{nome}, você pode ir por A, B ou C - todas te levam ao resultado. Qual caminho te atrai?', keywords: ['caminhos', 'opções', 'possibilidades', 'alternativas'], tips: ['Ofereça múltiplos caminhos', 'Todas levam ao sim'] },
  // Double Bind - Procedures
  { id: 'paradox_double_bind-procedures', triggerId: 'paradox_double_bind', metaprogram: 'procedures', template: '{nome}, o processo é: escolha A ou B, depois seguimos o passo 2 juntos. Qual você prefere começar?', keywords: ['processo', 'passo', 'seguimos', 'começar'], tips: ['Estruture a escolha', 'Mostre próximos passos'] },

  // Cognitive Ease - Options
  { id: 'cognitive_ease-options', triggerId: 'cognitive_ease', metaprogram: 'options', template: '{nome}, você pode fazer isso de várias formas: {opções}. Todas simples. Escolha a sua.', keywords: ['formas', 'escolha', 'opções', 'flexibilidade'], tips: ['Mostre flexibilidade', 'Todas opções são fáceis'] },
  // Cognitive Ease - Procedures
  { id: 'cognitive_ease-procedures', triggerId: 'cognitive_ease', metaprogram: 'procedures', template: '{nome}, é simples: passo 1, passo 2, pronto. Seguindo esse processo, você não tem como errar.', keywords: ['passo', 'processo', 'seguindo', 'sequência'], tips: ['Dê sequência clara', 'Mostre que é impossível errar'] },

  // Comparison - Options
  { id: 'comparison-options', triggerId: 'comparison', metaprogram: 'options', template: '{nome}, olha as opções do mercado: {comparativo}. Você pode explorar qualquer caminho.', keywords: ['opções', 'explorar', 'possibilidades', 'caminhos'], tips: ['Apresente landscape de opções', 'Destaque a sua sem forçar'] },
  // Comparison - Procedures
  { id: 'comparison-procedures', triggerId: 'comparison', metaprogram: 'procedures', template: '{nome}, análise passo a passo: critério 1: {}, critério 2: {}, critério 3: {}. Seguindo essa lógica...', keywords: ['passo a passo', 'critério', 'análise', 'metodologia'], tips: ['Use metodologia de comparação', 'Seja sistemático'] },

  // Specificity - Options
  { id: 'specificity-options', triggerId: 'specificity', metaprogram: 'options', template: '{nome}, os dados mostram várias perspectivas: {dado1}, {dado2}, {dado3}. Qual ângulo te interessa mais?', keywords: ['perspectivas', 'ângulos', 'dimensões', 'aspectos'], tips: ['Apresente dados multifacetados', 'Deixe explorar'] },
  // Specificity - Procedures
  { id: 'specificity-procedures', triggerId: 'specificity', metaprogram: 'procedures', template: '{nome}, vou te mostrar os números na ordem: primeiro ROI, depois payback, depois economia. Vamos?', keywords: ['ordem', 'primeiro', 'depois', 'sequência'], tips: ['Apresente dados em sequência', 'Siga uma lógica clara'] },

  // Gift - Options
  { id: 'gift-options', triggerId: 'gift', metaprogram: 'options', template: '{nome}, preparei alguns recursos pra você: {recurso1}, {recurso2} ou {recurso3}. Qual prefere receber?', keywords: ['alguns', 'qual', 'prefere', 'escolher'], tips: ['Ofereça variedade de gifts', 'Deixe escolher'] },
  // Gift - Procedures
  { id: 'gift-procedures', triggerId: 'gift', metaprogram: 'procedures', template: '{nome}, vou te enviar {recurso} em 3 partes: hoje a introdução, amanhã o aprofundamento, depois os templates.', keywords: ['partes', 'hoje', 'amanhã', 'depois'], tips: ['Dê gift em etapas', 'Crie expectativa sequencial'] },

  // Storytelling - Options
  { id: 'storytelling-options', triggerId: 'storytelling', metaprogram: 'options', template: '{nome}, tenho 3 histórias que podem te interessar: {tema1}, {tema2} ou {tema3}. Qual você quer ouvir?', keywords: ['histórias', 'qual', 'quer', 'escolha'], tips: ['Ofereça opções de narrativa', 'Deixe escolher o tema'] },
  // Storytelling - Procedures
  { id: 'storytelling-procedures', triggerId: 'storytelling', metaprogram: 'procedures', template: '{nome}, deixa eu te contar passo a passo: primeiro o problema, depois a jornada, por fim o resultado. Começando...', keywords: ['passo a passo', 'primeiro', 'depois', 'por fim'], tips: ['Estruture a narrativa', 'Siga a jornada do herói'] },
];

// ============================================
// HELPER FUNCTIONS
// ============================================
export function getMetaprogramTemplatesForTrigger(triggerId: string, metaprogram: MetaprogramType): MetaprogramTriggerTemplate[] {
  return METAPROGRAM_TRIGGER_TEMPLATES.filter(t => t.triggerId === triggerId && t.metaprogram === metaprogram);
}

export function getMetaprogramKeywords(metaprogram: MetaprogramType): string[] {
  const keywordSets: Record<MetaprogramType, string[]> = {
    toward: ['ganhar', 'conquistar', 'alcançar', 'obter', 'conseguir', 'aproveitar', 'benefício', 'vantagem', 'oportunidade', 'sucesso'],
    away_from: ['evitar', 'escapar', 'proteger', 'prevenir', 'eliminar', 'resolver', 'parar de', 'livrar-se', 'problema', 'risco'],
    internal: ['você decide', 'sua análise', 'seu critério', 'na sua opinião', 'você sabe', 'você sente', 'seu instinto', 'sua avaliação'],
    external: ['outros dizem', 'o mercado', 'especialistas', 'pesquisas mostram', 'é reconhecido', 'validado por', 'aprovado por', 'recomendado'],
    proactive: ['fazer', 'agir', 'começar', 'iniciar', 'executar', 'vamos', 'tomar ação', 'implementar', 'já', 'agora'],
    reactive: ['analisar', 'considerar', 'avaliar', 'pensar', 'refletir', 'quando estiver pronto', 'no seu tempo', 'sem pressa'],
    options: ['opções', 'alternativas', 'possibilidades', 'formas', 'caminhos', 'escolhas', 'flexibilidade', 'variedade'],
    procedures: ['passo a passo', 'processo', 'método', 'sequência', 'ordem', 'primeiro', 'depois', 'etapa', 'fase'],
  };
  return keywordSets[metaprogram];
}

export function detectMetaprogramFromText(text: string): Partial<Record<MetaprogramType, number>> {
  const scores: Partial<Record<MetaprogramType, number>> = {};
  const lowerText = text.toLowerCase();

  Object.entries({
    toward: ['quero', 'preciso conquistar', 'objetivo', 'meta', 'alcançar', 'ganhar', 'crescer'],
    away_from: ['problema', 'dor', 'evitar', 'medo de', 'não quero', 'resolver', 'parar de'],
    internal: ['eu acho', 'na minha opinião', 'eu sei', 'eu sinto', 'pra mim', 'decidi'],
    external: ['o que acham', 'disseram', 'indicaram', 'recomendaram', 'outros fazem', 'pesquisa mostra'],
    proactive: ['vamos fazer', 'já', 'agora', 'começa logo', 'não espero', 'ação'],
    reactive: ['preciso pensar', 'vou analisar', 'calma', 'sem pressa', 'avaliar primeiro'],
    options: ['possibilidades', 'alternativas', 'outras formas', 'flexível', 'opções'],
    procedures: ['como funciona', 'qual o processo', 'passo a passo', 'etapas', 'método'],
  } as Record<MetaprogramType, string[]>).forEach(([program, keywords]) => {
    const count = keywords.filter(kw => lowerText.includes(kw)).length;
    if (count > 0) {
      scores[program as MetaprogramType] = count;
    }
  });

  return scores;
}

export function adaptTemplateToMetaprogram(template: string, metaprogram: MetaprogramType): string {
  const replacements: Record<MetaprogramType, Record<string, string>> = {
    toward: { 'evitar': 'conquistar', 'problema': 'oportunidade', 'perder': 'ganhar', 'risco': 'possibilidade' },
    away_from: { 'ganhar': 'não perder', 'conquistar': 'proteger', 'oportunidade': 'evitar problema', 'benefício': 'proteção' },
    internal: { 'outros dizem': 'você pode avaliar', 'o mercado': 'seu próprio critério', 'especialistas': 'sua análise' },
    external: { 'você decide': 'especialistas recomendam', 'na sua opinião': 'o mercado valida', 'seu critério': 'consenso do mercado' },
    proactive: { 'considere': 'faça', 'pense': 'aja', 'avalie': 'execute', 'quando puder': 'agora' },
    reactive: { 'faça agora': 'quando estiver pronto', 'imediatamente': 'no seu tempo', 'já': 'considere' },
    options: { 'o processo é': 'as opções são', 'passo a passo': 'de várias formas' },
    procedures: { 'você pode': 'o primeiro passo é', 'opções': 'o processo', 'escolha': 'siga' },
  };

  let adapted = template;
  Object.entries(replacements[metaprogram]).forEach(([from, to]) => {
    adapted = adapted.replace(new RegExp(from, 'gi'), to);
  });

  return adapted;
}
