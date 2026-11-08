import type { PropsWithChildren } from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizeExternalContact } from './useContacts';
import { useContactDetail } from './useContactDetail';

const state = vi.hoisted(() => ({ failures: new Set<string>(), companyMissing: false, external: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'usuario-1' } }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/externalData', () => ({ queryExternalData: state.external }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => ({
      select() { return this; }, eq() { return this; }, order() { return this; },
      limit: () => Promise.resolve({ data: [{ id: `${table}-novo` }], error: state.failures.has(table) ? new Error('Consulta indisponível') : null }),
      maybeSingle: () => Promise.resolve({
        data: table === 'contacts' ? contact : state.companyMissing ? null : { id: 'empresa-1', nome_crm: 'Nova empresa' },
        error: state.failures.has(table) ? new Error('Consulta indisponível') : null,
      }),
    }),
    channel: () => { throw new Error('Realtime indisponível'); }, removeChannel: vi.fn(),
  },
}));

const contact = normalizeExternalContact({ id: 'contato-1', user_id: 'usuario-1', first_name: 'Ana', last_name: 'Silva', version: 1, company_id: 'empresa-1' });
const previous = {
  contact, company: { id: 'empresa-1', nome_crm: 'Empresa anterior' },
  interactions: [{ id: 'interacao-anterior' }], insights: [{ id: 'insight-anterior' }], alerts: [{ id: 'alerta-anterior' }],
};
const key = ['contact', 'usuario-1', contact.id];
let cache: QueryClient;
const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={cache}>{children}</QueryClientProvider>;

beforeEach(() => {
  state.failures.clear(); state.companyMissing = false;
  state.external.mockReset().mockResolvedValue({ data: null, error: new Error('Consulta indisponível') });
  cache = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } } });
  cache.setQueryData(key, previous);
});
afterEach(() => { cleanup(); cache.clear(); });

describe('falha em uma seção preserva a consulta composta da ficha', () => {
  it.each(['companies', 'interactions', 'insights', 'alerts', 'empresa externa'])('preserva o snapshot e recupera após falha de %s', async table => {
    if (table === 'empresa externa') state.companyMissing = true;
    else state.failures.add(table);
    const { result } = renderHook(() => useContactDetail(contact.id), { wrapper });
    await act(async () => { await result.current.refetch(); });
    await waitFor(() => expect(result.current.error).toBe('Consulta indisponível'));
    expect(cache.getQueryData(key)).toEqual(previous);
    expect(result.current.company).toEqual(previous.company);
    expect(result.current.interactions).toEqual(previous.interactions);
    state.failures.clear(); state.companyMissing = false;
    await act(async () => { await result.current.refetch(); });
    await waitFor(() => expect(result.current.error).toBeNull());
    expect(result.current.company?.nome_crm).toBe('Nova empresa');
    expect(result.current.interactions[0]?.id).toBe('interactions-novo');
  });
});
