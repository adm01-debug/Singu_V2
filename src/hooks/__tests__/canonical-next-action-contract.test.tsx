import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useNextBestAction } from '../useNextBestAction';
import { useCSATSurveys } from '../useCSATSurveys';

const mocks = vi.hoisted(() => ({ from: vi.fn(), invoke: vi.fn(), success: vi.fn(), error: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'usuario-1' } }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from, functions: { invoke: mocks.invoke } } }));
vi.mock('sonner', () => ({ toast: { success: mocks.success, error: mocks.error } }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));

function queryResult(data: unknown, error: Error | null = null) {
  const response = Promise.resolve({ data, error });
  const query = {
    select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn(), in: vi.fn(), update: vi.fn(), insert: vi.fn(),
    maybeSingle: vi.fn(), single: vi.fn(), then: response.then.bind(response),
  };
  for (const method of [query.select, query.eq, query.order, query.limit, query.in, query.update, query.insert, query.maybeSingle, query.single]) {
    method.mockReturnValue(query);
  }
  return query;
}

const action = {
  id: 'acao-1', contact_id: 'contato-1', action: 'Conversar sobre a proposta', reason: 'Cliente solicitou retorno',
  channel: 'linkedin', urgency: 'medium', suggested_script: 'Podemos conversar?', expected_outcome: null,
  generated_at: '2026-04-02T10:00:00.000Z', model: 'gemini-2.0-flash', status: 'pending', completed_at: null,
  completion_notes: null, edited_script: null, contextual_tone: null, was_successful: null,
};
let queryClient: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;

beforeEach(() => {
  vi.resetAllMocks();
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  mocks.from.mockReturnValue(queryResult(action));
  mocks.invoke.mockResolvedValue({ data: { success: true, next_action: action }, error: null });
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Rede real proibida neste teste'); }));
});
afterEach(() => { queryClient.clear(); vi.unstubAllGlobals(); });

async function loadAction() {
  const hook = renderHook(() => useNextBestAction('contato-1'), { wrapper });
  await waitFor(() => expect(hook.result.current.nextAction?.id).toBe('acao-1'));
  return hook;
}

async function generate(hook: Awaited<ReturnType<typeof loadAction>>) {
  const promise = new Promise((resolve, reject) => {
    hook.result.current.generate(undefined, { onSuccess: resolve, onError: reject });
  });
  return promise;
}

async function complete(hook: Awaited<ReturnType<typeof loadAction>>, id = 'acao-1') {
  return new Promise((resolve, reject) => {
    hook.result.current.complete({ id }, { onSuccess: resolve, onError: reject });
  });
}

