export type StoredLeadGrade = 'cold' | 'warm' | 'hot' | 'on_fire';
export type DisplayLeadGrade = 'A' | 'B' | 'C' | 'D';

export function storedLeadGrade(grade: string): StoredLeadGrade {
  switch (grade) {
    case 'A': case 'on_fire': return 'on_fire';
    case 'B': case 'hot': return 'hot';
    case 'C': case 'warm': return 'warm';
    case 'D': case 'cold': return 'cold';
    default: throw new Error('Categoria de lead inválida');
  }
}

export function displayLeadGrade(grade: string): DisplayLeadGrade {
  switch (storedLeadGrade(grade)) {
    case 'on_fire': return 'A';
    case 'hot': return 'B';
    case 'warm': return 'C';
    case 'cold': return 'D';
  }
}

export function scorePayloads(input: {
  userId: string; contactId: string; dimensions: Record<string, number>;
  total: number; grade: string; previousScore: number; timestamp: string;
  signalsCount: number; interactionsCount: number;
}) {
  const integerScore = (score: number) => {
    if (!Number.isFinite(score)) throw new Error('Pontuação inválida');
    return Math.round(Math.min(100, Math.max(0, score)));
  };
  const total = integerScore(input.total);
  const dimensions = {
    fit_score: integerScore(input.dimensions.fit), engagement_score: integerScore(input.dimensions.engagement),
    intent_score: integerScore(input.dimensions.intent), relationship_score: integerScore(input.dimensions.relationship),
  };
  const factors = { dimensions: input.dimensions, signals_count: input.signalsCount, interactions_count: input.interactionsCount };
  const identity = { user_id: input.userId, contact_id: input.contactId };
  const grade = storedLeadGrade(input.grade);
  return {
    score: {
      ...identity, ...dimensions, total_score: total, grade, factors,
      previous_score: input.previousScore,
      calculated_at: input.timestamp, last_calculated_at: input.timestamp,
    },
    history: {
      ...identity, ...dimensions, company_id: null, total_score: total, grade, factors,
      recorded_at: input.timestamp,
    },
  };
}

type ScorePayload = ReturnType<typeof scorePayloads>;
export interface LeadScorePersistence {
  _user_id: string;
  _scores: ScorePayload['score'][];
  _history: ScorePayload['history'][];
  _queue_ids: string[];
}

interface LeadScoreWriter {
  rpc(name: 'persist_lead_score_results', params: LeadScorePersistence): PromiseLike<{ error: { message: string } | null }>;
}

export async function persistLeadScores(writer: LeadScoreWriter, payload: LeadScorePersistence) {
  const { error } = await writer.rpc('persist_lead_score_results', payload);
  if (error) throw new Error(`Falha ao persistir pontuação e histórico: ${error.message}`);
}
