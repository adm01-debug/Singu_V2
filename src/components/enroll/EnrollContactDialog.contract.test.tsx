import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { queryExternalData } from '@/lib/externalData';
import { EnrollContactDialog } from './EnrollContactDialog';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'dono' } }) }));
vi.mock('@/lib/externalData', () => ({ queryExternalData: vi.fn() }));

const contact = { id: 'contato', first_name: 'Maria', last_name: 'Silva', email: null };
let client: QueryClient;

function openDialog() {
  const onEnroll = vi.fn().mockResolvedValue(undefined);
  render(
    <QueryClientProvider client={client}>
      <EnrollContactDialog
        title="Inscrever contato no workflow"
        description="Selecione um contato da sua carteira."
        enrollLabel="Inscrever contato"
        cachePrefix="enroll-contacts"
        open
        onOpenChange={vi.fn()}
        onEnroll={onEnroll}
        loading={false}
      />
    </QueryClientProvider>,
  );
  return onEnroll;
}

describe('Inscrição com busca e cache da carteira (dialógo genérico)', () => {
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
        <EnrollContactDialog
          title="Inscrever contato no workflow"
          description="Selecione um contato da sua carteira."
          enrollLabel="Inscrever contato"
          cachePrefix="enroll-contacts"
          open
          onOpenChange={onOpenChange}
          onEnroll={vi.fn()}
          loading
        />
      </QueryClientProvider>,
    );
    await screen.findByRole('button', { name: 'Maria Silva' });
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
  });

  it('não inscreve um contato selecionado que desapareceu do cache após arquivamento', async () => {
    vi.mocked(queryExternalData).mockResolvedValue({ data: [contact], count: 1, error: null });
    const onEnroll = openDialog();
    fireEvent.click(await screen.findByRole('button', { name: 'Maria Silva' }));
    const submit = screen.getByRole('button', { name: 'Inscrever contato' });
    expect(submit).toBeEnabled();
    act(() => client.setQueryData(['enroll-contacts', 'dono', ''], []));
    await waitFor(() => expect(submit).toBeDisabled());
    fireEvent.click(submit);
    expect(onEnroll).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Maria Silva' })).not.toBeInTheDocument();
  });
});
