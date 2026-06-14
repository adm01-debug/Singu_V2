// ==============================================
// EXTENDED TRIGGERS DATA - 12 New Advanced Triggers
// Based on Behavioral Economics, Cognitive Psychology & Persuasion Science
// ==============================================

import { 
  AdvancedMentalTrigger,
  TriggerConflict,
  TriggerSynergy,
  TriggerFallback
} from '@/types/triggers-advanced';

// ============================================
// EXTENDED TRIGGER TYPE (for internal use)
// ============================================
export type ExtendedTriggerType = 
  | 'priming'              
  | 'anchoring'            
  | 'decoy_effect'         
  | 'framing'              
  | 'curiosity_gap'        
  | 'peak_end_rule'        
  | 'endowment_effect'     
  | 'sunk_cost'            
  | 'bandwagon'            
  | 'halo_effect'          
  | 'contrast_principle'   
  | 'unity';               

// ============================================
// 12 NEW EXTENDED TRIGGERS (Reference data)
// Main definitions are now in triggersAdvancedData.ts
// ============================================
export const EXTENDED_MENTAL_TRIGGERS: Record<ExtendedTriggerType, AdvancedMentalTrigger> = {
  // ========== BEHAVIORAL ECONOMICS ==========
  priming: {
    id: 'priming',
    name: 'Priming',
    category: 'nlp_advanced',
    description: 'Ativa conceitos no subconsciente que influenciam decisões posteriores',
    effectiveness: 9,
    icon: '🧲',
    color: 'text-info bg-info/10',
    examples: [
      'Antes de falar de preço, mencione "investimento inteligente"...',
      'Use palavras como "economia", "retorno", "lucro" antes de apresentar valores',
      'Conte uma história de sucesso antes de fazer a proposta',
    ],
    bestFor: ['I', 'S'],
    avoidFor: ['C'],
    timing: 'early',
    nlpTechnique: 'Priming (Kahneman - Sistema 1)',
    neuralTarget: 'limbic',
    primaryChemical: 'dopamine',
    intensityLevels: [
      { level: 1, template: 'Falando em {conceito_positivo}...', words: ['falando em', 'por falar em'] },
      { level: 2, template: 'Isso me lembra de {conceito_positivo}...', words: ['lembra', 'remete', 'conecta'] },
      { level: 3, template: 'Empresas inteligentes sempre {ação_desejada}...', words: ['inteligentes', 'visionárias', 'líderes'] },
      { level: 4, template: 'Os melhores resultados vêm de quem {ação_desejada}...', words: ['melhores', 'extraordinários', 'excepcionais'] },
      { level: 5, template: 'Antes de qualquer coisa: {statement_poderoso}...', words: ['antes', 'primeiro', 'fundamental'] },
    ],
    fallbacks: ['storytelling', 'authority'],
    synergizes: ['future_pacing', 'anticipation', 'storytelling'],
    conflicts: ['urgency', 'scarcity'],
    resistanceIndicators: ['vamos ao que interessa', 'pode ser direto', 'sem rodeios'],
    saturationThreshold: 4,
  },

  anchoring: {
    id: 'anchoring',
    name: 'Anchoring',
    category: 'high_conversion',
    description: 'Estabelece ponto de referência alto para fazer seu preço parecer vantajoso',
    effectiveness: 10,
    icon: '⚓',
    color: 'text-info bg-info/10',
    examples: [
      'Empresas pagam até R$ 50.000/mês por isso. Nosso investimento é R$ 8.000.',
      'O prejuízo de não resolver isso é R$ 200.000/ano. Nossa solução custa R$ 30.000.',
      'Consultorias cobram R$ 2.000/hora. Nosso pacote completo sai por R$ 15.000.',
    ],
    bestFor: ['D', 'C'],
    avoidFor: ['S'],
    timing: 'middle',
    nlpTechnique: 'Anchoring (Tversky & Kahneman)',
    neuralTarget: 'neocortex',
    primaryChemical: 'serotonin',
    intensityLevels: [
      { level: 1, template: 'Normalmente isso custa {valor_alto}...', words: ['normalmente', 'geralmente', 'no mercado'] },
      { level: 2, template: 'Empresas investem até {valor_alto} nisso...', words: ['investem', 'pagam', 'desembolsam'] },
      { level: 3, template: 'O custo de não resolver é {valor_altíssimo}...', words: ['custo', 'prejuízo', 'perda'] },
      { level: 4, template: 'Comparado aos {valor_referencia} do mercado, nosso {valor_baixo} é...', words: ['comparado', 'versus', 'contra'] },
      { level: 5, template: 'Você economiza {percentual}% em relação a qualquer alternativa...', words: ['economiza', 'poupa', 'ganha'] },
    ],
    fallbacks: ['comparison', 'specificity', 'reason_why'],
    synergizes: ['comparison', 'specificity', 'loss_aversion'],
    conflicts: ['gift', 'empathy'],
    resistanceIndicators: ['isso é manipulação', 'não compare assim', 'são coisas diferentes'],
    saturationThreshold: 2,
  },

  decoy_effect: {
    id: 'decoy_effect',
    name: 'Decoy Effect',
    category: 'high_conversion',
    description: 'Adiciona uma terceira opção "isca" que torna sua opção preferida mais atraente',
    effectiveness: 8,
    icon: '🎯',
    color: 'text-warning bg-warning/10',
    examples: [
      'Plano A: R$ 500 (básico) | Plano B: R$ 1.500 (premium) | Plano C: R$ 1.400 (quase premium)',
      'Opção 1: só software | Opção 2: software + suporte | Opção 3: só suporte pelo mesmo preço',
      'Pacote Individual: R$ 200 | Pacote Família: R$ 250 | Pacote Casal: R$ 240',
    ],
    bestFor: ['C', 'S'],
    avoidFor: ['D'],
    timing: 'closing',
    nlpTechnique: 'Decoy Effect (Dan Ariely)',
    neuralTarget: 'neocortex',
    primaryChemical: 'serotonin',
    intensityLevels: [
      { level: 1, template: 'Temos três opções para você avaliar...', words: ['opções', 'alternativas', 'possibilidades'] },
      { level: 2, template: 'Deixa eu te mostrar as 3 formas de fazer isso...', words: ['formas', 'caminhos', 'maneiras'] },
      { level: 3, template: 'A maioria escolhe a opção B porque...', words: ['maioria', 'geralmente', 'normalmente'] },
      { level: 4, template: 'Olha só: por apenas {diferença} a mais você leva...', words: ['apenas', 'só', 'somente'] },
      { level: 5, template: 'Faz sentido pagar {valor_isca} por isso quando por {valor_premium} você tem...', words: ['faz sentido', 'compensa', 'vale'] },
    ],
    fallbacks: ['comparison', 'specificity'],
    synergizes: ['anchoring', 'comparison', 'paradox_double_bind'],
    conflicts: ['cognitive_ease', 'small_yes'],
    resistanceIndicators: ['parece armação', 'opções confusas', 'simplifica isso'],
    saturationThreshold: 2,
  },

  framing: {
    id: 'framing',
    name: 'Framing',
    category: 'nlp_advanced',
    description: 'Apresenta a mesma informação de forma diferente para influenciar a decisão',
    effectiveness: 9,
    icon: '🖼️',
    color: 'text-secondary bg-secondary/10',
    examples: [
      '95% de sucesso (positivo) vs 5% de falha (negativo)',
      'Você economiza R$ 500/mês vs Você perde R$ 500/mês sem isso',
      'Investimento de R$ 1.000 vs Custo de R$ 1.000',
    ],
    bestFor: ['I', 'S', 'D'],
    avoidFor: [],
    timing: 'any',
    nlpTechnique: 'Framing Effect (Kahneman & Tversky)',
    neuralTarget: 'neocortex',
    primaryChemical: 'serotonin',
    intensityLevels: [
      { level: 1, template: 'Uma forma de ver isso é...', words: ['forma', 'perspectiva', 'ângulo'] },
      { level: 2, template: 'Pense assim: {frame_positivo}...', words: ['pense', 'imagine', 'considere'] },
      { level: 3, template: 'Na prática, isso significa {benefício_enquadrado}...', words: ['significa', 'representa', 'equivale'] },
      { level: 4, template: 'Traduzindo: você {ganho_tangível}...', words: ['traduzindo', 'ou seja', 'em outras palavras'] },
      { level: 5, template: 'O que você está realmente decidindo é {reframe_poderoso}...', words: ['realmente', 'verdade', 'essência'] },
    ],
    fallbacks: ['reason_why', 'comparison'],
    synergizes: ['priming', 'storytelling', 'loss_aversion'],
    conflicts: ['specificity'],
    resistanceIndicators: ['está distorcendo', 'não é bem assim', 'depende do ponto de vista'],
    saturationThreshold: 4,
  },

  curiosity_gap: {
    id: 'curiosity_gap',
    name: 'Curiosity Gap',
    category: 'nlp_advanced',
    description: 'Cria lacuna de conhecimento que gera desejo irresistível de saber mais',
    effectiveness: 8,
    icon: '🔮',
    color: 'text-secondary bg-secondary/10',
    examples: [
      'Descobrimos algo que muda completamente a forma como você vê...',
      'Existe um erro que 90% das empresas cometem e você provavelmente também...',
      'Vou te contar algo que poucos sabem sobre...',
    ],
    bestFor: ['I', 'D'],
    avoidFor: ['C'],
    timing: 'early',
    nlpTechnique: 'Information Gap Theory (Loewenstein)',
    neuralTarget: 'limbic',
    primaryChemical: 'dopamine',
    intensityLevels: [
      { level: 1, template: 'Você sabia que...?', words: ['sabia', 'conhece', 'ouviu'] },
      { level: 2, template: 'Descobrimos algo interessante sobre...', words: ['descobrimos', 'identificamos', 'percebemos'] },
      { level: 3, template: 'Existe um segredo que as melhores empresas...', words: ['segredo', 'descoberta', 'insight'] },
      { level: 4, template: 'Poucos sabem, mas existe uma forma de...', words: ['poucos', 'raramente', 'quase ninguém'] },
      { level: 5, template: 'O que vou te revelar agora pode mudar...', words: ['revelar', 'mostrar', 'compartilhar'] },
    ],
    fallbacks: ['storytelling', 'authority'],
    synergizes: ['anticipation', 'storytelling', 'exclusivity'],
    conflicts: ['specificity', 'cognitive_ease'],
    resistanceIndicators: ['para de enrolação', 'fala logo', 'clickbait'],
    saturationThreshold: 3,
  },

  peak_end_rule: {
    id: 'peak_end_rule',
    name: 'Peak-End Rule',
    category: 'nlp_advanced',
    description: 'Pessoas julgam experiências pelo pico emocional e pelo fim, não pela média',
    effectiveness: 7,
    icon: '🎢',
    color: 'text-accent bg-accent/10',
    examples: [
      'Termine toda reunião com algo positivo e memorável',
      'Crie um momento "wow" no meio da apresentação',
      'Finalize com a melhor parte: o resultado transformador',
    ],
    bestFor: ['I', 'S'],
    avoidFor: [],
    timing: 'closing',
    nlpTechnique: 'Peak-End Rule (Daniel Kahneman)',
    neuralTarget: 'limbic',
    primaryChemical: 'dopamine',
    intensityLevels: [
      { level: 1, template: 'Antes de encerrar, quero destacar...', words: ['destacar', 'reforçar', 'lembrar'] },
      { level: 2, template: 'O mais importante de tudo isso é...', words: ['importante', 'principal', 'essencial'] },
      { level: 3, template: 'Se você lembrar de apenas uma coisa, que seja...', words: ['lembrar', 'guardar', 'levar'] },
      { level: 4, template: 'Isso aqui é o que vai transformar...', words: ['transformar', 'mudar', 'revolucionar'] },
      { level: 5, template: 'Esse é o momento decisivo: {climax}...', words: ['momento', 'hora', 'ponto'] },
    ],
    fallbacks: ['future_pacing', 'anticipation'],
    synergizes: ['storytelling', 'future_pacing', 'gift'],
    conflicts: [],
    resistanceIndicators: ['já vi isso antes', 'não precisa dramatizar', 'prefiro algo constante', 'chega de surpresas'],
    saturationThreshold: 5,
  },

  endowment_effect: {
    id: 'endowment_effect',
    name: 'Endowment Effect',
    category: 'high_conversion',
    description: 'Pessoas valorizam mais o que já possuem. Faça o cliente "experimentar" a posse',
    effectiveness: 8,
    icon: '🎁',
    color: 'text-success bg-success/10',
    examples: [
      'Use por 30 dias grátis - depois você decide',
      'Configure sua conta agora - é sua enquanto quiser',
      'Já deixei preparado o acesso exclusivo para você',
    ],
    bestFor: ['S', 'I'],
    avoidFor: ['D'],
    timing: 'closing',
    nlpTechnique: 'Endowment Effect (Richard Thaler)',
    neuralTarget: 'limbic',
    primaryChemical: 'oxytocin',
    intensityLevels: [
      { level: 1, template: 'Você pode experimentar...', words: ['experimentar', 'testar', 'conhecer'] },
      { level: 2, template: 'Fica à vontade para usar...', words: ['usar', 'explorar', 'aproveitar'] },
      { level: 3, template: 'Isso já é seu - você decide...', words: ['seu', 'sua', 'de vocês'] },
      { level: 4, template: 'Já configurei tudo pra você...', words: ['configurei', 'preparei', 'deixei pronto'] },
      { level: 5, template: 'Agora que é seu, imagina ter que devolver...', words: ['devolver', 'abrir mão', 'perder'] },
    ],
    fallbacks: ['gift', 'guarantee', 'small_yes'],
    synergizes: ['gift', 'guarantee', 'loss_aversion'],
    conflicts: ['urgency', 'scarcity'],
    resistanceIndicators: ['não quero me comprometer', 'depois complica pra cancelar'],
    saturationThreshold: 3,
  },

  sunk_cost: {
    id: 'sunk_cost',
    name: 'Sunk Cost',
    category: 'high_conversion',
    description: 'Relembra investimentos já feitos para justificar continuar investindo',
    effectiveness: 7,
    icon: '💸',
    color: 'text-warning bg-warning/10',
    examples: [
      'Você já investiu tempo aprendendo nosso sistema...',
      'Depois de tudo que você construiu até aqui...',
      'Com o relacionamento que já temos...',
    ],
    bestFor: ['S', 'C'],
    avoidFor: ['D'],
    timing: 'closing',
    nlpTechnique: 'Sunk Cost Fallacy (Arkes & Blumer)',
    neuralTarget: 'neocortex',
    primaryChemical: 'serotonin',
    intensityLevels: [
      { level: 1, template: 'Você já investiu tempo em...', words: ['investiu', 'dedicou', 'gastou'] },
      { level: 2, template: 'Considerando o que você já construiu...', words: ['construiu', 'desenvolveu', 'criou'] },
      { level: 3, template: 'Seria desperdiçar todo o progresso...', words: ['desperdiçar', 'perder', 'jogar fora'] },
      { level: 4, template: 'Depois de todo esse caminho percorrido...', words: ['caminho', 'jornada', 'trajetória'] },
      { level: 5, template: 'Não faz sentido parar agora quando você já...', words: ['parar', 'desistir', 'abandonar'] },
    ],
    fallbacks: ['commitment', 'consistency'],
    synergizes: ['commitment', 'consistency', 'loss_aversion'],
    conflicts: ['cognitive_ease', 'gift'],
    resistanceIndicators: ['isso não me obriga a nada', 'passado é passado', 'não é argumento'],
    saturationThreshold: 2,
  },

  bandwagon: {
    id: 'bandwagon',
    name: 'Bandwagon Effect',
    category: 'high_conversion',
    description: 'Tendência de seguir o que a maioria está fazendo',
    effectiveness: 8,
    icon: '🚂',
    color: 'text-info bg-info/10',
    examples: [
      'O mercado inteiro está migrando para essa solução...',
      'Todas as empresas do seu setor já adotaram...',
      'É a tendência mais forte dos últimos 5 anos...',
    ],
    bestFor: ['I', 'S'],
    avoidFor: ['D'],
    timing: 'middle',
    nlpTechnique: 'Bandwagon Effect (Leibenstein)',
    neuralTarget: 'limbic',
    primaryChemical: 'oxytocin',
    intensityLevels: [
      { level: 1, template: 'Muitas empresas estão fazendo isso...', words: ['muitas', 'várias', 'diversas'] },
      { level: 2, template: 'É uma tendência forte no mercado...', words: ['tendência', 'movimento', 'onda'] },
      { level: 3, template: 'O setor inteiro está migrando...', words: ['setor', 'indústria', 'mercado'] },
      { level: 4, template: 'Quem não aderir vai ficar pra trás...', words: ['aderir', 'entrar', 'participar'] },
      { level: 5, template: 'É inevitável - ou você lidera ou segue...', words: ['inevitável', 'certo', 'questão de tempo'] },
    ],
    fallbacks: ['social_proof', 'fomo', 'consensus'],
    synergizes: ['social_proof', 'fomo', 'tribal_belonging'],
    conflicts: ['exclusivity'],
    resistanceIndicators: ['não sigo modismo', 'maria vai com as outras', 'prefiro ser diferente'],
    saturationThreshold: 3,
  },

  halo_effect: {
    id: 'halo_effect',
    name: 'Halo Effect',
    category: 'high_conversion',
    description: 'Transfere percepção positiva de um atributo para outros',
    effectiveness: 7,
    icon: '😇',
    color: 'text-warning bg-warning/10',
    examples: [
      'Trabalhamos com Google, Amazon e Microsoft...',
      'Nosso fundador é ex-McKinsey...',
      'Premiados como melhor solução do ano...',
    ],
    bestFor: ['I', 'S', 'C'],
    avoidFor: [],
    timing: 'early',
    nlpTechnique: 'Halo Effect (Edward Thorndike)',
    neuralTarget: 'neocortex',
    primaryChemical: 'serotonin',
    intensityLevels: [
      { level: 1, template: 'Trabalhamos com empresas como...', words: ['trabalhamos', 'atendemos', 'parceiros'] },
      { level: 2, template: 'Fomos reconhecidos por...', words: ['reconhecidos', 'premiados', 'destacados'] },
      { level: 3, template: 'Os mesmos que confiam em {referência} confiam em nós...', words: ['confiam', 'escolhem', 'preferem'] },
      { level: 4, template: 'Se é bom para {grande_marca}, imagine para...', words: ['bom para', 'funciona para', 'serve para'] },
      { level: 5, template: 'Usamos o mesmo padrão de {referência_elite}...', words: ['padrão', 'método', 'processo'] },
    ],
    fallbacks: ['authority', 'testimonial'],
    synergizes: ['authority', 'social_proof', 'testimonial'],
    conflicts: [],
    resistanceIndicators: ['isso não significa nada', 'cada caso é um caso', 'grandes empresas são diferentes'],
    saturationThreshold: 3,
  },

  contrast_principle: {
    id: 'contrast_principle',
    name: 'Contrast Principle',
    category: 'high_conversion',
    description: 'Apresenta algo extremo primeiro para fazer sua oferta parecer razoável',
    effectiveness: 8,
    icon: '⚖️',
    color: 'text-muted-foreground bg-muted',
    examples: [
      'O projeto completo custaria R$ 100.000. Mas você só precisa do módulo de R$ 15.000.',
      'Implementar internamente levaria 2 anos. Conosco, 3 meses.',
      'A multa por não conformidade é R$ 500.000. Nosso sistema custa R$ 30.000.',
    ],
    bestFor: ['C', 'D'],
    avoidFor: [],
    timing: 'middle',
    nlpTechnique: 'Contrast Principle (Robert Cialdini)',
    neuralTarget: 'neocortex',
    primaryChemical: 'serotonin',
    intensityLevels: [
      { level: 1, template: 'Normalmente seria {extremo}, mas...', words: ['normalmente', 'geralmente', 'tipicamente'] },
      { level: 2, template: 'Comparado a {extremo}, isso é...', words: ['comparado', 'versus', 'contra'] },
      { level: 3, template: 'Enquanto outros cobram {extremo}, nós...', words: ['outros', 'concorrentes', 'alternativas'] },
      { level: 4, template: 'A alternativa seria {cenário_extremo}...', words: ['alternativa', 'opção', 'caminho'] },
      { level: 5, template: 'O custo de não fazer é {valor_chocante}...', words: ['custo', 'preço', 'consequência'] },
    ],
    fallbacks: ['anchoring', 'comparison'],
    synergizes: ['anchoring', 'loss_aversion', 'specificity'],
    conflicts: [],
    resistanceIndicators: ['comparação injusta', 'não é a mesma coisa'],
    saturationThreshold: 3,
  },

  unity: {
    id: 'unity',
    name: 'Unity',
    category: 'nlp_advanced',
    description: 'Cria senso de identidade compartilhada - "somos iguais", "fazemos parte do mesmo grupo"',
    effectiveness: 8,
    icon: '🤝',
    color: 'text-destructive bg-destructive/10',
    examples: [
      'Como empreendedor, você entende que...',
      'Nós, do setor de tecnologia, sabemos que...',
      'Gaúchos/Paulistas/Mineiros como nós...',
    ],
    bestFor: ['I', 'S'],
    avoidFor: ['D'],
    timing: 'any',
    nlpTechnique: 'Unity Principle (Cialdini - 7º Princípio)',
    neuralTarget: 'limbic',
    primaryChemical: 'oxytocin',
    intensityLevels: [
      { level: 1, template: 'Como {identidade_compartilhada}, você sabe...', words: ['como', 'sendo', 'enquanto'] },
      { level: 2, template: 'Nós, que trabalhamos com {área}, entendemos...', words: ['nós', 'a gente', 'quem trabalha'] },
      { level: 3, template: 'Entre {identidade}, a gente sabe que...', words: ['entre', 'para', 'dentro de'] },
      { level: 4, template: 'Somos do mesmo time - {afirmação_grupo}...', words: ['time', 'lado', 'turma'] },
      { level: 5, template: 'É família - e família {valor_compartilhado}...', words: ['família', 'irmãos', 'parceiros'] },
    ],
    fallbacks: ['belonging', 'tribal_belonging', 'empathy'],
    synergizes: ['tribal_belonging', 'belonging', 'empathy'],
    conflicts: ['comparison'],
    resistanceIndicators: ['não somos iguais', 'cada um é cada um', 'forçando intimidade'],
    saturationThreshold: 4,
  },
};

