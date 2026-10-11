import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useEmailCampaigns } from '../useEmailCampaigns';
import { useNextBestAction } from '../useNextBestAction';

const mocks = vi.hoisted(() => ({ from: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'usuario-1' } }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from } }));
vi.mock('sonner', () => ({ toast: { success: mocks.success, error: mocks.error, warning: mocks.warning } }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));

type Response = { data: unknown; error: Error | null };
function queryWithResponse(response: Promise<Response>) {
  const query = {
    select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn(), update: vi.fn(), insert: vi.fn(),
    not: vi.fn(), range: vi.fn(), maybeSingle: vi.fn(), single: vi.fn(), then: response.then.bind(response),
  };
  for (const method of [query.select, query.eq, query.order, query.limit, query.update, query.insert,
    query.not, query.range, query.maybeSingle, query.single]) method.mockReturnValue(query);
  return query;
}
function queryResult(data: unknown, error: Error | null = null) {
  return queryWithResponse(Promise.resolve({ data, error }));
}

const action = {
  id: 'acao-1', contact_id: 'contato-1', action: 'Retornar a proposta', reason: 'Cliente solicitou retorno',
  channel: 'email', urgency: 'medium', suggested_script: 'Vamos conversar?', expected_outcome: null,
  generated_at: '2026-10-11T10:00:00.000Z', model: 'modelo', status: 'pending',
};
let queryClient: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;

beforeEach(() => {
  vi.resetAllMocks();
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  mocks.from.mockReturnValue(queryResult(action));
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Rede real proibida neste teste'); }));
});
afterEach(() => { queryClient.clear(); vi.unstubAllGlobals(); });

async function loadAction() {
  const hook = renderHook(() => useNextBestAction('contato-1'), { wrapper });
  await waitFor(() => expect(hook.result.current.nextAction?.id).toBe(action.id));
  return hook;
}
function complete(hook: Awaited<ReturnType<typeof loadAction>>) {
  return new Promise<void>((resolve, reject) => {
    hook.result.current.complete({ id: action.id }, { onSuccess: () => resolve(), onError: reject });
  });
}

describe('Conclusão parcial não duplica a interação na mesma instância', () => {
  it('repete apenas o update quando a interação já foi gravada', async () => {
    const hook = await loadAction();
    const interaction = queryResult(null);
    const failedUpdate = queryResult(null, new Error('Falha no status'));
    const retryUpdate = queryResult({ id: action.id });
    mocks.from.mockReturnValueOnce(interaction).mockReturnValueOnce(failedUpdate).mockReturnValueOnce(retryUpdate);
    await act(async () => { await expect(complete(hook)).rejects.toThrow('Falha no status'); });
    expect(mocks.success).not.toHaveBeenCalled();
    await act(async () => { await complete(hook); });
    expect(interaction.insert).toHaveBeenCalledTimes(1);
    expect(retryUpdate.insert).not.toHaveBeenCalled();
    expect(retryUpdate.update).toHaveBeenCalledTimes(1);
    expect(retryUpdate.eq).toHaveBeenCalledWith('generated_at', action.generated_at);
    expect(mocks.success).toHaveBeenCalledWith('Tarefa marcada como concluída');
  });

  it('compartilha a gravação entre duas tentativas simultâneas', async () => {
    const hook = await loadAction();
    let release!: (response: Response) => void;
    const interaction = queryWithResponse(new Promise<Response>(resolve => { release = resolve; }));
    const update = queryResult({ id: action.id });
    mocks.from.mockReturnValueOnce(interaction).mockReturnValueOnce(update);
    let second!: Promise<void>;
    act(() => {
      // Callbacks passados a mutate só observam a tentativa mais recente; o cache observa ambas.
      hook.result.current.complete({ id: action.id });
      second = complete(hook);
    });
    await waitFor(() => expect(interaction.insert).toHaveBeenCalledTimes(1));
    await act(async () => {
      release({ data: null, error: null });
      await second;
    });
    expect(interaction.insert).toHaveBeenCalledTimes(1);
    expect(update.update).toHaveBeenCalledTimes(1);
    expect(queryClient.getMutationCache().getAll().map(mutation => mutation.state.status)).toEqual(['success', 'success']);
  });

  it('permite repetir a interação quando seu insert falhou', async () => {
    const hook = await loadAction();
    const failedInteraction = queryResult(null, new Error('Falha na interação'));
    const retryInteraction = queryResult(null);
    const update = queryResult({ id: action.id });
    mocks.from.mockReturnValueOnce(failedInteraction).mockReturnValueOnce(retryInteraction).mockReturnValueOnce(update);
    await act(async () => { await expect(complete(hook)).rejects.toThrow('Falha na interação'); });
    await act(async () => { await complete(hook); });
    expect(failedInteraction.insert).toHaveBeenCalledTimes(1);
    expect(retryInteraction.insert).toHaveBeenCalledTimes(1);
    expect(update.update).toHaveBeenCalledTimes(1);
  });

  it.each([null, { id: 'outra-acao' }])('não anuncia conclusão sem confirmação do ID: %j', async returned => {
    const hook = await loadAction();
    mocks.from.mockReturnValueOnce(queryResult(null)).mockReturnValueOnce(queryResult(returned));
    await act(async () => { await expect(complete(hook)).rejects.toThrow('não foi confirmada'); });
    expect(mocks.success).not.toHaveBeenCalled();
  });

  it('uma nova geração da mesma ação recebe sua própria interação', async () => {
    const hook = await loadAction();
    const firstInteraction = queryResult(null);
    mocks.from.mockReturnValueOnce(firstInteraction).mockReturnValueOnce(queryResult(null, new Error('Falha no status')));
    await act(async () => { await expect(complete(hook)).rejects.toThrow('Falha no status'); });
    await act(async () => {
      queryClient.setQueryData(['next-best-action', 'usuario-1', 'contato-1'], { ...action, generated_at: '2026-10-11T11:00:00.000Z' });
    });
    await waitFor(() => expect(hook.result.current.nextAction?.generated_at).toBe('2026-10-11T11:00:00.000Z'));
    const secondInteraction = queryResult(null);
    const update = queryResult({ id: action.id });
    mocks.from.mockReturnValueOnce(secondInteraction).mockReturnValueOnce(update);
    await act(async () => { await complete(hook); });
    expect(firstInteraction.insert).toHaveBeenCalledTimes(1);
    expect(secondInteraction.insert).toHaveBeenCalledTimes(1);
    expect(update.eq).toHaveBeenCalledWith('generated_at', '2026-10-11T11:00:00.000Z');
  });
});

