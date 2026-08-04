import { DISCProfile } from '@/types';
import { VAKType } from '@/types/vak';

export const DISC_COMPATIBILITY: Record<DISCProfile, Record<DISCProfile, number>> = {
  D: { D: 60, I: 85, S: 50, C: 70 },
  I: { D: 85, I: 70, S: 80, C: 55 },
  S: { D: 50, I: 80, S: 75, C: 85 },
  C: { D: 70, I: 55, S: 85, C: 65 },
};

export const VAK_COMPATIBILITY: Record<VAKType, Record<VAKType, number>> = {
  V: { V: 100, A: 70, K: 60, D: 75 },
  A: { V: 70, A: 100, K: 65, D: 80 },
  K: { V: 60, A: 65, K: 100, D: 55 },
  D: { V: 75, A: 80, K: 55, D: 100 },
};

export function getDISCTip(seller: DISCProfile, client: DISCProfile): string {
  const tips: Record<string, string> = {
    'D-D': 'Dois Dominantes podem colidir. Seja direto mas deixe espaço para ele liderar.',
    'D-I': 'Excelente combinação! Você traz foco, ele traz energia. Mantenha o ritmo.',
    'D-S': 'Desacelere. Seu cliente precisa de segurança e tempo para decidir.',
    'D-C': 'Traga dados e detalhes. Ele precisa de precisão para confiar.',
    'I-D': 'Ótima energia! Seja mais objetivo e focado em resultados.',
    'I-I': 'Muita diversão, pouca execução. Mantenha o foco no objetivo.',
    'I-S': 'Boa sintonia! Não pressione demais, respeite o ritmo dele.',
    'I-C': 'Ele pode achar você "superficial". Traga mais fatos e detalhes.',
    'S-D': 'Desafio: ele é rápido, você é cauteloso. Prepare-se antecipadamente.',
    'S-I': 'Boa conexão emocional. Canalize a energia dele em ações.',
    'S-S': 'Conforto excessivo pode travar a venda. Dê um empurrão gentil.',
    'S-C': 'Sintonia natural. Ambos gostam de processo e segurança.',
    'C-D': 'Ele quer velocidade, você quer análise. Dê resumos executivos.',
    'C-I': 'Ele é emocional, você é lógico. Equilibre dados com entusiasmo.',
    'C-S': 'Vocês se entendem bem. Não deixe a venda arrastar demais.',
    'C-C': 'Análise paralisia! Estabeleça deadline para decisão.',
  };
  return tips[`${seller}-${client}`] || 'Adapte sua comunicação ao perfil do cliente.';
}
