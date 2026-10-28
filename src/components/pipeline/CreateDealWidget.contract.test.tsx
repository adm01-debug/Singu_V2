import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CreateDealWidget } from './CreateDealWidget';

const mocks = vi.hoisted(() => ({ fetch: vi.fn(), getSession: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'dono-local' } }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  auth: { getSession: mocks.getSession, onAuthStateChange: vi.fn() },
} }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/circuitBreaker', () => ({
  getCircuitBreaker: () => ({ call: (operation: () => Promise<unknown>) => operation() }),
  CircuitOpenError: class extends Error {},
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));

const companyId = '11111111-1111-4111-8111-111111111111';
const dealId = '22222222-2222-4222-8222-222222222222';
let client: QueryClient;

function fillForm(value = '149.75', title = '  Proposta de brindes  ') {
  client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  render(<QueryClientProvider client={client}>
    <CreateDealWidget companyId={companyId} companyName="Empresa local" />
  </QueryClientProvider>);
  fireEvent.change(screen.getByPlaceholderText('Título do deal...'), { target: { value: title } });
  fireEvent.change(screen.getByPlaceholderText('Valor R$'), { target: { value } });
  return invalidate;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('fetch', mocks.fetch);
  mocks.getSession.mockResolvedValue({ data: { session: { access_token: 'jwt-local', user: { id: 'dono-local' } } } });
  mocks.fetch.mockImplementation(async () => Response.json({ data: dealId }));
});
afterEach(() => { cleanup(); client?.clear(); vi.unstubAllGlobals(); });

describe('Criação de oportunidade com o contrato da RPC', () => {
  it.each([['149.75', 149.75], ['', 0], ['0', 0]])('envia título e valor %s com os nomes canônicos', async (input, value) => {
    const invalidate = fillForm(String(input));
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Deal criado com sucesso!'));
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    const [url, request] = mocks.fetch.mock.calls[0];
    expect(url).toBe('https://test.supabase.co/functions/v1/external-data');
    expect(request.headers.Authorization).toBe('Bearer jwt-local');
    expect(JSON.parse(request.body)).toEqual({
      action: 'rpc', functionName: 'create_deal',
      params: { p_company_id: companyId, p_titulo: 'Proposta de brindes', p_valor: value },
    });
    expect(screen.getByPlaceholderText('Título do deal...')).toHaveValue('');
    expect(screen.getByPlaceholderText('Valor R$')).toHaveValue(null);
    for (const key of ['deals-pipeline', 'company-deals', 'pipeline-summary', 'daily-summary']) {
      expect(invalidate).toHaveBeenCalledWith({ queryKey: [key] });
    }
  });

  it('mantém os campos e não invalida dados quando o banco recusa a chamada', async () => {
    mocks.fetch.mockImplementation(async () => Response.json({ data: null, error: 'RPC create_deal failed', errorCode: 'PGRST202' }));
    const invalidate = fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Erro ao criar deal'));
    expect(toast.success).not.toHaveBeenCalled();
    expect(invalidate).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText('Título do deal...')).toHaveValue('  Proposta de brindes  ');
    expect(screen.getByPlaceholderText('Valor R$')).toHaveValue(149.75);
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
  });

  it.each([null, '', { id: dealId }])('não anuncia criação sem identificador confirmado: %j', async data => {
    mocks.fetch.mockImplementation(async () => Response.json({ data }));
    const invalidate = fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Erro ao criar deal'));
    expect(toast.success).not.toHaveBeenCalled();
    expect(invalidate).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText('Título do deal...')).toHaveValue('  Proposta de brindes  ');
  });

  it('não chama a RPC com título vazio', async () => {
    fillForm('', '   ');
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));
    expect(toast.warning).toHaveBeenCalledWith('Informe o título do deal');
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it('aguarda a resposta antes de limpar o formulário e bloqueia outro clique pendente', async () => {
    let complete: (response: Response) => void;
    mocks.fetch.mockImplementation(() => new Promise<Response>(resolve => { complete = resolve; }));
    const invalidate = fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));
    await waitFor(() => expect(screen.getByRole('button')).toBeDisabled());
    fireEvent.click(screen.getByRole('button'));
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    expect(toast.success).not.toHaveBeenCalled();
    expect(invalidate).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText('Título do deal...')).toHaveValue('  Proposta de brindes  ');
    complete!(Response.json({ data: dealId }));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(screen.getByPlaceholderText('Título do deal...')).toHaveValue('');
  });
});
