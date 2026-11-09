# AGENTS.md — Singu_V2

Regras do dono para qualquer agente de IA. Se `docs/` contradisser, **este arquivo vence**: docs antigos são histórico, não ordem. Tudo em PT-BR (respostas, commits, PRs, comentários de código); nunca alterne para inglês.

## Contexto

Sistema ~80% pronto, em manutenção: bugs, hardening (RLS, CI, segredos), infra de produção, faltantes. **O dono não é dev**: decide negócio, o agente executa. Critério de toda decisão: qualidade + velocidade, pelo caminho mais rápido e barato em tokens.

## Projeto

- Repo `adm01-debug/Singu_V2` (privado, branch `main`). Merge em `main` = deploy automático na Vercel = **produção**.
- Supabase canônico: `pgxfvjmuubtbowutlide`. `supabase/config.toml` e `supabase/.temp/linked-project.json` apontam para ele; `scripts/check-supabase-project-ref.test.mjs` (CI) impede a divergência.
- Stack: Vite 6 + React 18 + TypeScript 5 + Tailwind 3 + shadcn/ui; TanStack Query 5; Zod 4; Supabase (Postgres, Auth, Storage, Edge Functions/Deno).
- Onde: `src/` (pages, components, hooks, domain, integrations) · `supabase/functions/` (`_shared/` = auth com CORS, rate-limit, safe-http) · `supabase/migrations/` · `tests/rls/` · `e2e/` · `scripts/` · `docs/`.

## Comandos

- `npm run dev` (porta 8080) · `build` · `typecheck` · `lint` · `test` (Vitest) · `test:e2e` (Playwright; faz build) · `check:edge-imports`.
- Edge functions: `deno check --no-lock --node-modules-dir=none supabase/functions/*/index.ts`; `deno test` nos `*_test.ts` de `_shared/`.
- Grafo (`graphify-out/graph.json`): `graphify query "<pergunta>"` **antes** de grep/leitura ampla; `npm run graphify:update` após mudar código. Instalar: `docs/GRAPHIFY.md`.

## Como trabalhar

1. Execução end-to-end via MCP; o agente resolve inteiro. Nunca "copie e cole", "roda aí", "você faz X e eu Y", passo manual quando há MCP, ou pedir ao dono para revisar/rodar/testar.
2. Decida como dev sênior. Pergunte só por custo, arquitetura, dado destrutivo em produção, trade-off de negócio ou regra 8 do Git. Para ler, nunca peça permissão.
3. **Verdade acima de validação.** Não sabe ou falhou → diga. Nunca afirme ter testado o que não rodou. Afirmação sobre código cita evidência (arquivo:linha, diff, saída); sem ela = "NÃO VERIFICADO" + motivo. Branch/commit/PR não provam nada — leia o código.
4. **Diff mínimo, zero churn.** Causa raiz, não reescrita; não refatore, renomeie ou comente o que não foi pedido. Dependência nova ou bump major só se indispensável, avisando na PR.
5. `APROVADO` = execute o plano como descrito, sem reconfirmar. Depois de pedido, não pergunte "quer que eu faça?".
6. **Uma tarefa por vez**, cada uma com sua branch/PR. Outro bug → "Próximos passos", não conserte. Travou → reporte o erro exato e pare; não contorne regra. Antes de concluir, releia o pedido.
7. **Tokens:** leia só o trecho necessário (não o repo inteiro); grafo antes de busca por texto; exploração ampla → subagente. Sem tool "por garantia", código não aplicado, replanejar a cada turno ou plano de 12 fases para fix de 20 linhas.
8. **Segredos** só em variável de ambiente/secret do serviço — nunca em código, commit ou resposta; nunca imprima ou commite `.git-credentials`, `.env`/`.env.local` (exceto `.env.example`), tokens, service_role.

## Bugs e funcionalidades

- **Diagnóstico antes de patch:** logs e estado real, ponto exato (arquivo:linha), causa. Várias causas → liste todas, corrija a pedida.
- Antes da PR: typecheck/lint/testes dos arquivos tocados. Erro herdado do `main` → "Próximos passos".
- **"Pronto"** = PR mergeada + deploy confirmado + comportamento verificado (log, query ou request real). Faltou um → diga onde parou.
- **Feature pronta** = integrada ponta a ponta (componente usado, rota, entrada na UI, hook chamado, edge function invocada e registrada, tabela com RLS, estados erro/loading/vazio, handlers, submit), sem corpo vazio, mock, hardcode ou TODO/WIP. Fluxo incompleto não é pronto. Não cabe na sessão → entregue o funcional e liste o que falta, em ordem, com arquivos. Nunca deixe código morto ou feature "quase" sem dizer.

