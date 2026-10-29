# PENDENCIAS.md — Bloqueios e itens fora do escopo (Singu_V2)

Atualizado em: 2026-10-29

---

## P0 — Merge do PR `fix/ci-workflows` retido propositalmente

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

## P5 — Banco informado diverge do canônico

- A URL passada (`doufxqlfyjuvxuezpln`) é o Catálogo de Produtos (Projeto Gifts), não o banco canônico do Singu (`pgxfvjmuubtbowutlide` — Gestão de Clientes/CRM). Não bloqueou a correção; registrar para futuras sessões que precisem de SQL direto.

---

## P7 — CI da main (run 40947707474) travado — REQUER AÇÃO DO JOAQUIM

- **Workflow afetado:** CI (run [40947707474](https://github.com/adm01-debug/Singu_V2/actions/runs/40947707474), SHA `7566982e`)
- **Sintoma exato (confirmado via API):** `runner_id=0`, `runner_name=""`, `steps=[]` em AMBAS as tentativas (attempt 1 e 2). O GitHub nunca alocou um runner ubuntu-latest.
- **Causa provável confirmada:** esgotamento dos minutos gratuitos do GitHub Actions (2.000 min/mês no free tier). O run do PR #136 (40944516179) consumiu ~20+ min de ubuntu-latest (31 steps, E2E + RLS matrix). Sintoma de minutos esgotados é exatamente `runner_id=0` com job em `queued` indefinidamente.
- **Confirmar:** acesse https://github.com/settings/billing/summary e verifique "Actions" > "Minutes used this month".
- **O que você precisa fazer (Joaquim):**
  1. Acesse https://github.com/settings/billing/summary
  2. Se minutos esgotados: adicione método de pagamento OU aguarde reset no próximo ciclo de faturação
  3. Após resolver: re-execute o CI em https://github.com/adm01-debug/Singu_V2/actions/runs/40947707474 (clicar "Re-run all jobs")
  4. Se `conclusion=success`: a correção do CI principal (run 40861826188) estará validada com prova definitiva
