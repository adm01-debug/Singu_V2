import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchCompanyDedupRelations } from '../useDedupEngine';

const mocks = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: vi.fn() }));

function queryResult(data: unknown, error: Error | null = null) {
  const response = Promise.resolve({ data, error });
  const query = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn(), in: vi.fn(), gt: vi.fn(), then: response.then.bind(response) };
  for (const method of [query.select, query.eq, query.order, query.limit, query.in, query.gt]) method.mockReturnValue(query);
  return query;
}

beforeEach(() => vi.resetAllMocks());

describe('Relações da deduplicação', () => {
  it('divide IDs em lotes, pagina relações e encontra o primário após a primeira página', async () => {
    const companies = Array.from({ length: 205 }, (_, index) => `empresa-${index}`);
    const firstEmails = queryResult(Array.from({ length: 500 }, (_, index) => ({ id: `email-${String(index).padStart(4, '0')}`, company_id: companies[0], email: `secundario${index}@example.test`, is_primary: false })));
    const primary = queryResult([{ id: 'email-0500', company_id: companies[0], email: 'primario@example.test', is_primary: true }]);
    const queries: ReturnType<typeof queryResult>[] = [];
    let emailCalls = 0;
    mocks.from.mockImplementation(table => {
      const query = table === 'company_emails' && ++emailCalls === 1 ? firstEmails
        : table === 'company_emails' && emailCalls === 2 ? primary : queryResult([]);
      queries.push(query);
      return query;
    });

    const result = await fetchCompanyDedupRelations(companies, 'usuario-1');
    expect(result.emails.get(companies[0])?.email).toBe('primario@example.test');
    expect(primary.gt).toHaveBeenCalledWith('id', 'email-0499');
    expect(queries.map(query => query.in.mock.calls[0][1].length)).toEqual([100, 100, 100, 100, 100, 5, 5]);
    for (const query of queries) expect(query.eq).toHaveBeenCalledWith('companies.user_id', 'usuario-1');
  });

  it('não ignora falha no lote seguinte nem retorna relações incompletas', async () => {
    const companies = Array.from({ length: 101 }, (_, index) => `empresa-${index}`);
    const failure = new Error('Segundo lote recusado');
    mocks.from.mockReturnValueOnce(queryResult([])).mockReturnValueOnce(queryResult([])).mockReturnValue(queryResult(null, failure));
    await expect(fetchCompanyDedupRelations(companies, 'usuario-1')).rejects.toBe(failure);
  });
});
