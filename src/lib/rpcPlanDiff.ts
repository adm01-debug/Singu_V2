/**
 * Rodada 64/10 — utilidades de diff de planos de execução (EXPLAIN JSON).
 *
 * O objetivo é transformar a árvore recursiva do plano em uma lista linear
 * comparável (assinatura estrutural por caminho), permitindo destacar nós que
 * mudaram de estratégia (ex.: `Index Scan` → `Seq Scan`).
 */

export interface PlanNode {
  /** Caminho hierárquico estável (ex.: "0.1") usado para parear os dois planos. */
  path: string;
  depth: number;
  nodeType: string;
  relation: string | null;
  totalCost: number | null;
  actualRows: number | null;
}

export type PlanNodeStatus = 'unchanged' | 'changed' | 'added' | 'removed';

export interface PlanDiffRow {
  path: string;
  status: PlanNodeStatus;
  current: PlanNode | null;
  previous: PlanNode | null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/** Extrai o nó raiz de um payload de `EXPLAIN (FORMAT JSON)`, tolerando variações. */
function rootOf(plan: unknown): Record<string, unknown> | null {
  if (Array.isArray(plan)) return plan.length > 0 ? rootOf(plan[0]) : null;
  const rec = asRecord(plan);
  if (!rec) return null;
  if (rec.Plan !== undefined) return asRecord(rec.Plan);
  return rec;
}

/** Lineariza a árvore do plano em profundidade (pré-ordem) com caminhos estáveis. */
export function flattenPlan(plan: unknown): PlanNode[] {
  const root = rootOf(plan);
  if (!root) return [];

  const out: PlanNode[] = [];
  const walk = (node: Record<string, unknown>, path: string, depth: number): void => {
    // Guarda contra árvores patológicas/circulares vindas de payloads externos.
    if (depth > 64 || out.length > 500) return;
    out.push({
      path,
      depth,
      nodeType: stringOrNull(node['Node Type']) ?? 'Unknown',
      relation: stringOrNull(node['Relation Name']) ?? stringOrNull(node['Function Name']),
      totalCost: numberOrNull(node['Total Cost']),
      actualRows: numberOrNull(node['Actual Rows']),
    });
    const children = node.Plans;
    if (!Array.isArray(children)) return;
    children.forEach((child, index) => {
      const rec = asRecord(child);
      if (rec) walk(rec, `${path}.${index}`, depth + 1);
    });
  };

  walk(root, '0', 0);
  return out;
}

function signature(node: PlanNode): string {
  return `${node.nodeType}::${node.relation ?? '-'}`;
}

/** Compara dois planos, pareando nós pelo caminho hierárquico. */
export function diffPlans(currentPlan: unknown, previousPlan: unknown): PlanDiffRow[] {
  const current = flattenPlan(currentPlan);
  const previous = flattenPlan(previousPlan);
  const prevByPath = new Map(previous.map((n) => [n.path, n]));

  const rows: PlanDiffRow[] = current.map((node) => {
    const prev = prevByPath.get(node.path) ?? null;
    let status: PlanNodeStatus = 'added';
    if (prev) status = signature(prev) === signature(node) ? 'unchanged' : 'changed';
    return { path: node.path, status, current: node, previous: prev };
  });

  const currentPaths = new Set(current.map((n) => n.path));
  for (const node of previous) {
    if (!currentPaths.has(node.path)) {
      rows.push({ path: node.path, status: 'removed', current: null, previous: node });
    }
  }

  return rows.sort((a, b) => a.path.localeCompare(b.path, 'en', { numeric: true }));
}

/** Resumo compacto para badges do cabeçalho do diff. */
export function summarizeDiff(rows: PlanDiffRow[]): Record<PlanNodeStatus, number> {
  return rows.reduce<Record<PlanNodeStatus, number>>(
    (acc, row) => {
      acc[row.status] += 1;
      return acc;
    },
    { unchanged: 0, changed: 0, added: 0, removed: 0 },
  );
}

/** Sinaliza a regressão clássica: índice trocado por varredura sequencial. */
export function hasScanRegression(rows: PlanDiffRow[]): boolean {
  return rows.some(
    (row) =>
      row.status === 'changed' &&
      row.previous?.nodeType.includes('Index') === true &&
      row.current?.nodeType.includes('Seq Scan') === true,
  );
}
