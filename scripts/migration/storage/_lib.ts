// Utilitários compartilhados pelos scripts de migração de Storage.
// Deno 2. Sem dependências externas (só built-ins do Deno).
//
// Variáveis lidas por loadEnv():
//   SRC_SUPABASE_URL, SRC_SERVICE_ROLE_KEY, DEST_SUPABASE_URL, DEST_SERVICE_ROLE_KEY (obrigatórias)
//   CONCURRENCY (8), DRY_RUN (0|1), ONLY_BUCKET, STREAM_TMPFILE_THRESHOLD (50 MiB)
//   HTTP_TIMEOUT_MS (120000)      — teto de cada chamada de metadados
//   TRANSFER_TIMEOUT_MS (1800000) — teto de cada download/upload de objeto
//   RETRY_BASE_MS (500)           — base do backoff exponencial

export interface Env {
  SRC_SUPABASE_URL: string;
  SRC_SERVICE_ROLE_KEY: string;
  DEST_SUPABASE_URL: string;
  DEST_SERVICE_ROLE_KEY: string;
  CONCURRENCY: number;
  DRY_RUN: boolean;
  ONLY_BUCKET: string;
  STREAM_TMPFILE_THRESHOLD: number;
  TRANSFER_TIMEOUT_MS: number;
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

export type Fetch = typeof fetch;

/** Erro de configuração (variável ausente/inválida). Scripts saem com código 2. */
export class ErroConfig extends Error {}

/** Ajustes globais de rede; loadEnv() preenche a partir do ambiente e os testes reduzem. */
export const ajustes = { baseDelayMs: 500, timeoutMs: 120_000, maxDelayMs: 30_000 };

/** Lê inteiro de variável de ambiente; valor não numérico ou abaixo do mínimo é ERRO (nunca NaN silencioso). */
export function intEnv(get: (k: string) => string | undefined, nome: string, padrao: number, min = 0): number {
  const bruto = get(nome);
  if (bruto === undefined || bruto.trim() === "") return padrao;
  const n = Number(bruto.trim());
  if (!Number.isInteger(n) || n < min) throw new ErroConfig(`${nome} inválido ("${bruto}"): esperado inteiro >= ${min}`);
  return n;
}

function urlBase(get: (k: string) => string | undefined, nome: string): string {
  const v = (get(nome) ?? "").trim();
  if (!v) throw new ErroConfig(`Variável ${nome} ausente. Copie storage/env.example → storage/.env e preencha.`);
  let u: URL;
  try { u = new URL(v); } catch { throw new ErroConfig(`${nome} não é uma URL válida`); }
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new ErroConfig(`${nome} precisa ser http(s)`);
  return v.replace(/\/+$/, "");
}

/** Versão pura de loadEnv (lança ErroConfig em vez de encerrar o processo). */
export function parseEnv(get: (k: string) => string | undefined): Env {
  const need = (k: string): string => {
    const v = get(k);
    if (!v) throw new ErroConfig(`Variável ${k} ausente. Copie storage/env.example → storage/.env e preencha.`);
    return v;
  };
  const dry = (get("DRY_RUN") ?? "0").trim().toLowerCase();
  if (!["0", "1", "", "true", "false"].includes(dry)) throw new ErroConfig(`DRY_RUN inválido ("${dry}"): use 0 ou 1`);
  const env: Env = {
    SRC_SUPABASE_URL: urlBase(get, "SRC_SUPABASE_URL"),
    SRC_SERVICE_ROLE_KEY: need("SRC_SERVICE_ROLE_KEY"),
    DEST_SUPABASE_URL: urlBase(get, "DEST_SUPABASE_URL"),
    DEST_SERVICE_ROLE_KEY: need("DEST_SERVICE_ROLE_KEY"),
    CONCURRENCY: intEnv(get, "CONCURRENCY", 8, 1),
    DRY_RUN: dry === "1" || dry === "true",
    ONLY_BUCKET: get("ONLY_BUCKET") ?? "",
    STREAM_TMPFILE_THRESHOLD: intEnv(get, "STREAM_TMPFILE_THRESHOLD", 52428800, 0),
    TRANSFER_TIMEOUT_MS: intEnv(get, "TRANSFER_TIMEOUT_MS", 1_800_000, 1),
  };
  if (env.SRC_SUPABASE_URL === env.DEST_SUPABASE_URL) {
    throw new ErroConfig("SRC_SUPABASE_URL e DEST_SUPABASE_URL são iguais — origem e destino precisam ser projetos diferentes");
  }
  return env;
}

export function loadEnv(): Env {
  try {
    const get = (k: string) => Deno.env.get(k);
    const env = parseEnv(get);
    ajustes.timeoutMs = intEnv(get, "HTTP_TIMEOUT_MS", 120_000, 1);
    ajustes.baseDelayMs = intEnv(get, "RETRY_BASE_MS", 500, 0);
    return env;
  } catch (e) {
    console.error(`✖ ${e instanceof Error ? e.message : String(e)}`);
    Deno.exit(2);
  }
}

/** Encerra com 2 em erro de configuração e 1 em qualquer outro; nunca imprime segredo. */
export function sairComErro(e: unknown): never {
  console.error(`✖ ${redact(e instanceof Error ? e.message : String(e))}`);
  Deno.exit(e instanceof ErroConfig ? 2 : 1);
}

export function redact(s: string): string {
  return s
    .replace(/(eyJ[\w-]{6})[\w.-]+/g, "$1…REDACTED")
    .replace(/\b(sb_secret_|sbp_)[\w-]+/g, "$1…REDACTED")
    .replace(/(:\/\/[^:/@\s]+:)[^@\s]+@/g, "$1…REDACTED@")
    .replace(/([?&]token=)[^&\s"]+/g, "$1…REDACTED");
}

/** Codifica cada segmento do caminho (espaço, acento, #, ?, % …) preservando as barras. */
export function encodePath(p: string): string {
  return p.split("/").map(encodeURIComponent).join("/");
}

export interface RetryOpts {
  retries?: number;
  label?: string;
  fetchFn?: Fetch;
  timeoutMs?: number;
  sleep?: (ms: number) => Promise<void>;
}

const dormir = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * fetch com timeout e retries exponenciais para 429/5xx e erro de rede.
 * `init` pode ser uma fábrica: é chamada a CADA tentativa, o que permite reabrir
 * um corpo em stream (um ReadableStream só pode ser enviado uma vez).
 * Esgotadas as tentativas, lança o último erro (ex.: "HTTP 503").
 */
export async function retryFetch(
  input: string,
  init: RequestInit | (() => RequestInit | Promise<RequestInit>),
  opts: RetryOpts = {},
): Promise<Response> {
  const retries = opts.retries ?? 5;
  const fetchFn = opts.fetchFn ?? fetch;
  const sleep = opts.sleep ?? dormir;
  const rotulo = opts.label ?? new URL(input).pathname;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    let esperaServidor = 0;
    try {
      const base = typeof init === "function" ? await init() : init;
      const res = await fetchFn(input, { ...base, signal: AbortSignal.timeout(opts.timeoutMs ?? ajustes.timeoutMs) });
      if (res.status !== 429 && res.status < 500) return res;
      const ra = Number(res.headers.get("retry-after"));
      if (Number.isFinite(ra) && ra > 0) esperaServidor = Math.min(60_000, ra * 1000);
      await res.body?.cancel(); // libera a conexão
      throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastErr = err;
      if (attempt === retries) break;
      const msg = err instanceof Error ? (err.name === "TimeoutError" ? "timeout" : err.message) : String(err);
      // eslint-disable-next-line sonarjs/pseudo-random -- jitter de backoff, não requer aleatoriedade criptográfica (ADR-020)
      const delay = Math.max(esperaServidor, Math.min(ajustes.maxDelayMs, ajustes.baseDelayMs * 2 ** attempt) + Math.random() * (ajustes.baseDelayMs / 2));
      console.warn(`  ↻ retry ${attempt + 1}/${retries} ${rotulo} (${redact(msg)}) em ${Math.round(delay)}ms`);
      await sleep(delay);
    }
  }
  if (lastErr instanceof Error && lastErr.name === "TimeoutError") throw new Error(`timeout em ${rotulo}`);
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

export function authHeaders(key: string, extra: Record<string, string> = {}): Record<string, string> {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...extra,
  };
}

/** Lista buckets via GET /storage/v1/bucket. */
export async function listBuckets(baseUrl: string, key: string, fetchFn?: Fetch): Promise<Bucket[]> {
  const res = await retryFetch(`${baseUrl}/storage/v1/bucket`, {
    method: "GET",
    headers: authHeaders(key),
  }, { label: "listBuckets", fetchFn });
  if (!res.ok) {
    throw new Error(`listBuckets falhou: HTTP ${res.status} ${redact(await res.text())}`);
  }
  const corpo: unknown = await res.json();
  if (!Array.isArray(corpo)) throw new Error("listBuckets: resposta inesperada (não é lista)");
  return corpo as Bucket[];
}

/** Aplica ONLY_BUCKET; bucket pedido que não existe é erro (antes: nada era feito e saía 0). */
export function filtrarBuckets(buckets: Bucket[], only: string): Bucket[] {
  if (!only) return buckets;
  const achados = buckets.filter((b) => b.id === only);
  if (achados.length === 0) throw new ErroConfig(`ONLY_BUCKET="${only}" não existe na origem`);
  return achados;
}

/**
 * POST /storage/v1/object/list/{bucket} — paginado, recursivo.
 * Pagina até receber página VAZIA (não confia em "página curta = fim": se o
 * servidor limitar `limit` abaixo do pedido, parar na página curta perde objetos).
 */
export async function* iterObjects(
  baseUrl: string,
  key: string,
  bucket: string,
  prefix = "",
  fetchFn?: Fetch,
): AsyncGenerator<StorageObject, void, unknown> {
  const pageSize = 1000;
  let offset = 0;
  let primeiroAnterior: string | null = null;
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
    }, { label: `list ${bucket}/${prefix}`, fetchFn });
    if (!res.ok) {
      throw new Error(`list ${bucket}/${prefix} HTTP ${res.status}: ${redact(await res.text())}`);
    }
    const page = (await res.json()) as StorageObject[];
    if (!Array.isArray(page)) throw new Error(`list ${bucket}/${prefix}: resposta inesperada (não é lista)`);
    if (page.length === 0) return;
    if (offset > 0 && page[0].name === primeiroAnterior) {
      throw new Error(`list ${bucket}/${prefix}: servidor ignorou offset=${offset} (página repetida) — abortando para não entrar em loop`);
    }
    primeiroAnterior = page[0].name;
    for (const item of page) {
      const full = prefix ? `${prefix}${item.name}` : item.name;
      if (item.id === null) {
        // "pasta" — recursão
        yield* iterObjects(baseUrl, key, bucket, `${full}/`, fetchFn);
      } else {
        yield { ...item, name: full };
      }
    }
    offset += page.length;
  }
}

