import { DISCProfile, DISC_LABELS } from '@/types';
import { VAKType } from '@/types/vak';

// ============================================
// Types
// ============================================

export interface SalespersonProfile {
  vakProfile: VAKType | null;
  discProfile: DISCProfile | null;
  metaprograms: {
    motivationDirection: string | null;
    referenceFrame: string | null;
    workingStyle: string | null;
    chunkSize: string | null;
    actionFilter: string | null;
    comparisonStyle: string | null;
  };
}

export interface TrainingScenario {
  id: string;
  title: string;
  description: string;
  clientProfile: {
    disc: DISCProfile;
    vak: VAKType;
    motivation: string;
  };
  situation: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    explanation: string;
  }[];
}

export interface TrainingTip {
  title: string;
  description: string;
  examples: string[];
  doList: string[];
  dontList: string[];
}

// ============================================
// DISC Training Data (16 combinations)
// ============================================

export const DISC_TRAINING: Record<DISCProfile, Record<DISCProfile, TrainingTip>> = {
  D: {
    D: {
      title: 'D para D: Dois Dominantes',
      description: 'Dois perfis dominantes podem gerar conflito ou excelente sinergia.',
      examples: ['"Vou direto ao ponto: isso vai te dar 30% mais resultados."', '"Qual é sua meta? Vou te mostrar como chegar lá mais rápido."'],
      doList: ['Seja direto e objetivo', 'Foque em resultados e números', 'Respeite o tempo dele', 'Deixe espaço para ele liderar algumas decisões'],
      dontList: ['Não seja prolixo', 'Não pareça inseguro', 'Não ceda em tudo - mantenha sua posição quando necessário', 'Não entre em competição desnecessária'],
    },
    I: {
      title: 'D para I: Dominante para Influente',
      description: 'Excelente combinação! Você traz foco, ele traz energia.',
      examples: ['"Imagina o impacto que isso vai causar na sua equipe!"', '"Vamos fazer acontecer juntos - você vai adorar os resultados."'],
      doList: ['Seja entusiasta (mas autêntico)', 'Conecte os resultados com reconhecimento social', 'Permita momentos de descontração', 'Use histórias de sucesso de outros clientes'],
      dontList: ['Não seja frio demais', 'Não ignore as ideias dele', 'Não pressione demais nos detalhes', 'Não corte a empolgação dele'],
    },
    S: {
      title: 'D para S: Dominante para Estável',
      description: 'Desacelere! Seu cliente precisa de segurança e tempo.',
      examples: ['"Não precisa decidir agora. Que tal revisarmos isso juntos com calma?"', '"Muitas empresas como a sua passaram por essa transição com sucesso."'],
      doList: ['Reduza o ritmo da conversa', 'Mostre estabilidade e segurança', 'Envolva a equipe dele nas decisões', 'Garanta suporte pós-venda'],
      dontList: ['Não pressione por decisões rápidas', 'Não mude as coisas bruscamente', 'Não ignore as preocupações dele', 'Não seja impaciente'],
    },
    C: {
      title: 'D para C: Dominante para Conforme',
      description: 'Traga dados e detalhes. Ele precisa de precisão.',
      examples: ['"Aqui estão os dados técnicos que comprovam isso..."', '"O ROI calculado é de 23,5% em 18 meses, baseado em..."'],
      doList: ['Prepare documentação detalhada', 'Seja preciso com números e fatos', 'Dê tempo para análise', 'Responda perguntas técnicas com profundidade'],
      dontList: ['Não seja vago ou impreciso', 'Não apresse as análises', 'Não ignore detalhes importantes', 'Não use apenas emoção para convencer'],
    },
  },
  I: {
    D: {
      title: 'I para D: Influente para Dominante',
      description: 'Seja mais objetivo e focado em resultados.',
      examples: ['"Em resumo: 3 benefícios principais, ROI em 6 meses."', '"Qual é sua prioridade número 1? Vamos resolver isso."'],
      doList: ['Vá direto ao ponto', 'Foque em resultados mensuráveis', 'Seja conciso nas explicações', 'Mostre competência e confiança'],
      dontList: ['Não divague em histórias longas', 'Não seja excessivamente informal', 'Não pareça desorganizado', 'Não foque só em relacionamento'],
    },
    I: {
      title: 'I para I: Dois Influentes',
      description: 'Muita diversão, pouca execução. Mantenha o foco!',
      examples: ['"Adorei essa ideia! E se a gente fechasse isso agora para comemorar?"', '"Imagina a reação do pessoal quando virem isso funcionando!"'],
      doList: ['Aproveite a energia positiva', 'Crie urgência de forma divertida', 'Use a conexão para fechar negócios', 'Mantenha um roteiro mental para não perder o foco'],
      dontList: ['Não deixe virar só conversa', 'Não esqueça de fechar a venda', 'Não prometa além do que pode cumprir', 'Não perca o controle da reunião'],
    },
    S: {
      title: 'I para S: Influente para Estável',
      description: 'Boa sintonia! Não pressione demais.',
      examples: ['"Vamos fazer isso juntos, passo a passo, sem pressa."', '"Sua equipe vai ficar muito mais tranquila com essa solução."'],
      doList: ['Construa confiança genuína', 'Mostre como a mudança será suave', 'Envolva a equipe dele', 'Seja paciente e presente'],
      dontList: ['Não seja muito intenso', 'Não force mudanças rápidas', 'Não ignore as preocupações', 'Não pareça superficial'],
    },
    C: {
      title: 'I para C: Influente para Conforme',
      description: 'Ele pode te achar "superficial". Traga mais fatos!',
      examples: ['"Preparei essa análise detalhada para você revisar..."', '"Os dados mostram uma melhoria de 28% nos indicadores."'],
      doList: ['Prepare documentação sólida', 'Seja mais estruturado que o normal', 'Responda com dados, não só entusiasmo', 'Respeite o tempo de análise dele'],
      dontList: ['Não exagere na informalidade', 'Não ignore perguntas técnicas', 'Não pressione por decisões emocionais', 'Não seja impreciso com números'],
    },
  },
  S: {
    D: {
      title: 'S para D: Estável para Dominante',
      description: 'Desafio: ele é rápido, você é cauteloso. Prepare-se!',
      examples: ['"Aqui está o resumo executivo com os 3 pontos principais."', '"Posso te dar a resposta agora: a solução é X."'],
      doList: ['Prepare-se antecipadamente', 'Seja mais direto que o habitual', 'Tenha respostas prontas', 'Mostre confiança (mesmo que sinta insegurança)'],
      dontList: ['Não hesite demais', 'Não peça muito tempo para pensar', 'Não pareça indeciso', 'Não foque em detalhes que ele não pediu'],
    },
    I: {
      title: 'S para I: Estável para Influente',
      description: 'Boa conexão emocional. Canalize a energia!',
      examples: ['"Adoro seu entusiasmo! Vamos transformar isso em ação?"', '"Que tal fecharmos isso e depois celebramos juntos?"'],
      doList: ['Aprecie a energia dele', 'Ajude a canalizar ideias em ações', 'Seja mais expressivo que o normal', 'Use a conexão para avançar'],
      dontList: ['Não seja excessivamente cauteloso', 'Não desanime a empolgação dele', 'Não fique só escutando', 'Não deixe passar oportunidades de fechar'],
    },
    S: {
      title: 'S para S: Dois Estáveis',
      description: 'Conforto excessivo pode travar a venda!',
      examples: ['"Sei que mudanças são difíceis, mas que tal darmos o primeiro passo hoje?"', '"Podemos fazer uma transição gradual, começando por..."'],
      doList: ['Crie uma urgência gentil', 'Proponha primeiros passos pequenos', 'Mostre que a mudança será segura', 'Estabeleça prazos amigáveis'],
      dontList: ['Não deixe a conversa arrastar', 'Não evite propor ações concretas', 'Não tenha medo de avançar', 'Não fique na zona de conforto'],
    },
    C: {
      title: 'S para C: Estável para Conforme',
      description: 'Sintonia natural. Ambos gostam de processo.',
      examples: ['"Preparei toda a documentação que você precisa para analisar."', '"O processo tem 5 etapas bem definidas, cada uma com..."'],
      doList: ['Prepare documentação completa', 'Mostre processos estruturados', 'Seja preciso e organizado', 'Dê tempo adequado para análise'],
      dontList: ['Não deixe a venda arrastar demais', 'Não evite definir prazos', 'Não seja passivo demais', 'Não espere ele tomar iniciativa'],
    },
  },
  C: {
    D: {
      title: 'C para D: Conforme para Dominante',
      description: 'Ele quer velocidade, você quer análise. Resumos!',
      examples: ['"Em uma frase: ROI de 25% em 12 meses."', '"Três pontos principais: custo, prazo, resultado."'],
      doList: ['Prepare resumos executivos', 'Destaque apenas dados chave', 'Seja mais rápido que o normal', 'Tenha detalhes prontos se ele pedir'],
      dontList: ['Não comece pelos detalhes', 'Não sobrecarregue com informações', 'Não hesite em dar opiniões', 'Não pareça inseguro'],
    },
    I: {
      title: 'C para I: Conforme para Influente',
      description: 'Ele é emocional, você é lógico. Equilibre!',
      examples: ['"Imagina como vai ser incrível quando os números mostrarem..."', '"Isso vai ser um sucesso! E os dados comprovam."'],
      doList: ['Adicione entusiasmo à sua apresentação', 'Conecte dados com benefícios emocionais', 'Seja mais flexível e informal', 'Use histórias além de números'],
      dontList: ['Não seja excessivamente técnico', 'Não ignore a necessidade de conexão', 'Não pareça frio ou distante', 'Não foque só em detalhes'],
    },
    S: {
      title: 'C para S: Conforme para Estável',
      description: 'Vocês se entendem bem. Avance com cuidado!',
      examples: ['"O processo é bem estruturado e toda sua equipe terá suporte."', '"Vamos fazer isso de forma gradual e segura."'],
      doList: ['Mostre estrutura e segurança', 'Envolva a equipe dele', 'Seja paciente mas proponha ações', 'Garanta suporte contínuo'],
      dontList: ['Não deixe arrastar demais', 'Não seja passivo', 'Não evite propor datas', 'Não esqueça de avançar a venda'],
    },
    C: {
      title: 'C para C: Dois Conformes',
      description: 'Análise paralisia! Estabeleça deadlines.',
      examples: ['"Temos todos os dados. Que tal definirmos uma data para decidir?"', '"A análise está completa. Próximo passo?"'],
      doList: ['Estabeleça prazos claros', 'Proponha uma data de decisão', 'Mostre que a análise está completa', 'Tome a iniciativa de avançar'],
      dontList: ['Não fique apenas trocando dados', 'Não evite propor fechamento', 'Não espere ele tomar iniciativa', 'Não deixe a venda no limbo'],
    },
  },
};

