import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TwoFactorSetup } from './TwoFactorSetup';
import { MFA_STATUS_CHANGED_EVENT } from '@/hooks/use2FA';
import { toast } from 'sonner';

const mfa = vi.hoisted(() => ({
  listFactors: vi.fn(), getAuthenticatorAssuranceLevel: vi.fn(),
  enroll: vi.fn(), challenge: vi.fn(), verify: vi.fn(), unenroll: vi.fn(),
}));
const auth = vi.hoisted(() => ({ token: 'sessao-aal1', refreshSession: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { mfa, refreshSession: auth.refreshSession } } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ session: { access_token: auth.token } }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));

describe('Configuração e confirmação MFA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.token = 'sessao-aal1';
    auth.refreshSession.mockResolvedValue({ error: null });
    mfa.listFactors.mockResolvedValue({ data: { totp: [], all: [] }, error: null });
    mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({ data: { currentLevel: 'aal1' }, error: null });
    mfa.enroll.mockResolvedValue({ data: { id: 'novo-fator', totp: { uri: 'otpauth://totp/Singu?secret=JBSWY3DPEHPK3PXP' } }, error: null });
    mfa.challenge.mockResolvedValue({ data: { id: 'desafio' }, error: null });
    mfa.verify.mockResolvedValue({ error: null });
    mfa.unenroll.mockResolvedValue({ error: null });
  });

  it('solicita código para um fator já cadastrado em uma sessão AAL1', async () => {
    const verified = { id: 'fator-existente', status: 'verified', factor_type: 'totp' };
    mfa.listFactors.mockResolvedValue({ data: { totp: [verified], all: [verified] }, error: null });
    const onVerified = vi.fn();
    render(<TwoFactorSetup onVerified={onVerified} />);
    const input = await screen.findByLabelText('Código de verificação');
    expect(screen.queryByRole('button', { name: 'Desativar' })).not.toBeInTheDocument();
    fireEvent.change(input, { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar acesso' }));
    await waitFor(() => expect(onVerified).toHaveBeenCalledOnce());
    expect(mfa.challenge).toHaveBeenCalledWith({ factorId: 'fator-existente' });
    expect(mfa.verify).toHaveBeenCalledWith({ factorId: 'fator-existente', challengeId: 'desafio', code: '123456' });
    expect(screen.getByText('2FA ativo')).toBeInTheDocument();
    expect(mfa.enroll).not.toHaveBeenCalled();
  });

  it('retoma configuração interrompida e não libera acesso com código inválido', async () => {
    const pending = { id: 'fator-pendente', status: 'unverified', factor_type: 'totp' };
    mfa.listFactors.mockResolvedValue({ data: { totp: [pending], all: [pending] }, error: null });
    mfa.verify.mockResolvedValueOnce({ error: new Error('código inválido') });
    const onVerified = vi.fn();
    render(<TwoFactorSetup onVerified={onVerified} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Ativar 2FA' }));
    const input = await screen.findByLabelText('Código de verificação');
    expect(mfa.unenroll).toHaveBeenCalledWith({ factorId: 'fator-pendente' });
    fireEvent.change(input, { target: { value: '111111' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verificar' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Verificar' })).toBeEnabled());
    expect(onVerified).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: '222222' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verificar' }));
    await waitFor(() => expect(onVerified).toHaveBeenCalledOnce());
  });

  it('preserva o fator em configuração quando o token é renovado', async () => {
    const onVerified = vi.fn();
    const { rerender } = render(<TwoFactorSetup onVerified={onVerified} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Ativar 2FA' }));
    await screen.findByLabelText('Código de verificação');
    const pending = { id: 'novo-fator', status: 'unverified', factor_type: 'totp' };
    mfa.listFactors.mockResolvedValue({ data: { totp: [pending], all: [pending] }, error: null });
    auth.token = 'sessao-renovada';
    rerender(<TwoFactorSetup onVerified={onVerified} />);
    const input = await screen.findByLabelText('Código de verificação');
    fireEvent.change(input, { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verificar' }));
    await waitFor(() => expect(onVerified).toHaveBeenCalledOnce());
    expect(mfa.challenge).toHaveBeenCalledWith({ factorId: 'novo-fator' });
    expect(mfa.enroll).toHaveBeenCalledOnce();
  });

  it('distingue uma consulta indisponível de ausência de MFA e permite repetir', async () => {
    mfa.listFactors.mockResolvedValueOnce({ data: null, error: new Error('rede indisponível') });
    render(<TwoFactorSetup />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível consultar');
    expect(screen.queryByRole('button', { name: 'Ativar 2FA' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByRole('button', { name: 'Ativar 2FA' })).toBeEnabled();
  });

  it('ignora a consulta antiga que termina depois da criação do novo QR', async () => {
    let finishEnrollment!: () => void;
    let finishAssurance!: () => void;
    const enrollment = new Promise<void>(resolve => { finishEnrollment = resolve; });
    const assurance = new Promise<void>(resolve => { finishAssurance = resolve; });
    mfa.enroll.mockImplementationOnce(async () => {
      await enrollment;
      return { data: { id: 'novo-fator', totp: { uri: 'otpauth://totp/Singu?secret=JBSWY3DPEHPK3PXP' } }, error: null };
    });
    const onVerified = vi.fn();
    const view = render(<TwoFactorSetup onVerified={onVerified} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Ativar 2FA' }));
    await waitFor(() => expect(mfa.enroll).toHaveBeenCalledOnce());
    mfa.getAuthenticatorAssuranceLevel.mockImplementationOnce(async () => {
      await assurance;
      return { data: { currentLevel: 'aal1' }, error: null };
    });
    auth.token = 'sessao-renovada';
    view.rerender(<TwoFactorSetup onVerified={onVerified} />);
    await waitFor(() => expect(mfa.getAuthenticatorAssuranceLevel).toHaveBeenCalledTimes(2));
    await act(async () => finishEnrollment());
    await screen.findByLabelText('Código de verificação');
    await act(async () => finishAssurance());
    fireEvent.change(screen.getByLabelText('Código de verificação'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verificar' }));
    await waitFor(() => expect(onVerified).toHaveBeenCalledOnce());
    expect(mfa.challenge).toHaveBeenCalledWith({ factorId: 'novo-fator' });
    expect(mfa.enroll).toHaveBeenCalledOnce();
  });

  it('invalida a confirmação após remover MFA mesmo se a renovação falhar', async () => {
    const verified = { id: 'fator-existente', status: 'verified', factor_type: 'totp' };
    mfa.listFactors.mockResolvedValue({ data: { totp: [verified], all: [verified] }, error: null });
    mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({ data: { currentLevel: 'aal2' }, error: null });
    auth.refreshSession.mockResolvedValueOnce({ error: new Error('rede indisponível') });
    const changed = vi.fn();
    window.addEventListener(MFA_STATUS_CHANGED_EVENT, changed);
    try {
      render(<TwoFactorSetup />);
      fireEvent.click(await screen.findByRole('button', { name: 'Desativar' }));
      await screen.findByRole('button', { name: 'Ativar 2FA' });
      await waitFor(() => expect(toast.warning).toHaveBeenCalledWith(expect.stringContaining('acesso administrativo permanece bloqueado')));
      expect(changed).toHaveBeenCalledOnce();
      expect(auth.refreshSession).toHaveBeenCalledOnce();
      expect(toast.error).not.toHaveBeenCalled();
      expect(mfa.unenroll).toHaveBeenCalledWith({ factorId: 'fator-existente' });
    } finally { window.removeEventListener(MFA_STATUS_CHANGED_EVENT, changed); }
  });

  it('permite confirmar com o segundo autenticador e preserva a escolha ao renovar o token', async () => {
    const factors = [
      { id: 'celular-antigo', status: 'verified', factor_type: 'totp', friendly_name: 'Celular antigo' },
      { id: 'reserva', status: 'verified', factor_type: 'totp', friendly_name: 'Autenticador reserva' },
    ];
    mfa.listFactors.mockResolvedValue({ data: { totp: factors, all: factors }, error: null });
    const onVerified = vi.fn();
    const view = render(<TwoFactorSetup onVerified={onVerified} />);
    fireEvent.change(await screen.findByLabelText('Aplicativo autenticador'), { target: { value: 'reserva' } });
    auth.token = 'sessao-renovada';
    view.rerender(<TwoFactorSetup onVerified={onVerified} />);
    await waitFor(() => expect(mfa.listFactors).toHaveBeenCalledTimes(2));
    expect(await screen.findByLabelText('Aplicativo autenticador')).toHaveValue('reserva');
    fireEvent.change(screen.getByLabelText('Código de verificação'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar acesso' }));
    await waitFor(() => expect(onVerified).toHaveBeenCalledOnce());
    expect(mfa.challenge).toHaveBeenCalledWith({ factorId: 'reserva' });
    expect(mfa.verify).toHaveBeenCalledWith({ factorId: 'reserva', challengeId: 'desafio', code: '123456' });
  });
});
