# Certificação QA 10/10 — Rodada 27/10

> **Registro histórico.** Os resultados abaixo valem somente para a revisão e o
> ambiente daquela rodada; use a CI atual e a auditoria mais recente como evidência.
> Com a configuração atual, `tsc --noEmit` no projeto raiz não verifica `src/`.
> Use `npm run typecheck` para validar explicitamente o aplicativo e a configuração Node.

**Data:** 22 de julho de 2026
**Escopo:** auditoria full-stack (frontend + edge functions + banco), correção crítica e baseline de qualidade.

## Dashboard

| Dimensão | Meta | Resultado | Status |
| --- | --- | --- | --- |
| TypeScript (`tsc --noEmit`) | 0 erros | 0 | ✅ |
| Ciclos de dependência (`depcruise no-circular`) | 0 | 0 | ✅ |
| Backend linter (CRITICAL/HIGH) | 0 | 0 | ✅ |
| CORS scoped edge functions | ok | ok | ✅ |
| Edge imports (esm.sh) | 0 | 0 | ✅ |
| ESLint runtime code (src/**) | 0 erros | 0 | ✅ |
| ESLint runtime warnings (src/**) | ratchet ≤ 0 (Onda D) | **0** | ✅ |
| ESLint total (repo inteiro) | ratchet ≤ 0 (Onda E) | **0** | ✅ |
| ESLint supabase/functions | ratchet ≤ 0 (Onda E) | **0** | ✅ |
| ESLint scripts/** | ratchet ≤ 0 (Onda E) | **0** | ✅ |
| Backend linter WARN (baseline documentado) | ≤ 46 (Onda F / ADR-022) | **46** | ✅ |
| Cobertura E2E smoke | 3 jornadas críticas | 3 | ✅ |

## Deliverables desta rodada

- `docs/qa/surface-map.md` — inventário completo (121 páginas, 109 edge functions, 378 hooks).
- `docs/qa/static-audit.md` — resultados detalhados por check.
- `docs/qa/findings.md` — tickets por severidade (🔴 fechados / 🟡 planejados / 🔵 backlog).
- Correção crítica: quebra de ciclo `useNLPAutoAnalysis ↔ useVAKAnalysis/useMetaprogramAnalysis`.
- Correção de build: `MetaprogramProfile` em `NLPAnalysisCard.tsx`.

## Próximas rodadas

- **Onda D (Rodada 30/10 — concluída):** `src/` travado em 0/0 via 52 supressões
  justificadas (`ADR-020`). Ratchet CI `src --max-warnings=0` ativo.
- **Onda E (Rodada 31/10 — concluída):** repo inteiro em 0/0. Rename global
  `sonarjs/slow-regex → super-linear-regex` em edge functions + suppressões
  justificadas em 5 handlers HTTP e 3 amostragens estatísticas (`ADR-021`).
- **Onda F (Rodada 32/10 — concluída):** backend linter 109 → 46 WARN (−58%)
  via `REVOKE EXECUTE` em 7 anon + 33 triggers + 23 internos. ADR-022 +
  `scripts/check-backend-linter-baseline.mjs` + baseline documentado por
  função em `linter-baseline.md`.