// retry-failed.js — tenta criar as 5 tabelas que falharam por falta de enums
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
    req.write(body);
    req.end();
  });
}

function extractTable(sql, name) {
  const re = new RegExp(`CREATE TABLE (?:public\\.)?${name}\\s*\\([\\s\\S]*?\\);`);
  const m = sql.match(re);
  if (!m) return null;
  return m[0].replace(
    new RegExp(`CREATE TABLE (?:public\\.)?${name}`, 'i'),
    `CREATE TABLE IF NOT EXISTS ${name}`
  );
}

async function main() {
  const tablesSql = readFileSync('scripts/migration/ddl/02_tables.sql', 'utf8');
  const failed = ['entity_relationships', 'error_logs', 'proximo_passo_feedback', 'validation_queue'];

  console.log('Criando tabelas que falharam antes:\n');
  for (const name of failed) {
    const stmt = extractTable(tablesSql, name);
    if (!stmt) { console.log(`  ${name}: não encontrada no arquivo`); continue; }

    process.stdout.write(`  ${name}... `);
    const r = await mgmt(stmt);
    if (r.status >= 200 && r.status < 300) {
      console.log('OK');
    } else {
      let msg = r.body.slice(0, 300);
      try { msg = JSON.parse(r.body).message ?? msg; } catch (_) {}
      console.log(`ERR ${r.status}: ${msg.slice(0, 120)}`);
    }
  }

  const count = await mgmt(
    "SELECT count(*)::int as t FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'"
  );
  console.log(`\nTotal: ${JSON.parse(count.body)[0].t} tabelas`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
