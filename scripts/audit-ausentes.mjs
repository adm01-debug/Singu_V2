// scripts/audit-ausentes.mjs - versão definitiva
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const TYPES = readFileSync("src/integrations/supabase/types.ts", "utf8");
const tables = new Set();
for (const m of TYPES.matchAll(/^\s{6}([a-z][a-z0-9_]+): \{\s*Row: \{/gm)) {
  tables.add(m[1]);
}

function walk(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(ts|tsx)$/.test(e.name)) acc.push(p);
  }
  return acc;
}
const files = walk("src");

const reFrom = /\.from\(\s*['"`]([a-z][a-z0-9_]+)['"`]\s*\)/g;
const info = new Map();
for (const f of files) {
  const c = readFileSync(f, "utf8");
  for (const m of c.matchAll(reFrom)) {
    const t = m[1];
    if (!info.has(t)) info.set(t, { arquivos: new Set(), exemplos: [] });
    const entry = info.get(t);
    entry.arquivos.add(f.replace(/\\/g, "/"));
    const idx = c.indexOf(m[0]);
    const start = Math.max(0, c.lastIndexOf("\n", idx - 1) + 1);
    const end = c.indexOf("\n", idx);
    entry.exemplos.push(c.slice(start, end).trim());
  }
}

const outJson = [];
for (const [tabela, entry] of info.entries()) {
  if (!tables.has(tabela)) {
    outJson.push({
      tabela,
      qtd_arquivos: entry.arquivos.size,
      arquivos: [...entry.arquivos].sort(),
      exemplos_uso: [...new Set(entry.exemplos)].slice(0, 5),
    });
  }
}
outJson.sort((a, b) => b.qtd_arquivos - a.qtd_arquivos);

writeFileSync("scripts/tabelas-ausentes.json", JSON.stringify(outJson, null, 2));

const csvLines = ["tabela,qtd_arquivos,arquivos"];
for (const r of outJson) {
  const clean = r.arquivos.join("; ");
  csvLines.push(`"${r.tabela}",${r.qtd_arquivos},"${clean}"`);
}
writeFileSync("scripts/tabelas-ausentes.csv", csvLines.join("\n"));

const md = [];
md.push("# Tabelas/views ausentes no Singu (referenciadas pelo código do Lovable)");
md.push("");
md.push(`**Total: ${outJson.length}**`);
md.push("");
md.push("Gerado por `node scripts/audit-ausentes.mjs` — compara o schema do Singu (PostgREST OpenAPI de `pgxfvjmuubtbowutlide.supabase.co`) com as chamadas `.from()` em `src/`.");
md.push("");
md.push("Ordenado por impacto (mais arquivos dependentes primeiro).");
md.push("");
md.push("| # | Tabela | # arq | Arquivos |");
md.push("|---:|---|---:|---|");
for (let i = 0; i < outJson.length; i++) {
  const r = outJson[i];
  const arqs = r.arquivos.slice(0, 3).map((a) => "`" + a + "`").join(", ");
  const more = r.arquivos.length > 3 ? " …" : "";
  md.push(`| ${i + 1} | \`${r.tabela}\` | ${r.qtd_arquivos} | ${arqs}${more} |`);
}
md.push("");
md.push("## Artefatos relacionados");
md.push("- `scripts/tabelas-ausentes.json` — completo, com `exemplos_uso` de cada tabela");
md.push("- `scripts/tabelas-ausentes.csv` — formato CSV para planilha/importar em outro agente");
writeFileSync("scripts/tabelas-ausentes.md", md.join("\n"));

console.log(`OK ${outJson.length} ausentes`);
console.log(`  scripts/tabelas-ausentes.md`);
console.log(`  scripts/tabelas-ausentes.csv`);
console.log(`  scripts/tabelas-ausentes.json`);
