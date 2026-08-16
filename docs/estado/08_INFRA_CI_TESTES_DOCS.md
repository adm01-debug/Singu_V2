# Estado — Infraestrutura, CI, Testes e Documentação

> Auditoria estática do repositório `/home/user/singu-v2`.
> **NADA foi executado.** `node_modules` está vazio (0 entradas), não há Supabase CLI, não há acesso a runtime nem à conclusão de checks do GitHub.
> Todo veredito abaixo vem de leitura de arquivo com `arquivo:linha`. Onde não houve evidência, o item recebe 🟦 ou `NAO_VERIFICADO`.

---

## Resumo (contagem por classificação com denominador)

| Classificação | Itens | Denominador |
|---|---|---|
| ✅ IMPLEMENTADO_TOTAL | 6 | 34 |
| 🟨 IMPLEMENTADO_PARCIAL | 11 | 34 |
| 🟦 SUGERIDO_OU_INICIADO | 10 | 34 |
| ⬛ MORTO_OU_ABANDONADO | 7 | 34 |

**Números-âncora medidos nesta auditoria:**

| Medida | Valor | Como medi |
|---|---|---|
| Workflows de CI | 2 / 2 | `.github/workflows/` (ci.yml, monitoring-lint.yml) |
| Pipelines de **deploy** | **0** | busca por `deploy\|vercel\|netlify\|kubectl\|terraform\|docker push` em `.github/` e `package.json` → 0 ocorrências |
| Steps em ci.yml | 15 | ci.yml:13–113 |
| Steps realmente bloqueantes | 9 / 15 | ver tabela de gates |
| Steps condicionais a secret | 3 / 15 | ci.yml:35, ci.yml:84, ci.yml:97 |
| Steps decorativos | 2 / 15 | ci.yml:71–77, ci.yml:112–113 |
| Arquivos de teste | 100 | `find` por `*.{test,spec}.{ts,tsx,mjs}` |
| Casos de teste (estáticos) | 1.892 | blocos `it(`/`test(`/`Deno.test(` em início de linha |
| Arquivos cobertos por runner | **89 / 100** | globs de vitest.config.ts + playwright.config.ts |
| Casos cobertos por runner | **1.837 / 1.892** | idem |
| Arquivos **sem runner algum** | **11 / 100** | ver patologia #4 |
| Arquivos em `scripts/` | 233 | `find scripts -type f` |
| Scripts executáveis (`.sh/.mjs/.js/.cjs/.py/.ts`) | 110 / 233 | por extensão |
| Scripts invocados por package.json ou CI | **7 / 110** | grep de caminhos nos workflows + package.json |
| Scripts com **zero** referência no repo | **40 / 110** | grep de basename em todo o repo, excluindo o próprio arquivo |

---

## Gates de CI

### `ci.yml` — job único `build-and-test`

