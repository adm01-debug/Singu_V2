// Replay idempotente de WAL wal2json (format-version=2) no destino.
// Uso: deno run --allow-env --allow-net --allow-read cdc/replay.ts
// Requer: DEST_DB_URL (via PGREST não; usamos supabase-js com service role) ou
//         DEST_SUPABASE_URL + DEST_SERVICE_ROLE_KEY (preferido).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

interface WalChange {
  kind: "insert" | "update" | "delete";
  schema: string;
  table: string;
  columnnames?: string[];
  columnvalues?: unknown[];
  oldkeys?: { keynames: string[]; keyvalues: unknown[] };
}
interface WalMessage { lsn: string; nextlsn?: string; timestamp?: string; change: WalChange[]; }

const DEST_URL = Deno.env.get("DEST_SUPABASE_URL");
const DEST_KEY = Deno.env.get("DEST_SERVICE_ROLE_KEY");
const CDC_DIR = Deno.env.get("CDC_OUT_DIR") ?? new URL("./out/", import.meta.url).pathname;
if (!DEST_URL || !DEST_KEY) { console.error("faltando DEST_SUPABASE_URL/DEST_SERVICE_ROLE_KEY"); Deno.exit(2); }

const sb = createClient(DEST_URL, DEST_KEY, { auth: { persistSession: false } });

// Garante tabela de checkpoint (idempotente via RPC/SQL — assume que o operador rodou o DDL abaixo)
// CREATE TABLE IF NOT EXISTS public._migration_cdc_checkpoint (lsn text primary key, applied_at timestamptz default now());

async function alreadyApplied(lsn: string): Promise<boolean> {
  const { data } = await sb.from("_migration_cdc_checkpoint").select("lsn").eq("lsn", lsn).maybeSingle();
  return !!data;
}
async function markApplied(lsn: string) {
  await sb.from("_migration_cdc_checkpoint").insert({ lsn });
}

async function apply(change: WalChange) {
  if (change.schema !== "public") return; // ignora auth/storage
  const table = change.table;
  if (change.kind === "insert" || change.kind === "update") {
    const row: Record<string, unknown> = {};
    (change.columnnames ?? []).forEach((c, i) => { row[c] = (change.columnvalues ?? [])[i]; });
    const { error } = await sb.from(table).upsert(row);
    if (error) throw new Error(`upsert ${table}: ${error.message}`);
  } else if (change.kind === "delete") {
    const pkNames = change.oldkeys?.keynames ?? [];
    const pkVals = change.oldkeys?.keyvalues ?? [];
    let q = sb.from(table).delete();
    pkNames.forEach((k, i) => { q = q.eq(k, pkVals[i] as never); });
    const { error } = await q;
    if (error) throw new Error(`delete ${table}: ${error.message}`);
  }
}

const files: string[] = [];
for await (const e of Deno.readDir(CDC_DIR)) if (e.isFile && e.name.endsWith(".json")) files.push(e.name);
files.sort();

let total = 0, skipped = 0, applied = 0;
for (const f of files) {
  const raw = await Deno.readTextFile(`${CDC_DIR}/${f}`);
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    let msg: WalMessage;
    try { msg = JSON.parse(line); } catch { continue; }
    total++;
    if (await alreadyApplied(msg.lsn)) { skipped++; continue; }
    for (const c of msg.change ?? []) await apply(c);
    await markApplied(msg.lsn);
    applied++;
  }
}
console.log(`total=${total} applied=${applied} skipped=${skipped}`);