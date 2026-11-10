// LGPD Snapshot Manifest — contagem + hash de TODAS as linhas (id e carimbos de tempo, sem
// nenhum dado pessoal) das tabelas com dados de titulares, com assinatura HMAC-SHA256.
// Uso:  deno run --allow-env --allow-net --allow-write compliance/lgpd-snapshot.ts
//       deno run --allow-env --allow-read compliance/lgpd-snapshot.ts --verify <manifesto.json>
// Env: DEST_SUPABASE_URL, DEST_SERVICE_ROLE_KEY, LGPD_MANIFEST_SECRET (>= 16 caracteres),
//      LGPD_OUT_DIR (padrão: compliance/). O arquivo é criado com permissão 600.
// O manifesto NÃO contém PII: só nomes de tabela, contagens e hashes. A assinatura cobre o
// manifesto inteiro (versão, data, destino, tabelas, hash agregado).
// Saída: 0 ok · 1 falha ao ler alguma tabela / assinatura inválida · 2 configuração.
import { createHash } from "node:crypto";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.117.3";

/** Colunas que existem em cada tabela (ver ddl/02_tables.sql); "id" é sempre a 1ª e é a chave de paginação. */
export const TABELAS: { tabela: string; colunas: string[] }[] = [
  { tabela: "contacts", colunas: ["id", "created_at", "updated_at"] },
  { tabela: "companies", colunas: ["id", "created_at", "updated_at"] },
  { tabela: "interactions", colunas: ["id", "created_at"] },
  { tabela: "whatsapp_messages", colunas: ["id", "created_at", "updated_at"] },
  { tabela: "call_logs", colunas: ["id", "created_at"] },
  { tabela: "deals", colunas: ["id", "created_at", "updated_at"] },
  { tabela: "user_roles", colunas: ["id"] },
];

export interface Entry { table: string; count: number; rows_hash: string }
export interface Manifesto { version: string; generated_at: string; destination: string; tables: Entry[]; aggregate_hash: string; signature?: string }
export type LeitorPagina = (tabela: string, colunas: string[], aposId: string | null, limite: number) => Promise<Record<string, unknown>[]>;

