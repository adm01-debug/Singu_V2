import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useNavigate, useLocation } from 'react-router-dom';
import { logger } from '@/lib/logger';
import { MFA_STATUS_CHANGED_EVENT } from '@/hooks/use2FA';

export function useMFAGuard() {
  const { user, session, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading, error: roleError, refetch: retryRoleCheck } = useIsAdmin();
  const [verification, setVerification] = useState<{ token: string | undefined; verified: boolean } | null>(null);
  const [revision, setRevision] = useState(0);
  const token = session?.access_token;
  const mfaVerified = verification?.token === token ? verification?.verified ?? null : null;
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const recheck = () => {
      setVerification(null);
      setRevision(value => value + 1);
    };
    window.addEventListener(MFA_STATUS_CHANGED_EVENT, recheck);
    return () => window.removeEventListener(MFA_STATUS_CHANGED_EVENT, recheck);
  }, []);

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

        const isVerified = assurance.data.currentLevel === 'aal2' && factors.data.all.some(factor => factor.status === 'verified');
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
  }, [user, token, revision, isAdmin, authLoading, adminLoading, roleError, navigate, location.pathname, location.search, location.hash]);

  return {
    isCheckingIdentity: authLoading || adminLoading,
    roleError,
    retryRoleCheck,
    isCheckingMFA: authLoading || adminLoading || (mfaVerified === null && isAdmin),
    isMfaVerified: mfaVerified,
    isMfaRequired: isAdmin && mfaVerified === false
  };
}
