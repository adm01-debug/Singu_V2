import React, { type PropsWithChildren } from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useContactDetail } from '@/hooks/useContactDetail';
import { normalizeExternalContact } from '@/hooks/useContacts';

const state = vi.hoisted(() => ({ read: vi.fn(), related: vi.fn(), external: vi.fn(), write: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'proprietario' } }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/hooks/useActivityLogger', () => ({ useActivityLogger: () => ({ logActivity: vi.fn() }) }));
vi.mock('@/lib/trackScoreChange', () => ({ trackScoreChange: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));
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

function configure(target: Target, error: Error | { message: string; code: string } | null) {
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
  currentContact = contact;
  cache = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  cache.setQueryData(otherKey, populated);
});
afterEach(() => { cleanup(); cache.clear(); });

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
