#!/usr/bin/env node
/**
 * Lint guard: bloqueia `Access-Control-Allow-Origin: *` em edge functions
 * fora do allowlist em scripts/edge-cors-allowlist.txt.
 *
 * Uso: node scripts/check-edge-cors.mjs [--root <raiz-do-repo>]   (padrão: diretório atual)
 * Exit: 0 = limpo · 1 = wildcard fora do allowlist ou entrada morta no allowlist · 2 = uso/ambiente inválido.
 *
 * O que conta como wildcard (nome do header sem diferenciar maiúsculas, aspas simples/duplas/crase):
 *   - `"Access-Control-Allow-Origin": "*"`, `headers.set("Access-Control-Allow-Origin", "*")`,
 *     `h["Access-Control-Allow-Origin"] = "*"`, com fallback (`origem ?? "*"`, ternário) e com o nome ou
 *     o valor montados por concatenação (`"Access-Control-" + "Allow-Origin"`, `"" + "*"`);
 *   - valor ou nome do header vindo de constante/função do MESMO arquivo que devolve `"*"`;
 *   - header cru em texto: `Access-Control-Allow-Origin: *`.
 * Linha que é só comentário não conta. Limite conhecido: valor importado de OUTRO arquivo não é seguido.
 * Entrada do allowlist sem wildcard correspondente é erro: allowlist morto vira carta branca.
 */
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const EXTENSOES = /\.(ts|tsx|js|jsx|mjs|cjs)$/;
const ASPA = "[\"'`]";
// Nome do header aceitando concatenação em qualquer ponto: "Access-Control-" + "Allow-Origin".
const EMENDA = `(?:${ASPA}\\s*\\+\\s*${ASPA})?`;
const NOME = "access-control-allow-origin".split("").map((c) => c.replace(/[-]/g, "\\-")).join(EMENDA);
const RE_NOME = new RegExp(`${ASPA}${NOME}${ASPA}`, "gi");
const RE_CRU = /access-control-allow-origin\s*:\s*\*/gi;
const IDENT = /[A-Za-z_$][\w$]*/g;

/** Apaga (mantendo a contagem de linhas) as linhas que são só comentário: `// ...` e blocos que abrem a linha. */
export function semLinhasDeComentario(texto) {
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
      else if (!t.endsWith("*/")) return linha; // código depois do bloco na mesma linha: mantém
      return "";
    }
    return linha;
  }).join("\n");
}

/**
 * Lê a expressão que começa em `i` até o fim dela (`,` `;` ou fechamento no nível 0, ou fim de
 * instrução sem `;`). Devolve os literais de string e os identificadores soltos encontrados.
 */
export function lerExpressao(texto, i) {
  const literais = [];
  const idents = [];
  let nivel = 0;
  let codigo = "";
  const fim = Math.min(texto.length, i + 4000);
  for (; i < fim; i++) {
    const c = texto[i];
    if (c === '"' || c === "'" || c === "`") {
      let j = i + 1;
      while (j < texto.length && texto[j] !== c && !(c !== "`" && texto[j] === "\n")) j += texto[j] === "\\" ? 2 : 1;
      literais.push(texto.slice(i + 1, j));
      codigo += '""';
      i = j;
      continue;
    }
    if ("([{".includes(c)) nivel++;
    else if (")]}".includes(c)) { if (nivel === 0) break; nivel--; }
    else if ((c === "," || c === ";") && nivel === 0) break;
    else if (c === "\n" && nivel === 0 && codigo.trim()) {
      // Sem `;`: a instrução continua só se esta linha termina, ou a próxima começa, com operador.
      const resto = texto.slice(i + 1).trimStart();
      if (!/[?:|&+=(,.]\s*$/.test(codigo) && !/^[?:|&+.]/.test(resto)) break;
    }
    codigo += c;
  }
  for (const m of codigo.matchAll(IDENT)) {
    const antes = codigo[m.index - 1];
    if (antes !== "." && !/\d/.test(m[0][0])) idents.push(m[0]);
  }
  return { literais, idents, codigo };
}

/** Índice logo depois do `}` que fecha o bloco aberto em `abre` (ignora chaves dentro de strings). */
function fimDoBloco(texto, abre) {
  let nivel = 0;
  for (let i = abre; i < texto.length; i++) {
    const c = texto[i];
    if (c === '"' || c === "'" || c === "`") {
      let j = i + 1;
      while (j < texto.length && texto[j] !== c && !(c !== "`" && texto[j] === "\n")) j += texto[j] === "\\" ? 2 : 1;
      i = j;
    } else if (c === "{") nivel++;
    else if (c === "}" && --nivel === 0) return i + 1;
  }
  return texto.length;
}

const ehWildcard = (literal) => literal.trim() === "*";
const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** A expressão em `pos` pode valer "*"? Segue constantes e funções do mesmo arquivo (até 3 saltos). */
function podeSerWildcard(texto, pos, vistos = new Set(), salto = 0) {
  const { literais, idents } = lerExpressao(texto, pos);
  if (literais.some(ehWildcard)) return true;
  if (salto >= 3) return false;
  for (const nome of idents) {
    if (vistos.has(nome)) continue;
    vistos.add(nome);
    const n = escapar(nome);
    for (const d of texto.matchAll(new RegExp(`\\b(?:const|let|var)\\s+${n}\\b[^=;\\n]*=(?![=>])`, "g"))) {
      if (podeSerWildcard(texto, d.index + d[0].length, vistos, salto + 1)) return true;
    }
    for (const d of texto.matchAll(new RegExp(`\\bfunction\\s+${n}\\s*\\(`, "g"))) {
      const abre = texto.indexOf("{", texto.indexOf(")", d.index));
      if (abre === -1) continue;
      const corpo = texto.slice(abre, fimDoBloco(texto, abre));
      for (const r of corpo.matchAll(/\breturn\b/g)) {
        if (podeSerWildcard(texto, abre + r.index + r[0].length, vistos, salto + 1)) return true;
      }
    }
  }
  return false;
}

/** Wildcards de CORS no conteúdo de um arquivo: [{ linha, motivo }]. */
export function acharWildcards(conteudo) {
  const texto = semLinhasDeComentario(conteudo);
  const achados = new Map();
  const linhaDe = (pos) => texto.slice(0, pos).split("\n").length;
  const marcar = (pos, motivo) => { const l = linhaDe(pos); if (!achados.has(l)) achados.set(l, motivo); };

  for (const m of texto.matchAll(RE_CRU)) marcar(m.index, "header cru com *");

  // Onde o nome do header aparece: literal ("...") ou constante que guarda o literal.
  const usos = [...texto.matchAll(RE_NOME)].map((m) => ({ fim: m.index + m[0].length, inicio: m.index }));
  for (const u of [...usos]) {
    const decl = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=;\n]+)?=\s*$/.exec(texto.slice(0, u.inicio));
    if (!decl) continue;
    for (const m of texto.matchAll(new RegExp(`(?<![.\\w$])${escapar(decl[1])}(?![\\w$])`, "g"))) {
      if (m.index > u.inicio) usos.push({ fim: m.index + m[0].length, inicio: m.index });
    }
  }
  for (const u of usos) {
    // Depois do nome: `:` (objeto), `,` (set/append/tupla), `] =` (atribuição) ou `]:` (chave computada).
    const sep = /^\s*(?:\]\s*(?::|(?:\?\?|\|\|)?=(?![=>]))|:|,)/.exec(texto.slice(u.fim, u.fim + 200));
    if (sep && podeSerWildcard(texto, u.fim + sep[0].length)) marcar(u.inicio, "valor pode ser *");
  }
  return [...achados].map(([linha, motivo]) => ({ linha, motivo })).sort((a, b) => a.linha - b.linha);
}

