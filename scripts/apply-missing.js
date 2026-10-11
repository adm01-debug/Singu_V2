// apply-missing.js — extrai e aplica só as tabelas faltando
import { readFileSync } from 'node:fs';
import https from 'node:https';

const PAT = process.env.SUPABASE_ACCESS_TOKEN;
if (!PAT) throw new Error('SUPABASE_ACCESS_TOKEN obrigatório; forneça pelo ambiente seguro');
const REF = 'pgxfvjmuubtbowutlide';

function mgmt(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const req = https.request({
      hostname: 'api.supabase.com', port: 443,
      path: `/v1/projects/${REF}/database/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PAT}`,
        'apikey': PAT,
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 55000,
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('TIMEOUT')); });
    req.write(body);
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── extract table blocks via simple string search ──────────────────────────────

function extractTableBlocks(sql) {
  const blocks = [];
  // Find all "CREATE TABLE name (" starts
  const startRe = /CREATE TABLE (?:\w+\.)?(\w+)\s*\(/g;
  let m;
  while ((m = startRe.exec(sql)) !== null) {
    const name = m[1];
    const start = m.index;
    // Find matching close paren (track depth)
    let depth = 0;
    let end = -1;
    for (let i = start + m[0].length - 1; i < sql.length; i++) {
      if (sql[i] === '(') depth++;
      else if (sql[i] === ')') {
        depth--;
        if (depth === 0) { end = i + 1; break; }
      }
    }
    if (end !== -1) {
      // Include everything up to and including the closing paren
      // Then capture constraint lines until semicolon
      let semi = sql.indexOf(';', end);
      if (semi !== -1) {
        // include newline before CREATE
        const lineStart = sql.lastIndexOf('\n', start - 1) + 1;
        blocks.push({ name, start: lineStart, semi: semi + 1 });
      }
    }
  }
  return blocks;
}

// ── main ────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Existing tables
  process.stdout.write('Verificando tabelas existentes... ');
  const existingRaw = await mgmt(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'"
  );
  const existing = new Set(JSON.parse(existingRaw.body).map(r => r.table_name));
  console.log(`${existing.size} ja existem\n`);

  // 2. Extract blocks from 02_tables.sql
  const sql = readFileSync('scripts/migration/ddl/02_tables.sql', 'utf8');
  const blocks = extractTableBlocks(sql);

  // 3. Filter to only missing
  const toCreate = blocks.filter(b => !existing.has(b.name));
  console.log(`${toCreate.length} tabelas para criar (de ${blocks.length} no arquivo)\n`);

  // 4. Apply each
  let ok = 0, skip = 0, err = 0;
  for (const blk of toCreate) {
    const raw = sql.slice(blk.start, blk.semi).trim();
    // Replace CREATE TABLE [schema.]name with CREATE TABLE IF NOT EXISTS [schema.]name
    const createStmt = raw.replace(
      /CREATE TABLE (?:\w+\.)?(\w+)/,
      (m, name) => `CREATE TABLE IF NOT EXISTS ${name}`
    );

    process.stdout.write(`  ${blk.name}... `);
    try {
      const r = await mgmt(createStmt);
      if (r.status >= 200 && r.status < 300) {
        ok++; console.log('OK');
      } else {
        let msg = r.body.slice(0, 250);
        try { const j = JSON.parse(r.body); msg = j.message ?? msg; } catch (_) {}
        if (msg.includes('already exists') || msg.includes('duplicate')) {
          skip++; console.log('SKIP');
        } else {
          err++; console.log(`ERR ${r.status}: ${msg.slice(0, 80)}`);
        }
      }
    } catch (e) {
      console.log(`NET: ${e.message}`); err++;
    }
    await sleep(150);
  }

  console.log(`\nTabelas: ${ok} criadas, ${skip} ja existiam, ${err} erros`);

  const final = await mgmt(
    "SELECT count(*)::int as t FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'"
  );
  const count = JSON.parse(final.body)[0].t;
  console.log(`Total: ${count} (antes: ${existing.size}, diff: +${count - existing.size})`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
