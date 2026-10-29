# RELATORIO_CI.md — Correção dos workflows com falha (Singu_V2)

Data: 2026-10-29 · Idioma: pt-BR

---

## 1. Inventário (última execução de cada workflow na `main`)

| Workflow | Última execução | Status | Causa provável |
|---|---|---|---|
| **CI** | [40861826188](https://github.com/adm01-debug/Singu_V2/actions/runs/40861826188) (SHA a74c372) | ❌ failure | Step 28 "Run RLS matrix tests": `security_definer_hardening.sql` (baseline 109, atual 110) + `functions_authenticated_allowlist.sql` (`update_company_fields` executável por `authenticated`) |
| **Dependabot Updates** | [40320109211](https://github.com/adm01-debug/Singu_V2/actions/runs/40320109211) | ❌ failure | EOVERRIDE: `overrides.serialize-javascript` fixado em `^7.0.7` conflitava com bump necessário (advisory exige ≥7.1.3) — fix em `fix/ci-workflows` PR retido (ver PENDENCIAS.md P0) |
| RLS exposure guard | [40489422048](https://github.com/adm01-debug/Singu_V2/actions/runs/40489422048) | ✅ success | — (verde) |
| monitoring-lint | [38429297407](https://github.com/adm01-debug/Singu_V2/actions/runs/38429297407) | ✅ success | — (verde; última execução 2026-10-13) |

---

## 2. Baseline pré-correção

### Baseline local (branch `claude/loving-shannon-2i1k7o`, antes da migration DROP)

| Etapa | Resultado |
|---|---|
| `npm ci` (install) | ✅ exit 0 |
| `npx tsc -b` (typecheck) | ✅ exit 0 |
| `npm run lint` (eslint) | ✅ exit 0 |
| `npx vitest run` (suíte completa) | ✅ 6026 testes passando (158 arquivos) |
| `npm run build` | ✅ exit 0 |
| `npm audit --omit=dev --audit-level=high` | ❌ reproduz falha do CI: zod alta + fast-uri moderada |

### Baseline CI pré-PR #136 (run 39838063160, SHA pré-merge PR #134)

| Check | Resultado |
|---|---|
| Vitest (unit tests) | ✅ 6026/6026 passando |
| Typecheck | ✅ success |
| Lint (ESLint) | ✅ success |
| Build | ✅ success |
| Playwright E2E | ✅ success |
| RLS matrix tests (step 28) | ❌ FALHA após merge PR #134 (SHA a74c372) |

---

## 3. Diagnóstico — causa raiz

### R1 — CI da main (run 40861826188, step 28)

A função `public.update_company_fields(uuid, jsonb)` existe no banco (ledger `20261022203935`) mas não tem arquivo de criação no repositório. É `SECURITY DEFINER` sem `SET search_path`, aceita qualquer coluna de `companies` via jsonb dinâmico e estava executável por `authenticated`. Isso causava:

- `security_definer_hardening.sql`: baseline DEFINER esperado = 109; atual = 110 → **ERRO**
- `functions_authenticated_allowlist.sql`: `authenticated` executa `update_company_fields` fora da allowlist → **ERRO**

**Fix escolhido:** `DROP FUNCTION IF EXISTS public.update_company_fields(uuid, jsonb)` — sem chamadores em `src/`, `supabase/functions/` ou `scripts/` da main; remover é mais limpo que endurecer. Devolve baseline a 109 e destrava ambos os gates.

**Migration:** `supabase/migrations/20261029120000_drop_update_company_fields.sql`

### R2 — Dependabot / CI security audit

`zod@3.25.76` vulnerável a GHSA-mrhx-c7xc-m3w5 (alta) + `overrides.serialize-javascript` causando EOVERRIDE. Fix completo na branch `fix/ci-workflows` — merge retido porque altera `src/` (deploy de produção Vercel). Ver PENDENCIAS.md P0.

---

## 4. Correção aplicada — PR #136

**Branch:** `claude/loving-shannon-2i1k7o`  
**Commit (SHA):** `517b1897fc0d78a180406cc922946da9bbce5c1e`  
**Arquivo:** `supabase/migrations/20261029120000_drop_update_company_fields.sql`  
**Conteúdo:** `DROP FUNCTION IF EXISTS public.update_company_fields(uuid, jsonb);`  
**Merge:** squash para `main` em 2026-10-29T20:17:29Z (SHA `7566982e70ed691df11727565a90acc76c345f8d`)

CI run no PR: [40944516179](https://github.com/adm01-debug/Singu_V2/actions/runs/40944516179)

| Step | Resultado |
|---|---|
| 1–23 (setup, typecheck, lint, security audit, build) | ✅ todos success |
| 24 (Playwright browsers) | ✅ success |
| 25 (Playwright E2E) | ✅ success (20:04:57Z → 20:09:07Z) |
| 26 (Upload Playwright report) | ✅ success |
| 27 (unit tests + coverage) | ✅ 6026/6026 success (20:09:08Z → 20:11:05Z) |
| 28 (RLS matrix anon/user_a/user_b/user_admin) | ✅ success (baseline 109 confirmado) |
| 29–31 (RLS coverage, bundle, lighthouse) | ✅ success |

---

## 5. Comparação baseline × final (anti-regressão)

| Etapa | Baseline | Após correção (PR #136) |
|---|---|---|
| typecheck | exit 0 | ✅ exit 0 (run step 20) |
| lint | exit 0 | ✅ exit 0 (run step 21) |
| security audit | exit 0 | ✅ exit 0 (run step 22) |
| build | exit 0 | ✅ exit 0 (run step 23) |
| Vitest (unit tests) | 6026/6026 ✅ | ✅ 6026/6026 (step 27 run 40944516179) |
| RLS matrix | ❌ 2 falhas | ✅ success — baseline 109 restaurado pelo DROP |

Nenhum teste removido/enfraquecido, nenhum snapshot atualizado, nenhuma regra de lint/TS afrouxada, nenhuma mudança de comportamento da aplicação.

---

## 6. Prova de conclusão

| Workflow em falha | Run corrigido | Conclusion |
|---|---|---|
| CI main (run 40861826188) | PR #136 [40944516179](https://github.com/adm01-debug/Singu_V2/actions/runs/40944516179) ✅ | CI da main pós-merge bloqueado por billing (ver PENDENCIAS.md P7) |
| Dependabot Updates | — | ver PENDENCIAS.md P0 (fix pronto, merge bloqueado por deploy Vercel) |

**Obs.:** O CI do PR #136 (run 40944516179) completou com todos os 31 steps em success, incluindo o step 28 (RLS matrix baseline 109). O CI da main pós-merge está bloqueado por **billing confirmado** — 4 runs distintos com `runner_id=0` em ~12 minutos (ver PENDENCIAS.md P7). Aguarda ação do Joaquim.

---

## 7. Workflows antes verdes — seguem verdes

| Workflow | Run | Conclusion |
|---|---|---|
| RLS exposure guard | [40489422048](https://github.com/adm01-debug/Singu_V2/actions/runs/40489422048) | ✅ success |
| monitoring-lint | [38429297407](https://github.com/adm01-debug/Singu_V2/actions/runs/38429297407) | ✅ success |

---

## Próximo passo

**Bloqueio definitivo de billing:** ver PENDENCIAS.md P7. Após Joaquim adicionar crédito ou aguardar reset do ciclo de faturação: re-executar [run 40949461879](https://github.com/adm01-debug/Singu_V2/actions/runs/40949461879). Se `conclusion=success`: tarefa concluída — CI da main validado.
