import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useNavigate, useLocation } from 'react-router-dom';
import { logger } from '@/lib/logger';
import { MFA_STATUS_CHANGED_EVENT, MFA_VERIFIED_EVENT } from '@/lib/mfaEvents';

const revalidationKey = (userId: string) => `singu:mfa-revalidar:${userId}`;

export function useMFAGuard() {
  const { user, session, loading: authLoading } = useAuth();
  const userId = user?.id;
  const { isAdmin, isLoading: adminLoading, error: roleError, refetch: retryRoleCheck } = useIsAdmin();
  const [verification, setVerification] = useState<{ token: string | undefined; verified: boolean } | null>(null);
  const [revision, setRevision] = useState(0);
  const [revokedUser, setRevokedUser] = useState<string | null>(null);
  const [mfaError, setMfaError] = useState(false);
  const token = session?.access_token;
  let persistedRevocation = false;
  try {
    persistedRevocation = !!user && localStorage.getItem(revalidationKey(user.id)) === '1';
  } catch {
    persistedRevocation = false;
  }
  const requiresFreshCode = !!user && (revokedUser === user.id || persistedRevocation);
  const mfaVerified = verification?.token === token ? verification?.verified ?? null : null;
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const recheck = () => {
      setVerification(null);
      setRevokedUser(userId ?? null);
      if (userId) {
        try { localStorage.setItem(revalidationKey(userId), '1'); } catch { logger.warn('Não foi possível persistir a exigência de confirmação MFA.'); }
      }
      setRevision(value => value + 1);
    };
    const verified = () => {
      setVerification(null);
      setRevokedUser(null);
      if (userId) {
        try { localStorage.removeItem(revalidationKey(userId)); } catch { logger.warn('Não foi possível atualizar a confirmação MFA.'); }
      }
      setRevision(value => value + 1);
    };
    const synchronize = (event: StorageEvent) => {
      if (event.key === (userId && revalidationKey(userId))) {
        setRevokedUser(event.newValue === '1' ? userId ?? null : null);
        setVerification(null);
        setRevision(value => value + 1);
      }
    };
    window.addEventListener(MFA_STATUS_CHANGED_EVENT, recheck);
    window.addEventListener(MFA_VERIFIED_EVENT, verified);
    window.addEventListener('storage', synchronize);
    return () => {
      window.removeEventListener(MFA_STATUS_CHANGED_EVENT, recheck);
      window.removeEventListener(MFA_VERIFIED_EVENT, verified);
      window.removeEventListener('storage', synchronize);
    };
  }, [userId]);

  const retryMfaCheck = () => {
    setMfaError(false);
    setVerification(null);
    setRevision(value => value + 1);
  };

  useEffect(() => {
    let cancelled = false;
    async function checkMFA() {
      if (roleError) return;
      if (authLoading || adminLoading || !user || !isAdmin) {
        if (!authLoading && !adminLoading && (!user || !isAdmin)) {
          if (!cancelled) setVerification({ token, verified: true });
        }
        return;
      }

      try {
        const [assurance, factors] = await Promise.all([
          supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
          supabase.auth.mfa.listFactors(),
        ]);
        if (cancelled) return;
        if (assurance.error) throw assurance.error;
        if (factors.error) throw factors.error;

        const isVerified = !requiresFreshCode && assurance.data.currentLevel === 'aal2' && factors.data.all.some(factor => factor.status === 'verified');
        setMfaError(false);
        setVerification({ token, verified: isVerified });

        if (!isVerified && location.pathname !== '/seguranca') {
          navigate('/seguranca', {
            replace: true,
            state: {
              mfaRequired: true,
              from: location.pathname + location.search + location.hash
            }
          });
        }
      } catch (err) {
        if (cancelled) return;
        logger.error('Falha ao verificar MFA:', err);
        setMfaError(true);
        setVerification({ token, verified: false });
        if (location.pathname !== '/seguranca') {
          navigate('/seguranca', { replace: true, state: {
            mfaRequired: true,
            from: location.pathname + location.search + location.hash,
          } });
        }
      }
    }

    checkMFA();
    return () => { cancelled = true; };
  }, [user, token, revision, requiresFreshCode, isAdmin, authLoading, adminLoading, roleError, navigate, location.pathname, location.search, location.hash]);

  return {
    isCheckingIdentity: authLoading || adminLoading,
    roleError,
    mfaError,
    retryMfaCheck,
    retryRoleCheck,
    isCheckingMFA: authLoading || adminLoading || (mfaVerified === null && isAdmin),
    isMfaVerified: mfaVerified,
    isMfaRequired: isAdmin && mfaVerified === false
  };
}
