import React, { type PropsWithChildren } from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizeExternalContact, useContacts } from '@/hooks/useContacts';
import { useContactDetail, type ContactDetailData } from '@/hooks/useContactDetail';
import { deleteExternalData } from '@/lib/externalData';

const state = vi.hoisted(() => ({
  read: vi.fn(), write: vi.fn(), query: vi.fn(), insert: vi.fn(), update: vi.fn(), related: vi.fn(),
}));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'usuario-A' } }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/hooks/useActivityLogger', () => ({ useActivityLogger: () => ({ logActivity: vi.fn() }) }));
vi.mock('@/lib/trackScoreChange', () => ({ trackScoreChange: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/externalData', () => ({
  queryExternalData: state.query, insertExternalData: state.insert, updateExternalDataWithVersion: state.update,
  deleteExternalData: vi.fn(), ConcurrentEditError: class extends Error {},
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  from: (table: string) => {
    let updates: unknown;
    const filters: Record<string, unknown> = {};
    return {
      select() { return this; }, order() { return this; },
      eq(key: string, value: unknown) { filters[key] = value; return this; },
      update(value: unknown) { updates = value; return this; },
      limit: () => state.related(table),
      maybeSingle: () => updates ? state.write(table, filters, updates) : state.read(table, filters),
    };
  }, channel: () => { throw new Error('Realtime indisponível no teste'); }, removeChannel: vi.fn(),
} }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(r => { resolve = r; });
  return { promise, resolve };
}
const old = normalizeExternalContact({ id: 'contato-1', user_id: 'usuario-A', first_name: 'Antigo', version: 1 });
const saved = { ...old, first_name: 'Salvo', version: 2 };
const created = { ...old, id: 'contato-novo', first_name: 'Novo' };
const response = (data = [old], count = data.length) => ({ data, count, error: null });
const detail = () => ({ contact: old, company: null, interactions: [], insights: [], alerts: [] });
const key = ['contact', old.user_id, old.id];
const listKey = ['contacts', '__all__', old.user_id];
let cache: QueryClient;
const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={cache}>{children}</QueryClientProvider>;
beforeEach(() => {
  vi.clearAllMocks();
  state.read.mockReset().mockResolvedValue({ data: old, error: null });
  state.write.mockReset().mockResolvedValue({ data: saved, error: null });
  state.query.mockReset().mockResolvedValue(response());
  state.insert.mockReset().mockResolvedValue({ data: created, error: null });
  state.update.mockReset().mockResolvedValue({ data: saved, error: null });
  state.related.mockReset().mockResolvedValue({ data: [], error: null });
  cache = new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0, gcTime: Infinity } } });
});
afterEach(() => { cleanup(); cache.clear(); });

