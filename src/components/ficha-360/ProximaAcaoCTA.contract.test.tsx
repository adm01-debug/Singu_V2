import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ProximaAcaoCTA } from './ProximaAcaoCTA';

/**
 * Contrato do registro rápido de interação a partir da próxima ação.
 *
 * O transporte mudou: antes o hook chamava a RPC `create_quick_interaction`
 * com `p_contact_interaction`, argumento que não existe — a função em
 * produção é por EMPRESA (p_company_id, p_tipo, p_resumo, p_vendedor_id,
 * p_followup_dias) e a chamada nunca resolvia. A gravação passou a ser
 * direta em `interactions`. Todos os contratos de comportamento que este
 * arquivo travava seguem travados; só mudou o que é observado.
 */

const mocks = vi.hoisted(() => ({
  insert: vi.fn(), getSession: vi.fn(), generate: vi.fn(),
  channel: 'call', user: { id: 'dono-local' } as { id: string } | null,
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
  from: (table: string) => ({
    insert: (rows: unknown) => ({
      select: () => ({ single: () => mocks.insert(table, rows) }),
    }),
  }),
} }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/circuitBreaker', () => ({
  getCircuitBreaker: () => ({ call: (operation: () => Promise<unknown>) => operation() }),
  CircuitOpenError: class extends Error {},
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));

const contactId = '11111111-1111-4111-8111-111111111111';
const interactionId = '22222222-2222-4222-8222-222222222222';
/** Linha que a gravação devolve quando dá certo. */
const gravado = { data: { id: interactionId, contact_id: contactId }, error: null };
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
  mocks.getSession.mockResolvedValue({ data: { session: { access_token: 'jwt-local', user: mocks.user } } });
  mocks.insert.mockResolvedValue(gravado);
});
afterEach(() => { cleanup(); client?.clear(); });

describe('Registro da próxima ação com contrato de contato', () => {
  it.each(['call', 'email', 'whatsapp', 'meeting', 'linkedin'])('registra %s no contato, sem inventar empresa', async channel => {
    mocks.channel = channel;
    const invalidate = openRegister();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Interação registrada!'));
    const [tabela, linhas] = mocks.insert.mock.calls[0];
    expect(tabela).toBe('interactions');
    // toEqual exato: garante que nenhuma empresa é inventada no registro.
    expect(linhas).toEqual([{
      contact_id: contactId,
      user_id: 'dono-local',
      type: channel === 'linkedin' ? 'note' : channel,
      channel: channel === 'linkedin' ? 'note' : channel,
      direction: 'outbound',
      initiated_by: 'us',
      title: 'Interação rápida',
      content: 'Conversa registrada',
    }]);
    expect(mocks.insert).toHaveBeenCalledTimes(1);
    expect(mocks.generate).toHaveBeenCalledTimes(1);
    expect(screen.queryByPlaceholderText('Resumo da interação...')).not.toBeInTheDocument();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['external-interactions', contactId] });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar interação' }));
    expect(screen.getByPlaceholderText('Resumo da interação...')).toHaveValue('Ligar para o contato');
  });

  it.each([
    { data: null, error: null },
    { data: {}, error: null },
    { data: { id: interactionId }, error: null },
    { data: { id: '', contact_id: contactId }, error: null },
    { data: { id: interactionId, contact_id: interactionId }, error: null },
  ])('não anuncia sucesso sem a confirmação correta: %j', async resposta => {
    mocks.insert.mockResolvedValue(resposta);
    const invalidate = openRegister();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Erro ao registrar interação'));
    expect(toast.success).not.toHaveBeenCalled();
    expect(mocks.generate).not.toHaveBeenCalled();
    expect(invalidate).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText('Resumo da interação...')).toHaveValue('  Conversa registrada  ');
  });

  it('preserva o resumo quando o banco rejeita a gravação', async () => {
    mocks.insert.mockResolvedValue({ data: null, error: { message: 'new row violates row-level security policy', code: '42501' } });
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
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('não envia sem usuário autenticado', async () => {
    mocks.user = null;
    openRegister();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Erro ao registrar interação'));
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('bloqueia Enter repetido enquanto aguarda a confirmação', async () => {
    let complete: (resposta: typeof gravado) => void;
    mocks.insert.mockImplementation(() => new Promise<typeof gravado>(resolve => { complete = resolve; }));
    const invalidate = openRegister();
    const input = screen.getByPlaceholderText('Resumo da interação...');
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(mocks.insert).toHaveBeenCalledTimes(1));
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter' });
      fireEvent.keyDown(input, { key: 'Enter' });
    });
    expect(toast.success).not.toHaveBeenCalled();
    expect(invalidate).not.toHaveBeenCalled();
    expect(mocks.insert).toHaveBeenCalledTimes(1);
    complete!(gravado);
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Interação registrada!'));
    expect(mocks.generate).toHaveBeenCalledTimes(1);
  });

  it('uma confirmação atrasada não apaga o rascunho de outro contato', async () => {
    let complete: (resposta: typeof gravado) => void;
    mocks.insert.mockImplementation(() => new Promise<typeof gravado>(resolve => { complete = resolve; }));
    const invalidate = openRegister();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    await waitFor(() => expect(mocks.insert).toHaveBeenCalledTimes(1));
    client.setQueryData(['external-interactions', interactionId], [{ id: 'registro-de-outro-contato' }]);
    view.rerender(<QueryClientProvider client={client}>
      <ProximaAcaoCTA contactId={interactionId} contactName="Outro contato" />
    </QueryClientProvider>);
    expect(screen.queryByPlaceholderText('Resumo da interação...')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Registrar interação' }));
    fireEvent.change(screen.getByPlaceholderText('Resumo da interação...'), { target: { value: 'Rascunho do outro contato' } });
    await act(async () => { complete!(gravado); });
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ['external-interactions', contactId] }));
    expect(screen.getByPlaceholderText('Resumo da interação...')).toHaveValue('Rascunho do outro contato');
    expect(client.getQueryState(['external-interactions', interactionId])?.isInvalidated).toBe(false);
    expect(toast.success).not.toHaveBeenCalled();
    expect(mocks.generate).not.toHaveBeenCalled();
  });
});
