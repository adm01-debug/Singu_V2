// scripts/diff-tables.mjs - Cruzar tabelas/views usadas no codigo vs schema novo
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "src";
const TYPES = readFileSync("src/integrations/supabase/types.ts", "utf8");

// Extrair tabelas/views existentes
const tables = new Set();
for (const m of TYPES.matchAll(/^\s{6}([a-z][a-z0-9_]+): \{\s*Row: \{/gm)) {
  tables.add(m[1]);
}

// Varrer src
function walk(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(ts|tsx)$/.test(e.name)) acc.push(p);
  }
  return acc;
}
const files = walk(ROOT);

// Coletar referencias .from('x'), .rpc('x')
const re = /\.(from|rpc)\(\s*['"`]([a-z][a-z0-9_]+)['"`]\s*\)/g;
const fromUse = new Map();
for (const f of files) {
  const c = readFileSync(f, "utf8");
  for (const m of c.matchAll(re)) {
    const t = m[2];
    if (!fromUse.has(t)) fromUse.set(t, new Set());
    fromUse.get(t).add(f.replace(/\\/g, "/"));
  }
}

const missing = [...fromUse.entries()].filter(([t]) => !tables.has(t));
const existing = [...fromUse.entries()].filter(([t]) => tables.has(t));

console.log(`Tabelas usadas: ${fromUse.size}`);
console.log(`Ja existem no schema novo: ${existing.length}`);
console.log(`Ausentes: ${missing.length}\n`);
console.log("=== AUSENTES (tabela: arquivos) ===");
for (const [t, fs] of missing.sort((a, b) => b[1].size - a[1].size)) {
  const list = [...fs].slice(0, 5).join(", ");
  const more = fs.size > 5 ? ` (+${fs.size - 5})` : "";
  console.log(`${t}: ${fs.size} arq  -> ${list}${more}`);
}

// Sugestoes: tabelas com prefixo parecido
console.log("\n=== POSSIVEIS SUBSTITUICOES (por similaridade) ===");
const existingArr = [...tables];
for (const [t] of missing) {
  // tokens
  const tokens = t.split("_");
  const candidates = existingArr
    .filter((e) => {
      let s = 0;
      for (const tok of tokens) if (e.includes(tok)) s++;
      return s >= Math.max(1, Math.floor(tokens.length / 2));
    })
    .slice(0, 5);
  if (candidates.length) console.log(`${t} -> ${candidates.join(" | ")}`);
}
