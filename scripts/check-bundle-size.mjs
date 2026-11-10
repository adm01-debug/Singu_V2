#!/usr/bin/env node
/**
 * Performance budget enforcement.
 *
 * Falha o build se o chunk principal (entry) exceder MAX_ENTRY_KB gzipped,
 * ou se algum outro chunk individual exceder MAX_CHUNK_KB gzipped.
 *
 * Uso: node scripts/check-bundle-size.mjs [--dist <pasta>] [--strict]
 * Roda automaticamente após `vite build` se incluído em "postbuild".
 *
 *   --dist <pasta>  pasta do build (padrão: `dist`, ou a variável BUNDLE_DIST_DIR).
 *   --strict        build ausente vira erro. Já é o padrão quando a variável CI está definida
 *                   (GitHub Actions): gate que aprova sem ter o que medir não é gate.
 *
 * O entry é o que o `index.html` do build carrega com `<script type="module" src>`; sem
 * index.html, vale o nome (`index-*.js` / `main-*.js`).
 * Exit: 0 = dentro do budget (ou build ausente fora do CI) · 1 = budget estourado, build ausente
 * no CI/--strict ou nenhum .js no build · 2 = uso inválido.
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { basename, join, relative } from 'node:path';

const MAX_ENTRY_KB = 350; // budget para o chunk principal (entry)
const MAX_CHUNK_KB = 500; // budget máximo por chunk individual

const argv = process.argv.slice(2);
if (argv.includes('--help') || argv.includes('-h')) {
  console.log('Uso: node scripts/check-bundle-size.mjs [--dist <pasta>] [--strict]\n'
    + `Falha se o entry passar de ${MAX_ENTRY_KB} KB gzip ou outro chunk passar de ${MAX_CHUNK_KB} KB gzip.`);
  process.exit(0);
}
const iDist = argv.indexOf('--dist');
if (iDist !== -1 && !argv[iDist + 1]) {
  console.error('[bundle-size] --dist exige o caminho da pasta do build.');
  process.exit(2);
}
const DIST = iDist !== -1 ? argv[iDist + 1] : (process.env.BUNDLE_DIST_DIR || 'dist');
const DIST_DIR = join(DIST, 'assets');
const emCi = Boolean(process.env.CI) && process.env.CI !== 'false' && process.env.CI !== '0';
const estrito = argv.includes('--strict') || emCi;

if (!existsSync(DIST_DIR) || !statSync(DIST_DIR).isDirectory()) {
  if (estrito) {
    console.error(`[bundle-size] ❌ ${DIST_DIR} não encontrado — o build não rodou ou mudou de pasta; nada foi medido.`);
    process.exit(1);
  }
  console.warn(`[bundle-size] ${DIST_DIR} não encontrado — pule (rode \`vite build\` primeiro).`);
  process.exit(0);
}

function listJavaScriptFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) return listJavaScriptFiles(fullPath);
    return entry.isFile() && /\.m?js$/.test(entry.name) ? [fullPath] : [];
  });
}

/** Nomes dos arquivos que o index.html carrega como módulo de entrada; null se não der para saber. */
function entriesDoIndexHtml() {
  const arquivo = join(DIST, 'index.html');
  if (!existsSync(arquivo)) return null;
  const nomes = new Set();
  for (const tag of readFileSync(arquivo, 'utf8').matchAll(/<script\b[^>]*>/gi)) {
    if (!/\btype\s*=\s*["']?module\b/i.test(tag[0])) continue;
    const src = /\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i.exec(tag[0]);
    if (src) nomes.add(basename((src[1] ?? src[2] ?? src[3]).split(/[?#]/)[0]));
  }
  return nomes.size ? nomes : null;
}

const files = listJavaScriptFiles(DIST_DIR).sort();
if (files.length === 0) {
  console.error(`[bundle-size] Nenhum bundle JavaScript encontrado em ${DIST_DIR}.`);
  process.exit(1);
}
const entries = entriesDoIndexHtml();
let totalGzip = 0;
const violations = [];
const report = [];

for (const file of files) {
  const buf = readFileSync(file);
  const rawKb = buf.byteLength / 1024;
  const gzipKb = gzipSync(buf).byteLength / 1024;
  totalGzip += gzipKb;

  const fileName = basename(file);
  const isEntry = entries ? entries.has(fileName) : (/^index-/.test(fileName) || /^main-/.test(fileName));
  const limit = isEntry ? MAX_ENTRY_KB : MAX_CHUNK_KB;

  report.push({ file, rawKb: rawKb.toFixed(1), gzipKb: gzipKb.toFixed(1), isEntry });

  if (gzipKb > limit) {
    violations.push(`✗ ${file} = ${gzipKb.toFixed(1)} KB gzip (limite ${limit} KB${isEntry ? ', entry' : ''})`);
  }
}

if (entries && !report.some((r) => r.isEntry)) {
  // O index.html aponta para um entry que não está em assets/: o budget do entry não seria aplicado a nada.
  violations.push(`✗ entry do index.html (${[...entries].join(', ')}) não está em ${relative('.', DIST_DIR) || DIST_DIR}`);
}

// Imprime os 10 maiores chunks
report.sort((a, b) => Number(b.gzipKb) - Number(a.gzipKb) || a.file.localeCompare(b.file));
console.log('\n[bundle-size] Top 10 chunks (gzipped):');
for (const r of report.slice(0, 10)) {
  const tag = r.isEntry ? ' [ENTRY]' : '';
  console.log(`  ${r.file.padEnd(45)} ${r.gzipKb.padStart(7)} KB${tag}`);
}
console.log(`[bundle-size] Total JS gzipped: ${totalGzip.toFixed(1)} KB\n`);

if (violations.length > 0) {
  console.error('[bundle-size] ❌ Performance budget ultrapassado:');
  for (const v of violations) console.error(`  ${v}`);
  console.error('\nReduza o tamanho do bundle (lazy split, dynamic import, tree-shake) ou ajuste os limites em scripts/check-bundle-size.mjs.\n');
  process.exit(1);
}

console.log('[bundle-size] ✅ Todos os chunks dentro do budget.');