describe('Carga inicial e paginação reais do hook durante gravações', () => {
  it('recarrega a primeira página completa quando a criação cancela a leitura inicial', async () => {
    const initial = deferred<ReturnType<typeof response>>();
    state.query.mockReturnValueOnce(initial.promise).mockResolvedValue(response([created, old]));
    const { result } = renderHook(() => useContacts(), { wrapper });
    await waitFor(() => expect(state.query).toHaveBeenCalledOnce());
    await act(async () => { expect(await result.current.createContact({ first_name: 'Novo' })).toEqual(created); });
    await act(async () => { initial.resolve(response()); });
    await waitFor(() => expect(result.current.contacts.map(c => c.id)).toEqual([created.id, old.id]));
    expect(result.current.totalCount).toBe(2);
    expect(state.query).toHaveBeenCalledTimes(2);
    expect(state.query).toHaveBeenLastCalledWith(expect.objectContaining({ range: { from: 0, to: 49 }, countMethod: 'exact' }));
  });

  it('mantém a leitura inicial enquanto o INSERT está pendente e quando ele falha', async () => {
    const initial = deferred<ReturnType<typeof response>>();
    const write = deferred<{ data: null; error: Error }>();
    state.query.mockReturnValueOnce(initial.promise);
    state.insert.mockReturnValueOnce(write.promise);
    const { result } = renderHook(() => useContacts(), { wrapper });
    let mutation!: ReturnType<typeof result.current.createContact>;
    await act(async () => { mutation = result.current.createContact({ first_name: 'Novo' }); });
    await act(async () => { initial.resolve(response()); });
    await waitFor(() => expect(result.current.contacts).toEqual([old]));
    await act(async () => { write.resolve({ data: null, error: new Error('INSERT recusado') }); expect(await mutation).toBeNull(); });
    expect(result.current.contacts).toEqual([old]);
  });

  it('não duplica um contato já incluído na primeira leitura que terminou durante o INSERT', async () => {
    const initial = deferred<ReturnType<typeof response>>();
    const write = deferred<{ data: typeof created; error: null }>();
    state.query.mockReturnValueOnce(initial.promise);
    state.insert.mockReturnValueOnce(write.promise);
    const { result } = renderHook(() => useContacts(), { wrapper });
    let mutation!: ReturnType<typeof result.current.createContact>;
    await act(async () => { mutation = result.current.createContact({ first_name: 'Novo' }); });
    await act(async () => { initial.resolve(response([created, old])); });
    await waitFor(() => expect(result.current.contacts).toHaveLength(2));
    await act(async () => { write.resolve({ data: created, error: null }); await mutation; });
    expect(result.current.contacts.map(c => c.id)).toEqual([created.id, old.id]);
    expect(result.current.totalCount).toBe(2);
  });

  it('recupera a carga inicial também após UPDATE confirmado sem páginas no cache', async () => {
    const initial = deferred<ReturnType<typeof response>>();
    state.query.mockReturnValueOnce(initial.promise).mockResolvedValue(response([saved]));
    const { result } = renderHook(() => useContacts(), { wrapper });
    await waitFor(() => expect(state.query).toHaveBeenCalledOnce());
    await act(async () => { expect(await result.current.updateContact(old.id, { first_name: saved.first_name }, 1)).toEqual(saved); });
    await act(async () => { initial.resolve(response()); });
    await waitFor(() => expect(result.current.contacts).toEqual([saved]));
  });

  it.each(['criar', 'editar'])('cancela fetchNextPage real sem perder páginas nem a confirmação ao %s', async operation => {
    const first = Array.from({ length: 50 }, (_, i) => ({ ...old, id: `contato-${i}` }));
    const next = deferred<ReturnType<typeof response>>();
    const tail = { ...old, id: 'ultima-pagina' };
    let rows = [...first, tail];
    let nextReads = 0;
    state.query.mockImplementation(({ range, countMethod }) => {
      if (range.from === 50 && ++nextReads === 1) return next.promise;
      return Promise.resolve(response(rows.slice(range.from, range.to + 1), countMethod === 'exact' ? rows.length : null));
    });
    state.insert.mockImplementation(async () => {
      rows = [created, ...rows];
      return { data: created, error: null };
    });
    state.update.mockImplementation(async () => {
      rows = rows.map(c => c.id === saved.id ? saved : c);
      return { data: saved, error: null };
    });
    const { result } = renderHook(() => useContacts(), { wrapper });
    await waitFor(() => expect(result.current.contacts).toHaveLength(50));
    await act(async () => { result.current.loadMore(); });
    await waitFor(() => expect(state.query).toHaveBeenCalledTimes(2));
    expect(state.query).toHaveBeenLastCalledWith(expect.objectContaining({ range: { from: 50, to: 99 } }));
    await act(async () => {
      if (operation === 'criar') await result.current.createContact({ first_name: 'Novo' });
      else await result.current.updateContact(old.id, { first_name: saved.first_name }, 1);
    });
    await act(async () => { next.resolve(response([tail])); });
    const expected = operation === 'criar' ? [created, ...first.slice(0, 49)] : first.map(c => c.id === saved.id ? saved : c);
    expect(cache.getQueryData<{ pages: { items: unknown[] }[] }>(listKey)?.pages.flatMap(page => page.items)).toEqual(expected);
    await waitFor(() => expect(result.current.contacts).toEqual(expected));
    expect(result.current.totalCount).toBe(operation === 'criar' ? 52 : 51);
    await act(async () => { result.current.loadMore(); });
    await waitFor(() => expect(result.current.contacts).toEqual(rows));
    expect(new Set(result.current.contacts.map(c => c.id)).size).toBe(rows.length);
    expect(state.query).toHaveBeenLastCalledWith(expect.objectContaining({ range: { from: 50, to: 99 } }));
  });

  it('permite repetir a leitura após falha na recarga, sem repetir o INSERT confirmado', async () => {
    const initial = deferred<ReturnType<typeof response>>();
    state.query.mockReturnValueOnce(initial.promise)
      .mockResolvedValueOnce({ data: null, error: new Error('Recarga indisponível') })
      .mockResolvedValue(response([created, old]));
    const { result } = renderHook(() => useContacts(), { wrapper });
    await waitFor(() => expect(state.query).toHaveBeenCalledOnce());
    await act(async () => { expect(await result.current.createContact({ first_name: 'Novo' })).toEqual(created); });
    await act(async () => { initial.resolve(response()); });
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(cache.getQueryData(listKey)).toBeUndefined();
    await act(async () => { await result.current.fetchContacts(); });
    await waitFor(() => expect(result.current.contacts).toEqual([created, old]));
    expect(state.insert).toHaveBeenCalledOnce();
    expect(result.current.totalCount).toBe(2);
  });
});

