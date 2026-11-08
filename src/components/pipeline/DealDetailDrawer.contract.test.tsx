import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { updateExternalData } from '@/lib/externalData';
import type { PipelineDeal } from '@/hooks/usePipeline';
import { DealDetailDrawer } from './DealDetailDrawer';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'dono-pipeline' } }) }));
vi.mock('@/lib/externalData', () => ({ updateExternalData: vi.fn(), deleteExternalData: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: () => ({ select: () => ({ eq: () => ({ limit: async () => ({ data: [], error: null }) }) }) }) },
}));

const originalDeal: PipelineDeal = {
  id: '00000000-0000-0000-0000-000000000001', titulo: 'Negócio do cliente',
  valor: 50, probabilidade: 50, pipeline_stage: 'proposta', status: 'aberto',
  company_id: '00000000-0000-0000-0000-000000000002',
  created_at: '2026-01-01T12:00:00Z', closed_at: null,
};

function renderDrawer(deal: PipelineDeal) {
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  const onOpenChange = vi.fn();
  render(<QueryClientProvider client={client}>
    <DealDetailDrawer deal={deal} open onOpenChange={onOpenChange} />
  </QueryClientProvider>);
  return { invalidate, onOpenChange };
}

describe('Fechamento de negócios e atualização dos relatórios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateExternalData).mockResolvedValue({ data: null, error: null });
  });
  afterEach(cleanup);

  it('grava o status canônico e uma data válida ao fechar um negócio aberto', async () => {
    const { invalidate, onOpenChange } = renderDrawer(originalDeal);
    const before = Date.now();
    fireEvent.click(screen.getByRole('button', { name: 'Ganho' }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    const payload = vi.mocked(updateExternalData).mock.calls[0][2];
    expect(payload).toMatchObject({ status: 'ganho', pipeline_stage: 'fechamento', probabilidade: 100 });
    expect(typeof payload.closed_at).toBe('string');
    const closed = new Date(String(payload.closed_at)).getTime();
    expect(closed).toBeGreaterThanOrEqual(before);
    expect(closed).toBeLessThanOrEqual(Date.now());
    for (const key of ['daily-summary', 'channel-analysis', 'seasonality', 'deals-pipeline']) {
      expect(invalidate).toHaveBeenCalledWith({ queryKey: [key] });
    }
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['company-deals', originalDeal.company_id] });
  });

  it.each(['ganho', 'perdido', 'won', 'lost'])('preserva o fechamento anterior de um negócio %s', async (status) => {
    const { onOpenChange } = renderDrawer({ ...originalDeal, status, closed_at: '2026-03-10T15:00:00Z' });
    fireEvent.click(screen.getByRole('button', { name: 'Ganho' }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(vi.mocked(updateExternalData).mock.calls[0][2]).not.toHaveProperty('closed_at');
  });

  it('não inventa data para um negócio histórico fechado sem timestamp', async () => {
    const { onOpenChange } = renderDrawer({ ...originalDeal, status: 'ganho', closed_at: null });
    fireEvent.click(screen.getByRole('button', { name: 'Ganho' }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(vi.mocked(updateExternalData).mock.calls[0][2]).not.toHaveProperty('closed_at');
  });

  it('mantém o editor aberto e não invalida relatórios quando a gravação falha', async () => {
    vi.mocked(updateExternalData).mockResolvedValue({ data: null, error: new Error('Gravação recusada') });
    const { invalidate, onOpenChange } = renderDrawer(originalDeal);
    fireEvent.click(screen.getByRole('button', { name: 'Perdido' }));
    await waitFor(() => expect(updateExternalData).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Perdido' })).not.toBeDisabled());
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(invalidate).not.toHaveBeenCalled();
  });
});
