import React, { type PropsWithChildren } from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizeExternalContact, useContacts } from '@/hooks/useContacts';
import { useContactDetail } from '@/hooks/useContactDetail';
import { useRestoreEntity } from '@/hooks/useRestoreEntity';

const state = vi.hoisted(() => ({
  user: { id: 'usuario-A' }, read: vi.fn(), write: vi.fn(), updateExternal: vi.fn(),
  insertExternal: vi.fn(), deleteExternal: vi.fn(), queryExternal: vi.fn(),
  toast: vi.fn(), success: vi.fn(), error: vi.fn(),
}));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: state.user }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: state.toast }) }));
vi.mock('sonner', () => ({ toast: { success: state.success, error: state.error } }));
vi.mock('@/hooks/useActivityLogger', () => ({ useActivityLogger: () => ({ logActivity: vi.fn() }) }));
vi.mock('@/lib/trackScoreChange', () => ({ trackScoreChange: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/externalData', () => ({
  queryExternalData: state.queryExternal, updateExternalDataWithVersion: state.updateExternal,
  insertExternalData: state.insertExternal, deleteExternalData: state.deleteExternal,
  ConcurrentEditError: class ConcurrentEditError extends Error {},
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  from: (table: string) => {
    const filters: Record<string, unknown> = {}; let updates: unknown;
    return {
      select() { return this; }, order() { return this; },
      eq(k: string, v: unknown) { filters[k] = v; return this; },
      update(value: unknown) { updates = value; return this; },
      limit: () => Promise.resolve({ data: [], error: null }),
      maybeSingle: () => updates ? state.write(table, filters, updates) : state.read(table, filters),
    };
  }, channel: () => { throw new Error('Sem realtime sintético'); }, removeChannel: vi.fn(),
} }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(r => { resolve = r; });
  return { promise, resolve };
}
const old = normalizeExternalContact({ id: 'contato-1', user_id: 'usuario-A', first_name: 'Antigo', version: 1 });
const saved = { ...old, first_name: 'Salvo', version: 2 };
const detail = (contact = old) => ({ contact, company: null, interactions: [], insights: [], alerts: [] });
const key = ['contact', 'usuario-A', old.id];
const listKey = ['contacts', '__all__', 'usuario-A'];
const page = (items = [old]) => ({ pages: [{ items, totalCount: items.length }], pageParams: [0] });
let cache: QueryClient;
const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={cache}>{children}</QueryClientProvider>;
beforeEach(() => {
  vi.clearAllMocks(); state.user = { id: 'usuario-A' };
  state.read.mockReset().mockResolvedValue({ data: old, error: null });
  state.write.mockReset().mockResolvedValue({ data: saved, error: null });
  state.updateExternal.mockReset().mockResolvedValue({ data: saved, error: null });
  state.queryExternal.mockReset().mockResolvedValue({ data: [], error: null });
  state.insertExternal.mockReset().mockResolvedValue({ data: old, error: null });
  state.deleteExternal.mockReset().mockResolvedValue({ success: true, error: null });
  cache = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } } });
  cache.setQueryData(key, detail()); cache.setQueryData(listKey, page());
});
afterEach(() => { cleanup(); cache.clear(); });

