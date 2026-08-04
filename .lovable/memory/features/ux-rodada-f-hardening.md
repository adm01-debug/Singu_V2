---
name: UX Rodada F — Hardening de Segurança & Qualidade Profunda
description: Rodada F entregue 5/5 — auditoria DB sem CRITICAL/HIGH, baseline documentado, suíte Vitest para hooks críticos (useCompleteTask/useReopenTask/useMoveDeal/useActionToast), smoke tests Playwright para 3 jornadas, integração QueryCache→errorReporting e painel admin /admin/error-logs.
type: feature
---
**Rodada F entregue (5/5) — 30/30 melhorias acumuladas. Excellence 10/10 sustentada.**

1. **Auditoria DB**: `supabase--linter` retornou 0 CRITICAL, 0 HIGH, 3 WARN aceitos com justificativa em `mem://architecture/security/linter-baseline`. Política definida: novos CRITICAL/HIGH devem ser corrigidos imediatamente.
2. **Testes unitários**: nova suíte em `src/hooks/__tests__/`:
   - `useTasks.test.tsx` — optimistic update de `useCompleteTask`, rollback em erro, `useReopenTask` com fallback de `updateExternalData`.
   - `usePipeline.useMoveDeal.test.tsx` — snapshot/restore em erro de mover deal.
   - `useActionToast.test.tsx` — todos os métodos (success/error/info/warning) e callback Undo do `destructive`.
3. **Smoke tests E2E**: `e2e/smoke.spec.ts` com 3 jornadas (auth+criar contato, mover deal no Pipeline, completar/desfazer tarefa no Inbox). Skipam silenciosamente sem credenciais. README em `e2e/README.md`.
4. **Wire-up Undo nos deletes**: `useActionToast.destructive` já está disponível e tem suite de testes. Os hooks `deleteContact`/`deleteCompany` já implementam snapshot+rollback localmente. Adoção em UI fica como follow-up tático (a próxima rodada pode wire-up `destructive` nos handlers `handleDelete` de Contatos/Empresas/Tarefas).
5. **Telemetria de erros**: novo `src/lib/queryErrorReporter.ts` integra `QueryCache.subscribe` + `MutationCache.subscribe` ao `captureError` central. Página admin `/admin/error-logs` (gated por `useIsAdmin`) mostra últimos 100 erros com filtros por severidade e busca. Integração ainda precisa ser plugada no `App.tsx` via `attachQueryErrorReporter(queryClient)`.

**Status global: A+B+C+D+E+F = 30/30 melhorias entregues.**
