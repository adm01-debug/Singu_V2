import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ProximaAcaoCTA } from './ProximaAcaoCTA';

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(), getSession: vi.fn(), generate: vi.fn(), channel: 'call', user: { id: 'dono-local' } as { id: string } | null,
}));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('@/hooks/useNextBestAction', () => ({ useNextBestAction: () => ({
  nextAction: { action: 'Ligar para o contato', reason: 'Retomar a conversa', channel: mocks.channel, urgency: 'medium' },
  generate: mocks.generate, isLoading: false, isGenerating: false,
}) }));
vi.mock('@/hooks/useBestContactTime', () => ({ useBestContactTime: () => ({ data: null }) }));
vi.mock('@/hooks/useTasks', () => ({ useCreateTask: () => ({ mutate: vi.fn(), isPending: false }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  auth: { getSession: mocks.getSession, onAuthStateChange: vi.fn() },
} }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/circuitBreaker', () => ({
  getCircuitBreaker: () => ({ call: (operation: () => Promise<unknown>) => operation() }),
  CircuitOpenError: class extends Error {},
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));

const contactId = '11111111-1111-4111-8111-111111111111';
const interactionId = '22222222-2222-4222-8222-222222222222';
const confirmed = { success: true, interaction_id: interactionId, contact_id: contactId };
let client: QueryClient;
let view: ReturnType<typeof render>;

function openRegister(summary = '  Conversa registrada  ') {
  client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  view = render(<QueryClientProvider client={client}>
    <ProximaAcaoCTA contactId={contactId} contactName="Contato local" />
  </QueryClientProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Registrar interação' }));
  fireEvent.change(screen.getByPlaceholderText('Resumo da interação...'), { target: { value: summary } });
  return invalidate;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.user = { id: 'dono-local' };
  mocks.channel = 'call';
  vi.stubGlobal('fetch', mocks.fetch);
  mocks.getSession.mockResolvedValue({ data: { session: { access_token: 'jwt-local', user: mocks.user } } });
  mocks.fetch.mockImplementation(async (_url, request) => JSON.parse(request.body).params.p_contact_interaction
    ? Response.json({ data: confirmed })
    : Response.json({ data: null, error: 'RPC create_quick_interaction failed', errorCode: 'PGRST202' }));
});
afterEach(() => { cleanup(); client?.clear(); vi.unstubAllGlobals(); });

describe('Registro da próxima ação com contrato de contato', () => {
  it.each(['call', 'email', 'whatsapp', 'meeting', 'linkedin'])('registra %s no contato, sem inventar empresa', async channel => {
    mocks.channel = channel;
    const invalidate = openRegister();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Interação registrada!'));
    const [url, request] = mocks.fetch.mock.calls[0];
    expect(url).toBe('https://test.supabase.co/functions/v1/external-data');
    expect(request.headers.Authorization).toBe('Bearer jwt-local');
    expect(JSON.parse(request.body)).toEqual({ action: 'rpc', functionName: 'create_quick_interaction', params: {
      p_contact_interaction: { contact_id: contactId, tipo: channel === 'linkedin' ? 'note' : channel, resumo: 'Conversa registrada' },
    } });
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    expect(mocks.generate).toHaveBeenCalledTimes(1);
    expect(screen.queryByPlaceholderText('Resumo da interação...')).not.toBeInTheDocument();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['external-interactions', contactId] });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar interação' }));
    expect(screen.getByPlaceholderText('Resumo da interação...')).toHaveValue('Ligar para o contato');
  });

  it.each([null, {}, { ...confirmed, success: false }, { ...confirmed, interaction_id: '' }, { ...confirmed, contact_id: interactionId }])(
    'não anuncia sucesso sem a confirmação correta: %j', async data => {
      mocks.fetch.mockImplementation(async () => Response.json({ data }));
      const invalidate = openRegister();
      fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Erro ao registrar interação'));
      expect(toast.success).not.toHaveBeenCalled();
      expect(mocks.generate).not.toHaveBeenCalled();
      expect(invalidate).not.toHaveBeenCalled();
      expect(screen.getByPlaceholderText('Resumo da interação...')).toHaveValue('  Conversa registrada  ');
    },
  );

  it('preserva o resumo quando o banco rejeita a chamada', async () => {
    mocks.fetch.mockImplementation(async () => Response.json({ data: null, error: 'RPC create_quick_interaction failed', errorCode: '42501' }));
    const invalidate = openRegister();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Erro ao registrar interação'));
    expect(toast.success).not.toHaveBeenCalled();
    expect(mocks.generate).not.toHaveBeenCalled();
    expect(invalidate).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText('Resumo da interação...')).toHaveValue('  Conversa registrada  ');
  });

  it('não envia resumo vazio', () => {
    openRegister('   ');
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(toast.warning).toHaveBeenCalledWith('Informe um resumo');
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it('não envia sem usuário autenticado', async () => {
    mocks.user = null;
    openRegister();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Erro ao registrar interação'));
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it('bloqueia Enter repetido enquanto aguarda a confirmação', async () => {
    let complete: (response: Response) => void;
    mocks.fetch.mockImplementation(() => new Promise<Response>(resolve => { complete = resolve; }));
    const invalidate = openRegister();
    const input = screen.getByPlaceholderText('Resumo da interação...');
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(mocks.fetch).toHaveBeenCalledTimes(1));
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter' });
      fireEvent.keyDown(input, { key: 'Enter' });
    });
    expect(toast.success).not.toHaveBeenCalled();
    expect(invalidate).not.toHaveBeenCalled();
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    complete!(Response.json({ data: confirmed }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Interação registrada!'));
    expect(mocks.generate).toHaveBeenCalledTimes(1);
  });

  it('uma confirmação atrasada não apaga o rascunho de outro contato', async () => {
    let complete: (response: Response) => void;
    mocks.fetch.mockImplementation(() => new Promise<Response>(resolve => { complete = resolve; }));
    const invalidate = openRegister();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    await waitFor(() => expect(mocks.fetch).toHaveBeenCalledTimes(1));
    client.setQueryData(['external-interactions', interactionId], [{ id: 'registro-de-outro-contato' }]);
    view.rerender(<QueryClientProvider client={client}>
      <ProximaAcaoCTA contactId={interactionId} contactName="Outro contato" />
    </QueryClientProvider>);
    expect(screen.queryByPlaceholderText('Resumo da interação...')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Registrar interação' }));
    fireEvent.change(screen.getByPlaceholderText('Resumo da interação...'), { target: { value: 'Rascunho do outro contato' } });
    await act(async () => { complete!(Response.json({ data: confirmed })); });
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ['external-interactions', contactId] }));
    expect(screen.getByPlaceholderText('Resumo da interação...')).toHaveValue('Rascunho do outro contato');
    expect(client.getQueryState(['external-interactions', interactionId])?.isInvalidated).toBe(false);
    expect(toast.success).not.toHaveBeenCalled();
    expect(mocks.generate).not.toHaveBeenCalled();
  });
});
