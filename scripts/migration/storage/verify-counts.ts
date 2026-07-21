// Compara contagens e amostragem entre ORIGEM e DESTINO.
// Uso: deno run --allow-env --allow-net --allow-write storage/verify-counts.ts
import { loadEnv, listBuckets, iterObjects, authHeaders, retryFetch, fmtBytes, type StorageObject } from "./_lib.ts";

const env = loadEnv();
const src = await listBuckets(env.SRC_SUPABASE_URL, env.SRC_SERVICE_ROLE_KEY);
const dest = await listBuckets(env.DEST_SUPABASE_URL, env.DEST_SERVICE_ROLE_KEY);
const destIds = new Set(dest.map((b) => b.id));

interface Report { bucket: string; src_count: number; dest_count: number; src_bytes: number; dest_bytes: number; sample_mismatches: string[]; ok: boolean; }
const report: Report[] = [];
let hardFail = false;

function encodePath(p: string): string { return p.split("/").map(encodeURIComponent).join("/"); }

for (const b of src) {
  if (env.ONLY_BUCKET && b.id !== env.ONLY_BUCKET) continue;
  if (!destIds.has(b.id)) {
    console.error(`✖ bucket ${b.id} não existe no destino`);
    report.push({ bucket: b.id, src_count: -1, dest_count: -1, src_bytes: 0, dest_bytes: 0, sample_mismatches: ["bucket-missing"], ok: false });
    hardFail = true;
    continue;
  }

  const srcObjs: StorageObject[] = [];
  let srcBytes = 0;
  for await (const o of iterObjects(env.SRC_SUPABASE_URL, env.SRC_SERVICE_ROLE_KEY, b.id)) {
    srcObjs.push(o);
    srcBytes += o.metadata?.size ?? 0;
  }
  let destCount = 0;
  let destBytes = 0;
  for await (const o of iterObjects(env.DEST_SUPABASE_URL, env.DEST_SERVICE_ROLE_KEY, b.id)) {
    destCount++;
    destBytes += o.metadata?.size ?? 0;
  }

  // Amostra 20 objetos aleatórios da origem
  const sample = srcObjs.slice().sort(() => Math.random() - 0.5).slice(0, 20);
  const mismatches: string[] = [];
  for (const o of sample) {
    const res = await retryFetch(
      `${env.DEST_SUPABASE_URL}/storage/v1/object/authenticated/${encodeURIComponent(b.id)}/${encodePath(o.name)}`,
      { method: "HEAD", headers: authHeaders(env.DEST_SERVICE_ROLE_KEY) },
      { label: `HEAD verify ${b.id}/${o.name}`, retries: 2 },
    );
    if (!res.ok) { mismatches.push(`${o.name} (HEAD ${res.status})`); continue; }
    const destLen = Number(res.headers.get("content-length") ?? "0");
    if ((o.metadata?.size ?? 0) !== destLen) mismatches.push(`${o.name} (size ${o.metadata?.size}≠${destLen})`);
  }

  const ok = srcObjs.length === destCount && mismatches.length === 0;
  if (!ok) hardFail = true;
  report.push({
    bucket: b.id,
    src_count: srcObjs.length, dest_count: destCount,
    src_bytes: srcBytes, dest_bytes: destBytes,
    sample_mismatches: mismatches, ok,
  });
  const marker = ok ? "✔" : "✖";
  console.log(`${marker} ${b.id}: src=${srcObjs.length}(${fmtBytes(srcBytes)}) dest=${destCount}(${fmtBytes(destBytes)}) amostra_falhas=${mismatches.length}`);
  for (const m of mismatches) console.log(`    - ${m}`);
}

await Deno.writeTextFile(new URL("./verify-report.json", import.meta.url), JSON.stringify(report, null, 2));
console.log(`\nRelatório: scripts/migration/storage/verify-report.json`);
if (hardFail) { console.error("\n✖ Divergências detectadas."); Deno.exit(1); }
console.log("\n✔ Paridade completa.");