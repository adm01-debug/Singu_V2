export interface Excerpt {
  interactionId: string;
  text: string;
  matchTerm: string;
  position: number;
}

export type MatchMode = "exact" | "partial";

export interface ExtractOptions {
  totalCap: number;
  maxPerSource: number;
  window: number;
  /** "exact" (default) = whole-word; "partial" = substring. Sempre case/acento-insensitive. */
  matchMode?: MatchMode;
}

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface RawHit {
  interactionId: string;
  text: string;
  matchTerm: string;
  position: number;
  density: number;
  relPosition: number;
  sourceOrder: number;
  hitOrder: number;
}

function countMatches(snippet: string, re: RegExp): number {
  const norm = normalize(snippet);
  re.lastIndex = 0;
  let count = 0;
  while (re.exec(norm) !== null) count++;
  return count;
}

export function extractExcerpts(
  sources: Array<{ id: string; text: string }>,
  keywords: string[],
  opts: ExtractOptions,
): Excerpt[] {
  if (!Array.isArray(sources) || !Array.isArray(keywords) || keywords.length === 0) return [];
  const cleanKeywords = keywords.map((k) => k?.trim()).filter((k): k is string => !!k && k.length > 1);
  if (cleanKeywords.length === 0) return [];

  const escaped = cleanKeywords.map((k) => escapeRegex(normalize(k)));
  const matchMode: MatchMode = opts.matchMode ?? "exact";
  const buildPattern = () =>
    matchMode === "exact"
      ? `(?:^|[^\\p{L}\\p{N}])(${escaped.join("|")})(?=$|[^\\p{L}\\p{N}])`
      : `(${escaped.join("|")})`;
  const re = new RegExp(buildPattern(), "giu");

  const half = Math.max(40, Math.floor(opts.window / 2));
  const hitsBySource = new Map<string, RawHit[]>();
  const densityRe = new RegExp(buildPattern(), "giu");

  for (let sIdx = 0; sIdx < sources.length; sIdx++) {
    const src = sources[sIdx];
    if (!src?.id || typeof src.text !== "string" || src.text.length === 0) continue;
    const original = src.text;
    const norm = normalize(original);
    const textLen = Math.max(original.length, 1);
    re.lastIndex = 0;
    const sourceHits: RawHit[] = [];
    let m: RegExpExecArray | null;
    let hIdx = 0;
    while ((m = re.exec(norm)) !== null) {
      const matchStart = m.index + (m[0].length - m[1].length);
      const matchEnd = matchStart + m[1].length;
      const start = Math.max(0, matchStart - half);
      const end = Math.min(original.length, matchEnd + half);
      let snippet = original.slice(start, end).trim();
      if (start > 0) snippet = "…" + snippet;
      if (end < original.length) snippet = snippet + "…";
      sourceHits.push({
        interactionId: src.id,
        text: snippet,
        matchTerm: original.slice(matchStart, matchEnd),
        position: matchStart,
        density: countMatches(snippet, densityRe),
        relPosition: matchStart / textLen,
        sourceOrder: sIdx,
        hitOrder: hIdx++,
      });
      if (sourceHits.length >= opts.maxPerSource) break;
    }
    if (sourceHits.length > 0) hitsBySource.set(src.id, sourceHits);
  }

  const all: RawHit[] = [];
  for (const list of hitsBySource.values()) all.push(...list);
  all.sort((a, b) => {
    if (b.density !== a.density) return b.density - a.density;
    if (a.relPosition !== b.relPosition) return a.relPosition - b.relPosition;
    if (a.sourceOrder !== b.sourceOrder) return a.sourceOrder - b.sourceOrder;
    return a.hitOrder - b.hitOrder;
  });

  return all.slice(0, opts.totalCap).map((h) => ({
    interactionId: h.interactionId,
    text: h.text,
    matchTerm: h.matchTerm,
    position: h.position,
  }));
}
