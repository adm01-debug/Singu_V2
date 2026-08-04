#!/usr/bin/env node
/**
 * Performance budget enforcement.
 *
 * Falha o build se o chunk principal (entry) exceder MAX_ENTRY_KB gzipped,
 * ou se algum outro chunk individual exceder MAX_CHUNK_KB gzipped.
 *
 * Uso: node scripts/check-bundle-size.mjs
 * Roda automaticamente após `vite build` se incluído em "postbuild".
 */
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const DIST_DIR = 'dist/assets';
const MAX_ENTRY_KB = 350; // budget para o chunk principal (entry)
const MAX_CHUNK_KB = 500; // budget máximo por chunk individual

if (!existsSync(DIST_DIR)) {
  console.warn(`[bundle-size] ${DIST_DIR} não encontrado — pule (rode \`vite build\` primeiro).`);
  process.exit(0);
}

const files = readdirSync(DIST_DIR).filter((f) => f.endsWith('.js'));
let totalGzip = 0;
const violations = [];
const report = [];

for (const file of files) {
  const fullPath = join(DIST_DIR, file);
  const buf = readFileSync(fullPath);
  const rawKb = buf.byteLength / 1024;
  const gzipKb = gzipSync(buf).byteLength / 1024;
  totalGzip += gzipKb;

  const isEntry = /^index-/.test(file) || /^main-/.test(file);
  const limit = isEntry ? MAX_ENTRY_KB : MAX_CHUNK_KB;

  report.push({ file, rawKb: rawKb.toFixed(1), gzipKb: gzipKb.toFixed(1), isEntry });

  if (gzipKb > limit) {
    violations.push(`✗ ${file} = ${gzipKb.toFixed(1)} KB gzip (limite ${limit} KB)`);
  }
}

// Imprime os 10 maiores chunks
report.sort((a, b) => Number(b.gzipKb) - Number(a.gzipKb));
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
