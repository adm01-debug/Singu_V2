#!/usr/bin/env node
/**
 * Lint guard: bloqueia `Access-Control-Allow-Origin: *` em edge functions
 * fora do allowlist em scripts/edge-cors-allowlist.txt.
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = "supabase/functions";
const ALLOWLIST_FILE = "scripts/edge-cors-allowlist.txt";
const WILDCARD = /["']Access-Control-Allow-Origin["']\s*:\s*["']\*["']/;
const WILDCARD_ALT = /Access-Control-Allow-Origin:\s*\*/;

const allowlist = new Set(
  existsSync(ALLOWLIST_FILE)
    ? readFileSync(ALLOWLIST_FILE, "utf8")
        .split("\n").map(l => l.trim())
        .filter(l => l && !l.startsWith("#"))
    : []
);

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
    if (WILDCARD.test(content) || WILDCARD_ALT.test(content)) {
      const rel = relative(ROOT, full);
      const fn = rel.split("/")[0];
      if (!allowlist.has(fn)) violations.push({ file: full, fn });
    }
  }
}

walk(ROOT);

if (violations.length === 0) {
  console.log("✅ check-edge-cors: nenhum wildcard CORS fora do allowlist");
  process.exit(0);
}
console.error("❌ check-edge-cors: wildcard CORS detectado em funções não whitelisted:");
for (const v of violations) console.error(`  - ${v.fn} → ${v.file}`);
console.error(`Allowlist: ${ALLOWLIST_FILE}`);
process.exit(1);