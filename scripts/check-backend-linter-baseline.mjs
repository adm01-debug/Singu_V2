#!/usr/bin/env node
/**
 * Backend Linter Baseline Ratchet — Rodada 32/10 (ADR-022).
 *
 * Compara a saída atual do `supabase linter` (via CLI local ou pipe stdin)
 * contra o teto documentado em `.lovable/memory/architecture/security/linter-baseline.md`.
 * Falha em drift positivo (mais warnings do que baseline).
 *
 * Uso local:
 *   supabase inspect db linter --linked | node scripts/check-backend-linter-baseline.mjs
 *
 * Uso CI (opcional — não bloqueante inicialmente):
 *   node scripts/check-backend-linter-baseline.mjs < linter.txt
 */
import { readFileSync } from "node:fs";

const BASELINE = 22; // ver linter-baseline.md (Rodada 39/10)

const input = process.stdin.isTTY ? "" : readFileSync(0, "utf8");
if (!input.trim()) {
  console.log(`ℹ check-backend-linter-baseline: sem input em stdin (baseline=${BASELINE}); nada a comparar.`);
  process.exit(0);
}

const match = input.match(/Found\s+(\d+)\s+linter issues?/i);
if (!match) {
  console.error("✖ check-backend-linter-baseline: formato não reconhecido — esperado 'Found N linter issues'.");
  process.exit(2);
}

const current = Number.parseInt(match[1], 10);
if (current > BASELINE) {
  console.error(`✖ Drift positivo: ${current} WARN (baseline ${BASELINE}). Adicione entrada em linter-baseline.md ou corrija com REVOKE EXECUTE.`);
  process.exit(1);
}

console.log(`✔ Backend linter dentro do baseline: ${current} ≤ ${BASELINE}.`);
process.exit(0);
