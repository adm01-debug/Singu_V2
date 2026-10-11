import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchCompanyRelationshipScores } from './relationshipScores';

const mocks = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from } }));

function queryResult(data: unknown, error: Error | null = null) {
  const response = Promise.resolve({ data, error });
  const query = { select: vi.fn(), eq: vi.fn(), in: vi.fn(), order: vi.fn(), range: vi.fn(), then: response.then.bind(response) };
  for (const method of [query.select, query.eq, query.in, query.order, query.range]) method.mockReturnValue(query);
  return query;
}
const row = (companyId: string, score: number | null) => ({
  id: `score-${companyId}`, company_id: companyId, relationship_score: score, score_date: '2026-04-02', created_at: '2026-04-02T10:00:00Z',
});
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Rede real proibida neste teste'); }));
});
afterEach(() => vi.unstubAllGlobals());

describe('Score real de empresa no mapa', () => {
  it('usa a medição mais recente e mantém score zero e ausência de score', async () => {
    const query = queryResult([row('empresa-1', 85), row('empresa-1', 40), row('empresa-2', 0), row('empresa-3', null)]);
    mocks.from.mockReturnValue(query);
    const scores = await fetchCompanyRelationshipScores(['empresa-1', 'empresa-2', 'empresa-3', 'empresa-4'], 'usuario-1');
    expect(query.eq).toHaveBeenCalledWith('companies.user_id', 'usuario-1');
    expect(query.select).toHaveBeenCalledWith(expect.stringContaining('companies!inner(user_id)'));
    expect(scores.get('empresa-1')).toBe(85);
    expect(scores.get('empresa-2')).toBe(0);
    expect(scores.get('empresa-3')).toBeNull();
    expect(scores.has('empresa-4')).toBe(false);
    expect(query.order).toHaveBeenCalledWith('score_date', { ascending: false, nullsFirst: false });
    expect(query.order).toHaveBeenCalledWith('created_at', { ascending: false, nullsFirst: false });
    expect(mocks.from).toHaveBeenCalledWith('customer_health_scores');
  });

  it('não consulta a tabela global quando não há empresas autorizadas', async () => {
    expect((await fetchCompanyRelationshipScores([], 'usuario-1')).size).toBe(0);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('pagina o histórico sem truncar empresas ainda não encontradas', async () => {
    const first = queryResult(Array.from({ length: 500 }, () => row('empresa-1', 75)));
    const second = queryResult([row('empresa-2', 90)]);
    mocks.from.mockReturnValueOnce(first).mockReturnValueOnce(second);
    const scores = await fetchCompanyRelationshipScores(['empresa-1', 'empresa-2'], 'usuario-1');
    expect(scores.get('empresa-2')).toBe(90);
    expect(first.range).toHaveBeenCalledWith(0, 499);
    expect(second.range).toHaveBeenCalledWith(500, 999);
  });

  it('limita IDs por lote, deduplicando a carteira', async () => {
    const first = queryResult([]);
    const second = queryResult([]);
    mocks.from.mockReturnValueOnce(first).mockReturnValueOnce(second);
    const ids = Array.from({ length: 501 }, (_, i) => `empresa-${i}`);
    await fetchCompanyRelationshipScores([...ids, ids[0]], 'usuario-1');
    expect(first.in).toHaveBeenCalledWith('company_id', ids.slice(0, 500));
    expect(second.in).toHaveBeenCalledWith('company_id', [ids[500]]);
  });

  it('propaga erro remoto em vez de atribuir null a todas as empresas', async () => {
    const failure = new Error('Falha de leitura dos scores');
    mocks.from.mockReturnValue(queryResult(null, failure));
    await expect(fetchCompanyRelationshipScores(['empresa-1'], 'usuario-1')).rejects.toBe(failure);
  });

  it.each([-1, 101, 10.5, Number.NaN])('rejeita score incompatível %s', async score => {
    mocks.from.mockReturnValue(queryResult([row('empresa-1', score)]));
    await expect(fetchCompanyRelationshipScores(['empresa-1'], 'usuario-1')).rejects.toThrow();
  });

  it('não aceita score vinculado a empresa fora da carteira consultada', async () => {
    mocks.from.mockReturnValue(queryResult([row('outra-empresa', 80)]));
    await expect(fetchCompanyRelationshipScores(['empresa-1'], 'usuario-1')).rejects.toThrow('vínculo');
  });
});
