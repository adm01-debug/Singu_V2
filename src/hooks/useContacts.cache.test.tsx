import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider, QueryObserver } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import * as externalData from '@/lib/externalData';
import { useContacts } from './useContacts';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'usuario-1' } }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/hooks/useActivityLogger', () => ({ useActivityLogger: () => ({ logActivity: vi.fn() }) }));
vi.mock('@/lib/externalData', async importOriginal => ({
  ...await importOriginal<typeof import('@/lib/externalData')>(),
  updateExternalDataWithVersion: vi.fn(),
}));

let cache: QueryClient;
const wrapper = ({ children }: PropsWithChildren) => (
  <QueryClientProvider client={cache}>{children}</QueryClientProvider>
);
const oldContact = {
  id: 'contato-1', user_id: 'usuario-1', version: 7,
  first_name: 'Ana', last_name: 'Silva', birthday: '1990-10-19',
};
const savedContact = { ...oldContact, version: 8, birthday: '1990-10-18' };
const detail = {
  contact: oldContact, company: { id: 'empresa-1' },
  interactions: [{ id: 'interacao-1' }], insights: [{ id: 'insight-1' }], alerts: [{ id: 'alerta-1' }],
};
const detailKey = ['contact', 'usuario-1', 'contato-1'];

beforeEach(() => {
  vi.clearAllMocks();
  cache = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 300_000, gcTime: Infinity } } });
});

describe('edição na lista renova o detalhe sem depender de realtime', () => {
  it.each([true, false])('renova somente a ficha correta, ativa=%s, fora da primeira página', async active => {
    cache.setQueryData(detailKey, detail);
    const anotherUserKey = ['contact', 'usuario-2', 'contato-1'];
    const anotherContactKey = ['contact', 'usuario-1', 'contato-2'];
    cache.setQueryData(anotherUserKey, detail);
    cache.setQueryData(anotherContactKey, detail);
    const fetchDetail = vi.fn().mockResolvedValue({ ...detail, contact: savedContact });
    const observer = new QueryObserver(cache, { queryKey: detailKey, queryFn: fetchDetail, staleTime: 300_000 });
    const unsubscribe = active ? observer.subscribe(() => {}) : () => {};
    vi.mocked(externalData.updateExternalDataWithVersion).mockResolvedValue({ data: savedContact, error: null });
    const { result, unmount } = renderHook(() => useContacts('empresa-1', { enabled: false }), { wrapper });

    await act(async () => {
      const updated = await result.current.updateContact('contato-1', { birthday: savedContact.birthday }, 7);
      expect(updated).toMatchObject(savedContact);
    });

    expect(externalData.updateExternalDataWithVersion).toHaveBeenCalledWith('contacts', 'contato-1', 7, { birthday: '1990-10-18' });
    if (active) {
      expect(fetchDetail).toHaveBeenCalledTimes(1);
      expect(cache.getQueryData(detailKey)).toEqual({ ...detail, contact: savedContact });
    } else {
      expect(fetchDetail).not.toHaveBeenCalled();
      expect(cache.getQueryState(detailKey)?.isInvalidated).toBe(true);
    }
    expect(cache.getQueryData(anotherUserKey)).toEqual(detail);
    expect(cache.getQueryData(anotherContactKey)).toEqual(detail);
    expect(cache.getQueryState(anotherUserKey)?.isInvalidated).toBe(false);
    expect(cache.getQueryState(anotherContactKey)?.isInvalidated).toBe(false);
    unsubscribe();
    unmount();
    cache.clear();
  });

  it.each(['falha de gravação', 'concorrência'])('preserva a ficha após %s', async failure => {
    cache.setQueryData(detailKey, detail);
    const error = failure === 'concorrência'
      ? new externalData.ConcurrentEditError('contacts', 'contato-1')
      : new Error('Indisponível');
    vi.mocked(externalData.updateExternalDataWithVersion).mockResolvedValue({ data: null, error });
    const { result, unmount } = renderHook(() => useContacts(undefined, { enabled: false }), { wrapper });
    await act(async () => {
      expect(await result.current.updateContact('contato-1', { birthday: savedContact.birthday }, 7)).toBeNull();
    });
    expect(cache.getQueryData(detailKey)).toEqual(detail);
    expect(cache.getQueryState(detailKey)?.isInvalidated).toBe(false);
    unmount();
    cache.clear();
  });
});
