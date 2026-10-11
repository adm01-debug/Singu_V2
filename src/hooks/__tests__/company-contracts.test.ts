import { createElement, type ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, type InfiniteData } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mapCompany, prepareCompanyWrite, useCompanies, type Company } from '../useCompanies';

const api = vi.hoisted(() => ({
  query: vi.fn(), insert: vi.fn(), update: vi.fn(), versioned: vi.fn(), remove: vi.fn(), toast: vi.fn(),
}));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'usuario-teste' } }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: api.toast }) }));
vi.mock('@/hooks/useActivityLogger', () => ({ useActivityLogger: () => ({ logActivity: vi.fn() }) }));
vi.mock('@/lib/trackScoreChange', () => ({ trackScoreChange: vi.fn() }));
vi.mock('@/lib/externalData', () => ({
  queryExternalData: api.query, insertExternalData: api.insert, updateExternalData: api.update,
  updateExternalDataWithVersion: api.versioned, deleteExternalData: api.remove,
  ConcurrentEditError: class extends Error {},
}));

const raw = { id: 'empresa-1', user_id: 'usuario-teste', nome_crm: 'Empresa', version: 3 };
const rawWithRelations = {
  ...raw,
  company_addresses: [{ id: 'endereco-1', is_primary: true, logradouro: 'Rua A', numero: '10', cidade: 'São Paulo', estado: 'SP', latitude: -23.5, longitude: -46.6 }],
  company_emails: [{ id: 'email-1', is_primary: true, email: 'vendas@example.test' }],
  company_phones: [{ id: 'telefone-1', is_primary: true, numero: '11999999999' }],
};
const queryKey = ['companies-infinite-v2', '__all__', 'usuario-teste'];
type Page = { companies: Company[]; count: number };
let client: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children);

beforeEach(() => {
  vi.resetAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  api.query.mockResolvedValue({ data: [rawWithRelations], count: 1, error: null });
});

