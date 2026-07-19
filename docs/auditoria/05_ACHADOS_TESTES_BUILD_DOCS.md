# 🧪 Achados — Testes, Build, Config, CI & Docs-vs-Realidade

> Método: dependências instaladas via `npm install` (bun `--frozen-lockfile` expirou 2× no proxy). **Testes, `tsc` e `eslint` foram executados de verdade.** Todos os números são medidos.

## Resumo dos veredictos

| Alegação da doc | Realidade medida | Veredicto |
|---|---|---|
| "4.470 testes passando (78 arquivos)" | **5.494 testes passando, 0 falhas, 77 arquivos** | ✅ Real (número desatualizado p/ menos) |
| "10/10" / "lint limpo" | **1.306 erros + 92 warnings de ESLint** | ❌ FALSO |
| "0 erros TypeScript" | 0 erros no `tsc` **mas com `strict:false`** | ⚠️ Enganoso |
| "Zero any" / "as any: 1" | **108 violações `no-explicit-any`** | ❌ FALSO |
| "CSP restritiva" | Só `frame-ancestors` em `<meta>` (ignorado pelo browser) | ❌ FALSO |
| "895 componentes / 370 hooks / 100 edge fns" | 916 / 379 / 106 | ⚠️ Impreciso |
| QA doc: "ZERO arquivos de teste" | 87 arquivos, 5.494 testes | ❌ Contradição interna |

---

## Achados

### [ALTO] TQ-1. ESLint quebra com 1.306 erros — o gate de qualidade da CI reprovaria
`eslint .` (exit 1) sobre 1.827 arquivos: **1.306 erros + 92 warnings** em 600 arquivos. Top regras: `sonarjs/no-nested-conditional` **915**, `sonarjs/cognitive-complexity` **184**, `@typescript-eslint/no-explicit-any` **108**, `react-hooks/exhaustive-deps` 46 (warn), `react-refresh/only-export-components` 46 (warn), `sonarjs/no-nested-functions` 37, `sonarjs/no-empty-test-file` 6, `sonarjs/dompurify-unsafe-config` 2. O `ci.yml` roda `eslint . --max-warnings=0` → **falha 100% das vezes**.

### [ALTO] TQ-2. "Zero any" é falso — 108 usos de `any` (regra marcada como `error`)
`@typescript-eslint/no-explicit-any`: **108 violações**. A doc afirma "Eliminado 100% dos any" (CHANGELOG 1.9.0), "Zero any" (audit_report), "as any: 1 justificada" (QA v19). Todas falsas. (O agente de Frontend contou 119 por grep textual incluindo formas que o ESLint não flagra; ambas as medições convergem em "muitos, não zero".)

### [ALTO] TQ-3. "0 erros TypeScript" com asterisco: o compilador está desligado
`tsc --noEmit -p tsconfig.app.json` → 0 erros, mas `tsconfig.app.json` tem `strict:false`/`noImplicitAny:false` e `tsconfig.json` tem `strictNullChecks:false`. "0 erros" reflete compilador permissivo, não código type-safe. O CHANGELOG celebra "0 erros TS" sem revelar que a checagem estrita está desativada.

### [ALTO] TQ-4. Documentação auto-contraditória com números fabricados
- `README`/`CHANGELOG`: "4.470 testes passando".
- `AUDITORIA_SISTEMA.md` (2026-03-15): *"Não há arquivos `*.test`/`*.spec`... Testes automatizados: inexistentes"*.
- `docs/QA_ANALYSIS_REPORT.md` (v19): *"Arquivos de Teste: ZERO"*, *"as any: 1"*, *"TODO/FIXME: ZERO"*, *"Edge Functions: 12"*, *"RLS: 34 tabelas"* — e chama o produto de **"RelateIQ"** (não SINGU).
- Edge functions: "12" (QA) vs "31" (CHANGELOG) vs "100" (audit_report) vs **106** real.
- `README` manda rodar `npm run test`, mas **esse script não existe** (só `test:unit`/`test:e2e`) — o comando documentado falha.

### [MÉDIO] TQ-5. Testes: suíte REAL e verde — número da doc desatualizado
`vitest run`: **77 passed, 5.494 tests, 0 falhas, 46s**. `find` = 87 arquivos (vitest roda 77; exclui e2e). Blocos: 1.860 `it/test`, 372 `describe`, 3.107 `expect`; os 5.494 vêm de `it.each`/loops. **Nenhum `expect(true)` trivial.** Testam lógica real (formatters, `rateLimit`, RFM, telemetria). Ressalva: 6 arquivos usam `fs.readFileSync` para "testar" presença de strings no fonte; ESLint acusa 3 `assertions-in-tests` (blocos sem asserção real).

### [MÉDIO] TQ-6. 6 testes de Edge Functions VAZIOS + backend sem cobertura unitária
`sonarjs/no-empty-test-file`: `supabase/functions/{external-data,generate-insights,health,lead-routing,voice-agent,voice-to-text}/index.test.ts` são stubs vazios. E `vitest.config.ts` inclui só `src/**`+`tests/**` → **nenhum teste de `supabase/functions/**` roda**. Cobertura de edge por unit ≈ zero apesar dos arquivos-fantasma.

