/**
 * Avalia a "saúde" do conjunto de pesos do Score de Prontidão.
 * Função pura, sem dependências externas.
 */
import type { ProntidaoWeights } from '@/domain/leadScoring';

export type WeightsHealth = 'zero' | 'low' | 'ok';

export interface WeightsHealthInfo {
  status: WeightsHealth;
  total: number;
  /** Percentuais 0–100 que somam 100 (ou todos 0 quando total = 0). */
  normalized: Record<keyof ProntidaoWeights, number>;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function evaluateWeightsHealth(weights: ProntidaoWeights): WeightsHealthInfo {
  const total = weights.cadence + weights.recency + weights.sentiment + weights.channel;

  if (total === 0) {
    return {
      status: 'zero',
      total: 0,
      normalized: { cadence: 0, recency: 0, sentiment: 0, channel: 0 },
    };
  }

  const normalized: Record<keyof ProntidaoWeights, number> = {
    cadence: round1((weights.cadence / total) * 100),
    recency: round1((weights.recency / total) * 100),
    sentiment: round1((weights.sentiment / total) * 100),
    channel: round1((weights.channel / total) * 100),
  };

  return {
    status: total < 30 ? 'low' : 'ok',
    total,
    normalized,
  };
}
