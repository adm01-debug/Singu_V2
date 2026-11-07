# Banco, Edge Functions e CI — referência para agentes

Detalhamento das regras resumidas em `AGENTS.md` (seção "Banco, Edge Functions, CI e código"). Ler quando for mexer em migration, edge function ou quando o CI ficar vermelho.

## Migrations (`supabase/migrations/`)

- Idempotente: `CREATE ... IF NOT EXISTS`, `DROP ... IF EXISTS`.
- Script de rollback comentado no fim do arquivo (`-- DOWN MIGRATION`).
- Toda tabela nova com `ENABLE ROW LEVEL SECURITY` e ao menos uma policy; mutações críticas encapsuladas em função `SECURITY DEFINER`.
- Modelo: `supabase/migration_template.sql`.
- Gates no CI: `scripts/migration/verify/rls-coverage.sql` (RLS + policy em 100% de `public.*`), `scripts/migration/verify/invalid-indexes-guard.sql`, matriz `tests/rls/run.sh` (perfis anon / user_a / user_b / user_admin).
- `rls-exposure-guard.yml` roda em toda PR que toca `supabase/migrations/**` ou `scripts/rls-matrix/**` e compara exposição com `scripts/rls-matrix/rls-baseline.json`.
- DDL/migration em produção = PR fica aberta para o dono (regra 8 do Fluxo Git).

## Edge Functions (`supabase/functions/`)

- Autenticação: `withAuth()` (JWT) para chamadas do front; `requireCronSecret()` para cron; `requireWebhookSecret()` para webhooks; `withAuthOrServiceRole()` para S2S. Helpers em `_shared/auth.ts`.
- CORS: `scopedCorsHeaders()` (`_shared/`). `Access-Control-Allow-Origin: *` só com ADR e entrada em `scripts/edge-cors-allowlist.txt`; `scripts/check-edge-cors.mjs` bloqueia o resto.
- Imports: `npm:pacote@versao`. `https://esm.sh/` é bloqueado por `scripts/check-edge-imports.mjs` (esm.sh retorna 502/503 e quebra o boot).
- Payloads validados com Zod; rate limit em `_shared/rate-limit.ts`; HTTP externo via `_shared/safe-http.ts` (proteção SSRF).
- Typecheck: `deno check --no-lock --node-modules-dir=none supabase/functions/*/index.ts`. Testes: `deno test` nos `*_test.ts` de `_shared/` e das funções.
- Deploy automático ao alterar `supabase/functions/`; verificação pós-deploy em `/functions/v1/system-health`. Procedimento completo em `docs/RUNBOOK.md`; contratos em `docs/EDGE_FUNCTIONS_API.md`.

## CI (`.github/workflows/ci.yml`)

Ordem dos gates: commitlint do título da PR (Conventional Commits) → depcruise (`.dependency-cruiser.cjs`) → guard CORS → guard de imports → testes dos guards (`node --test scripts/*.test.mjs`) → deno test/check das edge functions → secrets obrigatórios → invalid indexes guard → `npm run typecheck` → ESLint `--max-warnings=0` em `src`, `supabase/functions`, `scripts` e raiz → `npm audit --omit=dev --audit-level=high` → `npm run build` → Playwright E2E → `npm run test:coverage` → matriz RLS → RLS coverage → bundle size (`scripts/check-bundle-size.mjs`) → Lighthouse CI.

- Nova violação de lint só com `eslint-disable-next-line <regra> -- <motivo>` (ADR-020 e ADR-021 em `docs/adr/`).
- Passos que dependem de secrets não rodam em PR de bot.
- `monitoring-lint.yml` valida `monitoring/**` e `docs/runbooks/**` (promtool, amtool, cobertura de runbook).

## Código (front)

- Sem `any`: `unknown` + type guards/Zod.
- TanStack Query para todo server state; sem `useEffect` para fetch.
- Textos de UI em português.
- Tokens semânticos HSL; nunca cor hardcoded em componente.
- Arquivo ≤ 400 linhas; sem `console.log` em produção.
- Reusar primitivas: `EmptyState`, `useActionToast`, `ExternalDataCard`.
- Checklists completos de autor e revisor em `CONTRIBUTING.md`.
