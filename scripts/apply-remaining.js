// apply-remaining.js — aplica indexes, FKs, grants, RLS, functions, triggers, views
import { readFileSync } from 'node:fs';
import https from 'node:https';

const PAT = 'sbp_5bf00619e37fa3d4705d6643f6c051d624fe2203';
const REF = 'pgxfvjmuubtbowutlide';
const CHUNK = 8; // small batches to stay under 60s

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

function splitStmts(sql) {
  const stmts = [];
  let buf = '', depth = 0, inStr = false, esc = false;
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];
    if (esc) { buf += c; esc = false; continue; }
    if (c === '\\') { buf += c; esc = true; continue; }
    if (!inStr && c === "'") { inStr = true; buf += c; continue; }
    if (inStr && c === "'") { inStr = false; buf += c; continue; }
    if (!inStr && c === '$' && sql[i+1] === '$') {
      const j = sql.indexOf('$$', i+2);
      if (j !== -1) { buf += sql.slice(i, j+2); i = j+1; continue; }
    }
    if (!inStr) {
      if (c === '(') { depth++; buf += c; continue; }
      if (c === ')') { depth--; buf += c; continue; }
      if (c === ';' && depth === 0) {
        const s = buf.trim();
        if (s && !s.startsWith('--')) stmts.push(s);
        buf = '';
        continue;
      }
    }
    buf += c;
  }
  if (buf.trim()) stmts.push(buf.trim());
  return stmts;
}

function clean(stmt) {
  return stmt
    .replace(/CREATE INDEX CONCURRENTLY IF NOT EXISTS/g, 'CREATE INDEX IF NOT EXISTS')
    .replace(/CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS/g, 'CREATE UNIQUE INDEX IF NOT EXISTS')
    .replace(/CREATE INDEX CONCURRENTLY/g, 'CREATE INDEX')
    .replace(/CREATE UNIQUE INDEX CONCURRENTLY/g, 'CREATE UNIQUE INDEX')
    .replace(/CREATE TABLE IF NOT EXISTS \w+ \([\s]*\)/g, m => m); // keep table stubs
}

async function runChunks(stmts, label) {
  let ok = 0, skip = 0, err = 0;
  const cleaned = stmts.map(clean);
  for (let i = 0; i < cleaned.length; i += CHUNK) {
    const chunk = cleaned.slice(i, i + CHUNK);
    const sql = chunk.join(';\n') + ';';
    process.stdout.write(`  ${i+1}–${Math.min(i+CHUNK, cleaned.length)}/${cleaned.length}... `);
    try {
      const r = await mgmt(sql);
      if (r.status >= 200 && r.status < 300) {
        ok += chunk.length;
        console.log('OK');
      } else {
        let msg = r.body.slice(0, 300);
        try { msg = JSON.parse(r.body).message ?? msg; } catch (_) {}
        if (msg.includes('already exists') || msg.includes('duplicate') ||
            msg.includes('does not exist') || msg.includes('not found')) {
          skip += chunk.length;
          console.log('SKIP');
        } else {
          err += chunk.length;
          console.log(`ERR ${msg.slice(0, 80)}`);
        }
      }
    } catch (e) {
      console.log(`NET: ${e.message}`);
      err += chunk.length;
    }
    if (i + CHUNK < cleaned.length) await sleep(200);
  }
  console.log(`  -> ${ok} OK, ${skip} pulados, ${err} erros`);
}

async function main() {
  const files = [
    { f: 'scripts/migration/ddl/03_indexes.sql',       l: 'INDEXES' },
    { f: 'scripts/migration/ddl/04_foreign_keys.sql',   l: 'FOREIGN KEYS' },
    { f: 'scripts/migration/ddl/05_grants.sql',         l: 'GRANTS' },
    { f: 'scripts/migration/ddl/06_rls_enable.sql',      l: 'RLS ENABLE' },
    { f: 'scripts/migration/ddl/07_policies.sql',       l: 'RLS POLICIES' },
    { f: 'scripts/migration/ddl/08_functions.sql',       l: 'FUNCTIONS' },
    { f: 'scripts/migration/ddl/09_triggers.sql',       l: 'TRIGGERS' },
    { f: 'scripts/migration/ddl/10_views.sql',          l: 'VIEWS' },
  ];

  for (const { f, l } of files) {
    console.log(`\n[${l}]`);
    let raw;
    try { raw = readFileSync(f, 'utf8'); } catch { console.log('  não encontrado'); continue; }
    const stmts = splitStmts(raw);
    console.log(`  ${stmts.length} statements`);
    if (stmts.length === 0) continue;
    await runChunks(stmts, l);
    await sleep(500);
  }

  const count = await mgmt(
    "SELECT count(*)::int as t FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'"
  );
  console.log(`\nFinal: ${JSON.parse(count.body)[0].t} tabelas`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
