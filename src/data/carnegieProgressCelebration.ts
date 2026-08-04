// ==============================================
// PROGRESS CELEBRATION - DATA
// "Praise the slightest improvement and praise every improvement" - Dale Carnegie
// ==============================================

import { ProgressCelebration, ProgressType } from '@/types/carnegie';
import type { DiscProfileKey } from '@/types/carnegie-extended';

export const PROGRESS_CELEBRATIONS: ProgressCelebration[] = [
  // ============================================
  // MILESTONE REACHED
  // ============================================
  {
    id: 'progress_milestone_1',
    type: 'milestone_reached',
    name: 'Marco Alcançado',
    description: 'Celebrar quando um marco importante é atingido',
    
    recognitionPhrase: 'Isso é um marco significativo!',
    amplificationPhrase: 'Você acaba de atingir algo que muitos apenas sonham.',
    futureProjection: 'Isso abre portas para conquistas ainda maiores.',
    
    fullScript: `Isso é um marco significativo! Você acaba de atingir algo que muitos apenas sonham. Pare um momento para reconhecer o que você conseguiu.

Não foi sorte - foi resultado do seu esforço consistente. Isso abre portas para conquistas ainda maiores que estão por vir.`,
    
    microCelebration: 'Excelente! Mais um marco conquistado!',
    standardCelebration: 'Parabéns! Esse marco é prova do seu esforço e competência. Celebre essa conquista!',
    majorCelebration: 'QUE CONQUISTA! Esse marco merece celebração! Você trabalhou duro para isso e os resultados falam por si. Isso é apenas o começo de coisas ainda maiores!',
    
    followUpQuestion: 'Como você se sente tendo alcançado isso?',
    nextStepSuggestion: 'Agora que você conquistou isso, qual é o próximo objetivo que te empolga?'
  },

  // ============================================
  // GOAL ACHIEVED
  // ============================================
  {
    id: 'progress_goal_1',
    type: 'goal_achieved',
    name: 'Meta Alcançada',
    description: 'Celebrar o alcance de uma meta estabelecida',
    
    recognitionPhrase: 'Você conseguiu! A meta foi alcançada!',
    amplificationPhrase: 'Quando você se comprometeu com isso, sabia que chegaria lá.',
    futureProjection: 'Essa conquista prova que você é capaz de ainda mais.',
    
    fullScript: `Você conseguiu! A meta foi alcançada! Quando você se comprometeu com isso, eu sabia que chegaria lá - sua determinação não deixava dúvidas.

Essa conquista não é apenas um número - é prova de que você é capaz de definir objetivos e alcançá-los. Isso prova que você é capaz de ainda mais.`,
    
    microCelebration: 'Meta batida! Mandou bem!',
    standardCelebration: 'Parabéns pela meta alcançada! Seu comprometimento fez toda diferença. Orgulho de você!',
    majorCelebration: 'VOCÊ CONSEGUIU! A meta que parecia desafiadora agora é uma conquista no seu currículo. Seu esforço, disciplina e determinação fizeram isso acontecer. Celebre com orgulho!',
    
    followUpQuestion: 'O que foi mais importante para você alcançar essa meta?',
    nextStepSuggestion: 'Já tem a próxima meta em mente? Estou curioso para saber o que vem por aí!'
  },

  // ============================================
  // IMPROVEMENT NOTED
  // ============================================
  {
    id: 'progress_improvement_1',
    type: 'improvement_noted',
    name: 'Melhoria Percebida',
    description: 'Reconhecer melhorias incrementais',
    
    recognitionPhrase: 'Notei uma melhoria significativa aqui!',
    amplificationPhrase: 'Essa evolução mostra que você está no caminho certo.',
    futureProjection: 'Continue assim e os resultados vão se multiplicar.',
    
    fullScript: `Notei uma melhoria significativa aqui! Essa evolução mostra que você está no caminho certo - cada pequeno avanço soma para grandes resultados.

Continue assim e os resultados vão se multiplicar. O progresso é assim mesmo: às vezes parece lento, mas de repente você olha para trás e vê o quanto avançou.`,
    
    microCelebration: 'Boa! Está evoluindo!',
    standardCelebration: 'Que melhoria! Sua evolução está visível. Continue no ritmo!',
    majorCelebration: 'Que evolução impressionante! De onde você estava para onde está agora... é inspirador ver essa transformação acontecendo!',
    
    followUpQuestion: 'Você percebeu essa melhoria também? Como se sente?',
    nextStepSuggestion: 'Qual aspecto você gostaria de melhorar ainda mais?'
  },

  // ============================================
  // CHALLENGE OVERCOME
  // ============================================
  {
    id: 'progress_challenge_1',
    type: 'challenge_overcome',
    name: 'Desafio Superado',
    description: 'Celebrar a superação de um obstáculo',
    
    recognitionPhrase: 'Você superou esse desafio!',
    amplificationPhrase: 'Isso exigiu coragem e persistência.',
    futureProjection: 'Agora você sabe que pode enfrentar qualquer coisa.',
    
    fullScript: `Você superou esse desafio! Isso exigiu coragem, persistência e uma força que nem todo mundo tem. Não foi fácil, mas você não desistiu.

Agora você sabe que pode enfrentar qualquer coisa. Essa experiência vai te fortalecer para todos os desafios futuros.`,
    
    microCelebration: 'Superou! Nada te para!',
    standardCelebration: 'Que força! Você enfrentou esse desafio de frente e venceu. Isso mostra seu caráter!',
    majorCelebration: 'VOCÊ VENCEU! Quando esse desafio apareceu, você poderia ter desistido. Mas não. Você enfrentou, lutou e superou. Isso define quem você é!',
    
    followUpQuestion: 'O que você aprendeu ao superar isso?',
    nextStepSuggestion: 'Esse desafio te preparou para algo maior. O que você acha que vem por aí?'
  },

  // ============================================
  // SKILL DEVELOPED
  // ============================================
  {
    id: 'progress_skill_1',
    type: 'skill_developed',
    name: 'Habilidade Desenvolvida',
    description: 'Reconhecer o desenvolvimento de uma nova habilidade',
    
    recognitionPhrase: 'Você desenvolveu uma nova habilidade!',
    amplificationPhrase: 'Isso é um ativo que ninguém pode tirar de você.',
    futureProjection: 'Essa habilidade vai abrir portas que você nem imagina.',
    
    fullScript: `Você desenvolveu uma nova habilidade! Isso é um ativo que ninguém pode tirar de você - está dentro de você para sempre.

O investimento que você fez em si mesmo vai dar retorno por anos. Essa habilidade vai abrir portas que você nem imagina ainda.`,
    
    microCelebration: 'Nova skill desbloqueada!',
    standardCelebration: 'Impressionante! Você dominou algo novo. Esse investimento em você mesmo vale ouro!',
    majorCelebration: 'Que conquista! Desenvolver uma nova habilidade exige dedicação, prática e paciência. Você teve todas e agora colhe os frutos!',
    
    followUpQuestion: 'Como você pretende usar essa nova habilidade?',
    nextStepSuggestion: 'Qual seria o próximo nível dessa habilidade para você?'
  },

  // ============================================
  // DECISION MADE
  // ============================================
  {
    id: 'progress_decision_1',
    type: 'decision_made',
    name: 'Decisão Tomada',
    description: 'Celebrar uma decisão importante',
    
    recognitionPhrase: 'Você tomou uma decisão importante!',
    amplificationPhrase: 'Decidir é um ato de coragem.',
    futureProjection: 'Agora é só executar e colher os resultados.',
    
    fullScript: `Você tomou uma decisão importante! Decidir é um ato de coragem - muitas pessoas ficam paralisadas na dúvida. Você não.

Você avaliou, escolheu e seguiu em frente. Agora é só executar e colher os resultados que essa decisão vai trazer.`,
    
    microCelebration: 'Decidiu! Primeiro passo dado!',
    standardCelebration: 'Excelente decisão! Tomar uma posição exige coragem. Você demonstrou isso!',
    majorCelebration: 'Que decisão corajosa! Enquanto outros hesitam, você age. Isso é liderança em ação!',
    
    followUpQuestion: 'O que te deu confiança para tomar essa decisão?',
    nextStepSuggestion: 'Qual é o primeiro passo prático agora que a decisão está tomada?'
  },

  // ============================================
  // STEP COMPLETED
  // ============================================
  {
    id: 'progress_step_1',
    type: 'step_completed',
    name: 'Etapa Concluída',
    description: 'Celebrar a conclusão de uma etapa do processo',
    
    recognitionPhrase: 'Mais uma etapa concluída!',
    amplificationPhrase: 'Cada passo te aproxima do objetivo final.',
    futureProjection: 'A próxima etapa está logo ali.',
    
    fullScript: `Mais uma etapa concluída! Cada passo que você dá te aproxima do objetivo final. Não subestime o poder do progresso consistente.

A próxima etapa está logo ali, e você já provou que consegue avançar. Um passo de cada vez!`,
    
    microCelebration: 'Check! Próxima!',
    standardCelebration: 'Boa! Mais uma etapa no bolso. Você está avançando consistentemente!',
    majorCelebration: 'Etapa crucial concluída! Você está construindo momentum. O progresso é visível!',
    
    followUpQuestion: 'Como foi completar essa etapa?',
    nextStepSuggestion: 'Qual é a próxima etapa e quando você pretende atacá-la?'
  },

  // ============================================
  // BREAKTHROUGH
  // ============================================
  {
    id: 'progress_breakthrough_1',
    type: 'breakthrough',
    name: 'Breakthrough',
    description: 'Celebrar um momento de ruptura ou insight',
    
    recognitionPhrase: 'Isso é um breakthrough!',
    amplificationPhrase: 'Algo mudou fundamentalmente.',
    futureProjection: 'Você nunca mais vai ser o mesmo depois disso.',
    
    fullScript: `Isso é um breakthrough! Algo mudou fundamentalmente na forma como você vê isso. Esses momentos são raros e preciosos.

Você nunca mais vai ser o mesmo depois disso. Esse insight vai te servir pelo resto da vida.`,
    
    microCelebration: 'BOOM! Breakthrough!',
    standardCelebration: 'Que momento! Esse insight é ouro. Guarde isso bem!',
    majorCelebration: 'BREAKTHROUGH! Esses momentos de clareza são raros. Você acabou de ter uma epifania que vai transformar sua trajetória!',
    
    followUpQuestion: 'O que exatamente clicou para você?',
    nextStepSuggestion: 'Como você vai aplicar esse insight imediatamente?'
  },

  // ============================================
  // CONSISTENCY
  // ============================================
  {
    id: 'progress_consistency_1',
    type: 'consistency',
    name: 'Consistência',
    description: 'Reconhecer esforço consistente ao longo do tempo',
    
    recognitionPhrase: 'Sua consistência é admirável!',
    amplificationPhrase: 'Poucas pessoas mantêm esse nível de dedicação.',
    futureProjection: 'A consistência é o que separa os bons dos excelentes.',
    
    fullScript: `Sua consistência é admirável! Poucas pessoas mantêm esse nível de dedicação dia após dia. É fácil começar, difícil é continuar - e você está continuando.

A consistência é o que separa os bons dos excelentes. Você está provando que pertence ao segundo grupo.`,
    
    microCelebration: 'Firme e forte! Continue assim!',
    standardCelebration: 'Que consistência! Manter o ritmo é o verdadeiro teste. Você está passando!',
    majorCelebration: 'Sua consistência é INSPIRADORA! Enquanto outros desistem, você persiste. Isso é o que separa os campeões!',
    
    followUpQuestion: 'O que te mantém motivado a continuar?',
    nextStepSuggestion: 'Como podemos garantir que essa consistência se mantenha?'
  },

  // ============================================
  // HABIT FORMED
  // ============================================
  {
    id: 'progress_habit_1',
    type: 'habit_formed',
    name: 'Hábito Formado',
    description: 'Celebrar a formação de um novo hábito positivo',
    
    recognitionPhrase: 'Você formou um novo hábito!',
    amplificationPhrase: 'Isso agora faz parte de quem você é.',
    futureProjection: 'Esse hábito vai trabalhar por você automaticamente.',
    
    fullScript: `Você formou um novo hábito! Isso agora faz parte de quem você é - não é mais algo que você "faz", é algo que você "é".

Esse hábito vai trabalhar por você automaticamente, dia após dia. É um dos melhores investimentos que você poderia fazer.`,
    
    microCelebration: 'Hábito formado! Vitória!',
    standardCelebration: 'Que conquista! Formar um hábito exige disciplina. Você conseguiu!',
    majorCelebration: 'Incrível! Esse novo hábito vai transformar sua vida de formas que você ainda nem imagina. Parabéns pela disciplina!',
    
    followUpQuestion: 'Como você se sente agora que isso é automático?',
    nextStepSuggestion: 'Qual seria o próximo hábito que você gostaria de desenvolver?'
  }
];

