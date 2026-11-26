import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { OfferSuggestionsElite } from './OfferSuggestionsElite';

const mocks = vi.hoisted(() => ({
  from: vi.fn(), select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'usuario-a' } }) }));
vi.mock('@/hooks/commercial/useSocialSync', () => ({
  useSocialSync: () => ({ queueStatus: null, auditLogs: [], syncNow: vi.fn() }),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

let client: QueryClient;
function Wrapper({ children }: PropsWithChildren) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const ofertaBase = {
  id: 'oferta-a', confidence_score: 65, contact_id: 'contato-a', created_at: '2026-11-26T09:00:00Z',
  expires_at: null, offer_category: 'Brinde', offer_name: 'Caneta plástica touch', presented_at: null,
  result: null, status: 'pending', user_id: 'usuario-a',
  reason: 'Bom score de relacionamento (78). Decisor/proprietário.',
};

describe('Evidence do match gravada na oferta', () => {
  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    mocks.from.mockReturnValue({ select: mocks.select });
    mocks.select.mockReturnValue({ eq: mocks.eq });
    mocks.eq.mockReturnValue({ eq: mocks.eq, order: mocks.order });
    mocks.order.mockReturnValue({ limit: mocks.limit });
    mocks.limit.mockResolvedValue({ data: [], error: null });
  });
  afterEach(() => { cleanup(); vi.clearAllMocks(); });

  it('mostra fontes e palavras-chave quando a oferta traz metadata', async () => {
    mocks.limit.mockResolvedValue({
      data: [{ ...ofertaBase, metadata: { sources: ['instagram'], keywords: ['caneta'], social_insight_ids: [] } }],
      error: null,
    });
    render(<OfferSuggestionsElite contactId="contato-a" />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('Caneta plástica touch')).toBeInTheDocument());
    expect(screen.getByText('Atributos de Social Match')).toBeInTheDocument();
    expect(screen.getByText('caneta')).toBeInTheDocument();
    expect(screen.getByText('instagram')).toBeInTheDocument();
    expect(screen.getByText('Social Match')).toBeInTheDocument();
    expect(screen.queryByText(/evidências do match social indisponíveis/i)).not.toBeInTheDocument();
  });

  it('não anuncia evidência quando a oferta não registra nenhuma', async () => {
    mocks.limit.mockResolvedValue({ data: [{ ...ofertaBase, metadata: null }], error: null });
    render(<OfferSuggestionsElite contactId="contato-a" />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('Caneta plástica touch')).toBeInTheDocument());
    expect(screen.queryByText('Atributos de Social Match')).not.toBeInTheDocument();
    expect(screen.queryByText('Social Match')).not.toBeInTheDocument();
  });
});