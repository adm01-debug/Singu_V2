---
name: UX Rodada E — Excelência Operacional & Confiabilidade
description: Rodada E entregue 5/5 — useActionToast.destructive aplicado em completar tarefa (Tarefas/Inbox), optimistic update + rollback em useCompleteTask, useReopenTask para Undo, Error Boundaries granulares no Pipeline, Suspense já global via LazyPage, script de performance budget.
type: feature
---
**Rodada E entregue (5/5) — 25/25 melhorias acumuladas. Excellence 10/10 sustentada.**

1. **useActionToast wire-up**: `Tarefas.tsx` e `Inbox.tsx` agora usam `destructive({ message, onUndo })` ao concluir tarefa, com Undo de 5s que dispara `useReopenTask`.
2. **Optimistic update em useCompleteTask**: snapshot via `getQueriesData(['tasks'])`, `setQueryData` instantâneo marcando `status='completed'` + `completed_at`, `onError` rollback completo, `onSettled` invalidate. Novo hook `useReopenTask` faz reverse via RPC `reopen_task` ou fallback `update tasks`.
3. **Error Boundaries granulares no Pipeline**: cada seção (SummaryCards, ForecastConfidencePanel, Kanban, VelocityPanel, StalledDealsPanel) envolvida em `<DashboardErrorBoundary>` com nome contextual.
4. **Suspense boundaries**: já implementado globalmente via `LazyPage` (Suspense + ErrorBoundary + PageLoadingFallback) em todas as rotas inclusive Intelligence/ABM/Analytics. Sub-sections usam `LazySection`.
5. **Performance budget**: novo `scripts/check-bundle-size.mjs` valida entry ≤350KB gzip e chunks ≤500KB gzip, imprime top-10 chunks. Memória `mem://standards/performance-budget` documenta o padrão. Rotas admin (audit-trail, knowledge-export, docs) já lazy via `lazy()` + `LazyPage`.

**Status global: A+B+C+D+E = 25/25 melhorias entregues.**
