// apply-migrations.js — usa Supabase Management API via PAT
import { readFileSync } from 'node:fs';
import https from 'node:https';

const PAT = 'sbp_5bf00619e37fa3d4705d6643f6c051d624fe2203';
const REF = 'pgxfvjmuubtbowutlide';

const FILES = [
  'scripts/migration/ddl/00_extensions.sql',
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

async function mgmt(sql) {
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
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  // Status inicial
  const start = await mgmt(
    "SELECT count(*)::int as t FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'"
  );
  const before = JSON.parse(start.body);
  console.log(`Tabelas antes: ${before[0].t}\n`);

  for (const file of FILES) {
    const sql = readFileSync(file, 'utf8');
    const lines = sql.split('\n').length;
    const content = sql.split('\n').filter(l => !l.trim().startsWith('--')).join('\n').trim();
    if (!content) { console.log(`[SKIP] ${file}`); continue; }

    process.stdout.write(`[RUN ] ${file} (${lines} linhas) ... `);
    const t0 = Date.now();
    try {
      const r = await mgmt(sql);
      const ms = Date.now() - t0;
      if (r.status >= 200 && r.status < 300) {
        console.log(`OK ${r.status} (${ms}ms)`);
      } else {
        const err = JSON.parse(r.body);
        console.log(`ERRO ${r.status}: ${err.message ?? err.slice(0, 200)}`);
      }
    } catch (err) {
      console.log(`NET ERRO: ${err.message}`);
    }
  }

  // Status final
  const end = await mgmt(
    "SELECT count(*)::int as t FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'"
  );
  const after = JSON.parse(end.body);
  console.log(`\nTabelas depois: ${after[0].t} (+${after[0].t - before[0].t})`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