describe('Preparar destinatários não comprova envio de e-mail', () => {
  function campaignQueries(existing: { contact_id: string }[] = [], insertError: Error | null = null) {
    const campaigns = queryResult([]);
    const contacts = queryResult([{ id: 'contato-1', email: 'contato@example.invalid', first_name: 'Contato', last_name: null }]);
    const recipients = queryResult(existing);
    const inserted = queryResult(null, insertError);
    let recipientCalls = 0;
    mocks.from.mockImplementation((table: string) => {
      if (table === 'contacts') return contacts;
      if (table === 'campaign_recipients') return recipientCalls++ === 0 ? recipients : inserted;
      return campaigns;
    });
    return { campaigns, recipients, inserted };
  }

  it('persiste pending e sent_at nulo, preservando o status da campanha', async () => {
    const { campaigns, recipients, inserted } = campaignQueries();
    const { result } = renderHook(() => useEmailCampaigns(), { wrapper });
    await act(async () => {
      await expect(result.current.sendCampaign.mutateAsync('campanha-1')).resolves.toEqual({
        recipientsCount: 1, newlyAdded: 1, deliveryConfirmed: false,
      });
    });
    expect(inserted.insert).toHaveBeenCalledWith([expect.objectContaining({ status: 'pending', sent_at: null })]);
    for (const [payload] of campaigns.update.mock.calls) {
      expect(payload).not.toHaveProperty('status');
      expect(payload).not.toHaveProperty('sent_at');
    }
    expect(recipients.eq).toHaveBeenCalledWith('user_id', 'usuario-1');
    expect(mocks.success).not.toHaveBeenCalled();
    expect(mocks.warning).toHaveBeenCalledWith(expect.stringContaining('Nenhum envio foi confirmado'));
  });

  it('preserva destinatários existentes e não os declara enviados novamente', async () => {
    const { inserted } = campaignQueries([{ contact_id: 'contato-1' }]);
    const { result } = renderHook(() => useEmailCampaigns(), { wrapper });
    await act(async () => {
      await expect(result.current.sendCampaign.mutateAsync('campanha-1')).resolves.toMatchObject({ newlyAdded: 0, deliveryConfirmed: false });
    });
    expect(inserted.insert).not.toHaveBeenCalled();
    expect(mocks.success).not.toHaveBeenCalled();
  });

  it('propaga a falha do lote sem aviso de preparação concluída', async () => {
    const failure = new Error('Falha no lote');
    campaignQueries([], failure);
    const { result } = renderHook(() => useEmailCampaigns(), { wrapper });
    await act(async () => { await expect(result.current.sendCampaign.mutateAsync('campanha-1')).rejects.toBe(failure); });
    expect(mocks.warning).not.toHaveBeenCalled();
    expect(mocks.success).not.toHaveBeenCalled();
  });
});
