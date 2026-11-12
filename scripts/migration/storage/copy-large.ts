// Storage Large-Object Handler — objetos > 100MB com download em pedaços (Range),
// retomável, usando arquivo parcial em disco (memória constante, nunca o objeto inteiro em RAM).
// Uso: BUCKET=avatars OBJECT=path/file.bin deno run --allow-env --allow-net --allow-read --allow-write storage/copy-large.ts
//
// Variáveis (além das de _lib.ts): BUCKET, OBJECT (obrigatórias), CHUNK_BYTES (8 MiB),
//   LARGE_THRESHOLD (100 MiB), LARGE_CKPT_DIR (padrão: storage/large-ckpt/).
// Retomada: o checkpoint guarda tamanho+ETag da origem; se o objeto mudou na origem, ou
//   se o arquivo parcial não bate com o checkpoint, recomeça do zero (nunca envia buraco/zeros).
// DRY_RUN=1: só informa o que faria. Saída: 0 ok · 1 falha · 2 configuração.
// Limite conhecido: o upload ao destino é um único POST em stream (não usa TUS/resumable).
import {
  authHeaders, encodePath, ErroConfig, etagLimpo, headObjeto, intEnv, loadEnv, redact, retryFetch, sairComErro, semBarraFinal,
  type Env, type Fetch,
} from "./_lib.ts";

export interface Ckpt { uploaded: number; size: number; etag: string }
export interface OpcoesLarge { bucket: string; object: string; chunk: number; threshold: number; ckptDir: string; fetchFn?: Fetch }
export interface InfoOrigem { size: number; contentType: string; cacheControl: string; etag: string }

