// Deep row hash sampling — início + fim + amostra DETERMINÍSTICA de ~SAMPLE_PCT% das linhas
// (mesmas linhas nos dois bancos), SHA-256 nativo do Postgres + relatório HTML.
// Passo 1: deno run --allow-env --allow-read --allow-write verify/row-diff-deep.ts
// Passo 2: psql -X -v ON_ERROR_STOP=1 "$SRC_DB_URL"  -f verify/row-diff-deep.sql > verify/row-diff-deep-out/src.json
//          psql -X -v ON_ERROR_STOP=1 "$DEST_DB_URL" -f verify/row-diff-deep.sql > verify/row-diff-deep-out/dest.json
// Passo 3: deno run --allow-env --allow-read --allow-write verify/row-diff-deep.ts --compare
// Envs: SAMPLE_PCT (1), HEAD_N (100), TAIL_N (100) + as de row-diff.ts (ONLY_TABLE, TABLES_DDL, ROW_DIFF_BASE…).
// Saída: 0 íntegro · 1 divergência · 2 configuração/entrada inválida.
import { caminhos, carregarTabelas, comparar, ErroEntrada, gerarSql, inteiro, lerAmostras, linhaResumo, sair, tabelaOk, type ResultadoTabela } from "./row-diff.ts";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export function relatorioHtml(rel: Record<string, ResultadoTabela>, geradoEm: string): string {
  const linhas = Object.entries(rel).map(([t, r]) =>
    `<tr class="${tabelaOk(r) ? "ok" : "bad"}"><td>${esc(t)}</td><td>${r.ok}</td><td>${r.missing}</td><td>${r.mismatch}</td><td>${r.extra}</td><td>${r.count_src ?? ""}</td><td>${r.count_dst ?? ""}</td><td>${esc(r.falha ?? "")}</td></tr>`);
  return `<!doctype html><meta charset=utf-8><title>row-diff-deep</title>
<style>body{font:14px system-ui;margin:2rem}table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:.4rem .8rem}.bad{background:#fee}.ok{background:#efe}</style>
<h1>Row Diff Deep — ${esc(geradoEm)}</h1>
<table><tr><th>tabela</th><th>ok</th><th>missing</th><th>mismatch</th><th>extra</th><th>linhas origem</th><th>linhas destino</th><th>falha</th></tr>${linhas.join("")}</table>`;
}

if (import.meta.main) {
  try {
    const c = caminhos();
    const outDir = new URL("./row-diff-deep-out/", c.base);
    if (Deno.args.includes("--compare")) {
      const [src, dst] = await lerAmostras(outDir);
      const rel = comparar(src, dst);
      const fail = Object.values(rel).filter((r) => !tabelaOk(r)).length;
      for (const [t, r] of Object.entries(rel)) {
        if (!tabelaOk(r)) console.log(`✖ ${linhaResumo(t, r)}`);
      }
      const destino = new URL("./report.html", outDir);
      await Deno.writeTextFile(destino, relatorioHtml(rel, new Date().toISOString()));
      console.log(`Relatório: ${destino.pathname} — ${fail} de ${Object.keys(rel).length} tabelas com divergência`);
      if (fail > 0) Deno.exit(1);
    } else {
      const pct = Number(Deno.env.get("SAMPLE_PCT") ?? "1");
      if (!Number.isFinite(pct) || pct < 0 || pct > 100) throw new ErroEntrada("SAMPLE_PCT inválido: esperado número entre 0 e 100");
      const tabelas = await carregarTabelas(c);
      await Deno.mkdir(outDir, { recursive: true });
      const sqlPath = new URL("./row-diff-deep.sql", c.base);
      await Deno.writeTextFile(sqlPath, gerarSql(tabelas, { modo: "profundo", head: inteiro("HEAD_N", 100, 0), tail: inteiro("TAIL_N", 100, 0), pct }));
      console.log(`✔ SQL: ${sqlPath.pathname} (${tabelas.length} tabelas; rode em ORIGEM e DESTINO → ${outDir.pathname}src.json / dest.json)`);
    }
  } catch (e) {
    sair(e);
  }
}