// ============================================
// VAK Training Data (16 combinations)
// ============================================

export const VAK_TRAINING: Record<VAKType, Record<VAKType, TrainingTip>> = {
  V: {
    V: { title: 'Visual para Visual', description: 'Comunicação natural! Use sua linguagem visual.', examples: ['"Veja como isso funciona..."', '"Imagine o cenário..."', '"Está claro para você?"'], doList: ['Use recursos visuais', 'Mostre gráficos e imagens', 'Desenhe diagramas', 'Use cores e formatos'], dontList: ['Não fale demais sem mostrar', 'Não ignore apresentações visuais'] },
    A: { title: 'Visual para Auditivo', description: 'Adapte! Ele precisa ouvir, não só ver.', examples: ['"Deixa eu te explicar como funciona..."', '"Faz sentido o que estou dizendo?"', '"Como isso soa para você?"'], doList: ['Explique verbalmente mais', 'Use tons de voz variados', 'Faça perguntas abertas', 'Permita que ele fale'], dontList: ['Não dependa só de slides', 'Não vá rápido demais nas explicações'] },
    K: { title: 'Visual para Cinestésico', description: 'Saia do visual! Ele precisa sentir e tocar.', examples: ['"Como você se sente em relação a isso?"', '"Vamos testar isso juntos?"', '"Qual é sua sensação?"'], doList: ['Ofereça demonstrações práticas', 'Use exemplos concretos', 'Pergunte sobre sensações', 'Deixe ele experimentar'], dontList: ['Não fique só mostrando', 'Não apresse a experiência'] },
    D: { title: 'Visual para Digital', description: 'Traga mais lógica e dados estruturados.', examples: ['"Os dados mostram que..."', '"Analisando logicamente..."', '"Faz sentido racional?"'], doList: ['Use dados e estatísticas', 'Seja lógico e estruturado', 'Apresente argumentos', 'Mostre análises'], dontList: ['Não dependa só de imagens', 'Não ignore a necessidade de lógica'] },
  },
  A: {
    V: { title: 'Auditivo para Visual', description: 'Use mais recursos visuais!', examples: ['"Olha só essa imagem..."', '"Veja este gráfico..."', '"Visualize como será..."'], doList: ['Prepare slides visuais', 'Use diagramas e gráficos', 'Mostre antes de explicar', 'Use cores estrategicamente'], dontList: ['Não só fale', 'Não ignore recursos visuais'] },
    A: { title: 'Auditivo para Auditivo', description: 'Comunicação natural! Use diálogo.', examples: ['"Vamos conversar sobre isso..."', '"Como isso soa?"', '"Faz eco para você?"'], doList: ['Dialogue bastante', 'Use variação de tom', 'Ouça atentamente', 'Faça perguntas'], dontList: ['Não monopolize a conversa', 'Não ignore o que ele diz'] },
    K: { title: 'Auditivo para Cinestésico', description: 'Menos conversa, mais ação e experiência.', examples: ['"Vamos experimentar isso?"', '"Como você se sente?"', '"Qual é a sensação?"'], doList: ['Ofereça experiências práticas', 'Pergunte sobre sentimentos', 'Reduza explicações longas', 'Deixe ele interagir'], dontList: ['Não fale demais', 'Não ignore a experiência física'] },
    D: { title: 'Auditivo para Digital', description: 'Seja mais lógico e estruturado.', examples: ['"Analisando os dados..."', '"Logicamente..."', '"Os fatos mostram..."'], doList: ['Estruture sua argumentação', 'Use dados e fatos', 'Seja preciso', 'Apresente análises'], dontList: ['Não seja só conversador', 'Não ignore a lógica'] },
  },
  K: {
    V: { title: 'Cinestésico para Visual', description: 'Use mais recursos visuais!', examples: ['"Olha essa apresentação..."', '"Veja o gráfico..."', '"Observe como..."'], doList: ['Prepare materiais visuais', 'Use cores e imagens', 'Mostre diagramas', 'Destaque visualmente'], dontList: ['Não só demonstre fisicamente', 'Não ignore recursos visuais'] },
    A: { title: 'Cinestésico para Auditivo', description: 'Explique mais verbalmente!', examples: ['"Deixa eu explicar..."', '"Como isso soa?"', '"Faz sentido o que digo?"'], doList: ['Explique detalhadamente', 'Dialogue mais', 'Use tom de voz variado', 'Pergunte opinião verbal'], dontList: ['Não dependa só de demonstrações', 'Não fique em silêncio'] },
    K: { title: 'Cinestésico para Cinestésico', description: 'Comunicação natural! Use experiências.', examples: ['"Vamos experimentar juntos..."', '"Qual a sensação?"', '"Sente a diferença?"'], doList: ['Ofereça experiências práticas', 'Use exemplos tangíveis', 'Pergunte sobre sentimentos', 'Demonstre produtos'], dontList: ['Não só fale', 'Não ignore a experiência física'] },
    D: { title: 'Cinestésico para Digital', description: 'Traga mais dados e lógica.', examples: ['"Os dados comprovam..."', '"Analisando logicamente..."', '"Os números mostram..."'], doList: ['Prepare análises estruturadas', 'Use dados e estatísticas', 'Seja lógico', 'Apresente argumentos'], dontList: ['Não dependa só de experiências', 'Não ignore a necessidade de lógica'] },
  },
  D: {
    V: { title: 'Digital para Visual', description: 'Use mais recursos visuais!', examples: ['"Olha esse gráfico..."', '"Veja a imagem..."', '"Observe como..."'], doList: ['Transforme dados em gráficos', 'Use infográficos', 'Mostre visualmente', 'Use cores estratégicas'], dontList: ['Não só liste dados', 'Não ignore recursos visuais'] },
    A: { title: 'Digital para Auditivo', description: 'Converse mais, explique verbalmente.', examples: ['"Deixa eu te contar..."', '"Como isso soa?"', '"Faz sentido?"'], doList: ['Dialogue mais', 'Explique com palavras', 'Use variação de tom', 'Ouça atentamente'], dontList: ['Não só mostre dados', 'Não ignore o diálogo'] },
    K: { title: 'Digital para Cinestésico', description: 'Ofereça experiências práticas!', examples: ['"Vamos testar isso?"', '"Qual a sensação?"', '"Experimenta aqui..."'], doList: ['Demonstre fisicamente', 'Ofereça testes práticos', 'Pergunte sobre sentimentos', 'Use exemplos tangíveis'], dontList: ['Não fique só na teoria', 'Não ignore a experiência física'] },
    D: { title: 'Digital para Digital', description: 'Comunicação natural! Use lógica e dados.', examples: ['"Analisando os dados..."', '"Logicamente..."', '"Os fatos indicam..."'], doList: ['Use dados e estatísticas', 'Seja lógico e preciso', 'Apresente análises', 'Estruture argumentos'], dontList: ['Não ignore a necessidade de síntese', 'Não prolongue demais análises'] },
  },
};

