import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRFMAnalysis } from '../useRFMAnalysis';
import { useYourDay } from '../useYourDay';
import { YourDaySection } from '@/components/dashboard/YourDaySection';

const mocks = vi.hoisted(() => ({ from: vi.fn(), loggedIn: true }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: mocks.loggedIn ? { id: 'usuario-1' } : null }) }));
vi.mock('@/hooks/useContacts', () => ({ useContacts: () => ({ contacts: [] }) }));
vi.mock('@/hooks/useInteractions', () => ({ useInteractions: () => ({ interactions: [] }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from } }));
vi.mock('@/lib/externalData', () => ({ callExternalRpc: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));

function queryResult(data: unknown, error: Error | null = null) {
  const response = Promise.resolve({ data, error });
  const query = {
    select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn(), in: vi.fn(), not: vi.fn(), or: vi.fn(),
    then: response.then.bind(response),
  };
  for (const method of [query.select, query.eq, query.order, query.limit, query.in, query.not, query.or]) method.mockReturnValue(query);
  return query;
}

let queryClient: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>
);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.loggedIn = true;
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mocks.from.mockReturnValue(queryResult([]));
});

describe('RFM conserva recomendações do produtor e metadados existentes', () => {
  it('normaliza IDs locais estáveis e marca o impacto ausente sem inventar uma estimativa', async () => {
    const action = { action: 'Oferecer programa VIP', description: 'Convidar para fidelidade', priority: 1, channel: 'email', timing: 'Esta semana' };
    const offer = { offerType: 'Acesso VIP', description: 'Acesso antecipado', validDays: 30, reason: 'Recompensar lealdade' };
    const analysis = {
      id: 'analise-1', user_id: 'usuario-1', contact_id: 'contato-1', recency_score: 5, frequency_score: 5, monetary_score: 5,
      total_score: 15, segment: 'champions', analyzed_at: '2026-01-01T00:00:00Z',
      created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
      recommended_actions: [action], recommended_offers: [offer],
    };
    mocks.from.mockReturnValue(queryResult([
      analysis,
      { ...analysis, id: 'analise-2', contact_id: 'contato-2',
        recommended_actions: [{ ...action, id: 'acao-existente', expectedImpact: 'Impacto informado pelo produtor' }],
        recommended_offers: [{ ...offer, id: 'oferta-existente' }] },
    ]));
    const { result } = renderHook(() => useRFMAnalysis(), { wrapper });
    await waitFor(() => expect(result.current.rfmData).toHaveLength(2));
    expect(result.current.rfmData[0].recommendedActions).toEqual([{ ...action, id: 'analise-1:action:0', expectedImpact: 'Impacto não estimado' }]);
    expect(result.current.rfmData[0].recommendedOffers).toEqual([{ ...offer, id: 'analise-1:offer:0' }]);
    expect(result.current.rfmData[1].recommendedActions[0]).toMatchObject({ id: 'acao-existente', expectedImpact: 'Impacto informado pelo produtor' });
    expect(result.current.rfmData[1].recommendedOffers[0].id).toBe('oferta-existente');
    await act(() => result.current.refresh());
    expect(result.current.rfmData[0].recommendedActions[0].id).toBe('analise-1:action:0');
  });
});

describe('Meu Dia distingue falha, carregamento e ausência de login', () => {
  it('encerra carregamento ao falhar e recupera os dados após nova tentativa', async () => {
    const failure = new Error('Falha ao consultar');
    mocks.from.mockReturnValue(queryResult(null, failure));
    const { result } = renderHook(() => useYourDay(), { wrapper });
    await waitFor(() => expect(result.current.error).toBe(failure));
    expect(result.current.loading).toBe(false);
    mocks.from.mockReturnValue(queryResult([]));
    await act(() => result.current.refresh());
    await waitFor(() => expect(result.current.error).toBeNull());
    expect(result.current.loading).toBe(false);
    expect(result.current.todayFollowUps).toEqual([]);
  });

  it('oferece uma ação acessível de retry na interface e sai do alerta ao recuperar', async () => {
    mocks.from.mockReturnValue(queryResult(null, new Error('Falha ao consultar')));
    render(<YourDaySection />, { wrapper });
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar seu dia.');
    mocks.from.mockReturnValue(queryResult([]));
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    await waitFor(() => expect(queryClient.getQueryState(['your-day', 'usuario-1'])?.status).toBe('success'));
  });

  it('não consulta nem indica carregamento para uma sessão sem login', () => {
    mocks.loggedIn = false;
    const { result } = renderHook(() => useYourDay(), { wrapper });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
