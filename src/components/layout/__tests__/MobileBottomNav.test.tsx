import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

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

vi.mock('@/hooks/useHapticFeedback', () => ({
  useHapticFeedback: () => ({
    light: vi.fn(),
    medium: vi.fn(),
    heavy: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    selection: vi.fn(),
    vibrate: vi.fn(),
  }),
}));

const openMoreMenu = () => {
  render(
    <MemoryRouter>
      <MobileBottomNav />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByText('Mais'));
};

describe('MobileBottomNav', () => {
  beforeEach(() => {
    rbac.userRoles = [];
    rbac.permissions = [];
    rbac.isLoading = false;
  });

  it('anuncia rota gateada quando o usuario nao tem papel (fail-open)', () => {
    openMoreMenu();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Configurações')).toBeInTheDocument();
  });

  it('esconde a rota gateada quando o papel nao tem a permissao', () => {
    rbac.userRoles = ['salesperson'];
    rbac.permissions = ['view_analytics'];
    openMoreMenu();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.queryByText('Configurações')).not.toBeInTheDocument();
  });

  it('mantem visiveis as rotas fora do mapa de permissoes', () => {
    rbac.userRoles = ['salesperson'];
    rbac.permissions = [];
    openMoreMenu();
    expect(screen.getByText('Pipeline')).toBeInTheDocument();
    expect(screen.getByText('Insights')).toBeInTheDocument();
    expect(screen.queryByText('Analytics')).not.toBeInTheDocument();
  });
});
