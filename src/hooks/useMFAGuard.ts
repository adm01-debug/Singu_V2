import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useNavigate, useLocation } from 'react-router-dom';
import { logger } from '@/lib/logger';

export function useMFAGuard() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const [mfaVerified, setMfaVerified] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    async function checkMFA() {
      if (authLoading || adminLoading || !user || !isAdmin) {
        if (!authLoading && !adminLoading && (!user || !isAdmin)) {
          setMfaVerified(true); // Non-admins or non-users don't need MFA check here
        }
        return;
      }

      try {
        const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (error) throw error;

        // aal1 = password only
        // aal2 = password + second factor
        const isVerified = data.currentLevel === 'aal2';
        setMfaVerified(isVerified);

        if (!isVerified && location.pathname !== '/seguranca') {
          navigate('/seguranca', { 
            state: { 
              mfaRequired: true, 
              from: location.pathname 
            } 
          });
        }
      } catch (err) {
        logger.error('MFA Check Error:', err);
        setMfaVerified(false);
      }
    }

    checkMFA();
  }, [user, isAdmin, authLoading, adminLoading, navigate, location.pathname]);

  return {
    isCheckingMFA: mfaVerified === null && isAdmin,
    isMfaVerified: mfaVerified,
    isMfaRequired: isAdmin && mfaVerified === false
  };
}
