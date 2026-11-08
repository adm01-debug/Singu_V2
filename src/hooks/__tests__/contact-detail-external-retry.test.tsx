import React, { type PropsWithChildren } from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useContactDetail } from '@/hooks/useContactDetail';
import { normalizeExternalContact } from '@/hooks/useContacts';
import { getCircuitBreaker } from '@/lib/circuitBreaker';

const mocks = vi.hoisted(() => ({ fetch: vi.fn(), read: vi.fn(), audit: vi.fn(), session: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'proprietario' } }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/hooks/useActivityLogger', () => ({ useActivityLogger: () => ({ logActivity: vi.fn() }) }));
vi.mock('@/lib/trackScoreChange', () => ({ trackScoreChange: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  auth: { getSession: mocks.session, onAuthStateChange: vi.fn() },
  from: (table: string) => ({
    select() { return this; }, eq() { return this; }, order() { return this; },
    maybeSingle: () => mocks.read(table),
    limit: async () => ({ data: [], error: null }), insert: mocks.audit,
  }),
  channel: () => { throw new Error('Realtime desativado no teste'); }, removeChannel: vi.fn(),
} }));

const contact = normalizeExternalContact({ id: 'contato', user_id: 'proprietario', company_id: 'empresa', version: 1 });
const company = { id: 'empresa', user_id: contact.user_id, nome_crm: 'Confirmada' };
const saved = { contact, company, interactions: [{ id: 'confirmada' }], insights: [], alerts: [] };
const key = ['contact', contact.user_id, contact.id];
const otherKey = ['contact', 'outra-conta', contact.id];
const response = (payload: unknown) => ({ ok: true, json: async () => payload });
const healthy = () => response({ data: [{ ...company, nome_crm: 'Atualizada' }], count: 1 });
let cache: QueryClient;
const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={cache}>{children}</QueryClientProvider>;

beforeEach(() => {
  vi.clearAllMocks();
  getCircuitBreaker('external-db').reset();
  vi.stubGlobal('fetch', mocks.fetch);
  mocks.session.mockResolvedValue({ data: { session: { user: { id: contact.user_id }, access_token: 'token-simulado' } } });
  mocks.audit.mockResolvedValue({ error: null });
  mocks.read.mockImplementation(async (table: string) => ({ data: table === 'contacts' ? contact : null, error: null }));
  cache = new QueryClient({ defaultOptions: { queries: { retryDelay: 0, staleTime: Infinity, gcTime: Infinity } } });
  cache.setQueryData(key, saved);
  cache.setQueryData(otherKey, saved);
});

describe('Consulta do contato disponível apenas na fonte externa', () => {
  const recovered = { ...contact, company_id: null, first_name: 'Recuperado' };
  const healthyContact = () => response({ data: [recovered], count: 1 });
  const emptyDetail = { contact: null, company: null, interactions: [], insights: [], alerts: [] };

  beforeEach(() => {
    mocks.read.mockResolvedValue({ data: null, error: null });
  });

  async function load(cached: boolean) {
    if (!cached) cache.removeQueries({ queryKey: key, exact: true });
    const hook = renderHook(() => useContactDetail(contact.id), { wrapper });
    if (cached) await act(async () => { await hook.result.current.refetch(); });
    return hook.result;
  }

  it.each([false, true].flatMap(cached => ['fallback', 'http', 'rede'].map(failure => ({ cached, failure }))))(
    'recupera falha transitória sem confundir com ausência: %j', async ({ cached, failure }) => {
      mocks.fetch.mockImplementationOnce(async () => {
        expect(cache.getQueryData(key)).toEqual(cached ? saved : undefined);
        if (failure === 'rede') throw new TypeError('Failed to fetch');
        return failure === 'http'
          ? { ok: false, status: 503, text: async () => 'Serviço temporariamente indisponível' }
          : response({ fallback: true, data: [], count: 0 });
      }).mockResolvedValue(healthyContact());
      const result = await load(cached);
      await waitFor(() => expect(result.current.contact?.first_name).toBe('Recuperado'));
      expect(result.current.error).toBeNull();
      expect(mocks.fetch).toHaveBeenCalledTimes(2);
      expect(mocks.read.mock.calls.map(([table]) => table)).toEqual(['contacts', 'contacts']);
      expect(mocks.fetch.mock.calls.map(([, init]) => JSON.parse(init.body).table)).toEqual(['contacts', 'contacts']);
      expect(cache.getQueryData(key)).toEqual({ ...emptyDetail, contact: recovered });
      expect(cache.getQueryData(otherKey)).toEqual(saved);
    },
  );

  it.each([false, true].flatMap(cached => [
    { code: '42501', safe: 'Permissão negada para esta operação.' },
    { code: 'PGRST204', safe: 'Não foi possível consultar o contato.' },
  ].map(error => ({ cached, ...error }))))(
    'preserva o erro permanente, sem retry, até nova tentativa manual: %j', async ({ cached, code, safe }) => {
      const message = "Could not find the 'cpf' column of 'crm_privado' in the schema cache";
      mocks.fetch.mockResolvedValue(response({ error: message, errorCode: code, data: [], count: 0 }));
      const result = await load(cached);
      await waitFor(() => expect(result.current.error).toBe(safe));
      expect(mocks.fetch).toHaveBeenCalledOnce();
      expect(cache.getQueryState(key)?.error).toMatchObject({ code, message });
      expect(cache.getQueryData(key)).toEqual(cached ? saved : undefined);
      expect(cache.getQueryData(otherKey)).toEqual(saved);
      mocks.fetch.mockResolvedValue(healthyContact());
      await act(async () => { await result.current.refetch(); });
      await waitFor(() => expect(result.current.contact?.first_name).toBe('Recuperado'));
      expect(result.current.error).toBeNull();
      expect(mocks.fetch).toHaveBeenCalledTimes(2);
    },
  );

  it.each([false, true])('limpa somente a ficha cuja ausência foi confirmada nas duas fontes; cache=%s', async cached => {
    mocks.fetch.mockResolvedValue(response({ data: [], count: 0 }));
    const result = await load(cached);
    await waitFor(() => expect(cache.getQueryData(key)).toEqual(emptyDetail));
    expect(result.current.contact).toBeNull();
    expect(result.current.error).toBeNull();
    expect(mocks.fetch).toHaveBeenCalledOnce();
    expect(cache.getQueryData(otherKey)).toEqual(saved);
  });

  it.each([false, true])('limita retries de indisponibilidade sem declarar ausência; cache=%s', async cached => {
    mocks.fetch.mockResolvedValue(response({ fallback: true, data: [], count: 0 }));
    const result = await load(cached);
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.error).not.toBe('Contato não encontrado');
    expect(mocks.fetch).toHaveBeenCalledTimes(3);
    expect(mocks.read).toHaveBeenCalledTimes(4);
    expect(cache.getQueryData(key)).toEqual(cached ? saved : undefined);
    expect(cache.getQueryData(otherKey)).toEqual(saved);
    getCircuitBreaker('external-db').reset();
    mocks.fetch.mockResolvedValue(healthyContact());
    await act(async () => { await result.current.refetch(); });
    await waitFor(() => expect(result.current.contact?.first_name).toBe('Recuperado'));
    expect(result.current.error).toBeNull();
  });
});
afterEach(() => { cleanup(); cache.clear(); vi.unstubAllGlobals(); });

