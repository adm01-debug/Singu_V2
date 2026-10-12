import { useMFAGuard } from '@/hooks/useMFAGuard';
import { PageLoadingFallback } from '@/components/feedback/PageLoadingFallback';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';

export function MFAGuard({ children, setupFallback }: { children: React.ReactNode; setupFallback?: React.ReactNode }) {
  const { isCheckingMFA, isMfaRequired, isCheckingIdentity, roleError, retryRoleCheck } = useMFAGuard();

  if (roleError) {
    return <div role="alert" className="p-6 space-y-3">
      <p>Não foi possível confirmar suas permissões.</p>
      <Button onClick={() => retryRoleCheck()} variant="outline">Tentar novamente</Button>
    </div>;
  }

  if (isCheckingIdentity) return <PageLoadingFallback />;

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
