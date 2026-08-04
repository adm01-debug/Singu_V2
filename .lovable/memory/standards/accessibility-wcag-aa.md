---
name: WCAG 2.1 AA accessibility checklist
description: Padrões de acessibilidade aplicados em superfícies críticas (navegação, formulários, listas, modais).
type: standards
---

## Checklist aplicado em todas as superfícies críticas

- **Skip link**: `<SkipNav />` em `App.tsx` aponta para `#main-content` (focus visível).
- **Landmark `<main>`**: `AppLayout` renderiza `<main id="main-content" tabIndex={-1} aria-label={pageTitle}>`.
- **Anúncio de rota**: `RouteAnnouncer` em `aria-live="polite"` informa mudanças de página.
- **`aria-current="page"`**: aplicado em AppSidebar, MobileBottomNav, PageHeader breadcrumb e NavigationPatterns.
- **Toasts acessíveis**: `useActionToast` integra `useAriaLiveRegion` (polite/assertive conforme severidade).
- **Foco visível**: tokens Tailwind `focus-visible:ring-2 focus-visible:ring-ring` herdados via shadcn/ui.
- **Loaders semânticos**: `role="status"` + `aria-live="polite"` nos componentes de carregamento padrão.
- **Atalhos descobertos**: `KeyboardShortcutsCheatsheet` (?) lista todos os atalhos com `KeyboardHint`.
- **Imagens decorativas**: `aria-hidden="true"` aplicado em ícones puramente decorativos.

## Referências de implementação

- `src/components/navigation/SkipNav.tsx`
- `src/components/navigation/RouteAnnouncer.tsx`
- `src/components/feedback/AriaLiveRegion.tsx`
- `src/hooks/useAccessibleToast.ts`
- `src/hooks/useActionToast.ts`
- `src/hooks/useKeyboardShortcutsEnhanced.ts`
