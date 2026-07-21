// Utilitários compartilhados pelos scripts de migração de Storage.
// Deno 1.44+. Sem dependências externas.

export interface Env {
  SRC_SUPABASE_URL: string;
  SRC_SERVICE_ROLE_KEY: string;
  DEST_SUPABASE_URL: string;
  DEST_SERVICE_ROLE_KEY: string;
  CONCURRENCY: number;
  DRY_RUN: boolean;
  ONLY_BUCKET: string;
  STREAM_TMPFILE_THRESHOLD: number;
}

export interface Bucket {
  id: string;
  name: string;
  public: boolean;
  file_size_limit: number | null;
  allowed_mime_types: string[] | null;
  created_at?: string;
  updated_at?: string;
}

export interface StorageObject {
  name: string;                       // caminho relativo ao bucket
  id: string | null;                  // null quando é "pasta"
  updated_at: string | null;
  created_at: string | null;
  last_accessed_at: string | null;
  metadata: { size?: number; mimetype?: string; cacheControl?: string; eTag?: string } | null;
}

export function loadEnv(): Env {
  const need = (k: string): string => {
    const v = Deno.env.get(k);
    if (!v) {
      console.error(`✖ Variável ${k} ausente. Copie storage/env.example → storage/.env e preencha.`);
      Deno.exit(2);
    }
    return v;
  };
  return {
    SRC_SUPABASE_URL: need("SRC_SUPABASE_URL").replace(/\/$/, ""),
    SRC_SERVICE_ROLE_KEY: need("SRC_SERVICE_ROLE_KEY"),
    DEST_SUPABASE_URL: need("DEST_SUPABASE_URL").replace(/\/$/, ""),
    DEST_SERVICE_ROLE_KEY: need("DEST_SERVICE_ROLE_KEY"),
    CONCURRENCY: Math.max(1, parseInt(Deno.env.get("CONCURRENCY") ?? "8", 10)),
    DRY_RUN: (Deno.env.get("DRY_RUN") ?? "0") === "1",
    ONLY_BUCKET: Deno.env.get("ONLY_BUCKET") ?? "",
    STREAM_TMPFILE_THRESHOLD: parseInt(Deno.env.get("STREAM_TMPFILE_THRESHOLD") ?? "52428800", 10),
  };
}

export function redact(s: string): string {
  return s.replace(/(eyJ[\w-]{6})[\w.-]+/g, "$1…REDACTED");
}

/** fetch com retries exponenciais para 429/5xx. */
export async function retryFetch(
  input: string,
  init: RequestInit,
  opts: { retries?: number; label?: string } = {},
): Promise<Response> {
  const retries = opts.retries ?? 5;
  let attempt = 0;
  let lastErr: unknown;
  while (attempt <= retries) {
    try {
      const res = await fetch(input, init);
      if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
        // consumir corpo para liberar conexão
        await res.body?.cancel();
        throw new Error(`HTTP ${res.status}`);
      }
      return res;
    } catch (err) {
      lastErr = err;
      const delay = Math.min(30_000, 500 * 2 ** attempt) + Math.random() * 250;
      console.warn(`  ↻ retry ${attempt + 1}/${retries} ${opts.label ?? input} (${(err as Error).message}) em ${Math.round(delay)}ms`);
      await new Promise((r) => setTimeout(r, delay));
      attempt++;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

export function authHeaders(key: string, extra: Record<string, string> = {}): HeadersInit {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...extra,
  };
}

/** Lista buckets via GET /storage/v1/bucket. */
export async function listBuckets(baseUrl: string, key: string): Promise<Bucket[]> {
  const res = await retryFetch(`${baseUrl}/storage/v1/bucket`, {
    method: "GET",
    headers: authHeaders(key),
  }, { label: "listBuckets" });
  if (!res.ok) {
    throw new Error(`listBuckets falhou: HTTP ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as Bucket[];
}

/** POST /storage/v1/object/list/{bucket} — paginado, recursivo. */
export async function* iterObjects(
  baseUrl: string,
  key: string,
  bucket: string,
  prefix = "",
): AsyncGenerator<StorageObject, void, unknown> {
  const pageSize = 1000;
  let offset = 0;
  while (true) {
    const res = await retryFetch(`${baseUrl}/storage/v1/object/list/${encodeURIComponent(bucket)}`, {
      method: "POST",
      headers: authHeaders(key, { "Content-Type": "application/json" }),
      body: JSON.stringify({
        prefix,
        limit: pageSize,
        offset,
        sortBy: { column: "name", order: "asc" },
      }),
    }, { label: `list ${bucket}/${prefix}` });
    if (!res.ok) {
      throw new Error(`list ${bucket}/${prefix} HTTP ${res.status}: ${await res.text()}`);
    }
    const page = (await res.json()) as StorageObject[];
    if (page.length === 0) return;
    for (const item of page) {
      const full = prefix ? `${prefix}${item.name}` : item.name;
      if (item.id === null) {
        // "pasta" — recursão
        yield* iterObjects(baseUrl, key, bucket, `${full}/`);
      } else {
        yield { ...item, name: full };
      }
    }
    if (page.length < pageSize) return;
    offset += pageSize;
  }
}

/** Pool simples de concorrência (sem depender de p-limit). */
export async function runPool<T>(
  items: AsyncIterable<T>,
  workerFn: (t: T) => Promise<void>,
  concurrency: number,
): Promise<void> {
  const queue: T[] = [];
  let done = false;
  const iter = items[Symbol.asyncIterator]();
  const inflight = new Set<Promise<void>>();

  const pull = async (): Promise<void> => {
    while (inflight.size < concurrency && !done) {
      const nx = await iter.next();
      if (nx.done) { done = true; break; }
      const p = workerFn(nx.value).finally(() => inflight.delete(p));
      inflight.add(p);
    }
  };

  await pull();
  while (inflight.size > 0) {
    await Promise.race(inflight);
    await pull();
  }
  // drena erros pendentes
  await Promise.allSettled(inflight);
  // relança se algum rejeitou
  const results = await Promise.allSettled(Array.from(inflight));
  for (const r of results) if (r.status === "rejected") throw r.reason;
  void queue;
}

export function fmtBytes(n: number): string {
  const u = ["B", "KiB", "MiB", "GiB", "TiB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(1)} ${u[i]}`;
}