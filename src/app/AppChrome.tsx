import { Suspense, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { GlobalSyncIndicator } from '@/components/feedback/GlobalSyncIndicator';
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
    <Suspense fallback={null}>
      <WhatsNewModal />
    </Suspense>
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
        <Suspense fallback={null}>
          <PWAShell />
        </Suspense>
      )}

      {shouldLoadAuthenticatedChrome && (
        <>
          <Suspense fallback={null}>
            <SchemaDriftBannerLazy />
          </Suspense>
          <Suspense fallback={null}>
            <EasterEggsProvider />
          </Suspense>
          <Suspense fallback={null}>
            <KeyboardShortcutsDialogEnhanced />
          </Suspense>
          <Suspense fallback={null}>
            <SessionExpiryHandler />
          </Suspense>
          <WhatsNewWrapper />
        </>
      )}
    </>
  );
};
