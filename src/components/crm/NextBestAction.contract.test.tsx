import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NextBestAction } from './NextBestAction';

const mocks = vi.hoisted(() => ({
  suggest: vi.fn(),
  insert: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'usuario-teste' } }) }));
vi.mock('@/hooks/useEdgeFunctionActions', () => ({
  useEdgeFunctionActions: () => ({ loading: {}, suggestNextAction: mocks.suggest, invoke: vi.fn() }),
}));
vi.mock('@tanstack/react-query', () => ({ useQuery: () => ({ data: [], isLoading: false }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (table: string) => ({ insert: (rows: object[]) => mocks.insert(table, rows) }) },
}));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock('sonner', () => ({ toast: { success: mocks.success, error: mocks.error } }));
vi.mock('@/lib/errorMessages', () => ({ parseApiError: () => 'Erro ao concluir ação' }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Acesso à rede proibido neste teste'); }));
  mocks.insert.mockResolvedValue({ error: null });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function concluirAcao(actionType: string) {
  mocks.suggest.mockResolvedValue({ suggestion: { title: 'Contato sugerido', action_type: actionType } });
  render(<NextBestAction contactId="contato-teste" />);
  fireEvent.click(screen.getByRole('button', { name: 'Analisar' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Marcar como Concluído' }));
  await waitFor(() => expect(mocks.insert).toHaveBeenCalledWith('interactions', expect.any(Array)));
}

describe('Contrato canônico de conclusão de próxima ação', () => {
  it.each(['whatsapp', 'call', 'email', 'meeting', 'social'])('preserva o tipo permitido %s e informa canal e direção', async (actionType) => {
    await concluirAcao(actionType);
    expect(mocks.insert).toHaveBeenCalledWith('interactions', [expect.objectContaining({
      type: actionType,
      channel: actionType,
      direction: 'outbound',
      contact_id: 'contato-teste',
    })]);
    await waitFor(() => expect(mocks.success).toHaveBeenCalled());
  });

  it.each(['gift', 'follow_up'])('registra %s como nota sem violar a constraint de tipo', async (actionType) => {
    await concluirAcao(actionType);
    expect(mocks.insert).toHaveBeenCalledWith('interactions', [expect.objectContaining({
      type: 'note',
      channel: actionType,
      direction: 'outbound',
    })]);
  });

  it('não anuncia conclusão quando a gravação da interação falha', async () => {
    mocks.insert.mockImplementation(async (table: string) => ({ error: table === 'interactions' ? new Error('Falha na interação') : null }));
    await concluirAcao('whatsapp');
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith('Erro ao concluir ação'));
    expect(mocks.success).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Marcar como Concluído' })).toBeInTheDocument();
  });
});
