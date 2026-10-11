import { createElement, type ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, type InfiniteData } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizeExternalContact, prepareContactWrite, useContacts, type Contact } from '../useContacts';

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

const raw = { id: 'contato-1', user_id: 'usuario-teste', version: 7, first_name: 'Ana', last_name: 'Silva' };
const queryKey = ['contacts', '__all__', 'usuario-teste'];
type Page = { items: Contact[]; totalCount: number | null };
let client: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children);

beforeEach(() => {
  vi.resetAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  api.query.mockResolvedValue({ data: [raw], count: 1, error: null });
});

describe('contrato canônico de contatos', () => {
  it('normaliza arrays legados e preserva a versão real', () => {
    const contact = normalizeExternalContact({
      ...raw, cargo: 'Compradora', tags_array: '["cliente"]', interests_array: 'tecnologia, design', hobbies: null,
      tags: [], interests: [], updated_at: '2026-01-01T00:00:00Z',
    });
    expect(contact).toMatchObject({ tags: ['cliente'], interests: ['tecnologia', 'design'], hobbies: [], role_title: 'Compradora', version: 7 });
  });

  it.each(['{}', '42', 'true', '[1]', '["incompleto"', '"texto"'])('rejeita JSON de array inválido: %s', tags_array => {
    expect(() => normalizeExternalContact({ ...raw, tags_array })).toThrow();
  });

  it('respeita arrays canônicos vazios em vez de ressuscitar aliases legados', () => {
    expect(normalizeExternalContact({ ...raw, tags_array: [], interests_array: [], tags: ['legado'], interests: ['legado'] })).toMatchObject({ tags: [], interests: [] });
  });

  it('rejeita uma versão ausente em vez de fabricar timestamp', () => {
    const { version, ...withoutVersion } = raw;
    expect(() => normalizeExternalContact({ ...withoutVersion, updated_at: '2026-01-01T00:00:00Z' })).toThrow();
  });

  it('preserva campos diretos reais e exclui full_name das escritas em runtime', () => {
    const input = {
      id: raw.id, version: 7, full_name: 'Nunca gravar', email: 'ana@example.test', phone: '11999999999',
      avatar_url: '/avatar.png', family_info: 'Família', role_title: 'Compradora', tags: ['cliente'],
      interests: ['design'], vak_profile: { primary: 'visual' }, objection_patterns: ['prazo'],
    };
    expect(prepareContactWrite(input)).toEqual({
      email: 'ana@example.test', phone: '11999999999', avatar_url: '/avatar.png', family_info: 'Família',
      role_title: 'Compradora', cargo: 'Compradora', tags: ['cliente'], tags_array: ['cliente'],
      interests: ['design'], interests_array: ['design'], vak_profile: { primary: 'visual' }, objection_patterns: ['prazo'],
    });
  });

  it('não adiciona defaults nulos a updates esparsos e permite limpar cargo', () => {
    expect(prepareContactWrite({ role_title: null })).toEqual({ role_title: null, cargo: null });
    expect(prepareContactWrite({ notes: 'Nota' })).toEqual({ notes: 'Nota' });
  });

  it('propaga JSON inválido ao consumidor do hook', async () => {
    api.query.mockResolvedValue({ data: [{ ...raw, tags_array: '{"inválido":true}' }], count: 1, error: null });
    const { result } = renderHook(() => useContacts(), { wrapper });
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.contacts).toEqual([]);
  });

  it('insere contato no cache InfiniteData<Page> e nunca escreve full_name', async () => {
    api.insert.mockResolvedValue({ data: { ...raw, id: 'contato-2' }, error: null });
    const { result } = renderHook(() => useContacts(), { wrapper });
    await waitFor(() => expect(result.current.contacts).toHaveLength(1));
    const input = { first_name: 'Ana', last_name: 'Silva', full_name: 'Gerado', email: 'ana@example.test' };
    await act(async () => { await result.current.createContact(input); });
    expect(api.insert).toHaveBeenCalledWith('contacts', { first_name: 'Ana', last_name: 'Silva', email: 'ana@example.test', user_id: raw.user_id });
    const cached = client.getQueryData<InfiniteData<Page>>(queryKey);
    expect(cached.pages[0].items.map(contact => contact.id)).toEqual(['contato-2', 'contato-1']);
    expect(cached.pages[0].totalCount).toBe(2);
    const select = api.query.mock.calls[0][0].select as string;
    expect(select.split(',')).toContain('version');
    expect(api.query.mock.calls[0][0].filters).toContainEqual({ type: 'is', column: 'deleted_at', value: null });
  });

  it('busca a versão real antes de atualizar um contato fora do cache', async () => {
    const { result } = renderHook(() => useContacts(), { wrapper });
    await waitFor(() => expect(result.current.contacts).toHaveLength(1));
    api.query.mockResolvedValueOnce({ data: [{ ...raw, id: 'fora-do-cache', version: 11 }], error: null });
    api.versioned.mockResolvedValueOnce({ data: { ...raw, id: 'fora-do-cache', version: 12 }, error: null });
    await act(async () => { expect(await result.current.updateContact('fora-do-cache', { notes: 'Nota' })).toMatchObject({ version: 12 }); });
    expect(api.versioned).toHaveBeenCalledWith('contacts', 'fora-do-cache', 11, { notes: 'Nota' });
    expect(api.update).not.toHaveBeenCalled();
  });

  it('faz rollback quando o retorno de update viola o contrato', async () => {
    const { result } = renderHook(() => useContacts(), { wrapper });
    await waitFor(() => expect(result.current.contacts).toHaveLength(1));
    const previous = client.getQueryData(queryKey);
    api.versioned.mockResolvedValueOnce({ data: { ...raw, tags_array: '{}' }, error: null });
    await act(async () => { expect(await result.current.updateContact(raw.id, { notes: 'Nota' })).toBeNull(); });
    expect(client.getQueryData(queryKey)).toEqual(previous);
    expect(api.toast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
  });

  it('usa versão real, aplica o retorno normalizado e faz rollback do mesmo contrato', async () => {
    const { result } = renderHook(() => useContacts(), { wrapper });
    await waitFor(() => expect(result.current.contacts).toHaveLength(1));
    api.versioned.mockResolvedValueOnce({ data: { ...raw, notes: 'Atualizado', version: 8 }, error: null });
    await act(async () => { await result.current.updateContact(raw.id, { notes: 'Atualizado' }); });
    expect(api.versioned).toHaveBeenCalledWith('contacts', raw.id, 7, { notes: 'Atualizado' });
    await waitFor(() => expect(result.current.contacts[0]).toMatchObject({ notes: 'Atualizado', version: 8 }));
    const previous = client.getQueryData(queryKey);
    api.versioned.mockResolvedValueOnce({ data: null, error: new Error('Falha simulada') });
    await act(async () => { expect(await result.current.updateContact(raw.id, { notes: 'Falha' })).toBeNull(); });
    expect(client.getQueryData(queryKey)).toEqual(previous);
  });
});
