/**
 * Helpers para tratar `de`/`ate` como **datas civis** (Y-M-D, sem fuso),
 * evitando o bug clássico de `new Date('2025-01-15')` virar `2025-01-14`
 * em fusos a oeste e de `toISOString().slice(0,10)` pular um dia em fusos a leste.
 *
 * Convenção: a data é armazenada como `Date` em **horário local à meia-noite**.
 * String canônica: `YYYY-MM-DD` (ISO 8601 calendar date).
 */

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parseia `YYYY-MM-DD` (ou string ISO completa) como meia-noite local. */
export function parseCivilDate(v: string | null | undefined): Date | undefined {
  if (!v) return undefined;
  const trimmed = v.trim();
  if (!trimmed) return undefined;

  // Caminho rápido: aceita apenas a parte da data se vier ISO completo.
  const datePart = trimmed.length >= 10 ? trimmed.slice(0, 10) : trimmed;
  const m = ISO_DATE_RE.exec(datePart);
  if (!m) return undefined;

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;

  // `new Date(y, m-1, d)` cria à meia-noite **local** — evita deslocamento de fuso.
  const d = new Date(year, month - 1, day);
  if (isNaN(d.getTime())) return undefined;
  // Sanity check: meses como 02-30 são auto-corrigidos por JS — rejeite-os.
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return undefined;
  }
  return d;
}

/** Serializa um `Date` como `YYYY-MM-DD` no horário **local**, sem deslocamento de fuso. */
export function formatCivilDate(d: Date | undefined | null): string | undefined {
  if (!(d instanceof Date) || isNaN(d.getTime())) return undefined;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
