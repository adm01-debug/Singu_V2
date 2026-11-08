import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { updateExternalData } from '@/lib/externalData';
import { toast } from 'sonner';
import { SoftDeletePanel } from './SoftDeletePanel';

vi.mock('@/lib/externalData', () => ({ updateExternalData: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'usuario-1' } }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const detailKey = ['contact', 'usuario-1', 'contato-1'];
const otherUserKey = ['contact', 'usuario-2', 'contato-1'];
const otherContactKey = ['contact', 'usuario-1', 'contato-2'];
let cache: QueryClient;
beforeEach(() => {
  vi.clearAllMocks();
  cache = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  for (const key of [detailKey, otherUserKey, otherContactKey, ['contacts']]) cache.setQueryData(key, {});
});
afterEach(() => { cleanup(); cache.clear(); });

function panel(deletedAt: string | null = null) {
  render(<QueryClientProvider client={cache}><SoftDeletePanel contactId="contato-1" contactName="Ana" deletedAt={deletedAt} /></QueryClientProvider>);
}
function confirmDelete() {
  fireEvent.click(screen.getByRole('button', { name: 'Mover para Lixeira' }));
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Mover para Lixeira' }));
}
function expectInvalidation() {
  expect(cache.getQueryState(detailKey)?.isInvalidated).toBe(true);
  expect(cache.getQueryState(['contacts'])?.isInvalidated).toBe(true);
  expect(cache.getQueryState(otherUserKey)?.isInvalidated).toBe(false);
  expect(cache.getQueryState(otherContactKey)?.isInvalidated).toBe(false);
}

describe('confirmação da lixeira sem depender de realtime', () => {
  it('fecha o diálogo e invalida somente a ficha correta após arquivamento confirmado', async () => {
    vi.mocked(updateExternalData).mockResolvedValue({ data: { id: 'contato-1', deleted_at: '2026-10-18T12:00:00Z' }, error: null });
    panel(); confirmDelete();
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Contato movido para lixeira'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(updateExternalData).toHaveBeenCalledTimes(1);
    expectInvalidation();
  });
  it('invalida a ficha após restauração confirmada', async () => {
    vi.mocked(updateExternalData).mockResolvedValue({ data: { id: 'contato-1', deleted_at: null }, error: null });
    panel('2026-10-18T12:00:00Z');
    fireEvent.click(screen.getByRole('button', { name: 'Restaurar contato' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expectInvalidation();
  });
  it.each([null, { id: 'outro-contato', deleted_at: '2026-10-18T12:00:00Z' }])('mantém o diálogo e não anuncia sucesso com resposta inválida: %j', async data => {
    vi.mocked(updateExternalData).mockResolvedValue({ data, error: null });
    panel(); confirmDelete();
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(toast.success).not.toHaveBeenCalled();
    expect(cache.getQueryState(detailKey)?.isInvalidated).toBe(false);
  });
  it('mantém a restauração disponível quando o banco recusa a atualização', async () => {
    vi.mocked(updateExternalData).mockResolvedValue({ data: null, error: new Error('Operação recusada') });
    panel('2026-10-18T12:00:00Z');
    fireEvent.click(screen.getByRole('button', { name: 'Restaurar contato' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Restaurar contato' })).toBeEnabled());
    expect(toast.success).not.toHaveBeenCalled();
    expect(cache.getQueryState(detailKey)?.isInvalidated).toBe(false);
  });
});