/** Nome de checkpoint sem colisão ("a/b" × "a_b") e sem caractere perigoso. */
export async function nomeCkpt(bucket: string, object: string): Promise<string> {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${bucket}\0${object}`));
  return Array.from(new Uint8Array(h)).slice(0, 16).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** De onde retomar: 0 se checkpoint ausente/inválido, origem mudou ou parcial menor que o checkpoint. */
export function pontoDeRetomada(ckpt: Ckpt | null, origem: InfoOrigem, tamanhoParcial: number): number {
  if (!ckpt || !Number.isInteger(ckpt.uploaded) || ckpt.uploaded <= 0) return 0;
  if (ckpt.size !== origem.size || ckpt.etag !== origem.etag) return 0;
  if (ckpt.uploaded > origem.size || tamanhoParcial < ckpt.uploaded) return 0;
  return ckpt.uploaded;
}

export async function infoOrigem(env: Env, bucket: string, object: string, fetchFn?: Fetch): Promise<InfoOrigem> {
  const r = await retryFetch(`${env.SRC_SUPABASE_URL}/storage/v1/object/info/${encodeURIComponent(bucket)}/${encodePath(object)}`,
    { headers: authHeaders(env.SRC_SERVICE_ROLE_KEY) }, { label: "info origem", retries: 3, fetchFn });
  if (!r.ok) { await r.body?.cancel(); throw new Error(`INFO da origem falhou: HTTP ${r.status}`); }
  const m = await r.json() as Record<string, unknown>;
  const size = Number(m.size);
  if (!Number.isInteger(size) || size < 0) throw new Error("INFO da origem não trouxe tamanho válido");
  const txt = (...ks: string[]): string => {
    const k = ks.find((x) => typeof m[x] === "string");
    return k ? m[k] as string : "";
  };
  return {
    size,
    contentType: txt("content_type", "contentType", "mimetype") || "application/octet-stream",
    cacheControl: txt("cache_control", "cacheControl") || "max-age=3600",
    etag: etagLimpo(txt("etag", "eTag")),
  };
}

export async function copiarGrande(env: Env, op: OpcoesLarge): Promise<"copiado" | "abaixo-do-limite" | "dry-run"> {
  const { bucket, object, chunk, fetchFn } = op;
  const origem = await infoOrigem(env, bucket, object, fetchFn);
  console.log(`objeto=${bucket}/${object} bytes=${origem.size} chunk=${chunk}`);
  if (origem.size < op.threshold) {
    console.log("↪ menor que threshold — use copy-objects.ts padrão");
    return "abaixo-do-limite";
  }
  if (env.DRY_RUN) {
    console.log(`[DRY_RUN] copiaria ${bucket}/${object} (${origem.size} bytes) em ${Math.ceil(origem.size / chunk)} pedaços`);
    return "dry-run";
  }

  await Deno.mkdir(op.ckptDir, { recursive: true });
  const base = `${semBarraFinal(op.ckptDir)}/${await nomeCkpt(bucket, object)}`;
  const ckptFile = `${base}.json`;
  const partFile = `${base}.part`;
  let ckpt: Ckpt | null = null;
  try { ckpt = JSON.parse(await Deno.readTextFile(ckptFile)) as Ckpt; } catch { /* sem checkpoint */ }
  const tamParcial = await Deno.stat(partFile).then((s) => s.size).catch(() => 0);
  let start = pontoDeRetomada(ckpt, origem, tamParcial);
  if (start > 0) console.log(`⤴ retomando de byte ${start}`);
  else if (ckpt) console.log("↺ checkpoint descartado (origem mudou ou parcial inconsistente) — recomeçando do zero");

  const part = await Deno.open(partFile, { write: true, create: true });
  try {
    await part.truncate(start);
    await part.seek(start, Deno.SeekMode.Start);
    const srcUrl = `${env.SRC_SUPABASE_URL}/storage/v1/object/authenticated/${encodeURIComponent(bucket)}/${encodePath(object)}`;
    while (start < origem.size) {
      const end = Math.min(start + chunk, origem.size) - 1;
      const r = await retryFetch(srcUrl, { headers: authHeaders(env.SRC_SERVICE_ROLE_KEY, { Range: `bytes=${start}-${end}` }) },
        { label: `chunk ${start}-${end}`, retries: 5, fetchFn, timeoutMs: env.TRANSFER_TIMEOUT_MS });
      if (r.status !== 206) { await r.body?.cancel(); throw new Error(`chunk ${start}-${end} falhou: HTTP ${r.status} (esperado 206 Partial Content)`); }
      const pedaco = new Uint8Array(await r.arrayBuffer());
      if (pedaco.length !== end - start + 1) throw new Error(`chunk ${start}-${end} veio com ${pedaco.length} bytes`);
      let escritos = 0;
      while (escritos < pedaco.length) escritos += await part.write(pedaco.subarray(escritos));
      await part.sync(); // dado em disco ANTES de avançar o checkpoint
      start += pedaco.length;
      await Deno.writeTextFile(ckptFile, JSON.stringify({ uploaded: start, size: origem.size, etag: origem.etag } satisfies Ckpt));
      console.log(`  ↓ ${start}/${origem.size} (${((start / origem.size) * 100).toFixed(1)}%)`);
    }
  } finally {
    part.close();
  }

  const url = `${env.DEST_SUPABASE_URL}/storage/v1/object/${encodeURIComponent(bucket)}/${encodePath(object)}`;
  const upR = await retryFetch(url, async () => ({
    method: "POST",
    headers: authHeaders(env.DEST_SERVICE_ROLE_KEY, { "Content-Type": origem.contentType, "Cache-Control": origem.cacheControl, "x-upsert": "true" }),
    body: (await Deno.open(partFile, { read: true })).readable,
  }), { label: "upload destino", retries: 3, fetchFn, timeoutMs: env.TRANSFER_TIMEOUT_MS });
  if (!upR.ok) throw new Error(`upload destino falhou: HTTP ${upR.status} ${redact((await upR.text()).slice(0, 300))}`);
  await upR.body?.cancel();

  const d = await headObjeto(env.DEST_SUPABASE_URL, env.DEST_SERVICE_ROLE_KEY, bucket, object, fetchFn);
  if (!d.ok || d.size !== origem.size) {
    throw new Error(`verificação pós-upload falhou: destino HTTP ${d.status} com ${d.size} bytes (esperado ${origem.size}) — checkpoint mantido`);
  }
  await Deno.remove(ckptFile).catch(() => {});
  await Deno.remove(partFile).catch(() => {});
  console.log(`✔ ${bucket}/${object} copiado (${origem.size} bytes)`);
  return "copiado";
}

if (import.meta.main) {
  try {
    const env = loadEnv();
    const get = (k: string) => Deno.env.get(k);
    const bucket = get("BUCKET");
    const object = get("OBJECT");
    if (!bucket || !object) throw new ErroConfig("BUCKET e OBJECT obrigatórios");
    await copiarGrande(env, {
      bucket, object,
      chunk: intEnv(get, "CHUNK_BYTES", 8 * 1024 * 1024, 1),
      threshold: intEnv(get, "LARGE_THRESHOLD", 100 * 1024 * 1024, 0),
      ckptDir: get("LARGE_CKPT_DIR") || new URL("./large-ckpt/", import.meta.url).pathname,
    });
  } catch (e) {
    sairComErro(e);
  }
}
