// Storage byte-level verify — baixa amostra aleatória e compara SHA-256.
import { loadEnv, listBuckets, iterObjects, authHeaders, retryFetch, type StorageObject } from "../storage/_lib.ts";

const env = loadEnv();
const SAMPLE_PCT = Number(Deno.env.get("BYTES_SAMPLE_PCT") ?? "0.5");
const MAX_PER_BUCKET = Number(Deno.env.get("BYTES_MAX_PER_BUCKET") ?? "100");

function encodePath(p: string): string { return p.split("/").map(encodeURIComponent).join("/"); }
async function sha256(buf: ArrayBuffer): Promise<string> {
  const h = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function signed(url: string, key: string, bucket: string, obj: string): Promise<string> {
  const r = await retryFetch(`${url}/storage/v1/object/sign/${encodeURIComponent(bucket)}/${encodePath(obj)}`,
    { method: "POST", headers: { ...authHeaders(key), "Content-Type": "application/json" }, body: JSON.stringify({ expiresIn: 300 }) },
    { label: `sign ${bucket}/${obj}`, retries: 2 });
  if (!r.ok) throw new Error(`sign ${r.status}`);
  const j = await r.json() as { signedURL?: string; signedUrl?: string };
  const p = j.signedURL ?? j.signedUrl!;
  return `${url}/storage/v1${p}`;
}

const src = await listBuckets(env.SRC_SUPABASE_URL, env.SRC_SERVICE_ROLE_KEY);
let hardFail = false;
const report: Array<Record<string, unknown>> = [];
for (const b of src) {
  if (env.ONLY_BUCKET && b.id !== env.ONLY_BUCKET) continue;
  const all: StorageObject[] = [];
  for await (const o of iterObjects(env.SRC_SUPABASE_URL, env.SRC_SERVICE_ROLE_KEY, b.id)) all.push(o);
  const n = Math.min(MAX_PER_BUCKET, Math.max(1, Math.floor(all.length * SAMPLE_PCT / 100)));
  const sample = all.slice().sort(() => Math.random() - 0.5).slice(0, n);
  const mismatches: string[] = [];
  for (const o of sample) {
    try {
      const [sU, dU] = await Promise.all([
        signed(env.SRC_SUPABASE_URL, env.SRC_SERVICE_ROLE_KEY, b.id, o.name),
        signed(env.DEST_SUPABASE_URL, env.DEST_SERVICE_ROLE_KEY, b.id, o.name),
      ]);
      const [sB, dB] = await Promise.all([fetch(sU).then((r) => r.arrayBuffer()), fetch(dU).then((r) => r.arrayBuffer())]);
      const [sH, dH] = await Promise.all([sha256(sB), sha256(dB)]);
      if (sH !== dH) mismatches.push(`${o.name} src=${sH.slice(0,12)} dest=${dH.slice(0,12)}`);
    } catch (e) { mismatches.push(`${o.name} err=${e instanceof Error ? e.message : e}`); }
  }
  const ok = mismatches.length === 0;
  if (!ok) hardFail = true;
  console.log(`${ok ? "✔" : "✖"} ${b.id}: sample=${sample.length} mismatches=${mismatches.length}`);
  mismatches.forEach((m) => console.log("    -", m));
  report.push({ bucket: b.id, sampled: sample.length, mismatches });
}
await Deno.writeTextFile(new URL("../storage/verify-bytes-report.json", import.meta.url), JSON.stringify(report, null, 2));
if (hardFail) Deno.exit(1);
console.log("\n✔ Byte-level parity OK");