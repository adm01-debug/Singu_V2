import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useInteractionHistory, useUnifiedCommunicationHistory } from '../useInteractionsRpc';
import { useLuxWebhookConfig } from '../useLuxWebhookConfig';

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(), from: vi.fn(), insert: vi.fn(),
  select: vi.fn(), order: vi.fn(), limit: vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'usuario-1' } }) }));
vi.mock('@/lib/externalData', () => ({ callExternalRpc: mocks.rpc }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from } }));

let queryClient: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
const configuration = {
  id: 'config-1', entity_type: 'contact', webhook_url: 'https://example.invalid/webhook',
  is_active: true, timeout_ms: 5000, max_retries: 3, headers: { Authorization: 'teste' },
  last_test_at: null, last_test_status: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  mocks.from.mockReturnValue({ select: mocks.select, insert: mocks.insert });
  mocks.select.mockReturnValue({ order: mocks.order });
  mocks.order.mockReturnValue({ limit: mocks.limit });
  mocks.limit.mockResolvedValue({ data: [], error: null });
  mocks.insert.mockResolvedValue({ error: null });
});

describe('Contratos canônicos dos históricos de interação', () => {
  it('produz os aliases de domínio a partir dos campos reais da RPC', async () => {
    mocks.rpc.mockResolvedValue({ data: [{
      id: 'interacao-1', tipo_interacao: 'call', canal: 'phone', resumo: 'Ligação',
      created_at: '2026-01-01T00:00:00Z', usuario_responsavel_id: 10, vendedor_nome: 'Vendedor',
    }], error: null });
    const { result } = renderHook(() => useInteractionHistory('empresa-1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{
      id: 'interacao-1', company_id: 'empresa-1', type: 'call', channel: 'phone',
      resumo: 'Ligação', data_interacao: '2026-01-01T00:00:00Z',
    }]);
    expect(result.current.data?.[0]).not.toHaveProperty('direction');
    expect(mocks.rpc).toHaveBeenCalledWith('get_interaction_history', { p_company_id: 'empresa-1', p_limit: 50 });
  });

  it('normaliza o retorno distinto da RPC de histórico unificado', async () => {
    mocks.rpc.mockResolvedValue({ data: [{
      interaction_id: 'interacao-2', interaction_type: 'email', channel: 'email',
      summary: null, interaction_date: '2026-01-02T00:00:00Z', user_name: 'Usuário',
    }], error: null });
    const { result } = renderHook(() => useUnifiedCommunicationHistory('empresa-1', 50, 'company'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0]).toMatchObject({
      id: 'interacao-2', company_id: 'empresa-1', type: 'email', channel: 'email', data_interacao: '2026-01-02T00:00:00Z',
    });
  });

  it('não transforma falha remota em lista vazia', async () => {
    const error = new Error('Falha do banco');
    mocks.rpc.mockResolvedValue({ data: null, error });
    const { result } = renderHook(() => useInteractionHistory('empresa-1'), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeUndefined();
  });

  it('rejeita JSON incompatível sem aceitar uma tipagem fictícia', async () => {
    mocks.rpc.mockResolvedValue({ data: [{ id: 'interacao-1', canal: 17 }], error: null });
    const { result } = renderHook(() => useInteractionHistory('empresa-1'), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
    expect(result.current.error?.name).toBe('ZodError');
  });
});

describe('Contrato canônico de configurações Lux', () => {
  it('valida cabeçalhos e preserva os valores persistidos', async () => {
    mocks.limit.mockResolvedValue({ data: [configuration], error: null });
    const { result } = renderHook(() => useLuxWebhookConfig(), { wrapper });
    await waitFor(() => expect(result.current.configs).toHaveLength(1));
    expect(result.current.configs[0]).toEqual(configuration);
    expect(result.current.error).toBeNull();
  });

  it('expõe erro de JSON em vez de aparentar carregamento bem-sucedido', async () => {
    mocks.limit.mockResolvedValue({ data: [{ ...configuration, headers: { Authorization: 17 } }], error: null });
    const { result } = renderHook(() => useLuxWebhookConfig(), { wrapper });
    await waitFor(() => expect(result.current.error?.name).toBe('ZodError'));
  });

  it('preenche os campos obrigatórios a partir da entidade e do usuário reais', async () => {
    const { result } = renderHook(() => useLuxWebhookConfig(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await result.current.upsert.mutateAsync({ entity_type: 'contact', webhook_url: configuration.webhook_url });
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'usuario-1', config_name: 'Lux contact', scrape_target: 'contact',
      entity_type: 'contact', webhook_url: configuration.webhook_url,
    }));
  });

  it('propaga falha de inserção', async () => {
    const error = new Error('Falha na gravação');
    mocks.insert.mockResolvedValue({ error });
    const { result } = renderHook(() => useLuxWebhookConfig(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await expect(result.current.upsert.mutateAsync({ entity_type: 'contact', webhook_url: configuration.webhook_url })).rejects.toBe(error);
  });
});
