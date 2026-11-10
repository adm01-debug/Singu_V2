// rls-parity.ts — Compara RLS entre origem e destino: policies (nome, comando,
// PERMISSIVE/RESTRICTIVE, roles, USING, WITH CHECK) e, por tabela, se RLS está
// habilitado/forçado. Somente leitura.
// Uso: deno run --allow-env --allow-net verify/rls-parity.ts
// Envs: SRC_DB_URL, DEST_DB_URL (obrigatórias); RLS_ALLOW_EXTRA=1 tolera policy a mais no destino.
// Saída: 0 paridade · 1 divergência ou falha de conexão · 2 configuração.
import postgres from "npm:postgres@3.4.4";

export interface Policy {
  schemaname: string; tablename: string; policyname: string; cmd: string; permissive: string;
  roles: string[]; qual: string | null; with_check: string | null;
}
export interface TabelaRls { schemaname: string; tablename: string; rls: boolean; force: boolean }
export interface Estado { policies: Policy[]; tabelas: TabelaRls[] }
export interface Diff { missing: string[]; extra: string[]; changed: string[]; rls: string[] }

const SISTEMA = ["pg_catalog", "information_schema", "pg_toast"];

/** Lê policies e flags de RLS. A URL (com senha) nunca é impressa. */
export async function fetchEstado(url: string): Promise<Estado> {
  const sql = postgres(url, { max: 1, connect_timeout: 15, onnotice: () => {} });
  try {
    const policies = await sql<Policy[]>`
      SELECT schemaname, tablename, policyname, cmd, permissive,
             roles::text[] AS roles, qual, with_check
      FROM pg_policies
      WHERE schemaname <> ALL (${SISTEMA})
      ORDER BY schemaname, tablename, policyname
    `;
    const tabelas = await sql<TabelaRls[]>`
      SELECT n.nspname AS schemaname, c.relname AS tablename,
             c.relrowsecurity AS rls, c.relforcerowsecurity AS force
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relkind IN ('r','p') AND n.nspname <> ALL (${SISTEMA})
        AND (c.relrowsecurity OR EXISTS (SELECT 1 FROM pg_policy p WHERE p.polrelid = c.oid))
      ORDER BY 1, 2
    `;
    return { policies: [...policies], tabelas: [...tabelas] };
  } finally { await sql.end({ timeout: 5 }); }
}

export const key = (p: Policy) => `${p.schemaname}.${p.tablename}::${p.policyname}`;
export const canonical = (p: Policy) => JSON.stringify({
  cmd: p.cmd, permissive: p.permissive, roles: [...p.roles].sort(),
  qual: (p.qual || "").replace(/\s+/g, " ").trim(),
  with_check: (p.with_check || "").replace(/\s+/g, " ").trim(),
});

/** Diferença entre os dois estados. Função pura. */
export function comparar(src: Estado, dest: Estado): Diff {
  const srcMap = new Map(src.policies.map((p) => [key(p), p]));
  const destMap = new Map(dest.policies.map((p) => [key(p), p]));
  const d: Diff = { missing: [], extra: [], changed: [], rls: [] };
  for (const [k, p] of srcMap) {
    const o = destMap.get(k);
    if (!o) d.missing.push(k);
    else if (canonical(p) !== canonical(o)) d.changed.push(k);
  }
  for (const k of destMap.keys()) if (!srcMap.has(k)) d.extra.push(k);
  const nome = (t: TabelaRls) => `${t.schemaname}.${t.tablename}`;
  const destTab = new Map(dest.tabelas.map((t) => [nome(t), t]));
  for (const t of src.tabelas) {
    const o = destTab.get(nome(t));
    const rlsDest = o?.rls ?? false, forceDest = o?.force ?? false;
    if (t.rls !== rlsDest) d.rls.push(`${nome(t)} (RLS origem=${t.rls ? "on" : "off"} destino=${rlsDest ? "on" : "off"})`);
    else if (t.force !== forceDest) d.rls.push(`${nome(t)} (FORCE origem=${t.force ? "on" : "off"} destino=${forceDest ? "on" : "off"})`);
  }
  const srcTab = new Set(src.tabelas.map(nome));
  for (const t of dest.tabelas) if (!srcTab.has(nome(t)) && !t.rls) d.rls.push(`${nome(t)} (destino tem policy mas RLS off)`);
  return d;
}

export function paridadeOk(d: Diff, tolerarExtra: boolean): boolean {
  return d.missing.length === 0 && d.changed.length === 0 && d.rls.length === 0 && (tolerarExtra || d.extra.length === 0);
}

if (import.meta.main) {
  const SRC = Deno.env.get("SRC_DB_URL");
  const DEST = Deno.env.get("DEST_DB_URL");
  if (!SRC || !DEST) { console.error("SRC_DB_URL e DEST_DB_URL obrigatórios."); Deno.exit(2); }
  const tolerarExtra = Deno.env.get("RLS_ALLOW_EXTRA") === "1";
  let src: Estado, dest: Estado;
  try {
    [src, dest] = await Promise.all([fetchEstado(SRC), fetchEstado(DEST)]);
  } catch (e) {
    // Mensagem do driver não inclui a senha; por garantia mostramos só o código/descrição curta.
    const err = e as { code?: string; message?: string };
    console.error(`✖ Falha ao ler policies: ${err.code ?? ""} ${(err.message ?? String(e)).replace(/:\/\/[^@\s]*@/g, "://…@")}`);
    Deno.exit(1);
  }
  const d = comparar(src, dest);
  console.log(`\nTotal: origem=${src.policies.length} destino=${dest.policies.length}`);
  console.log(`Ausentes no destino: ${d.missing.length}`); d.missing.forEach((k) => console.log(`   - ${k}`));
  console.log(`Extras no destino: ${d.extra.length}${tolerarExtra ? " (tolerado: RLS_ALLOW_EXTRA=1)" : ""}`); d.extra.forEach((k) => console.log(`   + ${k}`));
  console.log(`Alteradas: ${d.changed.length}`); d.changed.forEach((k) => console.log(`   ~ ${k}`));
  console.log(`RLS habilitado/forçado divergente: ${d.rls.length}`); d.rls.forEach((k) => console.log(`   ! ${k}`));
  if (src.policies.length === 0) console.log("⚠ origem sem nenhuma policy — confira SRC_DB_URL");
  const ok = paridadeOk(d, tolerarExtra) && src.policies.length > 0;
  console.log(ok ? "\nRLS parity OK" : "\nRLS parity FALHOU");
  Deno.exit(ok ? 0 : 1);
}
