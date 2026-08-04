# PR #3 — Fechado como referência histórica

**Data de fechamento:** 2026-04-10
**Motivo:** `mergeable_state: dirty` — conflito real com `main` após push direto do Lovable em `bitrix24-webhook`, `evolution-webhook`, `disc-analyzer` e `voice-to-text` posteriormente a 09/04.

## Conteúdo preservado em PR #3 (branch `security/hardening-20260409-225244`)

Artefatos ainda válidos para consulta:

- `docs/AUDIT_REPORT_2026-04-09.md` (337 linhas de auditoria)
- `docs/SECURITY.md`, `ARQUITETURA.md`, `POPs_PROCESSOS.md`, `KPIs_GESTAO.md`, `SCHEMA.md`
- `supabase/functions/_shared/auth.ts` — helpers `withAuth`, `requireWebhookSecret`, `requireCronSecret`, `sanitizePhone`, `isAdmin`, `withAuthOrServiceRole`, `constantTimeEqual`
- 3 migrations SQL (hardening + dashboards + RPCs)
- `src/__tests__/auth-helpers.test.ts` (18 testes de anti-impersonation e timing attack)
- `.github/workflows/ci.yml` (lint, tsc, vitest, build, gitleaks, deno lint)
- `cloudflare-rate-limiter/` (Worker proxy)
- `src/pages/DashboardOperacional.tsx`, `DashboardTatico.tsx`, `DashboardEstrategico.tsx`

## Plano de recuperação futuro

1. Em sessão separada, usar `SUPABASE - GESTÃO DE CLIENTES:get_edge_function` para ler código HEAD atual (pós-Lovable) de `bitrix24-proxy` e `evolution-proxy`.
2. Aplicar patches do `auth.ts` helper manualmente, versão-por-versão.
3. Re-deployar via `SUPABASE - GESTÃO DE CLIENTES:deploy_edge_function` com `verify_jwt=true`, sem tocar no repo git.
4. Este caminho evita o conflito git permanentemente — edge functions passam a ser controladas diretamente pelo Supabase API, não pelo mirror do repo.
