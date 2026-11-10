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
 *
 * Entrada: texto com "Found N linter issues" (ou "No linter issues found" = 0). Se houver mais de
 * uma contagem no texto, vale a MAIOR. Com --strict, entrada vazia é erro (use quando o passo
 * for bloqueante: linter que não rodou não pode aprovar).
 * Exit: 0 = dentro do baseline (ou sem entrada, fora do --strict) · 1 = drift positivo ·
 *       2 = formato não reconhecido, entrada vazia com --strict ou stdin ilegível.
 */

const BASELINE = 12; // piso arquitetural — ver linter-baseline.md (Rodada 42/10)

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log(`Uso: <saída do linter> | node scripts/check-backend-linter-baseline.mjs [--strict]\nFalha se a contagem de issues passar do baseline (${BASELINE}).`);
  process.exit(0);
}
const strict = args.includes("--strict");

// Lê o stdin como stream: `readFileSync(0)` estoura EAGAIN quando o pipe ainda não tem dados
// (quem escreve é mais lento que o Node), o que derrubava o script com entrada válida.
let input = "";
if (!process.stdin.isTTY) {
  try {
    process.stdin.setEncoding("utf8");
    for await (const pedaco of process.stdin) input += pedaco;
  } catch (erro) {
    console.error(`✖ check-backend-linter-baseline: não consegui ler o stdin (${erro?.code ?? erro?.message}).`);
    process.exit(2);
  }
}
if (!input.trim()) {
  if (strict) {
    console.error("✖ check-backend-linter-baseline: sem input em stdin e --strict ligado — o linter não rodou.");
    process.exit(2);
  }
  console.log(`ℹ check-backend-linter-baseline: sem input em stdin (baseline=${BASELINE}); nada a comparar.`);
  process.exit(0);
}

const contagens = [...input.matchAll(/Found\s+(\d+)\s+linter issues?/gi)].map((m) => Number.parseInt(m[1], 10));
if (/\bNo linter issues found\b/i.test(input)) contagens.push(0);
if (contagens.length === 0) {
  console.error("✖ check-backend-linter-baseline: formato não reconhecido — esperado 'Found N linter issues'.");
  process.exit(2);
}

const current = Math.max(...contagens);
if (current > BASELINE) {
  console.error(`✖ Drift positivo: ${current} WARN (baseline ${BASELINE}). Adicione entrada em linter-baseline.md ou corrija com REVOKE EXECUTE.`);
  process.exit(1);
}

console.log(`✔ Backend linter dentro do baseline: ${current} ≤ ${BASELINE}.`);
if (current < BASELINE) {
  console.log(`ℹ Abaixo do baseline: reduza BASELINE para ${current} neste script e em linter-baseline.md para travar o ganho.`);
}
process.exit(0);
