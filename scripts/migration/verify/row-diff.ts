// Amostra N linhas por tabela e compara hash md5 origem×destino.
// Uso: deno run --allow-env --allow-net --allow-read --allow-write verify/row-diff.ts
// Requer .env com SRC_DB_URL e DEST_DB_URL (Postgres URIs com service_role).
// Estratégia: usa pg_read via REST não é viável para hash; então fazemos via SELECT md5(cast(t.* as text))
// através de RPC (execute_sql) — no destino existente OU via psql wrapper.
// Este script gera SQL para rodar em AMBOS os bancos e diffa via arquivos JSON.

const SAMPLE = parseInt(Deno.env.get("SAMPLE_SIZE") ?? "200", 10);
const ONLY_TABLE = Deno.env.get("ONLY_TABLE") ?? "";
const orderFile = new URL("../table-order.sql", import.meta.url);
const orderSql = await Deno.readTextFile(orderFile);
const tables = [...orderSql.matchAll(/-- table:\s*public\.([a-z0-9_]+)/gi)].map((m) => m[1]);
const target = ONLY_TABLE ? tables.filter((t) => t === ONLY_TABLE) : tables;

const outDir = new URL("./row-diff-out/", import.meta.url);
await Deno.mkdir(outDir, { recursive: true });

// Gera um único SQL que produz JSON {table: [{pk, hash}]} para consumo posterior.
const sqlLines: string[] = [
  "-- gerado por row-diff.ts — rode em ORIGEM e DESTINO, salve como src.json / dest.json",
  "\\pset format unaligned",
  "\\pset tuples_only on",
  "SELECT json_object_agg(t, samples) FROM (",
];
const parts: string[] = [];
for (const t of target) {
  // Detecta PK genérica: usa id se existir, senão ctid
  parts.push(`
    SELECT '${t}' AS t, COALESCE(json_agg(json_build_object('pk', pk, 'h', h) ORDER BY pk), '[]'::json) AS samples
    FROM (
      SELECT id::text AS pk, md5(row_to_json(x)::text) AS h
      FROM public.${t} x
      WHERE id IS NOT NULL
      ORDER BY id
      LIMIT ${SAMPLE}
    ) s`);
}
sqlLines.push(parts.join("\n    UNION ALL\n"));
sqlLines.push(") q;");
const sqlPath = new URL("./row-diff.sql", import.meta.url);
await Deno.writeTextFile(sqlPath, sqlLines.join("\n"));

console.log(`✔ SQL gerado: ${sqlPath.pathname}`);
console.log(`Rode em ORIGEM: psql "$SRC_DB_URL" -f row-diff.sql > row-diff-out/src.json`);
console.log(`Rode em DESTINO: psql "$DEST_DB_URL" -f row-diff.sql > row-diff-out/dest.json`);
console.log(`Depois: deno run --allow-read verify/row-diff.ts --compare`);

if (Deno.args.includes("--compare")) {
  const src = JSON.parse(await Deno.readTextFile(new URL("./row-diff-out/src.json", import.meta.url)));
  const dst = JSON.parse(await Deno.readTextFile(new URL("./row-diff-out/dest.json", import.meta.url)));
  const report: Record<string, { ok: number; missing: number; mismatch: number }> = {};
  let hardFail = false;
  for (const t of Object.keys(src)) {
    const dmap = new Map<string, string>((dst[t] ?? []).map((r: { pk: string; h: string }) => [r.pk, r.h]));
    let ok = 0, miss = 0, bad = 0;
    for (const r of src[t]) {
      const h = dmap.get(r.pk);
      if (!h) miss++;
      else if (h !== r.h) bad++;
      else ok++;
    }
    report[t] = { ok, missing: miss, mismatch: bad };
    const marker = miss + bad === 0 ? "✔" : "✖";
    console.log(`${marker} ${t}: ok=${ok} missing=${miss} mismatch=${bad}`);
    if (miss + bad > 0) hardFail = true;
  }
  await Deno.writeTextFile(new URL("./row-diff-out/report.json", import.meta.url), JSON.stringify(report, null, 2));
  if (hardFail) { console.error("\n✖ Divergências detectadas."); Deno.exit(1); }
  console.log("\n✔ Amostragem íntegra em todas as tabelas.");
}
