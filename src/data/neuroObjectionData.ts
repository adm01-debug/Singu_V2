import { BrainSystem, Neurochemical } from '@/types/neuromarketing';

export interface ObjectionTemplate {
  id: string;
  category: string;
  objection: string;
  responses: {
    brain: BrainSystem;
    response: string;
    neurochemicalTarget: Neurochemical;
    keyPhrase: string;
  }[];
  commonVariations: string[];
}

export const OBJECTION_TEMPLATES: ObjectionTemplate[] = [
  {
    id: 'price', category: 'Preço', objection: 'Está muito caro',
    responses: [
      { brain: 'reptilian', response: 'Entendo sua preocupação. Deixa eu mostrar exatamente quanto você está PERDENDO por dia sem essa solução. São R$ X por dia - isso em um ano representa R$ Y. O investimento se paga em Z semanas.', neurochemicalTarget: 'cortisol', keyPhrase: 'quanto você está PERDENDO por dia' },
      { brain: 'limbic', response: 'Compreendo totalmente. Muitos dos nossos melhores clientes tiveram a mesma preocupação inicial. O João, por exemplo, me disse exatamente isso. Hoje ele fala que foi a melhor decisão que tomou. Posso contar a história dele?', neurochemicalTarget: 'oxytocin', keyPhrase: 'nossos melhores clientes tiveram a mesma preocupação' },
      { brain: 'neocortex', response: 'Vamos analisar juntos. Se olharmos o custo por uso, estamos falando de R$ X por dia. Compare isso com [alternativa] que custa R$ Y mas entrega apenas Z. O ROI projetado em 12 meses é de W%.', neurochemicalTarget: 'serotonin', keyPhrase: 'Se olharmos o custo por uso' },
    ],
    commonVariations: ['Não tenho orçamento', 'Preciso de desconto', 'Encontrei mais barato'],
  },
  {
    id: 'timing', category: 'Timing', objection: 'Agora não é o momento certo',
    responses: [
      { brain: 'reptilian', response: 'Entendo. Mas deixa eu perguntar: o que acontece se você esperar mais 6 meses? Seus concorrentes já estão se movendo. A cada semana que passa, você fica mais para trás.', neurochemicalTarget: 'cortisol', keyPhrase: 'Seus concorrentes já estão se movendo' },
      { brain: 'limbic', response: 'Faz total sentido. Posso perguntar - o que te faria sentir mais confortável para avançar? Quero entender o que é importante para você neste momento.', neurochemicalTarget: 'oxytocin', keyPhrase: 'o que é importante para você' },
      { brain: 'neocortex', response: 'Entendo a lógica. Vamos mapear juntos: qual seria o momento ideal e quais critérios precisam ser atendidos? Assim podemos criar um plano que respeite seu timing.', neurochemicalTarget: 'serotonin', keyPhrase: 'quais critérios precisam ser atendidos' },
    ],
    commonVariations: ['Vamos conversar ano que vem', 'Estamos em reestruturação', 'Preciso resolver outras prioridades'],
  },
  {
    id: 'authority', category: 'Autoridade', objection: 'Preciso falar com meu sócio/chefe',
    responses: [
      { brain: 'reptilian', response: 'Claro, faz sentido. Para garantir que ele tenha todas as informações, o que você acha mais importante destacar? Qual é a maior preocupação que ele teria?', neurochemicalTarget: 'adrenaline', keyPhrase: 'Para garantir que ele tenha todas as informações' },
      { brain: 'limbic', response: 'Perfeito, é importante ter o apoio de todos. Como você acha que ele vai reagir? Já conversaram sobre esse tipo de solução antes?', neurochemicalTarget: 'oxytocin', keyPhrase: 'é importante ter o apoio de todos' },
      { brain: 'neocortex', response: 'Faz sentido. Posso preparar uma análise comparativa para facilitar a decisão? Quais métricas são mais importantes para ele avaliar?', neurochemicalTarget: 'serotonin', keyPhrase: 'Quais métricas são mais importantes' },
    ],
    commonVariations: ['Não decido sozinho', 'Preciso de aprovação', 'Vou consultar a diretoria'],
  },
  {
    id: 'trust', category: 'Confiança', objection: 'Não conheço sua empresa',
    responses: [
      { brain: 'reptilian', response: 'Entendo sua cautela - é inteligente pesquisar antes. Já atendemos [número] empresas como a sua. Posso mostrar casos específicos do seu segmento com resultados comprovados?', neurochemicalTarget: 'cortisol', keyPhrase: 'Já atendemos [número] empresas como a sua' },
      { brain: 'limbic', response: 'Aprecio sua honestidade. A confiança se constrói com o tempo. Que tal conversarmos com um cliente nosso do seu segmento? Ele pode compartilhar a experiência real.', neurochemicalTarget: 'oxytocin', keyPhrase: 'A confiança se constrói com o tempo' },
      { brain: 'neocortex', response: 'Faz sentido querer mais informações. Temos estudos de caso documentados, certificações [X, Y, Z] e um período de teste gratuito para você avaliar sem compromisso.', neurochemicalTarget: 'serotonin', keyPhrase: 'período de teste gratuito para você avaliar' },
    ],
    commonVariations: ['Nunca ouvi falar', 'Prefiro marcas conhecidas', 'Quanto tempo vocês existem?'],
  },
  {
    id: 'competitor', category: 'Concorrência', objection: 'Já uso outra solução',
    responses: [
      { brain: 'reptilian', response: 'Interessante. E você está 100% satisfeito? Ou existe algo que poderia ser melhor? Muitos clientes vieram de [concorrente] e conseguiram [resultado] que antes não tinham.', neurochemicalTarget: 'dopamine', keyPhrase: 'conseguiram [resultado] que antes não tinham' },
      { brain: 'limbic', response: 'Ótimo que você já valoriza esse tipo de solução! Como tem sido sua experiência? O que você mais gosta e o que gostaria que fosse diferente?', neurochemicalTarget: 'oxytocin', keyPhrase: 'Como tem sido sua experiência?' },
      { brain: 'neocortex', response: 'Perfeito. Posso fazer uma análise comparativa? Sem compromisso, apenas para você ter clareza se está extraindo o máximo valor ou se existe espaço para otimização.', neurochemicalTarget: 'serotonin', keyPhrase: 'análise comparativa' },
    ],
    commonVariations: ['Estou satisfeito com o atual', 'Tenho contrato vigente', 'Já tentei algo parecido'],
  },
];
