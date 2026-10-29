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

## P6 — CI do PR #136 em andamento (bloqueio temporário de tempo)

- **Workflow afetado:** CI (run [40944516179](https://github.com/adm01-debug/Singu_V2/actions/runs/40944516179))
- **Motivo do bloqueio:** Step 28 "Run RLS matrix tests" conecta ao banco de produção e executa 4 cenários (anon, user_a, user_b, user_admin) — duração normal de 5–30 min. Step iniciou às 20:11:05Z; steps 1–27 todos ✅ success.
- **Restrição ativa:** proibido fazer commit na branch `claude/loving-shannon-2i1k7o` enquanto CI in_progress (cancelaria o run e reiniciaria do zero ~45–60 min).
- **O que acontece automaticamente:** quando step 28 concluir com success → merge squash PR #136 → aguardar CI da main → commitar RELATORIO_CI.md e PENDENCIAS.md na main.
- **Não é um bloqueio permanente** — é dependência de tempo de execução do CI.
