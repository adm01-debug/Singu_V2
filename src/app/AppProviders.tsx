import { assertProviderOrder } from '@/lib/providerGuard';
import { ProviderErrorBoundary } from '@/components/feedback/ProviderErrorBoundary';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { NavigationStackProvider } from '@/contexts/NavigationStackContext';
import { CelebrationProvider } from '@/components/celebrations/CelebrationProvider';
import { AriaLiveProvider } from '@/components/feedback/AriaLiveRegion';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { RouteAnnouncer } from '@/components/navigation/RouteAnnouncer';
import { SkipNav } from '@/components/navigation/SkipNav';
import ScrollToTop from '@/components/ScrollToTop';
import { MotionConfig } from 'framer-motion';
import { queryClient } from './queryClient';
import { AppRoutes } from './AppRoutes';
import { DeferredAppChrome } from './AppChrome';

/* ═══════════════════════════════════════════════════════════════════
 * PROVIDER HIERARCHY — ORDEM OBRIGATÓRIA (NÃO ALTERAR SEM VALIDAR)
 *
 * 1. HelmetProvider          — sem dependências
 * 2. ErrorBoundary           — sem dependências (captura erros globais)
 * 3. QueryClientProvider     — sem dependências (TanStack Query)
 * 4. CelebrationProvider     — sem dependências
 * 5. AriaLiveProvider        — sem dependências (acessibilidade)
 * 6. TooltipProvider         — sem dependências
 * 7. BrowserRouter           — sem dependências (React Router)
 * 8. AuthProvider            — DEPENDE de BrowserRouter + QueryClientProvider
 * 9. NavigationStackProvider — DEPENDE de BrowserRouter + AuthProvider
 *
 * ⚠️ Alterar esta ordem PODE causar tela branca (white-screen crash).
 * Consulte: mem://architecture/provider-hierarchy-and-context
 * ═══════════════════════════════════════════════════════════════════ */

if (import.meta.env.DEV) {
  assertProviderOrder([
    'HelmetProvider',
    'ErrorBoundary',
    'QueryClientProvider',
    'CelebrationProvider',
    'AriaLiveProvider',
    'TooltipProvider',
    'BrowserRouter',
    'AuthProvider',
    'NavigationStackProvider',
  ]);
}

export const AppProviders = () => (
  <HelmetProvider>
    <MotionConfig reducedMotion="user">
    <ErrorBoundary showDetails={import.meta.env.DEV}>
      <QueryClientProvider client={queryClient}>
        <CelebrationProvider>
          <AriaLiveProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <SkipNav />
                <ProviderErrorBoundary providerName="AuthProvider">
                  <AuthProvider>
                    <ProviderErrorBoundary providerName="NavigationStackProvider">
                      <NavigationStackProvider>
                        <ScrollToTop />
                        <RouteAnnouncer />
                        <AppRoutes />
                        <DeferredAppChrome />
                      </NavigationStackProvider>
                    </ProviderErrorBoundary>
                  </AuthProvider>
                </ProviderErrorBoundary>
              </BrowserRouter>
            </TooltipProvider>
          </AriaLiveProvider>
        </CelebrationProvider>
      </QueryClientProvider>
    </ErrorBoundary>
    </MotionConfig>
  </HelmetProvider>
);
