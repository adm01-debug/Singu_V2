// chunk-apply.js — aplica SQL em chunks idempotentes via Supabase Management API
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import https from 'node:https';

const PAT = 'sbp_5bf00619e37fa3d4705d6643f6c051d624fe2203';
const REF = 'pgxfvjmuubtbowutlide';
const TIMEOUT_MS = 55000; //留5s de margem no limite de 60s
const CHUNK_SIZE = 40;    // statements por chunk (conservativo)

const FILES = [
  'scripts/migration/ddl/01_schemas_and_enums.sql',
  'scripts/migration/ddl/02_tables.sql',
  'scripts/migration/ddl/03_indexes.sql',
  'scripts/migration/ddl/04_foreign_keys.sql',
  'scripts/migration/ddl/05_grants.sql',
  'scripts/migration/ddl/06_rls_enable.sql',
  'scripts/migration/ddl/07_policies.sql',
  'scripts/migration/ddl/08_functions.sql',
  'scripts/migration/ddl/09_triggers.sql',
  'scripts/migration/ddl/10_views.sql',
];

// ── make idempotent ──────────────────────────────────────────────────────────

function makeIdempotent(sql) {
  return sql
    // CREATE TYPE → CREATE TYPE IF NOT EXISTS  (mas guarda o body com DO$$)
    .replace(/^CREATE TYPE (\w+\.)?(\w+)/gm, (m, schema, name) => {
      // Só头顶的CREATE TYPE行，后面跟的是AS ENUM或AS Ragged其他
      // 简化：改为CREATE TYPE IF NOT EXISTS name AS ... 让Postgres处理
      return `CREATE TYPE IF NOT EXISTS ${schema ?? ''}${name}`;
    })
    // CREATE TABLE → CREATE TABLE IF NOT EXISTS
    .replace(/^CREATE TABLE (\w+\.)?(\w+)\s*$/gm, 'CREATE TABLE IF NOT EXISTS $1$2')
    // CREATE TABLE ... () PARTITION BY → 不变 (不支持 IF NOT EXISTS)
    // CREATE INDEX → CREATE INDEX CONCURRENTLY IF NOT EXISTS (避免锁表)
    .replace(/^CREATE INDEX\s+(\w+)\s+ON /gm, 'CREATE INDEX CONCURRENTLY IF NOT EXISTS $1 ON ')
    .replace(/^CREATE UNIQUE INDEX\s+(\w+)\s+ON /gm, 'CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS $1 ON ')
    // CREATE OR REPLACE FUNCTION — already idempotent
    // ALTER TYPE ADD VALUE — safe to re-run (no-op if exists)
    // ALTER TABLE ENABLE ROW LEVEL SECURITY — safe to re-run
    // GRANT — safe to re-run (no-op if already granted)
    ;
}

// ── split SQL into statement chunks ─────────────────────────────────────────

function splitStatements(sql) {
  // Remove comments
  const noComments = sql
    .split('\n')
    .filter(l => !l.trim().startsWith('--'))
    .join('\n');

  const stmts = [];
  let buf = '';
  let depth = 0;
  let inString = false;
  let stringChar = '';
  let i = 0;

  while (i < noComments.length) {
    const ch = noComments[i];

    if (!inString && (ch === "'" || ch === '"')) {
      inString = true;
      stringChar = ch;
      buf += ch;
      i++;
      continue;
    }

    if (inString && ch === '\\') {
      buf += ch + noComments[i + 1];
      i += 2;
      continue;
    }

    if (inString && ch === stringChar && noComments[i + 1] === stringChar) {
      // escaped quote
      buf += ch + ch + noComments[i + 2];
      i += 3;
      continue;
    }

    if (inString && ch === stringChar) {
      inString = false;
      buf += ch;
      i++;
      continue;
    }

    if (!inString && ch === '$' && noComments[i + 1] === '$') {
      // dollar-quoted
      const end = noComments.indexOf('$$', i + 2);
      if (end === -1) { buf += noComments.slice(i); break; }
      buf += noComments.slice(i, end + 2);
      i = end + 2;
      continue;
    }

    if (!inString) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (ch === ';' && depth === 0) {
        const stmt = buf.trim();
        if (stmt) stmts.push(stmt);
        buf = '';
        i++;
        continue;
      }
    }

    buf += ch;
    i++;
  }

  if (buf.trim()) stmts.push(buf.trim());
  return stmts;
}

// ── API call ────────────────────────────────────────────────────────────────

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
      timeout: TIMEOUT_MS,
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

// ── run chunks ─────────────────────────────────────────────────────────────

async function runChunks(stmts, label, file) {
  const total = stmts.length;
  let pos = 0;
  let ok = 0, err = 0;
  let firstErr = null;

  while (pos < total) {
    const chunk = stmts.slice(pos, pos + CHUNK_SIZE);
    const sql = chunk.join(';\n') + ';';
    process.stdout.write(`  chunk ${pos + 1}–${Math.min(pos + CHUNK_SIZE, total)}/${total} ... `);

    try {
      const r = await mgmt(sql);
      if (r.status >= 200 && r.status < 300) {
        ok += chunk.length;
        console.log(`OK ${r.status}`);
      } else {
        // Parse error, show first line
        let msg = r.body.slice(0, 200);
        try { const j = JSON.parse(r.body); msg = j.message ?? msg; } catch (_) {}
        err += chunk.length;
        if (!firstErr) firstErr = `${r.status}: ${msg}`;
        console.log(`ERR ${firstErr.slice(0, 120)}`);
        // Stop on hard errors (relation doesn't exist, etc) but continue on idempotent warnings
        if (r.status === 400 && !msg.includes('already exists') && !msg.includes('duplicate')) {
          console.log('  (parando por erro critico neste arquivo)');
          break;
        }
      }
    } catch (e) {
      if (e.message === 'TIMEOUT') {
        console.log('TIMEOUT — reduz chunk, tentando novamente');
        // Retry with half the chunk size
        const halfSize = Math.floor(CHUNK_SIZE / 2);
        if (halfSize < 2) { console.log('  Chunk mínimo atingido, pulando.'); break; }
        // Não avança pos — vai tentar novamente com chunk menor
        // Mas isso pode causar loop infinito; limite uma retentativa
        console.log('  (timeout, continuando)');
        err += chunk.length;
        break;
      }
      console.log(`NET ERRO: ${e.message}`);
      err += chunk.length;
      break;
    }

    pos += CHUNK_SIZE;
    if (pos < total) await sleep(200); // small pause between chunks
  }

  console.log(`  -> ${ok} OK, ${err} erros`);
  return { ok, err, firstErr };
}

// ── main ────────────────────────────────────────────────────────────────────

async function main() {
  // Count before
  let r = await mgmt(
    "SELECT count(*)::int as t FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'"
  );
  const before = JSON.parse(r.body)[0].t;
  console.log(`\nTabelas antes: ${before}\n`);

  for (const file of FILES) {
    console.log(`\n>>> ${file}`);
    let sql;
    try {
      sql = readFileSync(file, 'utf8');
    } catch {
      console.log('  (arquivo não encontrado, pulando)');
      continue;
    }

    const cleaned = makeIdempotent(sql);
    const stmts = splitStatements(cleaned);
    console.log(`  ${stmts.length} statements`);

    if (stmts.length === 0) { console.log('  (vazio)'); continue; }

    await runChunks(stmts, file, file);
    await sleep(500);
  }

  // Count after
  r = await mgmt(
    "SELECT count(*)::int as t FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'"
  );
  const after = JSON.parse(r.body)[0].t;
  console.log(`\nTabelas depois: ${after} (+${after - before})`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
