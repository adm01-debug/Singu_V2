import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { NavigationStackProvider, safeNavigationPath, useNavigationStack } from './NavigationStackContext';
import { BackButton } from '@/components/navigation/BackButton';
import { getSectionFallback } from '@/lib/navigationLabels';
import { useState } from 'react';
import { useModalHistory } from '@/hooks/useModalHistory';

const authState = vi.hoisted(() => ({ userId: 'user-a' }));
const exposedHistory: { owner: string; stack: string[] }[] = [];
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: authState.userId ? { id: authState.userId } : null, loading: false }),
}));

function Harness({ fallbackOnly = false }: { fallbackOnly?: boolean }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { stack, direction, goToIndex, previousPath } = useNavigationStack();
  const [searchOpen, setSearchOpen] = useState(false);
  useModalHistory(searchOpen, () => setSearchOpen(false), 'search');
  exposedHistory.push({ owner: authState.userId, stack: [...stack] });
  return <div>
    <output data-testid="location">{location.pathname + location.search + location.hash}</output>
    <output data-testid="count">{stack.length}</output>
    <output data-testid="direction">{direction}</output>
    <output data-testid="previous">{previousPath}</output>
    <output data-testid="search">{searchOpen ? 'aberta' : 'fechada'}</output>
    <button onClick={() => setSearchOpen(true)}>Abrir busca</button>
    <button onClick={() => { setSearchOpen(false); navigate('/empresas'); }}>Resultado da busca</button>
    <button onClick={() => navigate('/contatos/1')}>Abrir contato</button>
    <button onClick={() => navigate('/empresas/2')}>Abrir empresa</button>
    <button onClick={() => navigate('/empresas')}>Abrir empresas</button>
    <button onClick={() => navigate('/contatos?q=novo', { replace: true })}>Filtrar</button>
    <button onClick={() => navigate(1)}>Avançar</button>
    <button onClick={() => navigate(-1)}>Retorno nativo</button>
    <button onClick={() => goToIndex(0)}>Primeira tela</button>
    <BackButton to={fallbackOnly ? undefined : '/contatos'} fallback={getSectionFallback(location.pathname)} />
    <BackButton to="/empresas" />
  </div>;
}

function Shell({ initialPath = '/contatos?q=vip#lista' }: { initialPath?: string }) {
  return <MemoryRouter initialEntries={[initialPath]}>
    <NavigationStackProvider><Harness /></NavigationStackProvider>
  </MemoryRouter>;
}

