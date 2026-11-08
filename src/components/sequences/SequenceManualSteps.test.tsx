import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SequenceManualSteps } from './SequenceManualSteps';

const mocks = vi.hoisted(() => ({ hook: vi.fn(), confirm: vi.fn(), refetch: vi.fn() }));
vi.mock('@/hooks/useSequences', () => ({ useSequenceManualSteps: mocks.hook }));

const task = {
  enrollmentId: 'inscricao', contactId: 'contato', contactName: 'Maria',
  email: 'maria@example.invalid', stepId: 'etapa', stepOrder: 1,
  channel: 'call', instructions: 'Perguntar sobre a proposta', valid: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.confirm.mockResolvedValue({ already_confirmed: false });
  mocks.hook.mockReturnValue({ data: [task], isLoading: false, error: null, confirm: mocks.confirm, confirming: false, refetch: mocks.refetch });
});

function show(active = true) {
  return render(<MemoryRouter><SequenceManualSteps sequenceId="sequencia" active={active} /></MemoryRouter>);
}

describe('Confirmação manual da sequência', () => {
  it('só confirma após declaração explícita da execução e preserva a observação', async () => {
    show();
    expect(screen.getByText('Perguntar sobre a proposta')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Maria' })).toHaveAttribute('href', '/contatos/contato');
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar execução' }));
    expect(mocks.confirm).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Observação (opcional)'), { target: { value: 'Liguei para Maria' } });
    fireEvent.click(screen.getByRole('button', { name: 'Já executei — confirmar' }));
    await waitFor(() => expect(mocks.confirm).toHaveBeenCalledWith({
      enrollmentId: 'inscricao', stepId: 'etapa', note: 'Liguei para Maria',
    }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  });

  it('mantém confirmação e observação disponíveis quando a gravação falha', async () => {
    mocks.confirm.mockRejectedValue(new Error('Falha no banco'));
    show();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar execução' }));
    fireEvent.change(screen.getByLabelText('Observação (opcional)'), { target: { value: 'Executada' } });
    fireEvent.click(screen.getByRole('button', { name: 'Já executei — confirmar' }));
    await waitFor(() => expect(mocks.confirm).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Observação (opcional)')).toHaveValue('Executada');
  });

  it('diferencia falha da consulta de ausência de tarefas e permite nova tentativa', () => {
    mocks.hook.mockReturnValue({ data: [], isLoading: false, error: new Error('Consulta indisponível'), refetch: mocks.refetch });
    show();
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível consultar');
    expect(screen.queryByText('Nenhuma etapa manual pendente.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(mocks.refetch).toHaveBeenCalledTimes(1);
  });

  it('bloqueia confirmação quando a sequência está pausada', () => {
    show(false);
    expect(screen.getByRole('button', { name: 'Confirmar execução' })).toBeDisabled();
    expect(mocks.confirm).not.toHaveBeenCalled();
  });
});
