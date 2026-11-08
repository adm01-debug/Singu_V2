// fix-enums.js — cria enums faltantes e cria system_alerts corrigido
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
      res.on('end', () => resolve({ status: res.statusCode, body: d.slice(0, 500) }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function createEnum(name, values) {
  const vals = values.map(v => `'${v}'`).join(',');
  const sql = `DO $$ BEGIN CREATE TYPE ${name} AS ENUM (${vals}); EXCEPTION WHEN duplicate_object THEN null; END $$;`;
  process.stdout.write(`  ${name}... `);
  const r = await mgmt(sql);
  if (r.status >= 200 && r.status < 300) {
    console.log('OK');
  } else {
    console.log(`ERR ${r.status}: ${r.body.slice(0, 150)}`);
  }
}

async function main() {
  console.log('Criando enums faltantes:');
  await createEnum('entity_relationship_role', [
    'buyer','manager','owner','decision_maker','influencer','user',
    'sponsor','partner','supplier','subsidiary','parent','employee_of','other'
  ]);
  await createEnum('entity_type', ['company', 'contact']);
  await createEnum('error_severity', ['info', 'warning', 'error', 'critical']);
  await createEnum('passo_outcome', ['respondeu_positivo','respondeu_neutro','nao_respondeu','nao_atendeu','pulou']);
  await createEnum('validation_kind', ['email', 'phone']);
  await createEnum('validation_queue_status', ['pending', 'processing', 'done', 'error']);

  // system_alerts: corrected DEFAULT
  console.log('\nCriando system_alerts (DEFAULT corrigido):');
  const r = await mgmt(
    `CREATE TABLE IF NOT EXISTS system_alerts (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      alert_type text NOT NULL,
      severity text NOT NULL,
      threshold_pct numeric NOT NULL,
      consumed_pct numeric NOT NULL,
      message text NOT NULL,
      metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
      acknowledged_at timestamp with time zone,
      acknowledged_by uuid,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      is_simulated boolean DEFAULT false,
      CONSTRAINT system_alerts_pkey PRIMARY KEY (id),
      CONSTRAINT system_alerts_severity_check CHECK ((severity = ANY (ARRAY['warning'::text, 'high'::text, 'critical'::text])))
    )`
  );
  if (r.status >= 200 && r.status < 300) {
    console.log('  OK');
  } else {
    console.log(`  ERR ${r.status}: ${r.body.slice(0, 200)}`);
  }

  // Final count
  const count = await mgmt(
    "SELECT count(*)::int as t FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'"
  );
  console.log(`\nTotal de tabelas: ${JSON.parse(count.body)[0].t}`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