// ============================================
// NEW CONFLICTS FOR EXTENDED TRIGGERS
// ============================================
export const EXTENDED_TRIGGER_CONFLICTS: TriggerConflict[] = [
  // Priming conflicts
  { trigger1: 'priming', trigger2: 'urgency', conflictLevel: 'moderate', reason: 'Priming requer sutileza; urgência é direto.', resolution: 'Use priming primeiro, urgência depois de estabelecido.' },
  { trigger1: 'priming', trigger2: 'pattern_interrupt', conflictLevel: 'severe', reason: 'Ambos competem pela atenção inicial.', resolution: 'Escolha um ou outro no início.' },
  
  // Anchoring conflicts
  { trigger1: 'anchoring', trigger2: 'gift', conflictLevel: 'moderate', reason: 'Ancorar alto e dar presente parece calculado.', resolution: 'Dê gift antes, anchoring em outra conversa.' },
  { trigger1: 'anchoring', trigger2: 'empathy', conflictLevel: 'minor', reason: 'Números frios vs conexão emocional.', resolution: 'Use empatia para contextualizar a âncora.' },
  
  // Decoy Effect conflicts
  { trigger1: 'decoy_effect', trigger2: 'cognitive_ease', conflictLevel: 'moderate', reason: '3 opções aumentam carga cognitiva.', resolution: 'Simplifique a apresentação visual.' },
  { trigger1: 'decoy_effect', trigger2: 'small_yes', conflictLevel: 'minor', reason: 'Opções vs progressão gradual.', resolution: 'Use small_yes para chegar ao momento do decoy.' },
  
  // Framing conflicts
  { trigger1: 'framing', trigger2: 'specificity', conflictLevel: 'minor', reason: 'Reframe pode parecer fugir dos dados.', resolution: 'Inclua dados no novo frame.' },
  
  // Curiosity Gap conflicts
  { trigger1: 'curiosity_gap', trigger2: 'specificity', conflictLevel: 'moderate', reason: 'Mistério vs detalhes.', resolution: 'Crie curiosidade, depois revele com especificidade.' },
  { trigger1: 'curiosity_gap', trigger2: 'cognitive_ease', conflictLevel: 'minor', reason: 'Curiosidade cria tensão.', resolution: 'Resolva a curiosidade rapidamente.' },
  
  // Endowment Effect conflicts
  { trigger1: 'endowment_effect', trigger2: 'urgency', conflictLevel: 'moderate', reason: 'Posse precisa de tempo; urgência pressiona.', resolution: 'Dê tempo para "possuir" antes de urgência.' },
  { trigger1: 'endowment_effect', trigger2: 'scarcity', conflictLevel: 'minor', reason: 'Escassez pode impedir experimentação.', resolution: 'Ofereça período de posse antes de escassez.' },
  
  // Sunk Cost conflicts
  { trigger1: 'sunk_cost', trigger2: 'cognitive_ease', conflictLevel: 'minor', reason: 'Lembrar investimentos pode pesar.', resolution: 'Posicione como "já fez o mais difícil".' },
  { trigger1: 'sunk_cost', trigger2: 'gift', conflictLevel: 'moderate', reason: 'Cobrar passado vs dar presente.', resolution: 'Nunca use juntos.' },
  
  // Unity conflicts
  { trigger1: 'unity', trigger2: 'comparison', conflictLevel: 'minor', reason: 'Unidade inclui; comparação diferencia.', resolution: 'Compare com "os de fora" do grupo.' },
];