## Comunicação

- **Resultado primeiro**, só o que muda decisão do dono. Sem introdução, recapitulação, narração, hedging, disclaimers, lição de moral, cortesia. Efeito no negócio; técnica só se perguntarem. Resposta proporcional ao fix. Não despeje log/tool — cite a linha que importa. Caminhos, comandos e links completos. Destrutivo: uma linha ("isso apaga X, sem volta — confirma?").
- **Único fechamento: exatamente 3 "Próximos passos"** (`1. [título] — [por quê] · [arquivo]`), por impacto, derivados do que viu na sessão, executáveis por você via MCP, para não-dev; nada de "adicionar testes/docs". É um menu: `1`, `1 e 3`, `APROVADO 2`, "todos" ou o bloco colado = executar na ordem, sem reconfirmar. Só consulta, sugestões já rejeitadas pelo dono ou nada pendente → `Próximos passos: nada pendente neste escopo.`

## Fluxo Git (vários agentes ao mesmo tempo)

Escrita no GitHub: MCP **`GITHUB - MCP - FOREVER`** (o padrão dá 403 em write; `git push`/`gh` só com repo autorizado na sessão).

1. Nunca commite em `main`. Branch própria, em worktree isolado (nunca `git checkout -b` no checkout principal); limpe ao fim.
2. Só escreva em branch que **você** criou nesta sessão; branch alheia é somente leitura.
3. Antes: liste PRs abertas via `github_graphql` (`pullRequests(states:OPEN){ nodes { number files { nodes { path } } } }`; `github_list_pull_requests` estoura o contexto). PR nos mesmos arquivos → pare e avise.
4. Branch de `main` atualizado: `claude/<tipo>-<slug>-<AAMMDD-HHMM>` (`fix`|`feat`|`chore`|`infra`); sem carimbo não é aceito. Uma tarefa = uma branch = uma PR. Antes de cada push, confirme que o último commit é seu.
5. Commits curtos em PT-BR com prefixo `fix:`/`feat:`/`chore:`/`infra:`, de preferência 1 atômico. Título da PR em Conventional Commits (commitlint no CI).
6. PR sempre: título = o que muda; corpo = por quê + o que foi verificado, com evidência.
7. **Mergeie sem aprovação** PR sua pronta (CI verde, sem conflito, escopo comum: front, edge function, workflow, config); squash e apague a branch.
8. **Deixe aberta e chame o dono**: DDL/migration em produção; CI/workflows, segredos, Dockerfile, stack/Swarm, Traefik; deleção de dado, arquitetura ou custo; conflito com PR alheia.
9. Conflito: rebase em `main`; `--force-with-lease` só na sua branch. Nunca force-push em `main` nem toque em branch alheia.
10. Após merge, confira o deploy e reporte. CI vermelha → leia o resumo antes de patch; se veio do seu merge, corrija em branch nova (`fix:`) na mesma sessão.
11. Reporte: link da PR + estado (mergeada / aguardando o dono / CI vermelha e por quê).

## Banco, Edge Functions, CI e código

- Migration idempotente, rollback comentado, RLS em toda tabela nova, mutação crítica em `SECURITY DEFINER`. CI exige RLS + policy em 100% de `public.*`.
- Edge function: `withAuth()`, `requireCronSecret()`, `requireWebhookSecret()`, `withAuthOrServiceRole()`; CORS scoped (wildcard só com ADR); imports `npm:pacote@versao`, nunca `esm.sh`; payload com Zod.
- CI: ESLint `--max-warnings=0` (nova violação só com `eslint-disable-next-line <regra> -- <motivo>`), `npm audit --audit-level=high`, Playwright, matriz RLS, bundle size, Lighthouse.
- Código: sem `any`; TanStack Query para dados (sem `useEffect` para fetch); UI em português; tokens HSL, sem cor hardcoded; arquivo ≤ 400 linhas; sem `console.log`.

## Ler quando

- Mexer em migration, edge function ou CI vermelho → `docs/agentes/banco-edge-ci.md`.
- Deploy, rollback, incidente → `docs/RUNBOOK.md`. Contrato de edge function → `docs/EDGE_FUNCTIONS_API.md`.
- Arquitetura → `docs/adr/`. Segurança → `docs/SECURITY.md`. Checklists de PR, hotfix → `CONTRIBUTING.md`.
- Texto-mestre integral → `docs/agentes/texto-mestre.md`. Histórico → `PENDENCIAS.md`, `ESTADO_ATUAL.md`, `HANDOFF.md`.
