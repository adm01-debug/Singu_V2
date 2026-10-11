import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { NavigationStackProvider, safeNavigationPath, useNavigationStack } from './NavigationStackContext';
import { BackButton } from '@/components/navigation/BackButton';

const authState = vi.hoisted(() => ({ userId: 'user-a' }));
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: authState.userId ? { id: authState.userId } : null, loading: false }),
}));

function Harness() {
  const location = useLocation();
  const navigate = useNavigate();
  const { stack, direction, goToIndex, previousPath } = useNavigationStack();
  return <div>
    <output data-testid="location">{location.pathname + location.search + location.hash}</output>
    <output data-testid="count">{stack.length}</output>
    <output data-testid="direction">{direction}</output>
    <output data-testid="previous">{previousPath}</output>
    <button onClick={() => navigate('/contatos/1')}>Abrir contato</button>
    <button onClick={() => navigate('/empresas')}>Abrir empresas</button>
    <button onClick={() => navigate('/contatos?q=novo', { replace: true })}>Filtrar</button>
    <button onClick={() => navigate(1)}>Avançar</button>
    <button onClick={() => navigate(-1)}>Retorno nativo</button>
    <button onClick={() => goToIndex(0)}>Primeira tela</button>
    <BackButton to="/contatos" />
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

  it('não oferece autenticação no histórico nem permite retornar a ela pelo índice', () => {
    render(<Shell initialPath="/auth?next=/contatos" />);
    fireEvent.click(screen.getByText('Abrir contato'));
    expect(screen.queryByRole('button', { name: 'Histórico de navegação' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Primeira tela'));
    expect(screen.getByTestId('location')).toHaveTextContent('/contatos/1');
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
    authState.userId = 'user-b';
    view.rerender(<Shell />);
    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(screen.getByTestId('previous')).toBeEmptyDOMElement();
  });

  it.each(['//externo.example', 'https://externo.example', '/\\externo.example', '/contatos\n'])(
    'rejeita destino inseguro: %s', (path) => expect(safeNavigationPath(path)).toBeNull(),
  );
});
