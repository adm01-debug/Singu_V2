---
name: Rodada 27/10 — QA Exaustivo & Hardening Funcional
description: Auditoria full-stack, quebra de ciclos NLP, fix TS Ficha360, deliverables QA (surface-map, static-audit, findings, certification).
type: feature
---

# Rodada 27/10 — QA Exaustivo & Hardening Funcional

Data: 22/07/2026.

## Correções críticas (Onda A)

1. **Ciclo NLP fechado** — `useNLPAutoAnalysis ↔ useVAKAnalysis / useMetaprogramAnalysis`.
   `saveAnalysis` de VAK/Metaprograms não invoca mais `triggerAnalysis()` (risco de
   recursão indireta e violação de camada). Orquestração paralela permanece em
   `useNLPAutoAnalysis.analyzeInteraction`, chamada explicitamente pelos consumidores.
   Resultado: `depcruise no-circular` 2 → 0.

2. **Build fix Ficha360** — `NLPAnalysisCard.tsx` tinha `MetaprogramProfile` local
   com `[key: string]: string | number`, incompatível com o canônico
   `@/types/metaprograms`. Assinatura de índice removida.

## Auditoria consolidada

- TS: 0 erros. Ciclos: 0. CORS edge: ok. Imports esm.sh: 0.
- Supabase linter: 0 CRITICAL/HIGH, 109 WARN dentro do baseline.
- ESLint: 107 warn + 216 err de estilo — todos em specs (`sonarjs`).

## Deliverables (`docs/qa/`)

- `surface-map.md` — 121 páginas, 109 edge functions, 378 hooks.
- `static-audit.md` — resultados por check + correções aplicadas.
- `findings.md` — tickets 🔴 (fechados) / 🟡 (Rodada 28) / 🔵 (backlog).
- `CERTIFICATION_10_10.md` — dashboard executivo.

## Próxima rodada (Onda B)

Zerar ESLint em testes, migrar ratchet CI para `--max-warnings=0`, adicionar E2E
smoke para Ask CRM, ABM Campaigns, Intent Setup, LP públicas, Deal Rooms
públicos, Enrichment, Territórios, Nurturing, NPS, Custom Reports.