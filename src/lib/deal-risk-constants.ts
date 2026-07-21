export const STAGE_BENCHMARK_DAYS: Record<string, number> = {
  lead: 7,
  primeiro_contato: 7,
  qualificacao: 14,
  proposta: 10,
  negociacao: 21,
  fechamento: 14,
};

export const DEAL_RISK_LOOKBACK_DAYS = 60;
export const DEAL_ENGAGEMENT_GAP_DAYS = 30;
export const DEAL_RISK_HIGH_THRESHOLD = 61;
export const DEAL_RISK_ATTENTION_THRESHOLD = 31;

export const sentimentValue = (s: string | null | undefined): number => {
  if (!s) return 0;
  const v = s.toLowerCase();
  if (v === 'positive' || v === 'positivo') return 1;
  if (v === 'negative' || v === 'negativo') return -1;
  return 0;
};

export const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

export type DealRiskLevel = 'healthy' | 'attention' | 'high';

export const levelFromScore = (score: number): DealRiskLevel =>
  score >= DEAL_RISK_HIGH_THRESHOLD ? 'high' : score >= DEAL_RISK_ATTENTION_THRESHOLD ? 'attention' : 'healthy';