/** Normaliza ETag: tira aspas e prefixo fraco (W/). */
export function etagLimpo(e: string | null | undefined): string {
  return (e ?? "").replace(/^W\//, "").replace(/"/g, "").toLowerCase();
}
/** ETag de upload simples é o MD5 do conteúdo; de multipart ("…-N") não é comparável. */
export function etagEhMd5(e: string): boolean {
  return /^[a-f0-9]{32}$/.test(e);
}

export interface InfoDestino { ok: boolean; status: number; size: number; etag: string; contentType: string; cacheControl: string }

/** HEAD de um objeto (não lança em 4xx; falha de rede vira status 599). */
export async function headObjeto(baseUrl: string, key: string, bucket: string, caminho: string, fetchFn?: Fetch): Promise<InfoDestino> {
  const res = await retryFetch(
    `${baseUrl}/storage/v1/object/authenticated/${encodeURIComponent(bucket)}/${encodePath(caminho)}`,
    { method: "HEAD", headers: authHeaders(key) },
    { label: `HEAD ${bucket}/${caminho}`, retries: 2, fetchFn },
  ).catch(() => new Response(null, { status: 599 }));
  return {
    ok: res.ok,
    status: res.status,
    size: Number(res.headers.get("content-length") ?? "-1"),
    etag: etagLimpo(res.headers.get("etag")),
    contentType: res.headers.get("content-type") ?? "",
    cacheControl: res.headers.get("cache-control") ?? "",
  };
}

/**
 * Pool de concorrência limitada (sem depender de p-limit). Consome `items` sob
 * demanda, nunca roda mais que `concurrency` workers e relança o 1º erro depois
 * de esperar os que estavam em voo.
 */
export async function runPool<T>(
  items: AsyncIterable<T>,
  workerFn: (t: T) => Promise<void>,
  concurrency: number,
): Promise<void> {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new ErroConfig(`concorrência inválida (${concurrency}): esperado inteiro >= 1`);
  }
  const iter = items[Symbol.asyncIterator]();
  let cadeia: Promise<unknown> = Promise.resolve();
  const proximo = (): Promise<IteratorResult<T>> => {
    const p = cadeia.then(() => iter.next());
    cadeia = p.catch(() => {});
    return p;
  };
  let falhou = false;
  let erro: unknown;
  const trabalhador = async (): Promise<void> => {
    while (!falhou) {
      try {
        const nx = await proximo();
        if (nx.done) return;
        await workerFn(nx.value);
      } catch (e) {
        if (!falhou) { falhou = true; erro = e; }
      }
    }
  };
  await Promise.all(Array.from({ length: concurrency }, trabalhador));
  if (falhou) throw erro;
}

export function fmtBytes(n: number): string {
  const u = ["B", "KiB", "MiB", "GiB", "TiB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(1)} ${u[i]}`;
}
