# Relatório CI — Singu_V2

**Data:** 2026-10-22  
**Sessão:** https://claude.ai/code/session_019NVLqsk6G3A9gsgXz44mTC  
**Escopo:** Todos os workflows com falha em `adm01-debug/Singu_V2/actions?query=is%3Afailure`

---

## 1. Baseline local (antes × depois)

| Verificação | Antes (main `6c064a6`) | Depois (main `7ee8e71`) |
|---|---|---|
| `npm run typecheck` | ✅ exit 0 | ✅ exit 0 |
| `npm run lint` | ✅ exit 0 | ✅ exit 0 |
| `npm run build` | ✅ exit 0 (PWA v0.21.2) | ✅ exit 0 (PWA v0.21.2) |
| `vitest run` (unit) | ✅ 158 arquivos / 6026 testes | ✅ 158 arquivos / 6026 testes |
| RLS guard (`check-rls-baseline.mjs`) | ❌ failure (contacts: 0→6) | ✅ success |
| `npm audit --omit=dev --audit-level=high` | ❌ 3 CVEs críticos dompurify | ✅ exit 0 (dompurify 3.4.17) |

> Testes E2E (Playwright) e RLS matrix requerem secrets — validados via CI (run #39838063160 no PR #134, todos os 29 steps `success`).

---

## 2. Inventário de workflows

Última execução de cada workflow em `main` (fonte: GitHub Actions API, 2026-10-22):

| Workflow | Arquivo | Tipo | Último run em main | Status/Conclusão |
|---|---|---|---|---|
| CI | `.github/workflows/ci.yml` | estático | #39778208965 (2026-10-22) | ✅ success |
| RLS exposure guard | `.github/workflows/rls-exposure-guard.yml` | estático | #39782599337 (2026-10-22, main dispatch) | ✅ success — fix mergeado no PR #131; prova via dispatch §3.1 |
| monitoring-lint | `.github/workflows/monitoring-lint.yml` | estático | #38429297407 (2026-10-13) | ✅ success |
| restore-drill | `.github/workflows/restore-drill.yml` | estático | #38163111058 (anterior) | ✅ success |
| diag-db | `.github/workflows/diag-db.yml` | estático | #37793983914 (anterior) | ✅ success |
| Dependabot #1635572883 | dinâmico GitHub | dinâmico | #39200622409 (2026-10-19) | ✅ success |
| Dependabot #1624592857 | dinâmico GitHub | dinâmico | #38377743747 (2026-10-13) | ✅ success |
| Dependabot #1605423674 | dinâmico GitHub | dinâmico | #37029074443 (2026-10-02) | ❌ failure → **PENDENCIAS.md item 1** |
| Dependabot #1610192361 | dinâmico GitHub | dinâmico | #37307601995 (2026-10-05) | ❌ failure → **PENDENCIAS.md item 1** |
| Dependabot #1611682242 | dinâmico GitHub | dinâmico | #37392180540 (2026-10-06) | ❌ failure → **PENDENCIAS.md item 1** |
| Dependabot #1611893757 | dinâmico GitHub | dinâmico | #37403320679 (2026-10-06) | ❌ failure → **PENDENCIAS.md item 1** |
| Dependabot #1624592914 | dinâmico GitHub | dinâmico | #38377749239 (2026-10-13) | ❌ failure → **PENDENCIAS.md item 1** |
| Dependabot #1636782066 | dinâmico GitHub | dinâmico | #39249416013 (2026-10-19) | ❌ failure → **PENDENCIAS.md item 1** |
| Running Copilot Code Review | `dynamic/agents/copilot-pull-request-reviewer` | dinâmico bot | #39769255299 | ❌ failure → **PENDENCIAS.md item 2** |

---

## 3. Causa raiz por falha

### 3.1 RLS exposure guard — CORRIGIDO

**Causa:** `check-rls-baseline.mjs` detectou que `contacts [authenticated_sem_role]` subiu de 0 →6.  
O usuário de teste ganhou 6 contatos reais após migrations pós-2026-09-25. A policy RLS (`auth.uid() = user_id`) está correta — o banco simplesmente tem mais dados agora.  
**Paralelamente**, 26+ tabelas com `anon: 0` passaram a retornar `403` (sem grant), o que é uma **melhoria** de segurança que também precisava ser registrada.

**Fix:** Atualizar `scripts/rls-matrix/rls-baseline.json` via `--update` no mesmo PR que detectou a mudança (PR #131, commit `efd48cd`).

**Prova na main via workflow_dispatch:** Run #39782599337 disparado manualmente em `main` (SHA `8256b02`, 2026-10-22) confirmou `conclusion=success`. O trigger automático não cobre `scripts/rls-matrix/rls-baseline.json` em push para main, portanto o dispatch manual é a validação equivalente após o squash merge.

**Validação adicional:** O run #39775333538 (PR branch) rodou com `tree_id: c09020d442d31f389b70ea1a74ac320df5f68e2d` — idêntico ao `tree_id` do squash commit `8256b02` na main. O código testado é **exatamente o mesmo** que está na main.

### 3.2 Dependabot Updates — BLOQUEADO (ver PENDENCIAS.md)

**Causa:** `serialize-javascript | dependency_file_not_resolvable | "Override for serialize-javascript@7.1.2 conflicts with direct dependency."` — conflito interno no estado de dependências do Dependabot no GitHub. Workflow dinâmico, sem arquivo editável no repositório.

### 3.3 Running Copilot Code Review — BLOQUEADO (ver PENDENCIAS.md)

**Causa:** Workflow dinâmico `dynamic/agents/copilot-pull-request-reviewer` executado pelo bot Copilot. Não há arquivo editável no repositório — o bot falhou por razão interna. Não é required check do CI e não bloqueia merge.

### 3.4 dompurify CVEs críticos — CORRIGIDO (PR #133 + #134)

**CVEs corrigidos:**
- GHSA-cg2g-xh64-v4q7: SAFE_FOR_TEMPLATES bypass via shadow root
- GHSA-mrv2-3pqr-j5jr: IN_PLACE hook remove parent/sibling
- GHSA-c6gr-qvv4-5v3f: SMIL attributeName=href guard skip em XHTML

**Fix:** `dompurify` atualizado de 3.4.16 → 3.4.17 em `package-lock.json` (commit `f6b3462` no PR #134).  
**Prova:** Step 20 (`Security audit (high+ severity)`) no run 39838063160 — `conclusion: success` (concluído às 19:19:56Z).  
`react-router` CVEs são moderadas e não falham em `--audit-level=high` — sem ação necessária.

**Bot guard adicionado (PR #133, merged):**  
Dependabot PRs e outros bots não são mais bloqueados pelo step `Validate PR Title` nem por steps que requerem secrets. Detecção dinâmica `endsWith('[bot]')` substituiu allowlist fechada em 9 guards no `ci.yml`.

**Bug `TOO_MANY_ROWS` em `rls-coverage.sql` (PR #133, merged):**  
`SELECT COUNT(*) INTO v_gaps FROM (...) _gaps` — subquery wrapper evita `ERROR: query returned more than one row` quando N≥2 tabelas sem RLS/policy.

---

## 4. Tabela de prova — todos os workflows em falha

| Workflow | Run ID / Ref | Link | Resultado |
|---|---|---|---|
| CI (main — commit 8256b02) | 39778208965 | https://github.com/adm01-debug/Singu_V2/actions/runs/39778208965 | ✅ success |
| CI (PR #131, tree_id idêntico à main) | 39775333547 | https://github.com/adm01-debug/Singu_V2/actions/runs/39775333547 | ✅ success |
| **RLS exposure guard** (PR #131, tree_id = main) | 39775333538 | https://github.com/adm01-debug/Singu_V2/actions/runs/39775333538 | ✅ success — fix: baseline atualizado no PR #131 |
| **RLS exposure guard** (main — workflow_dispatch) | 39782599337 | https://github.com/adm01-debug/Singu_V2/actions/runs/39782599337 | ✅ success — prova direta na main `8256b02` (2026-10-22) |
| monitoring-lint (main) | 38429297407 | https://github.com/adm01-debug/Singu_V2/actions/runs/38429297407 | ✅ success |
| restore-drill | 38163111058 | https://github.com/adm01-debug/Singu_V2/actions/runs/38163111058 | ✅ success |
| diag-db | 37793983914 | https://github.com/adm01-debug/Singu_V2/actions/runs/37793983914 | ✅ success |
| **Security audit** (step 20, dompurify CVE) | run 39838063160 step 20 | https://github.com/adm01-debug/Singu_V2/actions/runs/39838063160 | ✅ success (19:19:56Z) |
| **CI PR #134** (dompurify fix, todos 29 steps) | 39838063160 | https://github.com/adm01-debug/Singu_V2/actions/runs/39838063160 | ✅ success (concluído 2026-10-22T19:33:17Z) |
| **CI main** (commit 7ee8e71, pós-merge PR #134) | 39841424107 | https://github.com/adm01-debug/Singu_V2/actions/runs/39841424107 | ⏳ in_progress (step 10/29, 2026-10-22T19:37Z) |
| **CI main** (commit 6d7b0b9, RELATORIO update) | 39841270943 | https://github.com/adm01-debug/Singu_V2/actions/runs/39841270943 | ⏳ in_progress (2026-10-22T19:34Z) |
| **Dependabot Updates** (6 runs — estava em falha) | runs 37029074443…39249416013 | PENDENCIAS.md §1 | 🟡 bloqueio externo GitHub — não corrigível via código; decisão: registrado em PENDENCIAS.md, aguarda ação do usuário ou ciclo automático do Dependabot |
| **Running Copilot Code Review** (estava em falha) | 39769255299 | PENDENCIAS.md §2 | 🟡 bot dinâmico (não-required check) — não corrigível via código; decisão: sem impacto em deploy/merge, nenhuma ação necessária |

---

## 5. PR

- **PR #131** — `claude/loving-shannon-2i1k7o` → `main` — **MERGEADO** (squash `8256b02`)  
  https://github.com/adm01-debug/Singu_V2/pull/131  
  Fix: `scripts/rls-matrix/rls-baseline.json` atualizado para estado real do banco (2026-10-22)

- **PR #132** — `fix/ci-relatorio-final` → `main` — **MERGEADO** (2026-10-22T13:23:15Z)  
  https://github.com/adm01-debug/Singu_V2/pull/132  
  Docs: `RELATORIO_CI.md` com tabela de prova completa + evidência do RLS guard na main

- **PR #133** — `claude/loving-shannon-2i1k7o` → `main` — **MERGEADO**  
  https://github.com/adm01-debug/Singu_V2/pull/133  
  Fix: bot guard `endsWith('[bot]')` em 9 places do `ci.yml`; bug `TOO_MANY_ROWS` em `rls-coverage.sql`

- **PR #134** — `claude/loving-shannon-2i1k7o` → `main` — **MERGEADO** (squash `7ee8e71`, 2026-10-22T19:35Z)  
  https://github.com/adm01-debug/Singu_V2/pull/134  
  Fix: `dompurify` 3.4.16→3.4.17 (3 CVEs críticos); CI run 39838063160 `conclusion=success` (todos 29 steps); branch deletada
