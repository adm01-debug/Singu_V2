// Storage byte-level verify — baixa amostra aleatória e compara SHA-256 (em stream).
// Uso: deno run --allow-env --allow-net --allow-write verify/storage-bytes.ts
// Variáveis (além das de storage/_lib.ts): BYTES_SAMPLE_PCT (0.5), BYTES_MAX_PER_BUCKET (100),
//   BYTES_REPORT (padrão: storage/verify-bytes-report.json).
// Saída: 0 paridade · 1 divergência/erro de download · 2 configuração.
import { createHash } from "node:crypto";
import {
  authHeaders, encodePath, ErroConfig, filtrarBuckets, iterObjects, listBuckets, loadEnv, retryFetch, sairComErro,
  type Env, type Fetch, type StorageObject,
} from "../storage/_lib.ts";
import { amostrar } from "../storage/verify-counts.ts";

/** Tamanho da amostra: pct% do total, no mínimo 1 (se houver objeto) e no máximo `max`. */
export function tamanhoAmostra(total: number, pct: number, max: number): number {
  if (total === 0) return 0;
  return Math.min(max, total, Math.max(1, Math.floor(total * pct / 100)));
}

/** SHA-256 do objeto baixado em stream. Download que não é 200 é ERRO (nunca hash de página de erro). */
export async function sha256Objeto(base: string, key: string, bucket: string, obj: string, timeoutMs: number, fetchFn?: Fetch): Promise<string> {
  const r = await retryFetch(`${base}/storage/v1/object/authenticated/${encodeURIComponent(bucket)}/${encodePath(obj)}`,
    { headers: authHeaders(key) }, { label: `GET ${bucket}/${obj}`, retries: 2, fetchFn, timeoutMs });
  if (r.status !== 200 || !r.body) { await r.body?.cancel(); throw new Error(`download HTTP ${r.status}`); }
  const h = createHash("sha256");
  for await (const pedaco of r.body) h.update(pedaco);
  return h.digest("hex");
}

export interface ReportBytes { bucket: string; total: number; sampled: number; mismatches: string[] }

export async function verificarBytes(env: Env, op: { pct: number; max: number; fetchFn?: Fetch; rng?: () => number }): Promise<ReportBytes[]> {
  const src = filtrarBuckets(await listBuckets(env.SRC_SUPABASE_URL, env.SRC_SERVICE_ROLE_KEY, op.fetchFn), env.ONLY_BUCKET);
  const report: ReportBytes[] = [];
  for (const b of src) {
    const all: StorageObject[] = [];
    for await (const o of iterObjects(env.SRC_SUPABASE_URL, env.SRC_SERVICE_ROLE_KEY, b.id, "", op.fetchFn)) all.push(o);
    const sample = amostrar(all, tamanhoAmostra(all.length, op.pct, op.max), op.rng);
    const mismatches: string[] = [];
    for (const o of sample) {
      try {
        const sH = await sha256Objeto(env.SRC_SUPABASE_URL, env.SRC_SERVICE_ROLE_KEY, b.id, o.name, env.TRANSFER_TIMEOUT_MS, op.fetchFn)
          .catch((e) => { throw new Error(`origem: ${e instanceof Error ? e.message : e}`); });
        const dH = await sha256Objeto(env.DEST_SUPABASE_URL, env.DEST_SERVICE_ROLE_KEY, b.id, o.name, env.TRANSFER_TIMEOUT_MS, op.fetchFn)
          .catch((e) => { throw new Error(`destino: ${e instanceof Error ? e.message : e}`); });
        if (sH !== dH) mismatches.push(`${o.name} src=${sH.slice(0, 12)} dest=${dH.slice(0, 12)}`);
      } catch (e) { mismatches.push(`${o.name} err=${e instanceof Error ? e.message : e}`); }
    }
    console.log(`${mismatches.length === 0 ? "✔" : "✖"} ${b.id}: sample=${sample.length}/${all.length} mismatches=${mismatches.length}`);
    mismatches.forEach((m) => console.log("    -", m));
    report.push({ bucket: b.id, total: all.length, sampled: sample.length, mismatches });
  }
  return report;
}

if (import.meta.main) {
  try {
    const env = loadEnv();
    const num = (nome: string, padrao: number) => {
      const v = Number(Deno.env.get(nome) ?? padrao);
      if (!Number.isFinite(v) || v <= 0) throw new ErroConfig(`${nome} inválido: esperado número > 0`);
      return v;
    };
    const report = await verificarBytes(env, { pct: num("BYTES_SAMPLE_PCT", 0.5), max: num("BYTES_MAX_PER_BUCKET", 100) });
    const destino = Deno.env.get("BYTES_REPORT") || new URL("../storage/verify-bytes-report.json", import.meta.url).pathname;
    await Deno.writeTextFile(destino, JSON.stringify(report, null, 2));
    if (report.some((r) => r.mismatches.length > 0)) { console.error("\n✖ Divergência byte a byte."); Deno.exit(1); }
    if (report.every((r) => r.sampled === 0)) { console.error("\n✖ Nenhum objeto amostrado — nada foi verificado."); Deno.exit(1); }
    console.log("\n✔ Byte-level parity OK");
  } catch (e) {
    sairComErro(e);
  }
}
