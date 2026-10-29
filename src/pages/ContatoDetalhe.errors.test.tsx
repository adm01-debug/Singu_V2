import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Contact } from '@/hooks/useContactDetail';
import { normalizeExternalContact } from '@/hooks/useContacts';
import ContatoDetalhe from './ContatoDetalhe';

const state = vi.hoisted(() => ({
  contact: null as Contact | null,
  company: null,
  interactions: [], insights: [], alerts: [],
  loading: false,
  error: null as string | null,
  refetch: vi.fn(), trackView: vi.fn(),
}));

vi.mock('@/hooks/useContactDetail', () => ({ useContactDetail: () => state }));
vi.mock('@/hooks/useRecentlyViewed', () => ({ useRecentlyViewed: () => ({ trackView: state.trackView }) }));
vi.mock('@/hooks/useLuxIntelligence', () => ({ useLuxIntelligence: () => ({ records: [], latestRecord: null }) }));
vi.mock('@/hooks/useProactiveIntelligence', () => ({ useProactiveIntelligence: () => ({}) }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: { children: ReactNode }) => children }));
vi.mock('@/components/seo/SEOHead', () => ({ SEOHead: () => null }));
vi.mock('@/components/navigation/PageHeader', () => ({ PageHeader: () => null }));
vi.mock('@/components/contact-detail', () => ({
  ContactDetailHeader: ({ contact }: { contact: Contact }) => <h1>{contact.first_name} {contact.last_name}</h1>,
  ContactOverviewTab: () => <p>Resumo preservado</p>,
  ContactInteractionsTab: () => null, ContactBehavioralTab: () => null,
  ContactIntelligenceTab: () => null, ContactCommercialTab: () => null,
  ContactDataTab: () => <p>Dados preservados</p>, LifeEventsTab: () => null,
}));
vi.mock('@/components/ai/AIEmailComposerTrigger', () => ({ AIEmailComposerTrigger: () => null }));
vi.mock('@/components/enrichment/ValidateAllButton', () => ({ ValidateAllButton: () => null }));
vi.mock('@/components/lux/LuxButton', () => ({ LuxButton: () => null }));
vi.mock('@/components/lux/LuxIntelligencePanel', () => ({ LuxIntelligencePanel: () => null }));
vi.mock('@/components/proactive-intelligence/ProactiveIntelligencePanel', () => ({ ProactiveIntelligencePanel: () => null }));
vi.mock('@/components/crm/NextBestAction', () => ({ NextBestAction: () => null }));
vi.mock('@/components/crm/EscalationAutomation', () => ({ EscalationAutomation: () => null }));
vi.mock('@/components/contact-detail/SocialMediaIntelligenceCard', () => ({ SocialMediaIntelligenceCard: () => null }));
vi.mock('@/components/contact-detail/RelationshipTimeline', () => ({ RelationshipTimeline: () => null }));
vi.mock('@/components/contacts/BehavioralInsightsCard', () => ({ BehavioralInsightsCard: () => null }));
vi.mock('@/components/contact-detail/ContactTimelineWidget', () => ({ default: () => null }));
vi.mock('@/components/contact-detail/MeetingMode', () => ({ MeetingMode: () => null }));
vi.mock('@/components/enrichment/PeopleIntelTimeline', () => ({ PeopleIntelTimeline: () => null }));
vi.mock('@/components/custom-fields/CustomFieldsDisplay', () => ({ CustomFieldsDisplay: () => null }));
vi.mock('@/components/documents/DocumentsPanel', () => ({ DocumentsPanel: () => null }));

function Page() {
  return <MemoryRouter initialEntries={['/contatos/contato-1']}>
    <Routes><Route path="/contatos/:id" element={<ContatoDetalhe />} /></Routes>
  </MemoryRouter>;
}

beforeEach(() => {
  state.contact = normalizeExternalContact({ id: 'contato-1', user_id: 'usuario-1', version: 1, first_name: 'Ana', last_name: 'Silva' });
  state.error = null;
  state.loading = false;
  vi.clearAllMocks();
});
afterEach(cleanup);

describe('recuperação da ficha do contato', () => {
  it('fecha a ficha anterior quando uma recarga confirma a ausência do contato', async () => {
    const { rerender } = render(<Page />);
    expect(await screen.findByRole('heading', { name: 'Ana Silva' })).toBeVisible();

    state.contact = null;
    rerender(<Page />);
    expect(screen.getByText('Contato não encontrado')).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Ana Silva' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).not.toBeInTheDocument();
  });

  it('preserva a ficha e a aba aberta após falha de recarga e permite repetir a consulta', async () => {
    const { rerender } = render(<Page />);
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Dados' }), { button: 0, ctrlKey: false });
    expect(await screen.findByText('Dados preservados')).toBeVisible();

    state.error = 'Falha de rede';
    rerender(<Page />);
    expect(screen.getByRole('heading', { name: 'Ana Silva' })).toBeVisible();
    expect(screen.getByText('Dados preservados')).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent('última consulta concluída');
    expect(screen.queryByText('Contato não encontrado')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(state.refetch).toHaveBeenCalledTimes(1);

    state.error = null;
    state.contact = { ...state.contact!, first_name: 'Ana atualizada' };
    rerender(<Page />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ana atualizada Silva' })).toBeVisible();
    expect(screen.getByText('Dados preservados')).toBeVisible();
  });

  it('permite repetir uma carga inicial que falhou sem mostrar uma ficha inexistente', () => {
    state.contact = null;
    state.error = 'Consulta indisponível';
    const { rerender } = render(<Page />);
    expect(screen.getByText('Consulta indisponível')).toBeVisible();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(state.refetch).toHaveBeenCalledTimes(1);

    state.error = null;
    state.contact = normalizeExternalContact({ id: 'contato-1', user_id: 'usuario-1', version: 1, first_name: 'Ana', last_name: 'Silva' });
    rerender(<Page />);
    expect(screen.getByRole('heading', { name: 'Ana Silva' })).toBeVisible();
    expect(screen.queryByText('Consulta indisponível')).not.toBeInTheDocument();
  });
});
