// Emotional Intelligence (EQ) Data based on Daniel Goleman's 5 Pillars

import { EQPillar, EQPillarInfo, EQLevel } from '@/types/emotional-intelligence';

// ============================================
// PILLAR INFORMATION
// ============================================
export const EQ_PILLAR_INFO: Record<EQPillar, EQPillarInfo> = {
  self_awareness: {
    name: 'Self-Awareness',
    namePt: 'Autoconsciência',
    icon: '🪞',
    color: 'text-secondary',
    bgColor: 'bg-secondary/10 border-secondary/20',
    description: 'Ability to recognize and understand own emotions, drives, and their effects on others',
    descriptionPt: 'Capacidade de reconhecer e entender as próprias emoções, motivações e seus efeitos nos outros',
    characteristics: {
      high: [
        'Reconhece suas emoções facilmente',
        'Entende como suas emoções afetam comportamento',
        'Conhece seus pontos fortes e fracos',
        'Aceita feedback construtivo',
        'Demonstra autoconfiança realista'
      ],
      low: [
        'Dificuldade em identificar emoções',
        'Surpreso com reações próprias',
        'Nega ou minimiza fraquezas',
        'Defensivo ao receber feedback',
        'Autoconfiança excessiva ou baixa demais'
      ]
    },
    developmentTips: [
      'Pratique journaling emocional diário',
      'Peça feedback regularmente a pessoas de confiança',
      'Faça pausas para check-in emocional durante o dia',
      'Identifique padrões entre situações e emoções'
    ]
  },
  self_regulation: {
    name: 'Self-Regulation',
    namePt: 'Autorregulação',
    icon: '⚖️',
    color: 'text-info',
    bgColor: 'bg-info/10 border-info/20',
    description: 'Ability to control or redirect disruptive impulses and moods, and think before acting',
    descriptionPt: 'Capacidade de controlar ou redirecionar impulsos e humores disruptivos, e pensar antes de agir',
    characteristics: {
      high: [
        'Mantém calma sob pressão',
        'Pensa antes de agir',
        'Adapta-se bem a mudanças',
        'Age com integridade',
        'Assume responsabilidade por suas ações'
      ],
      low: [
        'Reage impulsivamente',
        'Dificuldade em controlar emoções negativas',
        'Resiste a mudanças',
        'Culpa os outros pelos problemas',
        'Inconsistente em comportamentos'
      ]
    },
    developmentTips: [
      'Use técnicas de respiração em momentos de stress',
      'Conte até 10 antes de reagir a situações difíceis',
      'Estabeleça rotinas que promovam equilíbrio',
      'Pratique mindfulness regularmente'
    ]
  },
  motivation: {
    name: 'Motivation',
    namePt: 'Motivação',
    icon: '🔥',
    color: 'text-warning',
    bgColor: 'bg-warning/10 border-warning/20',
    description: 'A passion to work for reasons that go beyond money or status; pursuing goals with energy and persistence',
    descriptionPt: 'Paixão pelo trabalho por razões além de dinheiro ou status; buscar metas com energia e persistência',
    characteristics: {
      high: [
        'Orientado a resultados',
        'Otimista mesmo diante de obstáculos',
        'Comprometido com metas de longo prazo',
        'Busca constante melhoria',
        'Iniciativa e proatividade'
      ],
      low: [
        'Procrastinação frequente',
        'Desiste facilmente diante de obstáculos',
        'Foco apenas em recompensas externas',
        'Pouco comprometimento com metas',
        'Espera que outros tomem iniciativa'
      ]
    },
    developmentTips: [
      'Conecte tarefas a propósitos maiores',
      'Divida metas grandes em pequenas conquistas',
      'Celebre progressos, não apenas resultados finais',
      'Encontre mentores e modelos inspiradores'
    ]
  },
  empathy: {
    name: 'Empathy',
    namePt: 'Empatia',
    icon: '💗',
    color: 'text-accent',
    bgColor: 'bg-accent/10 border-accent/20',
    description: 'Ability to understand the emotional makeup of other people and skill in treating them according to their emotional reactions',
    descriptionPt: 'Capacidade de entender as emoções dos outros e tratá-los de acordo com suas reações emocionais',
    characteristics: {
      high: [
        'Escuta ativamente',
        'Percebe emoções não expressas',
        'Considera perspectivas diferentes',
        'Sensível às necessidades dos outros',
        'Constrói conexões genuínas'
      ],
      low: [
        'Dificuldade em ler sinais emocionais',
        'Interrompe frequentemente',
        'Julgamentos rápidos sobre outros',
        'Foco excessivo em si mesmo',
        'Relacionamentos superficiais'
      ]
    },
    developmentTips: [
      'Pratique escuta ativa sem interromper',
      'Faça perguntas genuínas sobre os outros',
      'Observe linguagem corporal e tom de voz',
      'Busque entender antes de ser entendido'
    ]
  },
  social_skills: {
    name: 'Social Skills',
    namePt: 'Habilidades Sociais',
    icon: '🤝',
    color: 'text-success',
    bgColor: 'bg-success/10 border-success/20',
    description: 'Proficiency in managing relationships and building networks; finding common ground and building rapport',
    descriptionPt: 'Proficiência em gerenciar relacionamentos e construir redes; encontrar pontos em comum e criar rapport',
    characteristics: {
      high: [
        'Comunicação clara e persuasiva',
        'Gerencia conflitos efetivamente',
        'Constrói e lidera equipes',
        'Influencia positivamente os outros',
        'Colabora bem em grupos'
      ],
      low: [
        'Comunicação confusa ou agressiva',
        'Evita ou escala conflitos',
        'Dificuldade em trabalhar em equipe',
        'Manipulador ou autoritário',
        'Preferência por trabalho isolado'
      ]
    },
    developmentTips: [
      'Pratique comunicação assertiva',
      'Aprenda técnicas de resolução de conflitos',
      'Busque oportunidades de liderança',
      'Desenvolva sua rede de relacionamentos'
    ]
  }
};

