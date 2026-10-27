# RELATORIO_CI.md — Correção dos workflows com falha (Singu_V2)

Data: 2026-10-27 · Branch: `fix/ci-workflows` · Idioma: pt-BR

## 1. Inventário (última execução de cada workflow na `main`)

| Workflow | Última execução | Status | Causa provável |
|---|---|---|---|
| **CI** | [run 40489421925](https://github.com/adm01-debug/Singu_V2/actions/runs/40489421925) | ❌ failure | Step `Security audit (high+ severity)` (`npm audit --omit=dev --audit-level=high`): zod@3.25.76 vulnerável a GHSA-mrhx-c7xc-m3w5 (alta) |
| **Dependabot Updates** | [run 40320109211](https://github.com/adm01-debug/Singu_V2/actions/runs/40320109211) | ❌ failure | EOVERRIDE: `overrides.serialize-javascript` fixado em `^7.0.7` conflitava com o bump necessário (advisory exige ≥7.1.3) |
| RLS exposure guard | [run 40489422048](https://github.com/adm01-debug/Singu_V2/actions/runs/40489422048) | ✅ success | — (verde) |
| monitoring-lint | [run 38429297407](https://github.com/adm01-debug/Singu_V2/actions/runs/38429297407) | ✅ success | — (verde; última execução 2026-10-13) |
| restore-drill | sem execução recente na janela analisada | — | — |

## 2. Baseline local (antes de qualquer alteração)

| Etapa | Resultado |
|---|---|
| `npm ci` (install) | ✅ exit 0 |
| `npx tsc -b` (typecheck) | ✅ exit 0 |
| `npm run lint` (eslint .) | ✅ exit 0 |
| `npx vitest run` (suíte completa) | ✅ 158 arquivos / **6026 testes** passando |
| `npm run build` | ✅ exit 0 |
| `npm audit --omit=dev --audit-level=high` | ❌ reproduz a falha do CI: zod alta + fast-uri moderada |

Logs do baseline em `/tmp/ci-baseline/` (máquina da sessão).

## 3. Diagnóstico — agrupamento por causa raiz

| Causa raiz | Workflows afetados | Evidência |
|---|---|---|
| **R1 — zod@3.25.76 → GHSA-mrhx-c7xc-m3w5** (alta; esgotamento de memória via `z.array()` sem limite; fix só na linha 4.x, sem backport 3.x) | CI | `npm audit` local reproduz exatamente o step que falha no run |
| **R2 — `overrides.serialize-javascript` desalinhado** (advisory exige ≥7.1.3; override fixado `^7.0.7` → `EOVERRIDE` "conflicts with direct dependency") | Dependabot Updates | Erro reproduzido ao tentar `npm install serialize-javascript@^7.1.3` |
| R3 — fast-uri@3.1.8 (moderada, transitiva workbox-build→ajv) | CI (mesmo step, severidade moderada) | Resolvida por `npm audit fix` — sem mudança de código |
| R4 — entry chunk acima do budget (detectada no CI do PR; `jspdf`/`jspdf-autotable`/`pako` ~395KB raw importados estaticamente no entry) | CI (step `check-bundle-size`) | Entry 350,4KB gzip vs limite 350KB; na main estava 349,8KB |

## 4. Correções aplicadas (um commit por causa raiz)

1. `fix(deps)` — `zod ^3.25.76 → ^4.6.7`; `serialize-javascript ^7.0.7 → ^7.1.3` em `dependencies` **e** `overrides` (alinha o override que causava o EOVERRIDE); `@hookform/resolvers ^3.10.0 → ^5.9.2` (a 3.x lia `error.errors`, removido no zod v4 — quebrava todo formulário via `zodResolver`; a 5.x detecta `issues` da v4 e continua compatível com a v3).
2. `fix(zod)` — adaptações de compatibilidade zod v3→v4 em `src/` (ver corpo do commit para o detalhe por arquivo):
   - `z.record()` agora exige key+value (2 args);
   - `ZodError.errors` → `.issues`; `z.ZodTypeDef` removido;
   - `z.unknown()` passa a exigir a chave presente → `.optional()` em `search_vector`;
   - `.partial()`/`.optional()` sobre campos com `.default()` agora emitem o default para chaves ausentes → saída esparsa preservada por filtro de chaves (`prepareCompanyWrite`/`prepareContactWrite`) e por helpers `optionalText`/`optionalNumeric` sem default nos insert-schemas que alimentam o RPC `persist_company_composite`;
   - `zodResolver` v5 tipa `input ≠ output` → cast local para `Resolver<FormData>` mantém a tipagem de saída produzida pela v3;
   - ajustes pontuais de inferência (`pais` no appendAddress; `direction`/`channel` opcionais em `useInteractions` com cast no insert — o banco já aplica os valores vigentes, **zero mudança de runtime**).
3. `perf(bundle)` — `jspdf`/`jspdf-autotable` carregados sob demanda no `exportToPDF` de `StrategicNextStepsCard` (mesmo padrão do `useTelemetryExport`). Entry 350,4KB → **224,6KB gzip**; jspdf vira chunk separado (125,7KB) baixado só no clique.
4. `fix(export-pdf)` — `try/catch` nos imports dinâmicos com toast destrutivo + `logger.error` (endereça achado do Devin Review: rejeição não tratada se a rede cair antes do clique).

## 5. Comparação baseline × final (anti-regressão)

| Etapa | Baseline | Após correção |
|---|---|---|
| typecheck | exit 0 | exit 0 |
| lint | exit 0 | exit 0 |
| testes | 6026 passando | **6026 passando** (158 arquivos) |
| build | exit 0 | exit 0 |
| audit (`--omit=dev --audit-level=high`) | 1 alta + 1 moderada | **exit 0** — só 2 moderadas (react-router, fora do gate) |

Nenhum teste removido/enfraquecido, nenhum snapshot atualizado, nenhuma regra de lint/TS afrouxada.

## 6. Melhorias/gaps registrados

- Gate de audit cobre apenas deps de produção (`--omit=dev`): vulnerabilidades críticas em devDeps (vitest/tinypool, @vitest/mocker, postcss-selector-parser) não quebram o CI — ver PENDENCIAS.md.
- Edge functions pinam `npm:zod@3.23.8` inline (Deno) — invisíveis ao `npm audit`; ver PENDENCIAS.md.
- react-router-dom@^6.30.6 tem 2 moderadas com fix apenas na major 7 — deixado fora do escopo mínimo; ver PENDENCIAS.md.

## 7. Prova de conclusão

| Workflow | Última execução | Situação |
|---|---|---|
| CI | [40525170349](https://github.com/adm01-debug/Singu_V2/actions/runs/40525170349) | ✅ success na branch `fix/ci-workflows` (build-and-test, incl. audit gate + check-bundle-size) — merge retido (ver PENDENCIAS.md); nova execução na `main` confirmará |
| Dependabot Updates | [40320109211](https://github.com/adm01-debug/Singu_V2/actions/runs/40320109211) | causa raiz corrigida no PR; nova execução do Dependabot confirmará |
| RLS exposure guard | [40489422048](https://github.com/adm01-debug/Singu_V2/actions/runs/40489422048) | segue verde |
| monitoring-lint | [38429297407](https://github.com/adm01-debug/Singu_V2/actions/runs/38429297407) | segue verde |
