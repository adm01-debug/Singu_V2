// Testes de verify/row-diff.ts e row-diff-deep.ts — parte pura sempre; ponta a ponta com Postgres se PGHOST definido.
import assert from "node:assert/strict";
import { rodar } from "../_mock_supabase.ts";
import { derrubar, motivoPulo, psql, recriar, sql, temPg } from "../_pg_teste.ts";
import { comparar, ErroEntrada, gerarSql, parseSaida, parseSkip, parseTabelas, selecionar, tabelaOk, type Amostra } from "./row-diff.ts";
import { relatorioHtml } from "./row-diff-deep.ts";

const DDL = `-- ─── public.clientes ───
CREATE TABLE public.clientes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  nome text,
  CONSTRAINT clientes_pkey PRIMARY KEY (id),
  CONSTRAINT clientes_chk CHECK ((nome <> ''::text))
);

CREATE TABLE public.feature_flags (
  name text NOT NULL,
  CONSTRAINT feature_flags_pkey PRIMARY KEY (name)
);
CREATE TABLE public."Tabela Esquisita" (
  a integer NOT NULL,
  "b c" text NOT NULL,
  CONSTRAINT te_pkey PRIMARY KEY (a, "b c")
);
CREATE TABLE public.sem_pk (
  v text
);
CREATE TABLE public.audit_log (
  id bigint NOT NULL,
  CONSTRAINT audit_log_pkey PRIMARY KEY (id)
) PARTITION BY RANGE (id);
`;

