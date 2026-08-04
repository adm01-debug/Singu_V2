import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageLoadingFallback } from '@/components/feedback/PageLoadingFallback';

export default function SSOCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate('/', { replace: true });
      } else {
        navigate('/auth', { replace: true });
      }
    });
  }, [navigate]);

  return <PageLoadingFallback />;
}
