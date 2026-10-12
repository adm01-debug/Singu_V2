import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Empresas from './Empresas';

const state = vi.hoisted(() => ({
  companies: [] as Array<{ id: string; name: string }>,
  error: null as Error | null,
  isFetching: false,
  retry: vi.fn(),
  search: vi.fn(),
}));

vi.mock('@/hooks/useCompanies', () => ({ useCompanies: () => ({
  companies: state.companies, error: state.error, loading: false,
  isFetching: state.isFetching, totalCount: state.companies.length,
  fetchCompanies: state.retry, setSearchTerm: state.search, createCompany: vi.fn(),
  updateCompany: vi.fn(), deleteCompany: vi.fn(), fetchNextPage: vi.fn(),
  hasNextPage: false, isFetchingNextPage: false,
}) }));
vi.mock('@/hooks/useContacts', () => ({ useContacts: () => ({ contacts: [] }) }));
vi.mock('@/hooks/useInteractions', () => ({ useInteractions: () => ({ interactions: [] }) }));
vi.mock('@/hooks/useCompanyFilterOptions', () => ({ useCompanyFilterOptions: () => ({}) }));
vi.mock('@/hooks/useKeyboardShortcutsEnhanced', () => ({
  useListNavigation: () => ({ selectedIndex: -1 }), useKeyboardShortcutsEnhanced: vi.fn(),
}));
vi.mock('@/hooks/useSuccessCelebration', () => ({ useSuccessCelebration: () => ({ celebrate: vi.fn() }) }));
vi.mock('@/hooks/usePageTitle', () => ({ usePageTitle: vi.fn() }));
vi.mock('@/hooks/useActionToast', () => ({ useActionToast: () => ({ destructive: vi.fn() }) }));
vi.mock('@/hooks/useRestoreEntity', () => ({ useRestoreEntity: () => ({ restore: vi.fn() }) }));
vi.mock('@/hooks/useSavedViews', () => ({ useSavedViews: () => ({ views: [] }) }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock('@/components/layout/Header', () => ({ Header: ({ subtitle }: { subtitle: string }) => <header>{subtitle}</header> }));
vi.mock('@/components/seo/SEOHead', () => ({ SEOHead: () => null }));
vi.mock('@/components/quick-actions/FloatingQuickActions', () => ({ FloatingQuickActions: () => null }));
vi.mock('@/components/forms/CompanyForm', () => ({ CompanyForm: () => null }));
vi.mock('@/components/views/SavedViewsBar', () => ({ SavedViewsBar: () => null }));
vi.mock('./empresas/EmpresasContent', () => ({ EmpresasContent: ({ filteredAndSortedCompanies }: { filteredAndSortedCompanies: Array<{ id: string; name: string }> }) => (
  <section aria-label="Carteira de empresas">
    {filteredAndSortedCompanies.length === 0 ? 'Nenhuma empresa cadastrada' : filteredAndSortedCompanies.map(company => <p key={company.id}>{company.name}</p>)}
  </section>
) }));

function Page({ route = '/empresas' }: { route?: string }) {
  return <MemoryRouter initialEntries={[route]}><Empresas /></MemoryRouter>;
}

beforeEach(() => {
  state.companies = [];
  state.error = null;
  state.isFetching = false;
  state.retry.mockReset();
  state.retry.mockResolvedValue(undefined);
  state.search.mockReset();
});

describe('erros de consulta na carteira de empresas', () => {
  it('permite limpar uma pesquisa que falhou sem registros em cache', () => {
    state.error = new Error('Busca indisponível');
    render(<Page route="/empresas?q=Acme" />);
    expect(screen.queryByText('Nenhuma empresa cadastrada')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Limpar pesquisa' }));
    expect(state.search).toHaveBeenCalledWith('');
    expect(screen.queryByRole('button', { name: 'Limpar pesquisa' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeEnabled();
  });

  it('distingue erro sem dados de carteira vazia e permite recuperar a consulta', () => {
    state.error = new Error('Consulta indisponível');
    const { rerender } = render(<Page />);
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar as empresas');
    expect(screen.queryByText('0 empresas')).not.toBeInTheDocument();
    expect(screen.queryByText('Nenhuma empresa cadastrada')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(state.retry).toHaveBeenCalledTimes(1);

    state.isFetching = true;
    rerender(<Page />);
    expect(screen.getByRole('button', { name: /Tentando/ })).toBeDisabled();
    state.isFetching = false;
    state.error = null;
    state.companies = [{ id: 'empresa-1', name: 'Empresa recuperada' }];
    rerender(<Page />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('Empresa recuperada')).toBeInTheDocument();
  });

  it('preserva empresas confirmadas e avisa sobre falha na atualização', () => {
    state.companies = [{ id: 'empresa-1', name: 'Empresa confirmada' }];
    const { rerender } = render(<Page />);
    state.error = new Error('Atualização indisponível');
    rerender(<Page />);
    expect(screen.getByText('Empresa confirmada')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('última consulta concluída');
    expect(screen.queryByText('Nenhuma empresa cadastrada')).not.toBeInTheDocument();
  });

  it('mostra carteira vazia apenas quando a consulta termina sem erro', () => {
    render(<Page />);
    expect(screen.getByText('0 empresas')).toBeInTheDocument();
    expect(screen.getByText('Nenhuma empresa cadastrada')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
