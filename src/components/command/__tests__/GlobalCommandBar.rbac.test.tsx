import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GlobalCommandBar } from '@/components/command/GlobalCommandBar';

const rbac = vi.hoisted(() => ({
  userRoles: [] as string[],
  permissions: [] as string[],
  isLoading: false,
}));

vi.mock('@/hooks/useRBAC', () => ({
  useRBAC: () => ({
    userRoles: rbac.userRoles,
    permissions: rbac.permissions,
    hasPermission: (name: string) => rbac.permissions.includes(name),
    isLoading: rbac.isLoading,
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u-1' } }),
}));

vi.mock('@/hooks/useGlobalDensity', () => ({
  useGlobalDensity: () => ({ toggle: vi.fn(), isCompact: false }),
}));

const renderBar = () =>
  render(
    <MemoryRouter>
      <GlobalCommandBar open onOpenChange={vi.fn()} />
    </MemoryRouter>,
  );

describe('GlobalCommandBar RBAC', () => {
  beforeEach(() => {
    rbac.userRoles = [];
    rbac.permissions = [];
    rbac.isLoading = false;
    window.localStorage.clear();
    // cmdk (CommandDialog) observa o container da lista; jsdom não implementa.
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      unobserve() {}
      disconnect() {}
    });
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('anuncia as rotas gateadas quando o usuario nao tem papel (fail-open)', () => {
    renderBar();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Configurações')).toBeInTheDocument();
  });

  it('esconde a rota gateada quando o papel nao tem a permissao', () => {
    rbac.userRoles = ['salesperson'];
    rbac.permissions = ['view_analytics'];
    renderBar();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.queryByText('Configurações')).not.toBeInTheDocument();
    expect(screen.queryByText('/configuracoes')).not.toBeInTheDocument();
  });

  it('mantem visiveis as rotas fora do mapa de permissoes', () => {
    rbac.userRoles = ['salesperson'];
    rbac.permissions = [];
    renderBar();
    expect(screen.getByText('Pipeline')).toBeInTheDocument();
    expect(screen.getByText('Insights')).toBeInTheDocument();
    expect(screen.queryByText('Analytics')).not.toBeInTheDocument();
  });
});