# Auditoria Estática — Rodada 27/10

Data: 22/07/2026. Comandos: `tsc --noEmit`, `eslint .`, `depcruise`, `check-bundle-size`, `check-edge-cors`, `check-edge-imports`, `supabase--linter`.

## Resultados

| Check | Status | Notas |
| --- | --- | --- |
| `tsc --noEmit` | ✅ 0 erros | Após correção em `NLPAnalysisCard.tsx` (index-signature incompatível). |
| ESLint (errors) | 🟡 216 | Todos em arquivos de teste (regras sonarjs de estilo: `prefer-specific-assertions`, `super-linear-regex`, `no-trivial-assertions`). Nenhum erro em runtime code. Ratchet CI mantém `--max-warnings=200`. |
| ESLint (warnings) | 🟡 107 | Dentro do ceiling atual. |
| `depcruise` — no-circular | ✅ 0 erros | Ciclos `useNLPAutoAnalysis ↔ useVAKAnalysis / useMetaprogramAnalysis` **fechados** nesta rodada removendo `triggerAnalysis` recursivo de dentro de `saveAnalysis`. |
| `depcruise` — outros | 🟡 101 warnings | `no-orphans` legado (arquivos de dados históricos), aceito pelo baseline. |
| `check-edge-cors` | ✅ | Nenhum wildcard fora do allowlist. |
| `check-edge-imports` | ✅ | Nenhum import esm.sh (padrão npm: mantido). |
| `check-bundle-size` | ⚠️ | Requer `vite build` prévio no CI. Sem regressão em dev. |
| `supabase--linter` | ✅ 0 CRITICAL/HIGH · 109 WARN | Todos os WARNs cobertos por baseline `mem://architecture/security/linter-baseline` (extension in public, public buckets, SECURITY DEFINER intencional). |

## Correções aplicadas nesta rodada

1. **Circular dependency crítica em hooks NLP** (`src/hooks/useNLPAutoAnalysis.ts`
   ↔ `useVAKAnalysis.ts` / `useMetaprogramAnalysis.ts`).
   - Antes: `saveAnalysis` de VAK/Metaprogram chamava `triggerAnalysis()`, que
     por sua vez chamava `saveVAKAnalysis`/`saveMetaprogramAnalysis` — ciclo com
     risco de recursão indireta. O guard `analysisQueue` mitigava, mas o key
     `"manual"` permitia colisões.
   - Depois: `saveAnalysis` grava apenas seu próprio registro. A orquestração
     paralela permanece em `useNLPAutoAnalysis.analyzeInteraction`, chamada
     explicitamente pelos consumidores (import de WhatsApp, cron de regeneração).
   - Resultado: 2 erros `no-circular` → 0.

2. **Type mismatch em Ficha360** (`src/components/ficha-360/NLPAnalysisCard.tsx`).
   - `MetaprogramProfile` local tinha `[key: string]: string | number` incompatível
     com o canônico `@/types/metaprograms`. Assinatura de índice removida.