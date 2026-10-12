import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface TwoFactorState {
  isEnrolling: boolean;
  isVerifying: boolean;
  factorId: string | null;
  qrUri: string | null;
  isEnabled: boolean;
  isSessionVerified: boolean;
  isLoading: boolean;
  statusError: string | null;
}

export function use2FA() {
  const { session } = useAuth();
  const activeToken = useRef(session?.access_token);
  activeToken.current = session?.access_token;
  const [state, setState] = useState<TwoFactorState>({
    isEnrolling: false,
    isVerifying: false,
    factorId: null,
    qrUri: null,
    isEnabled: false,
    isSessionVerified: false,
    isLoading: true,
    statusError: null,
  });

  const checkStatus = useCallback(async () => {
    const token = session?.access_token;
    setState(s => ({ ...s, isLoading: true, statusError: null }));
    try {
      const [factors, assurance] = await Promise.all([
        supabase.auth.mfa.listFactors(),
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      ]);
      if (factors.error) throw factors.error;
      if (assurance.error) throw assurance.error;
      if (activeToken.current !== token) return;
      const verified = factors.data.totp.filter(f => f.status === 'verified');
      setState(s => {
        const pending = factors.data.all.some(f => f.id === s.factorId && f.factor_type === 'totp' && f.status === 'unverified');
        return { ...s, isLoading: false, isEnabled: verified.length > 0,
          factorId: verified[0]?.id ?? (pending ? s.factorId : null),
          qrUri: verified.length === 0 && pending ? s.qrUri : null,
          isSessionVerified: assurance.data.currentLevel === 'aal2' };
      });
    } catch {
      if (activeToken.current !== token) return;
      setState(s => ({ ...s, isLoading: false, statusError: 'Não foi possível consultar a autenticação em duas etapas.' }));
    }
  }, [session?.access_token]);

  const enroll = useCallback(async () => {
    setState(s => ({ ...s, isEnrolling: true }));
    try {
      const factors = await supabase.auth.mfa.listFactors();
      if (factors.error) throw factors.error;
      for (const factor of factors.data.all.filter(f => f.factor_type === 'totp' && f.status === 'unverified')) {
        const removal = await supabase.auth.mfa.unenroll({ factorId: factor.id });
        if (removal.error) throw removal.error;
      }
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'SINGU CRM' });
      if (error) throw error;
      setState(s => ({ ...s, isEnrolling: false, factorId: data.id, qrUri: data.totp.uri }));
      return data;
    } catch {
      toast.error('Erro ao configurar 2FA.');
      setState(s => ({ ...s, isEnrolling: false }));
      return null;
    }
  }, []);

  const verify = useCallback(async (code: string) => {
    if (!state.factorId) { toast.error('Fator não encontrado.'); return false; }
    setState(s => ({ ...s, isVerifying: true }));
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId: state.factorId });
      if (challenge.error) throw challenge.error;

      const verifyResult = await supabase.auth.mfa.verify({
        factorId: state.factorId,
        challengeId: challenge.data.id,
        code,
      });
      if (verifyResult.error) throw verifyResult.error;

      setState(s => ({ ...s, isVerifying: false, isEnabled: true, isSessionVerified: true, qrUri: null }));
      toast.success(state.isEnabled ? 'Acesso confirmado com 2FA.' : '2FA ativado com sucesso!');
      return true;
    } catch {
      toast.error('Código inválido.');
      setState(s => ({ ...s, isVerifying: false }));
      return false;
    }
  }, [state.factorId, state.isEnabled]);

  const unenroll = useCallback(async () => {
    if (!state.factorId) return;
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: state.factorId });
      if (error) throw error;
      setState(s => ({ ...s, isEnabled: false, isSessionVerified: false, factorId: null, qrUri: null }));
      toast.success('2FA desativado.');
    } catch {
      toast.error('Erro ao desativar 2FA.');
    }
  }, [state.factorId]);

  return { ...state, checkStatus, enroll, verify, unenroll };
}
