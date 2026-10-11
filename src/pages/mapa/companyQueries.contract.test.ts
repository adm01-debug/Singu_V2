import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchMapCompanies } from './companyQueries';

const mocks = vi.hoisted(() => ({ from: vi.fn(), scores: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from, auth: { onAuthStateChange: vi.fn() } } }));
vi.mock('./relationshipScores', () => ({ fetchCompanyRelationshipScores: mocks.scores }));

function queryResult(data: unknown, error: Error | null = null) {
  const response = Promise.resolve({ data, error });
  const query = { select: vi.fn(), eq: vi.fn(), is: vi.fn(), order: vi.fn(), limit: vi.fn(), gt: vi.fn(), then: response.then.bind(response) };
  for (const method of [query.select, query.eq, query.is, query.order, query.limit, query.gt]) method.mockReturnValue(query);
  return query;
}
const company = (id: number) => ({ id: `empresa-${String(id).padStart(4, '0')}`, nome_crm: `Empresa ${id}`, version: 0 });

beforeEach(() => {
  vi.resetAllMocks();
  mocks.scores.mockResolvedValue(new Map([['empresa-1001', 80]]));
});

describe('carteira completa do mapa', () => {
  it('busca mais de mil empresas pelo cursor do último ID e mantém escopo em cada página', async () => {
    const first = queryResult(Array.from({ length: 500 }, (_, i) => company(i + 1)));
    const second = queryResult(Array.from({ length: 500 }, (_, i) => company(i + 501)));
    const third = queryResult([company(1001)]);
    mocks.from.mockReturnValueOnce(first).mockReturnValueOnce(second).mockReturnValueOnce(third);
    const companies = await fetchMapCompanies('usuario-1');
    expect(companies).toHaveLength(1001);
    expect(second.gt).toHaveBeenCalledWith('id', 'empresa-0500');
    expect(third.gt).toHaveBeenCalledWith('id', 'empresa-1000');
    for (const query of [first, second, third]) {
      expect(query.eq).toHaveBeenCalledWith('user_id', 'usuario-1');
      expect(query.order).toHaveBeenCalledWith('id', { ascending: true });
      expect(query.is).toHaveBeenCalledWith('deleted_at', null);
    }
    expect(companies[1000].relationship_score).toBe(80);
    expect(companies[0].relationship_score).toBeNull();
    expect(mocks.scores).toHaveBeenCalledWith(companies.map(row => row.id), 'usuario-1');
  });

  it('não apresenta uma carteira parcial quando uma página falha', async () => {
    const failure = new Error('Falha de consulta');
    mocks.from.mockReturnValue(queryResult(null, failure));
    await expect(fetchMapCompanies('usuario-1')).rejects.toBe(failure);
    expect(mocks.scores).not.toHaveBeenCalled();
  });

  it('rejeita consulta sem usuário e encerra uma carteira vazia', async () => {
    await expect(fetchMapCompanies('')).rejects.toThrow('não autenticado');
    expect(mocks.from).not.toHaveBeenCalled();
    mocks.from.mockReturnValue(queryResult([]));
    await expect(fetchMapCompanies('usuario-1')).resolves.toEqual([]);
    expect(mocks.from).toHaveBeenCalledTimes(1);
  });
});
