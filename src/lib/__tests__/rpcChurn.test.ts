import { describe, it, expect } from 'vitest';
import { parseChurnWindow, churnToCsv, DEFAULT_CHURN_WINDOW } from '@/lib/rpcChurn';

describe('parseChurnWindow', () => {
  it('aceita janelas válidas', () => {
    expect(parseChurnWindow('6')).toBe('6');
    expect(parseChurnWindow('168')).toBe('168');
  });

  it('cai no default para valores inválidos, nulos ou maliciosos', () => {
    for (const raw of [null, undefined, '', '0', '-1', '9999', 'abc', '24; DROP TABLE']) {
      expect(parseChurnWindow(raw)).toBe(DEFAULT_CHURN_WINDOW);
    }
  });
});

describe('churnToCsv', () => {
  it('gera cabeçalho mesmo sem linhas', () => {
    expect(churnToCsv([])).toBe('rpc,trocas,ultima_troca,p95_24h_ms');
  });

  it('escapa aspas e trata p95 nulo', () => {
    const csv = churnToCsv([
      { rpc_name: 'get_"x"', changes: 3, last_change: '2026-07-26T10:00:00Z', p95Ms: 812.4 },
      { rpc_name: 'get_y', changes: 1, last_change: '2026-07-26T09:00:00Z', p95Ms: null },
    ]);
    const lines = csv.split('\n');
    expect(lines[1]).toBe('"get_""x""","3","2026-07-26T10:00:00Z","812"');
    expect(lines[2]).toBe('"get_y","1","2026-07-26T09:00:00Z",""');
  });
});
