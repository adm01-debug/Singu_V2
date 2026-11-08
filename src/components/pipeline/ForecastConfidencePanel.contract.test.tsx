import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PipelineDeal } from '@/hooks/usePipeline';
import { ForecastConfidencePanel } from './ForecastConfidencePanel';

const mocks = vi.hoisted(() => ({ deals: [] as PipelineDeal[] }));
vi.mock('@/hooks/usePipeline', () => ({ useDealsPipeline: () => ({ data: mocks.deals }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));

const deal: PipelineDeal = {
  id: 'negocio-1', titulo: 'Negócio aberto', valor: 1000,
  status: 'aberto', pipeline_stage: 'proposta', probabilidade: 50,
  company_id: null, contact_id: null, created_at: '2026-01-01T00:00:00Z',
};

function renderPanel() {
  render(<QueryClientProvider client={new QueryClient()}><ForecastConfidencePanel /></QueryClientProvider>);
}

afterEach(() => { cleanup(); mocks.deals = []; });

describe('Previsão com duração de estágio desconhecida', () => {
  it('não inventa duração nem receita prevista quando todos os negócios estão sem histórico', () => {
    mocks.deals = [deal, { ...deal, id: 'fechado', status: 'won', dias_no_estagio_atual: 10 }];
    renderPanel();
    expect(screen.getByText('Total indisponível')).toBeInTheDocument();
    expect(screen.getByText(/1 negócio\(s\) sem duração conhecida/)).toBeInTheDocument();
    expect(screen.queryByText(/Total esperado/)).not.toBeInTheDocument();
    expect(screen.queryByText(/2 negócio\(s\)/)).not.toBeInTheDocument();
  });

  it('marca a estimativa como parcial e exclui apenas os dados sem duração', () => {
    mocks.deals = [deal, { ...deal, id: 'com-historico', dias_no_estagio_atual: 10 }];
    renderPanel();
    expect(screen.getByText(/Total esperado \(parcial\):/)).toBeInTheDocument();
    expect(screen.getByText(/1 negócio\(s\) sem duração conhecida/)).toBeInTheDocument();
    expect(screen.getByText(/\(1 deals\)/)).toBeInTheDocument();
  });
});
