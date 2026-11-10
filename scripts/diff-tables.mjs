#!/usr/bin/env node
// scripts/diff-tables.mjs - Cruzar tabelas/views usadas no codigo vs schema novo
//
// Lê src/integrations/supabase/types.ts e todas as chamadas `.from('x')` e `.rpc('x')` de src/.
// Imprime (não grava nada): quantas tabelas usadas existem, quais faltam, sugestões por
// similaridade, e as RPCs chamadas que não estão em `Functions` do types.ts.
//
// Uso: node scripts/diff-tables.mjs [--raiz <repo>]   (padrão: a pasta acima de scripts/)
// Exit: 0 = relatório impresso · 2 = entrada inválida (types.ts/src ausentes ou types.ts sem tabelas).
import { readFileSync, existsSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tabelasDoTypes, listarFontes, chamadasFrom } from "./audit-ausentes.mjs";

const RAIZ_PADRAO = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Funções declaradas no bloco `Functions: {` do types.ts (inclui as com sobrecarga `nome:\n | {`). */
export function funcoesDoTypes(types) {
  const funcoes = new Set();
  for (const bloco of types.matchAll(/^ {4}Functions: \{\n([\s\S]*?)^ {4}\}/gm)) {
    for (const m of bloco[1].matchAll(/^ {6}([A-Za-z_][A-Za-z0-9_]*):/gm)) funcoes.add(m[1]);
  }
  return funcoes;
}

/** Nomes passados a `.rpc('x'...)` (com ou sem argumentos, com `as never`). */
export function chamadasRpc(conteudo) {
  return [...conteudo.matchAll(/\.rpc\s*(?:<[^>()]*>)?\(\s*['"`]([A-Za-z_][A-Za-z0-9_]*)['"`]/g)].map((m) => m[1]);
}

/** Tabelas existentes parecidas com `nome` (metade ou mais dos pedaços do nome aparecem). */
export function sugerir(nome, existentes) {
  const tokens = nome.split("_").filter(Boolean);
  return existentes
    .filter((e) => tokens.filter((tok) => e.includes(tok)).length >= Math.max(1, Math.floor(tokens.length / 2)))
    .slice(0, 5);
}

export function cruzar(raiz) {
  const types = readFileSync(join(raiz, "src/integrations/supabase/types.ts"), "utf8");
  const tabelas = tabelasDoTypes(types);
  if (tabelas.size === 0) {
    throw new Error("nenhuma tabela reconhecida em src/integrations/supabase/types.ts (o formato mudou?)");
  }
  const funcoes = funcoesDoTypes(types);
  const usoTabela = new Map();
  const usoRpc = new Map();
  const anotar = (mapa, nome, arquivo) => {
    if (!mapa.has(nome)) mapa.set(nome, new Set());
    mapa.get(nome).add(arquivo);
  };
  for (const f of listarFontes(join(raiz, "src"))) {
    const arquivo = relative(raiz, f).replace(/\\/g, "/");
    const conteudo = readFileSync(f, "utf8");
    for (const { tabela } of chamadasFrom(conteudo)) anotar(usoTabela, tabela, arquivo);
    for (const nome of chamadasRpc(conteudo)) anotar(usoRpc, nome, arquivo);
  }
  const porImpacto = (a, b) => b[1].size - a[1].size || (a[0] < b[0] ? -1 : 1);
  return {
    tabelas: [...tabelas].sort(),
    usadas: usoTabela.size,
    existentes: [...usoTabela].filter(([t]) => tabelas.has(t)).length,
    ausentes: [...usoTabela].filter(([t]) => !tabelas.has(t)).sort(porImpacto),
    rpcsUsadas: usoRpc.size,
    rpcsAusentes: [...usoRpc].filter(([n]) => !funcoes.has(n)).sort(porImpacto),
  };
}

const listar = (arquivos) => {
  const lista = [...arquivos].sort();
  return `${lista.length} arq  -> ${lista.slice(0, 5).join(", ")}${lista.length > 5 ? ` (+${lista.length - 5})` : ""}`;
};

export function main(argv) {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log("Uso: node scripts/diff-tables.mjs [--raiz <repo>]\n"
      + "Mostra tabelas (.from) e RPCs (.rpc) usadas em src/ que não existem em src/integrations/supabase/types.ts.");
    return 0;
  }
  const iRaiz = argv.indexOf("--raiz");
  if (iRaiz !== -1 && !argv[iRaiz + 1]) throw new Error("--raiz exige um caminho");
  const raiz = resolve(iRaiz === -1 ? RAIZ_PADRAO : argv[iRaiz + 1]);
  for (const exigido of ["src/integrations/supabase/types.ts", "src"]) {
    if (!existsSync(join(raiz, exigido))) throw new Error(`${join(raiz, exigido)} não existe (use --raiz)`);
  }
  const r = cruzar(raiz);
  console.log(`Tabelas usadas: ${r.usadas}`);
  console.log(`Ja existem no schema novo: ${r.existentes}`);
  console.log(`Ausentes: ${r.ausentes.length}\n`);
  console.log("=== AUSENTES (tabela: arquivos) ===");
  for (const [t, arquivos] of r.ausentes) console.log(`${t}: ${listar(arquivos)}`);

  console.log("\n=== POSSIVEIS SUBSTITUICOES (por similaridade) ===");
  for (const [t] of r.ausentes) {
    const candidatas = sugerir(t, r.tabelas);
    if (candidatas.length) console.log(`${t} -> ${candidatas.join(" | ")}`);
  }

  console.log(`\nRPCs usadas: ${r.rpcsUsadas}`);
  console.log(`RPCs ausentes em Functions: ${r.rpcsAusentes.length}\n`);
  console.log("=== RPCS AUSENTES (funcao: arquivos) ===");
  for (const [n, arquivos] of r.rpcsAusentes) console.log(`${n}: ${listar(arquivos)}`);
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
