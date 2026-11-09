// Copia objetos ORIGEM → DESTINO com upsert, retry, retomada e verificação.
// Uso: deno run --allow-env --allow-net --allow-write --allow-read storage/copy-objects.ts
//
// Variáveis (além das de _lib.ts): RATE_LIMIT_BPS (0 = ilimitado),
//   STORAGE_COPY_LOG (padrão: storage/storage-copy.log, JSONL),
//   PRESERVE_USER_METADATA (1) — lê /object/info na origem e reenvia como x-metadata,
//   VERIFY_AFTER_PUT (1)       — confere MD5 baixado × ETag da origem e faz HEAD no destino
//                                após cada upload (tamanho e MD5/ETag).
// DRY_RUN=1 não baixa nem envia nada: só diz o que copiaria/pularia.
// Retomada: rodar de novo pula o que já está no destino com mesmo tamanho E mesmo
//   ETag (quando os dois ETags são MD5; ETag de multipart não é comparável → só tamanho).
// Saída: 0 = tudo copiado/pulado · 1 = houve falha em algum objeto · 2 = configuração.
import { createHash } from "node:crypto";
import {
  authHeaders, encodePath, etagEhMd5, etagLimpo, filtrarBuckets, fmtBytes, headObjeto, intEnv, iterObjects,
  listBuckets, loadEnv, redact, retryFetch, runPool, sairComErro,
  type Env, type Fetch, type InfoDestino, type StorageObject,
} from "./_lib.ts";

export interface OpcoesCopia {
  fetchFn?: Fetch;
  rateLimitBps?: number;
  preservarMetadata?: boolean;
  verificarAposPut?: boolean;
  log?: (linha: Record<string, unknown>) => Promise<void> | void;
}
export interface ResultadoCopia { bytes: number; skipped: boolean; dry?: boolean; aviso?: string }
export interface Totais { ok: number; skipped: number; fail: number; bytes: number; avisos: number }

/** Decide se o objeto já está replicado no destino (retomada). Função pura. */
export function jaReplicado(srcSize: number | undefined, srcEtag: string, dest: InfoDestino): boolean {
  if (!dest.ok || srcSize === undefined || dest.size !== srcSize) return false;
  if (etagEhMd5(srcEtag) && etagEhMd5(dest.etag)) return srcEtag === dest.etag;
  // ETags não comparáveis (multipart/ausente): cai no critério antigo (tamanho > 0).
  return srcSize > 0;
}

/** Limitador global de vazão em bytes/s (0 = ilimitado). */
export function criarLimitador(bps: number, agora: () => number = Date.now, dormir = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))) {
  let janela = agora();
  let usados = 0;
  return async (bytes: number): Promise<void> => {
    if (!bps) return;
    if (agora() - janela >= 1000) { janela = agora(); usados = 0; }
    usados += bytes;
    while (usados > bps) {
      await dormir(Math.max(1, 1000 - (agora() - janela)));
      janela = agora();
      usados -= bps;
    }
  };
}

async function metadataUsuario(env: Env, bucket: string, chave: string, fetchFn?: Fetch): Promise<{ meta: Record<string, unknown> | null; aviso?: string }> {
  const url = `${env.SRC_SUPABASE_URL}/storage/v1/object/info/${encodeURIComponent(bucket)}/${encodePath(chave)}`;
  try {
    const r = await retryFetch(url, { headers: authHeaders(env.SRC_SERVICE_ROLE_KEY) }, { label: `INFO ${bucket}/${chave}`, retries: 2, fetchFn });
    if (!r.ok) { await r.body?.cancel(); return { meta: null, aviso: `metadata de usuário indisponível (INFO HTTP ${r.status})` }; }
    const j = await r.json() as { metadata?: unknown };
    const m = j.metadata;
    if (m && typeof m === "object" && !Array.isArray(m) && Object.keys(m).length > 0) return { meta: m as Record<string, unknown> };
    return { meta: null };
  } catch (e) {
    return { meta: null, aviso: `metadata de usuário indisponível (${e instanceof Error ? e.message : String(e)})` };
  }
}

function base64Utf8(s: string): string {
  let bin = "";
  for (const b of new TextEncoder().encode(s)) bin += String.fromCharCode(b);
  return btoa(bin);
}

