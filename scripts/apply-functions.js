// apply-functions.js — aplica functions e triggers usando split por newline-ponto-vírgula-newline
import { readFileSync } from 'node:fs';
import https from 'node:https';

const PAT = process.env.SUPABASE_ACCESS_TOKEN;
if (!PAT) throw new Error('SUPABASE_ACCESS_TOKEN obrigatório; forneça pelo ambiente seguro');
const REF = 'pgxfvjmuubtbowutlide';
const CHUNK = 3; // Functions are large — batch small

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

// Postgres function files use: ...END;\n$function$\n;\n next statement
// So '\n;\n' is the safe delimiter between statements
function splitFunctions(sql) {
  const raw = sql.split('\n;\n');
  return raw.filter(p => {
    const t = p.trim();
    return t && !t.startsWith('--') && !t.startsWith('/*');
  }).map(p => p.trim() + ';');
}

async function runChunks(stmts, label) {
  let ok = 0, skip = 0, err = 0;
  for (let i = 0; i < stmts.length; i += CHUNK) {
    const chunk = stmts.slice(i, i + CHUNK);
    const sql = chunk.join('\n');
    process.stdout.write(`  ${i+1}–${Math.min(i+CHUNK, stmts.length)}/${stmts.length}... `);

    let success = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const r = await mgmt(sql);
        if (r.status >= 200 && r.status < 300) {
          ok += chunk.length; success = true; console.log('OK'); break;
        } else {
          let msg = r.body.slice(0, 400);
          try { msg = JSON.parse(r.body).message ?? msg; } catch (_) {}
          if (msg.includes('already exists') || msg.includes('duplicate') ||
              msg.includes('does not exist')) {
            skip += chunk.length; success = true; console.log('SKIP'); break;
          }
          if (r.status === 502 || r.status === 503 || r.status === 504) {
            if (attempt < 2) { await sleep(1000); continue; }
          }
          err += chunk.length; success = true; console.log(`ERR ${r.status}: ${msg.slice(0, 60)}`); break;
        }
      } catch (e) {
        if (e.message === 'TIMEOUT' && attempt < 2) { await sleep(1500); continue; }
        err += chunk.length; success = true; console.log(`NET: ${e.message}`); break;
      }
    }
    if (!success) { err += chunk.length; console.log('MAX_RETRY'); }
    if (i + CHUNK < stmts.length) await sleep(200);
  }
  console.log(`  -> ${ok} OK, ${skip} SKIP, ${err} ERR`);
  return { ok, skip, err };
}

async function main() {
  // Count functions
  const fnSql = readFileSync('scripts/migration/ddl/08_functions.sql', 'utf8');
  const fns = splitFunctions(fnSql);
  console.log(`Functions: ${fns.length}`);

  // Count triggers
  const trSql = readFileSync('scripts/migration/ddl/09_triggers.sql', 'utf8');
  const trs = splitFunctions(trSql);
  console.log(`Triggers: ${trs.length}`);

  // Count views
  const vwSql = readFileSync('scripts/migration/ddl/10_views.sql', 'utf8');
  const vws = splitFunctions(vwSql);
  console.log(`Views: ${vws.length}\n`);

  console.log('[FUNCTIONS]');
  await runChunks(fns, 'FUNCTIONS');

  await sleep(500);

  console.log('\n[TRIGGERS]');
  await runChunks(trs, 'TRIGGERS');

  await sleep(500);

  console.log('\n[VIEWS]');
  await runChunks(vws, 'VIEWS');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