// ============================================
// NEW SYNERGIES FOR EXTENDED TRIGGERS
// ============================================
export const EXTENDED_TRIGGER_SYNERGIES: TriggerSynergy[] = [
  // Power combos with new triggers
  { trigger1: 'priming', trigger2: 'future_pacing', synergyLevel: 10, explanation: 'Ativa conceitos + projeta futuro = visualização poderosa', combinedEffect: 'Cliente "sente" o sucesso futuro com conceitos positivos ativados' },
  { trigger1: 'anchoring', trigger2: 'contrast_principle', synergyLevel: 10, explanation: 'Âncora alta + contraste = valor irresistível', combinedEffect: 'Preço parece barganha absoluta' },
  { trigger1: 'anchoring', trigger2: 'loss_aversion', synergyLevel: 9, explanation: 'Âncora de perda + aversão = urgência justificada', combinedEffect: 'Medo calculado e inevitável' },
  { trigger1: 'curiosity_gap', trigger2: 'storytelling', synergyLevel: 9, explanation: 'Mistério + narrativa = atenção total', combinedEffect: 'Cliente não consegue parar de ouvir' },
  { trigger1: 'endowment_effect', trigger2: 'loss_aversion', synergyLevel: 10, explanation: 'Posse + medo de perder = retenção máxima', combinedEffect: 'Cliente não quer "devolver" o que já é dele' },
  { trigger1: 'framing', trigger2: 'priming', synergyLevel: 9, explanation: 'Conceitos ativados + enquadramento = persuasão subliminar', combinedEffect: 'Decisão parece óbvia e natural' },
  { trigger1: 'unity', trigger2: 'tribal_belonging', synergyLevel: 10, explanation: 'Identidade + pertencimento = vínculo profundo', combinedEffect: 'Comprometimento emocional total' },
  { trigger1: 'halo_effect', trigger2: 'authority', synergyLevel: 9, explanation: 'Associação positiva + expertise = credibilidade máxima', combinedEffect: 'Confiança instantânea e inquestionável' },
  { trigger1: 'bandwagon', trigger2: 'fomo', synergyLevel: 9, explanation: 'Todos fazem + você vai perder = urgência social', combinedEffect: 'Pressão irresistível para agir' },
  { trigger1: 'peak_end_rule', trigger2: 'gift', synergyLevel: 8, explanation: 'Final memorável + presente = experiência inesquecível', combinedEffect: 'Cliente lembra positivamente para sempre' },
  { trigger1: 'decoy_effect', trigger2: 'paradox_double_bind', synergyLevel: 8, explanation: '3 opções + todas levam ao sim = fechamento elegante', combinedEffect: 'Cliente escolhe como comprar, não se compra' },
  { trigger1: 'sunk_cost', trigger2: 'commitment', synergyLevel: 8, explanation: 'Investimento passado + compromisso = consistência forçada', combinedEffect: 'Abandono parece irracional' },
  { trigger1: 'contrast_principle', trigger2: 'specificity', synergyLevel: 8, explanation: 'Contraste + números = prova irrefutável', combinedEffect: 'Superioridade matematicamente comprovada' },
];

