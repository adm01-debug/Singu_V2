import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useAnalyzeConversation, useCoachingMetrics, useCoachingScorecards,
  useConversationAnalyses, useConversationAnalysis, useTopicsCatalog,
} from '../useConversationIntel';
import { useInteractionsInsights } from '../useInteractionsInsights';

const mocks = vi.hoisted(() => ({ from: vi.fn(), invoke: vi.fn(), success: vi.fn(), error: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'usuario-1' } }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from, functions: { invoke: mocks.invoke } } }));
vi.mock('sonner', () => ({ toast: { success: mocks.success, error: mocks.error } }));

function queryResult(data: unknown, error: Error | null = null) {
  const response = Promise.resolve({ data, error });
  const query = {
    select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn(), maybeSingle: vi.fn(),
    in: vi.fn(), gte: vi.fn(), then: response.then.bind(response),
  };
  for (const method of [query.select, query.eq, query.order, query.limit, query.maybeSingle, query.in, query.gte]) {
    method.mockReturnValue(query);
  }
  return query;
}

const analysis = {
  id: 'analise-1', interaction_id: 'interacao-1', contact_id: null,
  duration_seconds: null, talk_ratio_rep: 55, talk_ratio_customer: 45,
  longest_monologue_seconds: null, questions_asked: null, sentiment_overall: 'positive',
  sentiment_timeline: [{ position_pct: 20, sentiment: 'positive', note: 'Interesse' }],
  topics: [{ label: 'Preço', category: 'pricing', mentions: 2 }],
  objections: [{ objection: 'Custo', category: 'price', handled: false, reframing_suggestions: [{ pattern: 'intention', response: 'Valor' }] }],
  action_items: [{ task: 'Enviar proposta', owner: 'rep' }],
  key_moments: [{ position_pct: 50, moment_type: 'objection', description: 'Preço' }],
  coaching_score: 80, coaching_tips: ['Pergunte mais'], next_best_action: 'Enviar proposta',
  analyzed_at: '2026-01-01T00:00:00Z', model_used: null,
};

let queryClient: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

beforeEach(() => {
  vi.resetAllMocks();
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  mocks.from.mockReturnValue(queryResult([]));
});

