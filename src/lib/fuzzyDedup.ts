import levenshtein from 'fast-levenshtein';

/** Normalize string for comparison: lowercase, strip accents, collapse whitespace */
export function normalize(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9@. ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Strip non-digits — used for phone/CNPJ/CPF comparison */
export function digitsOnly(value: string | null | undefined): string {
  if (!value) return '';
  return value.toString().replace(/\D+/g, '');
}

/** Similarity ratio 0..1 based on Levenshtein distance */
export function similarity(a: string, b: string): number {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  const max = Math.max(a.length, b.length);
  if (max === 0) return 1;
  const dist = levenshtein.get(a, b);
  return 1 - dist / max;
}

export interface DedupRecord {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  cnpj?: string | null;
  cpf?: string | null;
  [key: string]: unknown;
}

export interface DuplicatePair<T extends DedupRecord = DedupRecord> {
  a: T;
  b: T;
  score: number;
  reasons: string[];
}

interface DetectOptions {
  threshold?: number;
  /** If true, exact email/phone/CNPJ matches are weighted heavier */
  strict?: boolean;
}

/**
 * Pure client-side fuzzy duplicate detection.
 * O(n²) — appropriate for batches up to ~2000 records.
 */
// eslint-disable-next-line sonarjs/cognitive-complexity
export function detectDuplicates<T extends DedupRecord>(
  records: T[],
  opts: DetectOptions = {}
): DuplicatePair<T>[] {
  const threshold = opts.threshold ?? 0.82;
  const pairs: DuplicatePair<T>[] = [];
  const seen = new Set<string>();

  const prepared = records.map(r => ({
    raw: r,
    name: normalize(r.name),
    email: normalize(r.email),
    phone: digitsOnly(r.phone),
    cnpj: digitsOnly(r.cnpj),
    cpf: digitsOnly(r.cpf),
  }));

  for (let i = 0; i < prepared.length; i++) {
    for (let j = i + 1; j < prepared.length; j++) {
      const A = prepared[i];
      const B = prepared[j];
      const reasons: string[] = [];
      let score = 0;
      let weights = 0;

      // Exact identifiers — heavy weight
      if (A.email && B.email && A.email === B.email) {
        reasons.push('Email idêntico');
        score += 1; weights += 1;
      } else if (A.email && B.email) {
        const s = similarity(A.email, B.email);
        if (s > 0.9) { reasons.push(`Email similar (${Math.round(s * 100)}%)`); score += s * 0.8; weights += 0.8; }
      }

      if (A.phone && B.phone && A.phone.length >= 8 && B.phone.length >= 8) {
        if (A.phone === B.phone) { reasons.push('Telefone idêntico'); score += 1; weights += 1; }
        else if (A.phone.slice(-8) === B.phone.slice(-8)) { reasons.push('Telefone similar'); score += 0.85; weights += 1; }
      }

      if (A.cnpj && B.cnpj && A.cnpj.length >= 8) {
        if (A.cnpj === B.cnpj) { reasons.push('CNPJ idêntico'); score += 1; weights += 1; }
        else if (A.cnpj.slice(0, 8) === B.cnpj.slice(0, 8)) { reasons.push('Mesma raiz CNPJ'); score += 0.7; weights += 0.7; }
      }

      if (A.cpf && B.cpf && A.cpf === B.cpf) {
        reasons.push('CPF idêntico'); score += 1; weights += 1;
      }

      // Fuzzy name
      if (A.name && B.name) {
        const s = similarity(A.name, B.name);
        if (s >= 0.75) { reasons.push(`Nome similar (${Math.round(s * 100)}%)`); score += s; weights += 1; }
      }

      if (weights === 0) continue;
      const finalScore = score / weights;

      if (finalScore >= threshold && reasons.length > 0) {
        const key = [A.raw.id, B.raw.id].sort().join('::');
        if (seen.has(key)) continue;
        seen.add(key);
        pairs.push({ a: A.raw, b: B.raw, score: finalScore, reasons });
      }
    }
  }

  return pairs.sort((a, b) => b.score - a.score);
}
