import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export const MFA_STATUS_CHANGED_EVENT = 'singu:mfa-status-changed';

interface TwoFactorState {
  isEnrolling: boolean;
  isVerifying: boolean;
  factorId: string | null;
  qrUri: string | null;
  isEnabled: boolean;
  isSessionVerified: boolean;
  isLoading: boolean;
  statusError: string | null;
  verifiedFactors: { id: string; name: string }[];
}

export function use2FA() {
  const { session } = useAuth();
  const activeToken = useRef(session?.access_token);
  const statusGeneration = useRef(0);
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
    verifiedFactors: [],
  });

  const checkStatus = useCallback(async () => {
    const token = session?.access_token;
    const generation = ++statusGeneration.current;
    setState(s => ({ ...s, isLoading: true, statusError: null }));
    try {
      const [factors, assurance] = await Promise.all([
        supabase.auth.mfa.listFactors(),
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      ]);
      if (factors.error) throw factors.error;
      if (assurance.error) throw assurance.error;
      if (activeToken.current !== token || statusGeneration.current !== generation) return;
      const verified = factors.data.totp.filter(f => f.status === 'verified');
      setState(s => {
        const pending = factors.data.all.some(f => f.id === s.factorId && f.factor_type === 'totp' && f.status === 'unverified');
        return { ...s, isLoading: false, isEnabled: verified.length > 0,
          verifiedFactors: verified.map((factor, index) => ({ id: factor.id, name: factor.friendly_name || `Autenticador ${index + 1}` })),
          factorId: verified.some(factor => factor.id === s.factorId) ? s.factorId : verified[0]?.id ?? (pending ? s.factorId : null),
          qrUri: verified.length === 0 && pending ? s.qrUri : null,
          isSessionVerified: assurance.data.currentLevel === 'aal2' };
      });
    } catch {
      if (activeToken.current !== token || statusGeneration.current !== generation) return;
      setState(s => ({ ...s, isLoading: false, statusError: 'Não foi possível consultar a autenticação em duas etapas.' }));
    }
  }, [session?.access_token]);

  const selectFactor = useCallback((factorId: string) => {
    setState(s => s.verifiedFactors.some(factor => factor.id === factorId) ? { ...s, factorId } : s);
  }, []);

  const enroll = useCallback(async () => {
    statusGeneration.current++;
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
      statusGeneration.current++;
      setState(s => ({ ...s, isEnrolling: false, isLoading: false, statusError: null, factorId: data.id, qrUri: data.totp.uri }));
      return data;
    } catch {
      statusGeneration.current++;
      toast.error('Erro ao configurar 2FA.');
      setState(s => ({ ...s, isEnrolling: false, isLoading: false }));
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
    statusGeneration.current++;
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: state.factorId });
      if (error) throw error;
      statusGeneration.current++;
      setState(s => {
        const verifiedFactors = s.verifiedFactors.filter(factor => factor.id !== state.factorId);
        return { ...s, isLoading: false, isEnabled: verifiedFactors.length > 0, isSessionVerified: false,
          verifiedFactors, factorId: verifiedFactors[0]?.id ?? null, qrUri: null };
      });
      window.dispatchEvent(new Event(MFA_STATUS_CHANGED_EVENT));
      const refresh = await supabase.auth.refreshSession().catch(() => ({ error: new Error('Falha na renovação da sessão') }));
      if (refresh.error) {
        toast.warning('2FA desativado. Não foi possível renovar sua sessão; o acesso administrativo permanece bloqueado.');
        return;
      }
      toast.success('2FA desativado.');
    } catch {
      toast.error('Erro ao desativar 2FA.');
    }
  }, [state.factorId]);

  return { ...state, checkStatus, selectFactor, enroll, verify, unenroll };
}
