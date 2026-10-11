// apply-triggers-views.js — triggers (1 por linha) + views (split por ; + depth tracking)
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

// Triggers: one CREATE TRIGGER statement per line
function splitTriggers(sql) {
  return sql
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('--') && !l.startsWith('/*'))
    .filter(l => l.startsWith('CREATE TRIGGER'));
}

// Views: split by ';' tracking paren/string depth
function splitViews(sql) {
  const stmts = [];
  let buf = '', depth = 0, inStr = false;
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];
    if (c === "'" && !inStr) { inStr = true; buf += c; continue; }
    if (c === "'" && inStr) { inStr = false; buf += c; continue; }
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

async function run(label, stmts, delay = 100) {
  console.log(`\n[${label}] ${stmts.length} statements`);
  let ok = 0, skip = 0, err = 0;
  for (let i = 0; i < stmts.length; i++) {
    const s = stmts[i].trim();
    if (!s) continue;
    process.stdout.write(`  ${i+1}/${stmts.length}... `);

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const r = await mgmt(s);
        if (r.status >= 200 && r.status < 300) {
          ok++; console.log('OK'); break;
        } else {
          let msg = r.body.slice(0, 300);
          try { msg = JSON.parse(r.body).message ?? msg; } catch (_) {}
          if (msg.includes('already exists') || msg.includes('duplicate')) {
            skip++; console.log('SKIP'); break;
          }
          if ((r.status === 502 || r.status === 504) && attempt < 2) {
            await sleep(800); continue;
          }
          if (msg.includes('does not exist') || msg.includes('relation') && msg.includes('not found')) {
            skip++; console.log('SKIP (tabela nao existe)'); break;
          }
          err++; console.log(`ERR ${r.status}: ${msg.slice(0, 60)}`); break;
        }
      } catch (e) {
        if (e.message === 'TIMEOUT' && attempt < 2) { await sleep(1000); continue; }
        err++; console.log(`NET: ${e.message}`); break;
      }
    }
    if (i < stmts.length - 1) await sleep(delay);
  }
  console.log(`  -> ${ok} OK, ${skip} SKIP, ${err} ERR`);
}

async function main() {
  const trigRaw = readFileSync('scripts/migration/ddl/09_triggers.sql', 'utf8');
  const trigs = splitTriggers(trigRaw);
  await run('TRIGGERS', trigs, 80);

  await sleep(500);

  const viewRaw = readFileSync('scripts/migration/ddl/10_views.sql', 'utf8');
  const views = splitViews(viewRaw);
  await run('VIEWS', views, 200);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
