#!/usr/bin/env node
// scripts/audit-ausentes.mjs - versão definitiva
//
// Lista as tabelas/views que o código chama com `.from('x')` em src/ e que NÃO existem em
// src/integrations/supabase/types.ts. Grava scripts/tabelas-ausentes.{json,csv,md}.
//
// Uso: node scripts/audit-ausentes.mjs [--raiz <repo>] [--saida <pasta>] [--dry-run]
//   --raiz     raiz do repositório (padrão: a pasta acima de scripts/, de qualquer cwd)
//   --saida    onde gravar os três arquivos (padrão: <raiz>/scripts)
//   --dry-run  só imprime o resumo, não grava nada
// Exit: 0 = auditoria feita (mesmo com ausentes: é relatório, não gate) · 2 = entrada inválida
// (types.ts ausente ou sem nenhuma tabela reconhecida, src/ ausente, flag sem valor).
//
// `supabase.storage.from('bucket')` não conta (é bucket, não tabela). Limite conhecido:
// `.from(variavel)` não é resolvido.
import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const RAIZ_PADRAO = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Tabelas e views declaradas no types.ts (`nome: { Row: {`). */
export function tabelasDoTypes(types) {
  const tabelas = new Set();
  for (const m of types.matchAll(/^\s{6}([a-z][a-z0-9_]*): \{\s*Row: \{/gm)) tabelas.add(m[1]);
  return tabelas;
}

export function listarFontes(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))) {
    const p = join(dir, e.name);
    if (e.isDirectory()) listarFontes(p, acc);
    else if (/\.(ts|tsx)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

/** Chamadas `.from('tabela')` de um arquivo: [{ tabela, linha }] (sem `storage.from`). */
export function chamadasFrom(conteudo) {
  const achados = [];
  // Aceita `.from('x')`, `.from('x' as never)` e `.from<T>('x')`.
  for (const m of conteudo.matchAll(/\.from\s*(?:<[^>()]*>)?\(\s*['"`]([a-z][a-z0-9_]*)['"`]/g)) {
    if (/\bstorage\s*$/.test(conteudo.slice(Math.max(0, m.index - 40), m.index))) continue;
    const inicio = conteudo.lastIndexOf("\n", m.index - 1) + 1;
    const fim = conteudo.indexOf("\n", m.index);
    achados.push({ tabela: m[1], linha: conteudo.slice(inicio, fim === -1 ? conteudo.length : fim).trim() });
  }
  return achados;
}

/** Cruza os arquivos de <raiz>/src com o types.ts. Devolve a lista de ausentes já ordenada. */
export function auditar(raiz) {
  const tabelas = tabelasDoTypes(readFileSync(join(raiz, "src/integrations/supabase/types.ts"), "utf8"));
  if (tabelas.size === 0) {
    throw new Error("nenhuma tabela reconhecida em src/integrations/supabase/types.ts (o formato mudou?)");
  }
  const info = new Map();
  for (const f of listarFontes(join(raiz, "src"))) {
    const arquivo = relative(raiz, f).replace(/\\/g, "/");
    for (const { tabela, linha } of chamadasFrom(readFileSync(f, "utf8"))) {
      if (!info.has(tabela)) info.set(tabela, { arquivos: new Set(), exemplos: [] });
      info.get(tabela).arquivos.add(arquivo);
      info.get(tabela).exemplos.push(linha);
    }
  }
  const ausentes = [];
  for (const [tabela, entry] of info.entries()) {
    if (tabelas.has(tabela)) continue;
    ausentes.push({
      tabela,
      qtd_arquivos: entry.arquivos.size,
      arquivos: [...entry.arquivos].sort(),
      exemplos_uso: [...new Set(entry.exemplos)].slice(0, 5),
    });
  }
  // Empate por nome: a ordem não pode depender da ordem em que o disco lista os arquivos.
  return ausentes.sort((a, b) => b.qtd_arquivos - a.qtd_arquivos || (a.tabela < b.tabela ? -1 : 1));
}

const csvCampo = (s) => `"${String(s).replace(/"/g, '""')}"`;

export function paraCsv(ausentes) {
  const linhas = ["tabela,qtd_arquivos,arquivos"];
  for (const r of ausentes) linhas.push(`${csvCampo(r.tabela)},${r.qtd_arquivos},${csvCampo(r.arquivos.join("; "))}`);
  return linhas.join("\n");
}

export function paraMarkdown(ausentes) {
  const md = [];
  md.push("# Tabelas/views ausentes no Singu (referenciadas pelo código do Lovable)");
  md.push("");
  md.push(`**Total: ${ausentes.length}**`);
  md.push("");
  md.push("Gerado por `node scripts/audit-ausentes.mjs` — compara o schema do Singu (PostgREST OpenAPI de `pgxfvjmuubtbowutlide.supabase.co`) com as chamadas `.from()` em `src/`.");
  md.push("");
  md.push("Ordenado por impacto (mais arquivos dependentes primeiro).");
  md.push("");
  md.push("| # | Tabela | # arq | Arquivos |");
  md.push("|---:|---|---:|---|");
  ausentes.forEach((r, i) => {
    const arqs = r.arquivos.slice(0, 3).map((a) => "`" + a.replace(/\|/g, "\\|") + "`").join(", ");
    const more = r.arquivos.length > 3 ? " …" : "";
    md.push(`| ${i + 1} | \`${r.tabela}\` | ${r.qtd_arquivos} | ${arqs}${more} |`);
  });
  md.push("");
  md.push("## Artefatos relacionados");
  md.push("- `scripts/tabelas-ausentes.json` — completo, com `exemplos_uso` de cada tabela");
  md.push("- `scripts/tabelas-ausentes.csv` — formato CSV para planilha/importar em outro agente");
  return md.join("\n");
}

function valorDe(argv, flag) {
  const i = argv.indexOf(flag);
  if (i === -1) return null;
  if (!argv[i + 1] || argv[i + 1].startsWith("--")) throw new Error(`${flag} exige um caminho`);
  return argv[i + 1];
}

export function main(argv) {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log("Uso: node scripts/audit-ausentes.mjs [--raiz <repo>] [--saida <pasta>] [--dry-run]\n"
      + "Lista tabelas usadas em .from() de src/ que não existem em src/integrations/supabase/types.ts.");
    return 0;
  }
  const raiz = resolve(valorDe(argv, "--raiz") ?? RAIZ_PADRAO);
  const saida = resolve(valorDe(argv, "--saida") ?? join(raiz, "scripts"));
  for (const exigido of ["src/integrations/supabase/types.ts", "src"]) {
    if (!existsSync(join(raiz, exigido))) throw new Error(`${join(raiz, exigido)} não existe (use --raiz)`);
  }
  const ausentes = auditar(raiz);
  console.log(`OK ${ausentes.length} ausentes`);
  if (argv.includes("--dry-run")) {
    for (const r of ausentes) console.log(`  ${r.tabela} (${r.qtd_arquivos} arq)`);
    console.log("  (--dry-run: nada gravado)");
    return 0;
  }
  mkdirSync(saida, { recursive: true });
  writeFileSync(join(saida, "tabelas-ausentes.json"), JSON.stringify(ausentes, null, 2));
  writeFileSync(join(saida, "tabelas-ausentes.csv"), paraCsv(ausentes));
  writeFileSync(join(saida, "tabelas-ausentes.md"), paraMarkdown(ausentes));
  const rel = relative(raiz, saida).replace(/\\/g, "/") || ".";
  for (const ext of ["md", "csv", "json"]) console.log(`  ${rel}/tabelas-ausentes.${ext}`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (erro) {
    console.error(`ERRO: ${erro.message}`);
    process.exit(2);
  }
}