describe('Recuperação da ficha com o cliente externo real e transporte simulado', () => {
  it.each([
    { fallback: true, data: [], count: 0 },
    { fallback: true, error: 'A fonte está indisponível', data: [], count: 0 },
    { fallback: true, error: 'Serviço em manutenção', errorCode: '08006', data: [], count: 0 },
  ])('recupera automaticamente a resposta degradada: %j', async payload => {
    mocks.fetch.mockImplementationOnce(async () => {
      expect(cache.getQueryData(key)).toEqual(saved);
      return response(payload);
    }).mockResolvedValue(healthy());
    const { result } = renderHook(() => useContactDetail(contact.id), { wrapper });
    await act(async () => { await result.current.refetch(); });
    await waitFor(() => expect(result.current.company?.nome_crm).toBe('Atualizada'));
    expect(result.current.error).toBeNull();
    expect(mocks.fetch).toHaveBeenCalledTimes(2);
    expect(mocks.read.mock.calls.filter(([table]) => table === 'contacts')).toHaveLength(2);
    expect(mocks.fetch.mock.calls.map(([, init]) => JSON.parse(init.body).table)).toEqual(['companies', 'companies']);
    expect(cache.getQueryData(otherKey)).toEqual(saved);
    expect(mocks.audit).toHaveBeenCalledOnce();
  });

  it.each([
    ['42501', 'Permissão negada para esta operação.'],
    ['42P01', 'Recurso não encontrado.'],
    ['PGRST204', 'Não foi possível consultar o contato.'],
  ].flatMap(([errorCode, safe]) => [false, true].map(fallback => ({ errorCode, safe, fallback }))))(
    'não repete erro permanente no envelope: %j', async ({ errorCode, safe, fallback }) => {
      const message = "Could not find the 'cpf' column of 'crm_privado' in the schema cache";
      mocks.fetch.mockResolvedValue(response({ fallback, errorCode, error: message, data: [], count: 0 }));
      const { result } = renderHook(() => useContactDetail(contact.id), { wrapper });
      await act(async () => { await result.current.refetch(); });
      await waitFor(() => expect(result.current.error).toBe(safe));
      expect(mocks.fetch).toHaveBeenCalledOnce();
      expect(cache.getQueryState(key)?.error).toMatchObject({ code: errorCode, message });
      expect(cache.getQueryData(key)).toEqual(saved);
      expect(cache.getQueryData(otherKey)).toEqual(saved);
      expect(mocks.audit).not.toHaveBeenCalled();
      mocks.fetch.mockResolvedValue(healthy());
      await act(async () => { await result.current.refetch(); });
      await waitFor(() => expect(result.current.error).toBeNull());
      expect(result.current.company?.nome_crm).toBe('Atualizada');
      expect(mocks.fetch).toHaveBeenCalledTimes(2);
    },
  );

  it('limita a indisponibilidade persistente e preserva o cache até a tentativa manual', async () => {
    mocks.fetch.mockResolvedValue(response({ fallback: true, data: [], count: 0 }));
    const { result } = renderHook(() => useContactDetail(contact.id), { wrapper });
    await act(async () => { await result.current.refetch(); });
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(mocks.fetch).toHaveBeenCalledTimes(3);
    expect(mocks.read.mock.calls.filter(([table]) => table === 'contacts')).toHaveLength(4);
    expect(cache.getQueryData(key)).toEqual(saved);
    expect(cache.getQueryData(otherKey)).toEqual(saved);
    expect(mocks.audit).not.toHaveBeenCalled();
    getCircuitBreaker('external-db').reset();
    mocks.fetch.mockResolvedValue(healthy());
    await act(async () => { await result.current.refetch(); });
    await waitFor(() => expect(result.current.company?.nome_crm).toBe('Atualizada'));
    expect(result.current.error).toBeNull();
  });
});
