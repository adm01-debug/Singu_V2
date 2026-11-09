// Cria/atualiza buckets no DESTINO a partir da configuração da ORIGEM.
// Idempotente. Uso: deno run --allow-env --allow-net storage/create-buckets.ts
// DRY_RUN=1 só mostra o plano. Saída: 0 ok · 1 falha em algum bucket · 2 configuração.
import { authHeaders, filtrarBuckets, listBuckets, loadEnv, redact, retryFetch, sairComErro, type Bucket, type Env, type Fetch } from "./_lib.ts";

export type Acao = "criar" | "atualizar" | "identico";
export interface Resumo { created: number; updated: number; identical: number; failed: number; planned: number }

export function bucketPayload(b: Bucket) {
  return {
    id: b.id,
    name: b.name,
    public: b.public,
    file_size_limit: b.file_size_limit,
    allowed_mime_types: b.allowed_mime_types,
  };
}

export function bucketEqual(a: Bucket, b: Bucket): boolean {
  const norm = (arr: string[] | null | undefined) => (arr && arr.length ? [...arr].sort().join("|") : "");
  return a.public === b.public
    && (a.file_size_limit ?? null) === (b.file_size_limit ?? null)
    && norm(a.allowed_mime_types) === norm(b.allowed_mime_types);
}

/** Plano puro: o que fazer com cada bucket da origem dado o estado do destino. */
export function planejar(src: Bucket[], dest: Bucket[]): { bucket: Bucket; acao: Acao }[] {
  const destById = new Map(dest.map((b) => [b.id, b]));
  return src.map((b) => {
    const existente = destById.get(b.id);
    return { bucket: b, acao: !existente ? "criar" : bucketEqual(existente, b) ? "identico" : "atualizar" };
  });
}

export async function sincronizarBuckets(env: Env, fetchFn?: Fetch): Promise<Resumo> {
  const src = filtrarBuckets(await listBuckets(env.SRC_SUPABASE_URL, env.SRC_SERVICE_ROLE_KEY, fetchFn), env.ONLY_BUCKET);
  const dest = await listBuckets(env.DEST_SUPABASE_URL, env.DEST_SERVICE_ROLE_KEY, fetchFn);
  const r: Resumo = { created: 0, updated: 0, identical: 0, failed: 0, planned: 0 };
  const enviar = (method: "POST" | "PUT", b: Bucket) => retryFetch(
    method === "PUT" ? `${env.DEST_SUPABASE_URL}/storage/v1/bucket/${encodeURIComponent(b.id)}` : `${env.DEST_SUPABASE_URL}/storage/v1/bucket`,
    { method, headers: authHeaders(env.DEST_SERVICE_ROLE_KEY, { "Content-Type": "application/json" }), body: JSON.stringify(bucketPayload(b)) },
    { label: `${method} bucket ${b.id}`, fetchFn },
  );
  for (const { bucket: b, acao } of planejar(src, dest)) {
    if (acao === "identico") { r.identical++; console.log(`= ${b.id} (idêntico)`); continue; }
    if (env.DRY_RUN) {
      r.planned++;
      console.log(`~ ${b.id} (${acao === "atualizar" ? "atualizaria" : "criaria"}${b.public ? ", PÚBLICO" : ""}) [DRY_RUN]`);
      continue;
    }
    try {
      let res = await enviar(acao === "atualizar" ? "PUT" : "POST", b);
      let via409 = false;
      if (res.status === 409 && acao === "criar") {
        // criado por outro processo entre a listagem e o POST — tenta PUT
        await res.body?.cancel();
        res = await enviar("PUT", b);
        via409 = true;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${redact((await res.text()).slice(0, 300))}`);
      await res.body?.cancel();
      if (acao === "atualizar" || via409) { r.updated++; console.log(`↑ ${b.id} (${via409 ? "409→PUT ok" : "atualizado"})`); }
      else { r.created++; console.log(`+ ${b.id} (criado${b.public ? ", PÚBLICO" : ""})`); }
    } catch (e) {
      r.failed++;
      console.error(`✖ ${b.id} ${redact(e instanceof Error ? e.message : String(e))}`);
    }
  }
  return r;
}

if (import.meta.main) {
  try {
    const r = await sincronizarBuckets(loadEnv());
    console.log(`\nResumo: criados=${r.created} atualizados=${r.updated} idênticos=${r.identical} falhas=${r.failed}${r.planned ? ` planejados(DRY_RUN)=${r.planned}` : ""}`);
    if (r.failed > 0) Deno.exit(1);
  } catch (e) {
    sairComErro(e);
  }
}