describe('Análises de conversa usam JSON validado, sem cast de compatibilidade', () => {
  it('normaliza os campos JSON e preserva nulabilidade e sugestões reais', async () => {
    mocks.from.mockReturnValue(queryResult(analysis));
    const { result } = renderHook(() => useConversationAnalysis('interacao-1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject(analysis);
    expect(result.current.data?.questions_asked).toBeNull();
  });

  it('preserva a ausência legítima de análise', async () => {
    mocks.from.mockReturnValue(queryResult(null));
    const { result } = renderHook(() => useConversationAnalysis('interacao-1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it.each([
    { sentiment_overall: 'desconhecido' },
    { topics: { label: 'Objeto não é lista' } },
    { objections: [{ objection: 'Custo', category: 'price', handled: 'false' }] },
    { sentiment_timeline: [{ position_pct: '20', sentiment: 'positive' }] },
  ])('propaga JSON incompatível: %j', async incompatible => {
    mocks.from.mockReturnValue(queryResult({ ...analysis, ...incompatible }));
    const { result } = renderHook(() => useConversationAnalysis('interacao-1'), { wrapper });
    await waitFor(() => expect(result.current.error).toMatchObject({ name: 'ZodError' }));
    expect(result.current.isSuccess).toBe(false);
  });

  it('a lista entrega o mesmo contrato validado ao agregador de insights', async () => {
    mocks.from.mockImplementation(table => queryResult(table === 'conversation_analyses' ? [analysis] : []));
    const { result } = renderHook(() => useInteractionsInsights(), { wrapper });
    await waitFor(() => expect(result.current.kpis.totalAnalyzed).toBe(1));
    expect(result.current.kpis.unhandledObjections).toBe(1);
    expect(result.current.topThemes[0]).toMatchObject({ label: 'Preço', mentions: 2 });
  });

  it('o agregador expõe erro estrutural, em vez de anunciar lista validada vazia', async () => {
    mocks.from.mockReturnValue(queryResult([{ ...analysis, topics: ['inválido'] }]));
    const { result } = renderHook(() => useInteractionsInsights(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ name: 'ZodError' });
  });

  it('propaga falha ao carregar as interações relacionadas', async () => {
    const error = new Error('Falha nas interações');
    mocks.from.mockImplementation(table => queryResult(table === 'conversation_analyses' ? [analysis] : [],
      table === 'interactions' ? error : null));
    const { result } = renderHook(() => useConversationAnalyses(), { wrapper });
    await waitFor(() => expect(result.current.error).toBe(error));
  });
});

describe('Catálogos e métricas não aceitam tipagens falsas', () => {
  it('rejeita categoria desconhecida no catálogo', async () => {
    mocks.from.mockReturnValue(queryResult([{ id: 'topico-1', category: 'desconhecida' }]));
    const { result } = renderHook(() => useTopicsCatalog(), { wrapper });
    await waitFor(() => expect(result.current.error).toMatchObject({ name: 'ZodError' }));
  });

  it('rejeita critérios de scorecard incompatíveis', async () => {
    mocks.from.mockReturnValue(queryResult([{ id: 'scorecard-1', criteria: [{ key: 'escuta', label: 'Escuta', weight: 'alto' }] }]));
    const { result } = renderHook(() => useCoachingScorecards(), { wrapper });
    await waitFor(() => expect(result.current.error).toMatchObject({ name: 'ZodError' }));
  });

  it('rejeita objeções incompatíveis no cálculo de métricas', async () => {
    mocks.from.mockReturnValue(queryResult([{ ...analysis, objections: null }]));
    const { result } = renderHook(() => useCoachingMetrics(), { wrapper });
    await waitFor(() => expect(result.current.error).toMatchObject({ name: 'ZodError' }));
  });
});

describe('O retorno Edge precisa representar sucesso real', () => {
  it.each([{}, { ok: false }, { ok: true, id: 'analise-1' }])('rejeita resposta sem contrato de sucesso: %j', async payload => {
    mocks.invoke.mockResolvedValue({ data: payload, error: null });
    const { result } = renderHook(() => useAnalyzeConversation(), { wrapper });
    await expect(result.current.mutateAsync({ interactionId: 'interacao-1' })).rejects.toMatchObject({ name: 'ZodError' });
    expect(mocks.success).not.toHaveBeenCalled();
  });

  it('propaga o erro de negócio retornado pela Edge Function', async () => {
    mocks.invoke.mockResolvedValue({ data: { error: 'Conteúdo insuficiente' }, error: null });
    const { result } = renderHook(() => useAnalyzeConversation(), { wrapper });
    await expect(result.current.mutateAsync({ interactionId: 'interacao-1' })).rejects.toThrow('Conteúdo insuficiente');
    expect(mocks.success).not.toHaveBeenCalled();
  });

  it('aceita a variante de análise já existente', async () => {
    const payload = { ok: true, cached: true, id: 'analise-1' };
    mocks.invoke.mockResolvedValue({ data: payload, error: null });
    const { result } = renderHook(() => useAnalyzeConversation(), { wrapper });
    await expect(result.current.mutateAsync({ interactionId: 'interacao-1' })).resolves.toEqual(payload);
    expect(mocks.success).toHaveBeenCalledWith('Análise concluída');
  });

  it('valida análise nova sem descartar dados adicionais retornados pelo produtor', async () => {
    const payload = { ok: true, id: 'analise-1', analysis: { ...analysis, emotion_analysis: { joy: 0.8 } } };
    mocks.invoke.mockResolvedValue({ data: payload, error: null });
    const { result } = renderHook(() => useAnalyzeConversation(), { wrapper });
    await expect(result.current.mutateAsync({ interactionId: 'interacao-1' })).resolves.toEqual(payload);
  });
});
