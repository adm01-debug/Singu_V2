type TrainingType = 'vak_detection' | 'vak_adaptation' | 'meta_detection' | 'meta_adaptation' | 'combined';
type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface TrainingScenario {
  id: string;
  type: TrainingType;
  difficulty: Difficulty;
  title: string;
  context: string;
  clientStatement: string;
  correctAnswer: string;
  options: { id: string; label: string; isCorrect: boolean; explanation: string }[];
  learningPoint: string;
  adaptedResponse?: string;
}

export const TRAINING_SCENARIOS: TrainingScenario[] = [
  {
    id: 'vak-1', type: 'vak_detection', difficulty: 'beginner',
    title: 'Identificação VAK Básica',
    context: 'Um cliente está descrevendo seu problema atual.',
    clientStatement: '"Eu vejo que a situação está ficando cada vez mais clara para mim. Preciso ter uma visão geral do panorama antes de decidir."',
    correctAnswer: 'V',
    options: [
      { id: 'V', label: 'Visual', isCorrect: true, explanation: 'Correto! Palavras como "vejo", "clara", "visão", "panorama" são predicados visuais.' },
      { id: 'A', label: 'Auditivo', isCorrect: false, explanation: 'Incorreto. Predicados auditivos seriam: "ouvir", "som", "harmonia", "conversar".' },
      { id: 'K', label: 'Cinestésico', isCorrect: false, explanation: 'Incorreto. Predicados cinestésicos seriam: "sentir", "tocar", "sólido", "confortável".' },
      { id: 'D', label: 'Digital', isCorrect: false, explanation: 'Incorreto. Predicados digitais seriam: "analisar", "dados", "lógico", "processo".' },
    ],
    learningPoint: 'Pessoas Visuais processam informações em imagens. Use gráficos, apresentações visuais e palavras como "mostrar", "claro", "perspectiva".',
    adaptedResponse: '"Deixa eu te mostrar uma visão completa do que podemos fazer. Vai ficar bem claro como isso se encaixa no seu panorama."',
  },
  {
    id: 'vak-2', type: 'vak_detection', difficulty: 'beginner',
    title: 'Detectando Auditivos',
    context: 'Cliente em uma reunião de apresentação.',
    clientStatement: '"Isso soa interessante. Me conta mais sobre como funciona. Quero ouvir os detalhes antes de dizer algo."',
    correctAnswer: 'A',
    options: [
      { id: 'V', label: 'Visual', isCorrect: false, explanation: 'Incorreto. Não há predicados visuais nessa fala.' },
      { id: 'A', label: 'Auditivo', isCorrect: true, explanation: 'Correto! "Soa", "conta", "ouvir", "dizer" são predicados auditivos.' },
      { id: 'K', label: 'Cinestésico', isCorrect: false, explanation: 'Incorreto. Predicados cinestésicos envolvem toque e sensações.' },
      { id: 'D', label: 'Digital', isCorrect: false, explanation: 'Incorreto. Predicados digitais envolvem lógica e análise.' },
    ],
    learningPoint: 'Pessoas Auditivas valorizam o tom de voz e precisam "ouvir" as informações. Prefira ligações a emails e varie seu tom.',
    adaptedResponse: '"Vou te contar em detalhes como isso funciona. Escuta só..."',
  },
  {
    id: 'vak-3', type: 'vak_detection', difficulty: 'beginner',
    title: 'Reconhecendo Cinestésicos',
    context: 'Cliente avaliando uma proposta.',
    clientStatement: '"Preciso sentir que essa é a decisão certa. Ainda estou pesando os prós e contras, mas meu feeling é positivo."',
    correctAnswer: 'K',
    options: [
      { id: 'V', label: 'Visual', isCorrect: false, explanation: 'Incorreto. Não há palavras visuais.' },
      { id: 'A', label: 'Auditivo', isCorrect: false, explanation: 'Incorreto. Não há palavras auditivas.' },
      { id: 'K', label: 'Cinestésico', isCorrect: true, explanation: 'Correto! "Sentir", "pesando", "feeling" são predicados cinestésicos.' },
      { id: 'D', label: 'Digital', isCorrect: false, explanation: 'Incorreto. Apesar de mencionar "prós e contras", o foco é no sentimento.' },
    ],
    learningPoint: 'Cinestésicos decidem com base em sentimentos e sensações. Dê tempo, construa relacionamento, use linguagem emocional.',
    adaptedResponse: '"Entendo que você quer se sentir seguro. Vamos construir isso juntos, passo a passo, até você ter a certeza no coração."',
  },
  {
    id: 'vak-4', type: 'vak_detection', difficulty: 'intermediate',
    title: 'Identificando Digitais',
    context: 'Cliente técnico analisando solução.',
    clientStatement: '"Preciso entender a lógica por trás disso. Quais são os dados que comprovam essa afirmação? Me passa um comparativo."',
    correctAnswer: 'D',
    options: [
      { id: 'V', label: 'Visual', isCorrect: false, explanation: 'Incorreto. Não há predicados visuais.' },
      { id: 'A', label: 'Auditivo', isCorrect: false, explanation: 'Incorreto. Não há predicados auditivos.' },
      { id: 'K', label: 'Cinestésico', isCorrect: false, explanation: 'Incorreto. Não há predicados cinestésicos.' },
      { id: 'D', label: 'Digital', isCorrect: true, explanation: 'Correto! "Entender", "lógica", "dados", "comparativo" são predicados digitais (auditivo digital).' },
    ],
    learningPoint: 'Digitais processam através de lógica e análise. Forneça dados, estatísticas, ROI e processos claros.',
    adaptedResponse: '"Vou te passar os dados completos. Analisando os números, o processo funciona assim..."',
  },
  {
    id: 'meta-1', type: 'meta_detection', difficulty: 'beginner',
    title: 'Motivação: Em Direção A',
    context: 'Entendendo o que motiva o cliente.',
    clientStatement: '"Quero conquistar novos mercados e alcançar um faturamento 50% maior. Meu objetivo é ser líder do segmento."',
    correctAnswer: 'toward',
    options: [
      { id: 'toward', label: 'Em Direção A (Ganhos)', isCorrect: true, explanation: 'Correto! "Conquistar", "alcançar", "objetivo" indicam motivação por ganhos.' },
      { id: 'away', label: 'Afastar-se De (Evitar)', isCorrect: false, explanation: 'Incorreto. Cliente focado em evitar diria "preciso resolver", "eliminar problemas".' },
    ],
    learningPoint: 'Pessoas "Em Direção A" são motivadas por metas e conquistas. Foque nos ganhos e benefícios.',
    adaptedResponse: '"Com nossa solução, você vai conquistar esses mercados mais rápido e alcançar sua meta de faturamento."',
  },
  {
    id: 'meta-2', type: 'meta_detection', difficulty: 'beginner',
    title: 'Motivação: Afastar-se De',
    context: 'Cliente descrevendo situação atual.',
    clientStatement: '"Preciso resolver esse problema de produtividade. Não aguento mais perder dinheiro com retrabalho. Quero eliminar esses erros."',
    correctAnswer: 'away',
    options: [
      { id: 'toward', label: 'Em Direção A (Ganhos)', isCorrect: false, explanation: 'Incorreto. O foco está em problemas a evitar, não em ganhos.' },
      { id: 'away', label: 'Afastar-se De (Evitar)', isCorrect: true, explanation: 'Correto! "Resolver", "não aguento", "perder", "eliminar" indicam motivação por evitar dor.' },
    ],
    learningPoint: 'Pessoas "Afastar-se De" são motivadas por evitar problemas. Mostre o que vão evitar ou resolver.',
    adaptedResponse: '"Vamos eliminar esses erros de produtividade e você vai parar de perder dinheiro com retrabalho."',
  },
  {
    id: 'meta-3', type: 'meta_detection', difficulty: 'intermediate',
    title: 'Referência: Interna',
    context: 'Processo de decisão do cliente.',
    clientStatement: '"Eu sei o que funciona para mim. Na minha avaliação, isso faz sentido. Vou decidir baseado no meu critério."',
    correctAnswer: 'internal',
    options: [
      { id: 'internal', label: 'Referência Interna', isCorrect: true, explanation: 'Correto! "Eu sei", "minha avaliação", "meu critério" indicam referência interna.' },
      { id: 'external', label: 'Referência Externa', isCorrect: false, explanation: 'Incorreto. Referência externa buscaria "o que outros dizem", "pesquisas mostram".' },
    ],
    learningPoint: 'Pessoas com referência interna decidem por si. Não force opiniões, deixe-os chegar às próprias conclusões.',
    adaptedResponse: '"Você vai perceber por si mesmo como isso se encaixa no que você busca."',
  },
  {
    id: 'meta-4', type: 'meta_detection', difficulty: 'intermediate',
    title: 'Referência: Externa',
    context: 'Cliente buscando validação.',
    clientStatement: '"O que outras empresas do setor estão fazendo? Tem algum caso de sucesso? Quero ver o que os especialistas dizem."',
    correctAnswer: 'external',
    options: [
      { id: 'internal', label: 'Referência Interna', isCorrect: false, explanation: 'Incorreto. Cliente está buscando validação externa.' },
      { id: 'external', label: 'Referência Externa', isCorrect: true, explanation: 'Correto! "Outras empresas", "caso de sucesso", "especialistas" indicam referência externa.' },
    ],
    learningPoint: 'Pessoas com referência externa precisam de validação. Use depoimentos, cases e dados de mercado.',
    adaptedResponse: '"Empresas líderes do setor já usam. Deixa eu te mostrar o case da [Empresa] e o que os especialistas dizem."',
  },
  {
    id: 'combined-1', type: 'combined', difficulty: 'advanced',
    title: 'Análise Combinada',
    context: 'Identificar VAK + Metaprograma simultaneamente.',
    clientStatement: '"Preciso visualizar como vou evitar esses problemas no futuro. Me mostra um panorama de como isso vai proteger minha operação."',
    correctAnswer: 'V-away',
    options: [
      { id: 'V-toward', label: 'Visual + Em Direção A', isCorrect: false, explanation: 'VAK correto, mas metaprograma errado.' },
      { id: 'V-away', label: 'Visual + Afastar-se De', isCorrect: true, explanation: 'Correto! "Visualizar", "panorama" = Visual. "Evitar", "proteger" = Afastar-se De.' },
      { id: 'K-away', label: 'Cinestésico + Afastar-se De', isCorrect: false, explanation: 'Metaprograma correto, mas VAK errado.' },
      { id: 'A-toward', label: 'Auditivo + Em Direção A', isCorrect: false, explanation: 'Ambos incorretos.' },
    ],
    learningPoint: 'Na prática, combinamos múltiplos perfis. Visual + Afastar-se De: mostre visualmente os problemas que serão evitados.',
    adaptedResponse: '"Deixa eu te mostrar uma visão clara de como você vai evitar esses problemas. Olha esse panorama de proteção..."',
  },
];
