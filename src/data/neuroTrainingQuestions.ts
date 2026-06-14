
export interface TrainingQuestion {
  id: string;
  type: 'identify_brain' | 'match_stimulus' | 'choose_approach';
  scenario: string;
  options: {
    id: string;
    label: string;
    isCorrect: boolean;
    explanation: string;
  }[];
  hint: string;
  learningPoint: string;
}

export const TRAINING_QUESTIONS: TrainingQuestion[] = [
  {
    id: 'q1',
    type: 'identify_brain',
    scenario: 'O cliente diz: "Preciso resolver isso AGORA, meus concorrentes estão avançando e não posso ficar para trás!"',
    options: [
      { id: 'reptilian', label: 'Cérebro Reptiliano', isCorrect: true, explanation: 'Palavras como "AGORA", "concorrentes" e "ficar para trás" indicam medo e urgência - gatilhos reptilianos.' },
      { id: 'limbic', label: 'Cérebro Límbico', isCorrect: false, explanation: 'O cérebro límbico focaria em relacionamentos e emoções positivas, não em medo.' },
      { id: 'neocortex', label: 'Neocórtex', isCorrect: false, explanation: 'O neocórtex buscaria dados e análise lógica, não expressaria urgência emocional.' }
    ],
    hint: 'Procure palavras relacionadas a sobrevivência, medo ou urgência.',
    learningPoint: 'O cérebro reptiliano é ativado por ameaças à sobrevivência e urgência. Use contrastes (antes/depois) e garantias.'
  },
  {
    id: 'q2',
    type: 'identify_brain',
    scenario: 'O cliente diz: "Antes de decidir, preciso ver os dados de ROI, comparar com outras opções e analisar o custo-benefício detalhadamente."',
    options: [
      { id: 'reptilian', label: 'Cérebro Reptiliano', isCorrect: false, explanation: 'Não há indicadores de urgência ou medo nesta fala.' },
      { id: 'limbic', label: 'Cérebro Límbico', isCorrect: false, explanation: 'Não há foco em relacionamentos ou emoções.' },
      { id: 'neocortex', label: 'Neocórtex', isCorrect: true, explanation: 'Palavras como "dados", "comparar", "analisar" e "custo-benefício" são típicas do pensamento analítico.' }
    ],
    hint: 'Este cliente está pedindo informações para análise racional.',
    learningPoint: 'O neocórtex processa lógica e dados. Forneça comparações, estatísticas e tempo para análise.'
  },
  {
    id: 'q3',
    type: 'identify_brain',
    scenario: 'O cliente diz: "O mais importante para mim é trabalhar com alguém em quem eu confie. Vocês parecem ser pessoas boas, isso conta muito."',
    options: [
      { id: 'reptilian', label: 'Cérebro Reptiliano', isCorrect: false, explanation: 'Não há indicadores de medo ou urgência.' },
      { id: 'limbic', label: 'Cérebro Límbico', isCorrect: true, explanation: 'Foco em confiança, pessoas e relacionamento são características do cérebro límbico.' },
      { id: 'neocortex', label: 'Neocórtex', isCorrect: false, explanation: 'A decisão não está baseada em análise lógica.' }
    ],
    hint: 'Este cliente valoriza aspectos emocionais e relacionais.',
    learningPoint: 'O cérebro límbico é o centro das emoções e confiança. Construa rapport, use storytelling e mostre valores compartilhados.'
  },
  {
    id: 'q4',
    type: 'match_stimulus',
    scenario: 'Qual estímulo primal é ativado quando você mostra "ANTES: R$ 50.000 de prejuízo | DEPOIS: R$ 200.000 de lucro"?',
    options: [
      { id: 'contrast', label: 'Contraste', isCorrect: true, explanation: 'A comparação direta Antes/Depois é o estímulo de Contraste puro.' },
      { id: 'tangible', label: 'Tangível', isCorrect: false, explanation: 'Embora os números sejam tangíveis, o principal estímulo aqui é o contraste.' },
      { id: 'emotional', label: 'Emocional', isCorrect: false, explanation: 'O contraste pode gerar emoção, mas não é o estímulo primário aqui.' }
    ],
    hint: 'Observe a estrutura da mensagem: ela compara dois estados.',
    learningPoint: 'O Contraste ajuda o cérebro primitivo a decidir rapidamente. Sempre mostre o "antes sem você" vs "depois com você".'
  },
  {
    id: 'q5',
    type: 'match_stimulus',
    scenario: 'Qual estímulo é ativado com: "Em 30 dias, você vai recuperar R$ 15.000, ou devolvemos seu dinheiro."?',
    options: [
      { id: 'self_centered', label: 'Egocêntrico', isCorrect: false, explanation: 'O "você" está presente, mas não é o estímulo principal.' },
      { id: 'tangible', label: 'Tangível', isCorrect: true, explanation: 'Números específicos (30 dias, R$ 15.000) e garantia concreta ativam o estímulo Tangível.' },
      { id: 'memorable', label: 'Memorável', isCorrect: false, explanation: 'A frase pode ser lembrada, mas o estímulo principal são os dados concretos.' }
    ],
    hint: 'Procure elementos concretos, específicos e mensuráveis.',
    learningPoint: 'O estímulo Tangível usa números específicos, prazos exatos e provas concretas para criar credibilidade.'
  },
  {
    id: 'q6',
    type: 'choose_approach',
    scenario: 'Um cliente reptiliano está hesitando. Qual é a melhor abordagem?',
    options: [
      { id: 'a', label: 'Mostrar casos de sucesso de clientes parecidos', isCorrect: false, explanation: 'Isso funcionaria melhor com o cérebro límbico.' },
      { id: 'b', label: 'Criar urgência mostrando o custo de não agir agora', isCorrect: true, explanation: 'O reptiliano responde a ameaças e perdas. Mostre o que ele PERDE por esperar.' },
      { id: 'c', label: 'Apresentar uma análise detalhada de ROI', isCorrect: false, explanation: 'Isso funcionaria melhor com o neocórtex.' }
    ],
    hint: 'O cérebro reptiliano é motivado por sobrevivência e evitar perdas.',
    learningPoint: 'Para o reptiliano: crie urgência genuína, mostre perdas por inação, e ofereça segurança/garantias.'
  },
  {
    id: 'q7',
    type: 'choose_approach',
    scenario: 'Um cliente com neocórtex dominante pede mais tempo para decidir. O que fazer?',
    options: [
      { id: 'a', label: 'Pressionar com desconto por tempo limitado', isCorrect: false, explanation: 'Isso pode parecer manipulativo e afastar o cliente analítico.' },
      { id: 'b', label: 'Oferecer documentação comparativa e marcar follow-up', isCorrect: true, explanation: 'O neocórtex precisa de dados para processar. Respeite o tempo e forneça informação.' },
      { id: 'c', label: 'Compartilhar histórias emocionais de outros clientes', isCorrect: false, explanation: 'Histórias funcionam melhor com o cérebro límbico.' }
    ],
    hint: 'O neocórtex valoriza análise racional e tempo para processar.',
    learningPoint: 'Para o neocórtex: forneça dados, comparações e documentação. Nunca pressione - deixe ele processar.'
  },
  {
    id: 'q8',
    type: 'choose_approach',
    scenario: 'Como construir confiança com um cliente de cérebro límbico dominante?',
    options: [
      { id: 'a', label: 'Mostrar estatísticas impressionantes de resultados', isCorrect: false, explanation: 'Estatísticas são mais eficazes com o neocórtex.' },
      { id: 'b', label: 'Criar urgência sobre o risco de não agir', isCorrect: false, explanation: 'Urgência funciona melhor com o reptiliano.' },
      { id: 'c', label: 'Compartilhar histórias pessoais e mostrar valores em comum', isCorrect: true, explanation: 'O límbico é conectado por emoções, histórias e valores compartilhados.' }
    ],
    hint: 'O cérebro límbico é o centro das emoções e relacionamentos.',
    learningPoint: 'Para o límbico: use storytelling, mostre empatia, encontre valores em comum e construa relacionamento antes de vender.'
  }
];