Deno.test("parseTabelas: PK simples, composta/entre aspas, sem PK, particionada", () => {
  assert.deepEqual(parseTabelas(DDL), [
    { nome: "clientes", pk: ["id"] }, { nome: "feature_flags", pk: ["name"] },
    { nome: "Tabela Esquisita", pk: ["a", "b c"] }, { nome: "sem_pk", pk: [] }, { nome: "audit_log", pk: ["id"] },
  ]);
});
Deno.test("o DDL real do repositório é lido: 258 tabelas, todas com PK", async () => {
  const t = parseTabelas(await Deno.readTextFile(new URL("../ddl/02_tables.sql", import.meta.url)));
  assert.equal(t.length, 258); assert.equal(t.filter((x) => x.pk.length === 0).length, 0);
  assert.deepEqual(t.find((x) => x.nome === "feature_flags")!.pk, ["name"]); // não é "id": o SQL antigo quebraria
});
Deno.test("parseSkip/selecionar: glob, comentário, ONLY_TABLE e lista vazia é ERRO (antes: 0 tabelas = 'íntegro')", () => {
  const skip = parseSkip("# c\naudit_log\naudit_log_2026_*  # partições\n\n");
  const tabs = parseTabelas(DDL);
  assert.ok(!selecionar(tabs, skip, "").some((t) => t.nome === "audit_log"));
  assert.ok(skip.some((r) => r.test("audit_log_2026_07")) && !skip.some((r) => r.test("audit_logx")));
  assert.deepEqual(selecionar(tabs, skip, "audit_log").map((t) => t.nome), ["audit_log"]);
  assert.throws(() => selecionar(tabs, skip, "nao_existe"), ErroEntrada);
  assert.throws(() => selecionar([], skip, ""), /nenhuma tabela/);
});
Deno.test("parseSaida: ignora ruído do psql, aceita formato antigo, JSON ausente/truncado é erro", () => {
  assert.deepEqual(parseSaida('SET\n{"t":{"n":1,"s":[{"pk":"1","h":"x"}]}}\n', "src"), { t: { n: 1, s: [{ pk: "1", h: "x" }] } });
  assert.deepEqual(parseSaida('{"t":[{"pk":"1","h":"x"}]}', "src").t, { n: null, s: [{ pk: "1", h: "x" }] });
  assert.throws(() => parseSaida("psql: error: connection refused\n", "src"), /nenhum JSON/);
  assert.throws(() => parseSaida('{"t":{"n":1,"s":[', "src"), /inválido/);
});
Deno.test("comparar: ok, faltando, divergente, sobrando, contagem diferente e tabela ausente", () => {
  const am = (n: number | null, ...ps: [string, string][]): Amostra => ({ n, s: ps.map(([pk, h]) => ({ pk, h })) });
  const r = comparar(
    { igual: am(2, ["1", "a"], ["2", "b"]), falta: am(2, ["1", "a"], ["2", "b"]), muda: am(1, ["1", "a"]), sobra: am(1, ["1", "a"]), conta: am(500, ["1", "a"]), so_origem: am(0) },
    { igual: am(2, ["1", "a"], ["2", "b"]), falta: am(1, ["1", "a"]), muda: am(1, ["1", "ZZ"]), sobra: am(2, ["1", "a"], ["9", "x"]), conta: am(499, ["1", "a"]), so_destino: am(0) },
  );
  assert.ok(tabelaOk(r.igual));
  assert.equal(r.falta.missing, 1); assert.equal(r.muda.mismatch, 1); assert.equal(r.sobra.extra, 1);
  assert.match(r.conta.falha!, /contagem difere/); assert.equal(r.conta.extra, 0);
  assert.match(r.so_origem.falha!, /ausente na saída do destino/); assert.match(r.so_destino.falha!, /ausente na saída da origem/);
  assert.equal(Object.values(r).filter(tabelaOk).length, 1);
});
Deno.test("gerarSql: somente leitura, UTC, identificadores entre aspas; modo profundo é determinístico (sem TABLESAMPLE)", () => {
  const s = gerarSql(parseTabelas(DDL), { modo: "amostra", amostra: 7 });
  assert.match(s, /READ ONLY/); assert.match(s, /SET LOCAL TimeZone = 'UTC'/); assert.match(s, /public\."Tabela Esquisita"/);
  assert.match(s, /jsonb_build_array\(x\."a", x\."b c"\)/); assert.match(s, /LIMIT 7/); assert.match(s, /\\set QUIET on/);
  const d = gerarSql(parseTabelas(DDL), { modo: "profundo", pct: 2.5 });
  assert.ok(!/TABLESAMPLE|digest\(/.test(d)); assert.match(d, /% 10000\) < 250/); assert.match(d, /sha256\(/);
});
Deno.test("relatorioHtml: escapa e marca linha ruim", () => {
  const h = relatorioHtml({ "<t>": { ok: 1, missing: 1, mismatch: 0, extra: 0, count_src: 2, count_dst: 1, falha: "a<b" } }, "agora");
  assert.match(h, /class="bad"><td>&lt;t&gt;/); assert.match(h, /a&lt;b/);
});

const ESQUEMA = `create table clientes(id uuid primary key, nome text, saldo numeric(12,2), criado timestamptz, extra jsonb, bruto json, foto bytea);
create table feature_flags(name text primary key, enabled boolean);
create table "Tabela Esquisita"(a int, "b c" text, v float8, primary key (a, "b c"));
create table sem_pk(v text);
create table audit_log(id bigint primary key);
insert into clientes select md5(g::text)::uuid, 'cliente ' || g, g * 1.10, '2026-01-01 12:00+00'::timestamptz + g * interval '1 hour', jsonb_build_object('b', g, 'a', null), '{"z":1, "a":2}', decode(md5(g::text), 'hex') from generate_series(1, 400) g;
insert into feature_flags values ('dual_write_enabled', true), ('x', false);
insert into "Tabela Esquisita" values (1, 'um', 0.1), (2, 'dois', 1e300);
insert into sem_pk values ('a'), ('a'), (null);`;

async function cicloCompleto(base: string, ddl: string, script: string, saida: string, A: string, B: string, env: Record<string, string> = {}) {
  const e = { ROW_DIFF_BASE: base, TABLES_DDL: ddl, ...env };
  const g = await rodar(new URL(script, import.meta.url).pathname, e);
  assert.equal(g.code, 0, g.err);
  const arq = `${base}/${script.replace("./", "").replace(".ts", ".sql")}`;
  for (const [db, nome] of [[A, "src.json"], [B, "dest.json"]]) {
    const r = await psql(db, ["-v", "ON_ERROR_STOP=1", "-f", arq]);
    assert.equal(r.code, 0, r.err);
    await Deno.writeTextFile(`${base}/${saida}/${nome}`, r.out);
  }
  return await rodar(new URL(script, import.meta.url).pathname, e, ["--compare"]);
}

Deno.test({ name: "Postgres ponta a ponta: iguais passam mesmo com fuso, ordem de colunas e formatação JSON diferentes; cada divergência real é pega", ignore: !temPg, async fn() {
  const [A, B] = ["g7_rd_src", "g7_rd_dst"];
  const base = await Deno.makeTempDir({ prefix: "g7-rd-" });
  const ddl = `${base}/tabelas.sql`;
  await Deno.writeTextFile(ddl, DDL);
  try {
    await recriar(A); await sql(A, ESQUEMA);
    // destino: mesmas linhas, mas colunas em outra ordem, fuso de sessão diferente e json com outra formatação
    await recriar(B);
    await sql(B, `alter database ${B} set timezone = 'America/Sao_Paulo';`);
    await sql(B, ESQUEMA.replace("id uuid primary key, nome text, saldo numeric(12,2), criado timestamptz, extra jsonb, bruto json, foto bytea", "foto bytea, bruto json, extra jsonb, criado timestamptz, saldo numeric(12,2), nome text, id uuid primary key")
      .replace("insert into clientes select", "insert into clientes (id, nome, saldo, criado, extra, bruto, foto) select").replace(`'{"z":1, "a":2}'`, `'{"a":2,"z":1}'`));
    for (const [script, saida] of [["./row-diff.ts", "row-diff-out"], ["./row-diff-deep.ts", "row-diff-deep-out"]]) {
      let r = await cicloCompleto(base, ddl, script, saida, A, B, { INCLUDE_SKIPPED: "1", SAMPLE_PCT: "30" });
      assert.equal(r.code, 0, `${script}: ${r.out}${r.err}`);
      const casos: [string, RegExp][] = [
        [`update clientes set nome = 'outro' where id = (select id from clientes order by id limit 1)`, /clientes: .*mismatch=1/],
        [`update clientes set extra = extra - 'a' where id = (select id from clientes order by id desc limit 1)`, /clientes: .*mismatch=1/], // NULL ≠ chave ausente
        [`update clientes set saldo = saldo + 0.01 where id = (select id from clientes order by id limit 1)`, /clientes: .*mismatch=1/],
        [`update clientes set criado = criado + interval '1 microsecond' where id = (select id from clientes order by id limit 1)`, /clientes: .*mismatch=1/],
        [`delete from clientes where id = (select id from clientes order by id limit 1)`, /clientes: .*missing=1.*contagem difere: origem=400 destino=399/],
        [`insert into feature_flags values ('nova', true)`, /feature_flags: .*extra=1.*contagem difere/],
        [`update "Tabela Esquisita" set v = 0.1000000001 where a = 1`, /Tabela Esquisita: .*mismatch=1/],
        [`delete from sem_pk where v is null`, /sem_pk: .*missing=1/],
        [`insert into sem_pk values ('a')`, /sem_pk: .*contagem difere/],
      ];
      for (const [mudanca, esperado] of casos) {
        await sql(B, `begin; ${mudanca}; commit;`);
        r = await cicloCompleto(base, ddl, script, saida, A, B, { INCLUDE_SKIPPED: "1", SAMPLE_PCT: "100", SAMPLE_SIZE: "1000" });
        assert.equal(r.code, 1, `${script} | ${mudanca}\n${r.out}`); assert.match(r.out, esperado, `${script} | ${mudanca}`);
        await recriar(B);
        await sql(B, ESQUEMA);
      }
    }
  } finally { await derrubar(A, B); await Deno.remove(base, { recursive: true }); }
} });

Deno.test({ name: "Postgres: row-diff-deep com amostra parcial dá o MESMO conjunto nos dois bancos (antes: TABLESAMPLE aleatório acusava 'missing' em bancos idênticos)", ignore: !temPg, async fn() {
  const [A, B] = ["g7_rdd_src", "g7_rdd_dst"];
  const base = await Deno.makeTempDir({ prefix: "g7-rdd-" });
  const ddl = `${base}/tabelas.sql`;
  await Deno.writeTextFile(ddl, DDL);
  try {
    await recriar(A); await sql(A, ESQUEMA); await recriar(B); await sql(B, ESQUEMA);
    for (let i = 0; i < 3; i++) {
      const r = await cicloCompleto(base, ddl, "./row-diff-deep.ts", "row-diff-deep-out", A, B, { INCLUDE_SKIPPED: "1", SAMPLE_PCT: "20", HEAD_N: "5", TAIL_N: "5" });
      assert.equal(r.code, 0, r.out + r.err);
    }
    const src = parseSaida(await Deno.readTextFile(`${base}/row-diff-deep-out/src.json`), "src");
    assert.ok(src.clientes.s.length > 10 && src.clientes.s.length < 200, `amostra=${src.clientes.s.length}`);
    assert.ok((await Deno.readTextFile(`${base}/row-diff-deep-out/report.html`)).includes("<td>clientes</td>"));
  } finally { await derrubar(A, B); await Deno.remove(base, { recursive: true }); }
} });

Deno.test("processo: --compare sem arquivos sai 2; DDL sem tabelas sai 2; SAMPLE_SIZE inválido sai 2; psql que falhou não vira 'íntegro'", async () => {
  const base = await Deno.makeTempDir({ prefix: "g7-rd-" });
  const script = new URL("./row-diff.ts", import.meta.url).pathname;
  try {
    await Deno.writeTextFile(`${base}/vazio.sql`, "-- nada\n");
    assert.equal((await rodar(script, { ROW_DIFF_BASE: base }, ["--compare"])).code, 2);
    const r = await rodar(script, { ROW_DIFF_BASE: base, TABLES_DDL: `${base}/vazio.sql` });
    assert.equal(r.code, 2); assert.match(r.err, /nenhuma tabela/);
    assert.equal((await rodar(script, { ROW_DIFF_BASE: base, SAMPLE_SIZE: "abc" })).code, 2);
    assert.equal((await rodar(script, { ROW_DIFF_BASE: base })).code, 0); // DDL real do repo
    await Deno.writeTextFile(`${base}/row-diff-out/src.json`, "psql: error: FATAL\n");
    await Deno.writeTextFile(`${base}/row-diff-out/dest.json`, "{}\n");
    assert.equal((await rodar(script, { ROW_DIFF_BASE: base }, ["--compare"])).code, 2);
    await Deno.writeTextFile(`${base}/row-diff-out/src.json`, "{}\n");
    const v = await rodar(script, { ROW_DIFF_BASE: base }, ["--compare"]);
    assert.equal(v.code, 2); assert.match(v.err, /nenhuma tabela/);
  } finally { await Deno.remove(base, { recursive: true }); }
});
if (!temPg) console.log(`row-diff: ${motivoPulo}`);
