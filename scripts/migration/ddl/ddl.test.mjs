// ddl.test.mjs — prova que scripts/migration/ddl aplica num Postgres 16 limpo.
// Rodar: PGHOST=127.0.0.1 PGPORT=55432 PGUSER=postgres node --test scripts/migration/ddl/ddl.test.mjs
// Sem PGHOST (ou sem psql) os testes que precisam de banco são PULADOS (o CI não quebra).
//
// Os arquivos 00–12 são DUMP gerado do banco de origem (ver cabeçalhos) e não são editados
// à mão. O dump atual tem defeitos de geração que impedem a aplicação limpa; eles estão
// listados em DEFEITOS_DO_DUMP com a correção mínima de cada um. O teste garante que
// (1) aplicado como está, os ÚNICOS erros são esses; (2) com essas correções aplicadas numa
// cópia temporária, `psql -v ON_ERROR_STOP=1 -f 99_apply_all.sql` passa do zero.
// Quando o dump for regenerado sem os defeitos, o teste (1) falha de propósito: apague a
// entrada correspondente daqui.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const STUBS = join(AQUI, "tests", "supabase-stubs.sql");
const RLS_COVERAGE = join(AQUI, "..", "verify", "rls-coverage.sql");
const ORDEM = ["00_extensions", "01_schemas_and_enums", "02_tables", "11_partitions", "10_views", "08_functions",
  "03_indexes", "04_foreign_keys", "05_grants", "06_rls_enable", "07_policies", "09_triggers"];

/** Defeitos do dump (gerador não emite coluna GENERATED nem distingue view em COMMENT). */
const DEFEITOS_DO_DUMP = [
  { arquivo: "02_tables.sql", erro: /cannot use column reference in DEFAULT expression/, vezes: 2,
    motivo: "rfm_analysis.rfm_score/total_score e system_alerts.is_simulated são GENERATED ALWAYS AS (…) STORED na origem; o dump emitiu DEFAULT (…)" },
  { arquivo: "02_tables.sql", erro: /relation "public\.v_entities" does not exist/, vezes: 1,
    motivo: "COMMENT ON TABLE de uma VIEW dentro de 02 (deveria ser COMMENT ON VIEW depois de 10_views)" },
];
const TABELAS_PERDIDAS = ["rfm_analysis", "system_alerts"]; // não são criadas por causa do 1º defeito → erros em cascata

/** Correção mínima de cada defeito, aplicada só na cópia temporária. */
function corrigirCopia(dir) {
  const p = join(dir, "02_tables.sql");
  let s = readFileSync(p, "utf8");
  let n = 0;
  s = s.replace(/^( {2}(?:rfm_score|total_score) integer| {2}is_simulated boolean) DEFAULT (.+?),$/gm, (_m, col, expr) => { n++; return `${col} GENERATED ALWAYS AS (${expr}) STORED,`; });
  assert.equal(n, 3, "esperava 3 colunas geradas emitidas como DEFAULT");
  const comentario = s.split("\n").find((l) => l.startsWith("COMMENT ON TABLE public.v_entities"));
  assert.ok(comentario, "linha COMMENT ON TABLE public.v_entities não encontrada");
  writeFileSync(p, s.replace(`${comentario}\n`, ""));
  writeFileSync(join(dir, "10_views.sql"), `${readFileSync(join(dir, "10_views.sql"), "utf8")}\n${comentario.replace("ON TABLE", "ON VIEW")}\n`);
}

const PG = { host: process.env.PGHOST, port: process.env.PGPORT ?? "5432", user: process.env.PGUSER ?? "postgres" };
const temPsql = spawnSync("psql", ["--version"]).status === 0;
const pular = !PG.host ? "PGHOST não definido — teste de Postgres pulado" : !temPsql ? "psql não encontrado" : false;
function psql(db, args, opts = {}) {
  const r = spawnSync("psql", ["-X", "-q", "-h", PG.host, "-p", PG.port, "-U", PG.user, "-d", db, ...args], { encoding: "utf8", maxBuffer: 64 << 20, ...opts });
  return { code: r.status, out: r.stdout ?? "", err: r.stderr ?? "" };
}
function sql(db, texto) {
  const r = psql(db, ["-v", "ON_ERROR_STOP=1", "-At", "-c", texto]);
  assert.equal(r.code, 0, r.err);
  return r.out.trim();
}
function bancoLimpo(nome) {
  assert.match(nome, /^g7_[a-z0-9_]+$/);
  sql("postgres", `DROP DATABASE IF EXISTS ${nome} WITH (FORCE)`);
  sql("postgres", `CREATE DATABASE ${nome}`);
  const r = psql(nome, ["-v", "ON_ERROR_STOP=1", "-f", STUBS]);
  assert.equal(r.code, 0, r.err);
}
/** Copia o DDL e desliga só os CREATE EXTENSION de extensões que este Postgres não tem (pg_cron, pg_net, supabase_vault…). */
function copiaDoDdl(db) {
  const dir = mkdtempSync(join(tmpdir(), "g7-ddl-"));
  for (const f of readdirSync(AQUI)) if (f.endsWith(".sql")) cpSync(join(AQUI, f), join(dir, f));
  const disponiveis = new Set(sql(db, "SELECT name FROM pg_available_extensions").split("\n"));
  const ext = join(dir, "00_extensions.sql");
  const desligadas = [];
  writeFileSync(ext, readFileSync(ext, "utf8").replace(/^CREATE EXTENSION IF NOT EXISTS "?([\w-]+)"?.*$/gm, (linha, nome) => {
    if (disponiveis.has(nome)) return linha;
    desligadas.push(nome);
    return `-- [teste] extensão indisponível neste Postgres, coberta por tests/supabase-stubs.sql: ${nome}`;
  }));
  return { dir, desligadas };
}
const erros = (stderr) => [...stderr.matchAll(/^psql:.*?([\w.]+\.sql):(\d+): ERROR:\s+(.*)$/gm)].map((m) => ({ arquivo: m[1], linha: Number(m[2]), msg: m[3] }));
const contar = (db, consulta) => Number(sql(db, consulta));

