/**
 * Calcula diff entre 2 metadatas de entidade — usado pelo Entity 360.
 * Retorna lista de campos com tipo de mudança (added/removed/changed/equal).
 */
export type DiffStatus = 'added' | 'removed' | 'changed' | 'equal';

export interface DiffRow {
  key: string;
  status: DiffStatus;
  before: string;
  after: string;
}

function normalize(v: unknown): string {
  if (v === null || v === undefined || v === '') return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export function computeMetadataDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  limit = 30,
): DiffRow[] {
  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).sort();
  const rows: DiffRow[] = [];
  for (const key of keys) {
    const b = normalize(before[key]);
    const a = normalize(after[key]);
    let status: DiffStatus;
    if (b === '' && a !== '') status = 'added';
    else if (b !== '' && a === '') status = 'removed';
    else if (b !== a) status = 'changed';
    else status = 'equal';
    rows.push({ key, status, before: b.slice(0, 80), after: a.slice(0, 80) });
  }
  // prioriza mudanças no topo
  rows.sort((x, y) => {
    const order: Record<DiffStatus, number> = { changed: 0, added: 1, removed: 2, equal: 3 };
    return order[x.status] - order[y.status];
  });
  return rows.slice(0, limit);
}
