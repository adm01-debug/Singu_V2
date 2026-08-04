// apply-rls.js — RLS ENABLE + POLICIES em statements individuais (resiliente a 502)
import { readFileSync } from 'node:fs';
import https from 'node:https';

const PAT = 'sbp_5bf00619e37fa3d4705d6643f6c051d624fe2203';
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
      timeout: 30000,
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

// Simple: ALTER TABLE ... ENABLE ROW LEVEL SECURITY
// and: CREATE POLICY ... ON ... FOR ... USING (...)
function splitSimpleStmts(sql) {
  const stmts = [];
  let buf = '', depth = 0, inStr = false;
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];
    if (c === "'" && !inStr) { inStr = true; buf += c; continue; }
    if (c === "'" && inStr) {
      if (sql[i+1] === "'") { buf += "''"; i++; }
      else inStr = false;
      buf += c; continue;
    }
    if (!inStr) {
      if (c === '(') { depth++; buf += c; continue; }
      if (c === ')') { depth--; buf += c; continue; }
      if (c === ';' && depth === 0) {
        const s = buf.trim();
        if (s && !s.startsWith('--')) stmts.push(s);
        buf = ''; continue;
      }
    }
    buf += c;
  }
  if (buf.trim()) stmts.push(buf.trim());
  return stmts;
}

async function runFile(label, filename, expectedCount) {
  console.log(`\n[${label}]`);
  const raw = readFileSync(filename, 'utf8');
  const stmts = splitSimpleStmts(raw);
  console.log(`  ${stmts.length} statements (esperados: ${expectedCount})`);

  let ok = 0, skip = 0, err = 0, retry = 0;
  for (let i = 0; i < stmts.length; i++) {
    const s = stmts[i].trim();
    if (!s || s.startsWith('--')) continue;
    process.stdout.write(`  ${i+1}/${stmts.length}... `);

    let success = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const r = await mgmt(s);
        if (r.status >= 200 && r.status < 300) {
          ok++; success = true; console.log('OK');
          break;
        } else {
          let msg = r.body.slice(0, 300);
          try { msg = JSON.parse(r.body).message ?? msg; } catch (_) {}
          if (msg.includes('already exists') || msg.includes('duplicate')) {
            skip++; success = true; console.log('SKIP');
            break;
          }
          if (r.status === 502 || r.status === 504 || r.status === 503) {
            // Gateway error — retry after delay
            if (attempt < 2) {
              await sleep(500 * (attempt + 1));
              retry++;
              continue;
            }
          }
          // Hard error
          err++; success = true; console.log(`ERR ${r.status}: ${msg.slice(0, 60)}`);
          break;
        }
      } catch (e) {
        if (e.message === 'TIMEOUT' && attempt < 2) {
          await sleep(1000); retry++; continue;
        }
        err++; success = true; console.log(`NET: ${e.message}`);
        break;
      }
    }
    if (!success) { err++; console.log('MAX RETRY'); }
    if (i < stmts.length - 1) await sleep(100);
  }
  console.log(`  -> ${ok} OK, ${skip} SKIP, ${err} ERR (${retry} retries)`);
}

async function main() {
  await runFile('RLS ENABLE', 'scripts/migration/ddl/06_rls_enable.sql', 257);
  await runFile('RLS POLICIES', 'scripts/migration/ddl/07_policies.sql', 725);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
