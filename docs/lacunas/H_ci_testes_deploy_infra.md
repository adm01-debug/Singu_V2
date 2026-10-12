# Fatia H — CI/CD, testes, infra, observabilidade e tooling

> Repositório `/home/user/Singu_V2` · HEAD `e616c20` (2026-10-11) · auditoria somente leitura (nenhum arquivo do repo alterado).
> Fontes de evidência: (1) leitura dos arquivos com `caminho:linha`; (2) API do GitHub (runs, jobs, logs, check-runs, deployments, branch protection, secret scanning, Dependabot); (3) API da Vercel (projeto `singu-v2`, log de build); (4) `curl` GET nos dois domínios de produção públicos. Nada foi instalado; `node_modules` não existe localmente.
> Log de CI usado como referência: run **808** (`38151080331`, commit `8771a52`, main, verde), job `114504496404` — linhas citadas como `log808:N` (cópia do log baixada localmente pelo auditor, não versionada).
> Token Supabase vazado é mostrado **redigido** (`sbp_5bf0…`).

---

## CI — jobs e gates (prometido × real)

### Workflows existentes em `main`
Confirmado via API (`contents/.github/workflows` = 3 arquivos): `ci.yml`, `monitoring-lint.yml`, `rls-exposure-guard.yml`. O Actions ainda lista 2 workflows que **não** estão em `main`: `diag-db.yml` ("temporário, somente leitura", id 375878329, ativo) e `restore-drill.yml` ("Teste de restauração lógica", id 381396022, só no PR #97 aberto). Há ainda o check externo **"Supabase Preview"** (app GitHub do Supabase, integração de Branching do projeto `pgxfvjmuubtbowutlide`).

### `ci.yml` — job único `build-and-test` (gatilho: push/PR em `main`, `ci.yml:3-7`)

| # | Step | Linha | Secrets | Condição | Run 808 | Veredito |
|---|---|---|---|---|---|---|
| 1 | checkout@v4 | 13 | — | — | ok | ✅ |
| 2 | setup-node@**v7**, Node **20** | 15-19 | — | — | ok | 🟨 v7 existe (passa), mas Node 20 está em EOL; Vercel builda com Node **24.x** (projeto Vercel `nodeVersion: 24.x`) → artefato de CI ≠ artefato de produção |
| 3 | `npm ci` | 21-22 | — | — | ok | ✅ (ignora `bun.lock`/`bun.lockb`) |
| 4 | commitlint do **título** do PR | 24-26 | — | só `pull_request` | skipped em push | 🟨 não valida commits; push direto (Lovable) passa sem convenção; **injeção de shell**: `echo "${{ github.event.pull_request.title }}"` interpolado; **reprova 100% dos PRs do Dependabot** (ver H-08) |
| 5 | depcruise `no-circular` | 28-29 | — | — | ok | ✅ ciclos bloqueiam; `no-orphans` é só `warn` (`.dependency-cruiser.cjs:12-13`) |
| 6 | CORS enforcer edge | 31-32 | — | — | ok | ✅ |
| 7 | `check:edge-imports` (esm.sh) | 34-35 | — | — | ok | ✅ (estava morto em auditoria anterior; hoje roda) |
| 8 | Validação de secrets obrigatórios | 37-58 | PGHOST, PGUSER, PGPASSWORD, PGDATABASE, RLS_USER_A/B/ADMIN, VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, TEST_USER_EMAIL, TEST_USER_PASSWORD | — | ok | ✅ falha explícita se faltar (gates não são mais pulados silenciosamente) |
| 9 | invalid-indexes guard (psql) | 60-67 | PG* | — | ok | ✅ (1 de 79 guards SQL de `scripts/migration/verify/`) |
| 10 | **Typecheck** `npx tsc --noEmit` | 69-70 | — | — | ok em **0,43 s, sem saída** (`log808:507-511`) | ⬛ **NO-OP**: `tsconfig.json:2` tem `"files": []` + `references` (`:3-10`); `tsc` sem `-b`/`-p` não checa nenhum arquivo. Mesmo se checasse: `strict/noImplicitAny/strictNullChecks=false` (`tsconfig.app.json:17-19`), `include: ["src"]` (`:32-34`) — edge functions, tests/ e e2e/ nunca tipados |
| 11 | ESLint 4× `--max-warnings=0` | 72-81 | — | — | ok | 🟨 real para `.ts/.tsx`; regras só se aplicam a `files: ["**/*.{ts,tsx}"]` (`eslint.config.js:12`) → `.js/.mjs/.cjs` de `scripts/` são lintados **sem regras** (ADR-021 "scripts 0/0" é vácuo para JS) |
| 12 | `npm audit --omit=dev --audit-level=high` | 83-84 | — | — | ok | 🟨 só high+; libs de teste estão em `dependencies` (`package.json:48,51-53,62,72,97`) e entram no escopo "prod" |
| 13 | Build | 86-90 | VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY | — | ok | ✅ (não injeta `VITE_SUPABASE_ANON_KEY`/`VITE_SUPABASE_PROJECT_ID`/`VITE_APP_VERSION`) |
| 14 | Playwright install (3 browsers) | 92-93 | — | — | ok | ✅ |
| 15 | Playwright E2E | 95-102 | VITE_*, TEST_USER_EMAIL→E2E_USER_EMAIL, TEST_USER_PASSWORD→E2E_USER_PASS | — | **98 testes: 69 passed, 29 skipped** (`log808:2276-2277`) | 🟨 roda contra **Supabase de produção** (`e2e/README.md:20`); `E2E_ALLOW_WRITES` nunca definido → todas as jornadas de escrita, inclusive as "3 jornadas críticas", são puladas (H-19) |
| 16 | Upload playwright-report (30 dias) | 104-110 | — | `always()` | ok | 🟨 artefato com trace/vídeo de sessão real em produção (`playwright.config.ts:13-15`) |
| 17 | Vitest + coverage | 113-114 | — | — | **85 arquivos / 5.556 testes passed** (`log808:6641-6642`); **cobertura 9,22% stmts/lines** (`log808:6650`) | 🟨 sem `coverage.thresholds` em `vitest.config.ts` (arquivo inteiro, 34 linhas) → cobertura não reprova nada |
| 18 | Matriz RLS `tests/rls/run.sh` | 116-126 | PG*, RLS_USER_* | — | 16 OK, 0 pulados, 0 falhas (`log808:8886`) | ✅ gate real; ⚠️ aplica migrations pendentes **dentro de transação no banco remoto com tráfego real** (`tests/rls/run.sh:6-7,30-43,52-58,64-65`); `SKIP:` vira só warning (`:68-70,80`) |
| 19 | RLS coverage SQL | 128-135 | PG* | — | "✔ RLS coverage 100% em public.*" (`log808:8901`) | ✅ |
| 20 | Bundle budget | 137-138 | — | — | entry **343,2 KB gz / limite 350** (98%) (`log808:8909`), total JS 2.471 KB gz (`:8919`) | ✅ real (`scripts/check-bundle-size.mjs:16-17`); sem budget de total |
| 21 | Lighthouse CI | 140-141 | — | — | ok **com best-practices 0,74 < 0,90** (`log808:8943`) | 🟨 todas as 7 asserções são `"warn"` (`lighthouserc.json:13-19`) → não bloqueia; audita só `/index.html` estático sem login (`:4`); relatório enviado a storage público (`:23`) |

Ausências estruturais em **todos** os workflows: nenhum `permissions:`, `concurrency:` ou `timeout-minutes:` (grep = 0 em `.github/workflows/*.yml`).

### `monitoring-lint.yml`
| Job | Linha | Veredito |
|---|---|---|
| promtool | 16-23 | ⬛ **quebrado desde a criação**: `docker run prom/prometheus` sem `--entrypoint promtool` (o amtool tem `--entrypoint`, `:31`). Log job `91988613821`: `prometheus: error: unexpected promtool`. **10 de 10 runs = failure** (2026-07-22 → 2026-08-04); não roda desde então (filtro de paths `:3-13`). |
| amtool | 25-32 | ✅ passa (valida sintaxe de config com placeholders `REPLACE_ME`) |
| runbook-coverage | 34-39 | ✅ passa, mas só olha `monitoring/prometheus/rules` (`scripts/monitoring/check-runbook-coverage.sh:6`) |
| secret-leak-scan | 41-48 | 🟨 só varre `scripts/migration/verify/exporter/` (`:47`) — não pega o PAT em 11 arquivos de `scripts/`/raiz |

### `rls-exposure-guard.yml`
Roda em PR que toca `supabase/migrations/**` ou `scripts/rls-matrix/**`, push em main, cron semanal seg 06:00 (`:57-68`). Usa `vars.SUPABASE_URL`/`vars.SUPABASE_ANON_KEY` + `secrets.TEST_USER_EMAIL/PASSWORD`. Últimos runs: success. Fraquezas: sem credenciais o perfil autenticado é pulado com `exit 0` (`:86-89`); erros HTTP/rede viram aviso, não falha (`scripts/rls-matrix/check-rls-baseline.mjs:37-38,57,69`); baseline cobre **38 tabelas** (`rls-baseline.json`) num schema com ~292 `CREATE TABLE` nas migrations.

### Check externo "Supabase Preview" (integração GitHub do Supabase, projeto `pgxfvjmuubtbowutlide`)
Falha em `main` com `Remote migration versions not found in local migrations directory.` — verificado por mim em `e616c20` (check 114526636943), `8771a52` (114504636966) e `aee336b` (113368004203); o coordenador reporta **8/8 últimos commits de main** com a mesma falha. Em PR (#95) o check é `skipped` ("not associated with any Supabase Branch"). Ou seja: a integração que "roda migrations no merge" **não aplica nada**; o `build-and-test` fica verde enquanto o deploy de schema automático está quebrado.

### Estado real do CI em `main`
Branch protection: **inexistente** (API `GET /branches/main/protection` → 404 "Branch not protected"; `GET /rules/branches/main` → `[]`). Dos 15 últimos runs concluídos de CI em main (2026-10-02→10-11), **9 falharam** (723, 732, 733, 734, 735, 747, 752, 760, 773) e 6 passaram — e o código foi para produção mesmo assim (ver Deploy).

### Gates prometidos em docs × realidade
| Promessa | Fonte | Real |
|---|---|---|
| Branch protection: PR obrigatório, 1 aprovação, checks obrigatórios (Lint, Typecheck, Testes, Build, Lighthouse), histórico linear | `CONTRIBUTING.md:44-52` | ❌ main sem proteção nem ruleset (API) |
| "TypeScript strict check (noEmit)" | `docs/SECURITY.md:79` | ❌ strict=false e tsc não checa arquivo algum |
| "TypeScript: 0 erros (tsgo --noEmit)" | `.lovable/plan.md:16`; `docs/qa/CERTIFICATION_10_10.md:13`; `docs/auditoria/06_REAUDITORIA_IMPLEMENTACAO_20261002.md:14` | 📄 "0 erros" de um comando que não checa nada; `tsgo` não está em `package.json` |
| Backend linter baseline no CI (ratchet) | `docs/adr/ADR-022-backend-linter-baseline-ratchet.md:83-84`; `CERTIFICATION_10_10.md:23,41-44` | 📜 script existe, nenhum workflow chama; ele próprio se diz "opcional — não bloqueante" (`scripts/check-backend-linter-baseline.mjs:12`) e sai 0 sem stdin (`:20-23`); teto = 12 (`:17`) ≠ 46 do ADR |
| ESLint 0/0 em `scripts/**` | `ADR-021:40-47` | 🟨 só `.ts`; `.js/.mjs/.cjs` sem regras |
| "CI exige promtool/amtool válidos e cobertura de runbook" | `docs/adr/019-external-observability-alerting.md:24` | ⬛ promtool vermelho 10/10, workflow não é required |
| "Cobertura E2E smoke — 3 jornadas críticas ✅" | `CERTIFICATION_10_10.md:24` | 📄 as 3 são puladas em todo run (`e2e/smoke.spec.ts:25-26`) |
| Lighthouse com budgets | `CHANGELOG.md:88`; `docs/TECH_DEBT.md:12`; `CONTRIBUTING.md:50` | 🟨 só `warn`; 0,74 passa |
| Bundle ≤350 KB entry / ≤500 KB chunk "CI enforça" | `.lovable/plan.md:21` | ✅ real |
| RLS 100% em `public.*` | `.lovable/plan.md:19`; README `:129` | ✅ real (gate verde no run 808) |
| "Testes de segurança automatizados (`security-hardening.test.ts`)" | `docs/SECURITY.md:80` | 📄 arquivo não existe (find = 0) |
| Cobertura > 70% em lógica core | `audit_report.md:52` (Backlog) / `docs/audit_report.md:52` ("Concluído… 10/10") | ❌ 9,22% e sem piso; a cópia em `docs/` é 📄 |
| Hierarquia de providers "protegida por script de lint" | `src/pages/AdminKnowledgeExport.tsx:56`; `HANDOFF.md:136` | 📜 `scripts/lint-providers.cjs` nunca executado |
| `npm run test` "4.470 testes" | `README.md:151` | 📄 CI mede 5.556 (run 808); `.lovable/plan.md:17` diz 5.416 |

---

## Testes — inventário, skips, fora do CI

### Inventário por tipo (HEAD)
| Tipo | Arquivos | Casos | Runner | Roda no CI? |
|---|---|---|---|---|
| Vitest `src/**` | 86 (65 em `__tests__`, 21 colocalizados) | — | `vitest.config.ts:19-24` | ✅ |
| Vitest `tests/{integration,security,stress}` | 5 (2+1+2) | — | idem | ✅ |
| **Total Vitest** | **91** (85 no run 808 + 6 novos em `e616c20`) | 1.821 blocos estáticos `it/test`; **5.556 executados** (run 808) | | ✅ |
| Playwright `e2e/` (×3 browsers) | 4 specs + 2 helpers | 11 `test()` | `playwright.config.ts:18-32` | ✅ (maioria pulada) |
| Playwright `tests/` raiz + `tests/e2e/` (chromium) | 10 (incl. `tests/contacts-e2e.test.ts`) | — | `playwright.config.ts:33-37` | ✅ |
| **Total Playwright** | **14** | **98 execuções: 69 ok / 29 pulados** (`log808:2276-2277`) | | 🟨 |
| SQL RLS `tests/rls/*.sql` | 20 fixtures (16 no run 808 + 4 novas) | — | `tests/rls/run.sh:46` | ✅ |
| `node --test` `tests/rls/prepare-sql.node-test.mjs` | 1 | 14 | `run.sh:21` | ✅ |
| **Deno `Deno.test`** em `supabase/functions` | **16** | **90** | nenhum | ⬛ nunca (grep `deno test` em `.github`/`package.json`/`scripts` = 0) |
| **k6** `tests/load/*.js` | **4** | — | nenhum | 📜 nunca |
| `node --test` `scripts/check-edge-cors.test.mjs` | 1 | 10 | só comentário (`:5`) | 📜 nunca |
| SQL `supabase/tests/get_contact_sidebar_by_phone.sql` | 1 | — | manual (`:3-4`) | 📜 nunca |
| Cenários de postura de banco `scripts/migration/verify/tests/scenarios/*.sh` | 21 + `run-all.sh` | — | docker local (`run-all.sh:22,32`) | 📜 nunca |
| a11y (vitest-axe) | 1 (`src/test/a11y/critical-components.test.tsx`) | 4 | vitest | ✅ (único gate a11y) |

### Skips / only / todo / asserções vazias
- Estáticos incondicionais (`it.skip`, `describe.skip`, `test.skip(true)` fora de condição, `.only`, `.todo`, `xit`, `xdescribe`): **0**. `expect(true)`/`expect(1)`: **0**.
- Skips condicionais em runtime (Playwright):
  - `e2e/support/auth.ts:7` (sem credenciais) e `:11-14` **`requireWritableEnvironment()` → pula se `E2E_ALLOW_WRITES !== '1'`**; o CI nunca define (`e2e/README.md:20`). Usado em `e2e/smoke.spec.ts:26` (describe inteiro = as 3 jornadas críticas ×3 browsers), `e2e/contacts-rapport.spec.ts:20,59`, `tests/contacts-e2e.test.ts:33`, `tests/contacts-rapport.spec.ts:15`, `tests/contatos-excelencia.spec.ts:15,91,104`, `tests/e2e/contacts.spec.ts:17`.
  - Dependentes de massa de dados do usuário E2E: `e2e/support/contacts.ts:12`, `e2e/contacts-rapport.spec.ts:50`, `tests/e2e/contacts.spec.ts:62`.
  - `e2e/gap-modules-smoke.spec.ts:82` pula o Ask CRM se o botão não estiver visível; o teste chama-se "envia pergunta" mas só verifica o input (`:79-88`). LP pública só assere `body` visível (`:91-97`).
- `SKIP:` em fixtures RLS vira warning, não falha (`tests/rls/run.sh:68-70,80`): `ai_gateway_health_mttr.sql:38`, `ai_gateway_metrics_least_privilege.sql:76`.

### Testes que não testam produção
- **Testes-espelho** (reimplementam a lógica, 0 imports de produção): `src/test/telemetry/telemetry-helpers.test.ts` (60 casos; comentário `:10`), `telemetry-data-integrity.test.ts` (46), `external-data-telemetry.test.ts` (53), `telemetry-charts.test.ts` (20), `src/test/company-filters-audit.test.ts` (66), `src/__tests__/integration/resilience-patterns.test.ts` (9), `src/__tests__/integration/data-validation.test.ts` (19) → **7 arquivos / 273 casos**.
- **Testes-grep** (`readFileSync` + `toContain` no fonte): `ui-improvements-verification.test.ts` (195, `:7`), `validate-dashboard-improvements.test.ts` (71, `:7`), `design-system-audit.test.ts` (37, `:59`), `e2e-regression-suite.test.ts` (36, `:11` — "E2E" sem browser), `architecture-compliance.test.ts` (16, `:26`; `MAX_COMPONENT_LINES = 1200` em `:39` vs "400" em `ARCHITECTURE.md:95` e `docs/ARCHITECTURE.md:97`), `performance-and-a11y.test.ts` (14, `:6`) → **6 arquivos / 369 casos**.

### Fora do CI / ambiente de teste
- Não há ambiente de teste descartável: E2E usa o Supabase de produção (`e2e/README.md:20`); a matriz RLS roda no banco remoto com tráfego (`tests/rls/run.sh:6-7`). Supabase Branching não cria branches para PRs (check "Supabase Preview" `skipped` no PR #95).
- Testes de carga: `docs/LOAD_TESTING.md:66` manda registrar em `docs/load-results/` — diretório **não existe**; `.lovable/memory/migration/completion-13-10.md:34` afirma "k6 run tests/load/pool-saturation.js — thresholds verdes" sem evidência; `docs/dr-drills/README.md` (tabela Q4) "Load test 2× pico via k6 — _agendar_".

---

## Deploy (front, edge functions, migrations)

### Front-end — **dois** produtos em produção, divergentes
1. **Vercel** (projeto `singu-v2`, team `juca1`, framework vite, Node 24.x; domínios `singu-v2.vercel.app`, `singu-v2-juca1.vercel.app`, `singu-v2-git-main-juca1.vercel.app`; sem domínio próprio). Deploy via **Git integration** da Vercel (`vercel[bot]` cria Deployments no GitHub). Build = `npm install` + `npm run build` (log de build `bld_oej1uu7xw`), **sem testes nem typecheck**. Headers de `vercel.json:4-22` aplicados (confirmado por `curl`: XFO DENY, CSP mínima `frame-ancestors 'none'; object-src 'none'; base-uri 'self'`, HSTS).
   - **Não espera o CI**: Deployment `6998928802` (Production, `e616c20`) `success` às 17:12:18Z; o check `build-and-test` do mesmo SHA só concluiu às 17:27:59Z. Deployment `6914125967` (Production, `ef7eea3`, 2026-10-07) foi ao ar com CI **failure** (run `37645660580`).
2. **Lovable** — `https://dialogue-diamond.lovable.app/` (declarado canônico em `index.html:15`) responde 200 com **outro build** (`index-B_7YK83L.js` vs Vercel `index-DrxlEbV3.js`), faz `preconnect` para **`rqodmqosrotmtrjnnjul.supabase.co`** (projeto antigo/Lovable Cloud), não tem meta CSP e não envia CSP/X-Frame-Options (`curl -D`). Docs operacionais ainda tratam Lovable Cloud como produção: `HANDOFF.md:23`, `docs/RUNBOOK.md:369,388,675`, `docs/HOTFIX_PROCEDURE.md:13`, `docs/DISASTER_RECOVERY.md:56-60`, `docs/ONBOARDING.md:32,72,119`.

### Edge Functions — sem pipeline
- Único mecanismo: `scripts/migration/functions/deploy-all.sh` (manual, exige `supabase` CLI logada e `DEST_REF`, `:1-12`); nenhuma ocorrência de `functions deploy` em `.github/` (grep = 0).
- Política `verify_jwt` vive só numa lista hard-coded no script (`deploy-all.sh:65-76`, 37 funções); `supabase/config.toml` tem apenas `project_id = "hjhthvzwtvwgdrochcam"` (`:1`) — ref antigo, ≠ projeto linkado `pgxfvjmuubtbowutlide` (`supabase/.temp/linked-project.json:1`, arquivo de estado da CLI **versionado**). Um `supabase functions deploy X` avulso usa o default e pode inverter o `verify_jwt` de webhooks públicos.
- Dependências das functions sem lock: 96 imports `npm:@supabase/supabase-js@2` (major flutuante), sem `deno.json`/`import_map`/`deno.lock`.
- Paridade repo × produção: **NÃO VERIFICADO** (sem acesso ao Supabase do projeto).

### Migrations — sem deploy automatizado funcional
- Nenhum `supabase db push`/`migration up` em workflows/scripts (grep = 0).
- A integração GitHub do Supabase (que deveria rodar migrations no merge) **falha em todo commit de main**: "Remote migration versions not found in local migrations directory." (check "Supabase Preview"; 3 SHAs verificados por mim, 8/8 segundo o coordenador) → existe histórico de migrations no banco remoto que não está no repo (drift).
- Na prática as migrations são aplicadas fora do Git **antes** do merge: no run 808 o ledger remoto já estava em `20261011120100` e o gate aplicou "0 pendentes" (`log808:8869`). Aplicadores manuais com PAT embutido existem em `scripts/apply-*.js` (ver Scripts).
- O CI apenas **testa** migrations pendentes dentro de transação revertida no banco remoto (`tests/rls/run.sh:30-43,56-58`).

### DR
- `restore-drill.yml` existe só no PR #97 (runs 1 e 2 failure, 3 success, 4 em andamento); não está em main. Protocolo mensal de restore (`docs/dr-drills/README.md`, "Protocolo de Verificação de Backup (Mensal)") exige `docs/dr-drills/AAAA-MM-restore.md` — **nenhum** existe (só `2026-Q2.md`); os 4 game days estão `_agendar_`.

---

## Observabilidade (Prometheus/Alertmanager/SLO)

| Item | Evidência | Estado |
|---|---|---|
| Regras Prometheus | `monitoring/prometheus/rules/db-guards.yml` (5 alertas + 3 recording), `slo-burn-rate.yml` (2 alertas + 4 recording) | 📜 sem runtime |
| Regras fora de `monitoring/` | `scripts/monitoring/rpc-perf-alerts.yml` (8 alertas), `ai-gateway-partitions-alerts.yml` (5) — header manda instalar em `/etc/prometheus/rules` | 📜 não validadas por promtool (glob só `monitoring/prometheus/rules`, `monitoring-lint.yml:23`) e sem `runbook_url` |
| Scrape config | nenhum `prometheus.yml` no repo | ❌ |
| Runtime (container/k8s/compose/systemd/cron) | `find` por Dockerfile, docker-compose, `*.tf`, `*.service`, crontab = 0; containers Prom só como lint efêmero (`monitoring-lint.yml:22,31`) | ❌ |
| Exporters | `scripts/migration/verify/exporter/full-audit-exporter.sh`, `scripts/monitoring/{rpc-perf,rpc-plan,ai-gateway-partitions}-exporter.sh` — nenhuma invocação (grep só em docs/cenários); instalação = cron manual em host com node_exporter (`exporter/README.md:8-16`) | 📜 |
| `full-audit.sh` (66 guards) | não chamado por CI/cron; CI roda 2 de 79 SQL guards (`ci.yml:67,135`) | 📜 |
| Alertmanager receivers | `alertmanager.yml:31,38` Slack `REPLACE_ME`; `:44` PagerDuty `REPLACE_ME_PD_INTEGRATION_KEY` | 📜 nenhum canal real |
| `runbook_url` | aponta para `https://github.com/lovable/repo/...` (repo inexistente/errado) — `db-guards.yml:16,27,41,52,63`; `slo-burn-rate.yml:29,44` | ⬛ links quebrados |
| SLO 99,5% "monitorado em /admin/error-budget" | `.lovable/plan.md:20`; memória `error-budget-dashboard.md:7-8` exige crons `system-health-snapshot-5min` e `system-health-snapshots-cleanup` | 🟨 os dois crons **não estão** entre os 19 jobs `cron.schedule` versionados nas 447 migrations; alertas de budget só gravam em `system_alerts` (sem envio externo). Runtime **NÃO VERIFICADO** |
| Uptime externo | `docs/DISASTER_RECOVERY.md:56` cita UptimeRobot | ❓ sem configuração versionada; nenhum workflow agendado bate em `/health` |
| Error reporting front | `src/lib/errorReporting.ts:113-115,198-201` exige `VITE_SUPABASE_ANON_KEY`; bundle de produção Vercel contém a chave → **funciona na Vercel**; build do Lovable usa versão antiga (grava em `localStorage`) | 🟨 |
| Web Vitals | `src/hooks/useWebVitals.ts:35-40` só `sessionStorage`; só estouro de limiar vira `captureError` (`:44-55`) | 🟨 sem RUM agregado (README `:143` diz "monitorados") |
| ADR-019 "Encerra loop detecção → resposta; MTTA/MTTR mensuráveis" | `docs/adr/019-external-observability-alerting.md:26` | 📄 |

Conclusão: Prometheus/Alertmanager é **configuração versionada sem runtime** — nenhuma série é coletada, nenhum alerta pode disparar, nenhum receiver existe.

---

## PWA

| Item | Evidência | Estado |
|---|---|---|
| Plugin | `vite-plugin-pwa` 0.21.2 (`package.json:128`), só em `mode === "production"` (`vite.config.ts:24`), `generateSW` implícito, `registerType: "autoUpdate"` (`:26`) | 🟨 |
| **Ícones** | `public/pwa-192x192.png`, `pwa-512x512.png`, `apple-touch-icon.png` são **texto base64** (`file` → "ASCII text"; decodificados são PNG 192/512/176 px). Em produção são servidos como `image/png` com 1.324 B de texto (curl Vercel e Lovable) | ⬛ ícones inválidos → instalação/ícone quebrados; Workbox ainda os pré-cacheia (`vite.config.ts:58`) |
| `mask-icon.svg` | listado em `includeAssets` (`vite.config.ts:27`), ausente em `public/` | ⬛ |
| Manifest | `purpose: "any maskable"` no mesmo ícone (`:50-54`), `orientation: "portrait"` (`:35`) para CRM desktop, manifest servido com `"lang":"en"` | 🟨 |
| Registro do SW | `src/main.tsx:16-26` documenta `registerType "prompt"` + `injectManifest` + `src/sw.ts` — **nenhum existe** (vite usa autoUpdate/generateSW; `src/sw.ts` ausente); `main.tsx:103-104` faz `import(/* @vite-ignore */ "virtual:pwa-register")` por variável (não resolvível no browser; cai no `catch`); o plugin injeta `registerSW.js` sozinho | ⬛ contrato documentado ≠ código |
| Banner de update | `UpdateAvailable` escuta `controllerchange` (`src/components/pwa/NotificationAndMisc.tsx:18`), não o evento `pwa:update-available` exigido em `main.tsx:112-122` | 🟨 |
| **Web Push** | `src/lib/pushNotifications.ts:30` registra `/sw-push.js` no escopo `/` (o que `main.tsx:35-84` desregistra a cada load); `VAPID_PUBLIC_KEY` placeholder hard-coded (`:4-6`); `supabase/functions/send-push-notification/index.ts:32-52` envia JSON em texto plano com `Content-Encoding: aes128gcm` sem criptografia nem cabeçalho VAPID | ⬛ push não funciona ponta a ponta |
| Offline | `runtimeCaching: []` intencional por PII (`vite.config.ts:60-64`); sem persistência/fila (grep `persistQueryClient`/IndexedDB = 0); só `OfflineIndicator` | 🟨 shell abre offline, dados não. `docs/COMPLETE_SYSTEM_ANALYSIS.md:888` "PWA completo com suporte offline" = 📄; `docs/PRODUCT_DESIGN_STRATEGY_ANALYSIS_V6.md:831` "[ ] Implementar offline handling" = ❌ |
| Cache headers SW | `vercel.json:19-22` `no-cache` p/ `sw.js`, `registerSW.js`, manifest | ✅ |

---

## Env vars (código × `.env.example`)

`.env.example` declara só 3 variáveis (`:11,15,18`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`.

| Variável (front, `import.meta.env`) | Uso | No `.env.example`? | No build do CI? |
|---|---|---|---|
| `VITE_SUPABASE_URL` | 11× | ✅ | ✅ (`ci.yml:89`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | 9× | ✅ | ✅ (`ci.yml:90`) |
| `VITE_SUPABASE_PROJECT_ID` | `McpInstructionsCard.tsx:7`, `IncomingWebhookCard.tsx:23`, `PixelSetupCard.tsx:12` | ✅ | ❌ |
| **`VITE_SUPABASE_ANON_KEY`** | `src/lib/errorReporting.ts:114,200` (sem ela o reporte de erros retorna em silêncio, `:115`) | ❌ | ❌ |
| **`VITE_APP_VERSION`** | `src/lib/errorReporting.ts:98` | ❌ | ❌ |

Edge Functions (`Deno.env.get`, 30 nomes literais + leitura dinâmica em `_shared/auth.ts:305`) × `scripts/migration/functions/secrets.template.env`:
- **Faltando no template**: `EVOLUTION_API_SECRET` (`evolution-webhook/index.ts:20`), `LUX_WEBHOOK_SECRET` (`lux-webhook/index.ts:18`), `BITRIX24_WEBHOOK_SECRET` (`bitrix24-webhook/index.ts:40`) — sem eles a função responde 500 "Server misconfigured" (`_shared/auth.ts:305-309`). O `preflight-secrets.sh` não detecta: só procura `Deno.env.get("LITERAL")` em `*/index.ts` (`:16-18`). Também não roda em CI.
- `VITE_SUPABASE_URL/PUBLISHABLE_KEY` usados via Deno só nos testes Deno (ex.: `health/index.test.ts:4-5`) — ok.
- Variáveis de teste/CI (E2E_*, PG*, RLS_USER_*) documentadas apenas em `e2e/README.md:15-20` e `README.md:159`.
- Três project refs Supabase coexistem: `hjhthvzwtvwgdrochcam` (`supabase/config.toml:1`; cron `supabase/migrations/20260512105729_…sql:10`), `rqodmqosrotmtrjnnjul` (cron `validation-queue-drain` com anon JWT desse projeto em `supabase/migrations/20260417120721_…sql:16-20`; `public/_headers:7`; build Lovable) e `pgxfvjmuubtbowutlide` (canônico: `index.html:9,18`, `vite.config.ts:19`, bundle Vercel).
- CSP × chamadas reais: `index.html:9` (`connect-src`) não inclui `https://ipapi.co` (`src/hooks/useIPValidation.ts:16`, usado em `Security.tsx` via `IPRestrictionManager`) nem `https://api.pwnedpasswords.com` (`src/hooks/usePasswordBreachCheck.tsx:27`, hook órfão que, bloqueado, devolve "0 vazamentos" — `:29,37-39`). `script-src 'unsafe-inline'` presente. `public/_headers` (formato Netlify/Cloudflare) é ignorado pela Vercel e pelo domínio Lovable, e ainda aponta para o projeto errado.

---

## Scripts órfãos / lixo no repo

`scripts/` tem 236 arquivos, 111 executáveis (`.sh/.js/.mjs/.cjs/.py/.ts`). Executados pelo CI: **5** (`check-bundle-size.mjs`, `check-edge-cors.mjs`, `check-edge-imports.mjs`, `monitoring/check-runbook-coverage.sh`, `rls-matrix/check-rls-baseline.mjs`) + 2 SQL (`invalid-indexes-guard.sql`, `rls-coverage.sql`).

| Grupo | Arquivos | Referências | Observação |
|---|---|---|---|
| **Aplicadores de DDL com PAT Supabase hard-coded** | `scripts/apply-all.js:5`, `apply-functions.js:5`, `apply-migrations.js:5`, `apply-missing.js:5`, `apply-remaining.js:5`, `apply-rls.js:5`, `apply-triggers-views.js:5`, `chunk-apply.js:5`, `fix-enums.js:4`, `retry-failed.js:5` (`const PAT = 'sbp_5bf0…'`, mesmo token, `REF = pgxfvjmuubtbowutlide`) | 0 | 📜 executam SQL via Management API; versionados desde `c9b22b5` (2026-08-04) |
| **`tmp_view_check.js`** (raiz) | `:2` mesmo PAT | 0 | ⬛ usa `require` em pacote `"type": "module"` (`package.json:5`) → nem executa; só vaza o token |
| Geradores de doc | `generate_data_dictionary.py`, `generate_er_diagram.py`, `generate_real_dict.py`, `generate_real_er.py`, `run_explain_analyze.py`, `gen-supabase-types.mjs`, `diff-tables.mjs` | 0 | 📜 docs geradas congeladas |
| SQL avulsos | `check_unified_comm.sql`, `drop_unified_comm.sql`, `explain-top-queries.sql`, `get_unified_def.sql`, `recreate_data_health_view.sql`, `recreate_unified_comm.sql`, `test_unified_comm.sql`, `test_unified_comm2.sql` | 0 | 📜 |
| Teste sem runner | `scripts/check-edge-cors.test.mjs` | 0 | 📜 |
| Lint de providers | `scripts/lint-providers.cjs` | só docs | 📜 |
| Backend linter ratchet | `scripts/check-backend-linter-baseline.mjs` | só docs/memória | 📜 |
| Cenários de verificação | 21 `scripts/migration/verify/tests/scenarios/*.sh` + `scripts/migration/cdc/dry-run.sh` | 0 por nome (runner `run-all.sh` só citado em docs) | 📜 |
| Runbooks de migração | ~60 scripts em `scripts/migration/**` | só em `docs/MIGRATION_*` | procedimento manual |
| Workflow temporário | `diag-db.yml` ativo no Actions, ausente de main | — | ⬛ resíduo |
| Backup de tipos | `src/integrations/supabase/types.ts.lovable.bak` (470 KB) | — | ⬛ |
| Estado da CLI Supabase | `supabase/.temp/linked-project.json` versionado (`.gitignore` não cobre) | — | 🟨 |
| Saída do graphify | `graphify-out/` 19 MB (`graph.json` 17,7 MB) regenerado em quase todo commit; scripts `graphify:*` (`package.json:10-12`) dependem de CLI externo não declarado (`docs/GRAPHIFY.md:11`) | — | 🟨 churn |
| Lockfiles | `package-lock.json` + `bun.lock` + `bun.lockb` (CI e Vercel usam npm) | — | 🟨 |
| `public/_headers` | CSP de outro projeto, ignorado pelos hosts | — | ⬛ |

Outros vazamentos: `docs/TECH_DEBT.md:31`, `docs/HARDENING_FINAL_10_10.md:101`, `docs/HARDENING_PHASE3_FINAL.md:68` registram PAT GitHub `ghp_f9Hr…` "a revogar" — status **NÃO VERIFICADO**. GitHub **secret scanning desativado** no repositório (API: "Secret scanning is disabled on this repository").

---

## Lacunas detalhadas

| ID | Garantia/feature | Status | Evidência (arquivo:linha) | O que falta | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|
| H-01 | Typecheck no CI | 📄 DOC FALSO | `ci.yml:69-70`; `tsconfig.json:2-10`; `log808:507-511` (0,43 s); `tsconfig.app.json:17-19,32-34`; docs `SECURITY.md:79`, `plan.md:16`, `CERTIFICATION_10_10.md:13` | `tsc -p tsconfig.app.json --noEmit` (ou `tsc -b`), corrigir backlog, depois strict progressivo e cobrir `supabase/functions` (`deno check`) | Erros de tipo chegam à produção sem nenhuma barreira, apesar de docs dizerem "0 erros" | M |
| H-02 | Branch protection / checks obrigatórios | 📄 DOC FALSO | `CONTRIBUTING.md:44-52` × API protection 404 + rulesets `[]`; 9/15 runs de main vermelhos | Proteger `main`: PR + required checks (`build-and-test`, `rls-baseline`) + aprovação | Qualquer push (humano, Lovable ou bot) entra em main e vai para produção com CI vermelho | P |
| H-03 | Produção só após CI verde | ❌ NÃO INICIADO | Deploy Vercel `6998928802` 17:12:18Z × CI 17:27:59Z (`e616c20`); deploy `6914125967` com CI failure (`ef7eea3`); build Vercel só `npm run build` | Deployment Checks/"Ignored Build Step" na Vercel ou deploy por Actions condicionado ao CI | Código que reprova testes/RLS já esteve no ar | P |
| H-04 | Migrations aplicadas automaticamente no merge (integração Supabase) | ⬛ MORTO | Check "Supabase Preview" failure "Remote migration versions not found in local migrations directory" em `e616c20`, `8771a52`, `aee336b` (8/8 segundo coordenador); PR #95 `skipped` | `supabase migration repair`/reconciliar histórico remoto × `supabase/migrations`; reativar deploy no merge e preview branches | Schema de produção muda fora do Git, com drift já comprovado; rollback e auditoria inviáveis | M |
| H-05 | Pipeline de deploy de Edge Functions | ❌ NÃO INICIADO | `scripts/migration/functions/deploy-all.sh:1-12,65-76`; grep `functions deploy` em `.github` = 0; `supabase/config.toml:1` | Workflow `supabase functions deploy` pós-CI; `verify_jwt` declarado em `config.toml`; corrigir `project_id` | 108 functions publicadas à mão; risco de versão divergente do main e de webhook com JWT errado | M |
| H-06 | Lint de regras Prometheus (promtool) | ⬛ MORTO | `monitoring-lint.yml:22-23` (sem `--entrypoint`); job `91988613821` "unexpected promtool"; 10/10 runs failure | `--entrypoint promtool`; incluir `scripts/monitoring/*.yml`; tornar required | Regras de alerta nunca validadas; ADR-019 afirma o contrário | P |
| H-07 | Budgets de Lighthouse | 🟨 PARCIAL | `lighthouserc.json:4,13-19,23`; `log808:8943` (0,74 passa); `CHANGELOG.md:88`; `CONTRIBUTING.md:50` | Asserções `error`, URLs autenticadas, upload privado | Regressão de performance/boas práticas não bloqueia | P |
| H-08 | Atualizações do Dependabot passam por gates | 🟨 PARCIAL | Runs Dependabot 761/749/737/724 falham no step 5 (commitlint) e pulam todo o resto; PRs #79/#76 mergeados (main 734/732 failure); `.github/dependabot.yml` sem `commit-message` | Ajustar `commit-message`/regra `subject-case`; exigir CI verde antes do merge | Dependências entram em produção sem um único teste | P |
| H-09 | Hardening dos workflows | ❌ NÃO INICIADO | `ci.yml:26` (`${{ github.event.pull_request.title }}` no shell); grep `permissions:`/`concurrency:`/`timeout-minutes:` = 0 | Passar título via `env:`; `permissions: contents: read`; `concurrency`; timeouts | Título de PR malicioso executa código no runner que depois recebe PG*/credenciais | P |
| H-10 | ESLint 0/0 em `scripts/**` | 🟨 PARCIAL | `eslint.config.js:12` (só ts/tsx); `ADR-021:40-47`; PAT em 11 `.js` não flagrado | Bloco de config para `**/*.{js,mjs,cjs}` | Gate anunciado não protege JS de tooling (onde estão os segredos) | P |
| H-11 | Ratchet do backend linter (ADR-022) | 📜 ÓRFÃO | `scripts/check-backend-linter-baseline.mjs:12,17,20-23`; ADR-022:83-92; grep em `.github` = 0 | Step com `supabase db lint`/`inspect` + `SUPABASE_ACCESS_TOKEN`; unificar teto (12 × 46) | Novos SECURITY DEFINER/grants expostos não são barrados automaticamente | M |
| H-12 | Piso de cobertura | ❌ NÃO INICIADO | `vitest.config.ts` sem `coverage`; `log808:6650` (9,22%); `audit_report.md:52`; `docs/audit_report.md:52` (📄) | `coverage.thresholds` com ratchet e meta por domínio crítico | 91% do código sem execução em teste; regressões passam | G |
| H-13 | Runtime de CI = runtime de produção | 🟨 PARCIAL | `ci.yml:18` (Node 20, EOL) × Vercel `nodeVersion 24.x` | Node 24 no CI (ou `.nvmrc` + `engines`) | Build validado não é o build publicado | P |
| H-14 | Secret scanning + segredo vazado | ❌ NÃO INICIADO | API "Secret scanning is disabled"; PAT `sbp_5bf0…` em 11 arquivos (lista na seção Scripts) desde 2026-08-04; `monitoring-lint.yml:47` só varre exporter; `secrets-leak-scan.sh` sem padrão `sbp_`; `docs/SECURITY.md:44` (📄) | **Revogar o PAT**, remover arquivos/histórico, ativar secret scanning + push protection, gitleaks no CI | Token de Management API dá controle total do banco/projeto de produção a quem tiver acesso ao repo | P |
| H-15 | Alertas de vulnerabilidade de dependências | 🟨 PARCIAL | API vulnerability-alerts 404 / Dependabot alerts 403 "disabled"; `dependabot.yml:20-22` ignora todo major npm; edge functions fora (`npm:@supabase/supabase-js@2` ×96, sem lock) | Ativar alerts/security updates; política de majors; lock das functions | CVEs em deps não geram alerta nem PR | P |
| H-16 | SAST | ❌ NÃO INICIADO | `.github/` só 4 arquivos; sem CodeQL/semgrep | CodeQL JS/TS | Vulnerabilidades de código não detectadas | P |
| H-17 | Testes das Edge Functions no CI | ⬛ MORTO | 16 arquivos / 90 `Deno.test`; grep `deno test` = 0; reauditoria `06:19` cita 26 aprovados só local | Job `denoland/setup-deno` + `deno test`/`deno check`/`deno lint` | 108 functions (backend inteiro) sem teste executado em CI | M |
| H-18 | E2E das jornadas de escrita / "3 jornadas críticas" | 📄 DOC FALSO | `CERTIFICATION_10_10.md:24` × `e2e/smoke.spec.ts:25-26`, `e2e/support/auth.ts:10-15`, `e2e/README.md:20`; 29/98 pulados (`log808:2276`) | Ambiente descartável + `E2E_ALLOW_WRITES=1` | Criar contato, mover deal, concluir tarefa — fluxos que geram receita — nunca testados ponta a ponta | M |
| H-19 | Ambiente de teste isolado (E2E/RLS) | ❌ NÃO INICIADO | `e2e/README.md:20`; `tests/rls/run.sh:6-7,30-43,52-58,64-65`; Supabase Branching sem branches de PR | Projeto/branch de staging para CI | CI aplica DDL com locks no banco vivo a cada PR e usa usuário real de produção | M |
| H-20 | Testes que testam produção (espelho/grep) | 🟨 PARCIAL | 7 espelhos/273 casos; 6 grep/369 casos (arquivos:linhas na seção Testes) | Reescrever importando o código real | ~12% dos casos verdes não detectam regressão; contagem de testes infla a confiança | M |
| H-21 | Testes de carga | 📜 ÓRFÃO | `tests/load/*.js` (4); `docs/LOAD_TESTING.md:66` (`docs/load-results/` inexistente); `completion-13-10.md:34` (📄); `docs/dr-drills/README.md` Q4 `_agendar_` | Workflow manual/agendado contra staging + registro de resultados | Capacidade e SLO de latência nunca medidos | M |
| H-22 | Teste do enforcer de CORS | 📜 ÓRFÃO | `scripts/check-edge-cors.test.mjs:5` | `node --test` no CI | Gate de CORS pode quebrar silenciosamente | P |
| H-23 | Teste SQL do sidebar Zapp | 📜 ÓRFÃO | `supabase/tests/get_contact_sidebar_by_phone.sql:3-4`; `run.sh:46` só `tests/rls` | Incluir no runner RLS | RPC usada pelo Zapp sem regressão automática | P |
| H-24 | Suíte de postura de banco (cenários + full-audit 66 guards) | 📜 ÓRFÃO | `scripts/migration/verify/tests/run-all.sh:22,32`; 21 cenários; CI usa 2/79 guards (`ci.yml:67,135`) | Job com Postgres em docker + full-audit agendado contra produção (read-only) | 77 guards de saúde do banco nunca rodam | M |
| H-25 | Gate de acessibilidade | 🟨 PARCIAL | `src/test/a11y/critical-components.test.tsx` (4 casos); `lighthouserc.json:14` warn; `axe-core` em deps (`package.json:62`) sem uso em E2E | `@axe-core/playwright` nas rotas principais | WCAG AA declarado (ADR-011) sem verificação contínua | M |
| H-26 | Smokes de módulos com asserções fracas | 🟨 PARCIAL | `e2e/gap-modules-smoke.spec.ts:79-88,91-97` | Enviar a pergunta e checar resposta; LP com conteúdo | Ask CRM pode estar quebrado com CI verde | P |
| H-27 | Guard de exposição RLS robusto | 🟨 PARCIAL | `rls-exposure-guard.yml:86-89`; `check-rls-baseline.mjs:37-38,57,69`; baseline 38 tabelas | Falhar em erro HTTP e sem credencial; ampliar tabelas | Regressão de RLS em tabelas fora do baseline ou com erro passa | P |
| H-28 | Fixtures RLS com SKIP | 🟨 PARCIAL | `tests/rls/run.sh:68-70,80`; `ai_gateway_health_mttr.sql:38`; `ai_gateway_metrics_least_privilege.sql:76` | Tratar SKIP como falha em main | Teste de segurança pode virar no-op sem alarme | P |
| H-29 | Front único em produção | 🟨 PARCIAL | `dialogue-diamond.lovable.app` (build `index-B_7YK83L.js`, preconnect `rqodmqosrotmtrjnnjul`, sem CSP/XFO) × `singu-v2.vercel.app` (`pgxfvjmuubtbowutlide`); `index.html:15` canonical Lovable; runbooks em Lovable Cloud (`HANDOFF.md:23`, `RUNBOOK.md:675`, `HOTFIX_PROCEDURE.md:13`, `DISASTER_RECOVERY.md:56-60`) | Decidir canônico, desligar/redirecionar o outro, atualizar canonical e runbooks | Usuários podem operar num app ligado ao banco antigo; incidentes seguem runbook errado | M |
| H-30 | `public/_headers` | ⬛ MORTO | `public/_headers:1-7` (CSP p/ `rqodmqosrotmtrjnnjul`); ignorado (curl Vercel/Lovable) | Remover ou migrar para o host certo | Falsa sensação de headers aplicados; quebraria o app se fosse honrado | P |
| H-31 | Config do Supabase coerente | 🟨 PARCIAL | `supabase/config.toml:1` (`hjhthvzw…`) × `supabase/.temp/linked-project.json:1` (`pgxfvjmu…`, versionado) | Corrigir `project_id`, gitignore de `supabase/.temp` | CLI/integração podem mirar o projeto errado | P |
| H-32 | CSP coerente com o front | 🟨 PARCIAL | `index.html:9` × `useIPValidation.ts:16` (ipapi.co), `usePasswordBreachCheck.tsx:27` (fail-open `:37-39`); `vercel.json:12` | Ajustar `connect-src`; remover hook órfão ou falhar fechado | Tela de restrição de IP sem dados em produção | P |
| H-33 | Lockfile único | 🟨 PARCIAL | `package-lock.json`, `bun.lock`, `bun.lockb` | Manter só npm | Instalação local diverge da CI/produção | P |
| H-34 | Deps de teste fora de `dependencies` | 🟨 PARCIAL | `package.json:48,51-53,62,72,97` | Mover para devDependencies | `npm audit --omit=dev` e install de produção carregam libs de teste | P |
| H-35 | Prometheus/Alertmanager em runtime | 📜 ÓRFÃO | sem `prometheus.yml`/Dockerfile/compose/cron; `exporter/README.md:8-16`; `alertmanager.yml:31,38,44` (`REPLACE_ME`); ADR-019:26 (📄) | Hospedar Prom+AM (ou Grafana Cloud), agendar exporters, preencher receivers via secrets | Nenhuma métrica é coletada e nenhum alerta chega a alguém | G |
| H-36 | Regras de alerta fora de `monitoring/` e runbooks | 📜 ÓRFÃO | `scripts/monitoring/rpc-perf-alerts.yml` (8), `ai-gateway-partitions-alerts.yml` (5); `check-runbook-coverage.sh:6`; `runbook_url` → `github.com/lovable/repo` (`db-guards.yml:16,27,41,52,63`; `slo-burn-rate.yml:29,44`) | Mover para `monitoring/`, corrigir URLs, exigir runbook | Plantão receberia alerta com link quebrado | P |
| H-37 | SLO 99,5% / error budget operando | 🟨 PARCIAL | `.lovable/plan.md:20`; `error-budget-dashboard.md:7-8`; 19 `cron.schedule` versionados sem `system-health-snapshot-5min`/cleanup | Versionar os crons em migration; notificar fora do banco | Painel de SLO pode estar sem dados; estouro de budget não avisa ninguém | M |
| H-38 | Alerting externo / uptime | ❌ NÃO INICIADO | nenhum receiver real; `DISASTER_RECOVERY.md:56` (UptimeRobot sem config); nenhum workflow agendado de health | Probe externo em `/functions/v1/health` + canal de alerta | Queda só é descoberta por usuário | M |
| H-39 | RUM de Web Vitals | 🟨 PARCIAL | `useWebVitals.ts:35-40,44-55`; `README.md:143` | Enviar amostras agregadas | Sem visão de performance real dos usuários | P |
| H-40 | Ícones PWA válidos | ⬛ MORTO | `public/pwa-192x192.png`, `pwa-512x512.png`, `apple-touch-icon.png` = texto base64; servidos 1.324 B `image/png` em produção | Commitar PNG binário (180×180 p/ Apple) | App não instalável / ícone quebrado em celular | P |
| H-41 | `mask-icon.svg` | ⬛ MORTO | `vite.config.ts:27`; ausente em `public/` | Adicionar ou remover do `includeAssets` | Pin de aba Safari quebrado (baixo) | P |
| H-42 | Service Worker / Web Push | ⬛ MORTO | `main.tsx:16-26,103-104`; `src/sw.ts` inexistente; `vite.config.ts:26`; `pushNotifications.ts:4-6,30`; `send-push-notification/index.ts:32-52`; `NotificationAndMisc.tsx:18` | `injectManifest` com handlers de push, VAPID real (secret), lib web-push na function, banner no evento certo | Notificações push (alertas de churn, follow-up) nunca chegam | M |
| H-43 | Modo offline | 📄 DOC FALSO | `docs/COMPLETE_SYSTEM_ANALYSIS.md:888` × `vite.config.ts:64`, grep persistência = 0; `PRODUCT_DESIGN_STRATEGY_ANALYSIS_V6.md:831` "[ ]" | Definir escopo (leitura cacheada sem PII ou fila de escrita) | Vendedor em campo sem rede perde o app | G |
| H-44 | Manifest PWA correto | 🟨 PARCIAL | `vite.config.ts:35,50-54`; manifest servido `lang: "en"` | `lang: pt-BR`, sem `portrait` forçado, ícone maskable próprio | Instalação com orientação travada e idioma errado | P |
| H-45 | `.env.example` completo (front) | 🟨 PARCIAL | `.env.example:11-18` × `errorReporting.ts:98,114,200` | Declarar `VITE_SUPABASE_ANON_KEY`, `VITE_APP_VERSION` (ou unificar com PUBLISHABLE_KEY) | Ambientes novos ficam sem telemetria de erro sem perceber | P |
| H-46 | Secrets de webhook no template/preflight | 🟨 PARCIAL | `evolution-webhook/index.ts:20`, `lux-webhook/index.ts:18`, `bitrix24-webhook/index.ts:40` × `secrets.template.env`; `preflight-secrets.sh:16-18` | Incluir no template; preflight cobrindo `_shared` e chamadas dinâmicas; rodar no CI | Webhooks de WhatsApp/Bitrix/Lux respondem 500 em ambiente recém-provisionado | P |
| H-47 | Um único projeto Supabase referenciado | 🟨 PARCIAL | `config.toml:1`; `20260512105729_…sql:10`; `20260417120721_…sql:16-20`; `public/_headers:7` | Reescrever crons/configs para o canônico | Jobs agendados podem bater em projeto antigo | M |
| H-48 | Aplicadores `apply-*.js` etc. | 📜 ÓRFÃO | `scripts/apply-*.js:5`, `chunk-apply.js:5`, `fix-enums.js:4`, `retry-failed.js:5` (0 referências) | Remover (após revogar PAT) | Ferramenta pronta para executar DDL em produção com credencial embutida | P |
| H-49 | `tmp_view_check.js` | ⬛ MORTO | `tmp_view_check.js:1-2`; `package.json:5` (`"type": "module"`) | Apagar | Só vaza o token | P |
| H-50 | Geradores de documentação | 📜 ÓRFÃO | 5 `.py` + `gen-supabase-types.mjs` + `diff-tables.mjs` + 8 `.sql` em `scripts/` (0 refs) | Rodar em CI ou remover | Dicionário/ER de dados desatualizados | P |
| H-51 | Lint da hierarquia de providers | 📄 DOC FALSO | `AdminKnowledgeExport.tsx:56`; `HANDOFF.md:136`; `scripts/lint-providers.cjs` sem execução | Step no CI | Quebra de ordem de providers não detectada | P |
| H-52 | Repo enxuto (artefatos gerados) | 🟨 PARCIAL | `graphify-out/` 19 MB versionado; `package.json:10-12`; `src/integrations/supabase/types.ts.lovable.bak` | Gitignore/artefato de CI; apagar `.bak` | Diffs ruidosos e clone pesado | P |
| H-53 | README/infra docs fiéis | 📄 DOC FALSO | `README.md:34` (Vite 5/TS 5.8 × `vite 6.4.3`), `:84` (PDF inexistente), `:105` (31 × 108 functions), `:108` (~50 × 447 migrations), `:151` (4.470 × 5.556 testes) | Atualizar | Onboarding e decisões baseados em números errados | P |
| H-54 | `docs/SECURITY.md` fiel | 📄 DOC FALSO | `:44` "nenhuma chave no código" (PAT em 11 arquivos), `:61` headers (Lovable sem headers), `:79` strict TS, `:80` `security-hardening.test.ts` inexistente | Corrigir e vincular a gates reais | Auditorias externas recebem afirmações falsas | P |
| H-55 | Restore drill automatizado | 🟨 PARCIAL | `restore-drill.yml` só no PR #97 (runs 1-2 failure, 3 success); `docs/dr-drills/README.md` (protocolo mensal sem nenhum `AAAA-MM-restore.md`; game days `_agendar_`) | Mergear, agendar, registrar evidência mensal | Backup nunca comprovado restaurável de forma recorrente | M |
| H-56 | Workflows temporários limpos | ⬛ MORTO | `diag-db.yml` ativo no Actions (id 375878329), ausente de main | Desabilitar/excluir | Superfície de execução esquecida | P |
| H-57 | Órfãos de módulo (depcruise) | 🟨 PARCIAL | `.dependency-cruiser.cjs:12-13` (`warn`); `docs/qa/findings.md:17` (101 órfãos, ação pendente) | Ratchet de órfãos | Código morto cresce sem freio | M |
| H-58 | Artefatos de CI sem PII | 🟨 PARCIAL | `ci.yml:104-110` (30 dias); `playwright.config.ts:13-15` (trace/vídeo) com sessão em produção | Reduzir retenção/mascarar | Dados de cliente expostos a quem lê o repo | P |

---

## Resumo numérico

- **Lacunas: 58** — ❌ NÃO INICIADO **8** (H-03, H-05, H-09, H-12, H-14, H-16, H-19, H-38) · 🟨 PARCIAL **25** · 📜 ÓRFÃO **9** (H-11, H-21, H-22, H-23, H-24, H-35, H-36, H-48, H-50) · 📄 DOC FALSO **7** (H-01, H-02, H-18, H-43, H-51, H-53, H-54) · ⬛ MORTO **9** (H-04, H-06, H-17, H-30, H-40, H-41, H-42, H-49, H-56). Esforço: P 37 · M 18 · G 3.
- CI: 3 workflows em main; `ci.yml` com 21 steps — **13 bloqueantes de verdade**, 1 no-op (typecheck), 1 só-aviso (Lighthouse), 1 condicional (commitlint), 5 auxiliares. `monitoring-lint`: **10/10 runs failure**. Main: **9 de 15** últimos runs de CI falharam; **0** proteção de branch/ruleset. Check "Supabase Preview" falhando em todo commit de main (3 verificados por mim; 8/8 segundo o coordenador).
- Deploy: front em **2** hosts de produção divergentes (Vercel → `pgxfvjmu…`; Lovable → `rqodmqos…`); **0** pipeline de Edge Functions; **0** pipeline de migrations funcional; produção publicada antes/independente do CI (**2** casos comprovados).
- Testes: 91 arquivos Vitest (5.556 testes no run 808, cobertura **9,22%**, sem piso); 14 arquivos Playwright (98 execuções, **29 puladas = 30%**); 20 fixtures RLS + 14 casos node:test; **nunca executados**: 16 arquivos/90 casos Deno, 4 scripts k6, 1 node:test (10 casos), 1 SQL, 21 cenários shell. **642 casos** (273 espelho + 369 grep) não exercitam código de produção. 0 skips/only/todo estáticos; 0 `expect(true)`.
- Scripts: 111 executáveis em `scripts/`, **5** executados pelo CI (+2 SQL guards de 79); **48** arquivos de `scripts/` com zero referência (10 aplicadores com PAT, 7 geradores, 8 SQL, 1 teste, 21 cenários + `cdc/dry-run.sh`) + `tmp_view_check.js`.
- Segredos: **1** PAT Supabase (Management API) em **11** arquivos versionados desde 2026-08-04; secret scanning **desligado**; Dependabot alerts **desligados**; nenhum SAST.
- Observabilidade: **20** regras de alerta (7 + 13), **0** carregadas em runtime, **0** receivers reais, **4** exporters sem execução, **7** `runbook_url` para repositório errado; crons do SLO não versionados.
- PWA: **3/3** ícones PNG corrompidos (texto base64) servidos em produção; `mask-icon.svg` ausente; Web Push não funcional; offline só app shell.
- Env: front usa **5** `VITE_*`, `.env.example` declara **3**; **3** secrets de webhook fora do template; **3** project refs Supabase distintos em uso.

## Top 10 lacunas de maior impacto

1. **H-14** — PAT da Management API do Supabase (`sbp_5bf0…`) versionado em 11 arquivos desde 2026-08-04, com secret scanning desativado → controle total do projeto de produção para quem lê o repo. Revogar já.
2. **H-03 + H-02** — `main` sem proteção e Vercel publicando produção sem esperar o CI (deploy de `ef7eea3` com CI vermelho; `e616c20` no ar 15 min antes do CI terminar).
3. **H-04** — Deploy automático de migrations (integração Supabase) quebrado em todo commit de main ("Remote migration versions not found…"): schema de produção é alterado fora do Git, com drift comprovado.
4. **H-01** — Gate de Typecheck é no-op (`tsconfig.json` com `files: []`; 0,43 s), e o projeto ainda tem `strict: false`; docs certificam "0 erros".
5. **H-29** — Dois fronts de produção: o domínio Lovable (canonical no `index.html`) serve build antigo apontando para o projeto Supabase antigo e sem headers de segurança; runbooks ainda descrevem Lovable Cloud.
6. **H-18 + H-19** — Sem ambiente de teste: E2E e RLS rodam contra produção; todas as jornadas de escrita (incl. as "3 críticas" certificadas) são puladas em 100% dos runs.
7. **H-35 + H-38** — Observabilidade só no papel: Prometheus/Alertmanager sem runtime, receivers `REPLACE_ME`, nenhum probe de uptime/alerta externo.
8. **H-05 + H-17** — 108 Edge Functions sem pipeline de deploy (script manual com `verify_jwt` hard-coded) e 90 testes Deno nunca executados.
9. **H-12** — Cobertura real 9,22% sem piso; meta de 70% marcada como "Concluída 10/10" em `docs/audit_report.md`.
10. **H-42 + H-40** — PWA: Web Push quebrado ponta a ponta (VAPID placeholder, payload sem criptografia, SW contraditório) e ícones corrompidos em produção (app não instalável).

(Próximos da linha de corte: H-08 Dependabot mergeado sem gates + alerts desligados; H-09 injeção de shell no título do PR; H-06 promtool vermelho desde a criação.)
