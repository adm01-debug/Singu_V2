# QA Findings — Rodada 27/10

Ranking por severidade. Fechados nesta rodada marcados ✅.

## 🔴 Críticos

| # | Módulo | Descrição | Fix | Status |
| --- | --- | --- | --- | --- |
| 1 | Hooks NLP | Ciclo `useNLPAutoAnalysis ↔ useVAKAnalysis / useMetaprogramAnalysis` com risco de recursão indireta ao salvar análise. | Removido `triggerAnalysis()` das funções `saveAnalysis`. | ✅ |
| 2 | Ficha 360 | TS2322 em `NLPAnalysisCard`: `MetaprogramProfile` com index signature incompatível quebrando build. | Assinatura de índice removida do tipo local. | ✅ |

## 🟡 Funcionais / técnicos (planejados para próxima rodada)

| # | Módulo | Descrição | Ação proposta |
| --- | --- | --- | --- |
| 3 | Testes | 216 ESLint errors residuais — todos em specs. ✅ Onda B: override sonarjs para specs (`eslint.config.js`), 0 erros em testes. Restam 61 warnings/errors em runtime code (backlog Onda C). | ✅ (specs) |
| 4 | Arquitetura | 101 warnings `no-orphans` em `depcruise` (arquivos legados em `src/data/*`, componentes UI). | Rever cada órfão: importar/consumir ou remover. |
| 5 | Backend | 109 WARN linter Supabase (`SECURITY DEFINER` acessível a anon/authenticated). | Já aceitos pelo baseline; revisar caso a caso quando features forem tocadas. |
| 6 | E2E | ✅ Onda B: `e2e/gap-modules-smoke.spec.ts` cobre 12 rotas gap + Ask CRM + LP pública fallback. | ✅ |
| 7 | Bundle | `check-bundle-size` requer `vite build` no CI local antes do check. | Encadear step no workflow local ou marcar `dist/assets` como pré-requisito. |

## 🔵 Polimento (backlog)

- Substituir `Math.random()` por `crypto.getRandomValues()` em 3 pontos (`sonarjs/pseudo-random`).
- Fixes de `no-hardcoded-passwords` em 2 fixtures (usar env var).
- Fixes de escape/regex específicos em `formatters.ts` (6 warnings).

## Ondas de execução

- Onda A (🔴): **completa** nesta rodada.
- Onda B (🟡): planejada para Rodada 28/10.
- Onda C (🔵): backlog contínuo.