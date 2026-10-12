import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SequencePausedEmails } from './SequencePausedEmails';

const mocks = vi.hoisted(() => ({ hook: vi.fn(), resume: vi.fn(), refetch: vi.fn() }));
vi.mock('@/hooks/useSequences', () => ({ useSequencePausedEmails: mocks.hook }));
const row = {
  enrollmentId: 'inscricao', contactId: 'contato', contactName: 'Maria',
  email: 'maria@example.invalid', currentStep: 0, pausedAt: '2026-10-12T23:40:00Z',
  reason: 'Envio não confirmado; revise a integração antes de retomar', valid: true,
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.resume.mockResolvedValue({ already_resumed: false });
  mocks.hook.mockReturnValue({ data: [row], isLoading: false, error: null,
    resume: mocks.resume, resuming: false, refetch: mocks.refetch });
});
function show(active = true) {
  return render(<MemoryRouter><SequencePausedEmails sequenceId="sequencia" active={active} /></MemoryRouter>);
}

describe('Retomada de email pausado', () => {
  it('exige confirmação e envia a pausa e o progresso exibidos sem afirmar envio', async () => {
    show();
    fireEvent.click(screen.getByRole('button', { name: 'Retomar email' }));
    expect(mocks.resume).not.toHaveBeenCalled();
    expect(screen.getByText(/esta ação não confirma uma entrega/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Revisei — retomar' }));
    await waitFor(() => expect(mocks.resume).toHaveBeenCalledWith({
      enrollmentId: row.enrollmentId, currentStep: row.currentStep, pausedAt: row.pausedAt,
    }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  });
  it('mantém a pausa e a confirmação disponíveis após erro de persistência', async () => {
    mocks.resume.mockRejectedValue(new Error('Recibo indisponível'));
    show();
    fireEvent.click(screen.getByRole('button', { name: 'Retomar email' }));
    fireEvent.click(screen.getByRole('button', { name: 'Revisei — retomar' }));
    await waitFor(() => expect(mocks.resume).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText(row.reason, { exact: false })).toBeInTheDocument();
  });
  it('expõe a falha da consulta e permite nova tentativa', () => {
    mocks.hook.mockReturnValue({ data: [], isLoading: false, error: new Error('Consulta indisponível'),
      refetch: mocks.refetch });
    show();
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível consultar');
    expect(screen.queryByText('Nenhum email aguarda retomada.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(mocks.refetch).toHaveBeenCalledTimes(1);
  });
  it('bloqueia retomada enquanto a sequência está inativa', () => {
    show(false);
    expect(screen.getByRole('button', { name: 'Retomar email' })).toBeDisabled();
    expect(mocks.resume).not.toHaveBeenCalled();
  });
  it('orienta corrigir o contato e bloqueia retomada de email vazio', () => {
    mocks.hook.mockReturnValue({ data: [{ ...row, email: '  ' }], isLoading: false,
      resume: mocks.resume, resuming: false });
    show();
    expect(screen.getByRole('button', { name: 'Retomar email' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('Adicione um endereço de email ao contato');
    expect(mocks.resume).not.toHaveBeenCalled();
  });
});
