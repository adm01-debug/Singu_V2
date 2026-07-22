# ADR-021 — Ratchet Global Zero-Warning (fora de `src/`)

**Data:** 22/07/2026 · **Status:** Aceito · **Rodada:** 31/10 (Onda E)

## Contexto

ADR-020 travou `src/` em 0 erros / 0 warnings. Fora de `src/` o CI mantinha
`npx eslint . --max-warnings=200` — teto histórico herdado. Auditoria da
Rodada 31/10 mostrou que o backlog real era:

- `supabase/functions/**`: 23 parse errors + 28 warnings, todos derivados
  da regra renomeada `sonarjs/slow-regex → sonarjs/super-linear-regex`
  (23 diretivas obsoletas) + 5 `sonarjs/cognitive-complexity` em handlers
  HTTP com muitos guards lineares.
- `scripts/**`: 8 warnings pontuais (`pseudo-random` em jitter/amostragem,
  `void-use`, `single-char-in-character-classes`, `no-useless-escape`,
  `unused-import`, `prefer-const`).
- `vitest.config.ts`: 1 diretiva `slow-regex` obsoleta.

## Decisão

CI passa a rodar quatro checks distintos, todos em `--max-warnings=0`:

```
npx eslint src              --max-warnings=0
npx eslint supabase/functions --max-warnings=0
npx eslint scripts          --max-warnings=0
npx eslint .                --max-warnings=0
```

Toda supressão continua sujeita à regra do ADR-020: exige
`// eslint-disable-next-line <regra> -- <motivo>` com justificativa textual.

## Consequências

- Qualquer novo warning em qualquer área quebra o build.
- Diagnóstico rápido: cada check aponta o diretório-fonte da regressão.
- Refactors de `cognitive-complexity` em handlers HTTP viram dívida técnica
  visível (`rg "cognitive-complexity" supabase/functions`), rastreada em
  `docs/qa/findings.md` mas sem bloquear a rodada.
- `src/integrations/supabase/types.ts` permanece em `ignores` (auto-gerado).