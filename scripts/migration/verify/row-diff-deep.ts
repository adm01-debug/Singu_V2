// Deep row hash sampling — head/tail/random 1% + SHA-256 + relatório HTML.
const SAMPLE_PCT = Number(Deno.env.get("SAMPLE_PCT") ?? "1");
const HEAD = Number(Deno.env.get("HEAD_N") ?? "100");
const TAIL = Number(Deno.env.get("TAIL_N") ?? "100");
const orderSql = await Deno.readTextFile(new URL("../table-order.sql", import.meta.url));
const tables = [...orderSql.matchAll(/-- table:\s*public\.([a-z0-9_]+)/gi)].map((m) => m[1]);
await Deno.mkdir(new URL("./row-diff-deep-out/", import.meta.url), { recursive: true });

const parts = tables.map((t) => `
  SELECT '${t}' AS t, COALESCE(json_agg(json_build_object('pk', pk, 'h', h)), '[]'::json) AS samples FROM (
    (SELECT id::text AS pk, encode(digest(row_to_json(x)::text, 'sha256'), 'hex') AS h
       FROM public.${t} x WHERE id IS NOT NULL ORDER BY id ASC  LIMIT ${HEAD})
    UNION ALL
    (SELECT id::text, encode(digest(row_to_json(x)::text,'sha256'),'hex')
       FROM public.${t} x WHERE id IS NOT NULL ORDER BY id DESC LIMIT ${TAIL})
    UNION ALL
    (SELECT id::text, encode(digest(row_to_json(x)::text,'sha256'),'hex')
       FROM public.${t} TABLESAMPLE BERNOULLI(${SAMPLE_PCT}) x WHERE id IS NOT NULL)
  ) s`);
const sql = `\\pset format unaligned\n\\pset tuples_only on\nSELECT json_object_agg(t, samples) FROM (\n${parts.join("\n  UNION ALL\n")}\n) q;\n`;
await Deno.writeTextFile(new URL("./row-diff-deep.sql", import.meta.url), sql);
console.log("✔ SQL: verify/row-diff-deep.sql (rode em ORIGEM e DESTINO → src.json/dest.json)");

if (Deno.args.includes("--compare")) {
  const src = JSON.parse(await Deno.readTextFile(new URL("./row-diff-deep-out/src.json", import.meta.url)));
  const dst = JSON.parse(await Deno.readTextFile(new URL("./row-diff-deep-out/dest.json", import.meta.url)));
  const rows: string[] = []; let fail = 0;
  for (const t of Object.keys(src)) {
    const dmap = new Map<string, string>((dst[t] ?? []).map((r: { pk: string; h: string }) => [r.pk, r.h]));
    let ok = 0, miss = 0, bad = 0;
    for (const r of src[t]) { const h = dmap.get(r.pk); if (!h) miss++; else if (h !== r.h) bad++; else ok++; }
    if (miss + bad > 0) fail++;
    rows.push(`<tr class="${miss + bad ? "bad" : "ok"}"><td>${t}</td><td>${ok}</td><td>${miss}</td><td>${bad}</td></tr>`);
  }
  const html = `<!doctype html><meta charset=utf-8><title>row-diff-deep</title>
<style>body{font:14px system-ui;margin:2rem}table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:.4rem .8rem}.bad{background:#fee}.ok{background:#efe}</style>
<h1>Row Diff Deep — ${new Date().toISOString()}</h1>
<table><tr><th>tabela</th><th>ok</th><th>missing</th><th>mismatch</th></tr>${rows.join("")}</table>`;
  await Deno.writeTextFile(new URL("./row-diff-deep-out/report.html", import.meta.url), html);
  console.log(`Relatório: verify/row-diff-deep-out/report.html — ${fail} tabelas com divergência`);
  if (fail > 0) Deno.exit(1);
}