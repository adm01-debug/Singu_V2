// Lista buckets da ORIGEM com contagem estimada de objetos.
// Uso: deno run --allow-env --allow-net storage/list-buckets.ts
import { loadEnv, listBuckets, iterObjects, fmtBytes } from "./_lib.ts";

const env = loadEnv();
const buckets = await listBuckets(env.SRC_SUPABASE_URL, env.SRC_SERVICE_ROLE_KEY);

console.log(`\nBuckets encontrados na origem: ${buckets.length}\n`);
console.log("id".padEnd(28) + "public".padEnd(10) + "arquivos".padStart(10) + "  bytes");
console.log("-".repeat(70));

let totalFiles = 0;
let totalBytes = 0;
for (const b of buckets) {
  if (env.ONLY_BUCKET && b.id !== env.ONLY_BUCKET) continue;
  let files = 0;
  let bytes = 0;
  for await (const o of iterObjects(env.SRC_SUPABASE_URL, env.SRC_SERVICE_ROLE_KEY, b.id)) {
    files++;
    bytes += o.metadata?.size ?? 0;
  }
  totalFiles += files;
  totalBytes += bytes;
  console.log(
    b.id.padEnd(28) +
    String(b.public).padEnd(10) +
    String(files).padStart(10) +
    "  " + fmtBytes(bytes),
  );
}
console.log("-".repeat(70));
console.log(`TOTAL${" ".repeat(23)}${" ".repeat(10)}${String(totalFiles).padStart(10)}  ${fmtBytes(totalBytes)}\n`);