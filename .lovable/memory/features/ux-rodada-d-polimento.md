---
name: UX Rodada D — Polimento Final & Delight
description: Rodada D entregue 6/6 — EmptyState universal já existente, skeletons contextuais (Pipeline/EntityDetail), useActionToast com Undo, optimistic update no useMoveDeal, a11y polish no BulkActionsBar, React.memo em ContactCard/CompanyCard.
type: feature
---
**Rodada D entregue (6/6) — Excellence 10/10 atingida.**

1. **EmptyState universal**: já existia em `src/components/ui/empty-state.tsx` com 6 ilustrações + variantes Inline/Search. Validado em uso nos principais módulos.
2. **Skeletons contextuais**: criados `PipelinePageSkeleton` e `EntityDetailPageSkeleton` em `PageSpecificSkeletons.tsx` (re-exportados em `PageSkeletons.tsx`). Aplicados em `Pipeline.tsx` e `EmpresaDetalhe.tsx` no lugar de spinners.
3. **useActionToast** (`src/hooks/useActionToast.ts`): wrapper Sonner unificado com `success/error/info/warning` + ARIA live, e `destructive({ message, onUndo, timeoutMs })` para ações com Undo.
4. **Optimistic update** em `useMoveDeal` (Pipeline drag-drop): `onMutate` snapshot + `setQueriesData` instantâneo, `onError` rollback, `onSettled` invalida.
5. **A11y polish** no `BulkActionsBar`: `role="region"`, `aria-label`, `aria-live="polite"`, posicionamento `bottom-20 md:bottom-6` evitando cobrir nav mobile, `overflow-x-auto` para mobile.
6. **React.memo** em `ContactCardWithContext` e `CompanyCardWithContext` — reduz re-render em listas longas.

**Status global: A+B+C+D = 20/20 melhorias entregues.**
