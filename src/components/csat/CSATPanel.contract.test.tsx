import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CSATPanel } from './CSATPanel';

const mocks = vi.hoisted(() => ({
  surveys: vi.fn(),
  send: vi.fn(),
  answer: vi.fn<(input: unknown, callbacks: { onSuccess: () => void }) => void>(),
}));
vi.mock('@/hooks/useCSATSurveys', () => ({ useCSATSurveys: mocks.surveys }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.surveys.mockReturnValue({
    surveys: [{ id: 'pesquisa', status: 'pending', score: null, feedback: null, created_at: '2026-10-11T12:00:00Z' }],
    send: { mutate: mocks.send, isPending: false },
    answer: { mutate: mocks.answer, isPending: false },
    stats: { total: 1, answered: 0, avgScore: 0, responseRate: 0 },
  });
});

describe('Registro manual de satisfação', () => {
  it('oferece criar uma pesquisa e mantém a nota selecionada até confirmar a gravação', () => {
    render(<CSATPanel contactId="contato" />);
    fireEvent.click(screen.getByRole('button', { name: 'Criar Pesquisa' }));
    expect(mocks.send).toHaveBeenCalledWith({ contactId: 'contato', interactionId: undefined });
    expect(screen.queryByRole('button', { name: 'Enviar Pesquisa' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Nota 5 estrelas' }));
    fireEvent.click(screen.getByRole('button', { name: 'Registrar Resposta' }));
    expect(mocks.answer).toHaveBeenCalledWith({ id: 'pesquisa', score: 5, feedback: undefined }, expect.objectContaining({ onSuccess: expect.any(Function) }));
    expect(screen.getByRole('button', { name: 'Registrar Resposta' })).toBeInTheDocument();
    act(() => mocks.answer.mock.calls[0][1].onSuccess());
    expect(screen.queryByRole('button', { name: 'Registrar Resposta' })).not.toBeInTheDocument();
  });
});
