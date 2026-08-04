import { BrainSystem, PrimalStimulus } from '@/types/neuromarketing';

export interface ScriptSection {
  name: string;
  brainTarget: BrainSystem;
  stimuliUsed: PrimalStimulus[];
  content: string;
  timing: string;
}

type ScriptGoal = 'discovery' | 'presentation' | 'closing' | 'objection';

export function generateScriptSections(
  goal: ScriptGoal,
  dominantBrain: BrainSystem,
  firstName: string
): ScriptSection[] {
  const scripts: Record<ScriptGoal, ScriptSection[]> = {
    discovery: [
      {
        name: 'Abertura (Hook)', brainTarget: 'reptilian', stimuliUsed: ['self_centered', 'contrast'], timing: '0-30 segundos',
        content: dominantBrain === 'reptilian'
          ? `${firstName}, antes de falarmos sobre [produto], preciso entender: qual é o maior risco que você enfrenta hoje se nada mudar nos próximos 3 meses?`
          : dominantBrain === 'limbic'
          ? `${firstName}, eu estava pensando em você... Como você tem se sentido em relação a [área]? O que mais te incomoda sobre isso?`
          : `${firstName}, gostaria de entender sua situação atual. Quais métricas você usa para avaliar [área]? O que os números mostram?`
      },
      {
        name: 'Exploração de Dor', brainTarget: dominantBrain, stimuliUsed: ['emotional', 'tangible'], timing: '30s - 3min',
        content: dominantBrain === 'reptilian'
          ? `E se isso continuar, qual seria o impacto no seu [negócio/equipe/posição]? Já calculou quanto isso pode custar?`
          : dominantBrain === 'limbic'
          ? `Isso me parece frustrante... Como sua equipe reage a isso? E você pessoalmente, como se sente lidando com isso todo dia?`
          : `Interessante. Você tem dados sobre o impacto atual? Qual é o custo de oportunidade de não resolver isso?`
      },
      {
        name: 'Transição Suave', brainTarget: 'limbic', stimuliUsed: ['memorable', 'self_centered'], timing: '3-5min',
        content: `Entendo completamente, ${firstName}. Muitos dos meus melhores clientes estavam exatamente nessa situação antes de conversarmos. Posso te mostrar como eles resolveram?`
      }
    ],
    presentation: [
      {
        name: 'Gancho Inicial (Atenção)', brainTarget: 'reptilian', stimuliUsed: ['contrast', 'visual'], timing: '0-30 segundos',
        content: dominantBrain === 'reptilian'
          ? `${firstName}, vou direto ao ponto: você pode continuar fazendo [método atual] e aceitar [consequência negativa], OU pode adotar [solução] e eliminar esse risco completamente. Qual prefere?`
          : dominantBrain === 'limbic'
          ? `${firstName}, lembra quando você mencionou [dor/frustração]? Hoje quero te mostrar como outros profissionais como você superaram exatamente isso... e o que sentiram depois.`
          : `${firstName}, preparei uma análise detalhada para você. Os dados mostram que empresas no seu setor que implementaram [solução] viram [métrica específica]. Deixe-me compartilhar os números.`
      },
      {
        name: 'Proposta de Valor (Claim)', brainTarget: dominantBrain, stimuliUsed: ['tangible', 'self_centered'], timing: '30s - 2min',
        content: dominantBrain === 'reptilian'
          ? `Nossa solução é a ÚNICA que oferece [diferencial exclusivo]. Em [tempo], você terá [resultado tangível]. Sem riscos, garantia de [X dias].`
          : dominantBrain === 'limbic'
          ? `O que torna nossa parceria especial é o cuidado genuíno com seus resultados. Não somos apenas fornecedores - somos parceiros comprometidos com seu sucesso. Nossos clientes se tornam amigos.`
          : `Especificamente: ROI de [X%] em [prazo], redução de [Y%] em [métrica], e aumento de [Z%] em [resultado]. Aqui estão os estudos de caso que comprovam.`
      },
      {
        name: 'Prova Social (Gain)', brainTarget: 'limbic', stimuliUsed: ['memorable', 'emotional'], timing: '2-4min',
        content: `A [Empresa X], que enfrentava exatamente o mesmo desafio que você, implementou nossa solução e em [tempo] conseguiu [resultado]. O [Nome do decisor] me disse: "Foi a melhor decisão que tomei este ano."`
      },
      {
        name: 'Contraste Visual', brainTarget: 'reptilian', stimuliUsed: ['contrast', 'visual'], timing: '4-5min',
        content: `Deixe-me mostrar o ANTES e DEPOIS: [Cenário atual com problema] VS [Cenário futuro com solução]. A diferença é de [X] para [Y]. Você consegue visualizar isso na sua operação?`
      },
      {
        name: 'Fechamento (Âncora Final)', brainTarget: 'reptilian', stimuliUsed: ['emotional', 'self_centered'], timing: 'Final',
        content: dominantBrain === 'reptilian'
          ? `${firstName}, você tem duas opções agora: agir hoje e resolver [problema] de vez, ou esperar e continuar pagando o preço de [consequência]. O que faz mais sentido para você?`
          : dominantBrain === 'limbic'
          ? `${firstName}, eu realmente acredito que você merece ter [resultado desejado]. Vamos dar o próximo passo juntos?`
          : `${firstName}, baseado nos dados que analisamos, qual seria o próximo passo lógico para você testar nossa solução?`
      }
    ],
    closing: [
      {
        name: 'Resumo de Valor', brainTarget: 'neocortex', stimuliUsed: ['tangible', 'contrast'], timing: '0-1min',
        content: `Recapitulando, ${firstName}: você terá [benefício 1], [benefício 2] e [benefício 3]. Comparando com sua situação atual, isso representa [melhoria quantificada].`
      },
      {
        name: 'Gatilho de Urgência', brainTarget: 'reptilian', stimuliUsed: ['emotional', 'self_centered'], timing: '1-2min',
        content: dominantBrain === 'reptilian'
          ? `A condição especial que mencionei só é válida até [data]. Depois disso, o investimento aumenta [X%]. Você prefere garantir agora?`
          : dominantBrain === 'limbic'
          ? `${firstName}, a cada dia que passa sem resolver isso, você continua sentindo [frustração]. Não seria um alívio resolver isso hoje?`
          : `Considerando o custo de oportunidade de R$ [valor]/mês, cada semana de atraso representa R$ [valor] perdido. Matematicamente, faz sentido começar quando?`
      },
      {
        name: 'Call to Action Final', brainTarget: dominantBrain, stimuliUsed: ['memorable', 'emotional'], timing: 'Final',
        content: dominantBrain === 'reptilian'
          ? `Vamos fazer assim: assine agora e você está protegido a partir de hoje. Qual o melhor email para enviar o contrato?`
          : dominantBrain === 'limbic'
          ? `Estou animado em começar essa parceria com você, ${firstName}. Vamos dar o primeiro passo juntos?`
          : `Então, para formalizar: precisamos de [documentos]. Você consegue providenciar hoje para começarmos [data]?`
      }
    ],
    objection: [
      {
        name: 'Validação Empática', brainTarget: 'limbic', stimuliUsed: ['emotional', 'self_centered'], timing: 'Imediato',
        content: `Entendo perfeitamente sua preocupação, ${firstName}. É uma consideração muito válida e mostra que você está pensando com cuidado nisso.`
      },
      {
        name: 'Reenquadramento (Sleight of Mouth)', brainTarget: dominantBrain, stimuliUsed: ['contrast', 'tangible'], timing: '10-30s',
        content: dominantBrain === 'reptilian'
          ? `E se eu pudesse mostrar que NÃO tomar essa decisão é na verdade o maior risco? O custo de não agir é [consequência específica].`
          : dominantBrain === 'limbic'
          ? `Muitos dos nossos melhores clientes tiveram a mesma dúvida no início. Sabe o que eles dizem agora? Que gostariam de ter começado antes.`
          : `Vamos analisar os números juntos: [dado 1] vs [dado 2]. Quando você olha dessa forma, qual conclusão os dados sugerem?`
      },
      {
        name: 'Prova Específica', brainTarget: 'neocortex', stimuliUsed: ['tangible', 'memorable'], timing: '30s - 1min',
        content: `Deixe-me compartilhar um caso real: [Nome] tinha exatamente essa objeção. Implementamos [solução] e em [prazo] ele viu [resultado]. Posso te conectar com ele se quiser.`
      },
      {
        name: 'Retomada Suave', brainTarget: dominantBrain, stimuliUsed: ['self_centered', 'emotional'], timing: 'Final',
        content: `Com essa informação em mente, ${firstName}, o que mais você precisaria saber para se sentir confortável em avançar?`
      }
    ]
  };
  return scripts[goal];
}
