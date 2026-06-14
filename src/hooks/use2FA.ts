import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TwoFactorState {
  isEnrolling: boolean;
  isVerifying: boolean;
  factorId: string | null;
  qrUri: string | null;
  isEnabled: boolean;
}

export function use2FA() {
  const [state, setState] = useState<TwoFactorState>({
    isEnrolling: false,
    isVerifying: false,
    factorId: null,
    qrUri: null,
    isEnabled: false,
  });

  const checkStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) return;
      const verified = data.totp.filter(f => f.status === 'verified');
      setState(s => ({ ...s, isEnabled: verified.length > 0, factorId: verified[0]?.id ?? null }));
    } catch { /* silent */ }
  }, []);

  const enroll = useCallback(async () => {
    setState(s => ({ ...s, isEnrolling: true }));
    try {
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

      setState(s => ({ ...s, isVerifying: false, isEnabled: true, qrUri: null }));
      toast.success('2FA ativado com sucesso!');
      return true;
    } catch {
      toast.error('Código inválido.');
      setState(s => ({ ...s, isVerifying: false }));
      return false;
    }
  }, [state.factorId]);

  const unenroll = useCallback(async () => {
    if (!state.factorId) return;
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: state.factorId });
      if (error) throw error;
      setState(s => ({ ...s, isEnabled: false, factorId: null, qrUri: null }));
      toast.success('2FA desativado.');
    } catch {
      toast.error('Erro ao desativar 2FA.');
    }
  }, [state.factorId]);

  return { ...state, checkStatus, enroll, verify, unenroll };
}
