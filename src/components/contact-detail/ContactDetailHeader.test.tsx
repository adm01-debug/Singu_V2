import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizeExternalContact } from '@/hooks/useContacts';
import type { RelationshipStage } from '@/types';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ContactDetailHeader } from './ContactDetailHeader';

const state = vi.hoisted(() => ({ updateContact: vi.fn(), success: vi.fn(), error: vi.fn() }));

vi.mock('@/hooks/useContacts', async importOriginal => ({
  ...await importOriginal<typeof import('@/hooks/useContacts')>(),
  useContacts: () => ({ updateContact: state.updateContact }),
}));
vi.mock('@/hooks/useContactRelationalData', () => ({ useContactRelationalData: () => ({ data: null }) }));
vi.mock('@/hooks/useContactView360', () => ({ useContactView360: () => ({ data: null }) }));
vi.mock('sonner', () => ({ toast: { success: state.success, error: state.error } }));
vi.mock('./DuplicateManagementPanel', () => ({ DuplicateManagementPanel: () => null }));
vi.mock('./SoftDeletePanel', () => ({ SoftDeletePanel: () => null }));
vi.mock('./NextBestActionCard', () => ({ NextBestActionCard: () => null }));
vi.mock('@/components/ui/relationship-stage', () => ({
  RelationshipStageBadge: () => null,
  RelationshipFunnel: ({ onStageChange }: { onStageChange: (stage: RelationshipStage) => void }) =>
    <button onClick={() => onStageChange('prospect')}>Alterar estágio</button>,
}));

const contact = normalizeExternalContact({
  id: 'contato-1', user_id: 'usuario-1', version: 1,
  first_name: 'Ana', last_name: 'Silva', relationship_stage: 'unknown',
});

beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);

function Header() {
  return <TooltipProvider><ContactDetailHeader contact={contact} company={null} interactionCount={0} /></TooltipProvider>;
}

describe('confirmação de estágio na ficha', () => {
  it('não anuncia sucesso após uma atualização rejeitada e permite nova tentativa', async () => {
    state.updateContact.mockResolvedValueOnce(null).mockResolvedValueOnce({ ...contact, relationship_stage: 'prospect' });
    const { container } = render(<Header />);
    fireEvent.click(screen.getByRole('button', { name: 'Alterar estágio' }));
    await waitFor(() => expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument());
    expect(state.updateContact).toHaveBeenCalledWith(contact.id, { relationship_stage: 'prospect' });
    expect(state.success).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByText('unknown')).toBeVisible());

    fireEvent.click(screen.getByRole('button', { name: 'Alterar estágio' }));
    await waitFor(() => expect(state.success).toHaveBeenCalledWith('Estágio atualizado para prospect'));
    expect(state.updateContact).toHaveBeenCalledTimes(2);
    expect(state.success).toHaveBeenCalledTimes(1);
  });

  it('libera o controle e mostra erro se a atualização lançar uma exceção', async () => {
    state.updateContact.mockRejectedValueOnce(new Error('Falha de rede'));
    const { container } = render(<Header />);
    fireEvent.click(screen.getByRole('button', { name: 'Alterar estágio' }));
    await waitFor(() => expect(state.error).toHaveBeenCalledWith('Erro ao atualizar estágio'));
    expect(state.success).not.toHaveBeenCalled();
    expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('unknown')).toBeVisible());
  });
});
