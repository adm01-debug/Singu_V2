#!/usr/bin/env node
// Inventário de testes: todo teste que existe no disco tem de ser executado por algum
// workflow. Sem este guarda um teste nasce (ou é tirado do CI) e ninguém percebe — foi
// exatamente o que aconteceu aqui: 15 suítes Deno de supabase/functions/ existiam no repo
// e nenhum passo de CI as rodava.
//
// Confere duas famílias:
//   1. Testes Deno `*_test.ts` em supabase/functions/ — têm de ser citados dentro de um
//      bloco `run:` de algum workflow (é lá que o runner os executa). Citação em
//      comentário, nome de etapa ou `env:` NÃO conta: é o que separa registro de execução.
//   2. Suítes Node `*.test.mjs` / `*.unit.mjs` / `*.integration.mjs` em scripts/ — mesma
//      regra, com fechamento transitivo por import estático (agregador cobre o importado).
//
// O que já estava fora do CI quando o guarda nasceu fica nas ALLOWLIST_* com o motivo.
// A lista só encurta: teste novo fora de workflow reprova.
import { readFileSync, readdirSync, statSync } from 'fs';
import { spawnSync } from 'child_process';
import { join, posix as pathPosix } from 'path';
import { resolverExecutavel } from '../lib/seguranca-processo.mjs';
import { fileURLToPath } from 'url';

const root = join(fileURLToPath(import.meta.url), '../../..');

export const RAIZ = root;

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

function listarArquivosNoDisco(relDir) {
  const base = join(root, relDir);
  const out = [];
  function visitar(abs, rel) {
    for (const nome of readdirSync(abs).sort()) {
      const filhoAbs = join(abs, nome);
      const filhoRel = rel ? `${rel}/${nome}` : nome;
      const st = statSync(filhoAbs);
      if (st.isDirectory()) visitar(filhoAbs, filhoRel);
      else if (st.isFile()) out.push(filhoRel);
    }
  }
  visitar(base, relDir);
  return out;
}

function gitLsFilesOuDisco(relDir) {
  try {
    const resultado = spawnSync(resolverExecutavel('git'), ['ls-files', relDir], { cwd: root, encoding: 'utf8' });
    if (typeof resultado.stdout === 'string') {
      // Inclui arquivos ainda não adicionados ao índice. Sem a união com o disco, o
      // preflight local dizia OK e o mesmo commit falhava apenas no checkout limpo do CI.
      return [...new Set([
        ...resultado.stdout.split('\n').filter(Boolean),
        ...listarArquivosNoDisco(relDir),
      ])].sort();
    }
  } catch {
    // O CI também executa este arquivo via `deno test` sem --allow-sys/--allow-run.
    // Nesse modo o shim Node de Deno não deixa `fs.access(X_OK)`/child_process
    // observar o git; o checkout do runner é limpo, então a varredura do disco é
    // equivalente para este inventário.
  }
  return listarArquivosNoDisco(relDir);
}

// Suítes Node que já existiam fora do CI quando este guarda nasceu (dívida herdada da
// `main`, não introduzida aqui). Cada linha sai desta lista quando a suíte entrar num
// passo `run:` de workflow. A lista só encurta.
export const ALLOWLIST_NODE = new Set([
  'scripts/ai-context/gerar.unit.mjs',
  'scripts/apply-cli.test.mjs',
  'scripts/apply-ddl-real.test.mjs',
  'scripts/apply-e2e.test.mjs',
  'scripts/apply-falhas.test.mjs',
  'scripts/audit-ausentes.test.mjs',
  'scripts/automation.unit.mjs',
  'scripts/check-backend-linter-baseline.test.mjs',
  'scripts/check-bundle-size.test.mjs',
  'scripts/gen-supabase-types.test.mjs',
  'scripts/graphify-local.unit.mjs',
  'scripts/hardening/hardening-cluster.test.mjs',
  'scripts/hardening/hardening.test.mjs',
  'scripts/inventario/banco.test.mjs',
  'scripts/inventario/gerar-banco.test.mjs',
  'scripts/inventario/gerar-repo.test.mjs',
  'scripts/inventario/mudou-conteudo.test.mjs',
  'scripts/lib/mgmt-mock.test.mjs',
  'scripts/lib/sql-split.test.mjs',
  'scripts/lib/supabase-mgmt.test.mjs',
  'scripts/lint-providers.test.mjs',
  'scripts/maintenance/maintenance.unit.mjs',
  'scripts/migration/ddl/ddl.test.mjs',
  'scripts/migration/sql/sql.test.mjs',
  'scripts/rls-matrix/check-rls-baseline.test.mjs',
  'scripts/sql-raiz.test.mjs',
]);

