// Sleight of Mouth - 14 Padrões de Robert Dilts para Ressignificação de Crenças

export type SleightOfMouthPattern = 
  | 'intention'           // Intenção
  | 'redefinition'        // Redefinição
  | 'consequence'         // Consequência
  | 'chunk_up'            // Chunk Up (Generalização)
  | 'chunk_down'          // Chunk Down (Especificação)
  | 'counter_example'     // Contra-exemplo
  | 'analogy'             // Analogia/Metáfora
  | 'apply_to_self'       // Aplicar a Si Mesmo
  | 'another_outcome'     // Outro Resultado
  | 'hierarchy_criteria'  // Hierarquia de Critérios
  | 'change_frame_size'   // Mudar Tamanho do Enquadramento
  | 'meta_frame'          // Meta-enquadramento
  | 'model_of_world'      // Modelo de Mundo
  | 'reality_strategy';   // Estratégia de Realidade

export interface SleightPattern {
  id: SleightOfMouthPattern;
  name: string;
  nameEn: string;
  category: 'meaning' | 'context' | 'challenge';
  description: string;
  howItWorks: string;
  formula: string;
  icon: string;
  color: string;
  examples: string[];
  bestFor: string[];
}

export interface SleightTemplate {
  id: string;
  pattern: SleightOfMouthPattern;
  objection: string;
  objectionCategory: 'price' | 'timing' | 'trust' | 'need' | 'authority' | 'competition';
  response: string;
  explanation: string;
  tips: string[];
  variables: string[];
}

