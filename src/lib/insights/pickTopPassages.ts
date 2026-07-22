import type { Excerpt } from "./extractExcerpts";

export interface PickOptions {
  /** Limite total de passagens retornadas. Sempre clampado em [1, MAX_TOTAL_CAP]. */
  totalCap: number;
  /** Máximo de passagens por fonte antes do round-robin. */
  maxPerSource: number;
  /** Tamanho da janela (chars) ao recortar o trecho centrado na sentença. */
  window: number;
}

/** Limite máximo absoluto de passagens retornadas (requisito: até 5). */
export const MAX_TOTAL_CAP = 5;

interface ScoredSentence {
  text: string;
  start: number;
  end: number;
  score: number;
}

function scoreSentence(s: string): number {
  const len = s.length;
  if (len < 30 || len > 400) return -1;
  let score = 0;
  // Sweet spot 60–280
  if (len >= 60 && len <= 280) score += 3;
  else score += 1;
  // Question / dialogue markers
  if (/[?]/.test(s)) score += 2;
  if (/[":]/.test(s)) score += 1;
  // Significant words (>3 letters)
  const words = s.split(/\s+/).filter((w) => w.length > 3);
  score += Math.min(words.length / 5, 4);
  // Penalty for mostly digits/punctuation
  const alpha = (s.match(/\p{L}/gu) ?? []).length;
  if (alpha / Math.max(len, 1) < 0.5) score -= 3;
  return score;
}

function splitSentences(text: string): Array<{ text: string; start: number; end: number }> {
  const out: Array<{ text: string; start: number; end: number }> = [];
  // eslint-disable-next-line sonarjs/super-linear-regex -- regex verified non-catastrophic (no nested ambiguous quantifiers / bounded)
  const re = /[^.!?…]+[.!?…]+(\s+|$)/g;
  let m: RegExpExecArray | null;
  let lastEnd = 0;
  while ((m = re.exec(text)) !== null) {
    const raw = m[0];
    const trimmed = raw.trim();
    if (trimmed.length > 0) {
      const start = m.index + (raw.length - raw.trimStart().length);
      const end = start + trimmed.length;
      out.push({ text: trimmed, start, end });
    }
    lastEnd = re.lastIndex;
  }
  if (lastEnd < text.length) {
    const tail = text.slice(lastEnd).trim();
    if (tail.length > 0) {
      const start = text.indexOf(tail, lastEnd);
      out.push({ text: tail, start: start >= 0 ? start : lastEnd, end: (start >= 0 ? start : lastEnd) + tail.length });
    }
  }
  return out;
}

export function pickTopPassages(
  sources: Array<{ id: string; text: string }>,
  opts: PickOptions,
): Excerpt[] {
  if (!Array.isArray(sources) || sources.length === 0) return [];
  // Clamp do totalCap: nunca retornamos mais que MAX_TOTAL_CAP (5), nem menos que 0.
  const totalCap = Math.max(0, Math.min(opts.totalCap | 0, MAX_TOTAL_CAP));
  if (totalCap === 0) return [];
  const maxPerSource = Math.max(1, opts.maxPerSource | 0);
  const half = Math.max(40, Math.floor(opts.window / 2));
  const perSource = new Map<string, Excerpt[]>();
  const order: string[] = [];

  for (const src of sources) {
    if (!src?.id || typeof src.text !== "string" || src.text.length === 0) continue;
    const sentences = splitSentences(src.text);
    const scored: ScoredSentence[] = sentences
      .map((s) => ({ ...s, score: scoreSentence(s.text) }))
      .filter((s) => s.score > 0)
      // Tiebreaker por posição (start asc) garante determinismo entre execuções.
      .sort((a, b) => (b.score !== a.score ? b.score - a.score : a.start - b.start))
      .slice(0, maxPerSource);

    if (scored.length === 0) continue;
    // Re-sort by position to keep narrative order within source
    scored.sort((a, b) => a.start - b.start);

    const list: Excerpt[] = scored.map((s) => {
      const center = Math.floor((s.start + s.end) / 2);
      const start = Math.max(0, center - half);
      const end = Math.min(src.text.length, center + half);
      let snippet = src.text.slice(start, end).trim();
      if (start > 0) snippet = "…" + snippet;
      if (end < src.text.length) snippet = snippet + "…";
      return {
        interactionId: src.id,
        text: snippet,
        matchTerm: "",
        position: s.start,
      };
    });
    perSource.set(src.id, list);
    order.push(src.id);
  }

  const result: Excerpt[] = [];
  const cursors = new Map<string, number>();
  for (const id of order) cursors.set(id, 0);

  while (result.length < totalCap) {
    let added = false;
    for (const id of order) {
      if (result.length >= totalCap) break;
      const list = perSource.get(id)!;
      const idx = cursors.get(id)!;
      if (idx < list.length) {
        result.push(list[idx]);
        cursors.set(id, idx + 1);
        added = true;
      }
    }
    if (!added) break;
  }

  return result;
}
