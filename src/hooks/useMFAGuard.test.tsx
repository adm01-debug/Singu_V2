import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { MFAGuard } from '@/components/auth/MFAGuard';
import { MFA_STATUS_CHANGED_EVENT } from '@/hooks/use2FA';

const mocks = vi.hoisted(() => ({
  user: { id: 'administrador' },
  token: 'sessao-inicial',
  adminLoading: false,
  roleError: null as Error | null,
  retryRoleCheck: vi.fn(),
  assurance: vi.fn(),
  factors: vi.fn(),
}));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({
  user: mocks.user, session: { access_token: mocks.token }, loading: false,
}) }));
vi.mock('@/hooks/useIsAdmin', () => ({ useIsAdmin: () => ({ isAdmin: true, isLoading: mocks.adminLoading,
  error: mocks.roleError, refetch: mocks.retryRoleCheck }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { mfa: {
  getAuthenticatorAssuranceLevel: mocks.assurance,
  listFactors: mocks.factors,
} } } }));

function Recovery() {
  const location = useLocation();
  const state = location.state as { from: string } | null;
  return <div>Configurar MFA <span>{state?.from}</span></div>;
}
function Harness({ start = '/admin?tab=usuarios#permissoes' }: { start?: string } = {}) {
  return <MemoryRouter initialEntries={[start]}>
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
    mocks.roleError = null;
    mocks.assurance.mockResolvedValue({ data: { currentLevel: 'aal1' }, error: null });
    mocks.factors.mockResolvedValue({ data: { all: [{ id: 'fator', status: 'verified' }] }, error: null });
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

  it('não oferece recuperação enquanto o papel está pendente na própria rota de segurança', () => {
    mocks.adminLoading = true;
    render(<Harness start="/seguranca" />);
    expect(screen.queryByText(/Configurar MFA/)).not.toBeInTheDocument();
    expect(screen.queryByText('Configurações completas')).not.toBeInTheDocument();
    expect(mocks.assurance).not.toHaveBeenCalled();
  });

  it('bloqueia falha de papel e permite consultar as permissões novamente', async () => {
    mocks.roleError = new Error('consulta de papel indisponível');
    const view = render(<Harness start="/seguranca" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível confirmar suas permissões');
    expect(screen.queryByText(/Configurar MFA/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(mocks.retryRoleCheck).toHaveBeenCalledOnce();
    mocks.roleError = null;
    view.rerender(<Harness start="/seguranca" />);
    await screen.findByText(/Configurar MFA/);
  });

  it('mantém a administração bloqueada em falha de consulta e permite recuperação', async () => {
    mocks.assurance.mockResolvedValue({ data: null, error: new Error('consulta indisponível') });
    render(<Harness />);
    await screen.findByText(/Configurar MFA/);
    await waitFor(() => expect(mocks.assurance).toHaveBeenCalled());
    expect(screen.queryByText('Conteúdo administrativo')).not.toBeInTheDocument();
  });

  it('revoga a aprovação do mesmo token quando o último fator é removido', async () => {
    mocks.assurance.mockResolvedValue({ data: { currentLevel: 'aal2' }, error: null });
    render(<Harness start="/seguranca" />);
    await screen.findByText('Configurações completas');
    mocks.factors.mockResolvedValue({ data: { all: [] }, error: null });
    act(() => window.dispatchEvent(new Event(MFA_STATUS_CHANGED_EVENT)));
    expect(screen.queryByText('Configurações completas')).not.toBeInTheDocument();
    await screen.findByText(/Configurar MFA/);
    await waitFor(() => expect(mocks.assurance).toHaveBeenCalledTimes(2));
    expect(mocks.token).toBe('sessao-inicial');
    expect(screen.queryByText('Conteúdo administrativo')).not.toBeInTheDocument();
  });
});