// Testes Deno que já existiam fora do CI quando este guarda nasceu (dívida herdada da
// `main`, não introduzida aqui). Cada linha sai desta lista quando o teste entrar num
// passo de CI. A lista só encurta.
export const ALLOWLIST_DENO = new Set([
  'supabase/functions/external-data/optimistic-locking_test.ts',
]);

// ── 1. Testes Deno: disco vs passos de workflow ───────────────────────────────

const SUFIXO_TESTE_DENO = /_test\.ts$/;
const CAMINHO_TESTE_DENO = /supabase\/functions\/[A-Za-z0-9_./*-]+_test\.ts/g;

/** Testes Deno versionados em supabase/functions/, do disco. */
export function testesDenoNoDisco() {
  return gitLsFilesOuDisco('supabase/functions').filter(f => SUFIXO_TESTE_DENO.test(f));
}

export function testesDenoOrfaos() {
  const testes = testesDenoNoDisco();
  const padroes = padroesDosWorkflows(CAMINHO_TESTE_DENO);
  return testes.filter(f => !padroes.some(p => casaPadrao(f, p)) && !ALLOWLIST_DENO.has(f));
}

// ── 2. Suites Node: disco vs passos de workflow ───────────────────────────────
// O caminho da suite conta como coberto quando aparece dentro de um bloco `run:` de algum
// workflow — exatamente onde o runner a executa (com `node --test` ou direto com `node`).
// Citação em comentário, nome de etapa ou `env:` NÃO conta: é o que separa registro de execução.

const SUFIXO_SUITE_NODE = /\.(?:test|unit|integration)\.mjs$/;
const CAMINHO_SUITE_NODE = /scripts\/[A-Za-z0-9_./*-]+\.(?:test|unit|integration)\.mjs/g;

/** Caminhos e globos que casam `regex` dentro dos blocos `run:` de um workflow. */
export function padroesDeWorkflow(yaml, regex = CAMINHO_SUITE_NODE) {
  const linhas = String(yaml).split('\n');
  const padroes = new Set();
  for (let i = 0; i < linhas.length; i += 1) {
    const abertura = /^(\s*)run:\s*(.*)$/.exec(linhas[i]);
    if (!abertura) continue;
    const recuo = abertura[1].length;
    const bloco = [abertura[2]];
    for (let j = i + 1; j < linhas.length; j += 1) {
      const linha = linhas[j];
      if (linha.trim() === '') continue; // linha vazia não fecha o bloco
      if (linha.length - linha.trimStart().length <= recuo) break;
      if (linha.trimStart().startsWith('#')) continue; // passo comentado não executa nada
      bloco.push(linha);
    }
    for (const padrao of bloco.join('\n').match(regex) ?? []) padroes.add(padrao);
  }
  return [...padroes].sort();
}

/** Casa um caminho com um glob simples: `*` não atravessa `/`, `**` atravessa. */
export function casaPadrao(arquivo, padrao) {
  if (!padrao.includes('*')) return arquivo === padrao;
  const expressao = padrao
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '\u0000')
    .replace(/\*/g, '[^/]*')
    .replace(/\u0000/g, '.*');
  return new RegExp(`^${expressao}$`).test(arquivo);
}

/** Suites Node sem nenhum bloco `run:` que as execute (fora da ALLOWLIST_NODE). */
export function orfaosNode(suites, padroes, allowlist = ALLOWLIST_NODE) {
  return suites.filter(f => !padroes.some(p => casaPadrao(f, p)) && !allowlist.has(f));
}

/**
 * Suites alcançadas por imports estáticos de uma suite já coberta pelo workflow.
 * O fechamento transitivo permite agregadores em scripts/ci sem transformar a
 * ALLOWLIST_NODE em atalho: import dinâmico, comentário ou caminho inexistente não conta.
 */
export function suitesCobertasPorImport(suites, padroes, ler = read) {
  const existentes = new Set(suites);
  const cobertas = new Set(suites.filter(f => padroes.some(p => casaPadrao(f, p))));
  const pendentes = [...cobertas];
  const importEstatico = /(?:^|\n)\s*import\s+(?:[^'"\n]*?\s+from\s+)?['"]([^'"]+)['"]/g;

  while (pendentes.length > 0) {
    const agregador = pendentes.pop();
    const fonte = ler(agregador);
    for (const [, especificador] of fonte.matchAll(importEstatico)) {
      if (!especificador.startsWith('.')) continue;
      const importada = pathPosix.normalize(
        pathPosix.join(pathPosix.dirname(agregador), especificador),
      );
      if (!existentes.has(importada) || cobertas.has(importada)) continue;
      cobertas.add(importada);
      pendentes.push(importada);
    }
  }

  return cobertas;
}

/** Suites Node versionadas em scripts/, do disco. */
export function suitesNodeNoDisco() {
  return gitLsFilesOuDisco('scripts')
    .filter(f => SUFIXO_SUITE_NODE.test(f));
}

/** Todo caminho/globo que casa `regex` nos blocos `run:` dos workflows do repositório. */
export function padroesDosWorkflows(regex = CAMINHO_SUITE_NODE) {
  const dir = join(root, '.github/workflows');
  return readdirSync(dir)
    .filter(f => /\.ya?ml$/.test(f))
    .flatMap(f => padroesDeWorkflow(readFileSync(join(dir, f), 'utf8'), regex));
}

export function suitesNodeOrfas() {
  const suites = suitesNodeNoDisco();
  const padroes = padroesDosWorkflows(CAMINHO_SUITE_NODE);
  const cobertas = suitesCobertasPorImport(suites, padroes);
  return orfaosNode(suites, padroes, new Set([...ALLOWLIST_NODE, ...cobertas]));
}

// ── 4. Detectar órfãos ────────────────────────────────────────────────────────

/**
 * Roda o inventário inteiro e devolve a lista de órfãos (`[]` = tudo coberto).
 * O teste importa esta função; o CI roda o arquivo direto (ver `principal`).
 */
export function orfaosDoInventario() {
  const orphans = [];
  for (const file of testesDenoOrfaos()) {
    orphans.push({ file, yaml: 'nenhum bloco run: de workflow (teste Deno)' });
  }
  for (const file of suitesNodeOrfas()) {
    orphans.push({ file, yaml: 'nenhum bloco run: de workflow (suíte Node)' });
  }
  return orphans;
}

// ── 5. Reportar ───────────────────────────────────────────────────────────────

function principal() {
  const orphans = orfaosDoInventario();

  if (orphans.length === 0) {
    console.log(
      `check-test-inventory: OK — ${testesDenoNoDisco().length} teste(s) Deno `
      + `(${ALLOWLIST_DENO.size} na allowlist herdada) e ${suitesNodeNoDisco().length} suíte(s) Node `
      + `(${ALLOWLIST_NODE.size} na allowlist) executados por algum bloco run: de workflow`,
    );
    return 0;
  }

  console.error('check-test-inventory: FALHOU — testes no disco que nenhum workflow executa:');
  for (const { file, yaml } of orphans) {
    console.error(`  ${file}  (${yaml})`);
  }
  console.error(`\nTotal: ${orphans.length} teste(s) órfão(s).`);
  console.error('Acrescente o teste a um passo `run:` de workflow, ou justifique-o na ALLOWLIST correspondente.');
  return 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(principal());
}