// ============================================
// NEW FALLBACK TREES
// ============================================
export const EXTENDED_TRIGGER_FALLBACKS: TriggerFallback[] = [
  {
    primaryTrigger: 'anchoring',
    failureIndicators: ['manipulação', 'comparação forçada', 'não são iguais'],
    fallbackSequence: [
      { trigger: 'specificity', condition: 'Cliente quer fatos', timing: 'immediate' },
      { trigger: 'reason_why', condition: 'Quer justificativa', timing: 'immediate' },
      { trigger: 'guarantee', condition: 'Precisa segurança', timing: 'next_contact' },
    ],
  },
  {
    primaryTrigger: 'curiosity_gap',
    failureIndicators: ['enrolação', 'fala logo', 'clickbait'],
    fallbackSequence: [
      { trigger: 'specificity', condition: 'Quer direto ao ponto', timing: 'immediate' },
      { trigger: 'authority', condition: 'Precisa credibilidade', timing: 'immediate' },
      { trigger: 'comparison', condition: 'Quer comparar', timing: 'immediate' },
    ],
  },
  {
    primaryTrigger: 'unity',
    failureIndicators: ['forçando intimidade', 'não somos iguais', 'cada um é cada um'],
    fallbackSequence: [
      { trigger: 'empathy', condition: 'Reconectar com cuidado', timing: 'immediate' },
      { trigger: 'authority', condition: 'Voltar ao profissional', timing: 'immediate' },
      { trigger: 'specificity', condition: 'Focar em fatos', timing: 'next_contact' },
    ],
  },
  {
    primaryTrigger: 'sunk_cost',
    failureIndicators: ['passado é passado', 'não me obriga', 'irrelevante'],
    fallbackSequence: [
      { trigger: 'future_pacing', condition: 'Focar no futuro', timing: 'immediate' },
      { trigger: 'anticipation', condition: 'Criar expectativa', timing: 'immediate' },
      { trigger: 'gift', condition: 'Reconstruir relação', timing: 'wait_24h' },
    ],
  },
];

// ============================================
// COMBINED EXPORT FOR ALL TRIGGERS
// ============================================
export const ALL_EXTENDED_TRIGGER_IDS: ExtendedTriggerType[] = [
  'priming', 'anchoring', 'decoy_effect', 'framing', 'curiosity_gap',
  'peak_end_rule', 'endowment_effect', 'sunk_cost', 'bandwagon',
  'halo_effect', 'contrast_principle', 'unity',
];