describe('contrato canônico de empresas', () => {
  it('produz aliases reais exclusivamente de colunas e relações canônicas', () => {
    expect(mapCompany({ ...rawWithRelations, ramo_atividade: 'Tecnologia', tags_array: ['cliente'] })).toMatchObject({
      name: 'Empresa', industry: 'Tecnologia', tags: ['cliente'], address: 'Rua A',
      city: 'São Paulo', state: 'SP', lat: -23.5, lng: -46.6,
      email: 'vendas@example.test', phone: '11999999999', version: 3,
    });
  });

  it('escolhe relação primária deterministicamente sem depender da ordem do payload', () => {
    const relations = [
      { id: 'z', is_primary: false, cidade: 'Secundária' },
      { id: 'b', is_primary: true, cidade: 'B' },
      { id: 'a', is_primary: true, cidade: 'A' },
    ];
    expect(mapCompany({ ...raw, company_addresses: relations }).city).toBe('A');
    expect(mapCompany({ ...raw, company_addresses: [...relations].reverse() }).city).toBe('A');
    expect(mapCompany({ ...raw, company_addresses: relations.map(address => ({ ...address, is_primary: false })) }).city).toBe('A');
  });

  it('usa nome fantasia/razão social e mantém fallback de localização do nome', () => {
    expect(mapCompany({ ...raw, nome_crm: '', nome_fantasia: 'PAC - Duque de Caxias/RJ' })).toMatchObject({ name: 'PAC - Duque de Caxias/RJ', city: 'Duque de Caxias', state: 'RJ' });
    expect(mapCompany({ ...raw, nome_crm: '', razao_social: 'Razão Social' }).name).toBe('Razão Social');
  });

  it.each([
    { ...raw, version: undefined },
    { ...raw, company_addresses: {} },
    { ...raw, company_phones: [{ id: 'p', numero: 123 }] },
    { ...raw, tags_array: '["legado"]' },
  ])('rejeita payload externo inválido', payload => {
    expect(() => mapCompany(payload)).toThrow();
  });

  it('respeita tags canônicas vazias e rejeita aliases malformados antes da escrita', () => {
    expect(mapCompany({ ...raw, tags_array: [], tags: ['legado'] }).tags).toEqual([]);
    const invalid = { email: 'sem-arroba' };
    expect(() => prepareCompanyWrite(invalid)).toThrow();
  });

  it('remove aliases e identidades da escrita e conserva colunas reais', () => {
    expect(prepareCompanyWrite({
      name: 'Nova', industry: 'Tecnologia', tags: ['cliente'], id: raw.id, version: 3,
      phone: '11999999999', email: 'vendas@example.test', city: 'São Paulo', state: 'SP',
      address: 'Rua A', lat: -23.5, lng: -46.6, website: 'https://example.test',
    })).toEqual({ nome_crm: 'Nova', industry: 'Tecnologia', ramo_atividade: 'Tecnologia', tags: ['cliente'], tags_array: ['cliente'], website: 'https://example.test' });
    expect(prepareCompanyWrite({ notes: 'Nota' })).toEqual({ notes: 'Nota' });
    expect(prepareCompanyWrite({ industry: null })).toEqual({ industry: null, ramo_atividade: null });
  });

  it('não pula as empresas 100..499 após o carregamento inicial rápido', async () => {
    api.query.mockImplementation(options => {
      if (options.range.from === 0) return Promise.resolve({ data: Array.from({ length: 100 }, (_, index) => ({ ...raw, id: `empresa-${index}` })), count: 101, error: null });
      return Promise.resolve({ data: [{ ...raw, id: 'empresa-100' }], count: null, error: null });
    });
    const { result } = renderHook(() => useCompanies(), { wrapper });
    await waitFor(() => expect(result.current.companies).toHaveLength(100));
    await act(async () => { await result.current.fetchNextPage(); });
    await waitFor(() => expect(result.current.companies).toHaveLength(101));
    expect(api.query.mock.calls.map(([options]) => options.range)).toEqual([{ from: 0, to: 99 }, { from: 100, to: 599 }]);
    const select = api.query.mock.calls[0][0].select as string;
    expect(select).toContain('company_addresses(');
    expect(select).toContain('company_emails(');
    expect(select).toContain('company_phones(');
    expect(api.query.mock.calls[0][0].filters).toContainEqual({ type: 'is', column: 'deleted_at', value: null });
  });

  it('continua a paginação após a segunda página usando a contagem inicial', async () => {
    api.query.mockImplementation(options => {
      const size = options.range.from === 0 ? 100 : 500;
      return Promise.resolve({ data: Array.from({ length: size }, (_, index) => ({ ...raw, id: `empresa-${options.range.from + index}` })), count: options.range.from === 0 ? 1100 : null, error: null });
    });
    const { result } = renderHook(() => useCompanies(), { wrapper });
    await waitFor(() => expect(result.current.companies).toHaveLength(100));
    await act(async () => { await result.current.fetchNextPage(); });
    await waitFor(() => expect(result.current.companies).toHaveLength(600));
    expect(result.current.hasNextPage).toBe(true);
    await act(async () => { await result.current.fetchNextPage(); });
    await waitFor(() => expect(result.current.companies).toHaveLength(1100));
    expect(result.current.hasNextPage).toBe(false);
    expect(api.query.mock.calls[2][0].range).toEqual({ from: 600, to: 1099 });
  });

  it('insere aliases em relações quando a empresa não possui relações prévias', async () => {
    api.query.mockResolvedValue({ data: [raw], count: 1, error: null });
    api.versioned.mockResolvedValue({ data: { ...raw, version: 4 }, error: null });
    api.insert.mockResolvedValue({ data: { id: 'relação-nova' }, error: null });
    const { result } = renderHook(() => useCompanies(), { wrapper });
    await waitFor(() => expect(result.current.companies).toHaveLength(1));
    await act(async () => { await result.current.updateCompany(raw.id, { city: 'Campinas', state: 'SP', lat: -22.9, lng: -47.0, email: 'novo@example.test', phone: '11888888888' }); });
    expect(api.insert).toHaveBeenCalledWith('company_addresses', { company_id: raw.id, is_primary: true, cidade: 'Campinas', estado: 'SP', latitude: -22.9, longitude: -47.0 });
    expect(api.insert).toHaveBeenCalledWith('company_emails', { company_id: raw.id, is_primary: true, email: 'novo@example.test' });
    expect(api.insert).toHaveBeenCalledWith('company_phones', { company_id: raw.id, is_primary: true, numero: '11888888888' });
  });

  it('grava aliases em relações e recarrega o cache com a versão real', async () => {
    const { result } = renderHook(() => useCompanies(), { wrapper });
    await waitFor(() => expect(result.current.companies).toHaveLength(1));
    api.versioned.mockResolvedValue({ data: { ...raw, version: 4 }, error: null });
    api.update.mockResolvedValue({ data: {}, error: null });
    api.query.mockResolvedValue({ data: [{ ...rawWithRelations, version: 4, company_addresses: [{ ...rawWithRelations.company_addresses[0], cidade: 'Campinas' }] }], error: null });
    await act(async () => { await result.current.updateCompany(raw.id, { city: 'Campinas', phone: '11888888888', email: 'novo@example.test' }); });
    expect(api.versioned).toHaveBeenCalledWith('companies', raw.id, 3, {});
    expect(api.update).toHaveBeenCalledWith('company_addresses', 'endereco-1', { cidade: 'Campinas' });
    expect(api.update).toHaveBeenCalledWith('company_phones', 'telefone-1', { numero: '11888888888' });
    expect(api.update).toHaveBeenCalledWith('company_emails', 'email-1', { email: 'novo@example.test' });
    expect(client.getQueryData<InfiniteData<Page>>(queryKey).pages[0].companies[0]).toMatchObject({ city: 'Campinas', version: 4 });
  });

  it('não transforma falha de relação em sucesso e preserva rollback paginado', async () => {
    const { result } = renderHook(() => useCompanies(), { wrapper });
    await waitFor(() => expect(result.current.companies).toHaveLength(1));
    const previous = client.getQueryData(queryKey);
    api.versioned.mockResolvedValue({ data: { ...raw, version: 4 }, error: null });
    api.update.mockResolvedValue({ data: null, error: new Error('Relação recusada') });
    await act(async () => { expect(await result.current.updateCompany(raw.id, { phone: '11888888888' })).toBeNull(); });
    expect(client.getQueryData(queryKey)).toEqual(previous);
    expect(api.toast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive', description: expect.stringContaining('Relação recusada') }));
  });

  it('propaga falha de arrays relacionados na criação', async () => {
    const { result } = renderHook(() => useCompanies(), { wrapper });
    await waitFor(() => expect(result.current.companies).toHaveLength(1));
    api.insert.mockImplementation((table: string) => Promise.resolve(table === 'companies'
      ? { data: { ...raw, id: 'empresa-2' }, error: null }
      : { data: null, error: new Error('Telefone recusado') }));
    await act(async () => {
      expect(await result.current.createCompany({ name: 'Nova', phones: [{ numero: '11888888888' }] })).toBeNull();
    });
    expect(api.insert).toHaveBeenCalledWith('companies', { nome_crm: 'Nova', user_id: raw.user_id });
    expect(api.insert).toHaveBeenCalledWith('company_phones', expect.objectContaining({ company_id: 'empresa-2', numero: '11888888888' }));
    expect(api.toast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive', description: expect.stringContaining('Telefone recusado') }));
  });
});
