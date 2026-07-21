// Storage Large-Object Handler — objetos > 100MB via multipart resumível com checkpointing.
// Uso: BUCKET=avatars OBJECT=path/file.bin deno run --allow-env --allow-net --allow-read --allow-write storage/copy-large.ts
import { loadEnv, authHeaders, retryFetch } from "./_lib.ts";

const env = loadEnv();
const BUCKET = Deno.env.get("BUCKET"); const OBJECT = Deno.env.get("OBJECT");
const CHUNK = Number(Deno.env.get("CHUNK_BYTES") ?? String(8 * 1024 * 1024)); // 8MB
const THRESHOLD = Number(Deno.env.get("LARGE_THRESHOLD") ?? String(100 * 1024 * 1024)); // 100MB
if (!BUCKET || !OBJECT) { console.error("BUCKET e OBJECT obrigatórios"); Deno.exit(2); }

const CKPT_DIR = new URL("./large-ckpt/", import.meta.url).pathname;
await Deno.mkdir(CKPT_DIR, { recursive: true });
const ckptFile = `${CKPT_DIR}/${BUCKET}__${OBJECT.replace(/[\/]/g, "_")}.json`;

function encPath(p: string): string { return p.split("/").map(encodeURIComponent).join("/"); }

interface Ckpt { uploaded: number; etags: string[]; upload_id?: string }
let ckpt: Ckpt = { uploaded: 0, etags: [] };
try { ckpt = JSON.parse(await Deno.readTextFile(ckptFile)); console.log(`⤴ retomando de byte ${ckpt.uploaded}`); } catch { /* fresh */ }

// HEAD origem
const headR = await retryFetch(`${env.SRC_SUPABASE_URL}/storage/v1/object/info/${encodeURIComponent(BUCKET)}/${encPath(OBJECT)}`,
  { headers: authHeaders(env.SRC_SERVICE_ROLE_KEY) }, { label: "head", retries: 3 });
if (!headR.ok) { console.error(`HEAD falhou: ${headR.status}`); Deno.exit(1); }
const meta = await headR.json() as { size: number; mimetype?: string };
const total = meta.size;
console.log(`objeto=${BUCKET}/${OBJECT} bytes=${total} chunk=${CHUNK}`);

if (total < THRESHOLD) {
  console.log("↪ menor que threshold — use copy-objects.ts padrão");
  Deno.exit(0);
}

// Signed URL origem
const signR = await retryFetch(`${env.SRC_SUPABASE_URL}/storage/v1/object/sign/${encodeURIComponent(BUCKET)}/${encPath(OBJECT)}`,
  { method: "POST", headers: { ...authHeaders(env.SRC_SERVICE_ROLE_KEY), "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: 3600 }) }, { label: "sign", retries: 3 });
const signed = (await signR.json()) as { signedURL?: string; signedUrl?: string };
const srcUrl = `${env.SRC_SUPABASE_URL}/storage/v1${signed.signedURL ?? signed.signedUrl}`;

// Loop de chunks (Range GET origem → PUT destino via multipart upload TUS-like)
// Nota: usa endpoint padrão do storage; para buckets sem TUS, faz upload único no fim.
const buf = new Uint8Array(total);
let start = ckpt.uploaded;
while (start < total) {
  const end = Math.min(start + CHUNK, total) - 1;
  const r = await retryFetch(srcUrl, { headers: { Range: `bytes=${start}-${end}` } },
    { label: `chunk ${start}-${end}`, retries: 5 });
  if (!r.ok && r.status !== 206) { console.error(`chunk falhou: ${r.status}`); Deno.exit(1); }
  const part = new Uint8Array(await r.arrayBuffer());
  buf.set(part, start);
  start += part.length;
  ckpt.uploaded = start;
  await Deno.writeTextFile(ckptFile, JSON.stringify(ckpt));
  console.log(`  ↓ ${start}/${total} (${((start/total)*100).toFixed(1)}%)`);
}

// Upload único no destino (Storage do Supabase ainda não expõe multipart nativo via REST)
const upR = await retryFetch(`${env.DEST_SUPABASE_URL}/storage/v1/object/${encodeURIComponent(BUCKET)}/${encPath(OBJECT)}`,
  { method: "POST", headers: { ...authHeaders(env.DEST_SERVICE_ROLE_KEY),
      "Content-Type": meta.mimetype ?? "application/octet-stream", "x-upsert": "true" }, body: buf },
  { label: "upload dest", retries: 3 });
if (!upR.ok) { console.error(`upload destino falhou: ${upR.status} ${await upR.text()}`); Deno.exit(1); }

await Deno.remove(ckptFile).catch(() => {});
console.log(`✔ ${BUCKET}/${OBJECT} copiado (${total} bytes)`);