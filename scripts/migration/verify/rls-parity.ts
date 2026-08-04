// rls-parity.ts — Compara policies RLS entre origem e destino.
// Uso: deno run --allow-env --allow-net verify/rls-parity.ts
// Envs: SRC_DB_URL, DEST_DB_URL
import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";

interface Policy {
  schemaname: string; tablename: string; policyname: string; cmd: string;
  roles: string[]; qual: string | null; with_check: string | null;
}

async function fetchPolicies(url: string): Promise<Policy[]> {
  const sql = postgres(url, { max: 1 });
  try {
    return await sql<Policy[]>`
      SELECT schemaname, tablename, policyname, cmd,
             roles::text[] AS roles, qual, with_check
      FROM pg_policies
      WHERE schemaname NOT IN ('pg_catalog','information_schema')
      ORDER BY schemaname, tablename, policyname
    `;
  } finally { await sql.end(); }
}

const key = (p: Policy) => `${p.schemaname}.${p.tablename}::${p.policyname}`;
const canonical = (p: Policy) => JSON.stringify({
  cmd: p.cmd, roles: [...p.roles].sort(),
  qual: (p.qual || "").replace(/\s+/g, " ").trim(),
  with_check: (p.with_check || "").replace(/\s+/g, " ").trim(),
});

const SRC = Deno.env.get("SRC_DB_URL");
const DEST = Deno.env.get("DEST_DB_URL");
if (!SRC || !DEST) { console.error("SRC_DB_URL e DEST_DB_URL obrigatórios."); Deno.exit(2); }

const [src, dest] = await Promise.all([fetchPolicies(SRC), fetchPolicies(DEST)]);
const srcMap = new Map(src.map((p) => [key(p), p]));
const destMap = new Map(dest.map((p) => [key(p), p]));

const missing: string[] = [], extra: string[] = [], changed: string[] = [];
for (const [k, p] of srcMap) {
  const d = destMap.get(k);
  if (!d) missing.push(k);
  else if (canonical(p) !== canonical(d)) changed.push(k);
}
for (const k of destMap.keys()) if (!srcMap.has(k)) extra.push(k);

console.log(`\nTotal: origem=${src.length} destino=${dest.length}`);
console.log(`Ausentes no destino: ${missing.length}`); missing.forEach((k) => console.log(`   - ${k}`));
console.log(`Extras no destino: ${extra.length}`);      extra.forEach((k) => console.log(`   + ${k}`));
console.log(`Alteradas: ${changed.length}`);            changed.forEach((k) => console.log(`   ~ ${k}`));

const ok = missing.length === 0 && changed.length === 0;
console.log(ok ? "\nRLS parity OK" : "\nRLS parity FALHOU");
Deno.exit(ok ? 0 : 1);