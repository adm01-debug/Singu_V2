# PENDENCIAS.md — Bloqueios e itens fora do escopo (Singu_V2)

Atualizado em: 2026-11-18

---

## P0 — RESOLVIDO (2026-11-18) — PR `fix/ci-workflows` foi mergeada

- **Estado real:** a PR #140 (`fix/ci-workflows`) foi **mergeada em 2026-10-27T15:08:49Z**. Não há nada retido.
- Verificado em 2026-11-18 via API do GitHub: `state=closed`, `merged_at=2026-10-27T15:08:49Z`.
- Registro histórico do que era o bloqueio, mantido abaixo para rastreabilidade:

- **Workflows afetados:** CI / Dependabot Updates
- **Erro corrigido:** gate `npm audit --omit=dev --audit-level=high` (zod GHSA-mrhx-c7xc-m3w5) + EOVERRIDE do Dependabot.
- **Por que pendente:** a correção altera código da aplicação (migração zod v3→v4 em `src/`), e o merge na `main` dispara deploy de produção (Vercel). Regra da sessão: "se a correção alterar código da aplicação, não faça merge — deixe o PR pronto e registre em PENDENCIAS.md".
- **O que você precisa fazer (Joaquim):** revisar e mergear o PR `fix/ci-workflows` quando quiser publicar a mudança; em seguida reexecutar os workflows de push na main e confirmar `success`.
- **CI na branch `fix/ci-workflows`:** run [40525170349](https://github.com/adm01-debug/Singu_V2/actions/runs/40525170349) ✅ success (build-and-test, incl. audit gate + check-bundle-size).

---

## P1 — react-router-dom 6 → 7 (2 vulnerabilidades moderadas)

- `npm audit --omit=dev` reporta 2 moderadas em `react-router`/`react-router-dom` (GHSA-wrjc-x8rr-h8h6, GHSA-337j-9hxr-rhxg); fix só na linha 7.x (breaking change).
- Abaixo do gate `high` — não derruba o CI. Upgrade major fica fora do escopo "menor mudança possível"; sugerido avaliar migração para RR7 em tarefa dedicada.

---

## P2 — zod 3.23.8 pinado nas edge functions (Deno)

- `supabase/functions/` importa `npm:zod@3.23.8` inline — fora do `package-lock.json`, invisível ao `npm audit`.
- **O que fazer:** avaliar se as edges validam arrays de entrada externa (vetor da GHSA-mrhx-c7xc-m3w5) e atualizar os pins para uma versão corrigida, ou confirmar que nenhuma edge expõe o vetor.

---

## P3 — Vulnerabilidades em devDependencies (vitest/tinypool crítica, @vitest/mocker, postcss-selector-parser)

- O gate do CI usa `--omit=dev`, então não quebram o workflow — mas continuam no lockfile. Requerem bump major de vitest; fora do escopo desta correção.

---

## P4 — Tokens Supabase da org inválidos

- `SINGU_SUPABASE_ACCESS_TOKEN` e `SUPABASE_ACCESS_TOKEN` retornam "Invalid access token" na Management API — impediu validação direta do banco `pgxfvjmuubtbowutlide` durante a correção.
- **O que você precisa fazer (Joaquim):** renovar o Personal Access Token do Supabase (org → Secrets → Actions) se quiser que sessões validem o banco.

---

## P5 — RESOLVIDO (2026-11-18) — projeto canônico travado por teste de CI

- **Estado real:** `supabase/config.toml` declara `project_id = "pgxfvjmuubtbowutlide"` (Gestão de Clientes/CRM), o banco canônico. Corrigido pela PR #183 e **travado contra regressão** por `scripts/check-supabase-project-ref.test.mjs`, que roda no CI.
- Registro histórico: a URL `doufxqlfyjuvxuezpln` que aparecia em sessões antigas é o Catálogo de Produtos (Projeto Gifts), não o Singu. Se você receber essa referência, ela está errada.

---

## P7 — RESOLVIDO (2026-11-18) — o diagnóstico anterior estava ERRADO; a causa era a allowlist de Actions

> **Leia isto antes de agir sobre CI.** A versão anterior deste item afirmava "CI da main bloqueado por
> billing — BLOQUEIO DEFINITIVO CONFIRMADO" e mandava adicionar método de pagamento. Isso estava errado
> e levaria o próximo agente a perseguir a causa errada. O texto original ficou preservado no histórico
> do git e na tag `arquivo-historico-agentes-261118`.

### Por que o diagnóstico de billing estava errado

1. **As 4 runs citadas como prova terminaram com `success`.** Verificado em 2026-11-18 pela API:

   | Run | Conclusão real |
   |---|---|
   | [40947707474](https://github.com/adm01-debug/Singu_V2/actions/runs/40947707474) attempt 2 | `success` |
   | [40949461879](https://github.com/adm01-debug/Singu_V2/actions/runs/40949461879) | `success` |
   | [40947707323](https://github.com/adm01-debug/Singu_V2/actions/runs/40947707323) | `success` |
   | [40944516179](https://github.com/adm01-debug/Singu_V2/actions/runs/40944516179) | `success` |

   Elas ficaram em fila e rodaram. Não houve bloqueio definitivo.

2. **Repositório público não consome cota.** `adm01-debug/Singu_V2` está com `visibility: PUBLIC`, e
   repositórios públicos têm minutos de GitHub Actions ilimitados em runners padrão. A tese dos
   "2.000 min/mês esgotados" era estruturalmente impossível enquanto o repo estiver público.

### Qual era a causa real da parada de 17–18/11

Entre 17/11 e 18/11 **todo** workflow do repositório falhava com `conclusion=startup_failure` e
**zero jobs** — sintoma diferente do `queued` de 29/10. Causa raiz: as permissões de Actions do
repositório estavam em **`allowed_actions: "local_only"`**, que só permite actions definidas no próprio
repositório. Isso bloqueava `actions/checkout`, `actions/setup-node`, `denoland/setup-deno` e
`peter-evans/create-pull-request` antes de qualquer job iniciar.

**Correção aplicada (2026-11-18):** `allowed_actions` passou para `selected`, com menor privilégio —
GitHub-owned permitidas, `verified_allowed: false`, e apenas os dois padrões de terceiros realmente
usados: `denoland/setup-deno@*` e `peter-evans/create-pull-request@*`.
Prova: run [44305201672](https://github.com/adm01-debug/Singu_V2/actions/runs/44305201672), 5/5 jobs `success`.

### O que estava escondido atrás disso

Com o Actions destravado, apareceram dois bloqueios reais de código que nunca tinham rodado, ambos
corrigidos pela PR #239:

- **`Typecheck` estourava a memória.** `tsc --noEmit` sobre `src/` (1819 arquivos) com `"strict": true`
  (ligado na PR #230) passava do heap padrão do Node (~2 GB): `exit 134` e
  `FATAL ERROR: Ineffective mark-compacts near heap limit`. Pico medido: 2611 MB de RSS, sem nenhum
  erro de tipo. Resolvido com `NODE_OPTIONS: --max-old-space-size=6144` no step.
- **`Security audit` falhava com 6 `high`.** `workbox-build` estava em `dependencies` sendo ferramenta
  de build, arrastando `@rollup/pluginutils` → `picomatch` (ReDoS, GHSA-fc5q-39xc-vjpf) para o escopo
  auditado. Movida para `devDependencies`.

Como o job morria no step 22 de 32, os 11 steps seguintes nunca rodavam. Depois das correções o
pipeline fechou **verde de ponta a ponta na `main`**, incluindo Playwright, matriz RLS, bundle size e
Lighthouse.

### Lição para o próximo agente

`startup_failure` com 0 jobs em **todos** os workflows não é billing nem YAML inválido: comece por
`GET /repos/{owner}/{repo}/actions/permissions` e verifique `allowed_actions`. Runs presas em `queued`
são um sintoma diferente, e em repositório público também não são cota.
