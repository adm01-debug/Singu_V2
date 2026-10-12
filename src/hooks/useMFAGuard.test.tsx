import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { MFAGuard } from '@/components/auth/MFAGuard';

const mocks = vi.hoisted(() => ({
  user: { id: 'administrador' },
  token: 'sessao-inicial',
  adminLoading: false,
  assurance: vi.fn(),
}));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({
  user: mocks.user, session: { access_token: mocks.token }, loading: false,
}) }));
vi.mock('@/hooks/useIsAdmin', () => ({ useIsAdmin: () => ({ isAdmin: true, isLoading: mocks.adminLoading }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { mfa: {
  getAuthenticatorAssuranceLevel: mocks.assurance,
} } } }));

function Recovery() {
  const location = useLocation();
  const state = location.state as { from: string } | null;
  return <div>Configurar MFA <span>{state?.from}</span></div>;
}
function Harness() {
  return <MemoryRouter initialEntries={['/admin?tab=usuarios#permissoes']}>
    <Routes>
      <Route path="/admin" element={<MFAGuard><div>Conteúdo administrativo</div></MFAGuard>} />
      <Route path="/seguranca" element={<MFAGuard setupFallback={<Recovery />}><div>Configurações completas</div></MFAGuard>} />
    </Routes>
  </MemoryRouter>;
}

describe('MFA administrativo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.token = 'sessao-inicial';
    mocks.adminLoading = false;
    mocks.assurance.mockResolvedValue({ data: { currentLevel: 'aal1' }, error: null });
  });

  it('permite configurar MFA em AAL1 e preserva a URL sem mostrar a administração', async () => {
    render(<Harness />);
    await screen.findByText(/Configurar MFA/);
    expect(screen.getByText('/admin?tab=usuarios#permissoes')).toBeInTheDocument();
    expect(screen.queryByText('Conteúdo administrativo')).not.toBeInTheDocument();
    expect(screen.queryByText('Configurações completas')).not.toBeInTheDocument();
  });

  it('aguarda a consulta de papel antes de mostrar qualquer conteúdo protegido', async () => {
    mocks.adminLoading = true;
    const view = render(<Harness />);
    expect(screen.queryByText('Conteúdo administrativo')).not.toBeInTheDocument();
    expect(mocks.assurance).not.toHaveBeenCalled();
    mocks.adminLoading = false;
    view.rerender(<Harness />);
    await screen.findByText(/Configurar MFA/);
  });

  it('descarta a confirmação AAL2 anterior quando a sessão muda', async () => {
    mocks.assurance.mockResolvedValue({ data: { currentLevel: 'aal2' }, error: null });
    const view = render(<Harness />);
    await screen.findByText('Conteúdo administrativo');
    mocks.token = 'nova-sessao-aal1';
    mocks.assurance.mockResolvedValue({ data: { currentLevel: 'aal1' }, error: null });
    view.rerender(<Harness />);
    expect(screen.queryByText('Conteúdo administrativo')).not.toBeInTheDocument();
    await screen.findByText(/Configurar MFA/);
  });

  it('mantém a administração bloqueada em falha de consulta e permite recuperação', async () => {
    mocks.assurance.mockResolvedValue({ data: null, error: new Error('consulta indisponível') });
    render(<Harness />);
    await screen.findByText(/Configurar MFA/);
    await waitFor(() => expect(mocks.assurance).toHaveBeenCalled());
    expect(screen.queryByText('Conteúdo administrativo')).not.toBeInTheDocument();
  });
});
