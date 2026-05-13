import { useMFAGuard } from '@/hooks/useMFAGuard';
import { PageLoadingFallback } from '@/components/feedback/PageLoadingFallback';

export function MFAGuard({ children }: { children: React.ReactNode }) {
  const { isCheckingMFA, isMfaRequired } = useMFAGuard();

  if (isCheckingMFA) {
    return <PageLoadingFallback />;
  }

  // If MFA is required, the hook already handles navigation to /seguranca.
  // We prevent rendering the protected content.
  if (isMfaRequired) {
    return null;
  }

  return <>{children}</>;
}
