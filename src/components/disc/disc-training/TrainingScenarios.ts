import type { DISCProfile } from '@/types';

export interface TrainingScenario {
  id: string;
  profile: Exclude<DISCProfile, null>;
  situation: string;
  clientStatement: string;
  options: { id: string; text: string; isCorrect: boolean; explanation: string; profileAlignment: number }[];
  learningPoint: string;
}

export interface TrainingProgress {
  scenariosCompleted: number;
  correctAnswers: number;
  profileMastery: Record<string, number>;
  streak: number;
}

export const TRAINING_SCENARIOS: TrainingScenario[] = [
  { id: '1', profile: 'D', situation: 'Apresentação de proposta para um CEO impaciente', clientStatement: '"Olha, não tenho muito tempo. O que você tem pra me mostrar?"',
    options: [
      { id: '1a', text: 'Vou direto ao ponto: nossa solução aumenta resultados em 40% em 3 meses.', isCorrect: true, explanation: 'Perfeito! Perfis D valorizam objetividade e resultados mensuráveis.', profileAlignment: 95 },
      { id: '1b', text: 'Deixa eu te contar uma história sobre como ajudamos outras empresas...', isCorrect: false, explanation: 'Perfis D não têm paciência para histórias longas. Seja direto!', profileAlignment: 20 },
      { id: '1c', text: 'Entendo sua pressa. Vamos revisar todos os detalhes com calma...', isCorrect: false, explanation: 'Contradiz a urgência do cliente D. Ele quer velocidade.', profileAlignment: 15 },
      { id: '1d', text: 'Que bom te conhecer! Vamos criar uma conexão primeiro.', isCorrect: false, explanation: 'Perfis D priorizam resultados sobre relacionamentos iniciais.', profileAlignment: 25 },
    ], learningPoint: 'Com perfis Dominantes, vá direto aos resultados e números.' },
  { id: '2', profile: 'I', situation: 'Reunião de follow-up com gerente de marketing entusiasta', clientStatement: '"Ei! Adorei nossa última conversa! Tenho tantas ideias!"',
    options: [
      { id: '2a', text: 'Vamos aos dados: aqui estão as métricas detalhadas...', isCorrect: false, explanation: 'Perfis I preferem entusiasmo a dados frios no início.', profileAlignment: 30 },
      { id: '2b', text: 'Que incrível! Estou animado também! Me conta suas ideias!', isCorrect: true, explanation: 'Excelente! Espelhar o entusiasmo cria rapport imediato com perfis I.', profileAlignment: 95 },
      { id: '2c', text: 'Ótimo. Vamos seguir o processo passo a passo.', isCorrect: false, explanation: 'Muito estruturado. Perfis I preferem flexibilidade e criatividade.', profileAlignment: 25 },
      { id: '2d', text: 'Entendo. Precisamos avaliar isso com cuidado.', isCorrect: false, explanation: 'Tom cauteloso não combina com a energia expansiva do I.', profileAlignment: 20 },
    ], learningPoint: 'Espelhe o entusiasmo e deixe o I compartilhar suas ideias.' },
  { id: '3', profile: 'S', situation: 'Negociação com cliente fiel há 5 anos que resiste a mudanças', clientStatement: '"Sempre funcionou assim. Por que mudar agora?"',
    options: [
      { id: '3a', text: 'Porque o mercado exige. Você precisa se atualizar ou vai ficar para trás!', isCorrect: false, explanation: 'Pressão e urgência assustam perfis S. Evite confronto.', profileAlignment: 10 },
      { id: '3b', text: 'Entendo sua preocupação. Vamos fazer a transição gradualmente, com todo suporte.', isCorrect: true, explanation: 'Perfeito! Perfis S valorizam segurança, suporte e mudanças graduais.', profileAlignment: 95 },
      { id: '3c', text: 'Os dados mostram claramente que a mudança é necessária.', isCorrect: false, explanation: 'Dados sozinhos não convencem S. Eles precisam sentir segurança.', profileAlignment: 40 },
      { id: '3d', text: 'Imagine as possibilidades incríveis! Vai ser revolucionário!', isCorrect: false, explanation: 'Revolucionário assusta S. Eles preferem evolução, não revolução.', profileAlignment: 25 },
    ], learningPoint: 'Perfis Estáveis precisam de transições graduais e garantias de suporte.' },
  { id: '4', profile: 'C', situation: 'Apresentação técnica para analista de sistemas detalhista', clientStatement: '"Preciso entender exatamente como isso funciona tecnicamente."',
    options: [
      { id: '4a', text: 'Confie em mim, funciona! Outros clientes amaram!', isCorrect: false, explanation: 'Perfis C não aceitam "confie em mim". Querem provas.', profileAlignment: 10 },
      { id: '4b', text: 'Aqui está a documentação técnica completa com especificações e benchmarks.', isCorrect: true, explanation: 'Excelente! Perfis C valorizam detalhes, documentação e precisão.', profileAlignment: 95 },
      { id: '4c', text: 'Vou te dar uma visão geral e depois entramos nos detalhes.', isCorrect: false, explanation: 'Ele já pediu detalhes. Dê o que ele pediu imediatamente.', profileAlignment: 50 },
      { id: '4d', text: 'O resultado é o que importa! Isso vai resolver seu problema!', isCorrect: false, explanation: 'Perfis C querem entender o COMO, não apenas o resultado.', profileAlignment: 30 },
    ], learningPoint: 'Perfis Conscientes precisam de dados, documentação e precisão técnica.' },
  { id: '5', profile: 'D', situation: 'Objeção de preço de um diretor assertivo', clientStatement: '"Isso está caro demais. Qual é o melhor desconto que você pode dar?"',
    options: [
      { id: '5a', text: 'Entendo. Vou verificar com meu gerente e te retorno...', isCorrect: false, explanation: 'Perfis D não respeitam quem não tem autoridade de decisão.', profileAlignment: 15 },
      { id: '5b', text: 'O investimento se paga em 60 dias. ROI de 300%. Fechamos agora?', isCorrect: true, explanation: 'Perfeito! Perfis D querem resultados, não descontos. Mostre valor.', profileAlignment: 95 },
      { id: '5c', text: 'Posso fazer 15% de desconto se você precisar...', isCorrect: false, explanation: 'Ceder rápido faz você parecer fraco para um D.', profileAlignment: 20 },
      { id: '5d', text: 'Vamos analisar juntos cada componente do investimento...', isCorrect: false, explanation: 'Muito lento. Perfis D querem decisão rápida.', profileAlignment: 35 },
    ], learningPoint: 'Para Dominantes, defenda valor com confiança. Não ceda facilmente.' },
  { id: '6', profile: 'I', situation: 'Cliente indeciso que adora conversar mas não fecha', clientStatement: '"Adoro conversar com você! Mas ainda não decidi..."',
    options: [
      { id: '6a', text: 'Imagine seu time comemorando os resultados! Vamos fazer isso acontecer juntos!', isCorrect: true, explanation: 'Perfeito! Perfis I são motivados por visões positivas e colaboração.', profileAlignment: 95 },
      { id: '6b', text: 'Vou te enviar uma análise detalhada para você revisar.', isCorrect: false, explanation: 'Perfis I não se motivam com análises. Querem emoção.', profileAlignment: 25 },
      { id: '6c', text: 'Precisamos definir isso hoje. Qual é sua decisão?', isCorrect: false, explanation: 'Pressão direta afasta perfis I. Eles precisam se sentir bem.', profileAlignment: 20 },
      { id: '6d', text: 'Ok, pense mais e me liga quando decidir.', isCorrect: false, explanation: 'Passivo demais. Você precisa guiar o I gentilmente.', profileAlignment: 15 },
    ], learningPoint: 'Perfis Influentes decidem por emoção. Crie visões positivas e entusiasmo.' },
];
