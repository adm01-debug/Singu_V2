import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CompanyInsightsTab } from './CompanyInsightsTab';

vi.mock('@/hooks/useCompanyIntelligence', () => ({
  useCompanyTimeline: () => ({ data: [], isLoading: false, error: null, refetch: vi.fn() }),
  useCompany360: () => ({ data: null, isLoading: false, error: null, refetch: vi.fn() }),
  useNextBestAction: () => ({ data: null }),
  useChurnRisk: () => ({ data: null }),
  useTouchpointSummary: () => ({
    data: { total_touchpoints: 12, avg_gap_days: 4, last_touchpoint: '2026-11-20T10:00:00Z', by_channel: { email: 9, whatsapp: 3 } },
  }),
  useKeyContacts: () => ({
    data: [{ contact_id: 'c-1', name: 'Marina Alves', cargo: 'Diretora Financeira', importance_score: 82 }],
  }),
}));

vi.mock('@/components/analytics/AccountChurnPredictionPanel', () => ({ AccountChurnPredictionPanel: () => null }));

const { widget } = vi.hoisted(() => ({ widget: () => ({ default: () => null }) }));
vi.mock('./CompanyHealthScoreWidget', widget);
vi.mock('./CompanyStatisticsWidget', widget);
vi.mock('./AccountPlanWidget', widget);
vi.mock('./PropensityScoreWidget', widget);
vi.mock('./CompanyDuplicatesWidget', widget);
vi.mock('./OptimalContactWindowsWidget', widget);
vi.mock('./QuickActionsWidget', widget);
vi.mock('./CompanyViewsWidget', widget);
vi.mock('./InteractionHistoryWidget', widget);
vi.mock('./CompanyBenchmarkRadar', widget);
vi.mock('@/components/pipeline/CreateDealWidget', widget);

function renderTab() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <CompanyInsightsTab
          companyId="emp-1"
          contacts={[]}
          avgRelationshipScore={0}
          totalInteractions={0}
          positiveInteractions={0}
          pendingFollowUps={0}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('CompanyInsightsTab', () => {
  beforeEach(() => vi.clearAllMocks());

  it('mostra o resumo de touchpoints e os contatos estrategicos vindos do RPC', () => {
    renderTab();
    expect(screen.getByText('Resumo de Touchpoints')).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('email: 9')).toBeTruthy();
    expect(screen.getByText('Contatos Estratégicos')).toBeTruthy();
    expect(screen.getByText('Marina Alves')).toBeTruthy();
    expect(screen.getByText('Diretora Financeira')).toBeTruthy();
    expect(screen.getByText('82%')).toBeTruthy();
  });
});