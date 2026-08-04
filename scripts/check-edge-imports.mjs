#!/usr/bin/env node
/**
 * Lint guard: bloqueia imports `https://esm.sh/...` em edge functions.
 *
 * Motivo: `esm.sh` ocasionalmente retorna 502/503 e quebra o boot da função.
 * Padrão preferido: `npm:pacote@versao` (resolvido nativamente pelo bundler Supabase).
 *
 * Uso: `node scripts/check-edge-imports.mjs` — exit 0 se limpo, exit 1 se violação.
 * Referenciado em `docs/runbook.md` seção "Deploy de Edge Functions".
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "supabase/functions";
const FORBIDDEN = /from\s+["']https:\/\/esm\.sh\//g;
const violations = [];

function walk(dir) {
  let entries;
  try { entries = readdirSync(dir); } catch { return; }
  for (const name of entries) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) { walk(full); continue; }
    if (!full.endsWith(".ts")) continue;
    const content = readFileSync(full, "utf8");
    const matches = content.match(FORBIDDEN);
    if (matches) violations.push({ file: full, count: matches.length });
  }
}

walk(ROOT);

if (violations.length === 0) {
  console.log("✅ check-edge-imports: nenhum import esm.sh encontrado");
  process.exit(0);
}

console.error("❌ check-edge-imports: imports esm.sh detectados (use npm: ao invés):");
for (const v of violations) console.error(`  - ${v.file} (${v.count} ocorrência(s))`);
process.exit(1);