// ============================================
// KEYWORD DETECTION FOR EACH PILLAR
// ============================================
export const EQ_KEYWORDS: Record<EQPillar, { positive: string[]; negative: string[] }> = {
  self_awareness: {
    positive: [
      'eu sei que', 'reconheço que', 'percebo em mim', 'entendo que eu',
      'meu ponto forte', 'meu ponto fraco', 'eu me conheço', 'sou consciente',
      'sei como reajo', 'aprendi sobre mim', 'me observo', 'tenho consciência',
      'minha limitação', 'aceito que', 'admito que', 'sou honesto comigo',
      'reflexão pessoal', 'autoavaliação', 'sei quem sou', 'me identifico como'
    ],
    negative: [
      'não sei por que reagi', 'me surpreendi com', 'não entendo porque fiz',
      'não tenho defeitos', 'sou perfeito', 'os outros é que', 'não preciso mudar',
      'não aceito críticas', 'feedback inútil', 'não tenho problema nenhum',
      'sempre tenho razão', 'não erro nunca', 'culpa dos outros'
    ]
  },
  self_regulation: {
    positive: [
      'mantive a calma', 'respirei fundo', 'pensei antes', 'controlei minha reação',
      'me segurei', 'analisei primeiro', 'esperei para responder', 'mantenho equilíbrio',
      'me adaptei', 'flexível', 'mudei de abordagem', 'ajustei minha estratégia',
      'assumo responsabilidade', 'erro meu', 'preciso melhorar nisso', 'vou trabalhar nisso',
      'paciência', 'disciplina', 'consistente', 'estável'
    ],
    negative: [
      'explodi', 'perdi a cabeça', 'reagi mal', 'não consegui me controlar',
      'impulsivo', 'agi sem pensar', 'me arrependi depois', 'falei sem pensar',
      'não aceito mudança', 'sempre foi assim', 'não vou mudar', 'odeio mudanças',
      'culpa dele', 'não é minha responsabilidade', 'não tenho nada a ver com isso'
    ]
  },
  motivation: {
    positive: [
      'minha meta é', 'estou determinado', 'não vou desistir', 'vou conseguir',
      'me desafio', 'busco melhorar', 'quero crescer', 'meu objetivo',
      'apaixonado por', 'amo o que faço', 'propósito', 'significado',
      'persistente', 'focado', 'comprometido', 'vou até o fim',
      'oportunidade de', 'aprendo com erros', 'obstáculo é aprendizado', 'resiliência'
    ],
    negative: [
      'não vale a pena', 'vou desistir', 'para que esforçar', 'tanto faz',
      'não vou conseguir', 'impossível', 'não adianta', 'desanimar',
      'só faço pelo dinheiro', 'trabalho é só trabalho', 'não me importo',
      'deixa pra lá', 'preguiça', 'não tenho energia', 'sem motivação',
      'por que tentar', 'vou deixar quieto', 'não quero me esforçar'
    ]
  },
  empathy: {
    positive: [
      'entendo como você se sente', 'imagino que deve ser difícil', 'me coloco no seu lugar',
      'compreendo sua posição', 'percebo que você está', 'sinto que você precisa',
      'como posso ajudar', 'estou aqui para ouvir', 'me conta mais', 'quero entender',
      'validando seu sentimento', 'faz sentido você sentir', 'é compreensível',
      'escutando você', 'considerando sua perspectiva', 'do seu ponto de vista',
      'sensível a', 'atento às necessidades', 'preocupado com você'
    ],
    negative: [
      'não é grande coisa', 'para de drama', 'supera', 'não tenho paciência',
      'problema seu', 'não me importa', 'dane-se', 'que se vire',
      'exagerado', 'mimimi', 'frescura', 'bobagem', 'besteira',
      'não quero saber', 'não é comigo', 'cada um com seus problemas'
    ]
  },
  social_skills: {
    positive: [
      'vamos resolver juntos', 'podemos encontrar um meio termo', 'negociar',
      'construir consenso', 'trabalhar em equipe', 'colaborar', 'parceria',
      'influenciar positivamente', 'liderar pelo exemplo', 'inspirar',
      'comunicação clara', 'feedback construtivo', 'resolver conflitos',
      'criar rapport', 'conectar pessoas', 'networking', 'relacionamentos',
      'mediar', 'facilitar', 'coordenar', 'delegar', 'motivar a equipe'
    ],
    negative: [
      'não preciso de ninguém', 'prefiro sozinho', 'não trabalho em equipe',
      'faço do meu jeito', 'não negocio', 'é assim ou nada', 'não aceito opinião',
      'conflito sempre', 'brigar', 'discussão', 'não vou ceder',
      'não tenho paciência com pessoas', 'difícil de lidar', 'não colaboro',
      'manipular', 'forçar', 'impor', 'dominar'
    ]
  }
};