describe('Contrato real da próxima melhor ação', () => {
  it('envia contactId e recupera o ID persistido quando o produtor não retorna ID', async () => {
    const hook = await loadAction();
    const { id: omittedId, ...generated } = action;
    expect(omittedId).toBe('acao-1');
    mocks.invoke.mockResolvedValue({ data: { success: true, next_action: generated }, error: null });
    const persisted = queryResult(action);
    mocks.from.mockReturnValue(persisted);
    await act(async () => { await expect(generate(hook)).resolves.toMatchObject({ id: 'acao-1' }); });
    expect(mocks.invoke).toHaveBeenCalledWith('next-best-action', { body: { contactId: 'contato-1' } });
    expect(persisted.eq).toHaveBeenCalledWith('generated_at', action.generated_at);
    expect(persisted.eq).toHaveBeenCalledWith('user_id', 'usuario-1');
    expect(mocks.success).toHaveBeenCalledWith('Próxima ação gerada');
  });

  it.each([
    null,
    { success: false, next_action: action },
    { success: true, next_action: { ...action, channel: 'inventado' } },
    { success: true, next_action: { ...action, urgency: 'imediata' } },
    { success: true, next_action: { ...action, generated_at: 'inválida' } },
    { success: true, next_action: { ...action, contact_id: 'outro-contato' } },
  ])('rejeita resposta incompatível sem anunciar sucesso: %j', async payload => {
    const hook = await loadAction();
    mocks.from.mockClear();
    mocks.invoke.mockResolvedValue({ data: payload, error: null });
    await act(async () => { await expect(generate(hook)).rejects.toBeInstanceOf(Error); });
    expect(mocks.success).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('não anuncia geração persistida quando a consulta de confirmação falha', async () => {
    const hook = await loadAction();
    const failure = new Error('Gravação não confirmada');
    mocks.from.mockReturnValue(queryResult(null, failure));
    await act(async () => { await expect(generate(hook)).rejects.toBe(failure); });
    expect(mocks.success).not.toHaveBeenCalled();
  });

  it('não fabrica ID quando não encontra a ação persistida', async () => {
    const hook = await loadAction();
    mocks.from.mockReturnValue(queryResult(null));
    await act(async () => { await expect(generate(hook)).rejects.toThrow('gravação não foi confirmada'); });
    expect(mocks.success).not.toHaveBeenCalled();
  });

  it.each(['whatsapp', 'email', 'call', 'linkedin', 'meeting'])('registra %s com tipo canônico antes de concluir', async channel => {
    mocks.from.mockReturnValue(queryResult({ ...action, channel }));
    const hook = await loadAction();
    const interaction = queryResult(null);
    const update = queryResult({ id: action.id });
    mocks.from.mockReturnValueOnce(interaction).mockReturnValueOnce(update);
    await act(async () => { await complete(hook); });
    expect(interaction.insert).toHaveBeenCalledWith([expect.objectContaining({
      type: channel === 'linkedin' ? 'social' : channel, channel, direction: 'outbound', initiated_by: 'us',
    })]);
    expect(update.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'completed' }));
    expect(interaction.insert.mock.invocationCallOrder[0]).toBeLessThan(update.update.mock.invocationCallOrder[0]);
  });

  it('não marca como concluída quando a interação falha', async () => {
    const hook = await loadAction();
    const failure = new Error('Falha ao registrar interação');
    const interaction = queryResult(null, failure);
    mocks.from.mockClear().mockReturnValue(interaction);
    await act(async () => { await expect(complete(hook)).rejects.toBe(failure); });
    expect(interaction.update).not.toHaveBeenCalled();
    expect(mocks.from).toHaveBeenCalledTimes(1);
    expect(mocks.success).not.toHaveBeenCalled();
  });

  it('propaga falha do update depois da interação, sem falso sucesso', async () => {
    const hook = await loadAction();
    const failure = new Error('Falha no status');
    mocks.from.mockReturnValueOnce(queryResult(null)).mockReturnValueOnce(queryResult(null, failure));
    await act(async () => { await expect(complete(hook)).rejects.toBe(failure); });
    expect(mocks.success).not.toHaveBeenCalled();
  });

  it('rejeita ID divergente antes de qualquer gravação', async () => {
    const hook = await loadAction();
    mocks.from.mockClear();
    await act(async () => { await expect(complete(hook, 'outra-acao')).rejects.toThrow('não corresponde'); });
    expect(mocks.from).not.toHaveBeenCalled();
  });
});

describe('Notas CSAT respeitam a constraint canônica 1–5', () => {
  it.each([0, 6, 10, 1.5, Number.NaN, Number.POSITIVE_INFINITY])('rejeita a nota %s antes do update', async score => {
    const query = queryResult([]);
    mocks.from.mockReturnValue(query);
    const { result } = renderHook(() => useCSATSurveys(), { wrapper });
    await act(async () => { await expect(result.current.answer.mutateAsync({ id: 'pesquisa-1', score })).rejects.toThrow('1 e 5'); });
    expect(query.update).not.toHaveBeenCalled();
    expect(mocks.success).not.toHaveBeenCalled();
  });
  it.each([1, 5])('aceita a nota %s sem atingir pesquisas NPS', async score => {
    const query = queryResult([]);
    query.maybeSingle.mockResolvedValue({ data: { id: 'pesquisa-1' }, error: null });
    mocks.from.mockReturnValue(query);
    const { result } = renderHook(() => useCSATSurveys(), { wrapper });
    await act(async () => { await result.current.answer.mutateAsync({ id: 'pesquisa-1', score }); });
    expect(query.update).toHaveBeenCalledWith(expect.objectContaining({ score }));
    expect(query.eq).toHaveBeenCalledWith('survey_type', 'csat');
  });
});
