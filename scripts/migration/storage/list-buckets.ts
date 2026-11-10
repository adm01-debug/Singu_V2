// Lista buckets da ORIGEM com contagem de objetos e bytes (somente leitura).
// Uso: deno run --allow-env --allow-net storage/list-buckets.ts
// Saída: 0 ok · 1 falha de rede/API · 2 configuração.
import { filtrarBuckets, fmtBytes, iterObjects, listBuckets, loadEnv, sairComErro, type Env, type Fetch } from "./_lib.ts";

export interface LinhaBucket { id: string; public: boolean; files: number; bytes: number }

export async function inventariar(env: Env, fetchFn?: Fetch): Promise<LinhaBucket[]> {
  const buckets = filtrarBuckets(await listBuckets(env.SRC_SUPABASE_URL, env.SRC_SERVICE_ROLE_KEY, fetchFn), env.ONLY_BUCKET);
  const linhas: LinhaBucket[] = [];
  for (const b of buckets) {
    let files = 0;
    let bytes = 0;
    for await (const o of iterObjects(env.SRC_SUPABASE_URL, env.SRC_SERVICE_ROLE_KEY, b.id, "", fetchFn)) {
      files++;
      bytes += o.metadata?.size ?? 0;
    }
    linhas.push({ id: b.id, public: b.public, files, bytes });
  }
  return linhas;
}

if (import.meta.main) {
  try {
    const linhas = await inventariar(loadEnv());
    console.log(`\nBuckets encontrados na origem: ${linhas.length}\n`);
    console.log("id".padEnd(28) + "public".padEnd(10) + "arquivos".padStart(10) + "  bytes");
    console.log("-".repeat(70));
    let totalFiles = 0;
    let totalBytes = 0;
    for (const l of linhas) {
      totalFiles += l.files;
      totalBytes += l.bytes;
      console.log(l.id.padEnd(28) + String(l.public).padEnd(10) + String(l.files).padStart(10) + "  " + fmtBytes(l.bytes));
    }
    console.log("-".repeat(70));
    console.log(`TOTAL${" ".repeat(23)}${" ".repeat(10)}${String(totalFiles).padStart(10)}  ${fmtBytes(totalBytes)}\n`);
  } catch (e) {
    sairComErro(e);
  }
}
