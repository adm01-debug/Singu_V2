---
name: Provider Hierarchy Protection
description: Sistema de proteção robusta para hierarquia de providers em App.tsx com validação, ErrorBoundary, HOC e testes.
type: feature
---
- `src/lib/providerGuard.ts`: validação de ordem, detecção de erros de contexto, PROVIDER_ORDER canônico
- `src/components/feedback/ProviderErrorBoundary.tsx`: ErrorBoundary especializado com diagnóstico de dependências
- `src/components/hoc/withProviderCheck.tsx`: HOC para verificar providers-pai em DEV
- `scripts/lint-providers.cjs`: script de lint para pre-commit hooks
- `src/test/providers.test.ts`: 10 testes cobrindo validação de ordem e detecção de erros
- App.tsx: `assertProviderOrder()` em DEV, ProviderErrorBoundary envolvendo AuthProvider e NavigationStackProvider
- Ordem obrigatória: HelmetProvider → ErrorBoundary → QueryClientProvider → CelebrationProvider → AriaLiveProvider → TooltipProvider → BrowserRouter → AuthProvider → NavigationStackProvider
- AuthProvider depende de BrowserRouter + QueryClientProvider; NavigationStackProvider depende de BrowserRouter; EasterEggsProvider depende de AuthProvider
