export interface AlertRowLike {
  is_simulated: boolean;
  severity: string;
  created_at: string;
  acknowledged_at: string | null;
}

export interface AlertStats {
  realTotal: number;
  realCritical: number;
  realWarning: number;
  simulated: number;
  mttaMinutes: number | null;
  mttaP95Minutes: number | null;
  mttaCriticalMinutes: number | null;
  mttaWarningMinutes: number | null;
}

/**
 * Agrega estatísticas de alertas comportamentais para o painel admin.
 *
 * - `realTotal`: alertas não simulados.
 * - `realCritical`: subset críticos.
 * - `simulated`: alertas marcados como simulação.
 * - `mttaMinutes`: tempo médio (min) entre criação e ack de alertas reais
 *   que foram reconhecidos. `null` quando nenhum foi reconhecido.
 */
export function computeAlertStats(rows: readonly AlertRowLike[]): AlertStats {
  const real = rows.filter((r) => !r.is_simulated);
  const sim = rows.filter((r) => r.is_simulated);
  const acked = real.filter((r) => r.acknowledged_at);

  const ackDeltasMs = acked.map((r) => {
    const created = new Date(r.created_at).getTime();
    const ack = new Date(r.acknowledged_at as string).getTime();
    return Math.max(0, ack - created);
  });

  const mttaMs = ackDeltasMs.length
    ? ackDeltasMs.reduce((s, v) => s + v, 0) / ackDeltasMs.length
    : null;

  const p95Ms = percentile(ackDeltasMs, 0.95);
  const realCritical = real.filter((r) => r.severity === "critical").length;

  const meanBySeverity = (sev: string): number | null => {
    const deltas = acked
      .filter((r) => r.severity === sev)
      .map((r) => {
        const created = new Date(r.created_at).getTime();
        const ack = new Date(r.acknowledged_at as string).getTime();
        return Math.max(0, ack - created);
      });
    if (!deltas.length) return null;
    return deltas.reduce((s, v) => s + v, 0) / deltas.length;
  };
  const mttaCriticalMs = meanBySeverity("critical");
  const mttaWarningMs = meanBySeverity("warning");

  return {
    realTotal: real.length,
    realCritical,
    realWarning: real.length - realCritical,
    simulated: sim.length,
    mttaMinutes: mttaMs !== null ? Math.round(mttaMs / 60_000) : null,
    mttaP95Minutes: p95Ms !== null ? Math.round(p95Ms / 60_000) : null,
    mttaCriticalMinutes: mttaCriticalMs !== null ? Math.round(mttaCriticalMs / 60_000) : null,
    mttaWarningMinutes: mttaWarningMs !== null ? Math.round(mttaWarningMs / 60_000) : null,
  };
}

/**
 * Percentil por interpolação linear (nearest-rank). Retorna null para lista vazia.
 * Usado para MTTA p95 — detecta caudas longas de reconhecimento.
 */
function percentile(values: readonly number[], p: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 1) return sorted[0];
  const rank = p * (sorted.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (rank - lo);
}

export function formatMtta(minutes: number | null): string {
  if (minutes === null) return "—";
  if (minutes < 1) return "<1 min";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  if (h < 24) return `${h}h ${minutes % 60}min`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}