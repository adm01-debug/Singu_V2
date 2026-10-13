import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { AuthProvider } from '@/hooks/useAuth';
import { setLogUser } from '@/lib/logger';

const auth = vi.hoisted(() => ({
  listener: null as ((event: AuthChangeEvent, session: Session | null) => void) | null,
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { auth: {
    onAuthStateChange: vi.fn((callback: (event: AuthChangeEvent, session: Session | null) => void) => {
      auth.listener = callback;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    }),
    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
  } },
}));
vi.mock('@/lib/logger', () => ({
  logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
  setLogUser: vi.fn(),
}));
vi.mock('@/lib/errorReporting', () => ({ clearUserContext: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

function sessionFor(id: string): Session {
  return {
    access_token: 'token-ficticio', refresh_token: 'refresh-ficticio', expires_in: 3600,
    token_type: 'bearer',
    user: { id, app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '2026-10-13T00:00:00Z' },
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Identidade global do logger', () => {
  it('mantém o usuário em rotas sem AppLayout e limpa a identidade na troca e saída', async () => {
    const client = new QueryClient();
    const { unmount } = render(
      <QueryClientProvider client={client}>
        <AuthProvider><div>Relatório sem layout</div></AuthProvider>
      </QueryClientProvider>,
    );
    await waitFor(() => expect(setLogUser).toHaveBeenLastCalledWith(null));
    await act(async () => auth.listener?.('SIGNED_IN', sessionFor('conta-A')));
    expect(setLogUser).toHaveBeenLastCalledWith('conta-A');
    await act(async () => auth.listener?.('SIGNED_IN', sessionFor('conta-B')));
    expect(setLogUser).toHaveBeenLastCalledWith('conta-B');
    await act(async () => auth.listener?.('SIGNED_OUT', null));
    expect(setLogUser).toHaveBeenLastCalledWith(null);
    await act(async () => auth.listener?.('SIGNED_IN', sessionFor('conta-B')));
    unmount();
    expect(setLogUser).toHaveBeenLastCalledWith(null);
    client.clear();
  });
});
