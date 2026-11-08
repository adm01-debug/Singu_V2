import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { PendingFollowupsWidget } from './PendingFollowupsWidget';
import type { PendingFollowup } from '@/hooks/usePendingFollowups';

const query = vi.hoisted(() => ({ data: [] as PendingFollowup[], isLoading: false, error: null as Error | null }));
vi.mock('@/hooks/usePendingFollowups', () => ({ usePendingFollowups: () => query }));

function followup(priority: number): PendingFollowup {
  return {
    interaction_id: `interacao-${priority}`, contact_id: `contato-${priority}`,
    contact_name: `Contato ${priority}`, contact_email: null, company_name: null,
    interaction_title: null, interaction_type: null, follow_up_date: null,
    follow_up_notes: null, owner_name: null, owner_email: null, followup_status: null,
    days_overdue: 0, priority, contact_disc: null, closing_score: null,
  };
}

afterEach(() => {
  cleanup();
  query.data = [];
  query.error = null;
});

describe('Prioridade canônica das pendências', () => {
  it('distingue as quatro prioridades numéricas sem rebaixar as críticas', () => {
    query.data = [1, 2, 3, 4].map(followup);
    render(<PendingFollowupsWidget />);
    ['Crítica', 'Alta', 'Média', 'Baixa'].forEach(label => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
    expect(screen.getByText('Crítica').closest('.rounded-lg')).toHaveClass('border-destructive');
    expect(screen.getByText('Baixa').closest('.rounded-lg')).toHaveClass('border-muted');
  });

  it('não apresenta falha de consulta como ausência de pendências', () => {
    query.error = new Error('Consulta indisponível');
    render(<PendingFollowupsWidget />);
    expect(within(screen.getByRole('alert')).getByText('Erro ao carregar follow-ups pendentes')).toBeInTheDocument();
    expect(screen.queryByText(/Nenhum follow-up pendente/)).not.toBeInTheDocument();
  });
});
