// Copia objetos ORIGEM → DESTINO, stream direto, com upsert e retry.
// Uso: deno run --allow-env --allow-net --allow-write --allow-read storage/copy-objects.ts
import { loadEnv, listBuckets, iterObjects, authHeaders, retryFetch, runPool, fmtBytes, type StorageObject } from "./_lib.ts";

// P3.13 — rate limit global em bytes/s (0 = ilimitado)
const RATE_LIMIT = parseInt(Deno.env.get("RATE_LIMIT_BPS") ?? "0", 10);
let bytesInWindow = 0;
let windowStart = Date.now();
async function throttle(bytes: number): Promise<void> {
  if (!RATE_LIMIT) return;
  bytesInWindow += bytes;
  const elapsed = Date.now() - windowStart;
  if (elapsed >= 1000) { bytesInWindow = bytes; windowStart = Date.now(); return; }
  if (bytesInWindow > RATE_LIMIT) {
    await new Promise((r) => setTimeout(r, 1000 - elapsed));
    bytesInWindow = 0; windowStart = Date.now();
  }
}

// P1.6 — validação de ETag pós-PUT
async function md5Hex(buf: Uint8Array): Promise<string> {
  const d = await crypto.subtle.digest("MD5", buf).catch(() => null);
  if (!d) return ""; // Deno pode não expor MD5; nesse caso pulamos sem falhar
  return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const env = loadEnv();
const buckets = await listBuckets(env.SRC_SUPABASE_URL, env.SRC_SERVICE_ROLE_KEY);

const logPath = new URL("./storage-copy.log", import.meta.url);
const logFile = await Deno.open(logPath, { create: true, append: true });
const enc = new TextEncoder();
async function logLine(o: Record<string, unknown>): Promise<void> {
  await logFile.write(enc.encode(JSON.stringify({ ts: new Date().toISOString(), ...o }) + "\n"));
}

async function headDest(bucket: string, key: string): Promise<Response> {
  return await retryFetch(
    `${env.DEST_SUPABASE_URL}/storage/v1/object/authenticated/${encodeURIComponent(bucket)}/${encodePath(key)}`,
    { method: "HEAD", headers: authHeaders(env.DEST_SERVICE_ROLE_KEY) },
    { label: `HEAD ${bucket}/${key}`, retries: 2 },
  ).catch((e) => new Response(null, { status: 599, statusText: String(e) }));
}

function encodePath(p: string): string {
  return p.split("/").map(encodeURIComponent).join("/");
}

async function copyOne(bucket: string, obj: StorageObject): Promise<{ bytes: number; skipped: boolean }> {
  const key = obj.name;
  const size = obj.metadata?.size ?? 0;
  const contentType = obj.metadata?.mimetype ?? "application/octet-stream";
  const cacheControl = obj.metadata?.cacheControl ?? "3600";

  // Fast-skip: se destino já tem tamanho igual, presumir replicado.
  const head = await headDest(bucket, key);
  if (head.ok) {
    const destLen = Number(head.headers.get("content-length") ?? "0");
    if (destLen === size && size > 0) {
      return { bytes: size, skipped: true };
    }
  }

  if (env.DRY_RUN) return { bytes: size, skipped: false };

  // GET stream da origem
  const getUrl = `${env.SRC_SUPABASE_URL}/storage/v1/object/authenticated/${encodeURIComponent(bucket)}/${encodePath(key)}`;
  const src = await retryFetch(getUrl, { headers: authHeaders(env.SRC_SERVICE_ROLE_KEY) }, { label: `GET ${bucket}/${key}` });
  if (!src.ok || !src.body) throw new Error(`GET ${bucket}/${key} HTTP ${src.status}`);

  let body: BodyInit;
  let tmpPath: string | null = null;
  let bodyBuf: Uint8Array | null = null;
  if (size > env.STREAM_TMPFILE_THRESHOLD) {
    // objeto grande → buffer em tmpfile para permitir retry idempotente do PUT
    tmpPath = await Deno.makeTempFile({ prefix: "storage-copy-" });
    const f = await Deno.open(tmpPath, { write: true, truncate: true });
    await src.body.pipeTo(f.writable);
    const stat = await Deno.stat(tmpPath);
    const reopened = await Deno.open(tmpPath, { read: true });
    body = reopened.readable;
    // valida tamanho
    if (size && stat.size !== size) {
      console.warn(`  ! tamanho divergente em ${bucket}/${key}: src.metadata=${size} baixado=${stat.size}`);
    }
  } else {
    bodyBuf = new Uint8Array(await src.arrayBuffer());
    body = bodyBuf;
  }

  const putUrl = `${env.DEST_SUPABASE_URL}/storage/v1/object/${encodeURIComponent(bucket)}/${encodePath(key)}`;
  const put = await retryFetch(putUrl, {
    method: "POST",
    headers: authHeaders(env.DEST_SERVICE_ROLE_KEY, {
      "Content-Type": contentType,
      "Cache-Control": cacheControl,
      "x-upsert": "true",
    }),
    body,
  }, { label: `PUT ${bucket}/${key}` });

  if (tmpPath) await Deno.remove(tmpPath).catch(() => {});

  if (!put.ok) throw new Error(`PUT ${bucket}/${key} HTTP ${put.status}: ${await put.text()}`);

  // Validação de ETag (só para objetos pequenos que ficaram em memória).
  if (bodyBuf) {
    const etag = (put.headers.get("etag") ?? "").replace(/"/g, "");
    if (etag && /^[a-f0-9]{32}$/i.test(etag)) {
      const local = await md5Hex(bodyBuf);
      if (local && local !== etag.toLowerCase()) {
        throw new Error(`ETag mismatch em ${bucket}/${key}: local=${local} remoto=${etag}`);
      }
    }
  }
  await throttle(size);
  return { bytes: size, skipped: false };
}

let grandOk = 0, grandFail = 0, grandBytes = 0, grandSkipped = 0;

for (const b of buckets) {
  if (env.ONLY_BUCKET && b.id !== env.ONLY_BUCKET) continue;
  console.log(`\n▶ bucket ${b.id} (concurrency=${env.CONCURRENCY}${env.DRY_RUN ? " DRY_RUN" : ""})`);
  let ok = 0, fail = 0, bytes = 0, skipped = 0;

  async function* itemsForBucket(): AsyncGenerator<StorageObject> {
    for await (const o of iterObjects(env.SRC_SUPABASE_URL, env.SRC_SERVICE_ROLE_KEY, b.id)) {
      yield o;
    }
  }

  await runPool(itemsForBucket(), async (obj) => {
    const started = Date.now();
    try {
      const r = await copyOne(b.id, obj);
      const ms = Date.now() - started;
      if (r.skipped) skipped++; else ok++;
      bytes += r.bytes;
      await logLine({ bucket: b.id, key: obj.name, bytes: r.bytes, status: r.skipped ? "skip" : "ok", ms });
    } catch (err) {
      fail++;
      const ms = Date.now() - started;
      const msg = err instanceof Error ? err.message : String(err);
      await logLine({ bucket: b.id, key: obj.name, status: "fail", ms, error: msg });
      console.error(`  ✖ ${b.id}/${obj.name} — ${msg}`);
    }
  }, env.CONCURRENCY);

  grandOk += ok; grandFail += fail; grandBytes += bytes; grandSkipped += skipped;
  console.log(`  bucket ${b.id}: OK=${ok} SKIP=${skipped} FAIL=${fail} BYTES=${fmtBytes(bytes)}`);
}

logFile.close();
console.log(`\nTOTAL: OK=${grandOk} SKIP=${grandSkipped} FAIL=${grandFail} BYTES=${fmtBytes(grandBytes)}`);
console.log(`Log: ${logPath.pathname}`);
if (grandFail > 0) Deno.exit(1);