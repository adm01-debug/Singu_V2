import { createElement, type PropsWithChildren } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDealsPipeline, useMoveDeal } from './usePipeline';

const { queryExternalData, callExternalRpc, from } = vi.hoisted(() => ({
  queryExternalData: vi.fn(),
  callExternalRpc: vi.fn(),
  from: vi.fn(),
}));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'dono-pipeline' } }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from } }));
vi.mock('@/lib/externalData', () => ({ callExternalRpc, queryExternalData }));

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
    vi.resetAllMocks();
  });

  it('consulta registros do dono e preserva o fechamento e os nomes relacionados', async () => {
    queryExternalData.mockResolvedValue({ data: [deal(1)], error: null });
    const { result } = renderPipeline();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(from).not.toHaveBeenCalled();
    expect(queryExternalData).toHaveBeenCalledWith({
      table: 'deals',
      select: '*, company:companies(nome_crm), contact:contacts(first_name, last_name)',
      filters: [
        { type: 'eq', column: 'user_id', value: 'dono-pipeline' },
      ],
      order: [{ column: 'created_at', ascending: false }, { column: 'id', ascending: false }],
      range: { from: 0, to: 499 },
      countMethod: null,
      auditAccess: false,
    });
    expect(result.current.data?.[0]).toMatchObject({
      id: 'negocio-1', titulo: 'Negócio 1', closed_at: '2026-03-10T15:00:00Z',
      company_name: 'Empresa do cliente', contact_name: 'Joana Silva',
    });
  });

  it('preserva status vazio e exclui negócios perdidos e arquivados depois da consulta', async () => {
    queryExternalData.mockResolvedValue({ data: [
      { ...deal(1), status: null, company_id: null, company: null },
      { ...deal(2), status: 'perdido' },
      { ...deal(3), status: 'arquivado' },
      { ...deal(4), status: 'lost' },
      { ...deal(5), status: 'won' },
    ], error: null });
    const { result } = renderPipeline();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.map(row => row.id)).toEqual(['negocio-1', 'negocio-5']);
    expect(result.current.data?.[0]).toMatchObject({ status: null, company_id: null });
    expect(result.current.data?.[0].company_name).toBeUndefined();
    expect(result.current.data?.[0].dias_no_estagio_atual).toBeUndefined();
  });

  it('carrega todas as páginas quando há mais de mil negócios', async () => {
    queryExternalData.mockResolvedValueOnce({ data: Array.from({ length: 500 }, (_, i) => deal(i)), error: null })
      .mockResolvedValueOnce({ data: Array.from({ length: 500 }, (_, i) => deal(i + 500)), error: null })
      .mockResolvedValueOnce({ data: [deal(1000), deal(1001)], error: null });
    const { result } = renderPipeline();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryExternalData.mock.calls.map(([options]) => options.range)).toEqual([
      { from: 0, to: 499 }, { from: 500, to: 999 }, { from: 1000, to: 1499 },
    ]);
    expect(result.current.data).toHaveLength(1002);
    expect(result.current.data?.[1001].id).toBe('negocio-1001');
  });

  it('não apresenta sucesso parcial se a segunda página falhar', async () => {
    const error = new Error('Falha ao carregar a segunda página');
    queryExternalData.mockResolvedValueOnce({ data: Array.from({ length: 500 }, (_, i) => deal(i)), error: null })
      .mockResolvedValueOnce({ data: null, error });
    const { result } = renderPipeline();
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeUndefined();
  });

  it('move o negócio pelo mesmo proxy usado para listar, criar e editar', async () => {
    callExternalRpc.mockResolvedValue({ data: { success: true }, error: null });
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useMoveDeal(), {
      wrapper: ({ children }: PropsWithChildren) => createElement(QueryClientProvider, { client }, children),
    });
    await result.current.mutateAsync({ dealId: 'negocio-1', newStageId: 'negociacao', probability: 65 });
    expect(callExternalRpc).toHaveBeenCalledWith('move_deal_atomic', {
      p_deal_id: 'negocio-1', p_new_stage: 'negociacao', p_new_probability: 65,
    });
    expect(from).not.toHaveBeenCalled();
    for (const key of ['deals-pipeline', 'pipeline-summary', 'weighted-forecast', 'velocity-metrics',
      'stage-velocity', 'stalled-deals', 'company-deals', 'daily-summary', 'channel-analysis', 'seasonality']) {
      expect(invalidate).toHaveBeenCalledWith({ queryKey: [key] });
    }
  });
});
