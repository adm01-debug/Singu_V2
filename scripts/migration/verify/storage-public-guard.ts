// storage-public-guard.ts — Falha se buckets públicos não estão no allowlist.
// Uso: node --experimental-strip-types verify/storage-public-guard.ts   (ou: deno run -A …)
//   env: DEST_SUPABASE_URL, DEST_SERVICE_ROLE_KEY (ou SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)
//        GUARD_TIMEOUT_MS (15000)
// Saída: 0 = nenhum bucket público fora do allowlist · 1 = violação ou falha de API · 2 = configuração.
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

export interface BucketInfo { id?: string; name: string; public: boolean }

/** Uma entrada por linha; ignora vazias, comentários de linha inteira e comentário após o nome. */
export function parseAllowlist(texto: string): Set<string> {
  return new Set(texto.split(/\r?\n/).map((l) => l.replace(/\s+#.*$/, "").trim()).filter((l) => l && !l.startsWith("#")));
}

/** Buckets públicos cujo id/nome não está no allowlist. Função pura. */
export function violacoes(buckets: BucketInfo[], allowlist: Set<string>): BucketInfo[] {
  return buckets.filter((b) => b.public === true && !allowlist.has(b.name) && !(b.id !== undefined && allowlist.has(b.id)));
}

export async function listarBuckets(url: string, chave: string, timeoutMs: number, fetchFn: typeof fetch = fetch): Promise<BucketInfo[]> {
  const res = await fetchFn(`${url.replace(/\/+$/, "")}/storage/v1/bucket`, {
    headers: { apikey: chave, authorization: `Bearer ${chave}` },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`storage list falhou: HTTP ${res.status}`);
  const corpo: unknown = await res.json();
  if (!Array.isArray(corpo)) throw new Error("storage list: resposta inesperada (não é lista)");
  return corpo as BucketInfo[];
}

async function main(): Promise<number> {
  const url = process.env.DEST_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const chave = process.env.DEST_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) {
    console.error("✖ defina DEST_SUPABASE_URL e DEST_SERVICE_ROLE_KEY");
    return 2;
  }
  const timeoutMs = Number(process.env.GUARD_TIMEOUT_MS ?? "15000");
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) { console.error("✖ GUARD_TIMEOUT_MS inválido"); return 2; }
  const arquivo = join(dirname(fileURLToPath(import.meta.url)), "storage-public-allowlist.txt");
  const allowlist = existsSync(arquivo) ? parseAllowlist(readFileSync(arquivo, "utf8")) : new Set<string>();
  let buckets: BucketInfo[];
  try {
    buckets = await listarBuckets(url, chave, timeoutMs);
  } catch (e) {
    console.error(`✖ ${e instanceof Error ? e.message : String(e)}`);
    return 1;
  }
  console.log(`ℹ ${buckets.length} bucket(s) total, ${buckets.filter((b) => b.public).length} público(s)`);
  const ruins = violacoes(buckets, allowlist);
  if (ruins.length === 0) {
    console.log("✔ Nenhum bucket público fora do allowlist");
    return 0;
  }
  console.error("🚨 Buckets públicos NÃO whitelisted:");
  for (const b of ruins) console.error(`  - ${b.name}`);
  return 1;
}

// Executa só quando chamado direto (node ou deno), não quando importado por teste.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exit(await main());
}
