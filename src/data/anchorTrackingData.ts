export interface AnchorSuggestion {
  trigger: string;
  state: string;
  activate?: string;
  avoid?: string;
}

export const COMMON_POSITIVE_ANCHORS: AnchorSuggestion[] = [
  { trigger: 'Mencionar família', state: 'Orgulho/Amor', activate: 'Pergunte sobre os filhos/cônjuge' },
  { trigger: 'Falar de conquistas', state: 'Confiança', activate: 'Relembre sucessos passados' },
  { trigger: 'Elogios sinceros', state: 'Receptividade', activate: 'Reconheça algo específico' },
  { trigger: 'Usar o nome', state: 'Conexão', activate: 'Use o nome dele várias vezes' },
  { trigger: 'Humor leve', state: 'Relaxamento', activate: 'Faça uma piada leve' },
];

export const COMMON_NEGATIVE_ANCHORS: AnchorSuggestion[] = [
  { trigger: 'Pressão de tempo', state: 'Ansiedade', avoid: 'Não diga "precisa decidir agora"' },
  { trigger: 'Falar de concorrentes', state: 'Defensividade', avoid: 'Evite comparações diretas' },
  { trigger: 'Perguntas invasivas', state: 'Fechamento', avoid: 'Não force intimidade' },
  { trigger: 'Jargões técnicos', state: 'Confusão', avoid: 'Simplifique a linguagem' },
];
