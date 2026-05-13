/**
 * Score de Prontidão (0–100) — calcula o quão "pronto" um contato está
 * para uma próxima abordagem comercial agora.
 *
 * Função pura, sem side effects, 100% testável.
 */

export type ProntidaoStatus = 'good' | 'warn' | 'bad' | 'unknown';
export type ProntidaoLevel = 'frio' | 'morno' | 'quente' | 'pronto';

export interface ProntidaoFactor {
  score: number; // 0-100
  weight: number;
  label: string;
  detail: string;
  status: ProntidaoStatus;
}

export interface ProntidaoBreakdown {
  cadence: ProntidaoFactor;
  recency: ProntidaoFactor;
  sentiment: ProntidaoFactor;
  channel: ProntidaoFactor;
}

export interface ProntidaoResult {
  score: number;
  level: ProntidaoLevel;
  levelLabel: string;
  breakdown: ProntidaoBreakdown;
  recommendation: string;
  nextActionHint: string;
  weakestFactor: keyof ProntidaoBreakdown;
}

interface ProfileLike {
  cadence_days?: number | null;
  last_contact_at?: string | null;
  sentiment?: string | null;
}

interface IntelligenceLike {
  sentiment?: string | null;
  best_channel?: string | null;
  best_time?: string | null;
}

export interface ProntidaoWeights {
  cadence: number;
  recency: number;
  sentiment: number;
  channel: number;
}

export const DEFAULT_PRONTIDAO_WEIGHTS: ProntidaoWeights = {
  cadence: 30,
  recency: 30,
  sentiment: 25,
  channel: 15,
};

interface ComputeInput {
  profile: ProfileLike | null | undefined;
  intelligence: IntelligenceLike | null | undefined;
  weights?: ProntidaoWeights;
}

function daysSince(iso?: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / 86400000));
}

function scoreCadence(cadence: number | null | undefined, lastDays: number | null, weight: number): ProntidaoFactor {
  if (cadence == null || lastDays == null) {
    return {
      score: 50, weight, label: 'Cadência', status: 'unknown',
      detail: 'Cadência não definida',
    };
  }
  const ratio = lastDays / Math.max(1, cadence);
  let score = 10;
  let status: ProntidaoStatus = 'bad';
  let detail = `Atrasado (${lastDays}d / cadência ${cadence}d)`;
  if (ratio <= 1.0) { score = 100; status = 'good'; detail = `Em dia (${lastDays}d / ${cadence}d)`; }
  else if (ratio <= 1.5) { score = 60; status = 'warn'; detail = `Próximo do limite (${lastDays}d / ${cadence}d)`; }
  else if (ratio <= 2.0) { score = 30; status = 'bad'; detail = `Atrasado (${lastDays}d / ${cadence}d)`; }
  return { score, weight, label: 'Cadência', status, detail };
}

function scoreRecency(lastDays: number | null, weight: number): ProntidaoFactor {
  if (lastDays == null) {
    return { score: 30, weight, label: 'Recência', status: 'unknown', detail: 'Sem registro de contato' };
  }
  let score = 5; let status: ProntidaoStatus = 'bad'; let detail = `Há ${lastDays} dias`;
  if (lastDays <= 3) { score = 100; status = 'good'; }
  else if (lastDays <= 7) { score = 80; status = 'good'; }
  else if (lastDays <= 14) { score = 60; status = 'warn'; }
  else if (lastDays <= 30) { score = 40; status = 'warn'; }
  else if (lastDays <= 60) { score = 20; status = 'bad'; }
  return { score, weight, label: 'Recência', status, detail };
}

function scoreSentiment(sentiment: string | null | undefined, weight: number): ProntidaoFactor {
  const v = (sentiment || '').toLowerCase();
  if (!v) return { score: 50, weight, label: 'Sentimento', status: 'unknown', detail: 'Sem dados' };
  if (v.includes('pos')) return { score: 100, weight, label: 'Sentimento', status: 'good', detail: 'Positivo' };
  if (v.includes('neg')) return { score: 20, weight, label: 'Sentimento', status: 'bad', detail: 'Negativo' };
  if (v.includes('mix')) return { score: 50, weight, label: 'Sentimento', status: 'warn', detail: 'Misto' };
  return { score: 60, weight, label: 'Sentimento', status: 'warn', detail: 'Neutro' };
}

function scoreChannel(channel: string | null | undefined, time: string | null | undefined, weight: number): ProntidaoFactor {
  const hasCh = !!(channel && channel.trim());
  const hasTime = !!(time && time.trim());
  if (hasCh && hasTime) return { score: 100, weight, label: 'Canal preferido', status: 'good', detail: `${channel} · ${time}` };
  if (hasCh) return { score: 60, weight, label: 'Canal preferido', status: 'warn', detail: `${channel} (sem horário)` };
  if (hasTime) return { score: 60, weight, label: 'Canal preferido', status: 'warn', detail: `Horário: ${time}` };
  return { score: 30, weight, label: 'Canal preferido', status: 'unknown', detail: 'Não definido' };
}

