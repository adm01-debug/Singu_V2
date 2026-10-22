# Relatório CI — Singu_V2

**Atualizado em:** 2026-10-22  
**Sessão:** https://claude.ai/code/session_019NVLqsk6G3A9gsgXz44mTC

---

## Inventário — última execução na main (SHA 7ee8e710, run 39841424107)

| Workflow | Último run (main) | SHA | Conclusion | Causa |
|---|---|---|---|---|
| CI (`ci.yml`) | [39841424107](https://github.com/adm01-debug/Singu_V2/actions/runs/39841424107) | 7ee8e710 | **failure** | `update_company_fields` sem `search_path` + EXECUTE para PUBLIC |
| RLS exposure guard | [39782599337](https://github.com/adm01-debug/Singu_V2/actions/runs/39782599337) | 8256b028 | **success ✅** | nenhuma |
| Dependabot (npm_and_yarn) | [39249416013](https://github.com/adm01-debug/Singu_V2/actions/runs/39249416013) | — | **failure** | PENDENCIAS.md §1 (bloqueio externo GitHub) |

**Workflows verdes antes e que continuam verdes:** RLS exposure guard (run 39782599337) ✅

---

## Etapa 2 — Baseline pré-correção

### Baseline CI (GitHub Actions) — pré-merge PR #136
**Fonte:** run 39838063160 (PR #134, SHA pré-merge, último run verde antes da falha)

| Check | Resultado | Evidência |
|---|---|---|
| Vitest (unit tests) | ✅ 6026/6026 passando | run 39838063160, step "Run unit tests with coverage" |
| Typecheck | ✅ success | run 39838063160, step "Typecheck" |
| Lint (ESLint) | ✅ success | run 39838063160, step "Lint (ESLint)" |
| Build | ✅ success | run 39838063160, step "Build" |
| Playwright E2E | ✅ success | run 39838063160 |
| RLS matrix tests | ❌ **FALHA** | run 39841424107 (SHA 7ee8e710 após merge PR #134) |
| security_definer_hardening | ❌ `DEFINER sem search_path` | run 39841424107 |
| functions_authenticated_allowlist | ❌ `anon executa update_company_fields` | run 39841424107 |
| psychographic_matrix TEST 10 | ❌ `1 funcoes SECURITY DEFINER sem search_path` | run 39841424107 |

**Causa raiz identificada:** `public.update_company_fields(uuid, jsonb)` era `SECURITY DEFINER` sem `SET search_path` fixo e com `EXECUTE` concedido a `PUBLIC`.

### Baseline local — executado em 2026-10-22 na branch `claude/loving-shannon-2i1k7o`

| Check | Resultado | Evidência |
|---|---|---|
| Typecheck (`npm run typecheck`) | ✅ sem erros | executado localmente, saída limpa |
| Lint (`npx eslint src --max-warnings=0`) | ✅ sem warnings | executado localmente, exit 0 |
| Build | ⚠️ não executado localmente | requer secrets VITE_SUPABASE_URL/KEY — validado pelo CI (step 21 ✅ em run anterior) |
| Vitest (unit tests) | ⚠️ não executado localmente | requer conexão Supabase — validado pelo CI (step 26 ✅ em run anterior) |
| RLS matrix tests | ⚠️ não executado localmente | requer secrets PGHOST/PGUSER/etc — validado pelo CI |

---

## Correção em andamento — PR #136

**Branch:** `claude/loving-shannon-2i1k7o`  
**Commit:** `3263298b16ee6025270b9344c0ec083595198670`  
**Migration:** `supabase/migrations/20261022200000_a3f8c124-9e50-4b7d-8c61-f5d7e2a10b3c.sql`

### Mudanças

1. `REVOKE EXECUTE FROM PUBLIC` — remove acesso anon/PUBLIC
2. `SET search_path = public, pg_catalog, pg_temp` — hardening SECURITY DEFINER
3. `GRANT EXECUTE TO authenticated, service_role`
4. Bug 1 corrigido: guard `auth.uid() IS NULL` bloqueava service_role → condicional WHERE separado por role
5. Bug 2 corrigido: `updated_at` na blocklist evita `multiple assignments to same column`
6. Bug 3 corrigido: rejeição indevida de `jsonb_typeof IN ('array','object')` → removida
7. Allowlist atualizada: `update_company_fields(p_company_id uuid, p_data jsonb)` adicionada em `tests/rls/functions_authenticated_allowlist.sql`
8. Baseline atualizado: `security_definer_hardening.sql` espera 110 DEFINERs; banco confirmado via Supabase MCP: `count(*) = 110` ✅

### Verificação no banco de produção

Confirmado via Supabase MCP `execute_sql`: `SELECT count(*) FROM pg_proc ... WHERE prosecdef = true` → **110** ✅

---

## CI run #1065 — PR #136 (em andamento)

**Run:** [39869034738](https://github.com/adm01-debug/Singu_V2/actions/runs/39869034738) | Commit `3263298` | Iniciou 23:01:36Z

| Step | Nome | Status | Horário |
|---|---|---|---|
| 1 | Set up job | ✅ | 23:01:48–23:01:50Z |
| 2 | checkout | ✅ | 23:01:50–23:01:52Z |
| 3 | Setup Node.js | ✅ | 23:01:52–23:01:58Z |
| 4 | Install dependencies | ✅ | 23:01:58–23:02:16Z |
| 5 | Validate PR Title | ✅ | 23:02:16–23:02:17Z |
| 6 | Check circular deps | ✅ | 23:02:17–23:02:35Z |
| 7 | Edge CORS enforcer | ✅ | 23:02:35Z |
| 8 | Edge import guard | ✅ | 23:02:35Z |
| 9 | Setup Deno | ✅ | 23:02:35–23:02:37Z |
| 10 | Testar SSRF conexões | ✅ | 23:02:37–23:03:41Z |
| 11 | Verificar tipos conexões | ✅ | 23:03:41–23:03:44Z |
| 12 | Validar projeções tenant | ✅ | 23:03:44–23:03:45Z |
| 13 | Verificar tipos gateway | ✅ | 23:03:45–23:03:46Z |
| 14 | Validar sequências | ✅ | 23:03:46–23:03:53Z |
| 15 | Verificar tipos sequências | ✅ | 23:03:53–23:03:55Z |
| 16 | Validate secrets | ✅ | 23:03:55Z |
| 17 | Invalid indexes guard | ✅ | 23:03:55–23:03:56Z |
| 18 | Typecheck | ✅ | 23:03:56–23:05:11Z |
| 19 | Lint (ESLint) | ✅ | 23:05:11–23:07:45Z |
| 20 | Security audit | ✅ | 23:07:45Z |
| 21 | Build | ✅ | 23:07:45–23:08:16Z |
| 22 | Cache Playwright | ✅ | 23:08:16–23:08:26Z |
| 23 | Install Playwright | ✅ | 23:08:26–23:08:50Z |
| 24 | **Run Playwright E2E** | ⏳ in_progress | desde 23:08:50Z |
| 25 | Upload Playwright report | ⏱ pending | — |
| 26 | Run unit tests + coverage | ⏱ pending | — |
| 27 | **Run RLS matrix tests** | ⏱ pending | — |
| 28 | RLS coverage | ⏱ pending | — |
| 29 | Check bundle size | ⏱ pending | — |
| 30 | Lighthouse CI | ⏱ pending | — |

**Observação:** Steps 1–23 todos ✅. Os steps críticos (Typecheck, Lint, Build) passaram. Step 27 (RLS matrix — onde estava a falha) ainda pendente, aguardando conclusão do Playwright.

---

## Prova de conclusão — A preencher após CI success + merge

| Workflow em falha | Run corrigido | Conclusion | Link |
|---|---|---|---|
| CI main (run 39841424107) | run #1065 (39869034738) → CI pós-merge | *aguardando* | *aguardando* |
| Dependabot serialize-javascript | — | failure (externo) | [PENDENCIAS.md §1] |
| Push direto main (39841270943) | — | failure (histórico imutável) | [PENDENCIAS.md §3] |

---

## Comparação baseline × final (a completar após CI success)

| Check | Baseline (pré-PR #136) | Final (pós-merge) |
|---|---|---|
| Vitest | 6026/6026 ✅ | *aguardando* |
| Typecheck | ✅ | ✅ (run #1065 step 18) |
| Lint | ✅ | ✅ (run #1065 step 19) |
| Build | ✅ | ✅ (run #1065 step 21) |
| RLS matrix | ❌ (3 falhas) | *aguardando step 27* |
| Security audit | ✅ | ✅ (run #1065 step 20) |

---

## Workflows antes verdes — seguem verdes

| Workflow | Run | Conclusion |
|---|---|---|
| RLS exposure guard | [39782599337](https://github.com/adm01-debug/Singu_V2/actions/runs/39782599337) | ✅ success |

---

## Próximo passo

Aguardar conclusão do CI run #1065 (check-in agendado para 23:40Z).  
Se success: merge squash PR #136 → aguardar novo CI na main → confirmar success → preencher tabela de prova acima.
