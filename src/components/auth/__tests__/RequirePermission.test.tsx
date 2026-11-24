import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RequirePermission } from '@/components/auth/RequirePermission';

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

const renderGuarded = () =>
  render(
    <MemoryRouter initialEntries={['/analytics']}>
      <Routes>
        <Route path="/" element={<div>home</div>} />
        <Route
          path="/analytics"
          element={
            <RequirePermission permission="view_analytics">
              <div>area-analytics</div>
            </RequirePermission>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

describe('RequirePermission', () => {
  beforeEach(() => {
    rbac.userRoles = [];
    rbac.permissions = [];
    rbac.isLoading = false;
  });

  it('libera quando o usuário não tem papel atribuído (fail-open)', () => {
    renderGuarded();
    expect(screen.getByText('area-analytics')).toBeTruthy();
  });

  it('libera quando o papel tem a permissão', () => {
    rbac.userRoles = ['manager'];
    rbac.permissions = ['view_analytics'];
    renderGuarded();
    expect(screen.getByText('area-analytics')).toBeTruthy();
  });

  it('redireciona para a home quando o papel não tem a permissão', () => {
    rbac.userRoles = ['salesperson'];
    rbac.permissions = ['view_clients'];
    renderGuarded();
    expect(screen.queryByText('area-analytics')).toBeNull();
    expect(screen.getByText('home')).toBeTruthy();
  });

  it('não bloqueia enquanto o RBAC carrega', () => {
    rbac.userRoles = ['salesperson'];
    rbac.isLoading = true;
    renderGuarded();
    expect(screen.getByText('area-analytics')).toBeTruthy();
  });
});