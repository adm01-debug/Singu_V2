// Utilitários de normalização e ordenação de semanas usados pelo
// SentimentTrendChart. Extraídos para um módulo isolado para permitir
// testes unitários e reuso por outros charts/insights.

export const ISO_WEEK_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Canonicaliza uma string de semana para o formato 'YYYY-MM-DD'.
 * Aceita inputs como '2025-04-07', '2025-04-07T00:00:00', '2025-04-07Z',
 * '2025-04-07T03:00:00.000Z' etc. Mantém o input cru se for muito curto
 * para canonicalizar.
 */
export function normalizeWeek(w: string): string {
  if (typeof w !== "string" || w.length === 0) return w;
  return w.length >= 10 ? w.slice(0, 10) : w;
}

/**
 * Faz parse de uma semana em fuso local — evita o shift de -1 dia que
 * `new Date('YYYY-MM-DD')` produz em fusos negativos por interpretar a
 * string como UTC.
 * 
 * USO: Apenas para exibição/formatação local (labels, UI).
 * NÃO usar em comparators de sort (para isso use `weekTimestamp`).
 */
export function parseWeekLocal(w: string): Date {
  const iso = normalizeWeek(w);
  return new Date(`${iso}T00:00:00`);
}

/**
 * Interno: Faz parse em UTC para garantir comparadores determinísticos
 * e TZ-independentes.
 */
function parseWeekUtc(w: string): Date {
  const iso = normalizeWeek(w);
  return new Date(`${iso}T00:00:00Z`);
}

/**
 * Type guard: a string passa por normalizeWeek, casa com YYYY-MM-DD e
 * resulta em Date com timestamp finito (validado em UTC).
 */
export function isValidWeek(w: unknown): w is string {
  if (typeof w !== "string" || w.length === 0) return false;
  const iso = normalizeWeek(w);
  if (!ISO_WEEK_RE.test(iso)) return false;
  const ts = parseWeekUtc(iso).getTime();
  return Number.isFinite(ts);
}

/**
 * Timestamp para uso em comparators de sort. Devolve `Number.MAX_SAFE_INTEGER`
 * para semanas inválidas — empurra lixo para o final mantendo ordem total.
 * 
 * Este valor é TZ-independente (UTC) e determinístico.
 */
export function weekTimestamp(w: string): number {
  const ts = parseWeekUtc(w).getTime();
  return Number.isFinite(ts) ? ts : Number.MAX_SAFE_INTEGER;
}

export interface WeekPoint {
  week: string;
  positive: number;
  neutral: number;
  negative: number;
  mixed: number;
  total: number;
  positivePct: number;
}

/**
 * Normaliza, valida, mescla duplicatas (somando contadores e recalculando
 * positivePct) e ordena cronologicamente uma lista de pontos semanais.
 * Pontos com semana inválida são descartados e contabilizados em
 * `invalidWeekCount`.
 */
export function normalizeAndSortWeekPoints<P extends WeekPoint>(
  data: readonly P[] | null | undefined
): { sortedData: P[]; invalidWeekCount: number } {
  const safe = Array.isArray(data) ? data : [];
  let dropped = 0;
  const normalized: P[] = [];
  for (const p of safe) {
    if (!p || typeof p.week !== "string" || p.week.length === 0) {
      dropped++;
      continue;
    }
    const week = normalizeWeek(p.week);
    if (!isValidWeek(week)) {
      dropped++;
      continue;
    }
    normalized.push({ ...p, week });
  }

  const merged = new Map<string, P>();
  for (const p of normalized) {
    const existing = merged.get(p.week);
    if (!existing) {
      merged.set(p.week, { ...p });
      continue;
    }
    const positive = (existing.positive ?? 0) + (p.positive ?? 0);
    const neutral = (existing.neutral ?? 0) + (p.neutral ?? 0);
    const negative = (existing.negative ?? 0) + (p.negative ?? 0);
    const mixed = (existing.mixed ?? 0) + (p.mixed ?? 0);
    const total = (existing.total ?? 0) + (p.total ?? 0);
    const positivePct = total > 0 ? Math.round((positive / total) * 100) : 0;
    merged.set(p.week, {
      ...existing,
      positive,
      neutral,
      negative,
      mixed,
      total,
      positivePct,
    });
  }

  const unique = Array.from(merged.values());
  const tsCache = new Map<string, number>();
  for (const p of unique) tsCache.set(p.week, weekTimestamp(p.week));
  unique.sort((a, b) => (tsCache.get(a.week) ?? 0) - (tsCache.get(b.week) ?? 0));

  return { sortedData: unique, invalidWeekCount: dropped };
}
