import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useEmailCampaigns } from '../useEmailCampaigns';
import { useLuxWebhookConfig } from '../useLuxWebhookConfig';
import { useSequences } from '../useSequences';
import { useUnifiedHistory } from '../useUnifiedHistory';
import { normalizeDashboardLifeEvents } from '../useDashboardMappedData';

const mocks = vi.hoisted(() => ({ from: vi.fn(), success: vi.fn(), error: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'usuario-1' } }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from } }));
vi.mock('sonner', () => ({ toast: { success: mocks.success, error: mocks.error } }));

function queryResult(data: unknown, error: Error | null = null) {
  const response = Promise.resolve({ data, error });
  const query = {
    select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn(), update: vi.fn(),
    insert: vi.fn(), not: vi.fn(), range: vi.fn(), in: vi.fn(), gte: vi.fn(), lte: vi.fn(),
    then: response.then.bind(response),
  };
  for (const method of [query.select, query.eq, query.order, query.limit, query.update,
    query.insert, query.not, query.range, query.in, query.gte, query.lte]) method.mockReturnValue(query);
  return query;
}

const configuration = {
  id: 'config-1', entity_type: 'contact', webhook_url: 'https://example.invalid/webhook',
  is_active: true, timeout_ms: 5000, max_retries: 3, headers: {},
  last_test_at: null, last_test_status: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
};
let queryClient: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

beforeEach(() => {
  vi.resetAllMocks();
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  mocks.from.mockReturnValue(queryResult([]));
  // O jsdom não implementa AbortSignal.timeout; o fetch mockado não precisa de temporizador real.
  vi.stubGlobal('AbortSignal', { timeout: vi.fn(() => new AbortController().signal) });
});
afterEach(() => vi.unstubAllGlobals());

describe('Operações secundárias não geram sucesso quando falham', () => {
  it('a leitura de destinatários existentes não é tratada como lista vazia', async () => {
    const failure = new Error('Falha ao consultar destinatários');
    const recipients = queryResult(null, failure);
    mocks.from.mockImplementation(table => {
      if (table === 'campaign_recipients') return recipients;
      return queryResult(table === 'contacts' ? [{ id: 'contato-1', email: 'contato@example.invalid' }] : []);
    });
    const { result } = renderHook(() => useEmailCampaigns(), { wrapper });
    await expect(result.current.sendCampaign.mutateAsync('campanha-1')).rejects.toBe(failure);
    expect(recipients.insert).not.toHaveBeenCalled();
    expect(mocks.success).not.toHaveBeenCalled();
  });

  it('expõe erro da consulta de campanhas', async () => {
    const failure = new Error('Falha ao consultar campanhas');
    mocks.from.mockReturnValue(queryResult(null, failure));
    const { result } = renderHook(() => useEmailCampaigns(), { wrapper });
    await waitFor(() => expect(result.current.error).toBe(failure));
  });

  it('a inscrição não anuncia sucesso se a contagem falhar', async () => {
    const failure = new Error('Falha na contagem de inscrições');
    mocks.from.mockImplementationOnce(() => queryResult([]))
      .mockImplementation(table => queryResult([], table === 'sequences' ? failure : null));
    const { result } = renderHook(() => useSequences(), { wrapper });
    await expect(result.current.enrollContact({ sequenceId: 'sequencia-1', contactId: 'contato-1' })).rejects.toBe(failure);
    expect(mocks.success).not.toHaveBeenCalled();
  });

  it('não anuncia teste Lux bem-sucedido se falhar ao persistir o resultado', async () => {
    const failure = new Error('Falha ao registrar resultado');
    mocks.from.mockReturnValueOnce(queryResult([configuration]))
      .mockReturnValueOnce(queryResult(null, failure)).mockReturnValue(queryResult(null));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));
    const { result } = renderHook(() => useLuxWebhookConfig(), { wrapper });
    await waitFor(() => expect(result.current.configs).toHaveLength(1));
    await expect(result.current.testWebhook.mutateAsync('contact')).rejects.toBe(failure);
    expect(mocks.success).not.toHaveBeenCalled();
  });

  it('preserva falhas do webhook e do registro em um AggregateError', async () => {
    const failure = new Error('Falha ao registrar erro');
    mocks.from.mockReturnValueOnce(queryResult([configuration]))
      .mockReturnValueOnce(queryResult(null)).mockReturnValue(queryResult(null, failure));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    const { result } = renderHook(() => useLuxWebhookConfig(), { wrapper });
    await waitFor(() => expect(result.current.configs).toHaveLength(1));
    await expect(result.current.testWebhook.mutateAsync('contact')).rejects.toMatchObject({
      name: 'AggregateError', errors: [expect.objectContaining({ message: 'HTTP 503' }), failure],
    });
    expect(mocks.success).not.toHaveBeenCalled();
  });
});

