# ADR-020 — Zero-Warning Ratchet em src

**Data:** 22/07/2026 · **Status:** Aceito · **Rodada:** 30/10 (Onda D)

## Contexto

Rodada 29/10 congelou `src/` em 0 erros / 52 warnings. Os 52 remanescentes eram: 47 `react-hooks/exhaustive-deps`, 4 `sonarjs/no-nested-functions`, 1 `sonarjs/no-floating-point-equality`. Todos auditados 1-a-1 como comportamento intencional (storage keys module-level, deps de auth estáveis, closures legítimas em métricas NLP, comparação de threshold em fixture).

## Decisão

CI passa a rodar `npx eslint src --max-warnings=0`. Toda supressão usa `// eslint-disable-next-line <regra> -- <motivo>` com justificativa textual. Diretivas sem `-- motivo` são rejeitadas em review.

## Consequências

- Novos warnings em `src/` quebram o build — força auditoria imediata.
- Sweep global (`eslint . --max-warnings=200`) mantém ceiling para specs/e2e.
- `src/integrations/supabase/types.ts` permanece em `ignores` (auto-gerado).
- Exceções documentadas viram dívida técnica visível via `rg "eslint-disable"`.
