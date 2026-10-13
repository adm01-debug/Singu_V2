import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { DataHealthWidget } from './DataHealthWidget';
import type { DataHealthRecord } from '@/hooks/useDataHealthView';

const query = vi.hoisted(() => ({
  data: undefined as DataHealthRecord[] | undefined,
  isLoading: false,
  error: null as Error | null,
}));

vi.mock('@/hooks/useDataHealthView', () => ({ useDataHealthView: () => query }));

function healthRecord(score: number | null): DataHealthRecord {
  return {
    user_id: null,
    health_score: score,
    score_user_id_companies: 10,
    score_user_id_contacts: 10,
    score_cnpj: 6,
    score_interactions: 4,
    score_rls: 9,
    score_singu_tables: 8,
    score_seeds: 5,
    score_views: 7,
    score_constraints: 3,
    total_tables: 72,
    total_views: 12,
    interactions_total: 1250,
    seeds_compat: 1,
    seeds_health: 1,
    seeds_auto: 0,
    views_singu: 9,
    check_constraints: 15,
    measured_at: '2026-10-13T00:00:00Z',
  };
}

afterEach(() => {
  cleanup();
  query.data = undefined;
  query.error = null;
});

describe('Contrato agregado da saúde dos dados', () => {
  it('converte a escala de 0 a 10 e mostra os totais reais sem inventar tabelas', () => {
    query.data = [healthRecord(8.5)];
    render(<DataHealthWidget />);
    expect(screen.getByText('Pontuação geral de saúde').parentElement).toHaveTextContent('85%');
    expect(screen.getByText('Métricas agregadas')).toBeInTheDocument();
    expect(screen.getByText('72')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('1.250')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Proteção por RLS' })).toHaveAttribute('aria-valuenow', '90');
    expect(screen.queryByText('Tabela 1')).not.toBeInTheDocument();
  });

  it('distingue pontuação ausente de zero real', () => {
    query.data = [healthRecord(null)];
    const { rerender } = render(<DataHealthWidget />);
    expect(screen.getByText('Sem pontuação')).toBeInTheDocument();
    query.data = [healthRecord(0)];
    rerender(<DataHealthWidget />);
    expect(screen.getByText('Pontuação geral de saúde').parentElement).toHaveTextContent('0%');
    expect(screen.queryByText('Sem pontuação')).not.toBeInTheDocument();
  });

  it('distingue ausência de métricas de falha na consulta', () => {
    query.data = [];
    const { rerender } = render(<DataHealthWidget />);
    expect(screen.getByText('Nenhuma métrica de saúde disponível')).toBeInTheDocument();
    query.error = new Error('Consulta indisponível');
    rerender(<DataHealthWidget />);
    expect(screen.getByText('Erro ao carregar métricas de saúde')).toBeInTheDocument();
    expect(screen.queryByText('Nenhuma métrica de saúde disponível')).not.toBeInTheDocument();
  });
});
