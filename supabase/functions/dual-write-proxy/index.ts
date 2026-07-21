// Dual-write proxy — espelha writes críticos no banco LEGADO durante bake.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const LEGACY_URL = Deno.env.get("LEGACY_SUPABASE_URL");
const LEGACY_KEY = Deno.env.get("LEGACY_SERVICE_ROLE_KEY");
const WHITELIST = (Deno.env.get("DUAL_WRITE_TABLES") ?? "").split(",").map((s) => s.trim()).filter(Boolean);

interface DualWritePayload {
  table: string;
  op: "insert" | "update" | "upsert" | "delete";
  row?: Record<string, unknown>;
  match?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!LEGACY_URL || !LEGACY_KEY) return json({ ok: false, reason: "legacy-disabled" }, 200);
    const body = (await req.json()) as DualWritePayload;
    if (!body?.table || !WHITELIST.includes(body.table)) return json({ ok: false, reason: "not-whitelisted" }, 200);
    const legacy = createClient(LEGACY_URL, LEGACY_KEY, { auth: { persistSession: false } });
    let err: string | null = null;
    try {
      if (body.op === "insert") {
        const r = await legacy.from(body.table).insert(body.row ?? {}); err = r.error?.message ?? null;
      } else if (body.op === "upsert") {
        const r = await legacy.from(body.table).upsert(body.row ?? {}); err = r.error?.message ?? null;
      } else if (body.op === "update") {
        let q = legacy.from(body.table).update(body.row ?? {});
        for (const [k, v] of Object.entries(body.match ?? {})) q = q.eq(k, v as never);
        const r = await q; err = r.error?.message ?? null;
      } else if (body.op === "delete") {
        let q = legacy.from(body.table).delete();
        for (const [k, v] of Object.entries(body.match ?? {})) q = q.eq(k, v as never);
        const r = await q; err = r.error?.message ?? null;
      }
    } catch (e) { err = e instanceof Error ? e.message : String(e); }
    if (err) console.error(`[dual-write] table=${body.table} op=${body.op} err=${err}`);
    return json({ ok: !err, err }, 200);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[dual-write] fatal", msg);
    return json({ ok: false, err: msg }, 200);
  }
});

function json(b: unknown, status: number) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}