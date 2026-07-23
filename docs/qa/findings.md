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
| 3 | Testes / Runtime / Externo | Ondas B/C/D zeraram `src/` e specs. **Onda E (31/10):** rename `slow-regex → super-linear-regex` em edge functions + supressões justificadas em 5 handlers HTTP e 3 amostragens em `scripts/**` (ADR-021). Repo inteiro agora **0/0**; ratchet CI global `--max-warnings=0`. | ✅ |
| 4 | Arquitetura | 101 warnings `no-orphans` em `depcruise` (arquivos legados em `src/data/*`, componentes UI). | Rever cada órfão: importar/consumir ou remover. |
| 5 | Backend | ✅ Rodada 32/10 (Onda F): 109 → **46 WARN** (−58%) via REVOKE EXECUTE em 7 anon + 33 triggers + 23 internos. Baseline documentado + ADR-022 + `scripts/check-backend-linter-baseline.mjs`. Bucket B (DEFINER→INVOKER) fica como dívida para próxima rodada. | ✅ |
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