/** JSON determinístico (chaves ordenadas) — base do hash e da assinatura. */
export function canonico(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonico).join(",")}]`;
  if (v !== null && typeof v === "object") {
    const o = v as Record<string, unknown>;
    const pares = Object.keys(o).filter((k) => o[k] !== undefined).sort().map((k) => JSON.stringify(k) + ":" + canonico(o[k]));
    return `{${pares.join(",")}}`;
  }
  return JSON.stringify(v);
}
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** Percorre a tabela inteira por keyset (id crescente) e devolve contagem + hash encadeado. */
export async function hashTabela(ler: LeitorPagina, tabela: string, colunas: string[], pagina = 1000): Promise<Entry> {
  const h = createHash("sha256");
  let count = 0;
  let ultimo: string | null = null;
  while (true) {
    const linhas = await ler(tabela, colunas, ultimo, pagina);
    if (linhas.length === 0) break;
    for (const l of linhas) { h.update(canonico(l)); h.update("\n"); }
    count += linhas.length;
    const novo = String(linhas[linhas.length - 1].id);
    if (novo === ultimo) throw new Error(`${tabela}: paginação não avançou (id repetido)`);
    ultimo = novo;
  }
  return { table: tabela, count, rows_hash: h.digest("hex") };
}

export async function assinar(segredo: string, m: Omit<Manifesto, "signature">): Promise<string> {
  const chave = await crypto.subtle.importKey("raw", new TextEncoder().encode(segredo), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", chave, new TextEncoder().encode(canonico(m)));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function montarManifesto(ler: LeitorPagina, destino: string, segredo: string, agora: Date, log: (m: string) => void = console.log): Promise<Manifesto> {
  const tables: Entry[] = [];
  for (const t of TABELAS) {
    const e = await hashTabela(ler, t.tabela, t.colunas);
    tables.push(e);
    log(`  ${t.tabela}: count=${e.count} hash=${e.rows_hash.slice(0, 16)}…`);
  }
  const corpo = { version: "1.1", generated_at: agora.toISOString(), destination: destino, tables, aggregate_hash: sha256(canonico(tables)) };
  return { ...corpo, signature: await assinar(segredo, corpo) };
}

/** Confere hash agregado e assinatura (comparação em tempo constante). */
export async function verificarManifesto(m: Manifesto, segredo: string): Promise<boolean> {
  const { signature, ...corpo } = m;
  if (typeof signature !== "string" || !Array.isArray(m.tables)) return false;
  if (sha256(canonico(m.tables)) !== m.aggregate_hash) return false;
  const esperado = await assinar(segredo, corpo);
  if (esperado.length !== signature.length) return false;
  let dif = 0;
  for (let i = 0; i < esperado.length; i++) dif |= esperado.charCodeAt(i) ^ signature.charCodeAt(i);
  return dif === 0;
}

export function leitorSupabase(sb: SupabaseClient): LeitorPagina {
  return async (tabela, colunas, aposId, limite) => {
    let q = sb.from(tabela).select(colunas.join(", ")).order("id").limit(limite);
    if (aposId !== null) q = q.gt("id", aposId);
    const { data, error } = await q;
    if (error) throw new Error(`${tabela}: ${error.message}`);
    return (data ?? []) as unknown as Record<string, unknown>[];
  };
}

if (import.meta.main) {
  const SECRET = Deno.env.get("LGPD_MANIFEST_SECRET") ?? "";
  const iVerify = Deno.args.indexOf("--verify");
  if (SECRET.length < 16) { console.error("LGPD_MANIFEST_SECRET ausente ou curto (mínimo 16 caracteres)"); Deno.exit(2); }
  if (iVerify >= 0) {
    const arq = Deno.args[iVerify + 1];
    if (!arq) { console.error("uso: --verify <manifesto.json>"); Deno.exit(2); }
    let m: Manifesto;
    try { m = JSON.parse(await Deno.readTextFile(arq)); } catch { console.error(`não consegui ler/parsear ${arq}`); Deno.exit(2); }
    const ok = await verificarManifesto(m, SECRET);
    console.log(ok ? `✔ assinatura válida (${m.tables.length} tabelas, gerado em ${m.generated_at})` : "✖ assinatura INVÁLIDA — manifesto alterado ou segredo diferente");
    Deno.exit(ok ? 0 : 1);
  }
  const DEST_URL = Deno.env.get("DEST_SUPABASE_URL");
  const DEST_KEY = Deno.env.get("DEST_SERVICE_ROLE_KEY");
  if (!DEST_URL || !DEST_KEY) { console.error("faltando DEST_SUPABASE_URL/DEST_SERVICE_ROLE_KEY/LGPD_MANIFEST_SECRET"); Deno.exit(2); }
  const sb = createClient(DEST_URL, DEST_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    const agora = new Date();
    const manifesto = await montarManifesto(leitorSupabase(sb), DEST_URL, SECRET, agora);
    let dir = Deno.env.get("LGPD_OUT_DIR") || new URL("./", import.meta.url).pathname;
    while (dir.length > 1 && dir.endsWith("/")) dir = dir.slice(0, -1);
    const path = `${dir}/lgpd-manifest-${agora.getTime()}.json`;
    await Deno.writeTextFile(path, JSON.stringify(manifesto, null, 2), { mode: 0o600, createNew: true });
    console.log(`\n✔ Manifesto: ${path}`);
    console.log(`  aggregate_hash=${manifesto.aggregate_hash}`);
    console.log(`  signature=${manifesto.signature!.slice(0, 32)}…`);
  } catch (e) {
    console.error(`✖ ${e instanceof Error ? e.message : String(e)} — manifesto NÃO gerado`);
    Deno.exit(1);
  }
}
