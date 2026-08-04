// ==============================================
// OWNERSHIP TRANSFER - DATA
// "Let the other person feel that the idea is theirs" - Dale Carnegie
// ==============================================

import { OwnershipTechnique } from '@/types/carnegie-extended';

// ============================================
// OWNERSHIP TRANSFER TECHNIQUES
// ============================================
export const OWNERSHIP_TECHNIQUES: OwnershipTechnique[] = [
  // ============================================
  // THE SEED PLANTER
  // ============================================
  {
    id: 'ownership_seed',
    name: 'O Plantador de Sementes',
    description: 'Plante a ideia sutilmente e deixe o outro "descobrir"',
    setupPhrase: 'Sabe, tenho pensado em algo que você disse na última conversa...',
    seedingPhrase: 'Você mencionou [algo que ele disse], e isso me fez refletir...',
    confirmationPhrase: 'Interessante como VOCÊ chegou a essa conclusão...',
    celebrationPhrase: 'Essa sua ideia é brilhante! Por que eu não pensei nisso?',
    fullScript: `Sabe, tenho pensado em algo que você disse na última conversa... Você mencionou [algo que ele disse], e isso me fez refletir.

E eu fiquei pensando: o que você acha se [sua ideia apresentada como pergunta]?

[Deixe ele elaborar]

Interessante como VOCÊ chegou a essa conclusão! Essa sua ideia é brilhante - por que eu não pensei nisso antes?`,
    whenToUse: [
      'Quando precisa introduzir uma ideia nova',
      'Quando o cliente é resistente a sugestões externas',
      'Para clientes com alto D no DISC (gostam de liderar)'
    ]
  },
  
  // ============================================
  // THE QUESTION GUIDE
  // ============================================
  {
    id: 'ownership_questions',
    name: 'O Guia por Perguntas',
    description: 'Use perguntas para guiar o cliente até sua própria "descoberta"',
    setupPhrase: 'Deixa eu te fazer algumas perguntas para entender melhor...',
    seedingPhrase: 'E se você pudesse [cenário ideal], como seria?',
    confirmationPhrase: 'Você acabou de descrever exatamente o que eu ia sugerir!',
    celebrationPhrase: 'Incrível como você chegou nisso sozinho.',
    fullScript: `Deixa eu te fazer algumas perguntas para entender melhor...

- O que seria o cenário ideal para você?
- Se não houvesse limitações, como seria?
- O que te impede de ter isso hoje?
- E se existisse uma forma de [sua solução como possibilidade]?

[Deixe ele conectar os pontos]

Você acabou de descrever exatamente o que eu ia sugerir! Incrível como você chegou nisso sozinho.`,
    whenToUse: [
      'Para clientes analíticos (alto C)',
      'Quando precisa que o cliente "compre" a ideia',
      'Em processos de consultoria e descoberta'
    ]
  },
  
  // ============================================
  // THE COLLABORATION FRAME
  // ============================================
  {
    id: 'ownership_collab',
    name: 'O Frame de Colaboração',
    description: 'Posicione a ideia como algo construído juntos',
    setupPhrase: 'Vamos pensar juntos sobre isso...',
    seedingPhrase: 'Combinando o que você disse com algumas ideias que tenho...',
    confirmationPhrase: 'Olha o que a gente criou! Isso é nosso.',
    celebrationPhrase: 'Essa solução que você ajudou a construir é perfeita.',
    fullScript: `Vamos pensar juntos sobre isso... Você tem insights que eu não tenho.

Combinando o que você disse sobre [ponto dele] com algumas ideias que tenho sobre [seu ponto]... O que você acha?

[Construam juntos]

Olha o que a gente criou! Essa solução que você ajudou a construir é perfeita. Eu sozinho não teria chegado aqui.`,
    whenToUse: [
      'Para clientes relacionais (alto S/I)',
      'Quando quer fortalecer parceria',
      'Em projetos de longo prazo'
    ]
  },
  
  // ============================================
  // THE CHOICE ARCHITECT
  // ============================================
  {
    id: 'ownership_choice',
    name: 'O Arquiteto de Escolhas',
    description: 'Apresente opções onde todas levam ao objetivo, deixando-o "escolher"',
    setupPhrase: 'Tenho três abordagens possíveis aqui...',
    seedingPhrase: 'Você conhece o contexto melhor que ninguém. Qual dessas faz mais sentido?',
    confirmationPhrase: 'Ótima escolha! Exatamente o que eu teria recomendado.',
    celebrationPhrase: 'Sua intuição para essa decisão foi certeira.',
    fullScript: `Tenho três abordagens possíveis aqui:

A) [Opção 1 - aceitável]
B) [Opção 2 - ideal]
C) [Opção 3 - premium]

Você conhece o contexto melhor que ninguém. Qual dessas faz mais sentido para sua situação?

[Deixe escolher]

Ótima escolha! Exatamente o que eu teria recomendado. Sua intuição para essa decisão foi certeira.`,
    whenToUse: [
      'Para dar senso de controle',
      'Com clientes que precisam sentir que decidem',
      'Quando qualquer opção é aceitável'
    ]
  },
  
  // ============================================
  // THE REFLECTION MIRROR
  // ============================================
  {
    id: 'ownership_mirror',
    name: 'O Espelho de Reflexão',
    description: 'Reflita as palavras dele de volta, tornando sua ideia uma extensão do que ele disse',
    setupPhrase: 'O que você acabou de dizer é muito interessante...',
    seedingPhrase: 'Se eu entendi bem, você está sugerindo que [sua ideia em palavras dele]...',
    confirmationPhrase: 'Exatamente! É isso que você está dizendo.',
    celebrationPhrase: 'Você articulou isso perfeitamente.',
    fullScript: `O que você acabou de dizer é muito interessante... Deixa eu ver se entendi.

Se eu entendi bem, você está sugerindo que [sua ideia reformulada com palavras e exemplos dele]...

É isso?

[Ele confirma ou ajusta]

Exatamente! Você articulou isso perfeitamente. Essa visão é muito clara.`,
    whenToUse: [
      'Durante conversas de descoberta',
      'Para reforçar pontos importantes',
      'Para clientes que falam muito'
    ]
  },
  
  // ============================================
  // THE CONSULTANT FLIP
  // ============================================
  {
    id: 'ownership_flip',
    name: 'A Inversão de Papéis',
    description: 'Peça conselho ao cliente, fazendo-o elaborar a solução',
    setupPhrase: 'Você tem experiência nisso que eu não tenho...',
    seedingPhrase: 'Se você fosse eu, o que você recomendaria aqui?',
    confirmationPhrase: 'Isso é exatamente o que eu estava pensando! Você é muito perspicaz.',
    celebrationPhrase: 'Vou seguir sua recomendação.',
    fullScript: `Você tem experiência nisso que eu não tenho... E eu valorizo muito sua perspectiva.

Se você fosse eu, tendo os recursos que temos, o que você recomendaria aqui?

[Deixe elaborar]

Isso é exatamente o que eu estava pensando! Você é muito perspicaz. Vou seguir sua recomendação.`,
    whenToUse: [
      'Para clientes seniores ou especialistas',
      'Quando quer elevar o ego do cliente',
      'Para criar reciprocidade'
    ]
  }
];

