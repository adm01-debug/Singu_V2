import { createElement, type PropsWithChildren } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDealsPipeline } from './usePipeline';

const { query, from } = vi.hoisted(() => ({
  query: { select: vi.fn(), eq: vi.fn(), not: vi.fn(), order: vi.fn(), range: vi.fn() },
  from: vi.fn(),
}));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'dono-pipeline' } }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from } }));
vi.mock('@/lib/externalData', () => ({ callExternalRpc: vi.fn() }));

function deal(index: number) {
  return {
    id: `negocio-${index}`, titulo: `Negócio ${index}`, valor: 50,
    status: 'ganho', pipeline_stage: 'fechamento', probabilidade: 100,
    company_id: 'empresa-1', contact_id: 'contato-1',
    created_at: '2026-01-15T15:00:00Z', closed_at: '2026-03-10T15:00:00Z',
    company: { nome_crm: 'Empresa do cliente' },
    contact: { first_name: 'Joana', last_name: 'Silva' },
  };
}

function renderPipeline() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderHook(() => useDealsPipeline(), {
    wrapper: ({ children }: PropsWithChildren) => createElement(QueryClientProvider, { client }, children),
  });
}

describe('Contrato de negócios individuais do Pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    from.mockReturnValue(query);
    for (const method of [query.select, query.eq, query.not, query.order]) method.mockReturnValue(query);
  });

  it('consulta registros do dono e preserva o fechamento e os nomes relacionados', async () => {
    query.range.mockResolvedValue({ data: [deal(1)], error: null });
    const { result } = renderPipeline();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(from).toHaveBeenCalledWith('deals');
    expect(query.eq).toHaveBeenCalledWith('user_id', 'dono-pipeline');
    expect(query.not).toHaveBeenCalledWith('status', 'in', '(perdido,arquivado,lost)');
    expect(result.current.data?.[0]).toMatchObject({
      id: 'negocio-1', titulo: 'Negócio 1', closed_at: '2026-03-10T15:00:00Z',
      company_name: 'Empresa do cliente', contact_name: 'Joana Silva',
    });
  });

  it('carrega todas as páginas quando há mais de mil negócios', async () => {
    query.range.mockResolvedValueOnce({ data: Array.from({ length: 500 }, (_, i) => deal(i)), error: null })
      .mockResolvedValueOnce({ data: Array.from({ length: 500 }, (_, i) => deal(i + 500)), error: null })
      .mockResolvedValueOnce({ data: [deal(1000), deal(1001)], error: null });
    const { result } = renderPipeline();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(query.range.mock.calls).toEqual([[0, 499], [500, 999], [1000, 1499]]);
    expect(result.current.data).toHaveLength(1002);
    expect(result.current.data?.[1001].id).toBe('negocio-1001');
  });

  it('não apresenta sucesso parcial se a segunda página falhar', async () => {
    const error = new Error('Falha ao carregar a segunda página');
    query.range.mockResolvedValueOnce({ data: Array.from({ length: 500 }, (_, i) => deal(i)), error: null })
      .mockResolvedValueOnce({ data: null, error });
    const { result } = renderPipeline();
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeUndefined();
  });
});
