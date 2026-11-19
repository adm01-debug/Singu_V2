// Revisor de mensagem pelos principios de Carnegie.
//
// Junta os nove detectores de texto de `src/data/carnegie*` (critica, ordens,
// empatia, encorajamento, interesse genuino, autoria, narrativa, escada do sim
// e desejos) em um unico laudo. Funcao pura: recebe o texto e devolve so o que
// foi encontrado nele. Onde o detector parte de uma base neutra e nao acha
// nenhum sinal, a nota vai como `null` ("sem sinais no texto") em vez de 50.

import type { CriticalPhrase, QuestionInfluence } from '@/types/carnegie-extended';
import {
  detectCriticalLanguage,
  calculateCriticismScore,
  getCriticismTone,
  rewriteWithoutCriticism,
} from '@/data/carnegieCriticismDetector';
import { analyzeQuestionInfluence, countQuestionsVsOrders, suggestQuestions } from '@/data/carnegieQuestionInfluence';
import { analyzeEmpathyInText, EMPATHY_DETECTION } from '@/data/carnegieEmpathyTemplates';
import {
  calculateEncouragementScore,
  detectDiscouragement,
  generateEncouragementScript,
} from '@/data/carnegieEncouragement';
import {
  countInterestIndicators,
  calculateInterestScore,
  getInterestLevel,
  getInterestSuggestions,
} from '@/data/carnegieGenuineInterest';
import { analyzeOwnershipLanguage } from '@/data/carnegieOwnershipTransfer';
import { analyzeStorytellingInText } from '@/data/carnegieStorytelling';
import { countYesOpportunities, suggestYesQuestions } from '@/data/carnegieYesLadder';
import { detectEagerWants, getEagerWantByCategory } from '@/data/carnegieEagerWant';

export type PerfilDisc = 'D' | 'I' | 'S' | 'C';

const BASE_NEUTRA = 50;

const ELEMENTOS_NARRATIVA: Record<string, string> = {
  Hook: 'Gancho de abertura',
  Transition: 'Transição',
  'Emotional Language': 'Linguagem emocional',
  'Sensory Details': 'Detalhes sensoriais',
};

export interface RevisaoMensagem {
  critica: {
    nota: number;
    tom: ReturnType<typeof getCriticismTone>;
    frases: CriticalPhrase[];
    /** Texto com as trocas sugeridas; `null` quando nada mudaria. */
    reescrita: string | null;
  };
  ordens: {
    encontradas: string[];
    perguntas: number;
    alternativas: QuestionInfluence[];
    /** Perguntas no estilo do perfil DISC; vazio quando o perfil nao e conhecido. */
    sugestoesPorPerfil: string[];
  };
  empatia: { nota: number | null; frases: string[]; oportunidades: string[] };
  encorajamento: { nota: number | null; desanimo: string[]; roteiro: string | null };
  interesse: {
    nota: number;
    nivel: ReturnType<typeof getInterestLevel>;
    indicadores: number;
    contagens: Record<string, number>;
    sugestoes: string[];
  };
  autoria: { deuAutoria: boolean; frasesProblematicas: string[]; sugestoes: string[] };
  narrativa: { usa: boolean; elementos: string[]; nota: number };
  escadaDoSim: { oportunidades: number; perguntas: string[] };
  desejos: { categoria: string; nome: string; descricao: string; tecnica: string | null; exemplo: string | null }[];
  /** Quantos pontos de atencao a mensagem tem (frases criticas, ordens, desanimo, autoria). */
  pontosDeAtencao: number;
}

export function revisarMensagemCarnegie(texto: string, disc: PerfilDisc | null = null): RevisaoMensagem | null {
  const mensagem = texto.trim();
  if (!mensagem) return null;

  const frasesCriticas = detectCriticalLanguage(mensagem);
  const notaCritica = calculateCriticismScore(mensagem);
  const reescrita = rewriteWithoutCriticism(mensagem);

  const influencia = analyzeQuestionInfluence(mensagem);
  const { questions: perguntas } = countQuestionsVsOrders(mensagem);

  const empatia = analyzeEmpathyInText(mensagem);
  const temSinalNegativoDeEmpatia = EMPATHY_DETECTION.negative.some(padrao => padrao.test(mensagem));
  const temSinalDeEmpatia = empatia.empathyStatements.length > 0 || temSinalNegativoDeEmpatia;

  const desanimo = detectDiscouragement(mensagem);
  const notaEncorajamento = calculateEncouragementScore(mensagem);
  const temSinalDeEncorajamento = desanimo.length > 0 || notaEncorajamento !== BASE_NEUTRA;

  const contagens = countInterestIndicators(mensagem);
  const notaInteresse = calculateInterestScore(contagens);
  const nivelInteresse = getInterestLevel(notaInteresse);

  const autoria = analyzeOwnershipLanguage(mensagem);
  const narrativa = analyzeStorytellingInText(mensagem);
  const oportunidadesDeSim = countYesOpportunities(mensagem);

  const desejos = detectEagerWants(mensagem).flatMap(categoria => {
    const desejo = getEagerWantByCategory(categoria);
    if (!desejo) return [];
    const tecnica = desejo.arousalTechniques[0];
    return [{
      categoria,
      nome: desejo.name,
      descricao: desejo.description,
      tecnica: tecnica?.technique ?? null,
      exemplo: tecnica?.example ?? null,
    }];
  });

  return {
    critica: {
      nota: notaCritica,
      tom: getCriticismTone(notaCritica),
      frases: frasesCriticas,
      reescrita: reescrita !== mensagem ? reescrita : null,
    },
    ordens: {
      encontradas: influencia.ordersFound,
      perguntas,
      alternativas: influencia.suggestedAlternatives,
      sugestoesPorPerfil: disc && influencia.ordersFound.length > 0 ? suggestQuestions(mensagem, disc) : [],
    },
    empatia: {
      nota: temSinalDeEmpatia ? empatia.empathyScore : null,
      frases: empatia.empathyStatements,
      oportunidades: empatia.missedMoments,
    },
    encorajamento: {
      nota: temSinalDeEncorajamento ? notaEncorajamento : null,
      desanimo,
      roteiro: disc && desanimo.length > 0 ? generateEncouragementScript(disc, mensagem) || null : null,
    },
    interesse: {
      nota: notaInteresse,
      nivel: nivelInteresse,
      indicadores: Object.values(contagens).reduce((soma, n) => soma + n, 0),
      contagens,
      sugestoes: getInterestSuggestions(nivelInteresse),
    },
    autoria: {
      deuAutoria: autoria.ownershipGiven,
      frasesProblematicas: autoria.problematicPhrases,
      sugestoes: autoria.suggestions,
    },
    narrativa: {
      usa: narrativa.usesStorytelling,
      elementos: narrativa.elements.map(elemento => ELEMENTOS_NARRATIVA[elemento] ?? elemento),
      nota: narrativa.score,
    },
    escadaDoSim: {
      oportunidades: oportunidadesDeSim,
      perguntas: oportunidadesDeSim > 0 ? suggestYesQuestions(mensagem.toLowerCase()) : [],
    },
    desejos,
    pontosDeAtencao:
      frasesCriticas.length + influencia.ordersFound.length + desanimo.length + autoria.problematicPhrases.length,
  };
}
