import type { ProximoPasso, ProximoPassoPriority, ProximoPassoChannel } from '@/domain/nextStepLogic';
import type { NbaPriority, NbaSort } from '@/hooks/useProximosPassosFilters';
import type { PassoFeedback } from '@/hooks/useProximoPassoFeedback';

const PRIORITY_RANK: Record<ProximoPassoPriority, number> = {
  alta: 3,
  media: 2,
  baixa: 1,
};

const PRIORITY_SCORE: Record<ProximoPassoPriority, number> = {
  alta: 60,
  media: 35,
  baixa: 15,
};

const OUTCOME_PENALTY: Record<string, number> = {
  respondeu_positivo: 5,
  respondeu_neutro: 0,
  nao_respondeu: -10,
  nao_atendeu: -10,
  pulou: -5,
};

interface RecommendationContext {
  preferredChannel?: string | null;
  feedbacks?: PassoFeedback[] | null;
}

interface FilterOpts extends RecommendationContext {
  priorities: NbaPriority[];
  channels: string[];
  sort: NbaSort;
}

function normalizeChannel(ch?: string | null): string | null {
  const v = (ch || '').toLowerCase().trim();
  if (!v) return null;
  if (v.startsWith('whats')) return 'whatsapp';
  if (v.startsWith('mail') || v.includes('email')) return 'email';
  if (v.startsWith('lig') || v.startsWith('call') || v.startsWith('phone')) return 'call';
  if (v.startsWith('reun') || v.startsWith('meet')) return 'meeting';
  if (v.startsWith('linke')) return 'linkedin';
  return v;
}

/**
 * Score de recomendação de um passo (0-100, aproximado):
 * - Prioridade (alta/media/baixa) — base do score.
 * - +20 se o canal do passo bate com o canal preferido do contato (intelligence).
 * - Ajuste pelo último outcome registrado para o passo (positivo soma, negativo subtrai).
 */
export function scorePasso(
  passo: ProximoPasso,
  ctx: RecommendationContext = {},
): number {
  let score = PRIORITY_SCORE[passo.priority] ?? 0;

  const preferred = normalizeChannel(ctx.preferredChannel);
  if (preferred && preferred === passo.channel) {
    score += 20;
  }

  if (Array.isArray(ctx.feedbacks) && ctx.feedbacks.length > 0) {
    // Pega o feedback mais recente cujo passo_id começa com este id
    const matching = ctx.feedbacks
      .filter((f) => f.passo_id === passo.id || f.passo_id?.startsWith(`${passo.id}:`))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const last = matching[0];
    if (last?.outcome) {
      score += OUTCOME_PENALTY[last.outcome] ?? 0;
    }
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Filtra e reordena a lista de próximos passos.
 * - `sugerido` preserva a ordem original (vinda de `computeProximosPassos`).
 * - `recomendacao` ordena por score (prioridade + canal preferido − histórico negativo).
 * - `prioridade`: alta → baixa (estável).
 * - `canal`: alfabético por canal (estável dentro do canal).
 */
export function filterAndSortPassos(
  passos: ProximoPasso[],
  { priorities, channels, sort, preferredChannel, feedbacks }: FilterOpts,
): ProximoPasso[] {
  const filtered = passos.filter((p) => {
    if (priorities.length > 0 && !priorities.includes(p.priority as NbaPriority)) return false;
    if (channels.length > 0 && !channels.includes(p.channel)) return false;
    return true;
  });

  if (sort === 'sugerido') return filtered;

  const decorated = filtered.map((p, idx) => ({ p, idx }));

  if (sort === 'recomendacao') {
    decorated.sort((a, b) => {
      const sa = scorePasso(a.p, { preferredChannel, feedbacks });
      const sb = scorePasso(b.p, { preferredChannel, feedbacks });
      const diff = sb - sa;
      return diff !== 0 ? diff : a.idx - b.idx;
    });
  } else if (sort === 'prioridade') {
    decorated.sort((a, b) => {
      const diff = (PRIORITY_RANK[b.p.priority] ?? 0) - (PRIORITY_RANK[a.p.priority] ?? 0);
      return diff !== 0 ? diff : a.idx - b.idx;
    });
  } else if (sort === 'canal') {
    decorated.sort((a, b) => {
      const diff = a.p.channel.localeCompare(b.p.channel);
      return diff !== 0 ? diff : a.idx - b.idx;
    });
  }

  return decorated.map((d) => d.p);
}

export type { ProximoPassoChannel };