// ============================================
// CELEBRATION INTENSITY GUIDELINES
// ============================================
export const CELEBRATION_INTENSITY_GUIDELINES = {
  micro: {
    name: 'Micro-Celebração',
    when: [
      'Pequenas vitórias do dia a dia',
      'Passos incrementais',
      'Tarefas completadas',
      'Progresso regular'
    ],
    tone: 'Rápido, positivo, energético',
    duration: '1-2 frases'
  },
  
  standard: {
    name: 'Celebração Padrão',
    when: [
      'Metas importantes alcançadas',
      'Desafios superados',
      'Marcos significativos',
      'Melhorias notáveis'
    ],
    tone: 'Entusiasta, específico, pessoal',
    duration: '3-5 frases'
  },
  
  major: {
    name: 'Grande Celebração',
    when: [
      'Conquistas transformadoras',
      'Objetivos de longo prazo alcançados',
      'Breakthroughs importantes',
      'Vitórias contra grandes adversidades'
    ],
    tone: 'Efusivo, emocional, memorável',
    duration: 'Múltiplos parágrafos, possivelmente com follow-up'
  }
};

// ============================================
// PROGRESS DETECTION PATTERNS
// ============================================
export const PROGRESS_DETECTION_PATTERNS: Record<ProgressType, string[]> = {
  milestone_reached: [
    'marco', 'milestone', 'alcançamos', 'atingimos', 'chegamos em',
    'completamos', 'finalizamos', '100%', 'pronto'
  ],
  goal_achieved: [
    'meta', 'objetivo', 'consegui', 'alcancei', 'bati a meta',
    'atingi', 'realizei', 'concluí'
  ],
  improvement_noted: [
    'melhorou', 'evoluiu', 'progrediu', 'avançou', 'cresceu',
    'aumentou', 'subiu', 'desenvolveu'
  ],
  challenge_overcome: [
    'superei', 'venci', 'consegui resolver', 'deu certo', 'funcionou',
    'passou', 'resolvido', 'superado'
  ],
  skill_developed: [
    'aprendi', 'dominei', 'agora sei', 'nova habilidade', 'desenvolvi',
    'capacitei', 'treinei', 'pratiquei'
  ],
  decision_made: [
    'decidi', 'escolhi', 'optei', 'defini', 'resolvi', 'vou fazer',
    'tomei a decisão', 'fechei'
  ],
  step_completed: [
    'passo', 'etapa', 'fase', 'completei', 'terminei', 'fiz',
    'próximo', 'avancei'
  ],
  habit_formed: [
    'hábito', 'rotina', 'todos os dias', 'sempre', 'automaticamente',
    'naturalmente', 'costume', 'prática'
  ],
  breakthrough: [
    'eureka', 'entendi', 'clicou', 'caiu a ficha', 'insight',
    'percebi', 'descobri', 'revelação'
  ],
  consistency: [
    'sempre', 'todo dia', 'toda semana', 'consistente', 'regular',
    'mantendo', 'continuando', 'persistindo'
  ]
};

