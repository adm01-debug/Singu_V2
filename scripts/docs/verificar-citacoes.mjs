#!/usr/bin/env node
/**
 * Toda citacao `arquivo:linha` da documentacao ainda existe?
 *
 * Os documentos de estado deste repositorio (ESTADO_ATUAL.md, PLANEJADO_NAO_EXECUTADO.md,
 * AUDITORIA_*.md, docs/**) apontam o codigo por `caminho/arquivo.ts:123`. Essas citacoes
 * apodrecem em silencio: o arquivo e renomeado, a funcao sobe 40 linhas, e o documento continua
 * mandando o proximo agente para o lugar errado - que e retrabalho caro, porque o agente le,
 * nao encontra, e refaz a investigacao inteira.
 *
 * Este script nao altera nada: ele le os .md, extrai as citacoes e confere duas coisas por
 * citacao - o arquivo existe, e o arquivo tem a linha citada. Como o acervo atual ja nasce com
 * quebras, ele funciona como catraca (ratchet): falha so quando aparece quebra que nao esta no
 * baseline `scripts/docs/citacoes-baseline.json`. Corrigir uma quebra antiga e rodar --baseline
 * de novo abaixa a catraca; nunca sobe sozinha.
 *
 * Uso:
 *   node scripts/docs/verificar-citacoes.mjs                 valida contra o baseline (exit 1 em quebra nova)
 *   node scripts/docs/verificar-citacoes.mjs --baseline       regrava o baseline com as quebras de hoje; recusa
 *                                                              (exit 1) se isso for absorver quebra NOVA em
 *                                                              silencio (corrigiu uma e introduziu outra no
 *                                                              mesmo commit) — confirme com --baseline --force
 *   node scripts/docs/verificar-citacoes.mjs --listar         imprime todas as quebras, exit 0
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ_PADRAO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const BASELINE_REL = 'scripts/docs/citacoes-baseline.json';

// Pastas que nao sao fonte de verdade escrita a mao: geradas, dependencia ou historico de build.
const IGNORAR_DIR = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '.tmp', 'graphify-out',
  'playwright-report', 'test-results', 'contexto']);
// Extensoes de codigo que valem como citacao verificavel (um .md citando outro .md tambem conta).
const EXT_CITADA = String.raw`tsx|ts|jsx|js|mjs|cjs|sql|json|md|yml|yaml|sh|py|toml`;
// `src/pages/Contatos.tsx:42` ou `supabase/functions/x/index.ts:10-20`. Exige pasta de topo
// conhecida para nao confundir com texto solto (`versao 2.1:30` nao casa).
export const CITACAO = new RegExp(
  String.raw`\b((?:src|supabase|scripts|docs|e2e|tests|monitoring|inventario|infrastructure|public)/[A-Za-z0-9_./-]+\.(?:${EXT_CITADA}))`
  + String.raw`(?::(\d+)(?:-(\d+))?)?(?![\w:])`, 'g');

/** Todos os .md escritos a mao (raiz + docs/), sem o que e gerado. */
export function listarDocs(raiz) {
  const achados = [];
  const andar = (dir, relBase) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith('.') || IGNORAR_DIR.has(e.name)) continue;
      const abs = path.join(dir, e.name);
      const rel = relBase ? `${relBase}/${e.name}` : e.name;
      if (e.isDirectory()) andar(abs, rel);
      else if (e.name.endsWith('.md')) achados.push(rel);
    }
  };
  for (const e of fs.readdirSync(raiz, { withFileTypes: true })) {
    if (e.isFile() && e.name.endsWith('.md')) achados.push(e.name);
  }
  const docs = path.join(raiz, 'docs');
  if (fs.existsSync(docs)) andar(docs, 'docs');
  return achados.sort();
}

/** Citacoes de um texto: [{ alvo, linha, ate }] sem repeticao. */
export function extrairCitacoes(texto) {
  const vistas = new Map();
  for (const m of texto.matchAll(CITACAO)) {
    const chave = `${m[1]}:${m[2] ?? ''}:${m[3] ?? ''}`;
    if (!vistas.has(chave)) {
      vistas.set(chave, { alvo: m[1], linha: m[2] ? Number(m[2]) : null, ate: m[3] ? Number(m[3]) : null });
    }
  }
  return [...vistas.values()];
}

/**
 * Confere as citacoes de todos os docs. Devolve { citacoes, quebras }, onde cada quebra e
 * `<doc> -> <alvo>[:<linha>] (<motivo>)` - string estavel, para servir de chave no baseline.
 */
