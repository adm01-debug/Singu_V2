import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useActiveAlerts } from '@/hooks/useActiveAlerts';
import { usePendingFollowups } from '@/hooks/usePendingFollowups';
import { queryExternalData } from '@/lib/externalData';

const session = vi.hoisted(() => ({ user: null as { id: string } | null }));

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => session }));
vi.mock('@/lib/externalData', () => ({
  queryExternalData: vi.fn().mockResolvedValue({ data: [], error: null }),
}));

afterEach(() => {
  session.user = null;
  vi.clearAllMocks();
});

describe.each([
  ['alertas', useActiveAlerts],
  ['pendências', usePendingFollowups],
])('cache de %s', (_label, useDashboardQuery) => {
  it('não consulta sem login e separa as consultas após troca de conta', async () => {
    const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={cache}>{children}</QueryClientProvider>
    );
    const { rerender } = renderHook(() => useDashboardQuery(), { wrapper });

    expect(queryExternalData).not.toHaveBeenCalled();
    session.user = { id: 'conta-A' };
    rerender();
    await waitFor(() => expect(queryExternalData).toHaveBeenCalledTimes(1));

    session.user = { id: 'conta-B' };
    rerender();
    await waitFor(() => expect(queryExternalData).toHaveBeenCalledTimes(2));

    session.user = null;
    rerender();
    expect(queryExternalData).toHaveBeenCalledTimes(2);
    expect(cache.getQueryCache().findAll().filter(query => query.queryKey.includes('conta-A'))).toHaveLength(1);
    expect(cache.getQueryCache().findAll().filter(query => query.queryKey.includes('conta-B'))).toHaveLength(1);
    cache.clear();
  });
});
