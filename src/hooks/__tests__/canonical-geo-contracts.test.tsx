import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGeoSalesData } from '../useBIAdvanced';

const mocks = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'usuario-1' } }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from } }));

interface Address {
  id: string;
  company_id: string;
  latitude: number;
  longitude: number;
  cidade: string;
  estado: string;
  is_primary: boolean;
}

function queryResult(data: unknown) {
  const response = Promise.resolve({ data, error: null });
  const query = { select: vi.fn(), eq: vi.fn(), limit: vi.fn(), order: vi.fn(), gt: vi.fn(), not: vi.fn(), then: response.then.bind(response) };
  for (const method of [query.select, query.eq, query.limit, query.order, query.gt, query.not]) method.mockReturnValue(query);
  return query;
}

function addressQuery(rows: Address[], error: Error | null = null) {
  let companyIds: string[] = [];
  let cursor = '';
  const query = {
    select: vi.fn(), eq: vi.fn(), not: vi.fn(), gte: vi.fn(), lte: vi.fn(), order: vi.fn(), limit: vi.fn(),
    in: vi.fn((_column: string, ids: string[]) => { companyIds = ids; return query; }),
    gt: vi.fn((_column: string, id: string) => { cursor = id; return query; }),
    then: (...args: Parameters<Promise<{ data: Address[] | null; error: Error | null }>['then']>) => Promise.resolve({
      data: error ? null : rows.filter(row => companyIds.includes(row.company_id) && row.id > cursor).slice(0, 500), error,
    }).then(...args),
  };
  for (const method of [query.select, query.eq, query.not, query.gte, query.lte, query.order, query.limit]) method.mockReturnValue(query);
  return query;
}

function cursorPages<Row extends { id: string }>(rows: Row[]) {
  let cursor = '';
  const query = {
    select: vi.fn(), eq: vi.fn(), not: vi.fn(), order: vi.fn(), limit: vi.fn(),
    gt: vi.fn((_column: string, id: string) => { cursor = id; return query; }),
    then: (...args: Parameters<Promise<{ data: typeof rows; error: null }>['then']>) => Promise.resolve({
      data: rows.filter(row => row.id > cursor).slice(0, 500), error: null,
    }).then(...args),
  };
  for (const method of [query.select, query.eq, query.not, query.order, query.limit]) method.mockReturnValue(query);
  return query;
}

const companies = Array.from({ length: 205 }, (_, index) => ({ id: `empresa-${index}`, nome_crm: `Empresa ${index}` }));
const baseAddresses: Address[] = companies.map((company, index) => ({
  id: `endereco-${String(index).padStart(6, '0')}`, company_id: company.id,
  latitude: 0, longitude: 0, cidade: 'Goiânia', estado: 'GO', is_primary: false,
}));
let queryClient: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

beforeEach(() => {
  vi.clearAllMocks();
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

describe('Geolocalização limita URLs, pagina endereços e preserva o escopo', () => {
  it('não perde empresas depois do limite de mil registros do PostgREST', async () => {
    const fullPortfolio = Array.from({ length: 1205 }, (_, index) => ({
      id: `empresa-${String(index).padStart(4, '0')}`, nome_crm: `Empresa ${index}`,
    }));
    const companiesQuery = cursorPages(fullPortfolio);
    const geoQueries: ReturnType<typeof addressQuery>[] = [];
    mocks.from.mockImplementation(table => {
      if (table === 'companies') return companiesQuery;
      if (table === 'company_addresses') {
        const query = addressQuery([{
          ...baseAddresses[0], id: 'endereco-1', company_id: fullPortfolio[1204].id,
        }]);
        geoQueries.push(query);
        return query;
      }
      return queryResult([]);
    });
    const { result } = renderHook(() => useGeoSalesData(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(companiesQuery.gt).toHaveBeenCalledTimes(2);
    expect(result.current.data).toEqual([expect.objectContaining({ company_name: 'Empresa 1204' })]);
    expect(geoQueries).toHaveLength(13);
    expect(geoQueries[12].in).toHaveBeenCalledWith('company_id', fullPortfolio.slice(1200).map(company => company.id));
  });

  it('carrega três lotes e prefere o primário mesmo depois da primeira página', async () => {
    const rows = [...baseAddresses, ...Array.from({ length: 499 }, (_, index) => ({
      ...baseAddresses[0], id: `endereco-${String(205 + index).padStart(6, '0')}`,
    })), { ...baseAddresses[0], id: 'endereco-900000', latitude: -22, longitude: -43, is_primary: true }];
    const queries: ReturnType<typeof addressQuery>[] = [];
    const companyQuery = queryResult(companies);
    mocks.from.mockImplementation(table => {
      if (table === 'companies') return companyQuery;
      if (table === 'company_addresses') {
        const query = addressQuery(rows);
        queries.push(query);
        return query;
      }
      return queryResult([{ company_id: companies[0].id }, { company_id: companies[0].id }, { company_id: null }]);
    });
    const { result } = renderHook(() => useGeoSalesData(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(205);
    expect(result.current.data?.[0]).toMatchObject({ lat: -22, lng: -43, contact_count: 2, interaction_count: 2 });
    expect(result.current.data?.[204]).toMatchObject({ lat: 0, lng: 0, company_name: 'Empresa 204' });
    expect(companyQuery.eq).toHaveBeenCalledWith('user_id', 'usuario-1');
    expect(queries).toHaveLength(4);
    const queriedIds = new Set<string>();
    for (const query of queries) {
      expect(query.eq).toHaveBeenCalledWith('companies.user_id', 'usuario-1');
      expect(query.gte).toHaveBeenCalledWith('latitude', -90);
      expect(query.lte).toHaveBeenCalledWith('longitude', 180);
      const ids: string[] = query.in.mock.calls[0][1];
      expect(ids.length).toBeLessThanOrEqual(100);
      ids.forEach(id => queriedIds.add(id));
    }
    expect([...queriedIds]).toEqual(companies.map(company => company.id));
    expect(queries[1].gt).toHaveBeenCalledWith('id', expect.any(String));
  });

  it('conta contatos além do limite padrão sem omitir vínculos na métrica', async () => {
    const contacts = Array.from({ length: 1205 }, (_, index) => ({
      id: `contato-${String(index).padStart(4, '0')}`, company_id: companies[0].id,
    }));
    const contactQuery = cursorPages(contacts);
    mocks.from.mockImplementation(table => {
      if (table === 'companies') return queryResult(companies);
      if (table === 'contacts') return contactQuery;
      if (table === 'company_addresses') return addressQuery([baseAddresses[0]]);
      return queryResult([]);
    });
    const { result } = renderHook(() => useGeoSalesData(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(contactQuery.eq).toHaveBeenCalledWith('user_id', 'usuario-1');
    expect(contactQuery.gt).toHaveBeenCalledTimes(2);
    expect(result.current.data?.[0].contact_count).toBe(1205);
  });

  it('propaga a falha de um lote sem apresentar resultado parcial como sucesso', async () => {
    const failure = new Error('Falha no segundo lote');
    let addressCalls = 0;
    mocks.from.mockImplementation(table => {
      if (table === 'companies') return queryResult(companies);
      if (table === 'company_addresses') return addressQuery(baseAddresses, ++addressCalls === 2 ? failure : null);
      return queryResult([]);
    });
    const { result } = renderHook(() => useGeoSalesData(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(failure);
    expect(result.current.data).toBeUndefined();
  });
});