export function conferir(raiz = RAIZ_PADRAO) {
  const linhasDe = new Map();
  const totalLinhas = (alvo) => {
    if (!linhasDe.has(alvo)) {
      const abs = path.join(raiz, alvo);
      linhasDe.set(alvo, fs.existsSync(abs) && fs.statSync(abs).isFile()
        ? fs.readFileSync(abs, 'utf8').split('\n').length
        : null);
    }
    return linhasDe.get(alvo);
  };

  let citacoes = 0;
  const quebras = [];
  for (const doc of listarDocs(raiz)) {
    const texto = fs.readFileSync(path.join(raiz, doc), 'utf8');
    for (const c of extrairCitacoes(texto)) {
      citacoes += 1;
      const total = totalLinhas(c.alvo);
      const onde = `${doc} -> ${c.alvo}${c.linha ? `:${c.linha}${c.ate ? `-${c.ate}` : ''}` : ''}`;
      if (total === null) { quebras.push(`${onde} (arquivo nao existe)`); continue; }
      const maior = Math.max(c.linha ?? 0, c.ate ?? 0);
      if (maior > total) quebras.push(`${onde} (arquivo tem ${total} linhas)`);
    }
  }
  return { citacoes, quebras: quebras.sort() };
}

const lerBaseline = (raiz) => {
  const abs = path.join(raiz, BASELINE_REL);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8'));
};

export const serializarBaseline = (quebras) => `${JSON.stringify({
  fonte: 'scripts/docs/verificar-citacoes.mjs --baseline',
  o_que_e: 'citacoes arquivo:linha que já estavam quebradas quando a catraca foi criada. '
    + 'A lista só pode encolher: quebra nova reprova. Corrigiu uma? rode --baseline e commite.',
  total: quebras.length,
  quebras,
}, null, 2)}\n`;

/** Compara com o baseline: { novas, corrigidas }. */
export function comparar(atual, baseline) {
  const antigas = new Set(baseline?.quebras ?? []);
  const agora = new Set(atual.quebras);
  return {
    novas: atual.quebras.filter((q) => !antigas.has(q)),
    corrigidas: [...antigas].filter((q) => !agora.has(q)).sort(),
  };
}

/**
 * Quebras que `--baseline` absorveria em silencio: sem isso, corrigir uma quebra antiga e
 * introduzir uma nova no mesmo commit destrava o CI escondendo a nova dentro do baseline
 * (achado da auditoria adversarial de 2026-11-08, reproduzido literalmente). `forcar` (--force)
 * ignora a checagem - uso legitimo quando a "quebra nova" e so um doc movido de lugar na mesma
 * mudanca. Sem baseline anterior (primeira vez) nada bloqueia.
 */
export function novasQueTravariamBaseline(atual, baselineAntigo, forcar) {
  if (!baselineAntigo || forcar) return [];
  return comparar(atual, baselineAntigo).novas;
}

function main(argv) {
  const atual = conferir(RAIZ_PADRAO);

  if (argv.includes('--listar')) {
    for (const q of atual.quebras) console.log(q);
    console.log(`\n${atual.citacoes} citacoes, ${atual.quebras.length} quebradas.`);
    return;
  }

  if (argv.includes('--baseline')) {
    const baselineAntigo = lerBaseline(RAIZ_PADRAO);
    const bloqueando = novasQueTravariamBaseline(atual, baselineAntigo, argv.includes('--force'));
    if (bloqueando.length) {
      console.error(`${bloqueando.length} quebra(s) NOVA(s) seria(m) absorvida(s) em silencio pelo --baseline:`);
      for (const q of bloqueando) console.error(`  ${q}`);
      console.error('\nCorrija essas citacoes antes de rodar --baseline, ou use --baseline --force se forem '
        + 'mesmo herdadas (ex.: doc movido de lugar na mesma mudanca).');
      process.exit(1);
    }
    fs.writeFileSync(path.join(RAIZ_PADRAO, BASELINE_REL), serializarBaseline(atual.quebras));
    console.log(`${BASELINE_REL}: ${atual.quebras.length} quebras registradas de ${atual.citacoes} citacoes.`);
    return;
  }

  const baseline = lerBaseline(RAIZ_PADRAO);
  if (!baseline) {
    console.error(`${BASELINE_REL} nao existe. Rode node scripts/docs/verificar-citacoes.mjs --baseline e commite.`);
    process.exit(1);
  }
  const { novas, corrigidas } = comparar(atual, baseline);

  if (novas.length) {
    console.error(`${novas.length} citacao(oes) quebrada(s) fora do baseline:`);
    for (const q of novas) console.error(`  ${q}`);
    console.error('\nAponte a linha certa no documento, ou rode --baseline se a quebra for herdada.');
    process.exit(1);
  }
  const sobra = corrigidas.length
    ? ` ${corrigidas.length} quebra(s) do baseline nao existe(m) mais: rode --baseline para abaixar a catraca.`
    : '';
  console.log(`${atual.citacoes} citacoes conferidas, ${atual.quebras.length} quebradas (todas no baseline).${sobra}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2));
