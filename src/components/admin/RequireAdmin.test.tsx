import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RequireAdmin } from './RequireAdmin';

const factors = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'administrador' } }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  rpc: () => Promise.resolve({ data: true, error: null }),
  auth: { mfa: { listFactors: factors } },
} }));

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><MemoryRouter>
    <RequireAdmin><p>Administração</p></RequireAdmin>
  </MemoryRouter></QueryClientProvider>);
  return client;
}

describe('Banner MFA administrativo', () => {
  beforeEach(() => vi.clearAllMocks());

  it('não anuncia ausência de MFA quando a consulta dos fatores está indisponível', async () => {
    factors.mockResolvedValue({ data: null, error: new Error('consulta indisponível') });
    const client = setup();
    await waitFor(() => expect(client.getQueryState(['mfa-enrolled', 'administrador'])?.status).toBe('error'));
    expect(screen.queryByText('MFA não configurado')).not.toBeInTheDocument();
    expect(screen.getByText('Administração')).toBeInTheDocument();
  });

  it('mostra o aviso quando a ausência de fatores verificados foi confirmada', async () => {
    factors.mockResolvedValue({ data: { all: [{ status: 'unverified' }] }, error: null });
    setup();
    expect(await screen.findByText('MFA não configurado')).toBeInTheDocument();
  });
});