test("99_apply_all.sql: inclui 00–11 uma vez cada, na ordem que respeita as dependências, com \\ir; 12 fica de fora", () => {
  const s = readFileSync(join(AQUI, "99_apply_all.sql"), "utf8");
  const incluidos = [...s.matchAll(/^\\ir (\S+)\.sql$/gm)].map((m) => m[1]);
  assert.deepEqual(incluidos, ORDEM);
  assert.ok(!/^\\i /m.test(s), "\\i é relativo ao diretório atual: psql -f de outro lugar não acharia os arquivos");
  const pos = (n) => incluidos.indexOf(n);
  assert.ok(pos("10_views") < pos("08_functions"), "função retorna SETOF de view");
  assert.ok(pos("08_functions") < pos("03_indexes"), "índices usam public.immutable_unaccent()");
  assert.ok(pos("08_functions") < pos("07_policies") && pos("06_rls_enable") < pos("07_policies"));
  assert.ok(pos("02_tables") < pos("11_partitions") && pos("11_partitions") < pos("03_indexes"));
  assert.match(s, /SET check_function_bodies = off;\n\\ir 08_functions\.sql\nRESET check_function_bodies;/);
  assert.match(s, /NÃO É IDEMPOTENTE/);
  const noDisco = readdirSync(AQUI).filter((f) => /^\d\d_.*\.sql$/.test(f) && !f.startsWith("99") && !f.startsWith("12")).map((f) => f.replace(".sql", "")).sort();
  assert.deepEqual([...incluidos].sort(), noDisco, "todo arquivo NN_*.sql (menos 12 e 99) precisa estar no apply_all");
});