describe('Histórico e retorno de navegação', () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState(null, '');
    authState.userId = 'user-a';
  });
  afterEach(cleanup);

  it('percorre os índices reais do navegador sem apagar o avançar', async () => {
    window.history.replaceState(null, '', '/contatos?q=vip#lista');
    render(<BrowserRouter><NavigationStackProvider><Harness /></NavigationStackProvider></BrowserRouter>);
    fireEvent.click(screen.getByText('Abrir contato'));
    expect(window.history.state.idx).toBe(1);
    fireEvent.click(screen.getByRole('button', { name: 'Voltar para Contatos' }));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/contatos?q=vip#lista'));
    expect(window.history.state.idx).toBe(0);
    fireEvent.click(screen.getByText('Avançar'));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/contatos/1'));
    expect(window.history.state.idx).toBe(1);
  });

  it('usa uma visita anterior filtrada da seção, mesmo após visitar outra rota', async () => {
    window.history.replaceState(null, '', '/empresas?q=vip#lista');
    render(<BrowserRouter><NavigationStackProvider><Harness /></NavigationStackProvider></BrowserRouter>);
    fireEvent.click(screen.getByText('Abrir contato'));
    fireEvent.click(screen.getByText('Abrir empresa'));
    fireEvent.click(screen.getByRole('button', { name: 'Voltar para Empresas' }));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/empresas?q=vip#lista'));
    expect(window.history.state.idx).toBe(0);
    fireEvent.click(screen.getByText('Avançar'));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/contatos/1'));
  });

  it('prioriza o retorno contextual quando a seção é apenas um fallback', async () => {
    window.history.replaceState(null, '', '/empresas?q=vip#lista');
    render(<BrowserRouter><NavigationStackProvider><Harness fallbackOnly /></NavigationStackProvider></BrowserRouter>);
    fireEvent.click(screen.getByText('Abrir contato'));
    fireEvent.click(screen.getByText('Abrir empresa'));
    fireEvent.click(screen.getByRole('button', { name: 'Voltar para Contatos' }));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/contatos/1'));
    expect(window.history.state.idx).toBe(1);
  });

  it('não oferece autenticação no histórico nem permite retornar a ela pelo índice', () => {
    render(<Shell initialPath="/auth?next=/contatos" />);
    fireEvent.click(screen.getByText('Abrir contato'));
    expect(screen.queryByRole('button', { name: 'Histórico de navegação' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Primeira tela'));
    expect(screen.getByTestId('location')).toHaveTextContent('/contatos/1');
  });

  it('volta à lista em um clique após abrir modal, voltar e avançar pelo histórico real', async () => {
    window.history.replaceState(null, '', '/contatos?q=vip#lista');
    render(<BrowserRouter><NavigationStackProvider><Harness /></NavigationStackProvider></BrowserRouter>);
    fireEvent.click(screen.getByText('Abrir contato'));
    fireEvent.click(screen.getByText('Abrir busca'));
    expect(window.history.state.idx).toBe(2);
    fireEvent.click(screen.getByText('Retorno nativo'));
    await waitFor(() => expect(screen.getByTestId('search')).toHaveTextContent('fechada'));
    expect(window.history.state.idx).toBe(1);
    fireEvent.click(screen.getByText('Avançar'));
    await waitFor(() => expect(window.history.state.idx).toBe(2));
    fireEvent.click(screen.getByRole('button', { name: 'Voltar para Contatos' }));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/contatos?q=vip#lista'));
    expect(window.history.state.idx).toBe(0);
  });

  it('não desfaz a navegação escolhida no resultado da busca', async () => {
    window.history.replaceState(null, '', '/contatos');
    render(<BrowserRouter><NavigationStackProvider><Harness /></NavigationStackProvider></BrowserRouter>);
    fireEvent.click(screen.getByText('Abrir busca'));
    fireEvent.click(screen.getByText('Resultado da busca'));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/empresas'));
    expect(window.history.state.idx).toBe(2);
    expect(screen.getByTestId('search')).toHaveTextContent('fechada');
  });

  it('restaura URLs internas extensas sem perder filtros', async () => {
    const path = `/contatos?q=${'a'.repeat(2200)}#lista`;
    render(<Shell initialPath={path} />);
    fireEvent.click(screen.getByText('Abrir contato'));
    fireEvent.click(screen.getByRole('button', { name: 'Voltar para Contatos' }));
    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe(path));
  });

  it('retorna com filtros e âncora, permite avançar e retornar novamente', async () => {
    render(<Shell />);
    fireEvent.click(screen.getByText('Abrir contato'));
    fireEvent.click(screen.getByRole('button', { name: 'Voltar para Contatos' }));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/contatos?q=vip#lista'));
    expect(screen.getByTestId('direction')).toHaveTextContent('back');
    fireEvent.click(screen.getByText('Avançar'));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/contatos/1'));
    expect(screen.getByTestId('direction')).toHaveTextContent('forward');
    fireEvent.click(screen.getByRole('button', { name: 'Voltar para Contatos' }));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/contatos?q=vip#lista'));
  });

  it('respeita um destino explícito que difere da tela anterior', async () => {
    render(<Shell initialPath="/empresas?q=cliente" />);
    fireEvent.click(screen.getByText('Abrir contato'));
    fireEvent.click(screen.getByRole('button', { name: 'Voltar para Contatos' }));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/contatos'));
    expect(screen.getByTestId('location')).not.toHaveTextContent('/empresas');
    fireEvent.click(screen.getByText('Retorno nativo'));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/empresas?q=cliente'));
  });

  it('substituir filtros não acrescenta entradas e saltar no rastro preserva o avançar', async () => {
    render(<Shell />);
    fireEvent.click(screen.getByText('Filtrar'));
    expect(screen.getByTestId('count')).toHaveTextContent('1');
    fireEvent.click(screen.getByText('Abrir empresas'));
    fireEvent.click(screen.getByText('Abrir contato'));
    fireEvent.click(screen.getByText('Primeira tela'));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/contatos?q=novo'));
    fireEvent.click(screen.getByText('Avançar'));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/empresas'));
  });

  it.each(['{', '"texto"', 'null', '{"entries":["//externo.example"]}', '["https://externo.example"]'])(
    'ignora histórico malformado: %s', (stored) => {
      sessionStorage.setItem('singu_nav_stack', stored);
      render(<Shell />);
      expect(screen.getByTestId('count')).toHaveTextContent('1');
      expect(screen.getByTestId('previous')).toBeEmptyDOMElement();
    },
  );

  it('descarta o rastro quando o usuário muda', () => {
    const view = render(<Shell />);
    fireEvent.click(screen.getByText('Abrir contato'));
    expect(screen.getByTestId('count')).toHaveTextContent('2');
    exposedHistory.length = 0;
    authState.userId = 'user-b';
    view.rerender(<Shell />);
    expect(exposedHistory.filter(rendered => rendered.owner === 'user-b').every(rendered => rendered.stack.length === 1)).toBe(true);
    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(screen.getByTestId('previous')).toBeEmptyDOMElement();
  });

  it.each(['//externo.example', 'https://externo.example', '/\\externo.example', '/contatos\n'])(
    'rejeita destino inseguro: %s', (path) => expect(safeNavigationPath(path)).toBeNull(),
  );
});
