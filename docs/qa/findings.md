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
| 3 | Testes | 216 ESLint errors residuais — todos em specs (`sonarjs/prefer-specific-assertions`, `super-linear-regex`, `no-trivial-assertions`). | Corrigir por lote nas suítes `src/test/**` e `src/data/__tests__/**`; migrar ratchet para `--max-warnings=0`. |
| 4 | Arquitetura | 101 warnings `no-orphans` em `depcruise` (arquivos legados em `src/data/*`, componentes UI). | Rever cada órfão: importar/consumir ou remover. |
| 5 | Backend | 109 WARN linter Supabase (`SECURITY DEFINER` acessível a anon/authenticated). | Já aceitos pelo baseline; revisar caso a caso quando features forem tocadas. |
| 6 | E2E | Cobertura ausente em Ask CRM, ABM Campaigns, Intent Setup, LP públicas, Deal Rooms públicos, Enrichment, Territórios, Nurturing, NPS, Custom Reports. | Adicionar smoke Playwright por módulo (1 happy-path cada). |
| 7 | Bundle | `check-bundle-size` requer `vite build` no CI local antes do check. | Encadear step no workflow local ou marcar `dist/assets` como pré-requisito. |

## 🔵 Polimento (backlog)

- Substituir `Math.random()` por `crypto.getRandomValues()` em 3 pontos (`sonarjs/pseudo-random`).
- Fixes de `no-hardcoded-passwords` em 2 fixtures (usar env var).
- Fixes de escape/regex específicos em `formatters.ts` (6 warnings).

## Ondas de execução

- Onda A (🔴): **completa** nesta rodada.
- Onda B (🟡): planejada para Rodada 28/10.
- Onda C (🔵): backlog contínuo.