test("dependências que justificam a ordem existem de fato no dump", () => {
  const ler = (f) => readFileSync(join(AQUI, f), "utf8");
  assert.match(ler("03_indexes.sql"), /immutable_unaccent\(/);
  assert.match(ler("08_functions.sql"), /RETURNS SETOF vw_contacts_nlp/);
  assert.match(ler("10_views.sql"), /CREATE OR REPLACE VIEW public\.vw_contacts_nlp/);
  assert.ok(!/\bpublic\.[a-z_]+\(/.test(ler("10_views.sql")), "views não podem depender de função de public (são criadas antes delas)");
});

test("fixture supabase-stubs.sql é idempotente", { skip: pular }, () => {
  bancoLimpo("g7_ddl_stubs");
  try {
    const r = psql("g7_ddl_stubs", ["-v", "ON_ERROR_STOP=1", "-f", STUBS]);
    assert.equal(r.code, 0, r.err);
    assert.equal(sql("g7_ddl_stubs", "SET request.jwt.claims = '{\"sub\":\"00000000-0000-0000-0000-000000000001\",\"role\":\"authenticated\"}'; SELECT auth.uid() || '|' || auth.role()"), "00000000-0000-0000-0000-000000000001|authenticated");
  } finally { sql("postgres", "DROP DATABASE IF EXISTS g7_ddl_stubs WITH (FORCE)"); }
});

test("dump COMO ESTÁ: os únicos erros são os defeitos conhecidos do gerador e suas cascatas", { skip: pular }, () => {
  const db = "g7_ddl_asis";
  bancoLimpo(db);
  const { dir } = copiaDoDdl(db);
  try {
    const r = psql(db, ["-f", join(dir, "99_apply_all.sql")], { cwd: "/" }); // sem ON_ERROR_STOP: coleta TODOS os erros
    const todos = erros(r.err);
    const cascata = new RegExp(`relation "(public\\.)?(${TABELAS_PERDIDAS.join("|")})" does not exist`);
    const raizes = todos.filter((e) => !cascata.test(e.msg));
    const inesperados = raizes.filter((e) => !DEFEITOS_DO_DUMP.some((d) => d.arquivo === e.arquivo && d.erro.test(e.msg)));
    assert.deepEqual(inesperados, [], "erro NOVO na aplicação do DDL (não é defeito conhecido do dump)");
    for (const d of DEFEITOS_DO_DUMP) {
      const n = raizes.filter((e) => e.arquivo === d.arquivo && d.erro.test(e.msg)).length;
      assert.equal(n, d.vezes, `defeito conhecido mudou (${d.motivo}) — se o dump foi regenerado e corrigido, remova a entrada de DEFEITOS_DO_DUMP`);
    }
    assert.equal(todos.length - raizes.length, 22, "cascatas das 2 tabelas não criadas");
    assert.equal(psql(db, ["-v", "ON_ERROR_STOP=1", "-f", join(dir, "99_apply_all.sql")]).code, 3, "com ON_ERROR_STOP o dump atual para no 1º defeito");
  } finally { rmSync(dir, { recursive: true, force: true }); sql("postgres", `DROP DATABASE IF EXISTS ${db} WITH (FORCE)`); }
});

test("com as correções mínimas dos defeitos: ON_ERROR_STOP=1 aplica do zero, de qualquer diretório, com RLS+policy em 100% de public", { skip: pular }, () => {
  const db = "g7_ddl_ok";
  bancoLimpo(db);
  const { dir, desligadas } = copiaDoDdl(db);
  try {
    corrigirCopia(dir);
    const r = psql(db, ["-v", "ON_ERROR_STOP=1", "-f", join(dir, "99_apply_all.sql")], { cwd: "/" });
    assert.equal(r.code, 0, erros(r.err).map((e) => `${e.arquivo}:${e.linha} ${e.msg}`).join("\n") || r.err.slice(-2000));
    assert.deepEqual(erros(r.err), []);
    for (const e of desligadas) assert.ok(["pg_cron", "pg_net", "supabase_vault"].includes(e), `extensão inesperada indisponível: ${e}`);
    const pub = "JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public'";
    assert.equal(contar(db, `SELECT count(*) FROM pg_class c ${pub} AND c.relkind IN ('r','p') AND NOT c.relispartition`), 258);
    assert.equal(contar(db, `SELECT count(*) FROM pg_class c ${pub} AND c.relkind = 'r' AND c.relispartition`), 7);
    assert.equal(contar(db, "SELECT count(*) FROM pg_policies WHERE schemaname = 'public'"), 725);
    assert.equal(contar(db, "SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace LEFT JOIN pg_depend d ON d.objid = p.oid AND d.deptype = 'e' WHERE n.nspname = 'public' AND d.objid IS NULL"), 118);
    assert.equal(contar(db, `SELECT count(*) FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid ${pub} AND NOT t.tgisinternal`), 202);
    assert.equal(contar(db, `SELECT count(*) FROM pg_class c ${pub} AND c.relkind IN ('v','m')`), 12);
    assert.equal(contar(db, "SELECT count(*) FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace WHERE n.nspname = 'public' AND c.contype = 'f'"), 259);
    assert.equal(sql(db, "SELECT attgenerated FROM pg_attribute WHERE attrelid = 'public.rfm_analysis'::regclass AND attname = 'rfm_score'"), "s");
    // guard do CI: passa no resultado e FALHA quando existe tabela sem RLS
    let g = psql(db, ["-v", "ON_ERROR_STOP=1", "-f", RLS_COVERAGE]);
    assert.equal(g.code, 0, g.err);
    sql(db, "CREATE TABLE public.g7_sem_rls (id int)");
    g = psql(db, ["-v", "ON_ERROR_STOP=1", "-f", RLS_COVERAGE]);
    assert.notEqual(g.code, 0); assert.match(g.err, /RLS COVERAGE FAILED: 1 tabela/);
    sql(db, "DROP TABLE public.g7_sem_rls");
    // lacunas de FIDELIDADE do dump (não quebram a aplicação, mas mudam o comportamento no destino)
    assert.deepEqual(sql(db, "SELECT c.relname FROM pg_index i JOIN pg_class c ON c.oid = i.indexrelid WHERE NOT i.indisvalid ORDER BY 1").split("\n"),
      ["idx_audit_log_entity", "idx_audit_log_user"], "índices do pai particionado ficam INVALID: o dump não traz ALTER INDEX … ATTACH PARTITION");
    assert.equal(contar(db, "SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.prosecdef AND has_function_privilege('anon', p.oid, 'EXECUTE')"), 91,
      "o dump não traz GRANT/REVOKE de função: toda SECURITY DEFINER fica executável por anon no destino");
    // não é idempotente por desenho (dump para projeto novo e vazio)
    const de_novo = psql(db, ["-v", "ON_ERROR_STOP=1", "-f", join(dir, "99_apply_all.sql")]);
    assert.equal(de_novo.code, 3); assert.match(de_novo.err, /type "app_role" already exists/);
  } finally { rmSync(dir, { recursive: true, force: true }); sql("postgres", `DROP DATABASE IF EXISTS ${db} WITH (FORCE)`); }
});
