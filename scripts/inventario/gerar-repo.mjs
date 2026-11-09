#!/usr/bin/env node
// Inventario gerado do lado do repositorio (sem acesso ao banco):
//  - edge functions: linhas, segredos lidos (Deno.env.get) e quem as invoca (src, migrations, outras edges, e2e, CI)
//  - tabelas: para cada nome recebido em stdin (uma por linha), quantos .from('tabela') ha em src/ e supabase/functions/
// Uso: node scripts/inventario/gerar-repo.mjs            -> escreve inventario/estado/edges.json
//      node scripts/inventario/gerar-repo.mjs < tabelas.txt -> tambem escreve inventario/estado/tabelas-uso.json
// Opcoes: --saida <pasta> (padrao: <raiz>/inventario/estado) · --help
//         INVENTARIO_RAIZ=<pasta> troca a raiz do repositorio lido (so para teste).
// Precisa do ripgrep (rg). Exit: 0 = gravado; 2 = rg ausente/falhou, raiz sem supabase/functions ou flag sem valor.
import { readdirSync, readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// fileURLToPath (e nao URL.pathname): caminho com espaco ou acento vinha como "%20"/"%C3%A7" e nada era achado.
const RAIZ = resolve(process.env.INVENTARIO_RAIZ?.trim() || join(dirname(fileURLToPath(import.meta.url)), '..', '..'));
const FDIR = join(RAIZ, 'supabase/functions');

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function executarRg(args) {
  try {
    return execFileSync('rg', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  } catch (erro) {
    // O ripgrep usa exit 1 para "nenhum resultado"; isso não é falha da busca.
    if (erro?.status === 1) return '';
    if (erro?.code === 'ENOENT') {
      throw new Error('ripgrep (rg) não encontrado; o inventário não pode ser gerado com segurança.', { cause: erro });
    }
    const status = Number.isInteger(erro?.status) ? erro.status : 'desconhecido';
    throw new Error(`ripgrep (rg) falhou com exit ${status}; o inventário não foi gerado.`, { cause: erro });
  }
}
// `-e`: o padrao nunca e lido como opcao (nome comecando com "-"). Caminho que nao existe sai da busca
// em vez de derrubar o rg com exit 2.
function rg(flag, pattern, paths) {
  const alvos = paths.map((p) => join(RAIZ, p)).filter((p) => existsSync(p));
  return alvos.length ? executarRg([flag, '--no-messages', '-e', pattern, '--', ...alvos]) : '';
}
function rgCount(pattern, paths) {
  return rg('-c', pattern, paths).split('\n').filter(Boolean).reduce((n, l) => n + Number(l.slice(l.lastIndexOf(':') + 1)), 0);
}
function rgFiles(pattern, paths) {
  return rg('-l', pattern, paths).split('\n').filter(Boolean).map((f) => relative(RAIZ, f).replace(/\\/g, '/'));
}

function inventariarEdges() {
  const edges = readdirSync(FDIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_') && existsSync(join(FDIR, d.name, 'index.ts')))
    .map((d) => d.name).sort();

  const inventario = Object.create(null);
  for (const f of edges) {
    const q = esc(f);
    const code = readFileSync(join(FDIR, f, 'index.ts'), 'utf8');
    const envs = [...new Set([...code.matchAll(/Deno\.env\.get\(\s*['"]([A-Z0-9_]+)['"]/g)].map((m) => m[1]))].sort();
    const src = rgFiles(`(functions\\.invoke\\(\\s*['"\`]${q}['"\`]|functions/v1/${q}\\b|['"\`]${q}['"\`]\\s*[,)])`, ['src']);
    const migrations = rgFiles(`functions/v1/${q}\\b`, ['supabase/migrations']);
    const outrasEdges = rgFiles(`functions/v1/${q}\\b|['"\`]${q}['"\`]`, ['supabase/functions']).filter((p) => !p.startsWith(`supabase/functions/${f}/`));
    const e2e = rgFiles(q, ['e2e']);
    const ci = rgFiles(q, ['.github/workflows', 'supabase/config.toml']);
    inventario[f] = {
      linhas: code.split('\n').length,
      segredos_lidos: envs,
      chamada_em: { src: src.length, migrations: migrations.length, outras_edges: outrasEdges.length, e2e: e2e.length, ci_config: ci.length },
      sem_chamador: src.length + migrations.length + outrasEdges.length === 0,
    };
  }
  const semChamador = Object.entries(inventario).filter(([, v]) => v.sem_chamador).map(([k]) => k);
  return { total: edges.length, sem_chamador_no_repo: semChamador, edge_functions: inventario };
}

function inventariarTabelas(nomes) {
  const uso = Object.create(null);
  for (const t of nomes) {
    const q = esc(t);
    uso[t] = {
      from_src: rgCount(`\\.from\\(\\s*['"\`]${q}['"\`]`, ['src']),
      from_edges: rgCount(`\\.from\\(\\s*['"\`]${q}['"\`]`, ['supabase/functions']),
      em_types_ts: rgCount(`^\\s+${q}: \\{`, ['src/integrations/supabase/types.ts']) > 0,
    };
  }
  const semFrom = Object.entries(uso).filter(([, v]) => v.from_src + v.from_edges === 0).map(([k]) => k);
  return { total: Object.keys(uso).length, sem_from_em_src_nem_edges: semFrom, tabelas: uso };
}

// Como stream: readFileSync(0) estoura EAGAIN quando o stdin e um pipe ainda sem dados.
async function lerStdin() {
  if (process.stdin.isTTY) return '';
  let texto = '';
  process.stdin.setEncoding('utf8');
  for await (const pedaco of process.stdin) texto += pedaco;
  return texto;
}

async function main(argv) {
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log('Uso: node scripts/inventario/gerar-repo.mjs [--saida <pasta>] [< tabelas.txt]\n'
      + 'Grava inventario/estado/edges.json e, com nomes de tabela no stdin, tabelas-uso.json. Precisa do ripgrep (rg).');
    return;
  }
  const iSaida = argv.indexOf('--saida');
  if (iSaida !== -1 && (!argv[iSaida + 1] || argv[iSaida + 1].startsWith('--'))) throw new Error('--saida exige o caminho de uma pasta');
  const out = iSaida === -1 ? join(RAIZ, 'inventario/estado') : resolve(argv[iSaida + 1]);
  if (!existsSync(FDIR)) throw new Error(`${FDIR} não existe: rode a partir do repositório (ou confira INVENTARIO_RAIZ).`);
  const geradoEm = new Date().toISOString();

  const edges = inventariarEdges();
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'edges.json'), JSON.stringify({ gerado_em: geradoEm, ...edges }) + '\n');
  console.log(`edges: ${edges.total} | sem chamador no repo (src/migrations/edges): ${edges.sem_chamador_no_repo.length}`);

  const nomes = [...new Set((await lerStdin()).split(/\s+/).filter(Boolean))];
  if (nomes.length > 0) {
    const tabelas = inventariarTabelas(nomes);
    writeFileSync(join(out, 'tabelas-uso.json'), JSON.stringify({ gerado_em: geradoEm, ...tabelas }) + '\n');
    console.log(`tabelas: ${tabelas.total} | sem .from() em src nem edges: ${tabelas.sem_from_em_src_nem_edges.length}`);
  }
}

main(process.argv.slice(2)).catch((erro) => {
  console.error(`ERRO: ${erro.message}`);
  process.exit(2);
});
