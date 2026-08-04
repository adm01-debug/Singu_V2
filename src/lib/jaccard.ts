/**
 * Calcula o índice de Jaccard entre N grupos de IDs.
 * Para 2 conjuntos: |A∩B| / |A∪B|.
 * Para N conjuntos: |interseção| / |união|.
 */
export interface JaccardResult {
  index: number;
  intersection: number;
  union: number;
}

export function jaccardIndex(groups: string[][]): JaccardResult {
  if (groups.length < 2) return { index: 0, intersection: 0, union: 0 };
  const sets = groups.map((g) => new Set(g));
  const union = new Set<string>();
  sets.forEach((s) => s.forEach((v) => union.add(v)));
  const [first, ...rest] = sets;
  const intersection = new Set<string>();
  first.forEach((v) => {
    if (rest.every((s) => s.has(v))) intersection.add(v);
  });
  const u = union.size;
  const i = intersection.size;
  return { index: u > 0 ? i / u : 0, intersection: i, union: u };
}