function listarArquivos(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (e.name === "node_modules") continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) listarArquivos(p, acc);
    else if (e.isFile() && EXTENSOES.test(e.name)) acc.push(p);
  }
  return acc;
}

function lerAllowlist(arquivo) {
  if (!existsSync(arquivo)) return [];
  return readFileSync(arquivo, "utf8").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
}

export function main(argv) {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log("Uso: node scripts/check-edge-cors.mjs [--root <raiz-do-repo>]\n"
      + "Falha (exit 1) se alguma edge function fora de scripts/edge-cors-allowlist.txt usar CORS com origem `*`,\n"
      + "ou se o allowlist tiver entrada sem wildcard correspondente. Exit 2 = uso/ambiente inválido.");
    return 0;
  }
  const iRoot = argv.indexOf("--root");
  if (iRoot !== -1 && !argv[iRoot + 1]) { console.error("❌ check-edge-cors: --root exige um diretório"); return 2; }
  const raiz = resolve(iRoot === -1 ? "." : argv[iRoot + 1]);
  const funcoes = join(raiz, "supabase/functions");
  const arquivoAllowlist = join(raiz, "scripts/edge-cors-allowlist.txt");
  if (!existsSync(funcoes) || !statSync(funcoes).isDirectory()) {
    console.error(`❌ check-edge-cors: ${funcoes} não existe — rode da raiz do repositório ou passe --root.`);
    return 2;
  }
  const allowlist = lerAllowlist(arquivoAllowlist);
  const permitidas = new Set(allowlist);
  const comWildcard = new Set();
  const violacoes = [];
  const arquivos = listarArquivos(funcoes);
  for (const arquivo of arquivos) {
    const achados = acharWildcards(readFileSync(arquivo, "utf8"));
    if (!achados.length) continue;
    const fn = relative(funcoes, arquivo).split(/[\\/]/)[0];
    comWildcard.add(fn);
    if (!permitidas.has(fn)) violacoes.push({ fn, arquivo: relative(raiz, arquivo), achados });
  }
  const mortas = allowlist.filter((fn) => !comWildcard.has(fn));

  if (violacoes.length === 0 && mortas.length === 0) {
    console.log(`✅ check-edge-cors: nenhum wildcard CORS fora do allowlist (${arquivos.length} arquivo(s) verificados)`);
    return 0;
  }
  if (violacoes.length) {
    console.error("❌ check-edge-cors: wildcard CORS detectado em funções não whitelisted:");
    for (const v of violacoes) {
      console.error(`  - ${v.fn} → ${v.arquivo}:${v.achados.map((a) => a.linha).join(",")} (${v.achados[0].motivo})`);
    }
  }
  if (mortas.length) {
    console.error("❌ check-edge-cors: entrada do allowlist sem wildcard correspondente (remova-a):");
    for (const fn of mortas) console.error(`  - ${fn}`);
  }
  console.error(`Allowlist: ${relative(process.cwd(), arquivoAllowlist) || arquivoAllowlist}`);
  return 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main(process.argv.slice(2)));
}
