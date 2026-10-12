import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteExternalData, queryExternalData } from '@/lib/externalData';
import { useContacts } from './useContacts';

const mocks = vi.hoisted(() => ({ logActivity: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'dono' } }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/hooks/useActivityLogger', () => ({ useActivityLogger: () => ({ logActivity: mocks.logActivity }) }));
vi.mock('@/lib/externalData', () => ({
  queryExternalData: vi.fn(), deleteExternalData: vi.fn(), insertExternalData: vi.fn(),
  updateExternalData: vi.fn(), updateExternalDataWithVersion: vi.fn(),
}));

const contact = (id: string) => ({ id, user_id: 'dono', version: 1, first_name: id, last_name: 'Teste', updated_at: '2026-10-01T00:00:00Z' });

describe('Paginação após excluir o último contato', () => {
  beforeEach(() => vi.clearAllMocks());

  it('não pede a página que deixou de existir após exclusão confirmada e refetch', async () => {
    const firstPage = Array.from({ length: 50 }, (_, i) => contact(`contato-${i}`));
    vi.mocked(queryExternalData)
      .mockResolvedValueOnce({ data: firstPage, count: 51, error: null })
      .mockResolvedValueOnce({ data: [contact('ultimo')], count: null, error: null })
      .mockResolvedValueOnce({ data: firstPage, count: 50, error: null });
    vi.mocked(deleteExternalData).mockResolvedValue({ success: true, error: null });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => useContacts(), { wrapper });
    await waitFor(() => expect(result.current.contacts).toHaveLength(50));
    await act(async () => result.current.loadMore());
    await waitFor(() => expect(result.current.contacts).toHaveLength(51));

    await act(async () => expect(await result.current.deleteContact('ultimo')).toBe(true));
    await waitFor(() => expect(result.current.contacts).toHaveLength(50));
    expect(result.current.totalCount).toBe(50);
    expect(result.current.hasMore).toBe(false);
    await act(async () => result.current.fetchContacts());
    expect(result.current.error).toBeNull();
    expect(queryExternalData).toHaveBeenCalledTimes(3);
    expect(vi.mocked(queryExternalData).mock.calls.map(([query]) => query.range?.from))
      .toEqual([0, 50, 0]);
    client.clear();
  });
});
