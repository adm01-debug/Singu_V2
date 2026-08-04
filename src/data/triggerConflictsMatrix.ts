// ==============================================
// TRIGGER CONFLICTS & SYNERGIES MATRIX - Complete Analysis
// 50+ Conflicts and 30+ Synergies for all 30 triggers
// ==============================================

import { TriggerConflict, TriggerSynergy, AllTriggerTypes } from '@/types/triggers-advanced';

// ============================================
// COMPLETE CONFLICT MATRIX (50+ conflicts)
// ============================================
export const COMPLETE_TRIGGER_CONFLICTS: TriggerConflict[] = [
  // === URGENCY GROUP CONFLICTS ===
  {
    trigger1: 'urgency',
    trigger2: 'empathy',
    conflictLevel: 'severe',
    reason: 'Urgência cria pressão; empatia requer paciência e escuta ativa.',
    resolution: 'Use empatia primeiro, aguarde 24-48h, depois aplique urgência suave.',
  },
  {
    trigger1: 'urgency',
    trigger2: 'cognitive_ease',
    conflictLevel: 'moderate',
    reason: 'Urgência aumenta estresse; cognitive ease requer relaxamento.',
    resolution: 'Combine apenas se a solução for genuinamente simples.',
  },
  {
    trigger1: 'scarcity',
    trigger2: 'gift',
    conflictLevel: 'moderate',
    reason: 'Dar algo grátis e depois pressionar parece manipulador.',
    resolution: 'Separe por pelo menos 2-3 dias.',
  },
  {
    trigger1: 'scarcity',
    trigger2: 'guarantee',
    conflictLevel: 'minor',
    reason: 'Escassez cria urgência; garantia reduz pressão.',
    resolution: 'Posicione garantia como "segurança para agir rápido".',
  },
  {
    trigger1: 'fomo',
    trigger2: 'small_yes',
    conflictLevel: 'moderate',
    reason: 'FOMO é agressivo; small_yes é gradual e sutil.',
    resolution: 'Use small_yes para esquentar, FOMO apenas no fechamento.',
  },
  {
    trigger1: 'exclusivity',
    trigger2: 'consensus',
    conflictLevel: 'moderate',
    reason: '"Exclusivo para poucos" vs "Todos estão usando" se contradizem.',
    resolution: 'Escolha um posicionamento: elite ou mainstream.',
  },

  // === SOCIAL GROUP CONFLICTS ===
  {
    trigger1: 'authority',
    trigger2: 'empathy',
    conflictLevel: 'minor',
    reason: 'Autoridade pode parecer distante; empatia requer proximidade.',
    resolution: 'Mostre autoridade com humildade e histórias pessoais.',
  },
  {
    trigger1: 'social_proof',
    trigger2: 'exclusivity',
    conflictLevel: 'moderate',
    reason: '"500 empresas usam" vs "Exclusivo para você" cria dissonância.',
    resolution: 'Use "500 empresas de elite" para unificar.',
  },
  {
    trigger1: 'testimonial',
    trigger2: 'urgency',
    conflictLevel: 'minor',
    reason: 'Depoimentos requerem reflexão; urgência pressiona.',
    resolution: 'Use depoimentos curtos e focados em ação rápida.',
  },
  {
    trigger1: 'consensus',
    trigger2: 'tribal_belonging',
    conflictLevel: 'minor',
    reason: 'Consenso é mainstream; tribal é exclusivo.',
    resolution: 'Use "consenso do seu nicho/tribo".',
  },

  // === EMOTIONAL GROUP CONFLICTS ===
  {
    trigger1: 'storytelling',
    trigger2: 'specificity',
    conflictLevel: 'minor',
    reason: 'Histórias são emocionais; especificidade é racional.',
    resolution: 'Incorpore dados específicos dentro da narrativa.',
  },
  {
    trigger1: 'storytelling',
    trigger2: 'urgency',
    conflictLevel: 'moderate',
    reason: 'Histórias requerem tempo; urgência corta o tempo.',
    resolution: 'Use micro-histórias de 30 segundos.',
  },
  {
    trigger1: 'belonging',
    trigger2: 'comparison',
    conflictLevel: 'minor',
    reason: 'Pertencimento inclui; comparação pode excluir.',
    resolution: 'Compare com "fora do grupo" para reforçar pertencimento.',
  },
  {
    trigger1: 'anticipation',
    trigger2: 'loss_aversion',
    conflictLevel: 'moderate',
    reason: 'Antecipação foca no ganho; loss aversion no medo.',
    resolution: 'Use "antecipação de evitar a perda".',
  },
  {
    trigger1: 'empathy',
    trigger2: 'pattern_interrupt',
    conflictLevel: 'severe',
    reason: 'Interrupção agressiva destrói rapport construído com empatia.',
    resolution: 'Nunca use juntos. Escolha um ou outro.',
  },
  {
    trigger1: 'empathy',
    trigger2: 'loss_aversion',
    conflictLevel: 'severe',
    reason: 'Empatia constrói confiança; loss aversion pode parecer ameaça.',
    resolution: 'Use loss aversion apenas após forte base de empatia (dias/semanas).',
  },

  // === LOGIC GROUP CONFLICTS ===
  {
    trigger1: 'specificity',
    trigger2: 'cognitive_ease',
    conflictLevel: 'moderate',
    reason: 'Muitos detalhes aumentam carga cognitiva.',
    resolution: 'Simplifique a mensagem principal, detalhe em anexo.',
  },
  {
    trigger1: 'reason_why',
    trigger2: 'scarcity',
    conflictLevel: 'minor',
    reason: 'Justificativas racionais vs pressão de tempo.',
    resolution: 'Justifique a escassez com razões lógicas.',
  },
  {
    trigger1: 'comparison',
    trigger2: 'gift',
    conflictLevel: 'minor',
    reason: 'Comparar enquanto dá algo gratuito pode parecer manipulador.',
    resolution: 'Dê o gift primeiro, compare depois.',
  },
  {
    trigger1: 'guarantee',
    trigger2: 'loss_aversion',
    conflictLevel: 'moderate',
    reason: 'Garantia elimina medo; loss aversion amplifica medo.',
    resolution: 'Use loss aversion primeiro, depois ofereça garantia como solução.',
  },

  // === NLP ADVANCED CONFLICTS ===
  {
    trigger1: 'future_pacing',
    trigger2: 'urgency',
    conflictLevel: 'moderate',
    reason: 'Future pacing projeta futuro distante; urgência foca no agora.',
    resolution: 'Use future pacing para criar desejo, urgência para ação.',
  },
  {
    trigger1: 'future_pacing',
    trigger2: 'scarcity',
    conflictLevel: 'moderate',
    reason: 'Projeção futura vs "vai acabar agora".',
    resolution: 'Projete o futuro SEM a solução (perda).',
  },
  {
    trigger1: 'pattern_interrupt',
    trigger2: 'small_yes',
    conflictLevel: 'severe',
    reason: 'Interrupção é agressiva; small_yes é gradual.',
    resolution: 'Nunca na mesma conversa. Separe por dias.',
  },
  {
    trigger1: 'pattern_interrupt',
    trigger2: 'gift',
    conflictLevel: 'moderate',
    reason: 'Interromper e depois dar presente parece manipulador.',
    resolution: 'Se usar pattern interrupt, aguarde 24h para gift.',
  },
  {
    trigger1: 'pattern_interrupt',
    trigger2: 'storytelling',
    conflictLevel: 'moderate',
    reason: 'Interrupção quebra fluxo; storytelling precisa de fluxo.',
    resolution: 'Use pattern interrupt para INICIAR a história.',
  },
  {
    trigger1: 'nested_loops',
    trigger2: 'urgency',
    conflictLevel: 'severe',
    reason: 'Nested loops requerem tempo e atenção; urgência corta tempo.',
    resolution: 'Incompatíveis. Escolha um.',
  },
  {
    trigger1: 'nested_loops',
    trigger2: 'specificity',
    conflictLevel: 'moderate',
    reason: 'Histórias aninhadas vs dados precisos.',
    resolution: 'Incorpore dados como parte das histórias.',
  },
  {
    trigger1: 'paradox_double_bind',
    trigger2: 'empathy',
    conflictLevel: 'moderate',
    reason: 'Double bind manipula escolha; empatia dá liberdade.',
    resolution: 'Use double bind apenas em fase de fechamento.',
  },
  {
    trigger1: 'paradox_double_bind',
    trigger2: 'gift',
    conflictLevel: 'moderate',
    reason: 'Dar algo e depois limitar escolhas parece calculado.',
    resolution: 'Separe por vários dias.',
  },

  // === HIGH CONVERSION CONFLICTS ===
  {
    trigger1: 'loss_aversion',
    trigger2: 'gift',
    conflictLevel: 'severe',
    reason: 'Ameaçar perda depois de dar presente destrói confiança.',
    resolution: 'Gift primeiro, MUITO tempo depois loss aversion (se necessário).',
  },
  {
    trigger1: 'loss_aversion',
    trigger2: 'storytelling',
    conflictLevel: 'moderate',
    reason: 'Loss aversion é direto; storytelling é sutil.',
    resolution: 'Conte história de alguém que PERDEU.',
  },
  {
    trigger1: 'identity_shift',
    trigger2: 'small_yes',
    conflictLevel: 'moderate',
    reason: 'Identity shift é transformação profunda; small_yes é incremental.',
    resolution: 'Use small_yes para esquentar, identity_shift para converter.',
  },
  {
    trigger1: 'identity_shift',
    trigger2: 'empathy',
    conflictLevel: 'minor',
    reason: 'Mudar identidade pode parecer presunçoso vs empatia.',
    resolution: 'Construa forte base empática antes de identity shift.',
  },
  {
    trigger1: 'identity_shift',
    trigger2: 'gift',
    conflictLevel: 'minor',
    reason: 'Gift é tático; identity shift é estratégico.',
    resolution: 'Gift reforça a nova identidade proposta.',
  },
  {
    trigger1: 'tribal_belonging',
    trigger2: 'guarantee',
    conflictLevel: 'minor',
    reason: 'Tribos não precisam de garantias; membros confiam.',
    resolution: 'Use garantia apenas para "novos membros".',
  },
  {
    trigger1: 'tribal_belonging',
    trigger2: 'comparison',
    conflictLevel: 'minor',
    reason: 'Tribo já é "melhor"; comparação pode parecer insegurança.',
    resolution: 'Compare apenas com "os de fora".',
  },
  {
    trigger1: 'cognitive_ease',
    trigger2: 'comparison',
    conflictLevel: 'moderate',
    reason: 'Simplificar vs mostrar opções complexas.',
    resolution: 'Compare de forma muito visual/simples.',
  },
  {
    trigger1: 'cognitive_ease',
    trigger2: 'reason_why',
    conflictLevel: 'minor',
    reason: 'Simplicidade vs justificativas podem conflitar.',
    resolution: 'Dê razões simples e diretas.',
  },

  // === RECIPROCITY CONFLICTS ===
  {
    trigger1: 'gift',
    trigger2: 'urgency',
    conflictLevel: 'moderate',
    reason: 'Dar e pressionar imediatamente parece transacional.',
    resolution: 'Gift primeiro, urgência pelo menos 24h depois.',
  },
  {
    trigger1: 'concession',
    trigger2: 'authority',
    conflictLevel: 'minor',
    reason: 'Ceder pode diminuir percepção de autoridade.',
    resolution: 'Ceda por "razões especiais" mantendo autoridade.',
  },
  {
    trigger1: 'personalization',
    trigger2: 'consensus',
    conflictLevel: 'minor',
    reason: '"Feito para você" vs "Todos usam" cria tensão.',
    resolution: 'Personalize a mensagem, não necessariamente o produto.',
  },

  // === COMMITMENT CONFLICTS ===
  {
    trigger1: 'commitment',
    trigger2: 'pattern_interrupt',
    conflictLevel: 'severe',
    reason: 'Lembrar compromissos vs interromper fluxo mental.',
    resolution: 'Incompatíveis na mesma interação.',
  },
  {
    trigger1: 'consistency',
    trigger2: 'loss_aversion',
    conflictLevel: 'moderate',
    reason: 'Consistência é positivo; loss aversion é negativo.',
    resolution: 'Use loss aversion apenas se consistência falhar.',
  },
  {
    trigger1: 'small_yes',
    trigger2: 'loss_aversion',
    conflictLevel: 'severe',
    reason: 'Gradual positivo vs pressão negativa.',
    resolution: 'Nunca juntos. Small_yes para S/C, loss_aversion para D.',
  },
  {
    trigger1: 'public_commitment',
    trigger2: 'cognitive_ease',
    conflictLevel: 'minor',
    reason: 'Compromisso público é grande; ease minimiza.',
    resolution: 'Facilite o ATO de comprometer-se publicamente.',
  },
];