describe('Eventos de vida do dashboard são normalizados, não convertidos por cast', () => {
  it('produz uma Date real a partir da data JSON persistida', () => {
    const events = normalizeDashboardLifeEvents([{
      id: 'evento-1', type: 'birthday', title: 'Aniversário', date: '2026-01-01T00:00:00Z', reminder: true,
    }]);
    expect(events[0].date).toBeInstanceOf(Date);
    expect(events[0].date.toISOString()).toBe('2026-01-01T00:00:00.000Z');
  });

  it('mantém a ausência legítima como lista vazia', () => {
    expect(normalizeDashboardLifeEvents(null)).toEqual([]);
  });

  it.each([
    [{ id: 'evento-1', type: 'birthday', title: 'Aniversário', date: 'inválida', reminder: true }],
    [{ id: 'evento-1', type: 'inventado', title: 'Evento', date: '2026-01-01T00:00:00Z', reminder: true }],
    { title: 'Objeto não é lista' },
  ])('rejeita payload incompatível em vez de descartá-lo: %j', payload => {
    expect(() => normalizeDashboardLifeEvents(payload)).toThrow();
  });
});

describe('Histórico unificado usa campos canônicos e discriminantes validados', () => {
  it('usa data_interacao, direction e duracao_segundos sem inventar duration_seconds', async () => {
    const interactions = queryResult([{
      id: 'interacao-1', type: 'email', contact_id: 'contato-1', company_id: null,
      title: 'Proposta', content: 'Conversa', transcription: null, audio_url: null,
      duracao_segundos: 45, direction: 'inbound', data_interacao: '2026-01-01T00:00:00Z',
    }]);
    mocks.from.mockReturnValue(interactions);
    const { result } = renderHook(() => useUnifiedHistory({ channels: ['email'], from: '2026-01-01T00:00:00Z' }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0]).toMatchObject({ timestamp: '2026-01-01T00:00:00Z', duration_seconds: 45, direction: 'inbound' });
    expect(interactions.select).toHaveBeenCalledWith(expect.stringContaining('duracao_segundos'));
    expect(interactions.select).not.toHaveBeenCalledWith(expect.stringContaining('duration_seconds'));
    expect(interactions.order).toHaveBeenCalledWith('data_interacao', { ascending: false });
    expect(interactions.gte).toHaveBeenCalledWith('data_interacao', '2026-01-01T00:00:00Z');
  });

  it('rejeita direção de ligação inválida em vez de aceitá-la via cast', async () => {
    mocks.from.mockReturnValue(queryResult([{
      id: 'ligacao-1', direction: 'desconhecida', created_at: '2026-01-01T00:00:00Z',
    }]));
    const { result } = renderHook(() => useUnifiedHistory({ channels: ['call'] }), { wrapper });
    await waitFor(() => expect(result.current.error).toMatchObject({ name: 'ZodError' }));
  });

  it('propaga falha de consulta sem histórico vazio', async () => {
    const failure = new Error('Falha no histórico');
    mocks.from.mockReturnValue(queryResult(null, failure));
    const { result } = renderHook(() => useUnifiedHistory({ channels: ['call'] }), { wrapper });
    await waitFor(() => expect(result.current.error).toBe(failure));
    expect(result.current.isSuccess).toBe(false);
  });
});
