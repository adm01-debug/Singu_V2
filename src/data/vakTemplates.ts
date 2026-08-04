// Templates adaptados para cada Sistema Representacional VAK
import { VAKType } from '@/types/vak';
import { PersuasionScenario, TriggerType } from '@/types/triggers';

export interface VAKTemplateVariation {
  vakType: VAKType;
  template: string;
  keywords: string[]; // Palavras-chave VAK usadas
  tips: string[];
}

export interface VAKAdaptedTemplate {
  id: string;
  baseTitle: string;
  trigger: TriggerType;
  scenario?: PersuasionScenario;
  channel: 'whatsapp' | 'email' | 'call' | 'meeting' | 'any';
  discProfile: string | null;
  variables: string[];
  variations: VAKTemplateVariation[];
  universalTips: string[];
}

// Templates com variações para cada sistema representacional
export const VAK_ADAPTED_TEMPLATES: VAKAdaptedTemplate[] = [
  // =============================================
  // ABERTURA / PRIMEIRO CONTATO
  // =============================================
  {
    id: 'vak-opening-1',
    baseTitle: 'Apresentação Inicial',
    trigger: 'gift',
    scenario: 'initial_negotiation',
    channel: 'any',
    discProfile: null,
    variables: ['nome', 'empresa', 'solucao', 'beneficio'],
    universalTips: ['Adapte a linguagem ao perfil VAK do contato', 'Observe a resposta para confirmar o sistema preferido'],
    variations: [
      {
        vakType: 'V',
        template: '{nome}, quero te mostrar uma visão clara de como {solucao} pode transformar a {empresa}. Imagine ver seus resultados {beneficio} - a perspectiva é realmente brilhante! Posso te apresentar um panorama completo?',
        keywords: ['mostrar', 'visão clara', 'imagine', 'ver', 'perspectiva', 'brilhante', 'panorama'],
        tips: [
          'Use apresentações visuais com gráficos e imagens',
          'Envie materiais bem formatados e coloridos',
          'Mantenha contato visual em reuniões',
        ],
      },
      {
        vakType: 'A',
        template: '{nome}, quero conversar sobre como {solucao} pode ressoar com as necessidades da {empresa}. Tenho ouvido excelentes feedbacks sobre {beneficio}. Podemos bater um papo rápido para eu te contar mais?',
        keywords: ['conversar', 'ressoar', 'ouvido', 'feedbacks', 'bater um papo', 'contar'],
        tips: [
          'Prefira ligações telefônicas',
          'Envie áudios no WhatsApp quando apropriado',
          'Varie o tom de voz para enfatizar pontos',
        ],
      },
      {
        vakType: 'K',
        template: '{nome}, quero compartilhar algo que sinto que pode fazer diferença sólida para a {empresa}. Muitos clientes se sentem mais seguros e confortáveis depois de implementar {solucao}. Podemos entrar em contato para você sentir melhor o que oferecemos?',
        keywords: ['sinto', 'sólida', 'sentem', 'seguros', 'confortáveis', 'entrar em contato', 'sentir'],
        tips: [
          'Construa rapport antes de falar de negócios',
          'Seja paciente e caloroso',
          'Prefira encontros presenciais quando possível',
        ],
      },
      {
        vakType: 'D',
        template: '{nome}, analisei o cenário da {empresa} e os dados indicam que {solucao} faz sentido estratégico. Baseado em fatos, empresas similares obtiveram {beneficio}. Posso apresentar a lógica por trás disso?',
        keywords: ['analisei', 'dados', 'faz sentido', 'estratégico', 'baseado em fatos', 'lógica'],
        tips: [
          'Apresente dados e estatísticas',
          'Seja preciso e evite exageros',
          'Use ROI e métricas concretas',
        ],
      },
    ],
  },

  // =============================================
  // OBJEÇÃO DE PREÇO
  // =============================================
  {
    id: 'vak-price-objection-1',
    baseTitle: 'Resposta à Objeção de Preço',
    trigger: 'reason_why',
    scenario: 'price_objection',
    channel: 'any',
    discProfile: null,
    variables: ['nome', 'economia', 'periodo', 'investimento'],
    universalTips: ['Nunca justifique preço, justifique VALOR', 'Adapte os predicados ao sistema VAK'],
    variations: [
      {
        vakType: 'V',
        template: '{nome}, deixa eu te mostrar o quadro completo. Olhando para os números, você verá claramente que a economia de R$ {economia} em {periodo} supera o investimento. Visualize sua empresa colhendo esses resultados!',
        keywords: ['mostrar', 'quadro completo', 'olhando', 'verá', 'claramente', 'visualize'],
        tips: [
          'Use gráficos comparativos de antes/depois',
          'Mostre visualmente a curva de ROI',
          'Envie infográficos com os números',
        ],
      },
      {
        vakType: 'A',
        template: '{nome}, me escuta só: o que você está ouvindo como "preço" é na verdade eco de economia. Empresas me dizem que após {periodo}, a harmonia financeira volta - são R$ {economia} que falam por si. Vamos conversar sobre isso?',
        keywords: ['escuta', 'ouvindo', 'eco', 'dizem', 'harmonia', 'falam', 'conversar'],
        tips: [
          'Use a voz para transmitir confiança',
          'Cite depoimentos em áudio',
          'Deixe o cliente falar sobre suas preocupações',
        ],
      },
      {
        vakType: 'K',
        template: '{nome}, entendo que o peso do investimento preocupa. Mas sinta isso: em {periodo}, você terá R$ {economia} de volta no caixa. É uma sensação de alívio e segurança. Posso te dar essa tranquilidade com condições confortáveis.',
        keywords: ['peso', 'sinta', 'sensação', 'alívio', 'segurança', 'tranquilidade', 'confortáveis'],
        tips: [
          'Demonstre empatia genuína',
          'Ofereça experiências práticas (trial, demo)',
          'Não pressione - dê tempo para processar',
        ],
      },
      {
        vakType: 'D',
        template: '{nome}, vamos analisar os fatos: o investimento de R$ {investimento} gera retorno de R$ {economia} em {periodo}. Matematicamente, isso representa um ROI de X%. Do ponto de vista lógico, os dados sustentam a decisão.',
        keywords: ['analisar', 'fatos', 'investimento', 'matematicamente', 'ROI', 'ponto de vista lógico', 'dados'],
        tips: [
          'Apresente planilhas com cálculos detalhados',
          'Cite estudos e pesquisas',
          'Responda perguntas com fatos comprováveis',
        ],
      },
    ],
  },

  // =============================================
  // CLIENTE INDECISO
  // =============================================
  {
    id: 'vak-indecisive-1',
    baseTitle: 'Cliente Indeciso - Ajuda na Decisão',
    trigger: 'small_yes',
    scenario: 'indecisive_client',
    channel: 'any',
    discProfile: null,
    variables: ['nome', 'primeiro_passo', 'beneficio_rapido'],
    universalTips: ['Reduza a decisão em partes menores', 'Identifique o sistema VAK para comunicar melhor'],
    variations: [
      {
        vakType: 'V',
        template: '{nome}, que tal começar com algo que você possa ver funcionando? Vamos focar em {primeiro_passo} - assim você terá uma visão clara de como funciona antes de olhar para o quadro maior.',
        keywords: ['ver', 'focar', 'visão clara', 'olhar', 'quadro maior'],
        tips: [
          'Mostre screenshots ou vídeos de demonstração',
          'Use cores para destacar progressão',
          'Envie timeline visual do processo',
        ],
      },
      {
        vakType: 'A',
        template: '{nome}, ouça minha sugestão: começamos com {primeiro_passo}. Assim você pode ouvir diretamente os resultados e contar com meu suporte em cada etapa. Como isso soa para você?',
        keywords: ['ouça', 'começamos', 'ouvir', 'contar', 'soa'],
        tips: [
          'Ofereça calls regulares de acompanhamento',
          'Grave áudios explicativos',
          'Pergunte frequentemente "como isso soa?"',
        ],
      },
      {
        vakType: 'K',
        template: '{nome}, entendo a sensação de dúvida. Que tal dar um pequeno passo seguro com {primeiro_passo}? Assim você sente na prática como funciona, sem pressão. Estou aqui para te dar todo suporte.',
        keywords: ['sensação', 'passo', 'seguro', 'sente', 'prática', 'pressão', 'suporte'],
        tips: [
          'Ofereça período de teste/experiência',
          'Demonstre produto fisicamente se possível',
          'Seja paciente e reconfortante',
        ],
      },
      {
        vakType: 'D',
        template: '{nome}, analisando sua situação, faz sentido começar por {primeiro_passo}. É um processo lógico que permite avaliar os resultados antes de decidir sobre etapas maiores. Baseado nos dados, é a estratégia mais racional.',
        keywords: ['analisando', 'faz sentido', 'processo lógico', 'avaliar', 'decidir', 'dados', 'estratégia', 'racional'],
        tips: [
          'Apresente framework de decisão',
          'Forneça checklist de avaliação',
          'Mostre métricas de sucesso claras',
        ],
      },
    ],
  },

  // =============================================
  // FOLLOW-UP
  // =============================================
  {
    id: 'vak-followup-1',
    baseTitle: 'Follow-up Após Reunião',
    trigger: 'commitment',
    scenario: 'general',
    channel: 'any',
    discProfile: null,
    variables: ['nome', 'assunto_reuniao', 'proximo_passo', 'data'],
    universalTips: ['Reforce os pontos discutidos usando linguagem VAK', 'Mantenha consistência com o canal preferido'],
    variations: [
      {
        vakType: 'V',
        template: '{nome}, foi ótimo te ver! Recapitulando o que vimos: {assunto_reuniao}. Para clarear o caminho, o próximo passo seria {proximo_passo}. Você consegue visualizar isso acontecendo até {data}?',
        keywords: ['ver', 'vimos', 'clarear', 'visualizar'],
        tips: [
          'Envie resumo visual da reunião',
          'Use imagens/screenshots para lembrar pontos',
          'Proponha próxima reunião com compartilhamento de tela',
        ],
      },
      {
        vakType: 'A',
        template: '{nome}, foi ótimo conversar! Sobre o que discutimos: {assunto_reuniao}. Para manter o ritmo, faz sentido avançarmos com {proximo_passo}. Posso te ligar em {data} para alinharmos?',
        keywords: ['conversar', 'discutimos', 'ritmo', 'ligar', 'alinharmos'],
        tips: [
          'Grave resumo em áudio',
          'Agende próximo call',
          'Mantenha contato por voz',
        ],
      },
      {
        vakType: 'K',
        template: '{nome}, foi muito bom nosso encontro! Saí com uma sensação positiva. Sobre o que tocamos: {assunto_reuniao}. Para manter o contato firme, sugiro {proximo_passo}. Como você se sente em relação a {data}?',
        keywords: ['encontro', 'sensação', 'tocamos', 'contato', 'firme', 'sente'],
        tips: [
          'Prefira encontros presenciais',
          'Envie algo tangível (material físico)',
          'Demonstre cuidado genuíno',
        ],
      },
      {
        vakType: 'D',
        template: '{nome}, conforme nossa reunião, os pontos principais foram: {assunto_reuniao}. Analisando os próximos passos lógicos, faz sentido {proximo_passo}. Podemos confirmar para {data}?',
        keywords: ['conforme', 'pontos', 'analisando', 'lógicos', 'faz sentido', 'confirmar'],
        tips: [
          'Envie ata estruturada com tópicos',
          'Liste próximos passos numerados',
          'Inclua dados discutidos',
        ],
      },
    ],
  },

  // =============================================
  // REATIVAÇÃO DE CLIENTE
  // =============================================
  {
    id: 'vak-reactivation-1',
    baseTitle: 'Reativação de Cliente Inativo',
    trigger: 'gift',
    scenario: 'lost_client_reactivation',
    channel: 'any',
    discProfile: null,
    variables: ['nome', 'tempo_afastado', 'novidade', 'beneficio'],
    universalTips: ['Reconecte usando o sistema preferido do cliente', 'Ofereça valor antes de pedir algo'],
    variations: [
      {
        vakType: 'V',
        template: '{nome}, faz {tempo_afastado} que não nos vemos! Quero te mostrar o que mudou - lançamos {novidade} que vai transformar a forma como você enxerga {beneficio}. Quer dar uma olhada?',
        keywords: ['vemos', 'mostrar', 'mudou', 'enxerga', 'olhada'],
        tips: [
          'Envie vídeo ou imagens do novo produto',
          'Crie antes/depois visual',
          'Use cores vibrantes para chamar atenção',
        ],
      },
      {
        vakType: 'A',
        template: '{nome}, faz {tempo_afastado} que não conversamos! Quero te contar sobre {novidade} - tenho ouvido feedbacks incríveis sobre {beneficio}. Podemos bater um papo rápido?',
        keywords: ['conversamos', 'contar', 'ouvido', 'feedbacks', 'bater um papo'],
        tips: [
          'Envie áudio personalizado',
          'Ofereça call descontraído',
          'Compartilhe depoimentos em áudio',
        ],
      },
      {
        vakType: 'K',
        template: '{nome}, senti sua falta! Faz {tempo_afastado} que não temos contato. Preparei algo especial pensando em você - {novidade} pode trazer a sensação de {beneficio} de volta. Podemos nos reconectar?',
        keywords: ['senti', 'falta', 'contato', 'pensando', 'sensação', 'reconectar'],
        tips: [
          'Seja caloroso e genuíno',
          'Ofereça experiência prática',
          'Proponha café ou encontro',
        ],
      },
      {
        vakType: 'D',
        template: '{nome}, analisando nosso histórico, notei que faz {tempo_afastado} desde nosso último contato. Os dados mostram que {novidade} pode otimizar {beneficio} significativamente. Faz sentido revisitarmos?',
        keywords: ['analisando', 'histórico', 'notei', 'dados', 'otimizar', 'faz sentido', 'revisitarmos'],
        tips: [
          'Envie relatório de resultados anteriores',
          'Mostre evolução com números',
          'Apresente comparativo de melhorias',
        ],
      },
    ],
  },

  // =============================================
  // NEGOCIAÇÃO FINAL / FECHAMENTO
  // =============================================
  {
    id: 'vak-closing-1',
    baseTitle: 'Fechamento de Venda',
    trigger: 'scarcity',
    scenario: 'initial_negotiation',
    channel: 'any',
    discProfile: null,
    variables: ['nome', 'oferta', 'prazo', 'beneficio_exclusivo'],
    universalTips: ['Use urgência de forma genuína', 'Adapte o senso de urgência ao sistema VAK'],
    variations: [
      {
        vakType: 'V',
        template: '{nome}, olhando para {oferta}, a janela de oportunidade está clara: até {prazo} você garante {beneficio_exclusivo}. Consegue visualizar seu negócio aproveitando isso?',
        keywords: ['olhando', 'janela', 'clara', 'visualizar'],
        tips: [
          'Mostre countdown visual',
          'Use banner de urgência colorido',
          'Envie comparativo de preços antes/depois',
        ],
      },
      {
        vakType: 'A',
        template: '{nome}, preciso te dizer: {oferta} vale até {prazo}. Muitos clientes já me ligaram garantindo {beneficio_exclusivo}. Posso confirmar a sua vaga?',
        keywords: ['dizer', 'ligaram', 'confirmar'],
        tips: [
          'Ligue para criar urgência pessoal',
          'Mencione outros clientes que confirmaram',
          'Use tom de voz urgente mas amigável',
        ],
      },
      {
        vakType: 'K',
        template: '{nome}, quero que você sinta segurança nessa decisão. {oferta} é válida até {prazo} - depois disso, a sensação de oportunidade perdida pode pesar. Vamos garantir {beneficio_exclusivo} para você?',
        keywords: ['sinta', 'segurança', 'sensação', 'pesar', 'garantir'],
        tips: [
          'Transmita calma junto com urgência',
          'Ofereça garantia para reduzir ansiedade',
          'Esteja disponível para tirar dúvidas',
        ],
      },
      {
        vakType: 'D',
        template: '{nome}, analisando os números: {oferta} representa economia de X% até {prazo}. Depois dessa data, a lógica financeira muda. Os dados favorecem a decisão agora. Confirmo?',
        keywords: ['analisando', 'números', 'representa', 'lógica', 'dados', 'decisão'],
        tips: [
          'Apresente cálculo de custo de esperar',
          'Mostre tabela comparativa de cenários',
          'Seja direto com deadline',
        ],
      },
    ],
  },

  // =============================================
  // UPSELL / CROSS-SELL
  // =============================================
  {
    id: 'vak-upsell-1',
    baseTitle: 'Upsell para Cliente Atual',
    trigger: 'personalization',
    scenario: 'upsell_crosssell',
    channel: 'any',
    discProfile: null,
    variables: ['nome', 'produto_atual', 'upgrade', 'beneficio_adicional'],
    universalTips: ['Baseie no histórico do cliente', 'Mostre evolução natural'],
    variations: [
      {
        vakType: 'V',
        template: '{nome}, vendo seu uso de {produto_atual}, ficou claro que {upgrade} seria o próximo passo. Imagine visualizar {beneficio_adicional} no seu dashboard!',
        keywords: ['vendo', 'ficou claro', 'imagine', 'visualizar', 'dashboard'],
        tips: [
          'Mostre preview do upgrade',
          'Crie mockup personalizado',
          'Use comparativo visual antes/depois',
        ],
      },
      {
        vakType: 'A',
        template: '{nome}, tenho ouvido seu feedback sobre {produto_atual} e isso ressoou comigo. {upgrade} pode trazer a harmonia que você precisa - {beneficio_adicional}. Podemos conversar sobre isso?',
        keywords: ['ouvido', 'feedback', 'ressoou', 'harmonia', 'conversar'],
        tips: [
          'Cite feedbacks anteriores do cliente',
          'Ofereça demo por call',
          'Pergunte o que ele precisa ouvir',
        ],
      },
      {
        vakType: 'K',
        template: '{nome}, sentindo como você usa {produto_atual}, percebi que {upgrade} pode trazer ainda mais conforto e segurança. {beneficio_adicional} - como você se sente sobre experimentar?',
        keywords: ['sentindo', 'percebi', 'conforto', 'segurança', 'sente', 'experimentar'],
        tips: [
          'Ofereça trial do upgrade',
          'Demonstre pessoalmente',
          'Dê tempo para sentir os benefícios',
        ],
      },
      {
        vakType: 'D',
        template: '{nome}, analisando seu uso de {produto_atual}, os dados indicam que {upgrade} otimizaria seus resultados. Especificamente, você teria {beneficio_adicional}. Faz sentido avaliarmos?',
        keywords: ['analisando', 'uso', 'dados', 'indicam', 'otimizaria', 'especificamente', 'faz sentido', 'avaliarmos'],
        tips: [
          'Mostre relatório de uso atual',
          'Apresente projeção com upgrade',
          'Compare métricas antes/depois',
        ],
      },
    ],
  },

  // =============================================
  // RENOVAÇÃO DE CONTRATO
  // =============================================
  {
    id: 'vak-renewal-1',
    baseTitle: 'Renovação de Contrato',
    trigger: 'commitment',
    scenario: 'contract_renewal',
    channel: 'any',
    discProfile: null,
    variables: ['nome', 'tempo_parceria', 'resultados', 'proposta_renovacao'],
    universalTips: ['Reforce resultados obtidos', 'Valorize a parceria'],
    variations: [
      {
        vakType: 'V',
        template: '{nome}, olhando para nossos {tempo_parceria} de parceria, os resultados são visíveis: {resultados}. Quero te mostrar nossa proposta de renovação com uma perspectiva ainda mais brilhante!',
        keywords: ['olhando', 'visíveis', 'mostrar', 'perspectiva', 'brilhante'],
        tips: [
          'Prepare relatório visual de resultados',
          'Use gráficos de evolução',
          'Mostre roadmap futuro ilustrado',
        ],
      },
      {
        vakType: 'A',
        template: '{nome}, em {tempo_parceria} juntos, ouço apenas coisas boas: {resultados}. Quero conversar sobre a renovação - temos novidades que vão ressoar com suas necessidades!',
        keywords: ['ouço', 'coisas boas', 'conversar', 'ressoar'],
        tips: [
          'Agende call de renovação',
          'Relembre conversas positivas anteriores',
          'Conte as novidades com entusiasmo',
        ],
      },
      {
        vakType: 'K',
        template: '{nome}, em {tempo_parceria} construímos algo sólido juntos: {resultados}. Sinto que é hora de fortalecer ainda mais nossa parceria. Posso compartilhar uma proposta que vai te deixar confortável?',
        keywords: ['construímos', 'sólido', 'sinto', 'fortalecer', 'confortável'],
        tips: [
          'Encontre-se pessoalmente',
          'Celebre a parceria',
          'Transmita segurança na continuidade',
        ],
      },
      {
        vakType: 'D',
        template: '{nome}, analisando os {tempo_parceria} de parceria, os dados confirmam: {resultados}. Do ponto de vista lógico, a renovação faz total sentido. Preparei uma proposta com números otimizados.',
        keywords: ['analisando', 'dados', 'confirmam', 'ponto de vista lógico', 'faz sentido', 'números'],
        tips: [
          'Envie relatório completo de ROI',
          'Compare com alternativas do mercado',
          'Detalhe melhorias para próximo ciclo',
        ],
      },
    ],
  },

  // =============================================
  // OBJEÇÃO DE TIMING
  // =============================================
  {
    id: 'vak-timing-objection-1',
    baseTitle: 'Resposta à Objeção de Timing',
    trigger: 'urgency',
    scenario: 'timing_objection',
    channel: 'any',
    discProfile: null,
    variables: ['nome', 'custo_espera', 'beneficio_agora', 'alternativa'],
    universalTips: ['Mostre o custo de esperar', 'Ofereça opção reduzida para começar'],
    variations: [
      {
        vakType: 'V',
        template: '{nome}, vejo que timing é uma preocupação. Mas olha: cada mês de espera representa {custo_espera} não aproveitados. Visualize {beneficio_agora} começando agora. Talvez uma {alternativa} focada faça sentido?',
        keywords: ['vejo', 'olha', 'representa', 'visualize', 'focada'],
        tips: [
          'Mostre timeline de implementação',
          'Ilustre custo de oportunidade',
          'Apresente opção visual simplificada',
        ],
      },
      {
        vakType: 'A',
        template: '{nome}, ouço sua preocupação com timing. Mas escute: {custo_espera} é muito para deixar na mesa. Posso te contar sobre {alternativa} que se encaixa melhor no seu momento? Vamos conversar!',
        keywords: ['ouço', 'escute', 'contar', 'conversar'],
        tips: [
          'Ligue para entender melhor a objeção',
          'Ouça os reais motivos',
          'Proponha soluções por telefone',
        ],
      },
      {
        vakType: 'K',
        template: '{nome}, entendo a sensação de que não é o momento. Mas cada mês pesa: {custo_espera}. Que tal sentirmos juntos {alternativa}? Algo leve para começar, sem pressão, que traga {beneficio_agora}.',
        keywords: ['sensação', 'momento', 'pesa', 'sentirmos', 'leve', 'pressão'],
        tips: [
          'Seja empático com a situação',
          'Ofereça opção sem compromisso',
          'Não force - acolha a objeção',
        ],
      },
      {
        vakType: 'D',
        template: '{nome}, analisando o timing: adiar custa {custo_espera}/mês. Em 6 meses, são R$ X perdidos. Os dados sugerem {alternativa} como opção racional para começar e ter {beneficio_agora}. Faz sentido avaliar?',
        keywords: ['analisando', 'custa', 'dados', 'sugerem', 'opção racional', 'faz sentido', 'avaliar'],
        tips: [
          'Calcule custo de oportunidade detalhado',
          'Apresente cenários com projeções',
          'Mostre ROI da opção reduzida',
        ],
      },
    ],
  },
];