// Definição dos 14 Padrões
export const SLEIGHT_OF_MOUTH_PATTERNS: Record<SleightOfMouthPattern, SleightPattern> = {
  intention: {
    id: 'intention',
    name: 'Intenção',
    nameEn: 'Intention',
    category: 'meaning',
    description: 'Direciona a atenção para a intenção positiva por trás da crença ou objeção.',
    howItWorks: 'Reconhece a intenção positiva e redireciona para uma forma melhor de alcançá-la.',
    formula: '"Entendo que você quer [intenção positiva]. E se [solução] fosse uma forma ainda melhor de conseguir isso?"',
    icon: '🎯',
    color: 'bg-info/10 text-info border-info/20',
    examples: [
      '"Entendo que você quer proteger o orçamento. E se essa ferramenta reduzisse custos no longo prazo?"',
      '"Sua intenção de minimizar riscos faz total sentido. É por isso que oferecemos garantia."',
    ],
    bestFor: ['Objeções de preço', 'Resistência a mudanças', 'Medo de riscos'],
  },
  
  redefinition: {
    id: 'redefinition',
    name: 'Redefinição',
    nameEn: 'Redefinition',
    category: 'meaning',
    description: 'Substitui uma palavra por outra com conotação diferente, mudando o significado.',
    howItWorks: 'Troca uma palavra-chave por um sinônimo que carrega significado diferente.',
    formula: '"Não é [palavra negativa], é [palavra positiva]."',
    icon: '🔄',
    color: 'bg-secondary/10 text-secondary border-secondary/20',
    examples: [
      '"Não é caro, é um investimento estratégico."',
      '"Não é complexo, é completo."',
      '"Não é risco, é oportunidade de crescimento."',
    ],
    bestFor: ['Objeções de preço', 'Percepção negativa', 'Reframing rápido'],
  },
  
  consequence: {
    id: 'consequence',
    name: 'Consequência',
    nameEn: 'Consequence',
    category: 'challenge',
    description: 'Aponta para uma consequência (positiva ou negativa) que desafia a crença.',
    howItWorks: 'Mostra o que acontece se a pessoa mantiver ou abandonar a crença.',
    formula: '"Se você continuar pensando assim, [consequência negativa]. Por outro lado, [consequência positiva]."',
    icon: '➡️',
    color: 'bg-warning/10 text-warning border-warning/20',
    examples: [
      '"Cada mês sem a solução custa R$ X em ineficiência."',
      '"Empresas que adiaram essa decisão perderam market share."',
    ],
    bestFor: ['Procrastinação', 'Indecisão', 'Falta de urgência'],
  },
  
  chunk_up: {
    id: 'chunk_up',
    name: 'Chunk Up (Generalização)',
    nameEn: 'Chunk Up',
    category: 'context',
    description: 'Move para um nível mais alto de abstração, ampliando a perspectiva.',
    howItWorks: 'Generaliza a objeção para um contexto maior onde faz menos sentido.',
    formula: '"Isso é parte de uma questão maior: [contexto ampliado]. E nesse contexto, [nova perspectiva]."',
    icon: '🔼',
    color: 'bg-primary/10 text-primary border-primary/20',
    examples: [
      '"A questão maior é: vocês querem liderar ou seguir o mercado?"',
      '"No final das contas, o que importa é o resultado para sua empresa."',
    ],
    bestFor: ['Objeções específicas demais', 'Foco em detalhes', 'Visão estreita'],
  },
  
  chunk_down: {
    id: 'chunk_down',
    name: 'Chunk Down (Especificação)',
    nameEn: 'Chunk Down',
    category: 'context',
    description: 'Move para um nível mais específico, focando em detalhes menores.',
    howItWorks: 'Especifica a objeção até que ela pareça gerenciável ou irrelevante.',
    formula: '"Especificamente, qual parte de [objeção] te preocupa mais?"',
    icon: '🔽',
    color: 'bg-info/10 text-info border-info/20',
    examples: [
      '"Quando você diz \'caro\', está comparando com qual alternativa especificamente?"',
      '"Qual funcionalidade específica você acha desnecessária?"',
    ],
    bestFor: ['Objeções vagas', 'Generalizações', 'Quando precisar entender melhor'],
  },
  
  counter_example: {
    id: 'counter_example',
    name: 'Contra-exemplo',
    nameEn: 'Counter Example',
    category: 'challenge',
    description: 'Encontra uma exceção que contradiz a regra implícita na crença.',
    howItWorks: 'Apresenta um caso real que prova que a crença nem sempre é verdadeira.',
    formula: '"Interessante, porque [empresa/pessoa] tinha a mesma visão e depois [resultado contrário]."',
    icon: '🔀',
    color: 'bg-success/10 text-success border-success/20',
    examples: [
      '"A empresa X pensava o mesmo, mas depois de implementar, reduziu custos em 40%."',
      '"Você conhece o caso da empresa Y? Eles também achavam que não era o momento."',
    ],
    bestFor: ['Crenças limitantes', 'Generalizações', 'Resistência baseada em suposições'],
  },
  
  analogy: {
    id: 'analogy',
    name: 'Analogia/Metáfora',
    nameEn: 'Analogy/Metaphor',
    category: 'meaning',
    description: 'Usa uma comparação ou história que transmite um significado diferente.',
    howItWorks: 'Cria uma analogia que ressignifica a situação de forma mais positiva.',
    formula: '"É como [analogia]. Você não [paralelo com a objeção], você [perspectiva positiva]."',
    icon: '🪞',
    color: 'bg-accent/10 text-accent border-accent/20',
    examples: [
      '"É como comprar um guarda-chuva antes da chuva - parece desnecessário até você precisar."',
      '"Investir em tecnologia é como plantar uma árvore: o melhor momento foi ontem."',
    ],
    bestFor: ['Conceitos abstratos', 'Quando lógica não funciona', 'Conexão emocional'],
  },
  
  apply_to_self: {
    id: 'apply_to_self',
    name: 'Aplicar a Si Mesmo',
    nameEn: 'Apply to Self',
    category: 'challenge',
    description: 'Aplica a lógica da crença a ela mesma, revelando contradições.',
    howItWorks: 'Usa a própria estrutura da objeção para questioná-la.',
    formula: '"Se [objeção] fosse sempre verdade, então [consequência absurda]?"',
    icon: '🔁',
    color: 'bg-warning/10 text-warning border-warning/20',
    examples: [
      '"Se esperar sempre fosse a melhor opção, você nunca teria crescido até aqui."',
      '"Se preço baixo fosse garantia de qualidade, por que você não usa o mais barato?"',
    ],
    bestFor: ['Objeções inconsistentes', 'Lógica falha', 'Contradições'],
  },
  
  another_outcome: {
    id: 'another_outcome',
    name: 'Outro Resultado',
    nameEn: 'Another Outcome',
    category: 'context',
    description: 'Direciona a atenção para um resultado diferente e mais relevante.',
    howItWorks: 'Muda o foco do resultado temido para um resultado desejado.',
    formula: '"Além de [preocupação atual], você já considerou [outro resultado positivo]?"',
    icon: '🎲',
    color: 'bg-success/10 text-success border-success/20',
    examples: [
      '"Além do custo, já pensou no valor da produtividade que vai ganhar?"',
      '"E se em vez de focar no risco, olhássemos para a oportunidade?"',
    ],
    bestFor: ['Foco excessivo em um aspecto', 'Visão limitada', 'Negatividade'],
  },
  
  hierarchy_criteria: {
    id: 'hierarchy_criteria',
    name: 'Hierarquia de Critérios',
    nameEn: 'Hierarchy of Criteria',
    category: 'meaning',
    description: 'Apela para um valor ou critério mais importante que o atual.',
    howItWorks: 'Eleva a discussão para valores mais fundamentais do cliente.',
    formula: '"Entendo que [critério atual] é importante. Mas o que é mais importante para você: [valor superior]?"',
    icon: '👑',
    color: 'bg-warning/10 text-warning border-warning/20',
    examples: [
      '"Preço é importante, mas o que é mais importante: economizar hoje ou crescer amanhã?"',
      '"Tempo é um recurso, mas qual recurso é mais escasso: tempo ou oportunidades?"',
    ],
    bestFor: ['Negociação de preço', 'Priorização', 'Decisões importantes'],
  },
  
  change_frame_size: {
    id: 'change_frame_size',
    name: 'Mudar Tamanho do Enquadramento',
    nameEn: 'Change Frame Size',
    category: 'context',
    description: 'Expande ou reduz o contexto temporal, espacial ou relacional.',
    howItWorks: 'Muda a perspectiva alterando o "zoom" da situação.',
    formula: '"Se você olhar para isso em [novo contexto temporal/espacial], como parece?"',
    icon: '🔍',
    color: 'bg-secondary/10 text-secondary border-secondary/20',
    examples: [
      '"Em 5 anos, como você vai ver essa decisão?"',
      '"Comparado com o custo de rotatividade de funcionários, esse investimento é pequeno."',
    ],
    bestFor: ['Perspectiva de curto prazo', 'Visão limitada', 'Falta de contexto'],
  },
  
  meta_frame: {
    id: 'meta_frame',
    name: 'Meta-enquadramento',
    nameEn: 'Meta Frame',
    category: 'challenge',
    description: 'Comenta sobre a crença ou o processo de pensar, não sobre o conteúdo.',
    howItWorks: 'Sobe um nível e questiona de onde vem a crença ou o que ela representa.',
    formula: '"Interessante você pensar assim. De onde vem essa ideia?"',
    icon: '🧠',
    color: 'bg-muted text-muted-foreground border-border',
    examples: [
      '"Essa é uma perspectiva comum em empresas que ainda não testaram. Vocês testaram?"',
      '"Muita gente começa pensando assim. Você chegou a essa conclusão com base em quê?"',
    ],
    bestFor: ['Crenças infundadas', 'Suposições', 'Quando precisar entender a origem'],
  },
  
  model_of_world: {
    id: 'model_of_world',
    name: 'Modelo de Mundo',
    nameEn: 'Model of the World',
    category: 'challenge',
    description: 'Questiona de quem é o modelo de mundo que gerou essa crença.',
    howItWorks: 'Pergunta se a crença é baseada na experiência real ou em opiniões de outros.',
    formula: '"Essa é sua experiência direta ou algo que você ouviu dizer?"',
    icon: '🌍',
    color: 'bg-lime-100 text-lime-700 border-lime-200',
    examples: [
      '"Você teve essa experiência pessoalmente ou é o que dizem por aí?"',
      '"Essa visão vem da sua vivência ou de algo que leu/ouviu?"',
    ],
    bestFor: ['Objeções de terceiros', 'Boatos', 'Informações incorretas'],
  },
  
  reality_strategy: {
    id: 'reality_strategy',
    name: 'Estratégia de Realidade',
    nameEn: 'Reality Strategy',
    category: 'challenge',
    description: 'Questiona como a pessoa chegou a essa conclusão, qual evidência usa.',
    howItWorks: 'Explora o processo de pensamento que levou à crença.',
    formula: '"Como você sabe que [crença]? O que te faz ter certeza?"',
    icon: '🔬',
    color: 'bg-destructive/10 text-destructive border-destructive/20',
    examples: [
      '"O que te faz pensar que não é o momento certo? Qual indicador?"',
      '"Como você chegou à conclusão de que não vai funcionar para vocês?"',
    ],
    bestFor: ['Crenças sem base', 'Medo infundado', 'Decisões precipitadas'],
  },
};

