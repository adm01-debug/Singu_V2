import { DISCProfile } from '@/types';

export interface DISCTemplate {
  id: string;
  category: string;
  context: string;
  template: string;
  discProfiles: Exclude<DISCProfile, null>[];
  channel: 'call' | 'email' | 'whatsapp' | 'meeting' | 'all';
  effectiveness: number;
}

export const DISC_TEMPLATES: DISCTemplate[] = [
  // Dominance (D) Templates
  { id: 'd-1', category: 'Abertura', context: 'Primeira ligação', template: 'Vou direto ao ponto: tenho uma solução que pode aumentar seus resultados em X%. Posso te mostrar em 3 minutos?', discProfiles: ['D'], channel: 'call', effectiveness: 95 },
  { id: 'd-2', category: 'Fechamento', context: 'Proposta final', template: 'Baseado nos números que te mostrei, faz sentido fechar agora. Qual forma de pagamento prefere?', discProfiles: ['D'], channel: 'all', effectiveness: 90 },
  { id: 'd-3', category: 'Objeção Preço', context: 'Cliente reclama do preço', template: 'O investimento se paga em X dias. ROI de Y%. Isso é resultado, não custo.', discProfiles: ['D'], channel: 'all', effectiveness: 88 },
  { id: 'd-4', category: 'Email', context: 'Follow-up após reunião', template: 'Assunto: Próximos passos - ROI de X%\n\n[Nome], resumindo: [RESULTADO]. Preciso da sua decisão até [DATA]. Fechamos?', discProfiles: ['D'], channel: 'email', effectiveness: 85 },
  // Influence (I) Templates
  { id: 'i-1', category: 'Abertura', context: 'Primeira ligação', template: 'Oi [Nome]! Que bom finalmente falar com você! Estou super empolgado para te contar sobre algo incrível que está ajudando pessoas como você!', discProfiles: ['I'], channel: 'call', effectiveness: 95 },
  { id: 'i-2', category: 'Fechamento', context: 'Proposta final', template: 'Imagina seu time comemorando quando vocês alcançarem [RESULTADO]! Vamos fazer isso acontecer juntos?', discProfiles: ['I'], channel: 'all', effectiveness: 92 },
  { id: 'i-3', category: 'Indicação', context: 'Pedir referências', template: 'Você é incrível! Quem mais do seu círculo poderia se beneficiar disso? Adoraria ajudar seus amigos também!', discProfiles: ['I'], channel: 'all', effectiveness: 90 },
  { id: 'i-4', category: 'WhatsApp', context: 'Manter relacionamento', template: 'Ei [Nome]! 🌟 Vi [NOTÍCIA/POST] e lembrei de você! Como estão as coisas? Tenho uma novidade que acho que você vai ADORAR!', discProfiles: ['I'], channel: 'whatsapp', effectiveness: 88 },
  // Steadiness (S) Templates
  { id: 's-1', category: 'Abertura', context: 'Primeira ligação', template: 'Olá [Nome], espero que esteja tendo um dia tranquilo. Quero que se sinta à vontade. Posso te explicar com calma como posso te ajudar?', discProfiles: ['S'], channel: 'call', effectiveness: 95 },
  { id: 's-2', category: 'Fechamento', context: 'Proposta final', template: 'Vou te dar todo o suporte que precisar. Podemos começar devagar e ajustar conforme você se sentir confortável. O que acha?', discProfiles: ['S'], channel: 'all', effectiveness: 92 },
  { id: 's-3', category: 'Objeção Mudança', context: 'Cliente resiste a mudanças', template: 'Entendo completamente. A transição será gradual, com treinamento completo e suporte 24h. Você não vai ficar sozinho nisso.', discProfiles: ['S'], channel: 'all', effectiveness: 90 },
  { id: 's-4', category: 'Email', context: 'Follow-up cuidadoso', template: 'Assunto: Estou aqui para ajudar\n\nOlá [Nome],\n\nEspero que esteja bem. Estou à disposição para qualquer dúvida. Sem pressa - podemos conversar quando você se sentir pronto.\n\nUm abraço', discProfiles: ['S'], channel: 'email', effectiveness: 88 },
  // Conscientiousness (C) Templates
  { id: 'c-1', category: 'Abertura', context: 'Primeira ligação', template: 'Bom dia [Nome]. Preparei uma análise detalhada com dados específicos para sua situação. Posso compartilhar os números?', discProfiles: ['C'], channel: 'call', effectiveness: 95 },
  { id: 'c-2', category: 'Fechamento', context: 'Proposta final', template: 'Aqui está a planilha comparativa com todos os cenários: [A], [B] e [C]. Os dados apontam para a opção [X]. Quando podemos iniciar?', discProfiles: ['C'], channel: 'all', effectiveness: 90 },
  { id: 'c-3', category: 'Objeção Dados', context: 'Cliente quer mais informações', template: 'Excelente pergunta. Preparei um relatório com benchmarks do seu setor. Posso enviar agora e agendamos uma análise conjunta?', discProfiles: ['C'], channel: 'all', effectiveness: 92 },
  { id: 'c-4', category: 'Email', context: 'Proposta técnica', template: 'Assunto: Análise Comparativa - [Sua Empresa]\n\n[Nome],\n\nSegue a análise solicitada com:\n- Metodologia utilizada\n- Dados comparativos\n- ROI projetado\n- Cronograma detalhado\n\nAguardo sua avaliação.', discProfiles: ['C'], channel: 'email', effectiveness: 88 },
  // Multi-profile Templates
  { id: 'm-1', category: 'Rapport', context: 'Qualquer perfil', template: 'Como posso te ajudar hoje? Quero entender sua situação para oferecer a melhor solução possível.', discProfiles: ['D', 'I', 'S', 'C'], channel: 'all', effectiveness: 80 },
  { id: 'm-2', category: 'Follow-up', context: 'Qualquer perfil', template: '[Nome], estava revisando nosso último contato e queria saber: teve alguma dúvida sobre o que conversamos?', discProfiles: ['D', 'I', 'S', 'C'], channel: 'all', effectiveness: 82 },
  { id: 'm-3', category: 'Reativação', context: 'Qualquer perfil', template: '[Nome], faz um tempo que não conversamos. Temos novidades que podem fazer diferença para você. Posso te atualizar?', discProfiles: ['D', 'I', 'S', 'C'], channel: 'all', effectiveness: 78 },
];
