#!/usr/bin/env node
/**
 * Lint guard: bloqueia imports `https://esm.sh/...` em edge functions.
 *
 * Motivo: `esm.sh` ocasionalmente retorna 502/503 e quebra o boot da função.
 * Padrão preferido: `npm:pacote@versao` (resolvido nativamente pelo bundler Supabase).
 *
 * Uso: `node scripts/check-edge-imports.mjs [--root <raiz-do-repo>]` (padrão: diretório atual)
 * Exit: 0 se limpo · 1 se violação · 2 = uso/ambiente inválido.
 * Referenciado em `docs/runbook.md` seção "Deploy de Edge Functions".
 *
 * Pega toda forma de import: `import x from`, `export ... from`, `import "..."` (efeito colateral),
 * `import("...")` dinâmico, `http://`, subdomínios (`cdn.esm.sh`) e import maps
 * (`deno.json`, `deno.jsonc`, `import_map.json`). Linha que é só comentário não conta.
 * Limite conhecido: URL montada em tempo de execução (`import(base + nome)`) não é resolvida.
 */
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const CODIGO = /\.(ts|tsx|js|jsx|mjs|cjs)$/;
const IMPORT_MAP = /^(deno\.jsonc?|import_map\.json)$/;
const ESM_SH = /^https?:\/\/(?:[a-z0-9-]+\.)*esm\.sh(?:[/:?#]|$)/i;
// Especificador de módulo: depois de `from`, de `import` (efeito colateral) ou de `import(`.
const ESPECIFICADOR = /\bfrom\s*(["'])([^"'\n]+)\1|\bimport\s*(["'])([^"'\n]+)\3|\bimport\s*\(\s*(["'`])([^"'`\n]+)\5/g;

/** Apaga (mantendo a contagem de linhas) as linhas que são só comentário. */
function semLinhasDeComentario(texto) {
  let emBloco = false;
  return texto.split("\n").map((linha) => {
    const t = linha.trim();
    if (emBloco) {
      if (t.includes("*/")) emBloco = false;
      return "";
    }
    if (t.startsWith("//")) return "";
    if (t.startsWith("/*")) {
      if (!t.includes("*/")) emBloco = true;
      else if (!t.endsWith("*/")) return linha;
      return "";
    }
    return linha;
  }).join("\n");
}

/** Imports de esm.sh num arquivo de código: [{ linha, especificador }]. */
export function acharImportsEsmSh(conteudo) {
  const texto = semLinhasDeComentario(conteudo);
  const achados = [];
  for (const m of texto.matchAll(ESPECIFICADOR)) {
    const especificador = m[2] ?? m[4] ?? m[6];
    if (ESM_SH.test(especificador)) achados.push({ linha: texto.slice(0, m.index).split("\n").length, especificador });
  }
  return achados;
}

/** Entradas de esm.sh num import map (deno.json / import_map.json): qualquer string que seja URL do esm.sh. */
export function acharEsmShEmImportMap(conteudo) {
  const achados = [];
  const linhas = conteudo.split("\n");
  linhas.forEach((linha, i) => {
    if (linha.trim().startsWith("//")) return;
    for (const m of linha.matchAll(/"((?:\\.|[^"\\])*)"/g)) {
      if (ESM_SH.test(m[1])) achados.push({ linha: i + 1, especificador: m[1] });
    }
  });
  return achados;
}

function listarArquivos(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (e.name === "node_modules") continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) listarArquivos(p, acc);
    else if (e.isFile() && (CODIGO.test(e.name) || IMPORT_MAP.test(e.name))) acc.push(p);
  }
  return acc;
}

export function main(argv) {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log("Uso: node scripts/check-edge-imports.mjs [--root <raiz-do-repo>]\n"
      + "Falha (exit 1) se alguma edge function importar de esm.sh (use npm:pacote@versao). Exit 2 = uso/ambiente inválido.");
    return 0;
  }
  const iRoot = argv.indexOf("--root");
  if (iRoot !== -1 && !argv[iRoot + 1]) { console.error("❌ check-edge-imports: --root exige um diretório"); return 2; }
  const raiz = resolve(iRoot === -1 ? "." : argv[iRoot + 1]);
  const funcoes = join(raiz, "supabase/functions");
  if (!existsSync(funcoes) || !statSync(funcoes).isDirectory()) {
    console.error(`❌ check-edge-imports: ${funcoes} não existe — rode da raiz do repositório ou passe --root.`);
    return 2;
  }
  const arquivos = listarArquivos(funcoes);
  const violacoes = [];
  for (const arquivo of arquivos) {
    const conteudo = readFileSync(arquivo, "utf8");
    const achados = CODIGO.test(arquivo) ? acharImportsEsmSh(conteudo) : acharEsmShEmImportMap(conteudo);
    if (achados.length) violacoes.push({ arquivo: relative(raiz, arquivo), achados });
  }

  if (violacoes.length === 0) {
    console.log(`✅ check-edge-imports: nenhum import esm.sh encontrado (${arquivos.length} arquivo(s) verificados)`);
    return 0;
  }
  console.error("❌ check-edge-imports: imports esm.sh detectados (use npm: ao invés):");
  for (const v of violacoes) {
    console.error(`  - ${v.arquivo}:${v.achados.map((a) => a.linha).join(",")} (${v.achados.length} ocorrência(s))`);
  }
  return 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main(process.argv.slice(2)));
}
