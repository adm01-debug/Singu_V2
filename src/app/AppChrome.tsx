import { Suspense, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { GlobalSyncIndicator } from '@/components/feedback/GlobalSyncIndicator';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';
import {
  PWAShell,
  SchemaDriftBannerLazy,
  EasterEggsProvider,
  KeyboardShortcutsDialogEnhanced,
  SessionExpiryHandler,
  WhatsNewModal,
} from './lazyPages';

/** Modal "O que há de novo" — apenas para usuários autenticados fora de /auth */
const WhatsNewWrapper = () => {
  const { user } = useAuth();
  const location = useLocation();
  if (!user || location.pathname === '/auth') return null;
  return (
    <DashboardErrorBoundary sectionName="Novidades">
      <Suspense fallback={null}>
        <WhatsNewModal />
      </Suspense>
    </DashboardErrorBoundary>
  );
};

/**
 * Chrome/shell deferido: carrega componentes não-críticos (PWA, atalhos, easter eggs)
 * após 800ms de idle, apenas para usuários autenticados.
 */
export const DeferredAppChrome = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(false);
    if (location.pathname === '/auth') return;
    const timer = window.setTimeout(() => setIsReady(true), 800);
    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  const shouldLoadAuthenticatedChrome = isReady && !!user && location.pathname !== '/auth';
  const shouldLoadShell = isReady && location.pathname !== '/auth';

  return (
    <>
      <GlobalSyncIndicator />
      {shouldLoadShell && (
        <DashboardErrorBoundary sectionName="PWA Shell">
          <Suspense fallback={null}>
            <PWAShell />
          </Suspense>
        </DashboardErrorBoundary>
      )}

      {shouldLoadAuthenticatedChrome && (
        <>
          <DashboardErrorBoundary sectionName="Schema Drift">
            <Suspense fallback={null}>
              <SchemaDriftBannerLazy />
            </Suspense>
          </DashboardErrorBoundary>
          <DashboardErrorBoundary sectionName="Easter Eggs">
            <Suspense fallback={null}>
              <EasterEggsProvider />
            </Suspense>
          </DashboardErrorBoundary>
          <DashboardErrorBoundary sectionName="Atalhos de Teclado">
            <Suspense fallback={null}>
              <KeyboardShortcutsDialogEnhanced />
            </Suspense>
          </DashboardErrorBoundary>
          <DashboardErrorBoundary sectionName="Expiração de Sessão">
            <Suspense fallback={null}>
              <SessionExpiryHandler />
            </Suspense>
          </DashboardErrorBoundary>
          <WhatsNewWrapper />
        </>
      )}
    </>
  );
};
