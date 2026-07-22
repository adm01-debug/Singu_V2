---
name: Rodada 31/10 — Onda E Global Zero-Warning Ratchet
description: Repo inteiro em 0/0 ESLint; rename slow-regex→super-linear-regex em edge functions; ratchet global ativo
type: feature
---
# Rodada 31/10 — Onda E: Global Zero-Warning Ratchet

## Baseline (pós Onda D)

- `src/`: 0/0 (travado desde ADR-020).
- Sweep global: teto histórico `--max-warnings=200`.
- `supabase/functions/**`: 23 parse errors + 28 warnings.
- `scripts/**`: 8 warnings.
- `vitest.config.ts`: 1 diretiva obsoleta.

## Ações aplicadas

- `supabase/functions/**`: rename `sonarjs/slow-regex` → `sonarjs/super-linear-regex` em 12 arquivos (23 diretivas).
- `supabase/functions/**`: 5 disables justificados de `sonarjs/cognitive-complexity` em handlers HTTP + validador declarativo.
- `scripts/migration/cdc/replay.ts`: `let` → `const` (fix real).
- `scripts/migration/storage/_lib.ts`: disables justificados `pseudo-random` (jitter) + `void-use` (drenagem de queue).
- `scripts/migration/storage/copy-large.ts`: regex sem escape desnecessário.
- `scripts/migration/storage/verify-counts.ts`: disable `pseudo-random` (amostragem).
- `scripts/migration/verify/storage-bytes.ts`: disable `pseudo-random` (amostragem).
- `scripts/migration/verify/row-diff.ts`: remover import morto `parseCsv`.
- `vitest.config.ts`: rename `slow-regex` → `super-linear-regex`.

## Estado final (10/10)

| Métrica | Antes | Depois |
| --- | --- | --- |
| `eslint src` | 0/0 | **0/0** |
| `eslint supabase/functions` | 23 err / 28 warn | **0/0** |
| `eslint scripts` | 0 err / 8 warn | **0/0** |
| `eslint .` (repo) | ≤200 warn | **0/0** |
| CI ratchet | `. --max-warnings=200` | **`. --max-warnings=0`** (+ 3 checks por dir) |

## Política vigente

Todo o repo — não apenas `src/` — passa a exigir supressão justificada
(`-- <motivo>`) para novos warnings. ADR-021 formaliza a política.
