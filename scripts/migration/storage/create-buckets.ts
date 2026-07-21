// Cria/atualiza buckets no DESTINO a partir da configuração da ORIGEM.
// Idempotente. Uso: deno run --allow-env --allow-net storage/create-buckets.ts
import { loadEnv, listBuckets, authHeaders, retryFetch, type Bucket } from "./_lib.ts";

const env = loadEnv();
const src = await listBuckets(env.SRC_SUPABASE_URL, env.SRC_SERVICE_ROLE_KEY);
const dest = await listBuckets(env.DEST_SUPABASE_URL, env.DEST_SERVICE_ROLE_KEY);
const destById = new Map(dest.map((b) => [b.id, b]));

let created = 0, updated = 0, identical = 0, failed = 0;

function bucketPayload(b: Bucket) {
  return {
    id: b.id,
    name: b.name,
    public: b.public,
    file_size_limit: b.file_size_limit,
    allowed_mime_types: b.allowed_mime_types,
  };
}

function bucketEqual(a: Bucket, b: Bucket): boolean {
  const norm = (arr: string[] | null | undefined) => (arr && arr.length ? [...arr].sort().join("|") : "");
  return a.public === b.public
    && (a.file_size_limit ?? null) === (b.file_size_limit ?? null)
    && norm(a.allowed_mime_types) === norm(b.allowed_mime_types);
}

for (const b of src) {
  if (env.ONLY_BUCKET && b.id !== env.ONLY_BUCKET) continue;
  const existing = destById.get(b.id);
  if (existing && bucketEqual(existing, b)) {
    identical++;
    console.log(`= ${b.id} (idêntico)`);
    continue;
  }
  if (env.DRY_RUN) {
    console.log(`~ ${b.id} (${existing ? "atualizaria" : "criaria"}) [DRY_RUN]`);
    continue;
  }
  const method = existing ? "PUT" : "POST";
  const url = existing
    ? `${env.DEST_SUPABASE_URL}/storage/v1/bucket/${encodeURIComponent(b.id)}`
    : `${env.DEST_SUPABASE_URL}/storage/v1/bucket`;
  const res = await retryFetch(url, {
    method,
    headers: authHeaders(env.DEST_SERVICE_ROLE_KEY, { "Content-Type": "application/json" }),
    body: JSON.stringify(bucketPayload(b)),
  }, { label: `${method} bucket ${b.id}` });
  if (res.ok) {
    if (existing) { updated++; console.log(`↑ ${b.id} (atualizado)`); }
    else { created++; console.log(`+ ${b.id} (criado)`); }
  } else if (res.status === 409 && !existing) {
    // criado por outro processo — tenta PUT
    const put = await retryFetch(
      `${env.DEST_SUPABASE_URL}/storage/v1/bucket/${encodeURIComponent(b.id)}`,
      {
        method: "PUT",
        headers: authHeaders(env.DEST_SERVICE_ROLE_KEY, { "Content-Type": "application/json" }),
        body: JSON.stringify(bucketPayload(b)),
      },
      { label: `PUT bucket ${b.id}` },
    );
    if (put.ok) { updated++; console.log(`↑ ${b.id} (409→PUT ok)`); }
    else { failed++; console.error(`✖ ${b.id} PUT HTTP ${put.status}: ${await put.text()}`); }
  } else {
    failed++;
    console.error(`✖ ${b.id} HTTP ${res.status}: ${await res.text()}`);
  }
}

console.log(`\nResumo: criados=${created} atualizados=${updated} idênticos=${identical} falhas=${failed}`);
if (failed > 0) Deno.exit(1);