/** Copia UM objeto. Lança em qualquer falha (nunca devolve sucesso parcial). */
export async function copiarObjeto(env: Env, bucket: string, obj: StorageObject, op: OpcoesCopia = {}): Promise<ResultadoCopia> {
  const key = obj.name;
  const size = obj.metadata?.size;
  const contentType = obj.metadata?.mimetype ?? "application/octet-stream";
  const cacheControl = obj.metadata?.cacheControl ?? "max-age=3600";
  const fetchFn = op.fetchFn;

  const head = await headObjeto(env.DEST_SUPABASE_URL, env.DEST_SERVICE_ROLE_KEY, bucket, key, fetchFn);
  if (jaReplicado(size, etagLimpo(obj.metadata?.eTag), head)) return { bytes: size ?? 0, skipped: true };
  if (env.DRY_RUN) return { bytes: size ?? 0, skipped: false, dry: true };

  const getUrl = `${env.SRC_SUPABASE_URL}/storage/v1/object/authenticated/${encodeURIComponent(bucket)}/${encodePath(key)}`;
  const src = await retryFetch(getUrl, { headers: authHeaders(env.SRC_SERVICE_ROLE_KEY) },
    { label: `GET ${bucket}/${key}`, fetchFn, timeoutMs: env.TRANSFER_TIMEOUT_MS });
  if (!src.ok || !src.body) { await src.body?.cancel(); throw new Error(`GET ${bucket}/${key} HTTP ${src.status}`); }

  // Baixa calculando MD5 em stream. Objeto grande (ou de tamanho desconhecido) vai
  // para arquivo temporário: memória limitada e corpo reabrível a cada retry do upload.
  const md5 = createHash("md5");
  let baixados = 0;
  const contador = new TransformStream<Uint8Array, Uint8Array>({
    transform(c, ctl) { md5.update(c); baixados += c.byteLength; ctl.enqueue(c); },
  });
  let tmpPath: string | null = null;
  let buf: Uint8Array<ArrayBuffer> | null = null;
  try {
    if (size === undefined || size > env.STREAM_TMPFILE_THRESHOLD) {
      tmpPath = await Deno.makeTempFile({ prefix: "storage-copy-" });
      const f = await Deno.open(tmpPath, { write: true, truncate: true });
      await src.body.pipeThrough(contador).pipeTo(f.writable);
    } else {
      buf = new Uint8Array(await new Response(src.body.pipeThrough(contador)).arrayBuffer());
    }
    if (size !== undefined && baixados !== size) {
      throw new Error(`download truncado de ${bucket}/${key}: origem diz ${size} bytes, vieram ${baixados}`);
    }
    const md5Local = md5.digest("hex");
    const etagOrigem = etagLimpo(obj.metadata?.eTag);
    const verificar = op.verificarAposPut ?? true;
    if (verificar && etagEhMd5(etagOrigem) && etagOrigem !== md5Local) {
      throw new Error(`conteúdo baixado de ${bucket}/${key} não bate com o ETag da origem (md5=${md5Local} etag=${etagOrigem})`);
    }

    const cab: Record<string, string> = { "Content-Type": contentType, "Cache-Control": cacheControl, "x-upsert": "true" };
    let aviso: string | undefined;
    if (op.preservarMetadata ?? true) {
      const m = await metadataUsuario(env, bucket, key, fetchFn);
      aviso = m.aviso;
      if (m.meta) cab["x-metadata"] = base64Utf8(JSON.stringify(m.meta));
    }

    const putUrl = `${env.DEST_SUPABASE_URL}/storage/v1/object/${encodeURIComponent(bucket)}/${encodePath(key)}`;
    const caminhoTmp = tmpPath;
    const put = await retryFetch(putUrl, async () => ({
      method: "POST",
      headers: authHeaders(env.DEST_SERVICE_ROLE_KEY, cab),
      body: caminhoTmp ? (await Deno.open(caminhoTmp, { read: true })).readable : buf,
    }), { label: `PUT ${bucket}/${key}`, fetchFn, timeoutMs: env.TRANSFER_TIMEOUT_MS });
    if (!put.ok) throw new Error(`PUT ${bucket}/${key} HTTP ${put.status}: ${redact((await put.text()).slice(0, 300))}`);
    await put.body?.cancel();

    if (verificar) {
      const d = await headObjeto(env.DEST_SUPABASE_URL, env.DEST_SERVICE_ROLE_KEY, bucket, key, fetchFn);
      if (!d.ok) throw new Error(`verificação pós-upload de ${bucket}/${key}: HEAD HTTP ${d.status}`);
      if (d.size !== baixados) throw new Error(`verificação pós-upload de ${bucket}/${key}: destino tem ${d.size} bytes, enviados ${baixados}`);
      if (etagEhMd5(d.etag) && d.etag !== md5Local) throw new Error(`verificação pós-upload de ${bucket}/${key}: ETag ${d.etag} ≠ MD5 ${md5Local}`);
    }
    return { bytes: baixados, skipped: false, aviso };
  } finally {
    if (tmpPath) await Deno.remove(tmpPath).catch(() => {});
  }
}

