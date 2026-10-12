import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useNavigate, useLocation } from 'react-router-dom';
import { logger } from '@/lib/logger';

export function useMFAGuard() {
  const { user, session, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const [verification, setVerification] = useState<{ token: string | undefined; verified: boolean } | null>(null);
  const token = session?.access_token;
  const mfaVerified = verification?.token === token ? verification?.verified ?? null : null;
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    async function checkMFA() {
      if (authLoading || adminLoading || !user || !isAdmin) {
        if (!authLoading && !adminLoading && (!user || !isAdmin)) {
          if (!cancelled) setVerification({ token, verified: true });
        }
        return;
      }

      try {
        const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (cancelled) return;
        if (error) throw error;

        const isVerified = data.currentLevel === 'aal2';
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
  }, [user, token, isAdmin, authLoading, adminLoading, navigate, location.pathname, location.search, location.hash]);

  return {
    isCheckingMFA: authLoading || adminLoading || (mfaVerified === null && isAdmin),
    isMfaVerified: mfaVerified,
    isMfaRequired: isAdmin && mfaVerified === false
  };
}