describe('Redistribuição das páginas carregadas após criação', () => {
  it('mantém a próxima página quando uma exclusão local encurta uma página antes cheia', async () => {
    const first = Array.from({ length: 50 }, (_, i) => ({ ...old, id: `contato-${i}` }));
    state.query.mockResolvedValue(response(first, 100));
    vi.mocked(deleteExternalData).mockResolvedValueOnce({ success: true, error: null });
    const { result } = renderHook(() => useContacts(), { wrapper });
    await waitFor(() => expect(result.current.contacts).toHaveLength(50));
    await act(async () => { expect(await result.current.deleteContact(first[0].id)).toBe(true); });
    await waitFor(() => expect(result.current.contacts).toHaveLength(49));
    expect(result.current.hasMore).toBe(true);
  });

  it.each([0, 1, 49])('encerra fetchAll após página final de %i registros com total desatualizado', async size => {
    const first = Array.from({ length: 50 }, (_, i) => ({ ...old, id: `contato-${i}` }));
    const last = Array.from({ length: size }, (_, i) => ({ ...old, id: `final-${i}` }));
    state.query.mockImplementation(({ range }) => Promise.resolve(range.from === 0 ? response(first, 200)
      : range.from === 50 ? response(last, null)
      : { data: null, error: new Error('Consulta além do fim real') }));
    const { result } = renderHook(() => useContacts(undefined, { fetchAll: true }), { wrapper });
    await waitFor(() => expect(state.query.mock.calls.length).toBeGreaterThanOrEqual(2));
    await waitFor(() => expect(result.current.hasMore).toBe(false));
    expect(result.current.contacts).toEqual([...first, ...last]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    await act(async () => { await result.current.loadMore(); });
    expect(state.query.mock.calls.map(([query]) => query.range.from)).toEqual([0, 50]);
  });

  it.each([49, 51, 99, 100, 101])('preserva contagem e offsets num total inicial de %i contatos', async total => {
    let rows = Array.from({ length: total }, (_, i) => ({ ...old, id: `contato-${i}` }));
    state.query.mockImplementation(({ range, countMethod }) => Promise.resolve(
      response(rows.slice(range.from, range.to + 1), countMethod === 'exact' ? rows.length : null),
    ));
    state.insert.mockImplementation(async () => {
      rows = [created, ...rows];
      return { data: created, error: null };
    });
    const { result } = renderHook(() => useContacts(), { wrapper });
    await waitFor(() => expect(result.current.contacts).toHaveLength(Math.min(total, 50)));
    await act(async () => { result.current.loadMore(); });
    await waitFor(() => expect(result.current.contacts).toHaveLength(Math.min(total, 100)));
    await act(async () => { await result.current.createContact({ first_name: 'Novo' }); });
    await waitFor(() => expect(result.current.contacts).toEqual(rows.slice(0, 100)));
    expect(result.current.totalCount).toBe(total + 1);
    if (total < 100) {
      expect(result.current.hasMore).toBe(false);
      const reads = state.query.mock.calls.length;
      await act(async () => { result.current.loadMore(); });
      expect(state.query).toHaveBeenCalledTimes(reads);
      expect(state.query).not.toHaveBeenCalledWith(expect.objectContaining({ range: { from: 100, to: 149 } }));
    }
    expect(cache.getQueryData<{ pages: { items: unknown[] }[] }>(listKey)?.pages.every(page => page.items.length <= 50)).toBe(true);
    if (total >= 100) await act(async () => { result.current.loadMore(); });
    await waitFor(() => expect(result.current.contacts).toEqual(rows));
    expect(new Set(result.current.contacts.map(c => c.id)).size).toBe(rows.length);
    if (total === 49 || total === 99) {
      const next = { ...created, id: 'segundo-novo' };
      state.insert.mockImplementationOnce(async () => { rows = [next, ...rows]; return { data: next, error: null }; });
      await act(async () => { await result.current.createContact({ first_name: next.first_name }); });
      await waitFor(() => expect(result.current.hasMore).toBe(true));
      await act(async () => { await result.current.loadMore(); });
      await waitFor(() => expect(result.current.contacts).toEqual(rows));
      expect(result.current.hasMore).toBe(false);
    }
  });
});

describe('Revalidação dos dados relacionados da ficha após confirmação', () => {
  it.each([false, true])('retorna ficha vazia quando ambas fontes confirmam ausência; cache=%s', async cached => {
    const populated = { ...detail(), company: { id: 'empresa-antiga' }, interactions: [{ id: 'interacao-antiga' }], insights: [{ id: 'insight-antigo' }], alerts: [{ id: 'alerta-antigo' }] };
    if (cached) cache.setQueryData(key, populated);
    state.read.mockResolvedValue({ data: null, error: null });
    state.query.mockResolvedValue(response([]));
    state.related.mockResolvedValue({ data: [{ id: 'relacao-obsoleta' }], error: null });
    const { result } = renderHook(() => useContactDetail(old.id), { wrapper });
    await act(async () => { await result.current.refetch(); });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.contact).toBeNull();
    expect(result.current.error).toBeNull();
    expect(cache.getQueryData(key)).toEqual({ ...detail(), contact: null });
  });

  it.each([new Error('Fonte indisponível'), { message: 'Fonte indisponível', code: '503' }])('preserva a ficha quando o fallback externo falha: %j', async error => {
    cache.setQueryData(key, detail());
    state.read.mockResolvedValue({ data: null, error: null });
    state.query.mockResolvedValue({ data: null, error });
    const { result } = renderHook(() => useContactDetail(old.id), { wrapper });
    await act(async () => { await result.current.refetch(); });
    await waitFor(() => expect(result.current.error).toBe('Fonte indisponível'));
    expect(result.current.contact).toEqual(old);
    expect(cache.getQueryData(key)).toEqual(detail());
  });

  it.each([false, true])('incorpora interações, insights e alertas; escrita concorrente=%s', async concurrent => {
    cache.setQueryData(key, detail());
    const initial = deferred<{ data: typeof old; error: null }>();
    const write = deferred<{ data: typeof saved; error: null }>();
    state.read.mockReturnValueOnce(initial.promise).mockResolvedValue({ data: old, error: null });
    state.write.mockReturnValueOnce(write.promise);
    state.related.mockImplementation((table: string) => Promise.resolve({ data: [{ id: `${table}-novo` }], error: null }));
    const { result } = renderHook(() => useContactDetail(old.id), { wrapper });
    let mutation: ReturnType<typeof result.current.updateContact> | undefined;
    let refresh!: ReturnType<typeof result.current.refetch>;
    if (concurrent) await act(async () => { mutation = result.current.updateContact({ first_name: saved.first_name }); });
    await act(async () => { refresh = result.current.refetch(); });
    if (concurrent) await act(async () => { write.resolve({ data: saved, error: null }); await mutation; });
    await act(async () => { initial.resolve({ data: old, error: null }); await refresh; });
    await waitFor(() => expect(cache.getQueryData<ContactDetailData>(key)?.interactions).toEqual([{ id: 'interactions-novo' }]));
    const actual = cache.getQueryData<ContactDetailData>(key)!;
    expect(actual.insights).toEqual([{ id: 'insights-novo' }]);
    expect(actual.alerts).toEqual([{ id: 'alerts-novo' }]);
    expect(actual.contact).toEqual(concurrent ? saved : old);
  });

  it('revalida mesmo quando a leitura foi cancelada antes de iniciar a escrita', async () => {
    cache.setQueryData(key, detail());
    const initial = deferred<{ data: typeof old; error: null }>();
    state.read.mockReturnValueOnce(initial.promise).mockResolvedValue({ data: old, error: null });
    state.related.mockResolvedValue({ data: [{ id: 'nova-relacao' }], error: null });
    const { result } = renderHook(() => useContactDetail(old.id), { wrapper });
    await act(async () => { void result.current.refetch(); });
    await act(async () => { await result.current.updateContact({ first_name: saved.first_name }); });
    await act(async () => { initial.resolve({ data: old, error: null }); });
    await waitFor(() => expect(cache.getQueryData<ContactDetailData>(key)?.interactions).toEqual([{ id: 'nova-relacao' }]));
    expect(cache.getQueryData<ContactDetailData>(key)?.contact).toEqual(saved);
  });

  it('mantém a gravação confirmada se a revalidação falha, sem tocar outra conta', async () => {
    cache.setQueryData(key, detail());
    const otherKey = ['contact', 'usuario-B', old.id];
    cache.setQueryData(otherKey, detail());
    state.read.mockResolvedValue({ data: null, error: new Error('GET indisponível') });
    const { result } = renderHook(() => useContactDetail(old.id), { wrapper });
    await act(async () => { expect(await result.current.updateContact({ first_name: saved.first_name })).toEqual(saved); });
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.contact).toEqual(saved);
    expect(cache.getQueryData<ContactDetailData>(key)?.contact).toEqual(saved);
    expect(cache.getQueryData(otherKey)).toEqual(detail());
    expect(cache.getQueryState(otherKey)?.isInvalidated).toBe(false);
  });

  it('consulta a empresa da versão confirmada quando a releitura retorna o contato antigo', async () => {
    cache.setQueryData(key, detail());
    const withCompany = { ...saved, company_id: 'empresa-nova' };
    const company = { id: withCompany.company_id, user_id: old.user_id };
    state.write.mockResolvedValue({ data: withCompany, error: null });
    state.read.mockImplementation((table: string) => Promise.resolve({ data: table === 'contacts' ? old : company, error: null }));
    const { result } = renderHook(() => useContactDetail(old.id), { wrapper });
    await act(async () => { await result.current.updateContact({ company_id: withCompany.company_id }); });
    expect(cache.getQueryData<ContactDetailData>(key)?.contact).toEqual(withCompany);
    expect(cache.getQueryData<ContactDetailData>(key)?.company).toEqual(company);
    expect(state.read).toHaveBeenCalledWith('companies', { id: withCompany.company_id, user_id: old.user_id });
  });
});