// ============================================
// Scenario Generators
// ============================================

const getSituation = (disc: DISCProfile): string => {
  const situations: Record<DISCProfile, string> = {
    D: 'O cliente está com pressa e quer ir direto ao ponto. Ele pergunta: "Quanto tempo isso vai levar e qual é o resultado final?"',
    I: 'O cliente está animado e quer conversar sobre várias ideias. Ele diz: "Adorei a ideia! Imagina todas as possibilidades..."',
    S: 'O cliente está hesitante e preocupado com mudanças. Ele pergunta: "Como minha equipe vai se adaptar a isso?"',
    C: 'O cliente está analisando cada detalhe. Ele pergunta: "Qual é a metodologia exata e os dados que comprovam isso?"',
  };
  return situations[disc];
};

const getOptions = (clientDISC: DISCProfile, _sellerDISC: DISCProfile | null): TrainingScenario['options'] => {
  const options: Record<DISCProfile, TrainingScenario['options']> = {
    D: [
      { id: 'a', text: 'Vou te explicar em detalhes todo o processo primeiro...', isCorrect: false, explanation: 'Cliente D não quer detalhes primeiro. Ele quer resultados e velocidade.' },
      { id: 'b', text: 'Implementação em 2 semanas, ROI de 25% em 3 meses. Próximo passo?', isCorrect: true, explanation: 'Perfeito! Direto ao ponto com resultados e ação.' },
      { id: 'c', text: 'Vamos marcar uma reunião mais longa para discutir todos os aspectos...', isCorrect: false, explanation: 'Cliente D não quer reuniões longas. Ele quer eficiência.' },
    ],
    I: [
      { id: 'a', text: 'Aqui estão os dados técnicos e a análise detalhada...', isCorrect: false, explanation: 'Cliente I quer energia e entusiasmo, não dados frios.' },
      { id: 'b', text: 'Podemos fazer isso de forma bem estruturada e gradual...', isCorrect: false, explanation: 'Isso é bom para S, não para I. Ele quer ação e empolgação.' },
      { id: 'c', text: 'Isso vai ser incrível! Imagina a reação da equipe quando virem os resultados!', isCorrect: true, explanation: 'Perfeito! Conecta com a energia e visão social dele.' },
    ],
    S: [
      { id: 'a', text: 'Precisamos decidir isso rápido para aproveitar a oportunidade!', isCorrect: false, explanation: 'Pressionar S gera resistência. Ele precisa de tempo e segurança.' },
      { id: 'b', text: 'Vamos fazer uma transição gradual. Sua equipe terá suporte em cada etapa.', isCorrect: true, explanation: 'Perfeito! Transmite segurança e cuidado com a equipe.' },
      { id: 'c', text: 'Os dados mostram claramente que esta é a melhor opção.', isCorrect: false, explanation: 'S precisa de segurança emocional, não só lógica.' },
    ],
    C: [
      { id: 'a', text: 'Imagina como vai ser incrível quando estiver funcionando!', isCorrect: false, explanation: 'C não se convence com entusiasmo. Ele quer dados.' },
      { id: 'b', text: 'Aqui está a documentação com metodologia, métricas e casos de estudo.', isCorrect: true, explanation: 'Perfeito! Atende a necessidade de dados e precisão.' },
      { id: 'c', text: 'Vamos fazer isso agora e ajustamos depois se precisar.', isCorrect: false, explanation: 'C precisa analisar antes. Não gosta de improvisação.' },
    ],
  };
  return options[clientDISC];
};

export const generateScenarios = (sellerDISC: DISCProfile | null): TrainingScenario[] => {
  const allDISC: DISCProfile[] = ['D', 'I', 'S', 'C'];
  const scenarios: TrainingScenario[] = [];

  allDISC.forEach((disc) => {
    if (disc !== sellerDISC) {
      scenarios.push({
        id: `scenario-${disc}`,
        title: `Cliente ${DISC_LABELS[disc].name}`,
        description: `Como abordar um cliente com perfil ${disc}?`,
        clientProfile: {
          disc,
          vak: disc === 'D' ? 'V' : disc === 'I' ? 'A' : disc === 'S' ? 'K' : 'D',
          motivation: disc === 'D' || disc === 'I' ? 'toward' : 'away_from',
        },
        situation: getSituation(disc),
        options: getOptions(disc, sellerDISC),
      });
    }
  });

  return scenarios;
};
