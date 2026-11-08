import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useIsAdmin } from './useIsAdmin';

const rpc = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'administrador' } }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc } }));

describe('Consulta de papel administrativo', () => {
  it('diferencia falha de consulta e permite recuperar a permissão confirmada', async () => {
    const error = new Error('banco indisponível');
    rpc.mockResolvedValueOnce({ data: null, error });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => useIsAdmin(), { wrapper });
    await waitFor(() => expect(result.current.error).toBe(error));
    expect(result.current.isAdmin).toBe(false);
    rpc.mockResolvedValueOnce({ data: true, error: null });
    await result.current.refetch();
    await waitFor(() => expect(result.current.isAdmin).toBe(true));
    expect(result.current.error).toBeNull();
    expect(rpc).toHaveBeenCalledWith('has_role', { _user_id: 'administrador', _role: 'admin' });
    client.clear();
  });
});
