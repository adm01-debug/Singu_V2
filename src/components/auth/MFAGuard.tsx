import { useMFAGuard } from '@/hooks/useMFAGuard';
import { PageLoadingFallback } from '@/components/feedback/PageLoadingFallback';
import { Suspense } from 'react';

export function MFAGuard({ children, setupFallback }: { children: React.ReactNode; setupFallback?: React.ReactNode }) {
  const { isCheckingMFA, isMfaRequired } = useMFAGuard();

  if (setupFallback && (isCheckingMFA || isMfaRequired)) {
    return <Suspense fallback={<PageLoadingFallback />}>{setupFallback}</Suspense>;
  }

  if (isCheckingMFA) {
    return <PageLoadingFallback />;
  }

  if (isMfaRequired) {
    return null;
  }

  return <>{children}</>;
}
