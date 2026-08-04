export interface EmotionalStateData {
  id: string;
  name: string;
  description: string;
  iconName: 'Sparkles' | 'Shield' | 'Clock' | 'Heart' | 'Target';
  color: string;
  useCase: string;
  scripts: {
    vak: Record<string, string[]>;
    disc: Record<string, string[]>;
  };
}

export const EMOTIONAL_STATES_DATA: EmotionalStateData[] = [
  {
    id: 'curiosity', name: 'Curiosidade', description: 'Estado de abertura e interesse em descobrir mais',
    iconName: 'Sparkles', color: 'text-secondary', useCase: 'No início da conversa ou para reengajar',
    scripts: {
      vak: {
        V: ['Você já imaginou como seria se...?', 'Deixa eu te mostrar algo que poucos viram...', 'Visualize por um momento o que isso poderia significar...'],
        A: ['Você já ouviu falar sobre...?', 'Isso vai soar interessante para você...', 'Deixa eu te contar algo que poucos sabem...'],
        K: ['Você já sentiu aquela sensação quando descobre algo novo?', 'Tenho algo que pode transformar sua experiência...', 'Sinta por um momento as possibilidades...'],
        D: ['Analisando os dados, descobri algo interessante...', 'Logicamente, isso faz muito sentido porque...', 'Considere esta informação exclusiva...'],
      },
      disc: {
        D: ['Tenho um insight rápido que pode mudar seu jogo...', 'Resultado surpreendente...'],
        I: ['Você não vai acreditar no que descobri!', 'Isso é revolucionário!'],
        S: ['Descobri algo que pode trazer mais tranquilidade...', 'Uma solução segura e comprovada...'],
        C: ['Os dados revelaram algo inesperado...', 'Análise detalhada mostra...'],
      },
    },
  },
  {
    id: 'confidence', name: 'Confiança', description: 'Estado de segurança e certeza na decisão',
    iconName: 'Shield', color: 'text-info', useCase: 'Antes de pedir compromisso ou fechamento',
    scripts: {
      vak: {
        V: ['Você pode ver claramente que este é o caminho certo...', 'Olhando para os resultados, fica evidente...', 'A imagem do sucesso está bem definida...'],
        A: ['Ouvindo outros clientes, você vai confirmar...', 'Isso ressoa com o que você busca...', 'A voz da experiência diz que...'],
        K: ['Você pode sentir que esta é a escolha certa...', 'Essa sensação de segurança vem quando...', 'Confie no que seu instinto está dizendo...'],
        D: ['Os dados confirmam que...', 'Logicamente, a conclusão é clara...', 'A análise demonstra que...'],
      },
      disc: {
        D: ['Você está no controle total desta decisão...', 'Resultados garantidos...'],
        I: ['Imagine o reconhecimento quando isso funcionar!', 'Todo mundo vai adorar!'],
        S: ['Milhares de clientes satisfeitos comprovam...', 'Segurança total garantida...'],
        C: ['Todos os dados apontam para...', 'Metodicamente comprovado...'],
      },
    },
  },
  {
    id: 'urgency', name: 'Urgência', description: 'Estado de motivação para agir agora',
    iconName: 'Clock', color: 'text-accent', useCase: 'Para acelerar decisões e evitar procrastinação',
    scripts: {
      vak: {
        V: ['Imagine onde você estará em 6 meses se começar hoje...', 'Veja a diferença entre agir agora e esperar...', 'O quadro muda rapidamente...'],
        A: ['Escute: cada dia que passa é uma oportunidade perdida...', 'O tempo está chamando você para agir...', 'Ouça o que o mercado está dizendo...'],
        K: ['Sinta a importância deste momento...', 'O peso da decisão pede ação...', 'Agarre esta oportunidade enquanto pode...'],
        D: ['Considere o custo da inação...', 'Os números mostram que o timing é agora...', 'Analise o custo de oportunidade...'],
      },
      disc: {
        D: ['Decisores agem rápido. O mercado não espera.', 'Resultados imediatos para quem age agora.'],
        I: ['Você vai ser o primeiro a ter isso!', 'Não perca essa oportunidade única!'],
        S: ['A janela de segurança está se fechando...', 'Garanta sua posição agora...'],
        C: ['Os dados indicam que este é o momento ideal...', 'Análise temporal mostra...'],
      },
    },
  },
  {
    id: 'desire', name: 'Desejo', description: 'Estado de querer intensamente algo',
    iconName: 'Heart', color: 'text-primary', useCase: 'Para amplificar a motivação e o comprometimento',
    scripts: {
      vak: {
        V: ['Imagine-se já tendo conquistado isso...', 'Veja você mesmo no cenário ideal...', 'Visualize a transformação...'],
        A: ['Ouça os parabéns quando você conseguir...', 'Como vai soar quando você contar para todos?', 'Escute a voz do sucesso...'],
        K: ['Sinta como será quando você tiver isso...', 'A sensação de realização é incrível...', 'Toque no seu objetivo...'],
        D: ['Considere todos os benefícios que você terá...', 'Pense no impacto positivo...', 'Analise as vantagens...'],
      },
      disc: {
        D: ['Domine seu mercado com isso.', 'Seja o líder que você quer ser.'],
        I: ['Imagine a admiração de todos!', 'Você vai brilhar!'],
        S: ['A paz de espírito que isso traz...', 'Estabilidade e harmonia...'],
        C: ['A excelência que você busca está aqui.', 'Qualidade comprovada.'],
      },
    },
  },
  {
    id: 'commitment', name: 'Comprometimento', description: 'Estado de determinação para seguir em frente',
    iconName: 'Target', color: 'text-success', useCase: 'No momento de fechamento e pós-venda',
    scripts: {
      vak: {
        V: ['Você já se vê usando isso no dia a dia...', 'O caminho à frente está claro...', 'Olhe para o futuro com confiança...'],
        A: ['Diga para si mesmo: eu mereço isso.', 'Ouça sua determinação crescendo...', 'Suas palavras definem seu sucesso...'],
        K: ['Sinta a determinação no seu corpo...', 'Agarre essa oportunidade com as duas mãos...', 'A força da decisão está em você...'],
        D: ['A lógica é clara: este é o passo certo.', 'Racionalmente, faz todo sentido.', 'Os fundamentos estão sólidos.'],
      },
      disc: {
        D: ['Hora de agir. Vamos fechar.', 'Decisão tomada, resultados a caminho.'],
        I: ['Vai ser incrível! Estou junto com você!', 'Vamos celebrar essa decisão!'],
        S: ['Estou aqui para garantir que dê certo.', 'Passo a passo, juntos.'],
        C: ['Todos os pontos foram verificados.', 'Processo validado, hora de executar.'],
      },
    },
  },
];
