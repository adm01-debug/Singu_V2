---
name: Rodada 29/10 — Onda C polimento ESLint runtime
description: Runtime zerado (0 erros), ratchet CI ativo, super-linear-regex renomeado, types.ts ignorado
type: feature
---
# Rodada 29/10 — Onda C: Polimento ESLint Runtime & Ratchet CI

## Inventário inicial (baseline)

`npx eslint src` acusava **29 erros / 94 warnings**.

| Regra | Erros | Warnings | Diagnóstico |
| --- | --- | --- | --- |
| `sonarjs/super-linear-regex` | 21 | 4 | Regra renomeada pelo sonarjs; disables antigos apontavam `slow-regex` (obsoleto). |
| `parse` (Unused eslint-disable) | 0 | 38 | Diretivas `sonarjs/slow-regex` obsoletas + directivas em specs onde a regra foi silenciada na Onda B. |
| `react-hooks/exhaustive-deps` | 0 | 47 | Casos legítimos que exigem análise 1-a-1 — mantidos. |
| `sonarjs/unused-import` | 4 | 0 | Imports genuinamente órfãos. |
| `sonarjs/no-nested-functions` | 0 | 4 | Aceitos (warn). |
| `sonarjs/no-floating-point-equality` | 1 | 1 | 1 corrigido, 1 aceito (warn em warning global). |
| `sonarjs/no-redundant-optional` | 1 | 0 | Test file. |
| `@typescript-eslint/no-explicit-any` | 1 | 0 | `UnifiedTimelineEvent.metadata`. |
| `sonarjs/no-duplicate-in-composite` | 1 | 0 | `src/integrations/supabase/types.ts` (auto-gerado). |

## Correções aplicadas

1. **Rename global** `sonarjs/slow-regex` → `sonarjs/super-linear-regex` em 25 arquivos (`rg -l ... | xargs sed`). Fechou 21 erros + 38 warnings de directiva stale.
2. **Unused imports removidos**: `ConnectionCard.tsx` (`Json`), `CadenceRulesConfig.tsx` (`TablesInsert`, `TablesUpdate`), `LandingPages.tsx` (`Json`).
3. **`no-explicit-any`**: `useUnifiedTimeline.ts` — tentativa inicial de `unknown` quebrou consumidores (6 erros TS em `UnifiedTimeline.tsx`); restaurado `Record<string, any>` com `eslint-disable-next-line` justificado (payload heterogêneo consumido por múltiplos renderers).
4. **`no-floating-point-equality`**: `TemporalHeatmap.tsx` — comparação `i === 0.1` trocada por `idx === 0` do `map`.
5. **`no-redundant-optional`**: `ActiveFiltersBar.onAfterRemove.test.tsx` — `(() => void) | undefined` → `() => void` (o `?` já cobre undefined).
6. **`types.ts` auto-gerado**: adicionado a `ignores` do `eslint.config.js` — não deve ser editado manualmente (regenerado a cada migração).
7. **Auto-fix `--fix`** removeu 13 directivas obsoletas restantes em `test/setup.ts`, `test/telemetry/**`, `VersionBadge.tsx`, `VoiceInput.tsx`, `voice-system-exhaustive.test.ts`.

## Estado final (10/10)

| Métrica | Antes | Depois |
| --- | --- | --- |
| ESLint erros (src) | 29 | **0** |
| ESLint warnings (src) | 94 | **52** |
| TypeScript (`tsgo --noEmit`) | 0 | **0** |

Os 52 warnings remanescentes são:
- 47 `react-hooks/exhaustive-deps` (revisão case-by-case, backlog contínuo).
- 4 `sonarjs/no-nested-functions` (aceitos como warn, closures legítimas).
- 1 `sonarjs/no-floating-point-equality` (comparação em contexto de teste de threshold).

## Ratchet CI ativado

`.github/workflows/ci.yml` agora executa:
```
npx eslint src --max-warnings=52   # runtime frozen na baseline Onda C
npx eslint . --max-warnings=200    # ceiling histórico (specs + e2e)
```
PRs que aumentarem qualquer um dos dois budgets falham automaticamente.

## ReDoS — veredicto das 21 regex super-linear

Todas eram falsos-positivos verificados individualmente na Onda anterior (marker `regex verified non-catastrophic`). Não há input de atacante concreto (todas operam sobre dados internos ou já normalizados). Nenhuma refactor exponencial foi necessária — apenas atualizar o nome da regra no comentário `eslint-disable-next-line`.

## Arquivos tocados (10)

- `.github/workflows/ci.yml`
- `eslint.config.js`
- `src/components/admin/conexoes/ConnectionCard.tsx`
- `src/components/crm/CadenceRulesConfig.tsx`
- `src/pages/LandingPages.tsx`
- `src/hooks/useUnifiedTimeline.ts`
- `src/components/intel/TemporalHeatmap.tsx`
- `src/components/interactions/__tests__/ActiveFiltersBar.onAfterRemove.test.tsx`
- `docs/qa/CERTIFICATION_10_10.md`
- `docs/qa/findings.md`

Mais 25 arquivos com sed rename `slow-regex` → `super-linear-regex` (patch textual único, zero mudança semântica).

## Próxima onda

- Rodada 30/10: atacar os 47 `react-hooks/exhaustive-deps` por lotes de 10 (auditoria 1-a-1) para levar runtime warnings a 0.