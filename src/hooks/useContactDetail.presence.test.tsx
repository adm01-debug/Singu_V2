import type { PropsWithChildren } from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizeExternalContact } from '@/hooks/useContacts';
import { useContactDetail, type Contact, type ContactDetailData } from './useContactDetail';

const state = vi.hoisted(() => ({
  localContact: null as Contact | null,
  localError: null as Error | null,
  external: vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'usuario-1' } }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/externalData', () => ({ queryExternalData: state.external }));
vi.mock('@/integrations/supabase/client', () => {
  const query = {
    select() { return this; },
    eq() { return this; },
    order() { return this; },
    limit() { return Promise.resolve({ data: [], error: null }); },
    maybeSingle() { return Promise.resolve({ data: state.localContact, error: state.localError }); },
  };
  return {
    supabase: {
      from: () => query,
      channel: () => { throw new Error('Realtime indisponível no teste'); },
      removeChannel: vi.fn(),
    },
  };
});

const contact = normalizeExternalContact({
  id: 'contato-1', user_id: 'usuario-1', first_name: 'Ana', last_name: 'Silva', version: 1,
});
const detailKey = ['contact', 'usuario-1', contact.id];
const detail: ContactDetailData = {
  contact, company: null, interactions: [], insights: [], alerts: [],
};
let cache: QueryClient;
const wrapper = ({ children }: PropsWithChildren) => (
  <QueryClientProvider client={cache}>{children}</QueryClientProvider>
);

beforeEach(() => {
  vi.clearAllMocks();
  state.localContact = null;
  state.localError = null;
  state.external.mockResolvedValue({ data: [], count: 0, error: null });
  cache = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  cache.setQueryData(detailKey, detail);
});
afterEach(() => {
  cleanup();
  cache.clear();
});

describe('presença confirmada na recarga da ficha', () => {
  it('retira a ficha anterior do cache quando ambas as fontes confirmam ausência', async () => {
    const { result } = renderHook(() => useContactDetail(contact.id), { wrapper });
    expect(result.current.contact).toEqual(contact);
    await act(async () => { await result.current.refetch(); });
    await waitFor(() => expect(result.current.contact).toBeNull());
    expect(result.current.error).toBeNull();
    expect(cache.getQueryData(detailKey)).toEqual({ ...detail, contact: null });
    expect(state.external).toHaveBeenCalledTimes(1);
  });

  it.each(['local', 'externa'])('preserva a ficha se a consulta %s falhar e recupera no retry', async source => {
    if (source === 'local') state.localError = new Error('Falha de rede');
    else state.external.mockResolvedValueOnce({ data: null, count: null, error: new Error('Falha de rede') });
    const { result } = renderHook(() => useContactDetail(contact.id), { wrapper });
    await act(async () => { await result.current.refetch(); });
    await waitFor(() => expect(result.current.error).toBe('Falha de rede'));
    expect(result.current.contact).toEqual(contact);
    expect(cache.getQueryData(detailKey)).toEqual(detail);

    state.localError = null;
    state.localContact = { ...contact, first_name: 'Ana atualizada' };
    await act(async () => { await result.current.refetch(); });
    await waitFor(() => expect(result.current.contact?.first_name).toBe('Ana atualizada'));
    expect(result.current.error).toBeNull();
  });

  it.each(['local', 'externa'])('mantém o contato da lixeira da fonte %s disponível para restauração', async source => {
    const archivedContact = { ...contact, deleted_at: '2026-10-18T14:00:00Z' };
    if (source === 'local') state.localContact = archivedContact;
    else state.external.mockResolvedValueOnce({ data: [archivedContact], count: 1, error: null });
    const { result } = renderHook(() => useContactDetail(contact.id), { wrapper });
    await act(async () => { await result.current.refetch(); });
    await waitFor(() => expect(result.current.contact?.deleted_at).toBe(archivedContact.deleted_at));
    expect(result.current.error).toBeNull();
  });
});