// ============================================
// CELEBRATION BY DISC
// ============================================
export const CELEBRATION_BY_DISC: Record<DiscProfileKey, {
  preferredIntensity: 'micro' | 'standard' | 'major';
  style: string;
  examples: string[];
  avoidThis: string[];
}> = {
  D: {
    preferredIntensity: 'micro',
    style: 'Direto, focado no resultado, rápido',
    examples: [
      'Resultado alcançado. Excelente!',
      'Meta batida. Próximo desafio?',
      'Impressionante eficiência. Continue.'
    ],
    avoidThis: [
      'Celebrações muito longas',
      'Excesso de emoção',
      'Elogios que pareçam bajulação'
    ]
  },
  
  I: {
    preferredIntensity: 'major',
    style: 'Entusiasta, emocional, compartilhável',
    examples: [
      'QUE INCRÍVEL! Você arrasou! Isso merece comemoração!',
      'Nossa! Não acredito que você conseguiu! Estou tão feliz por você!',
      'PARABÉNS! Você é demais! Conta isso pra todo mundo!'
    ],
    avoidThis: [
      'Celebrações secas ou formais',
      'Ignorar o momento',
      'Pular para próxima tarefa sem reconhecer'
    ]
  },
  
  S: {
    preferredIntensity: 'standard',
    style: 'Caloroso, pessoal, reconhecendo o esforço',
    examples: [
      'Você trabalhou muito por isso, e valeu a pena. Estou orgulhoso de você.',
      'Sei o quanto você se dedicou. Essa conquista é merecida.',
      'Que lindo ver você alcançando isso. Você merece.'
    ],
    avoidThis: [
      'Celebrações muito públicas',
      'Exageros que causem constrangimento',
      'Pressão para "comemorar mais"'
    ]
  },
  
  C: {
    preferredIntensity: 'standard',
    style: 'Específico, baseado em fatos, reconhecendo qualidade',
    examples: [
      'Os números mostram: você alcançou a meta com precisão.',
      'Sua abordagem metodológica rendeu resultados excelentes.',
      'Qualidade impecável. O resultado reflete seu padrão elevado.'
    ],
    avoidThis: [
      'Elogios vagos ou genéricos',
      'Exageros sem fundamento',
      'Celebrações muito emocionais'
    ]
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================
export function getCelebrationTemplate(type: ProgressType): ProgressCelebration | null {
  return PROGRESS_CELEBRATIONS.find(c => c.type === type) || null;
}

export function detectProgressType(text: string): ProgressType | null {
  const textLower = text.toLowerCase();
  
  for (const [type, keywords] of Object.entries(PROGRESS_DETECTION_PATTERNS)) {
    for (const keyword of keywords) {
      if (textLower.includes(keyword)) {
        return type as ProgressType;
      }
    }
  }
  
  return null;
}

export function getCelebrationForDISC(
  type: ProgressType,
  discProfile: DiscProfileKey
): { celebration: ProgressCelebration; adaptedScript: string } | null {
  const celebration = getCelebrationTemplate(type);
  if (!celebration) return null;
  
  const discPrefs = CELEBRATION_BY_DISC[discProfile];
  const intensity = discPrefs.preferredIntensity;
  
  const adaptedScript = 
    intensity === 'micro' ? celebration.microCelebration :
    intensity === 'major' ? celebration.majorCelebration :
    celebration.standardCelebration;
  
  return { celebration, adaptedScript };
}

export function selectCelebrationIntensity(
  progressSignificance: 'small' | 'medium' | 'large',
  discProfile: DiscProfileKey
): 'micro' | 'standard' | 'major' {
  const baseIntensity = 
    progressSignificance === 'small' ? 0 :
    progressSignificance === 'medium' ? 1 : 2;
  
  const discModifier = 
    discProfile === 'I' ? 1 :
    discProfile === 'D' ? -1 : 0;
  
  const finalIntensity = Math.max(0, Math.min(2, baseIntensity + discModifier));
  
  return finalIntensity === 0 ? 'micro' : finalIntensity === 1 ? 'standard' : 'major';
}
