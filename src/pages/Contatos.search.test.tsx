import type { ComponentProps, ReactNode } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Header } from '@/components/layout/Header';
import type { ContatosContent } from './contatos/ContatosContent';
import Contatos from './Contatos';

const mocks = vi.hoisted(() => ({
  contacts: [
    { id: 'acme', first_name: 'Acme', last_name: '', updated_at: '2026-10-10' },
    { id: 'beta', first_name: 'Beta', last_name: '', updated_at: '2026-10-10' },
  ],
  empty: [],
  noop: vi.fn(),
}));

vi.mock('@/hooks/useContacts', () => ({ useContacts: () => ({ contacts: mocks.contacts, loading: false, fetchContacts: mocks.noop }) }));
vi.mock('@/hooks/useCompanies', () => ({ useCompanies: () => ({ companies: mocks.empty }) }));
vi.mock('@/hooks/useInteractions', () => ({ useInteractions: () => ({ interactions: mocks.empty }) }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'qa-user' } }) }));
vi.mock('@/hooks/useAccessibleToast', () => ({ useAccessibleToast: () => ({ success: mocks.noop }) }));
vi.mock('@/hooks/useActivityLogger', () => ({ useActivityLogger: () => ({ logActivity: mocks.noop }) }));
vi.mock('@/hooks/useActionToast', () => ({ useActionToast: () => ({ destructive: mocks.noop }) }));
vi.mock('@/hooks/useRestoreEntity', () => ({ useRestoreEntity: () => ({ restore: mocks.noop }) }));
vi.mock('@/hooks/useSuccessCelebration', () => ({ useSuccessCelebration: () => ({ celebrate: mocks.noop }) }));
vi.mock('@/hooks/useKeyboardShortcutsEnhanced', () => ({ useKeyboardShortcutsEnhanced: () => undefined }));
vi.mock('@/components/celebrations/MiniCelebration', () => ({ useMiniCelebration: () => ({ trigger: mocks.noop }) }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: { children: ReactNode }) => children }));
vi.mock('@/components/seo/SEOHead', () => ({ SEOHead: () => null }));
vi.mock('@/components/forms/ContactForm', () => ({ ContactForm: () => null }));
vi.mock('@/components/quick-actions/FloatingQuickActions', () => ({ FloatingQuickActions: () => null }));
vi.mock('@/components/keyboard/KeyboardShortcutsCheatsheet', () => ({ KeyboardShortcutsCheatsheet: () => null }));
vi.mock('@/components/navigation/BackButton', () => ({ BackButton: () => null }));
vi.mock('@/components/notifications/UnifiedNotificationsBell', () => ({ UnifiedNotificationsBell: () => null }));
vi.mock('@/components/notifications/SmartNotificationsBell', () => ({ SmartNotificationsBell: () => null }));
vi.mock('@/components/ui/global-density-toggle', () => ({ GlobalDensityToggle: () => null }));
vi.mock('@/components/ui/SystemStatusBadge', () => ({ SystemStatusBadge: () => null }));
vi.mock('./contatos/ContatosContent', () => ({
  ContatosContent: ({ searchTerm, onSearchChange, filteredAndSortedContacts }: ComponentProps<typeof ContatosContent>) => <>
    <Header title="Contatos" showSearch searchValue={searchTerm} onSearchChange={onSearchChange} hideBack />
    <ul aria-label="Contatos filtrados">{filteredAndSortedContacts.map(contact => <li key={contact.id}>{contact.first_name}</li>)}</ul>
  </>,
}));

function Navigation() {
  const navigate = useNavigate();
  return <>
    <button onClick={() => navigate('/contatos/acme')}>Abrir detalhe</button>
    <button onClick={() => navigate(-1)}>Voltar no navegador</button>
    <button onClick={() => navigate(1)}>Avançar no navegador</button>
  </>;
}

function openContacts() {
  return render(<MemoryRouter initialEntries={['/contatos?q=Acme']}>
    <Navigation />
    <Routes>
      <Route path="/contatos" element={<Contatos />} />
      <Route path="/contatos/:id" element={<div>Detalhe do contato</div>} />
    </Routes>
  </MemoryRouter>);
}

beforeEach(() => {
  localStorage.setItem('singu-views-qa-user-contatos-v1', JSON.stringify([{
    id: 'beta-view', name: 'Carteira Beta', scope: 'contatos', createdAt: '2026-10-10',
    state: { searchTerm: 'Beta', viewMode: 'grid', gridColumns: 3, activeFilters: {}, sortBy: 'updated_at', sortOrder: 'desc', multiSort: [] },
  }]));
});
afterEach(() => { cleanup(); localStorage.clear(); });

describe('Pesquisa efetiva dos contatos', () => {
  it('aplica a URL imediatamente, inclusive após remount e retorno do detalhe', async () => {
    const page = openContacts();
    expect(screen.getByRole('textbox', { name: 'Buscar em Contatos' })).toHaveValue('Acme');
    expect(screen.getByRole('list', { name: 'Contatos filtrados' })).toHaveTextContent('Acme');
    expect(screen.queryByText('Beta')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Abrir detalhe' }));
    fireEvent.click(screen.getByRole('button', { name: 'Voltar no navegador' }));
    await screen.findByRole('textbox', { name: 'Buscar em Contatos' });
    expect(screen.queryByText('Beta')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Avançar no navegador' }));
    expect(screen.getByText('Detalhe do contato')).toBeInTheDocument();
    page.unmount();
    openContacts();
    expect(screen.queryByText('Beta')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Buscar em Contatos' })).toHaveValue('Acme');
  });

  it('aplica a visualização salva à lista e mantém edição e limpeza funcionais', async () => {
    openContacts();
    fireEvent.click(screen.getByRole('button', { name: /^Views/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Carteira Beta' }));
    const input = screen.getByRole('textbox', { name: 'Buscar em Contatos' });
    expect(input).toHaveValue('Beta');
    await waitFor(() => expect(screen.queryByText('Acme')).not.toBeInTheDocument());
    expect(screen.getByText('Beta')).toBeInTheDocument();
    fireEvent.change(input, { target: { value: 'Acme' } });
    await waitFor(() => expect(screen.queryByText('Beta')).not.toBeInTheDocument());
    expect(screen.getByText('Acme')).toBeInTheDocument();
    fireEvent.change(input, { target: { value: '' } });
    expect(screen.getByText('Acme')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });
});
