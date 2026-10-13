import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { queryExternalData } from '@/lib/externalData';
import type { Sequence } from '@/hooks/useSequences';
import { SequenceEnrollDialog } from './SequenceEnrollDialog';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'dono' } }) }));
vi.mock('@/lib/externalData', () => ({ queryExternalData: vi.fn() }));

const sequence: Sequence = {
  id: 'sequencia', user_id: 'dono', name: 'Contrato', description: null, status: 'active',
  pause_on_reply: true, pause_on_meeting: true, max_enrollments: 100,
  total_enrolled: 0, total_completed: 0, total_replied: 0,
  created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z',
};
const contact = { id: 'contato', first_name: 'Maria', last_name: 'Silva', email: null };
let client: QueryClient;

function openDialog() {
  const onEnroll = vi.fn().mockResolvedValue(undefined);
  render(
    <QueryClientProvider client={client}>
      <SequenceEnrollDialog sequence={sequence} open onOpenChange={vi.fn()} onEnroll={onEnroll} loading={false} />
    </QueryClientProvider>,
  );
  return onEnroll;
}

describe('Inscrição com busca e cache da carteira', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });
  afterEach(() => {
    cleanup();
    client.clear();
  });

  it('impede fechar pelo X ou Escape durante uma inscrição pendente', async () => {
    vi.mocked(queryExternalData).mockResolvedValue({ data: [contact], count: 1, error: null });
    const onOpenChange = vi.fn();
    render(
      <QueryClientProvider client={client}>
        <SequenceEnrollDialog sequence={sequence} open onOpenChange={onOpenChange} onEnroll={vi.fn()} loading />
      </QueryClientProvider>,
    );
    await screen.findByRole('button', { name: 'Maria Silva' });
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
  });

  it('repete o mesmo termo depois de falha transitória e oferece o contato recuperado', async () => {
    vi.mocked(queryExternalData)
      .mockResolvedValueOnce({ data: [], count: 0, error: null })
      .mockResolvedValueOnce({ data: null, count: null, error: new Error('Consulta indisponível') })
      .mockResolvedValueOnce({ data: [contact], count: 1, error: null });
    openDialog();
    await screen.findByText('Nenhum contato encontrado.');
    fireEvent.change(screen.getByLabelText('Buscar contato por nome ou email'), { target: { value: 'Maria Silva' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    await screen.findByRole('alert');
    expect(queryExternalData).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    await screen.findByRole('button', { name: 'Maria Silva' });
    expect(queryExternalData).toHaveBeenCalledTimes(3);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('não inscreve um contato selecionado que desapareceu do cache após arquivamento', async () => {
    vi.mocked(queryExternalData).mockResolvedValue({ data: [contact], count: 1, error: null });
    const onEnroll = openDialog();
    fireEvent.click(await screen.findByRole('button', { name: 'Maria Silva' }));
    const submit = screen.getByRole('button', { name: 'Inscrever contato' });
    expect(submit).toBeEnabled();
    act(() => client.setQueryData(['sequence-enroll-contacts', 'dono', ''], []));
    await waitFor(() => expect(submit).toBeDisabled());
    fireEvent.click(submit);
    expect(onEnroll).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Maria Silva' })).not.toBeInTheDocument();
  });
});