function levelFromScore(score: number): { level: ProntidaoLevel; label: string } {
  if (score >= 75) return { level: 'pronto', label: 'Pronto para abordar' };
  if (score >= 55) return { level: 'quente', label: 'Quente' };
  if (score >= 35) return { level: 'morno', label: 'Morno' };
  return { level: 'frio', label: 'Frio' };
}

function buildRecommendation(
  level: ProntidaoLevel,
  weakest: keyof ProntidaoBreakdown,
  breakdown: ProntidaoBreakdown,
  intel: IntelligenceLike | null | undefined,
): { recommendation: string; nextActionHint: string } {
  const ch = intel?.best_channel?.trim();
  const time = intel?.best_time?.trim();
  const channelHint = ch ? `via ${ch}` : 'pelo canal habitual';
  const timeHint = time ? ` ${time.toLowerCase()}` : '';

  let nextActionHint = `Contatar${timeHint} ${channelHint}`.trim();
  let recommendation = '';

  if (level === 'pronto') {
    recommendation = `Contato pronto para avançar. Aproveite o momentum: agende a próxima etapa ${channelHint}${timeHint ? ` (${time})` : ''}.`;
    nextActionHint = `Agendar próxima reunião ${channelHint}`;
  } else if (level === 'quente') {
    recommendation = `Contato quente. Mantenha o ritmo com uma mensagem de acompanhamento ${channelHint}${timeHint ? ` (${time})` : ''}.`;
  } else if (weakest === 'cadence') {
    recommendation = `${breakdown.cadence.detail}. Reabra a conversa ${channelHint}${timeHint ? ` (${time})` : ''}, recapitulando o último ponto discutido.`;
    nextActionHint = `Reabrir conversa ${channelHint}`;
  } else if (weakest === 'recency') {
    recommendation = `${breakdown.recency.detail} sem contato. Envie uma mensagem leve de check-in ${channelHint}${timeHint ? ` (${time})` : ''} para reaquecer.`;
    nextActionHint = `Check-in ${channelHint}`;
  } else if (weakest === 'sentiment') {
    recommendation = `Sentimento ${breakdown.sentiment.detail.toLowerCase()}. Aborde com escuta ativa ${channelHint}, valide preocupações antes de avançar.`;
    nextActionHint = `Conversa de alinhamento ${channelHint}`;
  } else if (weakest === 'channel') {
    recommendation = `Canal preferido não mapeado. Teste WhatsApp para descobrir o canal de melhor resposta e atualize o perfil.`;
    nextActionHint = 'Mapear canal preferido';
  } else {
    recommendation = `Contato frio. Inicie uma reaproximação suave ${channelHint} antes de qualquer pedido.`;
  }

  return { recommendation, nextActionHint };
}

export function computeProntidaoScore({ profile, intelligence, weights }: ComputeInput): ProntidaoResult {
  const w0 = weights ?? DEFAULT_PRONTIDAO_WEIGHTS;
  const sum = w0.cadence + w0.recency + w0.sentiment + w0.channel;
  const w: ProntidaoWeights = sum > 0 ? w0 : DEFAULT_PRONTIDAO_WEIGHTS;

  const lastDays = daysSince(profile?.last_contact_at);
  const breakdown: ProntidaoBreakdown = {
    cadence: scoreCadence(profile?.cadence_days, lastDays, w.cadence),
    recency: scoreRecency(lastDays, w.recency),
    sentiment: scoreSentiment(profile?.sentiment ?? intelligence?.sentiment, w.sentiment),
    channel: scoreChannel(intelligence?.best_channel, intelligence?.best_time, w.channel),
  };

  const totalWeight = breakdown.cadence.weight + breakdown.recency.weight + breakdown.sentiment.weight + breakdown.channel.weight;
  const weighted =
    breakdown.cadence.score * breakdown.cadence.weight +
    breakdown.recency.score * breakdown.recency.weight +
    breakdown.sentiment.score * breakdown.sentiment.weight +
    breakdown.channel.score * breakdown.channel.weight;
  const score = Math.round(weighted / totalWeight);

  const { level, label: levelLabel } = levelFromScore(score);

  // fator mais fraco (menor score ponderado pela importância)
  const factors: Array<[keyof ProntidaoBreakdown, number]> = [
    ['cadence', breakdown.cadence.score * breakdown.cadence.weight],
    ['recency', breakdown.recency.score * breakdown.recency.weight],
    ['sentiment', breakdown.sentiment.score * breakdown.sentiment.weight],
    ['channel', breakdown.channel.score * breakdown.channel.weight],
  ];
  const weakestFactor = factors.sort((a, b) => a[1] - b[1])[0][0];

  const { recommendation, nextActionHint } = buildRecommendation(level, weakestFactor, breakdown, intelligence);

  return { score, level, levelLabel, breakdown, recommendation, nextActionHint, weakestFactor };
}
