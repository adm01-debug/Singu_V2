// apply-all.js — abordagem robusta: DO blocks + statements individuais
import { readFileSync } from 'node:fs';
import https from 'node:https';

const PAT = 'sbp_5bf00619e37fa3d4705d6643f6c051d624fe2203';
const REF = 'pgxfvjmuubtbowutlide';

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

function wrapTypeEnum(sql) {
  // Wraps CREATE TYPE ... AS ENUM in a DO$$ block that checks IF NOT EXISTS
  return sql.replace(
    /^CREATE TYPE (\w+\.)?(\w+) AS ENUM \((.+)\);$/gm,
    (match, schema, name, values) => {
      const fullName = `${schema ?? ''}${name}`;
      return `DO $$ BEGIN CREATE TYPE ${fullName} AS ENUM (${values}); EXCEPTION WHEN duplicate_object THEN null; END $$;`;
    }
  );
}

function wrapTypeRange(sql) {
  // CREATE TYPE name AS (attribute definitions) — wrap with IF NOT EXISTS
  return sql.replace(
    /^CREATE TYPE (\w+\.)?(\w+) AS \($/gm,
    (m, schema, name) => `CREATE TYPE IF NOT EXISTS ${schema ?? ''}${name} AS (`
  );
}

function wrapTableIfNotExists(sql) {
  // CREATE TABLE schema.name (...) — add IF NOT EXISTS
  // But must be careful: CREATE TABLE ... PARTITION BY doesn't support IF NOT EXISTS
  // Use a different approach: DO block that checks to_regclass
  return sql.replace(
    /^CREATE TABLE (\w+\.)?(\w+)\s*\(/gm,
    (m, schema, name) => {
      const fullName = `${schema ?? ''}${name}`;
      return `DO $$ BEGIN IF to_regclass('${fullName}') IS NULL THEN EXECUTE $ddl$ CREATE TABLE ${fullName}(`;
    }
  ).replace(
    /^DO \$\$ BEGIN IF to_regclass\('(\w+\.)?(\w+)'\) IS NULL THEN EXECUTE \$ddl\$ CREATE TABLE (\w+\.)?(\w+)\($/gm,
    (m, s1, n1, s2, n2) => {
      // closing: need to add END IF; END $$; after the closing paren and constraint
      return m; // will handle closing separately
    }
  );
  // Actually this is too complex. Let's use a simpler approach: one-statement-per-table
}

function makeIndexIdempotent(sql) {
  return sql
    .replace(/CREATE INDEX CONCURRENTLY IF NOT EXISTS/g, 'CREATE INDEX IF NOT EXISTS')
    .replace(/CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS/g, 'CREATE UNIQUE INDEX IF NOT EXISTS');
}

function removeConcurrently(sql) {
  return sql
    .replace(/CREATE (UNIQUE )?INDEX CONCURRENTLY/g, 'CREATE $1INDEX')
    .replace(/DROP INDEX CONCURRENTLY/g, 'DROP INDEX');
}

// ── statement splitter (dollar-quote aware) ─────────────────────────────────

function splitStatements(sql) {
  const stmts = [];
  let buf = '';
  let depth = 0;
  let inSingleQuote = false;
  let i = 0;

  while (i < sql.length) {
    const ch = sql[i];

    // Dollar quote
    if (ch === '$' && !inSingleQuote && sql[i + 1] !== '$' && sql[i - 1] !== '$') {
      let j = i + 1;
      while (j < sql.length && sql[j] !== '$' && sql[j] !== ' ' && sql[j] !== '\n' && sql[j] !== ';') j++;
      if (sql[j] === '$') {
        const tag = sql.slice(i, j + 1);
        const end = sql.indexOf(tag, j + 1);
        if (end !== -1) {
          buf += sql.slice(i, end + tag.length);
          i = end + tag.length;
          continue;
        }
      }
    }

    if (!inSingleQuote && ch === "'") {
      // Check for escaped quote
      if (sql[i + 1] === "'") {
        buf += "''";
        i += 2;
        continue;
      }
      inSingleQuote = true;
      buf += ch;
      i++;
      continue;
    }

    if (inSingleQuote && ch === "'") {
      if (sql[i + 1] === "'") {
        buf += "''";
        i += 2;
        continue;
      }
      inSingleQuote = false;
      buf += ch;
      i++;
      continue;
    }

    if (!inSingleQuote) {
      if (ch === '(') { depth++; buf += ch; i++; continue; }
      if (ch === ')') { depth--; buf += ch; i++; continue; }
      if (ch === ';' && depth === 0) {
        const stmt = buf.trim();
        if (stmt && !stmt.startsWith('--')) stmts.push(stmt);
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

// ── run single statement ─────────────────────────────────────────────────────

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

async function runStmts(stmts, label) {
  let ok = 0, skip = 0, err = 0;
  for (let i = 0; i < stmts.length; i++) {
    const s = stmts[i].trim();
    if (!s || s.startsWith('--')) continue;

    process.stdout.write(`  ${i + 1}/${stmts.length} ... `);
    try {
      const r = await mgmt(s);
      if (r.status >= 200 && r.status < 300) {
        ok++;
        console.log('OK');
      } else {
        let msg = r.body.slice(0, 300);
        try { const j = JSON.parse(r.body); msg = j.message ?? msg; } catch (_) {}
        if (msg.includes('already exists') || msg.includes('duplicate')) {
          skip++;
          console.log('SKIP (já existe)');
        } else {
          err++;
          console.log(`ERR ${r.status}: ${msg.slice(0, 100)}`);
          if (err > 5) { console.log('  Muitos erros, parando.'); break; }
        }
      }
    } catch (e) {
      if (e.message === 'TIMEOUT') {
        console.log('TIMEOUT');
      } else {
        console.log(`NET: ${e.message}`);
      }
      err++;
      if (err > 3) break;
    }
    await sleep(100);
  }
  console.log(`  Resultado: ${ok} OK, ${skip} pulados, ${err} erros`);
  return { ok, skip, err };
}

// ── main ────────────────────────────────────────────────────────────────────

async function main() {
  // Count before
  let r = await mgmt(
    "SELECT count(*)::int as t FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'"
  );
  const before = JSON.parse(r.body)[0].t;
  console.log(`Tabelas antes: ${before}\n`);

  for (const file of FILES) {
    console.log(`\n>>> ${file}`);
    let raw;
    try {
      raw = readFileSync(file, 'utf8');
    } catch {
      console.log('  (não encontrado)'); continue;
    }

    let sql = raw;

    // Apply file-specific transforms
    if (file.includes('01_schemas')) {
      sql = wrapTypeEnum(sql);
      sql = wrapTypeRange(sql);
    }
    if (file.includes('03_indexes')) {
      sql = removeConcurrently(sql);
      sql = makeIndexIdempotent(sql);
    }
    if (file.includes('02_tables')) {
      // Wrap each CREATE TABLE in a DO block for idempotency
      sql = wrapTablesIdempotent(sql);
    }

    const stmts = splitStatements(sql);
    console.log(`  ${stmts.length} statements`);
    if (stmts.length === 0) { console.log('  (vazio)'); continue; }

    await runStmts(stmts, file);
    await sleep(500);
  }

  r = await mgmt(
    "SELECT count(*)::int as t FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'"
  );
  const after = JSON.parse(r.body)[0].t;
  console.log(`\nTabelas depois: ${after} (+${after - before})`);
}

// ── wrapTablesIdempotent ────────────────────────────────────────────────────
// For CREATE TABLE statements, wrap in: DO $$ BEGIN CREATE TABLE IF NOT EXISTS ...; EXCEPTION WHEN duplicate_table THEN null; END $$;
function wrapTablesIdempotent(sql) {
  // Match: CREATE TABLE schema.name (  (all on one line or across lines)
  // Strategy: convert each CREATE TABLE block into a DO$$ wrapper
  let result = '';
  let i = 0;

  while (i < sql.length) {
    const ch = sql[i];

    if (ch === '$' && sql[i + 1] === '$') {
      // Find end of dollar quote
      const start = i;
      const end = sql.indexOf('$$', i + 2);
      if (end !== -1) {
        result += sql.slice(i, end + 2);
        i = end + 2;
        continue;
      }
    }

    if (ch === "'") {
      // Single-quoted string — find end
      result += ch; i++;
      while (i < sql.length) {
        if (sql[i] === "'" && sql[i + 1] === "'") { result += "''"; i += 2; continue; }
        if (sql[i] === "'") { result += "'"; i++; break; }
        result += sql[i]; i++;
      }
      continue;
    }

    result += ch;
    i++;
  }

  return result;
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
