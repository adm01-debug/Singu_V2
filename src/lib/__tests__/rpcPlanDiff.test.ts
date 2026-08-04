import { describe, it, expect } from 'vitest';
import { flattenPlan, diffPlans, summarizeDiff, hasScanRegression } from '@/lib/rpcPlanDiff';

const indexPlan = [
  {
    Plan: {
      'Node Type': 'Aggregate',
      'Total Cost': 12,
      Plans: [{ 'Node Type': 'Index Scan', 'Relation Name': 'contacts', 'Total Cost': 8 }],
    },
  },
];

const seqPlan = [
  {
    Plan: {
      'Node Type': 'Aggregate',
      'Total Cost': 900,
      Plans: [{ 'Node Type': 'Seq Scan', 'Relation Name': 'contacts', 'Total Cost': 880 }],
    },
  },
];

describe('rpcPlanDiff', () => {
  it('lineariza a árvore com caminhos estáveis', () => {
    const nodes = flattenPlan(indexPlan);
    expect(nodes.map((n) => n.path)).toEqual(['0', '0.0']);
    expect(nodes[1].nodeType).toBe('Index Scan');
  });

  it('tolera payloads inválidos', () => {
    expect(flattenPlan(null)).toEqual([]);
    expect(flattenPlan([])).toEqual([]);
    expect(flattenPlan({ foo: 'bar' })[0].nodeType).toBe('Unknown');
  });

  it('detecta regressão de Index Scan para Seq Scan', () => {
    const rows = diffPlans(seqPlan, indexPlan);
    expect(summarizeDiff(rows)).toMatchObject({ unchanged: 1, changed: 1 });
    expect(hasScanRegression(rows)).toBe(true);
  });

  it('marca nós adicionados e removidos', () => {
    const rows = diffPlans(indexPlan, [{ Plan: { 'Node Type': 'Aggregate' } }]);
    expect(rows.find((r) => r.path === '0.0')?.status).toBe('added');
    const inverse = diffPlans([{ Plan: { 'Node Type': 'Aggregate' } }], indexPlan);
    expect(inverse.find((r) => r.path === '0.0')?.status).toBe('removed');
  });
});
