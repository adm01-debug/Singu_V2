import React, { type PropsWithChildren } from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useContactDetail } from '@/hooks/useContactDetail';
import { normalizeExternalContact } from '@/hooks/useContacts';
import { queryClient as appQueryClient } from '@/app/queryClient';

const state = vi.hoisted(() => ({ read: vi.fn(), related: vi.fn(), external: vi.fn(), write: vi.fn(), network: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'proprietario' } }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/hooks/useActivityLogger', () => ({ useActivityLogger: () => ({ logActivity: vi.fn() }) }));
vi.mock('@/lib/trackScoreChange', () => ({ trackScoreChange: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/queryErrorReporter', () => ({ attachQueryErrorReporter: vi.fn() }));
vi.mock('@/lib/externalData', () => ({
  queryExternalData: state.external, insertExternalData: vi.fn(), updateExternalDataWithVersion: vi.fn(),
  deleteExternalData: vi.fn(), ConcurrentEditError: class extends Error {},
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  from: (table: string) => {
    let writing = false;
    return {
      select() { return this; }, eq() { return this; }, order() { return this; },
      update() { writing = true; return this; },
      limit: () => state.related(table),
      maybeSingle: () => writing ? state.write(table) : state.read(table),
    };
  }, channel: () => { throw new Error('Realtime desativado no teste'); }, removeChannel: vi.fn(),
} }));

const targets = ['interactions', 'insights', 'alerts', 'companies-local', 'companies-external'] as const;
type Target = typeof targets[number];
const contact = normalizeExternalContact({ id: 'contato', user_id: 'proprietario', company_id: 'empresa', version: 1 });
const company = { id: 'empresa', user_id: contact.user_id, name: 'Empresa confirmada' };
const populated = {
  contact, company, interactions: [{ id: 'interacao' }], insights: [{ id: 'insight' }], alerts: [{ id: 'alerta' }],
};
const fresh = {
  company: { ...company, name: 'Empresa atualizada' },
  interactions: [{ id: 'interacao-nova' }], insights: [{ id: 'insight-novo' }], alerts: [{ id: 'alerta-novo' }],
};
const key = ['contact', contact.user_id, contact.id];
const otherKey = ['contact', 'outra-conta', contact.id];
let cache: QueryClient;
let currentContact = contact;
const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={cache}>{children}</QueryClientProvider>;

type ReadError = Error | { message: string; code?: string; status?: number };

function configure(target: Target, error: ReadError | null) {
  state.read.mockImplementation((table: string) => Promise.resolve(table === 'contacts'
    ? { data: currentContact, error: null }
    : target === 'companies-local' && error ? { data: null, error }
    : { data: target === 'companies-external' ? null : fresh.company, error: null }));
  state.external.mockResolvedValue({ data: error ? null : [fresh.company], error });
  state.related.mockImplementation((table: 'interactions' | 'insights' | 'alerts') => Promise.resolve(
    target === table && error ? { data: null, error } : { data: fresh[table], error: null },
  ));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', state.network.mockRejectedValue(new Error('Rede externa bloqueada neste teste')));
  currentContact = contact;
  cache = new QueryClient({ defaultOptions: { queries: { retryDelay: 0, gcTime: Infinity } } });
  cache.setQueryData(otherKey, populated);
});
afterEach(() => {
  cleanup();
  cache.clear();
  vi.unstubAllGlobals();
  expect(state.network).not.toHaveBeenCalled();
});

describe('Política real de repetição da ficha', () => {
  beforeEach(() => {
    cache.clear();
    cache = new QueryClient({ defaultOptions: { queries: {
      ...appQueryClient.getDefaultOptions().queries, retryDelay: 0, staleTime: Infinity, gcTime: Infinity,
    } } });
    cache.setQueryData(key, populated);
    cache.setQueryData(otherKey, populated);
  });

  const permanent = ['42501', '42P01', 'PGRST204'];
  it('não repete erro permanente na carga inicial sem cache', async () => {
    cache.removeQueries({ queryKey: key, exact: true });
    configure('interactions', { message: 'Acesso negado', code: '42501' });
    const { result } = renderHook(() => useContactDetail(contact.id), { wrapper });
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(state.read.mock.calls.filter(([table]) => table === 'contacts')).toHaveLength(1);
    expect(cache.getQueryData(key)).toBeUndefined();
    expect(cache.getQueryData(otherKey)).toEqual(populated);
  });

  it.each(targets.flatMap(target => permanent.map(code => ({ target, code }))))(
    'não repete erro permanente $code de $target, mas permite nova tentativa manual', async ({ target, code }) => {
      configure(target, { message: 'Falha definitiva', code });
      const { result } = renderHook(() => useContactDetail(contact.id), { wrapper });
      await act(async () => { await result.current.refetch(); });
      expect(state.read.mock.calls.filter(([table]) => table === 'contacts')).toHaveLength(1);
      expect(cache.getQueryData(key)).toEqual(populated);
      expect(cache.getQueryData(otherKey)).toEqual(populated);
      await waitFor(() => expect(result.current.error).toBeTruthy());

      configure(target, null);
      await act(async () => { await result.current.refetch(); });
      await waitFor(() => expect(result.current.error).toBeNull());
      expect(cache.getQueryData(key)).toEqual({ contact, ...fresh });
    },
  );

  const transient: ReadError[] = [
    { message: 'Serviço indisponível', status: 503 },
    Object.assign(new Error('Serviço indisponível'), { status: 503 }),
    { message: 'Serviço indisponível', code: '503' },
    { message: 'Limite temporário', status: 429 },
    { message: 'Consulta excedeu o prazo', status: 408 },
    { message: 'Timeout do pool', code: 'PGRST003' },
    { message: 'Transação interrompida', code: '40001' },
    { message: 'Conexão perdida', code: '08006' },
    ...['40P01', '53000', '55P03', '57014', '57P01', '57P02', '57P03', 'PGRST000', 'PGRST001', 'PGRST002']
      .map(code => ({ message: 'Falha transitória', code })),
    ...[500, 502, 504].map(status => ({ message: 'Servidor indisponível', status })),
    { message: 'TypeError: Failed to fetch', code: '', status: 0 },
    new TypeError('Failed to fetch'),
    new Error('Edge function error [503]: unavailable'),
  ];
  it.each(targets.flatMap(target => transient.map(error => ({ target, error }))))(
    'recupera automaticamente a falha transitória de $target: $error', async ({ target, error }) => {
      configure(target, error);
      const mock = target === 'companies-external' ? state.external : target === 'companies-local' ? state.read : state.related;
      const failing = mock.getMockImplementation()!;
      mock.mockImplementation((table: unknown) => {
        const response = failing(table);
        if (target === 'companies-external' || table === (target === 'companies-local' ? 'companies' : target)) configure(target, null);
        return response;
      });
      const { result } = renderHook(() => useContactDetail(contact.id), { wrapper });
      await act(async () => { await result.current.refetch(); });
      await waitFor(() => expect(cache.getQueryData(key)).toEqual({ contact, ...fresh }));
      expect(state.read.mock.calls.filter(([table]) => table === 'contacts')).toHaveLength(2);
      expect(result.current.error).toBeNull();
      expect(cache.getQueryData(otherKey)).toEqual(populated);
    },
  );

  it.each([
    { message: 'Acesso negado', status: 403 },
    Object.assign(new Error('Acesso negado'), { status: 403 }),
    Object.assign(new Error('Acesso negado'), { status: 401 }),
    { message: 'Formato inválido', code: '22P02' },
    { message: 'Campo inválido', code: '23502' },
    { message: 'Não encontrado', code: 'PGRST116' },
    { message: 'Token inválido', code: 'PGRST301' },
    ...['42703', '28P01', 'PGRST200', 'PGRST202', 'PGRST303', '08P01', '40002']
      .map(code => ({ message: 'Falha permanente', code })),
    ...[400, 404, 409, 422, 501, 505].map(status => ({ message: 'Falha permanente', status })),
    new Error('Edge function error [403]: forbidden'),
    { message: 'Falha de permissão', code: '42501', status: 503 },
    { message: 'Erro não classificado', code: 'DESCONHECIDO' },
    new Error('Falha não classificada'),
    Object.assign(new Error('Network abort'), { name: 'AbortError' }),
  ])('não repete falha não transitória: %j', async error => {
    configure('interactions', error);
    const { result } = renderHook(() => useContactDetail(contact.id), { wrapper });
    await act(async () => { await result.current.refetch(); });
    expect(state.read.mock.calls.filter(([table]) => table === 'contacts')).toHaveLength(1);
    expect(cache.getQueryData(key)).toEqual(populated);
  });

  it('limita a três retries mesmo quando a falha transitória persiste', async () => {
    configure('interactions', { message: 'Serviço indisponível', status: 503 });
    const { result } = renderHook(() => useContactDetail(contact.id), { wrapper });
    await act(async () => { await result.current.refetch(); });
    expect(state.read.mock.calls.filter(([table]) => table === 'contacts')).toHaveLength(4);
    expect(cache.getQueryData(key)).toEqual(populated);
    await waitFor(() => expect(result.current.error).toBeTruthy());
    configure('interactions', null);
    await act(async () => { await result.current.refetch(); });
    await waitFor(() => expect(result.current.error).toBeNull());
    expect(state.read.mock.calls.filter(([table]) => table === 'contacts')).toHaveLength(5);
    expect(cache.getQueryData(key)).toEqual({ contact, ...fresh });
    expect(cache.getQueryData(otherKey)).toEqual(populated);
  });
});

describe('Mensagens seguras da ficha', () => {
  const cases = [
    { code: '42501', message: 'permission denied for table "crm_privado"', safe: 'Permissão negada para esta operação.' },
    { code: '42501', message: 'NetworkError in policy "crm_privado_admin"', safe: 'Permissão negada para esta operação.' },
    { code: '42P01', message: 'relation "crm_privado" does not exist', safe: 'Recurso não encontrado.' },
    { code: '42703', message: 'column crm_privado.cpf does not exist', safe: 'Não foi possível consultar o contato.' },
    { code: '23505', message: 'duplicate key violates constraint "crm_privado_cpf_key"', safe: 'Registro duplicado. Este item já existe.' },
    { code: 'PGRST204', message: "Could not find the 'cpf' column of 'crm_privado' in the schema cache", safe: 'Não foi possível consultar o contato.' },
    { message: 'Insert violates check constraint "crm_privado_check"', safe: 'Não foi possível consultar o contato.' },
    { message: 'Insert violates row-level security policy "crm_privado_admin"', safe: 'Não foi possível consultar o contato.' },
    { message: 'PostgREST JWT failure at https://interno.supabase.co', safe: 'Não foi possível consultar o contato.' },
    { message: 'Failed to fetch', safe: 'Erro de conexão. Verifique sua internet e tente novamente.' },
    { code: '40001', message: 'could not serialize access due to concurrent update', safe: 'Não foi possível consultar o contato.' },
    { message: 'Não autenticado', safe: 'Sessão expirada. Faça login novamente.' },
    { message: 'Contato não encontrado', safe: 'Contato não encontrado' },
    { message: '', safe: 'Não foi possível consultar o contato.' },
  ];
  it.each(targets.flatMap(target => [false, true].flatMap(cached => [false, true].flatMap(instance =>
    cases.map(payload => ({ target, cached, instance, ...payload })),
  ))))('protege mensagem de $target com cache=$cached, Error=$instance: $code/$message', async ({ target, cached, instance, code, message, safe }) => {
    if (cached) cache.setQueryData(key, populated);
    const error = instance ? Object.assign(new Error(message), { code }) : { code, message };
    configure(target, error);
    const { result } = renderHook(() => useContactDetail(contact.id), { wrapper });
    await act(async () => { await result.current.refetch(); });
    await waitFor(() => expect(result.current.error).toBe(safe));
    expect(cache.getQueryState(key)?.error).toBe(error);
    expect(cache.getQueryState(key)?.error).toMatchObject({ code, message });
    expect(state.read.mock.calls.filter(([table]) => table === 'contacts')).toHaveLength(message === 'Failed to fetch' || code === '40001' ? 4 : 1);
    expect(cache.getQueryData(key)).toEqual(cached ? populated : undefined);
    expect(cache.getQueryData(otherKey)).toEqual(populated);
    configure(target, null);
    await act(async () => { await result.current.refetch(); });
    await waitFor(() => expect(result.current.error).toBeNull());
    expect(cache.getQueryData(key)).toEqual({ contact, ...fresh });
  });

  it.each([false, true])('protege também a consulta principal com cache=%s', async cached => {
    if (cached) cache.setQueryData(key, populated);
    const error = { code: '42501', message: 'permission denied for table "crm_privado"' };
    configure('companies-local', null);
    state.read.mockResolvedValue({ data: null, error });
    const { result } = renderHook(() => useContactDetail(contact.id), { wrapper });
    await act(async () => { await result.current.refetch(); });
    await waitFor(() => expect(result.current.error).toBe('Permissão negada para esta operação.'));
    expect(cache.getQueryState(key)?.error).toBe(error);
    expect(state.read).toHaveBeenCalledOnce();
    expect(cache.getQueryData(key)).toEqual(cached ? populated : undefined);
    expect(cache.getQueryData(otherKey)).toEqual(populated);
    configure('companies-local', null);
    await act(async () => { await result.current.refetch(); });
    await waitFor(() => expect(result.current.error).toBeNull());
    expect(cache.getQueryData(key)).toEqual({ contact, ...fresh });
  });
});

describe('Falhas parciais da ficha com QueryClient real', () => {
  const cases = targets.flatMap(target => [false, true].flatMap(cached => [
    { target, cached, error: new Error('Serviço indisponível') },
    { target, cached, error: { message: 'Serviço indisponível', code: '503' } },
  ]));

  it.each(cases)('expõe falha de $target, preserva cache=$cached e permite nova tentativa: $error', async ({ target, cached, error }) => {
    if (cached) cache.setQueryData(key, populated);
    configure(target, error);
    const { result } = renderHook(() => useContactDetail(contact.id), { wrapper });
    await act(async () => { await result.current.refetch(); });
    await waitFor(() => expect(result.current.error).toBe('Serviço indisponível'));
    expect(result.current.contact).toEqual(cached ? contact : null);
    expect(result.current.company).toEqual(cached ? company : null);
    expect(result.current.interactions).toEqual(cached ? populated.interactions : []);
    expect(result.current.insights).toEqual(cached ? populated.insights : []);
    expect(result.current.alerts).toEqual(cached ? populated.alerts : []);
    expect(cache.getQueryData(key)).toEqual(cached ? populated : undefined);
    if (target === 'companies-local') expect(state.external).not.toHaveBeenCalled();
    if (target === 'companies-external') expect(state.external).toHaveBeenCalledWith({
      table: 'companies', filters: [{ type: 'eq', column: 'id', value: contact.company_id }],
    });

    configure(target, null);
    await act(async () => { await result.current.refetch(); });
    await waitFor(() => expect(result.current.error).toBeNull());
    expect(cache.getQueryData(key)).toEqual({ contact, ...fresh });
    expect(cache.getQueryData(otherKey)).toEqual(populated);
    expect(cache.getQueryState(otherKey)?.isInvalidated).toBe(false);
  });

  it.each(targets)('conserva a gravação confirmada durante falha de %s na releitura', async target => {
    cache.setQueryData(key, populated);
    configure(target, { message: 'Releitura indisponível', code: '503' });
    const saved = { ...contact, first_name: 'Nome salvo', version: 2 };
    state.write.mockImplementation(async () => { currentContact = saved; return { data: saved, error: null }; });
    const { result } = renderHook(() => useContactDetail(contact.id), { wrapper });
    await act(async () => { expect(await result.current.updateContact({ first_name: saved.first_name })).toEqual(saved); });
    await act(async () => { await result.current.refetch(); });
    await waitFor(() => expect(result.current.error).toBe('Releitura indisponível'));
    expect(result.current.contact).toEqual(saved);
    expect(cache.getQueryData(key)).toEqual({ ...populated, contact: saved });
    expect(cache.getQueryData(otherKey)).toEqual(populated);
  });

  it.each([false, true])('limpa relações vazias confirmadas sem erro; empresa externa=%s', async external => {
    cache.setQueryData(key, populated);
    configure(external ? 'companies-external' : 'companies-local', null);
    state.related.mockResolvedValue({ data: [], error: null });
    state.read.mockImplementation((table: string) => Promise.resolve({ data: table === 'contacts' ? contact : null, error: null }));
    state.external.mockResolvedValue({ data: external ? [fresh.company] : [], error: null });
    const { result } = renderHook(() => useContactDetail(contact.id), { wrapper });
    await act(async () => { await result.current.refetch(); });
    await waitFor(() => expect(cache.getQueryData(key)).toEqual({
      contact, company: external ? fresh.company : null, interactions: [], insights: [], alerts: [],
    }));
    expect(result.current.error).toBeNull();
  });

  it('não consulta empresa quando o contato não possui vínculo', async () => {
    currentContact = { ...contact, company_id: null };
    configure('companies-local', new Error('Esta consulta não deve ocorrer'));
    const { result } = renderHook(() => useContactDetail(contact.id), { wrapper });
    await waitFor(() => expect(result.current.contact).toEqual(currentContact));
    expect(result.current.company).toBeNull();
    expect(result.current.error).toBeNull();
    expect(state.read.mock.calls.map(([table]) => table)).toEqual(['contacts']);
    expect(state.external).not.toHaveBeenCalled();
  });
});