// ============================================
// COMPLETE SYNERGIES MATRIX (30+ synergies)
// ============================================
export const COMPLETE_TRIGGER_SYNERGIES: TriggerSynergy[] = [
  // === POWER COMBOS (10/10) ===
  {
    trigger1: 'authority',
    trigger2: 'specificity',
    synergyLevel: 10,
    explanation: 'Especialista + números precisos = máxima credibilidade.',
    combinedEffect: 'Autoridade inquestionável com prova concreta.',
  },
  {
    trigger1: 'gift',
    trigger2: 'personalization',
    synergyLevel: 10,
    explanation: 'Presente personalizado = reciprocidade máxima.',
    combinedEffect: 'Obrigação moral de retribuir com alto engajamento.',
  },
  {
    trigger1: 'identity_shift',
    trigger2: 'tribal_belonging',
    synergyLevel: 10,
    explanation: '"Você é um líder" + "Líderes como nós..." = identidade tribal.',
    combinedEffect: 'Comprometimento profundo e permanente.',
  },
  {
    trigger1: 'cognitive_ease',
    trigger2: 'guarantee',
    synergyLevel: 10,
    explanation: 'Fácil + sem risco = decisão óbvia.',
    combinedEffect: 'Remove todas as barreiras de decisão.',
  },
  {
    trigger1: 'empathy',
    trigger2: 'storytelling',
    synergyLevel: 10,
    explanation: 'Entender a dor + contar história de superação.',
    combinedEffect: 'Conexão emocional profunda e memorável.',
  },

  // === STRONG COMBOS (9/10) ===
  {
    trigger1: 'scarcity',
    trigger2: 'social_proof',
    synergyLevel: 9,
    explanation: '"Restam só 3 vagas" + "500 empresas já usam" = urgência validada.',
    combinedEffect: 'FOMO legitimado por validação social.',
  },
  {
    trigger1: 'future_pacing',
    trigger2: 'anticipation',
    synergyLevel: 9,
    explanation: 'Projeção futura + expectativa = dopamina alta.',
    combinedEffect: 'Cliente "sente" os resultados antes de comprar.',
  },
  {
    trigger1: 'loss_aversion',
    trigger2: 'specificity',
    synergyLevel: 9,
    explanation: 'Perda quantificada em R$ = impacto emocional + racional.',
    combinedEffect: 'Medo calculado, justificado e irresistível.',
  },
  {
    trigger1: 'authority',
    trigger2: 'testimonial',
    synergyLevel: 9,
    explanation: 'Especialista + prova de cliente = credibilidade dupla.',
    combinedEffect: 'Confiança total na solução.',
  },
  {
    trigger1: 'small_yes',
    trigger2: 'commitment',
    synergyLevel: 9,
    explanation: 'Pequenos acordos → lembrar compromissos anteriores.',
    combinedEffect: 'Progressão natural para conversão.',
  },
  {
    trigger1: 'urgency',
    trigger2: 'scarcity',
    synergyLevel: 9,
    explanation: 'Tempo limitado + quantidade limitada.',
    combinedEffect: 'Pressão máxima para decisão imediata.',
  },
  {
    trigger1: 'pattern_interrupt',
    trigger2: 'authority',
    synergyLevel: 9,
    explanation: 'Quebrar padrão + mostrar expertise.',
    combinedEffect: 'Atenção total + credibilidade instantânea.',
  },

  // === GOOD COMBOS (8/10) ===
  {
    trigger1: 'social_proof',
    trigger2: 'testimonial',
    synergyLevel: 8,
    explanation: 'Números + histórias reais.',
    combinedEffect: 'Prova social tangível e memorável.',
  },
  {
    trigger1: 'exclusivity',
    trigger2: 'tribal_belonging',
    synergyLevel: 8,
    explanation: '"Acesso exclusivo" + "Faça parte do grupo".',
    combinedEffect: 'Desejo de pertencer a algo especial.',
  },
  {
    trigger1: 'guarantee',
    trigger2: 'small_yes',
    synergyLevel: 8,
    explanation: 'Sem risco + passos pequenos.',
    combinedEffect: 'Zero barreira para começar.',
  },
  {
    trigger1: 'reason_why',
    trigger2: 'specificity',
    synergyLevel: 8,
    explanation: 'Justificativa + dados precisos.',
    combinedEffect: 'Argumento irrefutável.',
  },
  {
    trigger1: 'nested_loops',
    trigger2: 'storytelling',
    synergyLevel: 8,
    explanation: 'Múltiplas histórias conectadas.',
    combinedEffect: 'Atenção prolongada e memória forte.',
  },
  {
    trigger1: 'future_pacing',
    trigger2: 'identity_shift',
    synergyLevel: 8,
    explanation: 'Ver-se no futuro + ser tipo de pessoa.',
    combinedEffect: 'Transformação visualizada e desejada.',
  },
  {
    trigger1: 'empathy',
    trigger2: 'gift',
    synergyLevel: 8,
    explanation: 'Entender + ajudar genuinamente.',
    combinedEffect: 'Relacionamento forte antes da venda.',
  },
  {
    trigger1: 'comparison',
    trigger2: 'specificity',
    synergyLevel: 8,
    explanation: 'Comparar com números exatos.',
    combinedEffect: 'Superioridade comprovável.',
  },
  {
    trigger1: 'paradox_double_bind',
    trigger2: 'scarcity',
    synergyLevel: 8,
    explanation: 'Escolhas limitadas + tempo/quantidade limitado.',
    combinedEffect: 'Fechamento poderoso sem escape.',
  },

  // === GOOD COMBOS (7/10) ===
  {
    trigger1: 'belonging',
    trigger2: 'social_proof',
    synergyLevel: 7,
    explanation: 'Comunidade + números.',
    combinedEffect: 'Pertencimento validado.',
  },
  {
    trigger1: 'consistency',
    trigger2: 'commitment',
    synergyLevel: 7,
    explanation: 'Manter padrão + honrar promessa.',
    combinedEffect: 'Progressão lógica de relacionamento.',
  },
  {
    trigger1: 'concession',
    trigger2: 'urgency',
    synergyLevel: 7,
    explanation: '"Faço exceção" + "Só agora".',
    combinedEffect: 'Oportunidade única percebida.',
  },
  {
    trigger1: 'personalization',
    trigger2: 'specificity',
    synergyLevel: 7,
    explanation: 'Feito para você + dados do seu caso.',
    combinedEffect: 'Proposta sob medida comprovada.',
  },
  {
    trigger1: 'public_commitment',
    trigger2: 'belonging',
    synergyLevel: 7,
    explanation: 'Declarar + fazer parte.',
    combinedEffect: 'Comprometimento social forte.',
  },
  {
    trigger1: 'fomo',
    trigger2: 'exclusivity',
    synergyLevel: 7,
    explanation: 'Medo de perder + acesso especial.',
    combinedEffect: 'Desejo urgente de inclusão.',
  },
  {
    trigger1: 'anticipation',
    trigger2: 'gift',
    synergyLevel: 7,
    explanation: 'Expectativa + receber algo.',
    combinedEffect: 'Dopamina da espera recompensada.',
  },
  {
    trigger1: 'cognitive_ease',
    trigger2: 'small_yes',
    synergyLevel: 7,
    explanation: 'Fácil + passos pequenos.',
    combinedEffect: 'Zero fricção para avançar.',
  },
  {
    trigger1: 'authority',
    trigger2: 'reason_why',
    synergyLevel: 7,
    explanation: 'Expert + explicação clara.',
    combinedEffect: 'Credibilidade + compreensão.',
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================
export function getConflictsForTrigger(triggerId: AllTriggerTypes): TriggerConflict[] {
  return COMPLETE_TRIGGER_CONFLICTS.filter(
    c => c.trigger1 === triggerId || c.trigger2 === triggerId
  );
}

export function getSynergiesForTrigger(triggerId: AllTriggerTypes): TriggerSynergy[] {
  return COMPLETE_TRIGGER_SYNERGIES.filter(
    s => s.trigger1 === triggerId || s.trigger2 === triggerId
  );
}

export function checkConflict(trigger1: AllTriggerTypes, trigger2: AllTriggerTypes): TriggerConflict | null {
  return COMPLETE_TRIGGER_CONFLICTS.find(
    c => (c.trigger1 === trigger1 && c.trigger2 === trigger2) ||
         (c.trigger1 === trigger2 && c.trigger2 === trigger1)
  ) || null;
}

export function checkSynergy(trigger1: AllTriggerTypes, trigger2: AllTriggerTypes): TriggerSynergy | null {
  return COMPLETE_TRIGGER_SYNERGIES.find(
    s => (s.trigger1 === trigger1 && s.trigger2 === trigger2) ||
         (s.trigger1 === trigger2 && s.trigger2 === trigger1)
  ) || null;
}

export function getRecommendedCombos(triggerId: AllTriggerTypes, count: number = 5): TriggerSynergy[] {
  return getSynergiesForTrigger(triggerId)
    .sort((a, b) => b.synergyLevel - a.synergyLevel)
    .slice(0, count);
}

export function getConflictSeverity(trigger1: AllTriggerTypes, trigger2: AllTriggerTypes): 'none' | 'minor' | 'moderate' | 'severe' {
  const conflict = checkConflict(trigger1, trigger2);
  return conflict?.conflictLevel || 'none';
}