/** Copia todos os buckets (ou ONLY_BUCKET). Falha por objeto é contada, registrada e não interrompe os demais. */
export async function copiarTudo(env: Env, op: OpcoesCopia = {}): Promise<Totais> {
  const buckets = filtrarBuckets(await listBuckets(env.SRC_SUPABASE_URL, env.SRC_SERVICE_ROLE_KEY, op.fetchFn), env.ONLY_BUCKET);
  const limitar = criarLimitador(op.rateLimitBps ?? 0);
  const log = op.log ?? (() => {});
  const total: Totais = { ok: 0, skipped: 0, fail: 0, bytes: 0, avisos: 0 };

  for (const b of buckets) {
    console.log(`\n▶ bucket ${b.id} (concurrency=${env.CONCURRENCY}${env.DRY_RUN ? " DRY_RUN" : ""})`);
    const t: Totais = { ok: 0, skipped: 0, fail: 0, bytes: 0, avisos: 0 };
    await runPool(iterObjects(env.SRC_SUPABASE_URL, env.SRC_SERVICE_ROLE_KEY, b.id, "", op.fetchFn), async (obj) => {
      const started = Date.now();
      try {
        const r = await copiarObjeto(env, b.id, obj, op);
        if (r.skipped) t.skipped++; else t.ok++;
        if (r.aviso) t.avisos++;
        t.bytes += r.bytes;
        await log({ bucket: b.id, key: obj.name, bytes: r.bytes, status: r.skipped ? "skip" : r.dry ? "dry" : "ok", ms: Date.now() - started, ...(r.aviso ? { aviso: r.aviso } : {}) });
        if (!r.skipped && !r.dry) await limitar(r.bytes);
      } catch (err) {
        t.fail++;
        const msg = redact(err instanceof Error ? err.message : String(err));
        await log({ bucket: b.id, key: obj.name, status: "fail", ms: Date.now() - started, error: msg });
        console.error(`  ✖ ${b.id}/${obj.name} — ${msg}`);
      }
    }, env.CONCURRENCY);
    for (const k of Object.keys(total) as (keyof Totais)[]) total[k] += t[k];
    console.log(`  bucket ${b.id}: OK=${t.ok} SKIP=${t.skipped} FAIL=${t.fail} BYTES=${fmtBytes(t.bytes)}${t.avisos ? ` AVISOS=${t.avisos}` : ""}`);
  }
  return total;
}

if (import.meta.main) {
  try {
    const env = loadEnv();
    const get = (k: string) => Deno.env.get(k);
    // P3.13 — rate limit global em bytes/s (0 = ilimitado)
    const rateLimitBps = intEnv(get, "RATE_LIMIT_BPS", 0, 0);
    const logPath = Deno.env.get("STORAGE_COPY_LOG") || new URL("./storage-copy.log", import.meta.url).pathname;
    const logFile = await Deno.open(logPath, { create: true, append: true });
    const enc = new TextEncoder();
    let total: Totais;
    try {
      total = await copiarTudo(env, {
        rateLimitBps,
        preservarMetadata: intEnv(get, "PRESERVE_USER_METADATA", 1, 0) !== 0,
        verificarAposPut: intEnv(get, "VERIFY_AFTER_PUT", 1, 0) !== 0,
        log: async (o) => { await logFile.write(enc.encode(JSON.stringify({ ts: new Date().toISOString(), ...o }) + "\n")); },
      });
    } finally {
      logFile.close();
    }
    console.log(`\nTOTAL: OK=${total.ok} SKIP=${total.skipped} FAIL=${total.fail} BYTES=${fmtBytes(total.bytes)}${total.avisos ? ` AVISOS=${total.avisos}` : ""}`);
    console.log(`Log: ${logPath}`);
    if (total.fail > 0) Deno.exit(1);
  } catch (e) {
    sairComErro(e);
  }
}
