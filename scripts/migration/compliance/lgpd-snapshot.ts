// LGPD Snapshot Manifest — hash agregado + assinatura HMAC do dataset migrado.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const DEST_URL = Deno.env.get("DEST_SUPABASE_URL");
const DEST_KEY = Deno.env.get("DEST_SERVICE_ROLE_KEY");
const SECRET = Deno.env.get("LGPD_MANIFEST_SECRET");
if (!DEST_URL || !DEST_KEY || !SECRET) {
  console.error("faltando DEST_SUPABASE_URL/DEST_SERVICE_ROLE_KEY/LGPD_MANIFEST_SECRET"); Deno.exit(2);
}

const TABLES = ["contacts","companies","interactions","whatsapp_messages","call_logs","deals","user_roles"];
const sb = createClient(DEST_URL, DEST_KEY, { auth: { persistSession: false } });

interface Entry { table: string; count: number; sample_hash: string; }
const entries: Entry[] = [];
for (const t of TABLES) {
  const { count } = await sb.from(t).select("id", { count: "exact", head: true });
  const { data } = await sb.from(t).select("id, updated_at, created_at").order("id").limit(500);
  const enc = new TextEncoder().encode(JSON.stringify(data ?? []));
  const h = await crypto.subtle.digest("SHA-256", enc);
  const hex = Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, "0")).join("");
  entries.push({ table: t, count: count ?? 0, sample_hash: hex });
  console.log(`  ${t}: count=${count} hash=${hex.slice(0,16)}…`);
}

const aggEnc = new TextEncoder().encode(JSON.stringify(entries));
const aggH = await crypto.subtle.digest("SHA-256", aggEnc);
const aggregate_hash = Array.from(new Uint8Array(aggH)).map((b) => b.toString(16).padStart(2, "0")).join("");

const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(SECRET),
  { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(aggregate_hash));
const signature = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");

const manifest = {
  version: "1.0",
  generated_at: new Date().toISOString(),
  destination: DEST_URL,
  tables: entries,
  aggregate_hash,
  signature,
};
const path = new URL(`./lgpd-manifest-${Date.now()}.json`, import.meta.url);
await Deno.writeTextFile(path, JSON.stringify(manifest, null, 2));
console.log(`\n✔ Manifesto: ${path.pathname}`);
console.log(`  aggregate_hash=${aggregate_hash}`);
console.log(`  signature=${signature.slice(0,32)}…`);