### [MÉDIO] TQ-7. CSP não é restritiva — e a diretiva é inócua em `<meta>`
`index.html`: só `<meta http-equiv="Content-Security-Policy" content="frame-ancestors 'none';">`. `frame-ancestors` **é ignorada via `<meta>`** (spec exige header HTTP). Sem `_headers`/`vercel.json`/`netlify.toml` com CSP real; sem `default-src`/`script-src`/`connect-src`. **Não há CSP funcional.** `vite.config.ts` também não injeta headers. Positivo: `X-Content-Type-Options: nosniff` e `Permissions-Policy` presentes.

### [MÉDIO] TQ-8. PWA/Service Worker cacheia PII do CRM no browser por 24h
`vite.config.ts` VitePWA workbox `runtimeCaching`: `*.supabase.co/*` com `NetworkFirst`, `cacheName:"supabase-cache"`, 100 entradas, `maxAgeSeconds:24h`. Persiste respostas de API (contatos/empresas/interações — PII) no Cache Storage por 24h, sem distinção de sensibilidade. Em máquina compartilhada → vazamento em repouso.

### [MÉDIO] TQ-9. CI existe e é abrangente, mas os gates críticos não rodam o que a doc promete
`ci.yml`: commitlint, dependency-cruiser, tsc, eslint `--max-warnings=0`, `npm audit`, Playwright E2E, vitest+coverage, RLS matrix, build, bundle-size, Lighthouse. Problemas: (a) **lint reprova** (TQ-1) → pipeline não pode estar verde honestamente; (b) **RLS matrix condicional** `if: secrets.PGHOST != ''` → sem o secret, `tests/rls/run.sh` é **pulado em silêncio**; (c) **E2E "jornadas críticas" auto-pulam** (`e2e/smoke.spec.ts`/`contacts-rapport.spec.ts` fazem `test.skip(!EMAIL||!PASS)` e o job não injeta `E2E_USER_*`) → login→criar contato, pipeline drag, inbox **nunca rodam**; só `navigation.spec.ts` roda de fato.

### [ALTO] TQ-10. O workflow de CI referencia versões de actions inexistentes → falha no startup (0 jobs)
`.github/workflows/ci.yml:13,16,51`: `actions/checkout@v6`, `actions/setup-node@v6`, `actions/upload-artifact@v7` — as majors reais são v4. O run mais recente (push do branch de auditoria) terminou como **failure com 0 jobs** — falha de startup. Ou seja, **antes mesmo do gate de lint, o pipeline nem instancia jobs**: todos os gates (tsc/lint/audit/RLS/E2E/build/bundle) **nunca executam**. A "excelência 10/10" é protegida por um pipeline que na prática não roda. (Evidência independente do caller; complementa TQ-9.)

### [BAIXO] TQ-11. Higiene de dependências: 3 lockfiles e classificação errada
`bun.lock` (330KB) + `bun.lockb` (194KB, binário legado) + `package-lock.json` (582KB) coexistem; CI usa `npm ci`, devs usam bun → divergência de árvore CI×local. **8 `@types/*` em `dependencies`** (canvas-confetti, dompurify, fast-levenshtein, leaflet, leaflet.markercluster, papaparse, qrcode.react, react-window). Ferramental de teste (`vitest`, `@testing-library/*`, `jsdom`, `axe-core`, `workbox-build`) em `dependencies`.

### [BAIXO] TQ-12. `sonarjs/dompurify-unsafe-config` em `src/lib/sanitize.ts`
`sanitize.ts:8,22`: config base do DOMPurify é restritiva, mas `sanitizeHtml` faz `...options` no fim do objeto → qualquer chamador pode **sobrescrever `ALLOWED_TAGS`/`ALLOWED_ATTR`** e reintroduzir XSS. É o único ponto de sanitização e alimenta os 2 `dangerouslySetInnerHTML`.

### [BAIXO] TQ-13. Contagens reais de inventário
Componentes: 916 `.tsx` em `src/components` (doc: 895). Hooks: 379 (doc: 370). Edge fns: 106 (doc: 12/31/100). Migrations: 262. Rotas: 112 (doc: 106). RLS: 141 migrations com `ENABLE RLS`, 765 `CREATE POLICY`, **30 `USING(true)`** e **22 `WITH CHECK(true)`** (permissivas), 110 `SECURITY DEFINER`, 81 refs a `service_role`.

---

## Ponto mais importante
Ironicamente, a alegação sobre **testes** é a mais honesta (suíte real e verde: **5.494 passando**, tsc limpo). O que desmorona sob ceticismo é o resto do selo "10/10": **1.306 erros de ESLint**, **108 `any`** contra "Zero any", **`strict:false`** por trás do "0 erros TS", **CSP inexistente**, **RLS/E2E críticos que não rodam na CI**, **CI que falha no startup** (versões de actions inexistentes) e **documentos que se contradizem** (5 mil testes vs "ZERO", e chamam o produto de "RelateIQ").
