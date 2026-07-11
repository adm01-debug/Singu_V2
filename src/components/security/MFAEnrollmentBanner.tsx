import { useEffect, useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const DISMISS_KEY = 'singu_mfa_banner_dismissed';
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

/**
 * Banner discreto que incentiva usuários sem MFA ativo a habilitá-lo.
 * - Verifica fatores MFA do usuário via supabase.auth.mfa.listFactors().
 * - Dispensa persiste por 7 dias em localStorage.
 */
export const MFAEnrollmentBanner = ({ className }: { className?: string }) => {
  const { user } = useAuth();
  const [hasMfa, setHasMfa] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      if (raw) {
        const at = Number(raw);
        if (Number.isFinite(at) && Date.now() - at < DISMISS_TTL_MS) {
          setDismissed(true);
        }
      }
    } catch {
      /* localStorage indisponível */
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    supabase.auth.mfa.listFactors().then(({ data }) => {
      if (!alive) return;
      const verified = (data?.totp ?? []).some((f) => f.status === 'verified');
      setHasMfa(verified);
    }).catch(() => {
      if (alive) setHasMfa(true); // em caso de erro, não incomoda o usuário
    });
    return () => { alive = false; };
  }, [user]);

  const handleDismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* ignora */ }
    setDismissed(true);
  };

  if (!user || hasMfa !== false || dismissed) return null;

  return (
    <div
      role="status"
      className={cn(
        'flex items-center gap-3 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-900 dark:text-amber-100',
        className,
      )}
    >
      <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="flex-1">
        <span className="font-medium">Proteja sua conta.</span>{' '}
        <span className="text-amber-800/90 dark:text-amber-200/90">
          Ative a autenticação em dois fatores para maior segurança.
        </span>
      </div>
      <Button asChild size="sm" variant="outline" className="h-7">
        <Link to="/configuracoes?tab=seguranca">Ativar agora</Link>
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7"
        onClick={handleDismiss}
        aria-label="Dispensar aviso de MFA por 7 dias"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
};

export default MFAEnrollmentBanner;