// Templates para objeções comuns
export const SLEIGHT_TEMPLATES: SleightTemplate[] = [
  // =========================================
  // OBJEÇÃO: "É MUITO CARO"
  // =========================================
  {
    id: 'som-price-intention',
    pattern: 'intention',
    objection: 'É muito caro',
    objectionCategory: 'price',
    response: '{nome}, entendo que você quer proteger o orçamento da {empresa} - é uma responsabilidade importante. E se eu te mostrar como esse investimento na verdade protege ainda mais o orçamento, reduzindo custos em {area}?',
    explanation: 'Reconhece a intenção positiva (proteger orçamento) e mostra que a solução atende essa mesma intenção.',
    tips: ['Valide genuinamente a preocupação', 'Conecte a solução com a mesma intenção'],
    variables: ['nome', 'empresa', 'area'],
  },
  {
    id: 'som-price-redefinition',
    pattern: 'redefinition',
    objection: 'É muito caro',
    objectionCategory: 'price',
    response: '{nome}, na verdade não é caro - é valioso. Caro seria continuar {problema_atual} e perder R$ {valor_perdido} por mês. Nosso investimento se paga em {prazo_retorno}.',
    explanation: 'Redefine "caro" como "valioso" e "caro" como o custo de não agir.',
    tips: ['Troque palavras negativas por positivas', 'Defina o que realmente é "caro"'],
    variables: ['nome', 'problema_atual', 'valor_perdido', 'prazo_retorno'],
  },
  {
    id: 'som-price-consequence',
    pattern: 'consequence',
    objection: 'É muito caro',
    objectionCategory: 'price',
    response: '{nome}, se você continuar vendo apenas o preço, pode deixar passar {beneficio_principal}. Empresas que focaram no ROI em vez do custo inicial tiveram retorno de {roi}% em {prazo}.',
    explanation: 'Mostra a consequência negativa de manter o foco no preço.',
    tips: ['Use dados reais de consequências', 'Mostre o custo de oportunidade'],
    variables: ['nome', 'beneficio_principal', 'roi', 'prazo'],
  },
  {
    id: 'som-price-chunk-up',
    pattern: 'chunk_up',
    objection: 'É muito caro',
    objectionCategory: 'price',
    response: '{nome}, a questão maior aqui é: a {empresa} quer continuar competindo no mesmo nível ou quer liderar? Porque líderes de mercado investem em {categoria_solucao}. O preço é detalhe quando comparado ao destino.',
    explanation: 'Eleva a discussão para o nível estratégico de competitividade.',
    tips: ['Conecte com visão de longo prazo', 'Amplie o contexto da decisão'],
    variables: ['nome', 'empresa', 'categoria_solucao'],
  },
  {
    id: 'som-price-chunk-down',
    pattern: 'chunk_down',
    objection: 'É muito caro',
    objectionCategory: 'price',
    response: '{nome}, quando você diz "caro", está comparando com qual alternativa especificamente? Qual seria o preço ideal para você? Assim posso mostrar exatamente onde está o valor que justifica a diferença.',
    explanation: 'Especifica a objeção para entender a referência de preço.',
    tips: ['Descubra a âncora de preço do cliente', 'Entenda o critério de comparação'],
    variables: ['nome'],
  },
  {
    id: 'som-price-counter-example',
    pattern: 'counter_example',
    objection: 'É muito caro',
    objectionCategory: 'price',
    response: '{nome}, interessante você mencionar isso. A {empresa_exemplo} pensava exatamente assim há {tempo}. Depois de implementar, descobriram que o "caro" na verdade economizou R$ {economia} em {periodo}. Posso te conectar com eles?',
    explanation: 'Apresenta um caso real que contradiz a crença de que é caro.',
    tips: ['Use cases reais e verificáveis', 'Ofereça conexão para validação'],
    variables: ['nome', 'empresa_exemplo', 'tempo', 'economia', 'periodo'],
  },
  {
    id: 'som-price-analogy',
    pattern: 'analogy',
    objection: 'É muito caro',
    objectionCategory: 'price',
    response: '{nome}, é como dizer que um bom médico é caro. Sim, a consulta custa mais, mas o diagnóstico correto economiza anos de tratamentos errados. {solucao} é o diagnóstico certo para {problema}.',
    explanation: 'Usa analogia do médico para mostrar que qualidade tem seu valor.',
    tips: ['Escolha analogias que o cliente conheça', 'Conecte com a situação específica'],
    variables: ['nome', 'solucao', 'problema'],
  },
  {
    id: 'som-price-hierarchy',
    pattern: 'hierarchy_criteria',
    objection: 'É muito caro',
    objectionCategory: 'price',
    response: '{nome}, preço é importante, concordo. Mas me diz: o que é mais importante para a {empresa} - economizar R$ {diferenca} hoje ou garantir {resultado_superior} pelos próximos anos?',
    explanation: 'Eleva para um critério mais importante que preço.',
    tips: ['Identifique os valores reais do cliente', 'Faça escolher entre critérios'],
    variables: ['nome', 'empresa', 'diferenca', 'resultado_superior'],
  },
  {
    id: 'som-price-frame-size',
    pattern: 'change_frame_size',
    objection: 'É muito caro',
    objectionCategory: 'price',
    response: '{nome}, por dia, esse investimento representa R$ {valor_diario}. Menos que {comparacao_cotidiana}. Em {anos} anos, você terá {retorno_acumulado}. Parece caro olhando assim?',
    explanation: 'Muda o enquadramento temporal para relativizar o preço.',
    tips: ['Divida em unidades menores', 'Compare com gastos do dia a dia'],
    variables: ['nome', 'valor_diario', 'comparacao_cotidiana', 'anos', 'retorno_acumulado'],
  },

  // =========================================
  // OBJEÇÃO: "NÃO É O MOMENTO"
  // =========================================
  {
    id: 'som-timing-intention',
    pattern: 'intention',
    objection: 'Não é o momento certo',
    objectionCategory: 'timing',
    response: '{nome}, entendo que você quer escolher o momento ideal - é sábio. Mas e se o melhor momento fosse justamente agora, porque {razao_momento}? Qual seria o momento "perfeito" para você?',
    explanation: 'Reconhece a intenção de timing e questiona gentilmente.',
    tips: ['Valide a prudência', 'Questione o que seria o momento ideal'],
    variables: ['nome', 'razao_momento'],
  },
  {
    id: 'som-timing-consequence',
    pattern: 'consequence',
    objection: 'Não é o momento certo',
    objectionCategory: 'timing',
    response: '{nome}, cada mês de espera tem um custo. {problema} já está custando aproximadamente R$ {custo_mensal}/mês. Em {meses} meses, são R$ {custo_total} que não voltam. Quando o momento seria "certo" o suficiente?',
    explanation: 'Mostra a consequência financeira de esperar.',
    tips: ['Quantifique o custo da espera', 'Crie senso de urgência com dados'],
    variables: ['nome', 'problema', 'custo_mensal', 'meses', 'custo_total'],
  },
  {
    id: 'som-timing-counter-example',
    pattern: 'counter_example',
    objection: 'Não é o momento certo',
    objectionCategory: 'timing',
    response: '{nome}, a {empresa_exemplo} disse o mesmo há {tempo}. Esperaram o "momento certo" e {consequencia_negativa}. Quando finalmente implementaram, disseram: "Devíamos ter feito antes."',
    explanation: 'Apresenta um caso onde esperar teve consequências negativas.',
    tips: ['Use histórias reais', 'Mostre arrependimentos de quem esperou'],
    variables: ['nome', 'empresa_exemplo', 'tempo', 'consequencia_negativa'],
  },
  {
    id: 'som-timing-frame-size',
    pattern: 'change_frame_size',
    objection: 'Não é o momento certo',
    objectionCategory: 'timing',
    response: '{nome}, daqui a {anos} anos, olhando para trás, você prefere ter começado agora ou ter esperado mais? Geralmente, o melhor momento para plantar a árvore foi ontem. O segundo melhor é hoje.',
    explanation: 'Muda a perspectiva temporal para o futuro.',
    tips: ['Use perspectiva de longo prazo', 'Evoque a visão futura'],
    variables: ['nome', 'anos'],
  },
  {
    id: 'som-timing-reality-strategy',
    pattern: 'reality_strategy',
    objection: 'Não é o momento certo',
    objectionCategory: 'timing',
    response: '{nome}, me ajuda a entender: o que especificamente precisa acontecer para ser o momento certo? Qual indicador você está esperando?',
    explanation: 'Questiona os critérios para definir o "momento certo".',
    tips: ['Entenda os critérios reais', 'Pode revelar objeções ocultas'],
    variables: ['nome'],
  },

  // =========================================
  // OBJEÇÃO: "PRECISO PENSAR"
  // =========================================
  {
    id: 'som-think-chunk-down',
    pattern: 'chunk_down',
    objection: 'Preciso pensar mais',
    objectionCategory: 'authority',
    response: '{nome}, claro, decisões importantes merecem reflexão. Sobre qual aspecto especificamente você precisa pensar mais? Preço, funcionalidades, timing, implementação? Assim posso ajudar com informações específicas.',
    explanation: 'Especifica a dúvida para poder endereçá-la.',
    tips: ['Descubra a objeção real', 'Transforme em conversa produtiva'],
    variables: ['nome'],
  },
  {
    id: 'som-think-meta-frame',
    pattern: 'meta_frame',
    objection: 'Preciso pensar mais',
    objectionCategory: 'authority',
    response: '{nome}, respeito totalmente. Uma pergunta: quando você diz "pensar mais", geralmente isso leva a uma decisão ou a adiar indefinidamente? Pergunto porque quero te ajudar a ter clareza, não pressionar.',
    explanation: 'Comenta sobre o próprio processo de "pensar".',
    tips: ['Seja genuinamente curioso', 'Não seja agressivo'],
    variables: ['nome'],
  },
  {
    id: 'som-think-another-outcome',
    pattern: 'another_outcome',
    objection: 'Preciso pensar mais',
    objectionCategory: 'authority',
    response: '{nome}, além de pensar, que tal experimentar? Posso liberar {experiencia_gratuita} por {periodo} para você sentir na prática. Pensar com dados reais é diferente de pensar com suposições.',
    explanation: 'Direciona para ação em vez de reflexão passiva.',
    tips: ['Ofereça experiência prática', 'Reduza o risco da decisão'],
    variables: ['nome', 'experiencia_gratuita', 'periodo'],
  },

  // =========================================
  // OBJEÇÃO: "JÁ TENHO ALGO PARECIDO"
  // =========================================
  {
    id: 'som-competition-intention',
    pattern: 'intention',
    objection: 'Já tenho uma solução similar',
    objectionCategory: 'competition',
    response: '{nome}, faz todo sentido já ter uma solução - mostra que você valoriza {area}. A questão é: sua solução atual está entregando 100% do que você precisa? Se não, talvez valha comparar.',
    explanation: 'Reconhece a intenção de ter solução e questiona a efetividade.',
    tips: ['Valide a decisão anterior', 'Plante dúvida gentilmente'],
    variables: ['nome', 'area'],
  },
  {
    id: 'som-competition-chunk-down',
    pattern: 'chunk_down',
    objection: 'Já tenho uma solução similar',
    objectionCategory: 'competition',
    response: '{nome}, qual solução você usa hoje? E especificamente, como ela resolve {desafio_especifico}? Pergunto porque essa é a área onde nossos clientes mais veem diferença.',
    explanation: 'Especifica para encontrar gaps na solução atual.',
    tips: ['Descubra pontos fracos da concorrência', 'Foque em diferenciais'],
    variables: ['nome', 'desafio_especifico'],
  },
  {
    id: 'som-competition-consequence',
    pattern: 'consequence',
    objection: 'Já tenho uma solução similar',
    objectionCategory: 'competition',
    response: '{nome}, continuar com uma solução "boa o suficiente" pode custar caro. Enquanto seus concorrentes usando {diferencial} estão {beneficio_concorrentes}, o gap só aumenta.',
    explanation: 'Mostra a consequência de permanecer com solução inferior.',
    tips: ['Use FOMO competitivo', 'Seja específico sobre diferenciais'],
    variables: ['nome', 'diferencial', 'beneficio_concorrentes'],
  },

  // =========================================
  // OBJEÇÃO: "PRECISO FALAR COM OUTRAS PESSOAS"
  // =========================================
  {
    id: 'som-authority-intention',
    pattern: 'intention',
    objection: 'Preciso falar com meu sócio/chefe',
    objectionCategory: 'authority',
    response: '{nome}, claro - decisões importantes devem ser compartilhadas. Qual é a maior preocupação que você imagina que {decisor} vai ter? Assim posso preparar informações específicas para ajudar.',
    explanation: 'Reconhece a necessidade de consenso e antecipa objeções.',
    tips: ['Descubra objeções do decisor', 'Prepare munição para o cliente'],
    variables: ['nome', 'decisor'],
  },
  {
    id: 'som-authority-another-outcome',
    pattern: 'another_outcome',
    objection: 'Preciso falar com meu sócio/chefe',
    objectionCategory: 'authority',
    response: '{nome}, perfeito. E se eu participasse dessa conversa? Posso tirar dúvidas técnicas direto com {decisor} e vocês decidem juntos. Economiza tempo e evita telefone sem fio.',
    explanation: 'Oferece alternativa: participar da reunião com o decisor.',
    tips: ['Ofereça-se para a reunião', 'Seja um recurso, não uma pressão'],
    variables: ['nome', 'decisor'],
  },

  // =========================================
  // OBJEÇÃO: "NÃO CONFIO NESSE TIPO DE SOLUÇÃO"
  // =========================================
  {
    id: 'som-trust-model-world',
    pattern: 'model_of_world',
    objection: 'Não confio nesse tipo de solução',
    objectionCategory: 'trust',
    response: '{nome}, essa desconfiança vem de alguma experiência que você teve ou é algo que ouviu falar? Pergunto porque quero entender se posso endereçar uma preocupação real.',
    explanation: 'Questiona a origem da desconfiança.',
    tips: ['Descubra se é experiência própria ou de outros', 'Endereça a causa raiz'],
    variables: ['nome'],
  },
  {
    id: 'som-trust-counter-example',
    pattern: 'counter_example',
    objection: 'Não confio nesse tipo de solução',
    objectionCategory: 'trust',
    response: '{nome}, entendo a cautela. {numero_clientes} empresas como {exemplos} pensavam parecido. Hoje, {percentual}% delas renovam contrato. Se não funcionasse, elas não voltariam. Quer conversar com alguma delas?',
    explanation: 'Apresenta evidências de confiança de outros clientes.',
    tips: ['Use números e nomes reais', 'Ofereça referências'],
    variables: ['nome', 'numero_clientes', 'exemplos', 'percentual'],
  },
  {
    id: 'som-trust-reality-strategy',
    pattern: 'reality_strategy',
    objection: 'Não confio nesse tipo de solução',
    objectionCategory: 'trust',
    response: '{nome}, o que precisaria acontecer para você confiar? Qual evidência te convenceria? Quero saber exatamente o que você precisa ver para se sentir seguro.',
    explanation: 'Questiona os critérios de confiança.',
    tips: ['Descubra o que gera confiança para o cliente', 'Comprometa-se a entregar isso'],
    variables: ['nome'],
  },

  // =========================================
  // OBJEÇÃO: "NÃO PRECISO DISSO"
  // =========================================
  {
    id: 'som-need-consequence',
    pattern: 'consequence',
    objection: 'Não preciso disso agora',
    objectionCategory: 'need',
    response: '{nome}, muitas empresas não sabiam que precisavam até {evento_gatilho}. Aí, o custo de não ter foi muito maior. {problema_potencial} pode acontecer com a {empresa}?',
    explanation: 'Mostra consequências de não ter a solução.',
    tips: ['Use cenários realistas', 'Não seja alarmista, seja informativo'],
    variables: ['nome', 'evento_gatilho', 'problema_potencial', 'empresa'],
  },
  {
    id: 'som-need-chunk-up',
    pattern: 'chunk_up',
    objection: 'Não preciso disso agora',
    objectionCategory: 'need',
    response: '{nome}, a questão maior é: a {empresa} quer apenas sobreviver ou quer liderar? Empresas que investem em {categoria} antes de "precisar" são as que lideram. As outras correm atrás.',
    explanation: 'Eleva para o nível de estratégia e liderança.',
    tips: ['Conecte com ambição do cliente', 'Mostre visão de futuro'],
    variables: ['nome', 'empresa', 'categoria'],
  },
  {
    id: 'som-need-analogy',
    pattern: 'analogy',
    objection: 'Não preciso disso agora',
    objectionCategory: 'need',
    response: '{nome}, é como seguro de carro - ninguém "precisa" até bater. A diferença é que com {solucao}, você está se protegendo E acelerando ao mesmo tempo. É investimento, não despesa.',
    explanation: 'Usa analogia do seguro para mostrar valor preventivo.',
    tips: ['Escolha analogias relevantes', 'Mostre o duplo benefício'],
    variables: ['nome', 'solucao'],
  },
];

// Função para obter templates por padrão
export function getTemplatesByPattern(pattern: SleightOfMouthPattern): SleightTemplate[] {
  return SLEIGHT_TEMPLATES.filter(t => t.pattern === pattern);
}

// Função para obter templates por categoria de objeção
export function getTemplatesByObjection(category: SleightTemplate['objectionCategory']): SleightTemplate[] {
  return SLEIGHT_TEMPLATES.filter(t => t.objectionCategory === category);
}

// Função para obter padrões recomendados para uma objeção
export function getRecommendedPatterns(objectionCategory: SleightTemplate['objectionCategory']): SleightOfMouthPattern[] {
  const templates = getTemplatesByObjection(objectionCategory);
  return [...new Set(templates.map(t => t.pattern))];
}