// Função para obter template adaptado ao VAK
export function getVAKAdaptedTemplate(
  templateId: string,
  vakType: VAKType
): { template: string; tips: string[]; keywords: string[] } | null {
  const vakTemplate = VAK_ADAPTED_TEMPLATES.find(t => t.id === templateId);
  if (!vakTemplate) return null;

  const variation = vakTemplate.variations.find(v => v.vakType === vakType);
  if (!variation) return null;

  return {
    template: variation.template,
    tips: [...variation.tips, ...vakTemplate.universalTips],
    keywords: variation.keywords,
  };
}

// Função para obter todos os templates para um VAK específico
export function getAllTemplatesForVAK(vakType: VAKType): {
  id: string;
  title: string;
  trigger: TriggerType;
  scenario?: PersuasionScenario;
  template: string;
  tips: string[];
  keywords: string[];
  variables: string[];
  channel: string;
}[] {
  return VAK_ADAPTED_TEMPLATES.map(t => {
    const variation = t.variations.find(v => v.vakType === vakType);
    if (!variation) return null;

    return {
      id: t.id,
      title: t.baseTitle,
      trigger: t.trigger,
      scenario: t.scenario,
      template: variation.template,
      tips: [...variation.tips, ...t.universalTips],
      keywords: variation.keywords,
      variables: t.variables,
      channel: t.channel,
    };
  }).filter((t): t is NonNullable<typeof t> => t !== null);
}