// ============================================
// LEVEL THRESHOLDS AND INFO
// ============================================
export const EQ_LEVEL_INFO: Record<EQLevel, {
  name: string;
  namePt: string;
  range: [number, number];
  color: string;
  bgColor: string;
  description: string;
}> = {
  low: {
    name: 'Low',
    namePt: 'Baixo',
    range: [0, 25],
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    description: 'Área com significativo potencial de desenvolvimento'
  },
  developing: {
    name: 'Developing',
    namePt: 'Em Desenvolvimento',
    range: [26, 45],
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    description: 'Mostra consciência básica, com espaço para crescimento'
  },
  moderate: {
    name: 'Moderate',
    namePt: 'Moderado',
    range: [46, 65],
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    description: 'Competência adequada para a maioria das situações'
  },
  high: {
    name: 'High',
    namePt: 'Alto',
    range: [66, 85],
    color: 'text-success',
    bgColor: 'bg-success/10',
    description: 'Demonstra forte capacidade nesta área'
  },
  exceptional: {
    name: 'Exceptional',
    namePt: 'Excepcional',
    range: [86, 100],
    color: 'text-secondary',
    bgColor: 'bg-secondary/10',
    description: 'Domínio excepcional, potencial para mentoria'
  }
};

// ============================================
// SALES IMPLICATIONS BY EQ PROFILE
// ============================================
export const EQ_SALES_STRATEGIES: Record<EQPillar, {
  highStrategy: string;
  lowStrategy: string;
  negotiationTip: string;
  closingApproach: string;
}> = {
  self_awareness: {
    highStrategy: 'Seja direto e honesto. Pessoas autoconscientes apreciam autenticidade.',
    lowStrategy: 'Forneça feedback sutil e use espelhamento. Evite confrontação direta.',
    negotiationTip: 'Destaque como a solução se alinha com os valores declarados do cliente.',
    closingApproach: 'Pergunte: "Como isso se encaixa no que você sabe sobre si mesmo e suas necessidades?"'
  },
  self_regulation: {
    highStrategy: 'Mantenha ritmo calmo e consistente. Dê tempo para processar.',
    lowStrategy: 'Evite pressão. Dê espaço para reflexão e retome depois.',
    negotiationTip: 'Apresente informações de forma estruturada e previsível.',
    closingApproach: 'Use fechamento suave: "Quando você se sentir pronto, podemos avançar."'
  },
  motivation: {
    highStrategy: 'Conecte benefícios a metas e propósito. Mostre impacto a longo prazo.',
    lowStrategy: 'Foque em benefícios imediatos e tangíveis. Reduza fricção.',
    negotiationTip: 'Enfatize como a solução ajuda a alcançar objetivos importantes.',
    closingApproach: 'Pergunte: "Como isso te aproxima das suas metas?"'
  },
  empathy: {
    highStrategy: 'Construa relacionamento genuíno. Compartilhe histórias e conexões.',
    lowStrategy: 'Foque em fatos e lógica. Mantenha abordagem mais transacional.',
    negotiationTip: 'Para alta empatia: mostre impacto na equipe/família. Para baixa: foque em benefícios pessoais.',
    closingApproach: 'Use: "Como isso vai impactar as pessoas importantes para você?"'
  },
  social_skills: {
    highStrategy: 'Envolva em processo colaborativo. Peça input e feedback.',
    lowStrategy: 'Simplifique interações. Seja claro e objetivo nas comunicações.',
    negotiationTip: 'Pessoas com altas habilidades sociais gostam de co-criar soluções.',
    closingApproach: 'Convide: "Vamos definir juntos os próximos passos?"'
  }
};

// ============================================
// HELPER FUNCTION TO GET LEVEL FROM SCORE
// ============================================
export function getEQLevel(score: number): EQLevel {
  if (score <= 25) return 'low';
  if (score <= 45) return 'developing';
  if (score <= 65) return 'moderate';
  if (score <= 85) return 'high';
  return 'exceptional';
}

// ============================================
// GENERATE PILLAR INSIGHTS
// ============================================
export function generatePillarInsights(pillar: EQPillar, score: number): string[] {
  const level = getEQLevel(score);
  const info = EQ_PILLAR_INFO[pillar];
  const insights: string[] = [];

  if (level === 'high' || level === 'exceptional') {
    insights.push(`${info.namePt} é um ponto forte natural`);
    insights.push(`Use como base para influenciar positivamente`);
    info.characteristics.high.slice(0, 2).forEach(c => insights.push(c));
  } else if (level === 'moderate') {
    insights.push(`${info.namePt} está em nível adequado`);
    insights.push(`Há espaço para desenvolvimento`);
  } else {
    insights.push(`${info.namePt} é uma área de atenção`);
    info.developmentTips.slice(0, 2).forEach(tip => insights.push(`Dica: ${tip}`));
  }

  return insights;
}
