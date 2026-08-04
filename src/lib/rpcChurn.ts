/**
 * Rodada 71/10 — utilitários puros do painel de churn de plano de execução.
 * Mantidos fora do componente para permitir cobertura por testes unitários.
 */

/** Janelas suportadas pela timeline de churn (em horas). */
export const CHURN_WINDOW_VALUES = ['6', '24', '168'] as const;
export type ChurnWindow = (typeof CHURN_WINDOW_VALUES)[number];

export const DEFAULT_CHURN_WINDOW: ChurnWindow = '24';

/**
 * Normaliza o parâmetro de janela vindo da URL (não confiável).
 * Qualquer valor ausente, malformado ou fora da allowlist cai no default.
 */
export function parseChurnWindow(raw: string | null | undefined): ChurnWindow {
  if (!raw) return DEFAULT_CHURN_WINDOW;
  return (CHURN_WINDOW_VALUES as readonly string[]).includes(raw)
    ? (raw as ChurnWindow)
    : DEFAULT_CHURN_WINDOW;
}

export interface ChurnCsvRow {
  rpc_name: string;
  changes: number;
  last_change: string;
  p95Ms: number | null;
}

/** Escapa um campo CSV conforme RFC 4180 (aspas duplicadas + envelopamento). */
function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/** Serializa as linhas de churn em CSV com cabeçalho em português. */
export function churnToCsv(rows: readonly ChurnCsvRow[]): string {
  const header = ['rpc', 'trocas', 'ultima_troca', 'p95_24h_ms'].join(',');
  const body = (Array.isArray(rows) ? rows : []).map((r) =>
    [
      csvCell(String(r.rpc_name ?? '')),
      csvCell(String(Number.isFinite(r.changes) ? r.changes : 0)),
      csvCell(String(r.last_change ?? '')),
      csvCell(r.p95Ms === null || r.p95Ms === undefined ? '' : String(Math.round(r.p95Ms))),
    ].join(','),
  );
  return [header, ...body].join('\n');
}