// ============================================
// OWNERSHIP LANGUAGE PATTERNS
// ============================================
export const OWNERSHIP_LANGUAGE = {
  toAvoid: [
    'Eu sugiro que',
    'Minha recomendação é',
    'Você deveria',
    'O correto seria',
    'Na minha opinião',
    'A melhor opção é'
  ],
  
  toUse: [
    'O que você acha de...?',
    'Como você vê...?',
    'Você mencionou que... e se expandíssemos isso?',
    'Baseado no que você disse...',
    'Sua ideia de [x] me fez pensar...',
    'Você poderia considerar...'
  ],
  
  celebration: [
    'Essa sua ideia é brilhante!',
    'Por que eu não pensei nisso?',
    'Você chegou exatamente onde eu queria.',
    'Sua intuição foi certeira.',
    'Você conectou os pontos perfeitamente.',
    'Isso que você construiu é incrível.'
  ],
  
  attribution: [
    'Como você disse antes...',
    'Retomando sua ideia de...',
    'Expandindo o que você mencionou...',
    'Usando seu conceito de...',
    'Aplicando sua sugestão de...'
  ]
};

// ============================================
// OWNERSHIP BY DISC
// ============================================
export const OWNERSHIP_BY_DISC: Record<'D' | 'I' | 'S' | 'C', {
  approach: string;
  techniques: string[];
  language: string[];
  avoid: string[];
}> = {
  D: {
    approach: 'Deixe-os "descobrir" a solução e tomar a decisão',
    techniques: ['ownership_choice', 'ownership_flip'],
    language: [
      'Você decide - qual caminho quer seguir?',
      'Você está no comando aqui.',
      'A decisão é sua.'
    ],
    avoid: [
      'Parecer que está ditando o que fazer',
      'Muitas opções (confunde)',
      'Explicações longas antes de dar controle'
    ]
  },
  
  I: {
    approach: 'Construa junto e celebre a criação compartilhada',
    techniques: ['ownership_collab', 'ownership_mirror'],
    language: [
      'Adorei sua ideia! Vamos expandir juntos?',
      'Que criativo! Isso abre várias possibilidades!',
      'Você é muito bom nisso!'
    ],
    avoid: [
      'Tomar crédito pelo que ele disse',
      'Corrigir ideias diretamente',
      'Ser muito técnico ou seco'
    ]
  },
  
  S: {
    approach: 'Faça parecer que a ideia beneficia o grupo/família',
    techniques: ['ownership_collab', 'ownership_questions'],
    language: [
      'Sua equipe vai adorar essa sua ideia.',
      'Isso que você construiu vai ajudar muita gente.',
      'Você sempre pensa nos outros, né?'
    ],
    avoid: [
      'Pressionar por decisão rápida',
      'Parecer que é só ideia sua',
      'Ignorar preocupações com outros'
    ]
  },
  
  C: {
    approach: 'Guie com dados e deixe-o "chegar" na conclusão lógica',
    techniques: ['ownership_questions', 'ownership_mirror'],
    language: [
      'Sua análise está correta.',
      'Os dados confirmam sua hipótese.',
      'Você fez a conexão certa.'
    ],
    avoid: [
      'Conclusões sem fundamento',
      'Pressionar emocionalmente',
      'Ignorar suas ressalvas'
    ]
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================
export function getOwnershipTechnique(id: string): OwnershipTechnique | undefined {
  return OWNERSHIP_TECHNIQUES.find(t => t.id === id);
}

export function getTechniquesForDISC(discProfile: 'D' | 'I' | 'S' | 'C'): OwnershipTechnique[] {
  const profile = OWNERSHIP_BY_DISC[discProfile];
  return profile.techniques.map(id => getOwnershipTechnique(id)).filter(Boolean) as OwnershipTechnique[];
}

export function analyzeOwnershipLanguage(text: string): {
  ownershipGiven: boolean;
  problematicPhrases: string[];
  suggestions: string[];
} {
  const problematicPhrases: string[] = [];
  const textLower = text.toLowerCase();
  
  for (const phrase of OWNERSHIP_LANGUAGE.toAvoid) {
    // Strip ellipsis and trailing whitespace for matching
    const cleanPhrase = phrase.replace(/\.{2,}/g, '').trim().toLowerCase();
    if (cleanPhrase && textLower.includes(cleanPhrase)) {
      problematicPhrases.push(phrase);
    }
  }
  
  const ownershipGiven = problematicPhrases.length === 0 && 
    OWNERSHIP_LANGUAGE.toUse.some(phrase => {
      const cleanPhrase = phrase.replace(/\.{2,}/g, '').replace(/\?$/, '').trim().toLowerCase();
      return cleanPhrase && textLower.includes(cleanPhrase);
    });
  
  return {
    ownershipGiven,
    problematicPhrases,
    suggestions: ownershipGiven ? [] : OWNERSHIP_LANGUAGE.toUse.slice(0, 3)
  };
}
