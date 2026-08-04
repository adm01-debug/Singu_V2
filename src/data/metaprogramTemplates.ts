// Metaprogram-adapted templates for persuasion

import { MotivationDirection, ReferenceFrame, WorkingStyle } from '@/types/metaprograms';

export interface MetaprogramTemplate {
  id: string;
  baseTitle: string;
  scenario: string;
  category: 'sales' | 'objection' | 'follow_up' | 'closing' | 'relationship';
  variations: {
    motivationDirection: {
      toward: string;
      away_from: string;
    };
    referenceFrame: {
      internal: string;
      external: string;
    };
    workingStyle: {
      options: string;
      procedures: string;
    };
  };
  variables: string[];
}

export const METAPROGRAM_TEMPLATES: MetaprogramTemplate[] = [
  // SALES TEMPLATES
  {
    id: 'mp-sales-01',
    baseTitle: 'Apresentação de Proposta',
    scenario: 'Apresentar uma proposta comercial',
    category: 'sales',
    variations: {
      motivationDirection: {
        toward: '{nome}, esta proposta foi desenhada para te ajudar a alcançar {objetivo}. Com nossa solução, você vai conquistar {beneficio_principal} e realizar {meta_especifica}. Imagine onde você estará em {prazo} com esses resultados!',
        away_from: '{nome}, esta proposta foi criada para resolver definitivamente {problema_principal}. Você não vai mais precisar se preocupar com {dor_atual} e vai se livrar de {obstáculo}. Pense no alívio de não ter mais que lidar com isso!'
      },
      referenceFrame: {
        internal: '{nome}, analisei cuidadosamente sua situação e preparei esta proposta para você avaliar. Confio que você vai perceber o valor quando olhar os detalhes. O que você acha que faz mais sentido para sua realidade?',
        external: '{nome}, esta proposta é baseada no que funcionou para {numero_clientes}+ clientes como {referencia_cliente}. Os dados mostram que {estatistica_sucesso}% conseguiram {resultado}. Aqui está o feedback de quem já implementou.'
      },
      workingStyle: {
        options: '{nome}, preparei três opções de proposta para você escolher a que melhor se adapta. Você pode começar pelo {opcao_1}, ou preferir o {opcao_2}, ou ainda customizar com o {opcao_3}. Qual dessas possibilidades te atrai mais?',
        procedures: '{nome}, vou te explicar exatamente como funciona: Primeiro, fazemos {etapa_1}. Depois, passamos para {etapa_2}. Em seguida, {etapa_3}. E por último, {etapa_4}. Assim você sabe exatamente o caminho que vamos seguir.'
      }
    },
    variables: ['nome', 'objetivo', 'beneficio_principal', 'meta_especifica', 'prazo', 'problema_principal', 'dor_atual', 'obstáculo', 'numero_clientes', 'referencia_cliente', 'estatistica_sucesso', 'resultado', 'opcao_1', 'opcao_2', 'opcao_3', 'etapa_1', 'etapa_2', 'etapa_3', 'etapa_4']
  },
  {
    id: 'mp-sales-02',
    baseTitle: 'Demonstração de Valor',
    scenario: 'Demonstrar o valor do produto/serviço',
    category: 'sales',
    variations: {
      motivationDirection: {
        toward: 'O diferencial aqui é que você vai conseguir {resultado_positivo}. Nossos clientes estão alcançando {metrica_sucesso} e construindo {visao_futuro}. É exatamente isso que você está buscando, certo?',
        away_from: 'O que fazemos é eliminar {problema_1}, {problema_2} e {problema_3} de uma vez. Você não vai mais perder {recurso_perdido} nem se frustrar com {frustração}. Finalmente vai ter paz de espírito nessa área.'
      },
      referenceFrame: {
        internal: 'Deixa eu te mostrar e você avalia se faz sentido para você. Acredito que você vai perceber rapidamente onde isso se encaixa no seu contexto. O que sua intuição te diz sobre isso?',
        external: 'Vou te mostrar os resultados que nossos clientes estão tendo. {cliente_1} conseguiu {resultado_1}. {cliente_2} relatou {resultado_2}. A média de satisfação é {nota_satisfacao}/10.'
      },
      workingStyle: {
        options: 'Você tem várias formas de usar isso: pode focar em {uso_1}, ou aplicar para {uso_2}, ou combinar com {uso_3}. A beleza é que você adapta conforme sua necessidade.',
        procedures: 'O funcionamento é simples e estruturado: Passo 1: {passo_1}. Passo 2: {passo_2}. Passo 3: {passo_3}. Seguindo esse processo, você garante {resultado_garantido}.'
      }
    },
    variables: ['resultado_positivo', 'metrica_sucesso', 'visao_futuro', 'problema_1', 'problema_2', 'problema_3', 'recurso_perdido', 'frustração', 'cliente_1', 'resultado_1', 'cliente_2', 'resultado_2', 'nota_satisfacao', 'uso_1', 'uso_2', 'uso_3', 'passo_1', 'passo_2', 'passo_3', 'resultado_garantido']
  },

  // OBJECTION HANDLING
  {
    id: 'mp-objection-01',
    baseTitle: 'Objeção de Preço',
    scenario: 'Cliente acha caro demais',
    category: 'objection',
    variations: {
      motivationDirection: {
        toward: 'Entendo a preocupação com investimento. Mas pense: quanto vale para você alcançar {objetivo_cliente}? Quando você conquistar {meta}, qual será o retorno? O investimento se paga quando você conseguir {resultado_financeiro}.',
        away_from: 'Compreendo. Mas quanto está custando NÃO resolver {problema}? Cada mês que passa, você perde {perda_mensal}. Qual o custo de continuar com {dor_atual}? Às vezes o barato sai caro...'
      },
      referenceFrame: {
        internal: 'Você conhece sua situação melhor que ninguém. Na sua avaliação, qual é o custo de não ter isso resolvido? Confio que você sabe calcular o retorno para o seu contexto específico.',
        external: 'Nossos clientes faziam essa mesma conta. {cliente_referencia} pensava igual, mas depois viu que o retorno foi de {roi}%. Em média, recuperam o investimento em {prazo_retorno}.'
      },
      workingStyle: {
        options: 'Temos formas diferentes de viabilizar: podemos parcelar em {parcelas}, começar com um escopo menor, ou fazer um piloto primeiro. Qual dessas alternativas funcionaria melhor para você?',
        procedures: 'Vamos fazer assim: primeiro definimos o escopo inicial. Depois estruturamos o pagamento em etapas. Assim você investe conforme vê resultados. O processo fica: {etapa_pagamento_1}, depois {etapa_pagamento_2}.'
      }
    },
    variables: ['objetivo_cliente', 'meta', 'resultado_financeiro', 'problema', 'perda_mensal', 'dor_atual', 'cliente_referencia', 'roi', 'prazo_retorno', 'parcelas', 'etapa_pagamento_1', 'etapa_pagamento_2']
  },
  {
    id: 'mp-objection-02',
    baseTitle: 'Preciso Pensar',
    scenario: 'Cliente quer mais tempo para decidir',
    category: 'objection',
    variations: {
      motivationDirection: {
        toward: 'Claro, decisões importantes merecem reflexão. Enquanto você pensa, o que te aproximaria mais de {objetivo}? Qual seria o cenário ideal daqui a {prazo}? Posso te enviar algo que ajude nessa análise?',
        away_from: 'Entendo perfeitamente. Só uma reflexão: enquanto você pensa, {problema} continua acontecendo. Cada dia que passa, {consequencia_negativa}. O que você precisa para se sentir seguro em decidir?'
      },
      referenceFrame: {
        internal: 'Faz todo sentido. Você precisa processar internamente. O que mais te ajudaria a chegar na sua conclusão? Que informação falta para você se sentir confortável com a decisão?',
        external: 'Compreendo. Quer que eu te envie os casos de {tipo_cliente} que estavam na mesma situação? Ou prefere conversar com {referencia} que já passou por isso? Às vezes ajuda ver a experiência de outros.'
      },
      workingStyle: {
        options: 'Sem problemas. Enquanto decide, posso te enviar: material sobre {opcao_1}, comparativo de {opcao_2}, ou uma conversa com {opcao_3}. Qual te ajudaria mais?',
        procedures: 'Perfeito. Vamos fazer assim: primeiro você revisa {material}. Depois marcamos uma call de {duracao} para tirar dúvidas. Então você decide com todas as informações. Que dia funciona para a call?'
      }
    },
    variables: ['objetivo', 'prazo', 'problema', 'consequencia_negativa', 'tipo_cliente', 'referencia', 'opcao_1', 'opcao_2', 'opcao_3', 'material', 'duracao']
  },

  // FOLLOW UP
  {
    id: 'mp-followup-01',
    baseTitle: 'Retomada de Contato',
    scenario: 'Retomar conversa após período sem resposta',
    category: 'follow_up',
    variations: {
      motivationDirection: {
        toward: 'Oi {nome}! Lembrei de você porque vi algo que pode te ajudar a alcançar {objetivo}. Ainda está focado em conquistar {meta}? Tenho novidades que podem acelerar seus resultados.',
        away_from: 'Oi {nome}! Passando para saber como está a situação com {problema}. Conseguiu resolver? Se ainda está lidando com isso, tenho algumas ideias que podem te livrar dessa dor de cabeça.'
      },
      referenceFrame: {
        internal: 'Oi {nome}! Sei que você estava avaliando internamente. Chegou a alguma conclusão? Estou à disposição se quiser trocar ideias sobre o que você está pensando.',
        external: 'Oi {nome}! Lembrei de você porque {cliente_similar} acabou de ter ótimos resultados. Achei que você gostaria de saber. Posso compartilhar o que funcionou para eles?'
      },
      workingStyle: {
        options: 'Oi {nome}! Tenho algumas novidades que podem te interessar: {novidade_1}, {novidade_2} ou {novidade_3}. Alguma dessas te chama atenção?',
        procedures: 'Oi {nome}! Seguindo nosso processo: o próximo passo seria {proxima_etapa}. Podemos agendar para {sugestao_data}? Assim mantemos o cronograma que conversamos.'
      }
    },
    variables: ['nome', 'objetivo', 'meta', 'problema', 'cliente_similar', 'novidade_1', 'novidade_2', 'novidade_3', 'proxima_etapa', 'sugestao_data']
  },

  // CLOSING
  {
    id: 'mp-closing-01',
    baseTitle: 'Fechamento de Venda',
    scenario: 'Momento de fechar o negócio',
    category: 'closing',
    variations: {
      motivationDirection: {
        toward: '{nome}, está tudo alinhado para você começar a conquistar {resultado}. Vamos iniciar? Quanto antes começarmos, antes você alcança {meta}!',
        away_from: '{nome}, já conversamos sobre tudo. Cada dia que passa sem resolver, {consequencia_negativa}. Vamos parar essa perda? Posso preparar o contrato agora.'
      },
      referenceFrame: {
        internal: '{nome}, você já tem todas as informações. O que sua intuição diz? Quando você se sente pronto para avançar, é só me dar o sinal.',
        external: '{nome}, {numero_clientes} clientes já passaram por esse momento e ficaram satisfeitos. {cliente_referencia} começou exatamente assim. Vamos seguir o mesmo caminho?'
      },
      workingStyle: {
        options: '{nome}, você pode começar pelo {plano_1} ou pelo {plano_2}. Também dá para customizar com {customizacao}. Qual opção você prefere?',
        procedures: '{nome}, o processo de início é simples: Primeiro, assinamos o contrato. Depois, {etapa_2}. Em {prazo}, você já estará {situacao_final}. Vamos começar?'
      }
    },
    variables: ['nome', 'resultado', 'meta', 'consequencia_negativa', 'numero_clientes', 'cliente_referencia', 'plano_1', 'plano_2', 'customizacao', 'etapa_2', 'prazo', 'situacao_final']
  },

  // RELATIONSHIP
  {
    id: 'mp-relationship-01',
    baseTitle: 'Construção de Rapport',
    scenario: 'Construir relacionamento inicial',
    category: 'relationship',
    variations: {
      motivationDirection: {
        toward: '{nome}, que bom conectar com você! Fiquei curioso sobre seus objetivos com {area}. O que você está buscando alcançar? Quais são suas metas para {periodo}?',
        away_from: '{nome}, prazer em conhecer! Vi que você está no ramo de {area}. Quais são os maiores desafios que você enfrenta hoje? O que te tira o sono nessa área?'
      },
      referenceFrame: {
        internal: '{nome}, gostaria de entender melhor sua visão. Como você enxerga o cenário de {area}? Qual sua perspectiva sobre {assunto}?',
        external: '{nome}, estou estudando o mercado de {area}. Vi que empresas como {empresa_referencia} estão fazendo {tendencia}. O que você acha dessa movimentação?'
      },
      workingStyle: {
        options: '{nome}, atuo em várias frentes: {servico_1}, {servico_2} e {servico_3}. Sempre gosto de entender primeiro o contexto antes de sugerir algo. O que te interessa mais explorar?',
        procedures: '{nome}, costumo começar entendendo a situação atual, depois mapeamos oportunidades, e então definimos próximos passos. Podemos começar me contando sobre {assunto}?'
      }
    },
    variables: ['nome', 'area', 'periodo', 'assunto', 'empresa_referencia', 'tendencia', 'servico_1', 'servico_2', 'servico_3']
  }
];

// Helper function to get adapted message based on metaprograms
export function getAdaptedMessage(
  template: MetaprogramTemplate,
  motivationDirection: MotivationDirection,
  referenceFrame: ReferenceFrame,
  workingStyle: WorkingStyle
): { motivation: string; reference: string; working: string } {
  const motivation = motivationDirection === 'balanced' 
    ? template.variations.motivationDirection.toward 
    : template.variations.motivationDirection[motivationDirection];
    
  const reference = referenceFrame === 'balanced'
    ? template.variations.referenceFrame.internal
    : template.variations.referenceFrame[referenceFrame];
    
  const working = workingStyle === 'balanced'
    ? template.variations.workingStyle.options
    : template.variations.workingStyle[workingStyle];

  return { motivation, reference, working };
}

// Helper to combine template parts into a cohesive message
export function combineTemplateMessage(
  motivationPart: string,
  referencePart: string,
  workingPart: string,
  primaryFocus: 'motivation' | 'reference' | 'working' = 'motivation'
): string {
  // Return the primary focus part as the main message
  switch (primaryFocus) {
    case 'motivation':
      return motivationPart;
    case 'reference':
      return referencePart;
    case 'working':
      return workingPart;
    default:
      return motivationPart;
  }
}
