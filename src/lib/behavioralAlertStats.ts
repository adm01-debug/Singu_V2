export interface AlertRowLike {
  is_simulated: boolean;
  severity: string;
  created_at: string;
  acknowledged_at: string | null;
}

export interface AlertStats {
  realTotal: number;
  realCritical: number;
  simulated: number;
  mttaMinutes: number | null;
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

  const mttaMs = acked.length
    ? acked.reduce((sum, r) => {
        const created = new Date(r.created_at).getTime();
        const ack = new Date(r.acknowledged_at as string).getTime();
        return sum + Math.max(0, ack - created);
      }, 0) / acked.length
    : null;

  return {
    realTotal: real.length,
    realCritical: real.filter((r) => r.severity === "critical").length,
    simulated: sim.length,
    mttaMinutes: mttaMs !== null ? Math.round(mttaMs / 60_000) : null,
  };
}

export function formatMtta(minutes: number | null): string {
  if (minutes === null) return "—";
  if (minutes < 1) return "<1 min";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  if (h < 24) return `${h}h ${minutes % 60}min`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}