describe('Confirmações de contato não regridem com respostas concorrentes', () => {
  it('descarta refetch anterior à gravação da ficha', async () => {
    const pending = deferred<{ data: typeof old; error: null }>();
    state.read.mockReturnValueOnce(pending.promise);
    const { result } = renderHook(() => useContactDetail(old.id), { wrapper });
    let refresh!: ReturnType<typeof result.current.refetch>;
    await act(async () => { refresh = result.current.refetch(); });
    await act(async () => { await result.current.updateContact({ first_name: saved.first_name }); });
    await act(async () => { pending.resolve({ data: old, error: null }); await refresh; });
    expect(cache.getQueryData(key)).toEqual(detail(saved));
  });

  it('descarta SELECT paginado anterior à gravação da lista', async () => {
    const pending = deferred<ReturnType<typeof page>>();
    const inFlight = cache.fetchQuery({ queryKey: listKey, queryFn: () => pending.promise, staleTime: 0 }).catch(() => null);
    const { result } = renderHook(() => useContacts(undefined, { enabled: false }), { wrapper });
    await act(async () => { await result.current.updateContact(old.id, { first_name: saved.first_name }, 1); });
    await act(async () => { pending.resolve(page()); await inFlight; });
    expect(cache.getQueryData(listKey)).toEqual(page([saved]));
  });

  it('falha de A preserva confirmação posterior de B e o contrato paginado', async () => {
    const other = { ...old, id: 'contato-2' };
    const otherSaved = { ...other, first_name: 'Bruno salvo', version: 2 };
    cache.setQueryData(listKey, page([old, other]));
    const pending = deferred<{ data: null; error: Error }>();
    state.updateExternal.mockImplementation((_table, id) => id === old.id ? pending.promise : Promise.resolve({ data: otherSaved, error: null }));
    const { result } = renderHook(() => useContacts(undefined, { enabled: false }), { wrapper });
    let first!: ReturnType<typeof result.current.updateContact>;
    await act(async () => { first = result.current.updateContact(old.id, { first_name: 'Pendente' }, 1); });
    await act(async () => { await result.current.updateContact(other.id, { first_name: otherSaved.first_name }, 1); });
    await act(async () => { pending.resolve({ data: null, error: new Error('Falha sintética') }); await first; });
    expect(cache.getQueryData(listKey)).toEqual(page([old, otherSaved]));
  });

  it('não substitui confirmação mais nova por resposta de escrita atrasada', async () => {
    const pending = deferred<{ data: typeof saved; error: null }>();
    const newest = { ...saved, first_name: 'Mais novo', version: 3 };
    state.updateExternal.mockReturnValueOnce(pending.promise).mockResolvedValueOnce({ data: newest, error: null });
    const { result } = renderHook(() => useContacts(undefined, { enabled: false }), { wrapper });
    let first!: ReturnType<typeof result.current.updateContact>;
    await act(async () => { first = result.current.updateContact(old.id, { first_name: saved.first_name }, 1); });
    await act(async () => { await result.current.updateContact(old.id, { first_name: newest.first_name }, 2); });
    await act(async () => { pending.resolve({ data: saved, error: null }); await first; });
    expect(cache.getQueryData(listKey)).toEqual(page([newest]));
  });

  it('exclusão confirmada limpa e invalida somente a ficha exata do proprietário', async () => {
    const otherKey = ['contact', 'usuario-B', old.id];
    cache.setQueryData(otherKey, detail());
    const { result } = renderHook(() => useContacts(undefined, { enabled: false }), { wrapper });
    await act(async () => { expect(await result.current.deleteContact(old.id)).toBe(true); });
    expect(cache.getQueryData(listKey)).toEqual(page([]));
    expect(cache.getQueryData(key)).toEqual({ ...detail(), contact: null });
    expect(cache.getQueryState(key)?.isInvalidated).toBe(true);
    expect(cache.getQueryState(otherKey)?.isInvalidated).toBe(false);
  });

  it('Desfazer invalida a ficha que antes confirmou ausência', async () => {
    cache.setQueryData(key, { ...detail(), contact: null });
    const { result } = renderHook(useRestoreEntity, { wrapper });
    await act(async () => { expect(await result.current.restore('contacts', old, [['contacts']])).toBe(true); });
    expect(cache.getQueryState(key)?.isInvalidated).toBe(true);
  });

  it('descarta leitura da ficha iniciada durante a escrita', async () => {
    const read = deferred<{ data: typeof old; error: null }>();
    const write = deferred<{ data: typeof saved; error: null }>();
    state.read.mockReturnValueOnce(read.promise); state.write.mockReturnValueOnce(write.promise);
    const { result } = renderHook(() => useContactDetail(old.id), { wrapper });
    let mutation!: ReturnType<typeof result.current.updateContact>;
    let refresh!: ReturnType<typeof result.current.refetch>;
    await act(async () => { mutation = result.current.updateContact({ first_name: saved.first_name }); });
    await act(async () => { refresh = result.current.refetch(); });
    await act(async () => { write.resolve({ data: saved, error: null }); await mutation; });
    await act(async () => { read.resolve({ data: old, error: null }); await refresh; });
    expect(cache.getQueryData(key)).toEqual(detail(saved));
  });

  it('descarta leitura da lista iniciada durante a escrita', async () => {
    const read = deferred<ReturnType<typeof page>>();
    const write = deferred<{ data: typeof saved; error: null }>();
    state.updateExternal.mockReturnValueOnce(write.promise);
    const { result } = renderHook(() => useContacts(undefined, { enabled: false }), { wrapper });
    let mutation!: ReturnType<typeof result.current.updateContact>;
    await act(async () => { mutation = result.current.updateContact(old.id, { first_name: saved.first_name }, 1); });
    const refresh = cache.fetchQuery({ queryKey: listKey, queryFn: () => read.promise, staleTime: 0 }).catch(() => null);
    await act(async () => { write.resolve({ data: saved, error: null }); await mutation; });
    await act(async () => { read.resolve(page()); await refresh; });
    expect(cache.getQueryData(listKey)).toEqual(page([saved]));
  });

  it('mantém a maior versão da ficha quando as confirmações chegam fora de ordem', async () => {
    const write = deferred<{ data: typeof saved; error: null }>();
    const newest = { ...saved, version: 3 };
    state.write.mockReturnValueOnce(write.promise).mockResolvedValueOnce({ data: newest, error: null });
    const { result } = renderHook(() => useContactDetail(old.id), { wrapper });
    let mutation!: ReturnType<typeof result.current.updateContact>;
    await act(async () => { mutation = result.current.updateContact({ first_name: saved.first_name }); });
    await act(async () => { await result.current.updateContact({ first_name: newest.first_name }); });
    await act(async () => { write.resolve({ data: saved, error: null }); await mutation; });
    expect(cache.getQueryData(key)).toEqual(detail(newest));
  });

  it('duas falhas no mesmo contato não ressuscitam nenhuma edição pendente', async () => {
    const first = deferred<{ data: null; error: Error }>();
    const second = deferred<{ data: null; error: Error }>();
    state.updateExternal.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { result } = renderHook(() => useContacts(undefined, { enabled: false }), { wrapper });
    let a!: ReturnType<typeof result.current.updateContact>; let b!: typeof a;
    await act(async () => { a = result.current.updateContact(old.id, { first_name: 'A' }, 1); });
    await act(async () => { b = result.current.updateContact(old.id, { first_name: 'B' }, 1); });
    await act(async () => { first.resolve({ data: null, error: new Error('A recusada') }); await a; });
    await act(async () => { second.resolve({ data: null, error: new Error('B recusada') }); await b; });
    expect(cache.getQueryData(listKey)).toEqual(page());
  });

  it('exclusão recusada não apaga edição confirmada enquanto aguardava', async () => {
    const removal = deferred<{ success: boolean; error: Error }>();
    state.deleteExternal.mockReturnValueOnce(removal.promise);
    const { result } = renderHook(() => useContacts(undefined, { enabled: false }), { wrapper });
    let deletion!: ReturnType<typeof result.current.deleteContact>;
    await act(async () => { deletion = result.current.deleteContact(old.id); });
    await act(async () => { await result.current.updateContact(old.id, { first_name: saved.first_name }, 1); });
    await act(async () => { removal.resolve({ success: false, error: new Error('Exclusão recusada') }); expect(await deletion).toBe(false); });
    expect(cache.getQueryData(listKey)).toEqual(page([saved]));
    expect(cache.getQueryData(key)).toEqual(detail());
  });

  it('resposta de escrita anterior à exclusão não ressuscita a ficha', async () => {
    const write = deferred<{ data: typeof saved; error: null }>();
    state.write.mockReturnValueOnce(write.promise);
    const card = renderHook(() => useContactDetail(old.id), { wrapper });
    const list = renderHook(() => useContacts(undefined, { enabled: false }), { wrapper });
    let mutation!: ReturnType<typeof card.result.current.updateContact>;
    await act(async () => { mutation = card.result.current.updateContact({ first_name: saved.first_name }); });
    await act(async () => { expect(await list.result.current.deleteContact(old.id)).toBe(true); });
    await act(async () => { write.resolve({ data: saved, error: null }); await mutation; });
    expect(cache.getQueryData(key)).toEqual({ ...detail(), contact: null });
    expect(cache.getQueryData(listKey)).toEqual(page([]));
  });

  it('leitura antiga da lista não apaga contato recém-criado', async () => {
    const read = deferred<ReturnType<typeof page>>();
    const refresh = cache.fetchQuery({ queryKey: listKey, queryFn: () => read.promise, staleTime: 0 }).catch(() => null);
    const created = { ...saved, id: 'novo-contato' };
    state.insertExternal.mockResolvedValueOnce({ data: created, error: null });
    const { result } = renderHook(() => useContacts(undefined, { enabled: false }), { wrapper });
    await act(async () => { expect(await result.current.createContact({ first_name: 'Novo' })).toEqual(created); });
    await act(async () => { read.resolve(page()); await refresh; });
    expect(cache.getQueryData(listKey)).toEqual(page([created, old]));
  });

  it.each(['contacts', 'companies', 'tasks'] as const)('preserva restauração comprovada de %s', async table => {
    const snapshot = Object.freeze({ id: old.id, user_id: old.user_id });
    state.insertExternal.mockResolvedValue({ data: { ...snapshot }, error: null });
    const { result } = renderHook(useRestoreEntity, { wrapper });
    await act(async () => { expect(await result.current.restore(table, snapshot)).toBe(true); });
    expect(state.insertExternal).toHaveBeenCalledExactlyOnceWith(table, snapshot);
    expect(state.success).toHaveBeenCalledOnce();
  });

  it('preserva snapshot para tentativa explícita e não repete INSERT automaticamente', async () => {
    const snapshot = Object.freeze({ id: old.id, user_id: old.user_id });
    state.insertExternal.mockResolvedValueOnce({ data: null, error: null });
    const { result } = renderHook(useRestoreEntity, { wrapper });
    await act(async () => { expect(await result.current.restore('contacts', snapshot)).toBe(false); });
    expect(state.insertExternal).toHaveBeenCalledTimes(1);
    await act(async () => { expect(await result.current.restore('contacts', snapshot)).toBe(true); });
    expect(state.insertExternal).toHaveBeenNthCalledWith(2, 'contacts', snapshot);
    expect(state.success).toHaveBeenCalledOnce();
  });

  it.each([null, { ...old, id: 'outro' }, { ...old, user_id: 'usuario-B' }, { ...old, deleted_at: '2026-10-27' }])('rejeita restauração sem identidade ativa confirmada: %j', async data => {
    state.insertExternal.mockResolvedValue({ data, error: null });
    const { result } = renderHook(useRestoreEntity, { wrapper });
    await act(async () => { expect(await result.current.restore('contacts', old)).toBe(false); });
    expect(state.success).not.toHaveBeenCalled();
    expect(state.error).toHaveBeenCalledOnce();
    expect(cache.getQueryData(key)).toEqual(detail());
  });
});