| # | Step | Bloqueante? | Condição | Veredito | Linha |
|---|---|---|---|---|---|
| 1 | `actions/checkout@v4` | Sim | — | ✅ real | ci.yml:13 |
| 2 | `Setup Node.js` (`actions/setup-node@v7`) | Sim | — | ⚠️ **versão suspeita** — ver risco R1 | ci.yml:16 |
| 3 | `npm ci` | Sim | — | ✅ real (mas ver risco R2: 3 lockfiles) | ci.yml:22 |
| 4 | `Validate PR Title (commitlint)` | Sim | `if: github.event_name == 'pull_request'` | 🟨 **condicional legítimo** — não roda em push para main | ci.yml:24–26 |
| 5 | `Check for circular dependencies` (depcruise) | **Sim** | — | ✅ bloqueante de verdade | ci.yml:28–29 |
| 6 | `Edge Function CORS scoped enforcer` | **Sim** | — | ✅ bloqueante de verdade | ci.yml:31–32 |
| 7 | `Invalid indexes guard (public.*)` | **Não** | `if: ${{ secrets.PGHOST != '' }}` | ❌ **gate fantasma** — ver risco R3 | ci.yml:34–42 |
| 8 | `Typecheck` (`npx tsc --noEmit`) | **Sim** | — | 🟨 bloqueante, **mas fraco**: `strict:false` em tsconfig.app.json:17 | ci.yml:44–45 |
| 9 | `Lint (ESLint)` — 4 invocações `--max-warnings=0` | **Sim** | — | ✅ bloqueante de verdade (o mais severo do arquivo) | ci.yml:47–56 |
| 10 | `Security audit` (`npm audit --omit=dev --audit-level=high`) | **Sim** | — | ✅ bloqueante de verdade | ci.yml:58–59 |
| 11 | `Install Playwright Browsers` | Sim | — | ✅ real | ci.yml:61–62 |
| 12 | `Run Playwright E2E Tests` | **Sim** | — | 🟨 bloqueante, **mas** só cobre `tests/` — o diretório `e2e/` na raiz não é alcançado (ver patologia #4) | ci.yml:64–69 |
| 13 | `Upload Playwright report` | **Não** | `if: always()` | 🟦 **decorativo** por desenho (artefato, não gate) | ci.yml:71–77 |
| 14 | `Run unit tests with coverage` | **Sim** | — | 🟨 bloqueante, mas **sem threshold de cobertura** — `--coverage` gera relatório e não reprova nada (vitest.config.ts não define `coverage.thresholds`) | ci.yml:80–81 |
| 15 | `Run RLS matrix tests` | **Não** | `if: ${{ secrets.PGHOST != '' }}` | ❌ **gate fantasma** | ci.yml:83–94 |
| 16 | `RLS coverage (public.* must have RLS + policy)` | **Não** | `if: ${{ secrets.PGHOST != '' }}` | ❌ **gate fantasma** | ci.yml:96–104 |
| 17 | `Build` (`npm run build`) | **Sim** | — | ✅ bloqueante de verdade | ci.yml:106–107 |
| 18 | `Check bundle size budget` | **Sim** | — | ✅ bloqueante de verdade | ci.yml:109–110 |
| 19 | `Lighthouse CI (performance budgets)` | **Não** | `\|\| echo "::warning::..."` | ❌ **decorativo** — o `\|\| echo` engole o exit code; além disso lighthouserc.json:13–19 usa `"warn"` em **todas** as 7 assertions, portanto nem o próprio LHCI reprova | ci.yml:112–113 |

### Riscos que anulam gates

**R1 — Versões de action possivelmente inexistentes (`NAO_VERIFICADO`).**
`actions/setup-node@v7` (ci.yml:16) e `actions/upload-artifact@v7` (ci.yml:72). Não tenho acesso ao GitHub Marketplace para confirmar que a major `v7` existe para essas duas actions. Se não existirem, o job falha no startup e **nenhum** gate roda — o CI vira um X vermelho permanente, não um portão. Note que `actions/checkout@v4` (ci.yml:13, e monitoring-lint.yml:19/28/37/44) usa uma major consistente com o ecossistema, o que torna o `v7` das outras duas anômalo dentro do próprio arquivo. `docs/auditoria/05_ACHADOS_TESTES_BUILD_DOCS.md:67` afirma independentemente "CI que falha no startup (versões de actions inexistentes)" — corrobora, mas continua sendo evidência documental, não execução.

**R2 — Três lockfiles concorrentes.**
`package-lock.json` (578 KB), `bun.lock` (388 KB) e `bun.lockb` (198 KB) coexistem na raiz. `npm ci` (ci.yml:22) usa apenas `package-lock.json`; qualquer fluxo local com Bun resolve por outro grafo. Divergência silenciosa entre o que a CI instala e o que o dev instala. ⬛ para os dois lockfiles Bun (nenhum caminho de CI os usa).

**R3 — `secrets` em `if:` de step: os 3 gates de banco não protegem nada.**
ci.yml:35, ci.yml:84 e ci.yml:97 usam `if: ${{ secrets.PGHOST != '' }}`. O contexto `secrets` **não** consta na lista de contextos disponíveis para `jobs.<job_id>.steps.if` na documentação do GitHub Actions (lá são permitidos `github`, `needs`, `strategy`, `matrix`, `job`, `runner`, `env`, `vars`, `steps`, `inputs`). Há dois desfechos possíveis e **não pude verificar qual ocorre** (`NAO_VERIFICADO`, sem acesso a CI real):
- (a) o workflow é rejeitado no parse com `Unrecognized named-value: 'secrets'` → **todo o ci.yml nunca executa**; ou
- (b) a expressão é tolerada e avaliada como vazia → os 3 steps são **silenciosamente pulados** e o CI fica verde.

Em ambos os desfechos o resultado prático é o mesmo: **o guard de índices inválidos, a matriz RLS (`tests/rls/run.sh`, 13 arquivos `.sql`) e o RLS-coverage nunca reprovam um PR.** Este é o gate mais importante do repositório em termos de segurança e é exatamente o que está desligado. Classificação: ⬛ MORTO_OU_ABANDONADO para os três.

### Existe pipeline de DEPLOY?

**Não existe pipeline de deploy. Com todas as letras: este repositório não tem nenhum mecanismo automatizado de publicação.**
Evidência negativa: busca por `deploy`, `vercel`, `netlify`, `fly.io`, `docker push`, `kubectl`, `helm`, `terraform` em `.github/` e `package.json` retorna **zero** ocorrências (o único match textual é `react-helmet-async` em package.json:80, falso positivo). Não há `Dockerfile`, `docker-compose*`, `*.tf`, `vercel.json` nem `netlify.toml` em lugar algum do repositório. Os dois workflows existentes (`ci.yml`, `monitoring-lint.yml`) terminam em verificação; nenhum publica artefato, imagem, função ou migration. As 109 Edge Functions e as 390 migrations não têm caminho automatizado até o ambiente — presumivelmente são aplicadas pela plataforma Lovable fora do Git (`HANDOFF.md:23` cita "Lovable Cloud"), o que fica **fora da observabilidade deste repositório** (`NAO_VERIFICADO`).

### Dois pipelines concorrendo pelo mesmo alvo?

**Não há concorrência de deploy** (não há deploy). Há, porém, **sobreposição parcial de escopo de lint** entre os dois workflows:

- `ci.yml:56` roda `npx eslint . --max-warnings=0`, que cobre o repositório inteiro — incluindo `monitoring/` e `scripts/monitoring/`.
- `monitoring-lint.yml:16–39` roda `promtool`/`amtool`/`check-runbook-coverage.sh` sobre os mesmos diretórios.

Não são redundantes (ESLint não valida sintaxe PromQL), mas disparam em gatilhos diferentes: `monitoring-lint.yml:2–13` filtra por `paths:`, enquanto `ci.yml:3–7` não filtra. Consequência: **um PR que só toca `monitoring/**` dispara `monitoring-lint` e também o `ci.yml` completo** (build, Playwright, npm audit) sem necessidade. Inversamente, `monitoring-lint.yml:3–8` tem `push:` **sem filtro de branch**, então roda em qualquer branch, enquanto `ci.yml:4–5` restringe a `main`. Assimetria não intencional. 🟨

---

## Estado dos testes

### Números com denominador

| Métrica | Valor |
|---|---|
| Arquivos de teste no repositório | **100** |
| Casos de teste estáticos (`it(`/`test(`/`Deno.test(`) | **1.892** |
| Arquivos cobertos por um runner configurado | **89 / 100 (89%)** |
| Casos cobertos por um runner configurado | **1.837 / 1.892 (97,1%)** |
| Arquivos **órfãos** (nenhum config os executa) | **11 / 100 (11%)** |
| Casos órfãos | **55 / 1.892 (2,9%)** |

Distribuição por runner:

| Runner | Origem do glob | Arquivos | Casos |
|---|---|---|---|
| Vitest — `src/**` | vitest.config.ts:20 | 74 | 1.785 |
| Vitest — `tests/{integration,security,stress}/**` | vitest.config.ts:21–23 | 5 | 10 |
| Playwright — `tests/` (raiz + `tests/e2e/`) | playwright.config.ts:4, testIgnore:6 | 10 | 42 |
| **Nenhum** | — | **11** | **55** |

> ⚠️ Os 1.892 são **blocos estáticos**. Vários arquivos usam `it.each`/laços, então o número de testes que um runner *reportaria* seria maior. Não sei qual é esse número porque **não executei o vitest**. Qualquer afirmação de tipo "N testes passando" neste repositório (README.md:149 diz 4.470) é indistinguível de folclore pela leitura estática.

### Patologia 1 — Teste-espelho (reimplementa o alvo localmente)

Confirmados: o arquivo define a função sob teste **dentro do próprio teste** e nunca importa o módulo de produção. Ficam verdes testando a si mesmos.

| Arquivo:linha | Evidência |
|---|---|
| `src/test/telemetry/telemetry-helpers.test.ts:10` | Comentário literal: *"Extracted pure functions from AdminTelemetriaPage for testing"*. `formatDuration` é redefinido em :32 e `getTimeThreshold` em :37. Zero import de `AdminTelemetriaPage`. 60 casos. |
| `src/test/company-filters-audit.test.ts:29` | `function applyFilters(...)` reimplementado localmente (:29–59), incluindo a regra de negócio "boolean null vira false" (:40–44). Nenhum import do filtro real. 66 casos. |
| `src/__tests__/integration/resilience-patterns.test.ts:9–39` | Circuit breaker inteiro construído dentro do `it()` (`let state`, `const execute`, :12–25) e depois testado (:28–38). O circuit breaker de produção citado em README.md:144 nunca é importado. 9 casos. |
| `src/test/telemetry/telemetry-data-integrity.test.ts` | 7 definições locais (`function`/`interface`/`type`) e zero import de produção. 46 casos. |
| `src/test/telemetry/external-data-telemetry.test.ts` | 7 definições locais, zero import de produção. 53 casos. |
| `src/test/telemetry/telemetry-charts.test.ts` | 4 definições locais, zero import de produção. 20 casos. |
| `src/__tests__/integration/data-validation.test.ts:12,27,43` | Regex de CNPJ, e-mail e telefone **redigitados no teste** (`cnpjRegex`, `emailRegex`, `phoneRegex`) em vez de importar os schemas Zod que o próprio cabeçalho (:3) diz validar. Se o schema de produção divergir, o teste continua verde. 19 casos. |

**Subtotal espelho: ~273 casos** que não podem detectar regressão no código de produção.

### Patologia 1b — Teste-grep (asserção sobre o *texto* do fonte, não sobre comportamento)

Variante distinta e igualmente enganosa: lê o arquivo `.tsx` com `fs.readFileSync` e faz `toContain('string')`. Passa se a string existir, mesmo que o componente esteja quebrado; quebra se alguém renomear uma classe CSS sem mudar comportamento algum.

| Arquivo:linha | Evidência |
|---|---|
| `src/__tests__/validate-dashboard-improvements.test.ts:7,27` | `readFile` em :7; `expect(indexContent).toContain('sticky')` em :27, `toContain('top-[57px]')` em :31, `toContain('z-10')` em :39, `toContain('backdrop-blur-lg')` em :43. **71 casos** — testa classes Tailwind como strings. |
| `src/__tests__/design-system-audit.test.ts:16–29` | 43 chamadas de `readFileSync`/`readdirSync`; varre `.tsx` como texto. 43 casos. |
| `src/__tests__/e2e-regression-suite.test.ts:10–11` | Cabeçalho declara "E2E Regression Suite - 200+ tests" (:6) mas é `readSrcFile` + grep de texto; 12 usos de fs. Não abre browser algum apesar do nome. 36 casos. |
| `src/__tests__/architecture-compliance.test.ts:26–33` | Lê todos os `.ts`/`.tsx` e checa tamanho de arquivo (:39 `MAX_COMPONENT_LINES = 1200`). É um linter disfarçado de teste — e contradiz ARCHITECTURE.md:95 ("Máximo 400 linhas por arquivo"), que estabelece 400, não 1200. |
| `src/__tests__/performance-and-a11y.test.ts` | 2 usos de fs, zero import de produção. 14 casos. |

**Subtotal grep-test: ~164 casos.** Somados aos espelhos: **~437 / 1.892 (23%) dos casos não exercitam o código de produção.**

### Patologia 2 — Suíte desligada

Nenhum `describe.skip`, `it.skip`, `xit`, `xdescribe`, `.only` ou `.todo` estático foi encontrado. Nenhum arquivo de teste vazio (0 casos). ✅ **Limpo neste eixo.**

Existem 5 `test.skip()` **condicionais em runtime**, todos no Playwright, todos guardados por variável de ambiente:

| Arquivo:linha | Condição |
|---|---|
| `e2e/smoke.spec.ts:24` | `test.skip(!EMAIL \|\| !PASS, 'E2E_USER_EMAIL/E2E_USER_PASS não definidos')` |
| `e2e/contacts-rapport.spec.ts:8` | idem |
| `e2e/interacoes-prefs-back-button.spec.ts:60` | idem |
| `e2e/gap-modules-smoke.spec.ts:40` | idem |
| `e2e/gap-modules-smoke.spec.ts:71` | `test.skip(true, 'Ask CRM trigger não visível neste ambiente')` — **skip incondicional**, sempre pulado ⬛ |

Observação decisiva: `E2E_USER_EMAIL` e `E2E_USER_PASS` **não são passados em ci.yml:66–69** (que só injeta `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `CI`). Portanto, se esses arquivos rodassem, todos se auto-pulariam. Como estão em `e2e/` e o Playwright aponta para `tests/`, eles nem chegam a ser coletados — dupla desativação.

### Patologia 3 — Asserção vacuamente verdadeira

Nenhum `expect(true).toBe(true)` / `expect(undefined).toBe(undefined)` literal foi encontrado. Porém há **asserções auto-referentes**, que testam o dublê e não o sistema:

| Arquivo:linha | Evidência |
|---|---|
| `src/__tests__/integration/auth-flow.test.ts:31` | `expect(mockRefreshSession).toHaveBeenCalledTimes(3)` — assere sobre o próprio mock. O comentário em :29–30 admite: *"In a real Supabase JS client, it actually deduplicates concurrent refresh calls. Our mock just proves the app code can handle the parallel resolution."* Ou seja: o teste declara que o comportamento real (deduplicação) **não** é o que está sendo verificado. |
| `src/__tests__/integration/auth-flow.test.ts:25` | `expect(res.data.session?.access_token).toBe('refreshed-token')` — o valor vem de `mockSession` definido em :3–7 no mesmo bloco. Tautologia: o mock devolve o que o mock definiu. |

**Anomalia estrutural no mesmo arquivo:** `src/__tests__/integration/auth-flow.test.ts:1` abre com um `it(...)` **antes** de qualquer `import` (os imports só aparecem em :37) e **fora** de qualquer `describe` (o primeiro `describe` é :67). O comentário de cabeçalho do arquivo está em :33–35, ou seja, **depois** do primeiro teste. Isso é assinatura de merge/colagem malfeita: 32 linhas órfãs no topo do arquivo. Não pude executar para saber se o TDZ de `mockRefreshSession` (declarado em :44) quebra a coleta (`NAO_VERIFICADO`), mas o arquivo está estruturalmente corrompido. 🟨

### Patologia 4 — Sem runner (o achado mais grave dos testes)

Comparando os globs dos configs com a lista real de arquivos:

- `vitest.config.ts:19–24` inclui **apenas** `src/**`, `tests/integration/**`, `tests/security/**`, `tests/stress/**`.
- `vitest.config.ts:25` exclui explicitamente `e2e/**` e `tests/e2e/**`.
- `playwright.config.ts:4` define `testDir: './tests'` — **`./e2e` não está no testDir**.

| # | Arquivo órfão | Casos | Por que ninguém roda |
|---|---|---|---|
| 1 | `e2e/smoke.spec.ts` | 5 | Fora do `testDir: './tests'` (playwright.config.ts:4) **e** excluído do vitest (vitest.config.ts:25) |
| 2 | `e2e/contacts-rapport.spec.ts` | 5 | idem |
| 3 | `e2e/gap-modules-smoke.spec.ts` | 7 | idem |
| 4 | `e2e/interacoes-prefs-back-button.spec.ts` | 4 | idem |
| 5 | `supabase/functions/health/index.test.ts` | 3 | Usa `Deno.test` (:9); nenhum step de CI invoca `deno test` — grep por `deno` em `.github/workflows/` retorna 0 |
| 6 | `supabase/functions/external-data/index.test.ts` | 2 | idem |
| 7 | `supabase/functions/generate-insights/index.test.ts` | 3 | idem |
| 8 | `supabase/functions/lead-routing/index.test.ts` | 11 | idem |
| 9 | `supabase/functions/voice-agent/index.test.ts` | 3 | idem |
| 10 | `supabase/functions/voice-to-text/index.test.ts` | 2 | idem |
| 11 | `scripts/check-edge-cors.test.mjs` | 10 | Extensão `.mjs` fora de `*.{ts,tsx}` do include (vitest.config.ts:20) e fora do `testDir` do Playwright. Ironia: testa o `check-edge-cors.mjs` que **é** um gate bloqueante (ci.yml:32) |

**Total órfão: 11 arquivos / 55 casos.**

Detalhe importante: `e2e/contacts-rapport.spec.ts` (órfão) e `tests/contacts-rapport.spec.ts` (rodado pelo Playwright) são **arquivos homônimos em diretórios diferentes** — sinal de uma migração `e2e/` → `tests/` que foi deixada pela metade. O diretório `e2e/` ainda tem um `README.md` próprio, reforçando que já foi o local canônico. ⬛ MORTO_OU_ABANDONADO para `e2e/`.

Os 6 testes de Edge Function são particularmente caros: são os **únicos** testes que exercitam as 109 Edge Functions, e nenhum roda. `AUDITORIA_COMPLETA_SISTEMA.md:117–119` já registrava isso ("Zero cobertura de testes para 107 edge functions... o pipeline CI não os executa") — o achado é antigo e permanece aberto.

### Patologia 5 — Alvo inexistente

**Zero ocorrências.** Resolvi cada `from '@/...'` e `from './...'`/`'../...'` de todos os 100 arquivos de teste contra o sistema de arquivos (com as extensões `.ts/.tsx/.js/.mjs/.d.ts` e `/index.*`): **todos os alvos importados existem**. ✅ Limpo neste eixo.

### Fragilidades adicionais dos testes

- **Cobertura sem piso.** `ci.yml:81` roda `--coverage` mas `vitest.config.ts` não declara `coverage.thresholds`. O relatório é gerado e descartado; nenhuma queda de cobertura reprova. 🟦
- **Playwright em 3 browsers** (playwright.config.ts:18–31: chromium, firefox, webkit) com `workers: 1` em CI (:10) e `retries: 2` (:9) — custo alto, e `screenshot: 'on'` (:15) captura em todo teste, não só em falha.
- **`webServer.command: 'npm run dev'`** (playwright.config.ts:33) — o E2E testa o **servidor de desenvolvimento Vite**, não o bundle de produção gerado em ci.yml:107. O artefato validado não é o artefato construído.

---

## Scripts — inventário por finalidade

**233 arquivos** em `scripts/`, dos quais **110 são executáveis** (`.sh` 68, `.js` 10, `.mjs` 8, `.py` 5, `.ts` 18, `.cjs` 1) e 123 são dados/SQL/docs (`.sql` 106, `.md` 6, `.txt` 3, `.yml` 2, `.json` 1, `.csv` 1, outros 4).

### Por pasta e finalidade

| Pasta | Arqs | Finalidade | Vivo? |
|---|---|---|---|
| `scripts/migration/verify/` | **123** | Verificação pós-migração: guards SQL, exporters, 20 cenários de teste em `tests/scenarios/` | 🟨 2 SQL invocados (ci.yml:42, ci.yml:104) — **mas atrás do gate fantasma**; `exporter/` só é lido por grep de secret (monitoring-lint.yml:47) |
| `scripts/migration/ddl/` | 15 | DDL numerado 00–10 (extensions, schemas, tables, indexes, FKs, grants, RLS, policies, functions, triggers, views) | 🟦 referenciado só por runbooks em `docs/`, nunca por CI |
| `scripts/migration/` (raiz) | 14 | Export/import de dados, extract-ddl, compare-counts, reset de senhas | 🟦 idem |
| `scripts/migration/storage/` | 8 | Migração de buckets + verify-report | 🟦 |
| `scripts/migration/functions/` | 7 | Deploy/verificação de Edge Functions | 🟦 — **o único lugar do repo que fala em publicar functions, e nenhum CI o chama** |
| `scripts/migration/cdc/` | 7 | Change Data Capture / dry-run | 🟦 (`dry-run.sh` é órfão total) |
| `scripts/monitoring/` | 6 | 3 exporters `.sh` + 2 arquivos de alerta `.yml` + `check-runbook-coverage.sh` | 🟨 **só** `check-runbook-coverage.sh` roda (monitoring-lint.yml:39); os 3 exporters nunca |
| `scripts/migration/{sql,dr,cutover,auth,monitoring,rollback,compliance,chaos}/` | 15 | Runbook de cutover, DR, rotação de JWT, caos | 🟦 |
| `scripts/` (raiz) | 38 | Guards de CI, geradores, e **7 scripts `apply-*.js`** | Misto — ver abaixo |

### Os 7 scripts VIVOS (invocados por package.json ou CI)

| Script | Invocado em | Bloqueante? |
|---|---|---|
| `scripts/check-edge-cors.mjs` | ci.yml:32 | ✅ sim |
| `scripts/check-bundle-size.mjs` | ci.yml:110 | ✅ sim |
| `scripts/monitoring/check-runbook-coverage.sh` | monitoring-lint.yml:39 | ✅ sim |
| `scripts/migration/verify/invalid-indexes-guard.sql` | ci.yml:42 | ❌ gate fantasma |
| `scripts/migration/verify/rls-coverage.sql` | ci.yml:104 | ❌ gate fantasma |
| `tests/rls/run.sh` | ci.yml:94 | ❌ gate fantasma |
| `scripts/check-edge-imports.mjs` | package.json:12 (`check:edge-imports`) | ⬛ **nenhum workflow chama esse npm script** — vivo no papel, morto na prática |

**Portanto: 3 de 110 scripts executáveis (2,7%) efetivamente reprovam um PR.**

### Órfãos — 40 scripts com ZERO referência em todo o repositório

Medição: grep do basename em todo o repo (excluindo `node_modules`, `.git` e o próprio arquivo) → 0 hits.

**Grupo A — aplicadores de migration ad-hoc (⬛ MORTO, e perigosos):**
`scripts/apply-all.js`, `apply-functions.js`, `apply-migrations.js`, `apply-missing.js`, `apply-remaining.js`, `apply-rls.js`, `apply-triggers-views.js`, `chunk-apply.js`, `retry-failed.js`, `fix-enums.js`

São 10 scripts que aplicam DDL/RLS direto no banco, sem nenhum caminho de invocação e sem nenhuma documentação que os cite. Nomes como `apply-remaining`, `apply-missing` e `retry-failed` denunciam uma migração manual feita por tentativa e erro. Risco: continuam executáveis por quem clonar o repo.

**Grupo B — geradores de documentação (⬛ MORTO):**
`generate_data_dictionary.py`, `generate_er_diagram.py`, `generate_real_dict.py`, `generate_real_er.py`, `run_explain_analyze.py`, `gen-supabase-types.mjs`, `diff-tables.mjs`

Nenhum CI os roda ⇒ `docs/data-dictionary.md` (156 KB) e `docs/er-diagram.md` são **snapshots congelados**, sem mecanismo de atualização. `docs/er-diagram.md` tem 111 bytes — praticamente vazio.

**Grupo C — cenários de teste de infraestrutura nunca executados (⬛ MORTO):**
22 arquivos em `scripts/migration/verify/tests/scenarios/` (`01-table-without-pk.sh`, `04-idle-in-transaction-aborted.sh`, `11-checksums-off.sh`, `14-secdef-public-search-path.sh`, `17-archive-off.sh`, `21-replication-slot-idle.sh`, `24-ssl-off.sh`, `25-*` ×9, `26-*` ×6) + `scripts/migration/cdc/dry-run.sh`.

Uma suíte inteira de verificação de postura de banco — 22 cenários — sem runner e sem referência. É o mesmo padrão da patologia #4, replicado na camada de infraestrutura.

**Grupo D — teste sem runner (⬛):** `scripts/check-edge-cors.test.mjs` (já contabilizado na patologia #4).

**Nota de método:** "zero referência" é um limite inferior de morte. Os ~63 executáveis restantes (110 − 7 vivos − 40 órfãos) são citados em runbooks de `docs/` mas nunca por código — são 🟦 SUGERIDO_OU_INICIADO: procedimento manual documentado, execução não automatizada e não verificada.

---

## Doc afirma × eu medi

| # | Doc:linha | A doc afirma | Eu medi | Evidência que contradiz | Veredito |
|---|---|---|---|---|---|
| 1 | `HANDOFF.md:4` | "Edge Functions: **30**" | **109** | 109 diretórios em `supabase/functions/` (108 com `index.ts`) | ❌ **FALSO — subestima 3,6×** |
| 2 | `HANDOFF.md:4` | "Tabelas: **40+**" | **268** | 268 `CREATE TABLE` distintos em `supabase/migrations/` | ❌ **FALSO — subestima 6,7×** |
| 3 | `README.md:103` | "**31** Edge Functions (Deno)" | **109** | idem #1 | ❌ FALSO |
| 4 | `README.md:106` | "**~50** migrations SQL versionadas" | **390** | `ls supabase/migrations/*.sql` = 390 | ❌ **FALSO — subestima 7,8×** |
| 5 | `README.md:149` | "`npm run test` # 4.470 testes automatizados" | **O script `test` não existe** | package.json:6–16 tem `test:unit`, `test:e2e`, `test:e2e:ui` — **não há `"test"`**. O comando do README falha na primeira linha | ❌ **FALSO — comando quebrado** |
| 6 | `README.md:150` | "`npm run test -- --coverage`" | idem | idem #5 | ❌ FALSO |
| 7 | `README.md:127` | "RLS ativo em **100%** das tabelas" | Não verificável aqui; **e o gate que provaria isso não roda** | `rls-coverage.sql` está atrás do `if: secrets.PGHOST != ''` (ci.yml:97) | 🟦 **NAO_VERIFICADO — e não auto-verificado pela CI** |
| 8 | `.lovable/plan.md:19` | "RLS: **100%** das tabelas públicas" | idem | idem | 🟦 NAO_VERIFICADO |
| 9 | `docs/SECURITY.md:19` | "**212 políticas RLS** cobrindo 100% das tabelas públicas" | 212 conflita com `docs/auditoria/04_ACHADOS_BANCO.md:66` que mediu **257/258** | Dois documentos do mesmo repo dão números incompatíveis para a mesma métrica | ❌ **CONTRADIÇÃO INTERNA** |
| 10 | `AUDITORIA_SISTEMA.md:177,261` | "RLS em **40+** tabelas" / "Todas as 40+ tabelas" | **268** tabelas | idem #2 | ❌ FALSO |
| 11 | `AUDITORIA_SISTEMA.md:7` | "✅ **100% DAS FUNCIONALIDADES** DOCUMENTADAS ESTÃO IMPLEMENTADAS" | — | Contradito por `AUDITORIA_COMPLETA_SISTEMA.md:16` (mesmo repo): *"zero cobertura de testes... nenhum pipeline de deployment... error reporting em produção é código morto"* | ❌ **CONTRADIÇÃO INTERNA** |
| 12 | `CHANGELOG.md:204` | "Eliminado **100% dos `any`** restantes no source code" | `docs/auditoria/03_ACHADOS_FRONTEND.md:11` mediu **119**; `docs/auditoria/05:24` mediu **108** violações de `no-explicit-any` | Meu grep textual de `: any` em `src/` retorna 4, mas as formas que o ESLint flagra (`as any`, genéricos, parâmetros) não são capturadas por esse padrão simples — as duas medições anteriores convergem em "muitos" | ❌ **FALSO** (medição delegada, convergente) |
| 13 | `audit_report.md:49` (raiz) | Auto-Testes: "**Backlog**, Cobertura > 70% em lógica core, prioridade ALTA" | — | **A cópia em `docs/audit_report.md:49` diz o oposto:** "**Concluído**, Suíte de auditoria massiva (1000+ cenários) validada com **100% de sucesso**, 10/10" | ❌ **DOIS ARQUIVOS COM O MESMO NOME SE CONTRADIZEM** |
| 14 | `ARCHITECTURE.md:95` | "Máximo **400** linhas por arquivo" | O teste que deveria impor isso usa **1200** | `src/__tests__/architecture-compliance.test.ts:39`: `MAX_COMPONENT_LINES = 1200` | ❌ **regra documentada ≠ regra testada (3×)** |
| 15 | `docs/ARCHITECTURE.md:97` | "Máximo **400** linhas por arquivo `.ts`/`.tsx`" | idem | idem | ❌ idem |
| 16 | `README.md:79` | "processos rigorosos de auditoria... para garantir a excelência **10/10**" | — | `docs/auditoria/05_ACHADOS_TESTES_BUILD_DOCS.md:67` desmonta o selo 10/10 item a item | ❌ marketing, não medida |
| 17 | `docs/SYSTEM_EXCELLENCE_10_10.md`, `docs/HARDENING_FINAL_10_10.md` | Selo "10/10" no próprio nome do arquivo | — | idem | 🟦 |
| 18 | `README.md:34` | "TypeScript **5.8**" | **5.9.3** | package.json:121: `"typescript": "^5.9.3"` | ❌ FALSO (menor) |
| 19 | `docs/ARCHITECTURE.md:108` | "**~280** custom hooks" | Não medi (fora do meu escopo — camada frontend) | — | 🟦 NAO_VERIFICADO |
| 20 | `HANDOFF.md:3` | "Última atualização: **2026-04-15**" | Data de hoje: 2026-08-16 | **4 meses de defasagem** — e é o documento nomeado "handoff", o primeiro que um novo dev lê | ⬛ **OBSOLETO** |
| 21 | `ARCHITECTURE.md:3` | "Última atualização: **Abril 2026**" | idem | idem | ⬛ OBSOLETO |
| 22 | `docs/ARCHITECTURE.md:3` | "Atualizado em **2026-04-19** (Rodada G — 35/35 melhorias)" | idem | idem | ⬛ OBSOLETO |
| 23 | `AUDITORIA_COMPLETA_SISTEMA.md:16,117` | "**107** edge functions" | **109** | Estava certo à época; hoje defasado em 2 | 🟨 quase certo |
| 24 | `tsconfig.app.json:17` vs docs "0 erros TS" | Docs celebram typecheck limpo | `"strict": false` (:17), `"noImplicitAny": false` (:18), `"strictNullChecks": false` (:19) | O `tsc --noEmit` de ci.yml:45 roda com as três travas de segurança **desligadas** — "0 erros" é barato | ❌ **enganoso por omissão** |

### Docs obsoletos ou duplicados

| Situação | Arquivos | Diagnóstico |
|---|---|---|
| **`audit_report.md` duplicado e divergente** | `/audit_report.md` e `/docs/audit_report.md` | Diferem em **2 linhas**, e justamente na linha 49, onde um diz "Backlog" e o outro "Concluído / 100% de sucesso". Impossível saber qual é canônico. ⬛ |
| **`ARCHITECTURE.md` duplicado e bifurcado** | `/ARCHITECTURE.md` e `/docs/ARCHITECTURE.md` | **221 linhas divergentes** — não é cópia desatualizada, são dois documentos diferentes com o mesmo nome, títulos distintos ("Arquitetura do SINGU CRM" vs "SINGU CRM — Arquitetura Consolidada") e datas distintas (:3 em cada). ⬛ |
| **4 documentos de auditoria concorrentes na raiz** | `AUDITORIA_SISTEMA.md`, `AUDITORIA_COMPLETA_SISTEMA.md`, `audit_report.md`, + `docs/QA_ANALYSIS_REPORT.md` | `AUDITORIA_SISTEMA.md:7` diz "100% implementado"; `AUDITORIA_COMPLETA_SISTEMA.md:16` diz "zero cobertura, sem deploy, código morto". Mutuamente exclusivos. ⬛ |
| **3 séries de "hardening/excelência"** | `docs/HARDENING_FINAL_10_10.md`, `docs/HARDENING_PHASE2_20260410.md`, `docs/HARDENING_PHASE3_FINAL.md`, `docs/SYSTEM_EXCELLENCE_10_10.md` | Dois arquivos se dizem "FINAL" e um se diz "PHASE3_FINAL" depois do "FINAL_10_10". 🟦 |
| **Dicionário de dados congelado** | `docs/data-dictionary.md` (156 KB), `docs/DATA_DICTIONARY.md` (6 KB), `docs/DATABASE_ANALYSIS.md` (46 KB) | Três dicionários; os geradores (`generate_real_dict.py`, `generate_data_dictionary.py`) são órfãos ⇒ nenhum se atualiza. ⬛ |
| **Diagrama ER vazio** | `docs/er-diagram.md` | **111 bytes**. Gerador `generate_er_diagram.py`/`generate_real_er.py` órfãos. ⬛ |
| **Auditoria paralela recente** | `docs/auditoria/00–99` (7 arquivos) | Estes são os **mais confiáveis** do repositório: trazem medições com denominador e contradizem explicitamente os docs da raiz. São a fonte que sobrevive ao ceticismo. ✅ |
| **`.lovable/memory/`** | 99 arquivos | Memória da ferramenta de IA, não documentação de sistema. Descreve features individuais com precisão, mas não tem índice de veracidade auditável. 🟦 |

**Padrão geral:** a documentação canônica da raiz (README, HANDOFF, ARCHITECTURE, AUDITORIA_*) é sistematicamente otimista e desatualizada em 4 meses; a documentação profunda em `docs/auditoria/` é precisa e pessimista. **Um leitor que confie na raiz subestima o sistema em ~4× a ~8× em todas as dimensões de tamanho** e superestima suas garantias de qualidade.

---

## Monitoring

### O que existe

| Arquivo | Conteúdo |
|---|---|
| `monitoring/prometheus/rules/db-guards.yml` | Regras de alerta PromQL |
| `monitoring/prometheus/rules/slo-burn-rate.yml` | Regras de burn-rate de SLO |
| `monitoring/alertmanager/alertmanager.yml` | Roteamento: 3 receivers (default-slack, slack-db-ops, pagerduty-db) + `null` |
| `scripts/monitoring/*.sh` (3) | Exporters: `rpc-perf-exporter.sh`, `rpc-plan-exporter.sh`, `ai-gateway-partitions-exporter.sh` |
| `scripts/monitoring/*.yml` (2) | `rpc-perf-alerts.yml`, `ai-gateway-partitions-alerts.yml` |

### Estão conectados a algo real? **Não.**

Quatro evidências independentes, todas conclusivas:

1. **Credenciais são placeholders literais.**
   `monitoring/alertmanager/alertmanager.yml:31` → `api_url: 'https://hooks.slack.com/services/REPLACE_ME'`
   `monitoring/alertmanager/alertmanager.yml:38` → mesmo `REPLACE_ME`
   `monitoring/alertmanager/alertmanager.yml:44` → `service_key: 'REPLACE_ME_PD_INTEGRATION_KEY'`
   Nenhum alerta pode chegar a lugar nenhum. **Nenhum canal foi jamais conectado.**

2. **Não existe `prometheus.yml`.** Há `monitoring/prometheus/rules/`, mas **nenhum arquivo de configuração de scrape** em todo o repositório. Regras de alerta sem `scrape_configs` não têm série temporal sobre a qual avaliar. Não há Prometheus configurado — só há regras órfãs.

3. **Não há deploy.** Nenhum `Dockerfile`, `docker-compose*`, chart Helm, manifesto k8s ou `*.tf` no repositório. Os containers `prom/prometheus:latest` e `prom/alertmanager:latest` aparecem em monitoring-lint.yml:22 e :31 **exclusivamente como ferramenta de lint efêmera** (`docker run --rm ... promtool check rules` / `amtool check-config`), nunca como serviço.

4. **Os exporters nunca são executados.** Dos 6 arquivos em `scripts/monitoring/`, **apenas** `check-runbook-coverage.sh` é invocado (monitoring-lint.yml:39). Os 3 exporters `.sh` — que seriam a ponte entre o Postgres e o Prometheus — não são chamados por nenhum workflow, cron ou script. Sem exporter, não há métrica; sem métrica, as regras nunca disparam.

### Veredito

**São arquivos soltos, sintaticamente válidos e semanticamente inertes.** O que o `monitoring-lint.yml` garante é real, mas modesto: que o YAML compila (`promtool check rules`, `amtool check-config`) e que todo alerta tem runbook (`check-runbook-coverage.sh`). Isso é **validação de gramática, não observabilidade**. O sistema não é monitorado por nada aqui.

Classificação: 🟦 SUGERIDO_OU_INICIADO — o design está feito e é competente (roteamento por severidade, silenciamento de manutenção em :22–24, `runbook_url` em todo template); só nunca foi ligado. O `secret-leak-scan` (monitoring-lint.yml:41–48) é ✅: um `grep -REn` que sai com exit 1, gate real e bloqueante.

---

## Tabela de evidências consolidada

| Item | Classificação | Evidência (arquivo:linha) | O que falta |
|---|---|---|---|
| **CI — INFRA** | | | |
| Workflow CI existe e roda em PR+push | ✅ IMPLEMENTADO_TOTAL | ci.yml:1–7 | — |
| Gate ESLint global 0/0 | ✅ IMPLEMENTADO_TOTAL | ci.yml:47–56 | — |
| Gate dependências circulares | ✅ IMPLEMENTADO_TOTAL | ci.yml:28–29, .dependency-cruiser.cjs:4–10 | — |
| Gate CORS de Edge Function | ✅ IMPLEMENTADO_TOTAL | ci.yml:31–32 | Seu próprio teste não roda (patologia #4) |
| Gate bundle size | ✅ IMPLEMENTADO_TOTAL | ci.yml:109–110 | — |
| Gate `npm audit` high+ | ✅ IMPLEMENTADO_TOTAL | ci.yml:58–59 | — |
| Typecheck | 🟨 PARCIAL | ci.yml:44–45 + tsconfig.app.json:17–19 | `strict`, `noImplicitAny`, `strictNullChecks` todos `false` |
| Commitlint em PR | 🟨 PARCIAL | ci.yml:24–26 | Não valida commits, só o título do PR |
| Versões de action `@v7` | 🟦 NAO_VERIFICADO | ci.yml:16, ci.yml:72 | Confirmar existência das majors; se não existirem, CI nunca roda |
| Lockfiles concorrentes | ⬛ MORTO | `bun.lock`, `bun.lockb` vs `package-lock.json` | Remover os não usados por `npm ci` (ci.yml:22) |
| **Gate índices inválidos** | ⬛ MORTO | ci.yml:34–42 (`if: secrets.PGHOST != ''`) | `secrets` não é contexto válido em `steps.if` |
| **Gate matriz RLS** | ⬛ MORTO | ci.yml:83–94 | idem — 13 `.sql` em `tests/rls/` nunca rodam |
| **Gate RLS coverage** | ⬛ MORTO | ci.yml:96–104 | idem |
| Lighthouse CI | ⬛ MORTO | ci.yml:112–113 (`\|\| echo`) + lighthouserc.json:13–19 (7× `"warn"`) | Duplamente não-bloqueante |
| **Pipeline de deploy** | ⬛ **INEXISTENTE** | Ausência total em `.github/`, sem Dockerfile/tf/vercel.json | Não existe. Publicação é manual/externa ao Git |
| Dependabot | ✅ IMPLEMENTADO_TOTAL | dependabot.yml:1–31 | npm + github-actions, semanal |
| monitoring-lint (promtool/amtool) | ✅ IMPLEMENTADO_TOTAL | monitoring-lint.yml:16–32 | — |
| secret-leak-scan | ✅ IMPLEMENTADO_TOTAL | monitoring-lint.yml:41–48 | — |
| **TESTES** | | | |
| Suíte Vitest (79 arq / 1.795 casos) | 🟨 PARCIAL | vitest.config.ts:19–24 | ~437 casos não exercitam produção |
| Suíte Playwright (10 arq / 42 casos) | 🟨 PARCIAL | playwright.config.ts:4–6, ci.yml:64–69 | Testa `npm run dev`, não o build |
| Threshold de cobertura | 🟦 SUGERIDO | ci.yml:81 (`--coverage` sem piso) | `coverage.thresholds` ausente em vitest.config.ts |
| Testes-espelho (7 arquivos) | ⬛ MORTO (como proteção) | telemetry-helpers.test.ts:10,32; company-filters-audit.test.ts:29; resilience-patterns.test.ts:9–39; data-validation.test.ts:12,27,43 | Importar o alvo real |
| Testes-grep (5 arquivos, 164 casos) | 🟨 PARCIAL | validate-dashboard-improvements.test.ts:7,27; design-system-audit.test.ts:16–29; e2e-regression-suite.test.ts:10 | Asserções sobre texto-fonte, não comportamento |
| `auth-flow.test.ts` estruturalmente quebrado | 🟨 PARCIAL | src/__tests__/integration/auth-flow.test.ts:1 (it antes dos imports da :37) | 32 linhas órfãs no topo; asserção sobre o próprio mock (:31) |
| **`e2e/` (4 arq / 21 casos)** | ⬛ MORTO | playwright.config.ts:4 (`testDir:'./tests'`) + vitest.config.ts:25 (exclude) | Fora de todo runner; homônimos já migrados p/ `tests/` |
| **Testes de Edge Function (6 arq / 24 casos)** | ⬛ MORTO | `supabase/functions/*/index.test.ts:9` (`Deno.test`); grep `deno` em workflows = 0 | Nenhum step `deno test`. 109 functions sem teste executado |
| `scripts/check-edge-cors.test.mjs` (10 casos) | ⬛ MORTO | vitest.config.ts:20 (só `.ts/.tsx`) | Extensão fora de todo glob |
| Skip incondicional | ⬛ MORTO | e2e/gap-modules-smoke.spec.ts:71 (`test.skip(true, ...)`) | — |
| Env de E2E ausente na CI | 🟨 PARCIAL | ci.yml:66–69 não injeta `E2E_USER_EMAIL`/`E2E_USER_PASS` | Guards em e2e/*.spec.ts:8,24,40,60 se auto-pulariam |
| Alvos de import inexistentes | ✅ LIMPO | 0 ocorrências em 100 arquivos | — |
| `describe.skip`/`.only`/arquivo vazio | ✅ LIMPO | 0 ocorrências estáticas | — |
| **SCRIPTS** | | | |
| 3 guards executáveis vivos | ✅ IMPLEMENTADO_TOTAL | ci.yml:32, ci.yml:110, monitoring-lint.yml:39 | — |
| `check:edge-imports` | ⬛ MORTO | package.json:12; nenhum workflow o chama | Adicionar step ou remover |
| 10 aplicadores `apply-*.js`/`chunk-apply`/`retry-failed`/`fix-enums` | ⬛ MORTO | zero referências no repo | Remover — aplicam DDL/RLS sem trilha |
| 7 geradores de doc (`.py`/`.mjs`) | ⬛ MORTO | zero referências | Docs geradas estão congeladas |
| 22 cenários `verify/tests/scenarios/*.sh` | ⬛ MORTO | zero referências | Suíte de postura de infra sem runner |
| ~63 scripts de runbook de migração | 🟦 SUGERIDO | citados só em `docs/`, nunca em código | Procedimento manual, não verificado |
| **MONITORING** | | | |
| Regras Prometheus (2 arq) | 🟦 SUGERIDO | monitoring/prometheus/rules/*.yml; **sem `prometheus.yml`** | Falta config de scrape |
| Alertmanager | 🟦 SUGERIDO | alertmanager.yml:31,38,44 (`REPLACE_ME` ×3) | Credenciais nunca preenchidas |
| 3 exporters | ⬛ MORTO | scripts/monitoring/*-exporter.sh; zero invocações | Sem exporter não há métrica |
| Deploy do stack de monitoring | ⬛ **INEXISTENTE** | Sem Dockerfile/compose/k8s; containers só em `docker run --rm` de lint (monitoring-lint.yml:22,31) | — |
| **DOCUMENTAÇÃO** | | | |
| `docs/auditoria/` (7 arq) | ✅ IMPLEMENTADO_TOTAL | 05_ACHADOS_TESTES_BUILD_DOCS.md:9–31, 04:65–66 | Fonte mais confiável do repo |
| README / HANDOFF / ARCHITECTURE | ⬛ OBSOLETO | HANDOFF.md:3 (2026-04-15), ARCHITECTURE.md:3, docs/ARCHITECTURE.md:3 | 4 meses de defasagem; contagens erradas 4–8× |
| `audit_report.md` duplicado divergente | ⬛ MORTO | `/audit_report.md:49` vs `/docs/audit_report.md:49` | Dizem o oposto na mesma linha |
| `ARCHITECTURE.md` bifurcado | ⬛ MORTO | 221 linhas divergentes entre raiz e `docs/` | Eleger um canônico |
| `docs/er-diagram.md` | ⬛ MORTO | 111 bytes; geradores órfãos | — |
| `.lovable/memory/` (99 arq) | 🟦 SUGERIDO | `.lovable/memory/index.md` | Memória de ferramenta, não doc de sistema |

---

## Lacunas: o que NÃO verifiquei e por quê

### Declaração explícita

> **NADA foi executado nesta auditoria.** Não rodei `npm install`, `npm ci`, `npm run build`, `npm run test:unit`, `npm run test:e2e`, `npx tsc --noEmit`, `npx eslint`, `vitest`, `playwright`, `promtool`, `amtool`, `psql` nem qualquer script de `scripts/`.
> **`node_modules` está vazio (0 entradas)** e não há Supabase CLI no ambiente. Nenhuma execução era possível, e nenhuma foi tentada.
>
> **Em nenhum ponto deste documento afirmo que os testes passam, que o build funciona, que o lint está limpo ou que a CI está verde.** Não sei. Qualquer frase que pareça sugerir isso deve ser lida como descrição do que o *arquivo de configuração declara*, não do que acontece em execução.

### Itens marcados `NAO_VERIFICADO` e o motivo

| Lacuna | Por que não verifiquei |
|---|---|
| Se `actions/setup-node@v7` e `actions/upload-artifact@v7` existem | Sem acesso ao GitHub Marketplace. Se não existirem, **todo o ci.yml falha no startup** e a análise de gates acima descreve um portão que nunca abre |
| Se `secrets` em `steps.if` causa erro de parse ou avaliação vazia | Sem CI real. Os dois desfechos levam ao mesmo resultado prático (gates de banco não protegem), mas com gravidade muito diferente para o resto do arquivo |
| Conclusão real de qualquer check no GitHub | Sem acesso à API de Actions do repositório |
| Número de testes que o vitest **reportaria** | Contei 1.892 blocos estáticos; `it.each` e laços expandem esse número em runtime. Não sei o total real, logo não posso confirmar nem refutar os "4.470" de README.md:149 — só posso afirmar que o **comando** `npm run test` não existe |
| Se algum teste **falha** | Não executei. Todas as patologias que apontei são de *estrutura* (o teste não pode detectar regressão), não de *resultado* |
| Contagem de violações de ESLint / `no-explicit-any` | Não executei ESLint. Os números 108/119 vêm de `docs/auditoria/03:11` e `05:24` — **medições de terceiros**, citadas como tal |
| Cobertura de código real (%) | Requer execução do vitest com `--coverage` |
| Se as 268 tabelas têm RLS de fato | Requer conexão ao Postgres. É exatamente o que `rls-coverage.sql` faria, e é exatamente o gate que está morto (ci.yml:97) |
| Profundidade/correção das políticas RLS | Fora do meu escopo (agente de banco) e requer runtime |
| Se as Edge Functions estão publicadas | Não há pipeline de deploy no repo; a publicação ocorre fora do Git via Lovable |
| `~280 custom hooks` (docs/ARCHITECTURE.md:108) | Camada frontend, fora do meu escopo |
| Se o Prometheus/Alertmanager existe em algum ambiente | O repositório não contém deploy deles; um stack externo não versionado seria invisível para mim |
| Conteúdo semântico das 106 queries `.sql` de `scripts/migration/verify/` | Auditei alcançabilidade (quem as invoca), não correção do SQL |

### Limites metodológicos assumidos

- **"Zero referência" ⇒ órfão** é um *limite inferior* de código morto. Um script citado apenas em prosa de runbook conta como "referenciado" no meu grep, mas não é automação — por isso o grupo de ~63 scripts ficou 🟦, não ✅.
- **Detecção de teste-espelho** foi feita por ausência de import + presença de definição local, seguida de **leitura manual** de cada candidato. Arquivos com `await import()` dinâmico (`voice-system-exhaustive.test.ts:28`, `auth-flow.test.ts:14`) foram reclassificados como legítimos após inspeção — o grep inicial os acusava por engano.
- **Contagem de `: any`** por regex textual (4 ocorrências) é sabidamente incompleta: não captura `as any`, genéricos nem parâmetros implícitos. Por isso não apresentei meu número como refutação, e sim as medições por ESLint de `docs/auditoria/`.
- **Rotas:** medi **114** `<Route` em `src/app/AppRoutes.tsx` (113 com `path=`/`element=`), não os 130 do ground truth fornecido. Há `<Route` também em `AppLayout.tsx`, `AppProviders.tsx` e `GraphTab.tsx`, o que pode explicar a diferença. Reporto minha medição e a divergência; não a resolvi porque roteamento é escopo do agente de frontend.
