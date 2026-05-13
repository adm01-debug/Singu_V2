import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import React from 'react';
import { useMoveDeal, type PipelineDeal } from '@/hooks/usePipeline';

const updateExternalDataMock = vi.fn();
vi.mock('@/lib/externalData', () => ({
  callExternalRpc: vi.fn(),
  queryExternalData: vi.fn(),
  updateExternalData: (...args: unknown[]) => updateExternalDataMock(...args),
}));

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return { qc, wrapper };
}

const seedDeal = (overrides: Partial<PipelineDeal> = {}): PipelineDeal => ({
  id: 'd1',
  title: 'Deal X',
  pipeline_stage: 'Lead',
  valor: 1000,
  probabilidade: 10,
  ...overrides,
} as PipelineDeal);

beforeEach(() => updateExternalDataMock.mockReset());

describe('useMoveDeal — snapshot e restore', () => {
  it('move deal otimisticamente para novo stage', async () => {
    const { qc, wrapper } = makeWrapper();
    qc.setQueryData<PipelineDeal[]>(['deals-pipeline'], [seedDeal()]);
    updateExternalDataMock.mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useMoveDeal(), { wrapper });
    result.current.mutate({ dealId: 'd1', newStageId: 'Qualified', probability: 30 });

    await waitFor(() => {
      const cached = qc.getQueryData<PipelineDeal[]>(['deals-pipeline']);
      expect(cached?.[0].pipeline_stage).toBe('Qualified');
      expect(cached?.[0].probabilidade).toBe(30);
    });
  });

  it('restaura snapshot anterior em caso de erro', async () => {
    const { qc, wrapper } = makeWrapper();
    qc.setQueryData<PipelineDeal[]>(['deals-pipeline'], [seedDeal()]);
    updateExternalDataMock.mockResolvedValue({ data: null, error: new Error('boom') });

    const { result } = renderHook(() => useMoveDeal(), { wrapper });
    result.current.mutate({ dealId: 'd1', newStageId: 'Won' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    const cached = qc.getQueryData<PipelineDeal[]>(['deals-pipeline']);
    expect(cached?.[0].pipeline_stage).toBe('Lead');
  });
});
