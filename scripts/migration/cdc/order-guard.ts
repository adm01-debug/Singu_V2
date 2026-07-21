// CDC Event Ordering Guard — valida monotonicidade de LSN e detecta clock skew
// entre origem e destino durante replay. Aborta se skew > SKEW_MAX_SEC.
//
// Uso: deno run --allow-env --allow-net cdc/order-guard.ts
// Env: SRC_DB_URL, DEST_DB_URL, SKEW_MAX_SEC (default 2), POLL_SEC (default 15)

const SRC = Deno.env.get("SRC_DB_URL");
const DST = Deno.env.get("DEST_DB_URL");
const SLOT = Deno.env.get("CDC_SLOT") ?? "migration_slot";
const SKEW_MAX = Number(Deno.env.get("SKEW_MAX_SEC") ?? "2");
const POLL = Number(Deno.env.get("POLL_SEC") ?? "15");

if (!SRC || !DST) { console.error("SRC_DB_URL e DEST_DB_URL obrigatórios"); Deno.exit(2); }

interface Sample { lsn: string; commit_ts: number; local_ts: number }

async function psqlJson(url: string, sql: string): Promise<Sample | null> {
  const cmd = new Deno.Command("psql", {
    args: [url, "-Atqc", sql],
    stdout: "piped", stderr: "piped",
  });
  const { code, stdout, stderr } = await cmd.output();
  if (code !== 0) {
    console.error("psql err:", new TextDecoder().decode(stderr));
    return null;
  }
  const line = new TextDecoder().decode(stdout).trim();
  if (!line) return null;
  const [lsn, commit_ts, local_ts] = line.split("|");
  return {
    lsn,
    commit_ts: Date.parse(commit_ts) / 1000,
    local_ts: Date.parse(local_ts) / 1000,
  };
}

function cmpLsn(a: string, b: string): number {
  const [ah, al] = a.split("/").map((x) => parseInt(x, 16));
  const [bh, bl] = b.split("/").map((x) => parseInt(x, 16));
  if (ah !== bh) return ah - bh;
  return al - bl;
}

const log = (m: string) => console.log(`[order-guard ${new Date().toISOString()}] ${m}`);
let lastLsn = "0/0";
let critical = 0;

log(`iniciado slot=${SLOT} skew_max=${SKEW_MAX}s poll=${POLL}s`);

while (true) {
  const src = await psqlJson(SRC,
    `SELECT confirmed_flush_lsn::text || '|' || COALESCE(now()::text,'') || '|' || now()::text
       FROM pg_replication_slots WHERE slot_name = '${SLOT}'`);
  const dst = await psqlJson(DST, `SELECT '0/0' || '|' || now()::text || '|' || now()::text`);

  if (!src) { log("⚠ slot não encontrado — retry"); await new Promise((r) => setTimeout(r, POLL * 1000)); continue; }

  // 1) Monotonicidade
  if (cmpLsn(src.lsn, lastLsn) < 0) {
    log(`🚨 LSN REGRESSION last=${lastLsn} agora=${src.lsn}`);
    critical++;
  } else {
    lastLsn = src.lsn;
  }

  // 2) Clock skew origem × destino
  const skew = Math.abs((src.local_ts ?? 0) - (dst?.local_ts ?? 0));
  if (skew > SKEW_MAX) {
    log(`🚨 CLOCK SKEW=${skew.toFixed(2)}s > ${SKEW_MAX}s`);
    critical++;
  } else {
    log(`✔ lsn=${src.lsn} skew=${skew.toFixed(2)}s`);
  }

  if (critical >= 3) {
    log("🚨 3+ violações consecutivas — abortando (operador deve investigar)");
    Deno.exit(1);
  }

  await new Promise((r) => setTimeout(r, POLL * 1000));
}