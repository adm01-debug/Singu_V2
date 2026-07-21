// Dual-Write Divergence Detector — compara linhas modificadas nos últimos N minutos
// entre banco LEGADO e DESTINO. Se mismatch > threshold, aciona system_alerts e
// pausa dual-write via feature_flags.
//
// Uso: deno run --allow-env --allow-net verify/dual-write-diverge.ts
// Env: LEGACY_SUPABASE_URL, LEGACY_SERVICE_ROLE_KEY,
//      DEST_SUPABASE_URL, DEST_SERVICE_ROLE_KEY,
//      WINDOW_MIN (default 5), MISMATCH_PCT (default 0.1), TABLES (csv)
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const LEG_URL = Deno.env.get("LEGACY_SUPABASE_URL");
const LEG_KEY = Deno.env.get("LEGACY_SERVICE_ROLE_KEY");
const DST_URL = Deno.env.get("DEST_SUPABASE_URL");
const DST_KEY = Deno.env.get("DEST_SERVICE_ROLE_KEY");
const WINDOW = Number(Deno.env.get("WINDOW_MIN") ?? "5");
const THRESHOLD = Number(Deno.env.get("MISMATCH_PCT") ?? "0.1");
const TABLES = (Deno.env.get("TABLES") ?? "contacts,deals,interactions").split(",").map((s) => s.trim());

if (!LEG_URL || !LEG_KEY || !DST_URL || !DST_KEY) {
  console.error("faltando LEGACY_/DEST_ SUPABASE_URL/SERVICE_ROLE_KEY");
  Deno.exit(2);
}

const leg = createClient(LEG_URL, LEG_KEY, { auth: { persistSession: false } });
const dst = createClient(DST_URL, DST_KEY, { auth: { persistSession: false } });
const since = new Date(Date.now() - WINDOW * 60_000).toISOString();

interface Row { id: string; updated_at: string }

async function fetchRecent(sb: SupabaseClient, table: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const { data, error } = await sb.from(table).select("id, updated_at").gte("updated_at", since).limit(5000);
  if (error) throw new Error(`${table}: ${error.message}`);
  for (const r of (data ?? []) as Row[]) map.set(String(r.id), r.updated_at);
  return map;
}

let hardFail = false;
const summary: Record<string, { legacy: number; dest: number; mismatch: number; pct: number }> = {};

for (const t of TABLES) {
  try {
    const [L, D] = await Promise.all([fetchRecent(leg, t), fetchRecent(dst, t)]);
    let mismatch = 0;
    for (const [id, ts] of L) {
      const dts = D.get(id);
      if (!dts || dts !== ts) mismatch++;
    }
    const total = Math.max(L.size, 1);
    const pct = (mismatch / total) * 100;
    summary[t] = { legacy: L.size, dest: D.size, mismatch, pct: Number(pct.toFixed(3)) };
    console.log(`${t}: legacy=${L.size} dest=${D.size} mismatch=${mismatch} (${pct.toFixed(3)}%)`);
    if (pct > THRESHOLD) hardFail = true;
  } catch (e) {
    console.error(`${t}: ERRO — ${e instanceof Error ? e.message : e}`);
    hardFail = true;
  }
}

if (hardFail) {
  console.error("\n🚨 Divergência acima do threshold — pausando dual-write");
  await dst.from("system_alerts").insert({
    alert_type: "dual_write_divergence",
    severity: "critical",
    message: `Dual-write divergiu > ${THRESHOLD}% em ${WINDOW}min`,
    metadata: summary,
  });
  await dst.from("feature_flags").upsert({ key: "dual_write_enabled", enabled: false, updated_at: new Date().toISOString() });
  Deno.exit(1);
}

console.log("\n✔ Dual-write dentro do threshold");