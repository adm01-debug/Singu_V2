import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CsatSurvey } from '@/hooks/useNpsSurveys';
import NPS from './NPS';

const mocks = vi.hoisted(() => ({ surveys: vi.fn() }));
vi.mock('@/hooks/useNpsSurveys', () => ({ useNpsSurveys: mocks.surveys }));
vi.mock('react-helmet-async', () => ({ Helmet: () => null }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('@/components/navigation/PageHeader', () => ({ PageHeader: () => null }));
vi.mock('@/components/nps/SendSurveyDialog', () => ({ SendSurveyDialog: () => null }));
vi.mock('@/components/nps/AnswerSurveyDialog', () => ({
  AnswerSurveyDialog: ({ survey }: { survey: CsatSurvey | null }) => <div data-testid="resposta">{survey?.id}</div>,
}));

function survey(id: string, contact_id: string, status: string): CsatSurvey {
  return {
    id, contact_id, status, user_id: 'dono', public_token: 'token',
    ticket_id: null, interaction_id: null, channel: 'email', score: status === 'answered' ? 0 : null,
    feedback: null, sent_at: null, answered_at: null, expires_at: null,
    created_at: '2026-10-11T12:00:00Z', updated_at: '2026-10-11T12:00:00Z',
  };
}

describe('Pesquisas pendentes na tela NPS', () => {
  it('inclui pending e sent na aba Pendentes e permite registrar uma resposta', () => {
    mocks.surveys.mockReturnValue({
      surveys: [survey('pendente', '10000000-0000', 'pending'), survey('enviada', '20000000-0000', 'sent'), survey('respondida', '30000000-0000', 'answered')],
      metrics: { total: 3, answered: 1, pending: 2, promoters: 0, passives: 0, detractors: 1, npsScore: -100, responseRate: 33, avgScore: 0 },
      isLoading: false, deleteSurvey: vi.fn(),
    });
    render(<NPS />);
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Pendentes (2)' }), { button: 0, ctrlKey: false });
    expect(screen.getByText('Contato: 10000000…')).toBeInTheDocument();
    expect(screen.getByText('Contato: 20000000…')).toBeInTheDocument();
    expect(screen.queryByText('Contato: 30000000…')).not.toBeInTheDocument();
    const buttons = screen.getAllByRole('button', { name: 'Registrar' });
    expect(buttons).toHaveLength(2);
    fireEvent.click(buttons[0]);
    expect(screen.getByTestId('resposta')).toHaveTextContent('pendente');
  });
});
