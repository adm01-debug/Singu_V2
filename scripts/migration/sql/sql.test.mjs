// sql.test.mjs — testa sql/create-reset-log.sql, sql/mark-must-reset.sql e sql/heal-sequences.sql
// num Postgres 16 local com os stubs de ddl/tests/supabase-stubs.sql.
// Rodar: PGHOST=127.0.0.1 PGPORT=55432 PGUSER=postgres node --test scripts/migration/sql/sql.test.mjs
// Sem PGHOST (ou sem psql) tudo é PULADO com mensagem (o CI não quebra).
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const STUBS = join(AQUI, "..", "ddl", "tests", "supabase-stubs.sql");
const PG = { host: process.env.PGHOST, port: process.env.PGPORT ?? "5432", user: process.env.PGUSER ?? "postgres" };
const pular = !PG.host ? "PGHOST não definido — teste de Postgres pulado" : spawnSync("psql", ["--version"]).status !== 0 ? "psql não encontrado" : false;

function psql(db, args) {
  const r = spawnSync("psql", ["-X", "-q", "-h", PG.host, "-p", PG.port, "-U", PG.user, "-d", db, ...args], { encoding: "utf8", cwd: "/" });
  return { code: r.status, out: r.stdout ?? "", err: r.stderr ?? "" };
}
function sql(db, texto) {
  const r = psql(db, ["-v", "ON_ERROR_STOP=1", "-At", "-c", texto]);
  assert.equal(r.code, 0, `${texto}\n${r.err}`);
  return r.out.trim();
}
const arquivo = (db, nome, extra = []) => psql(db, ["-v", "ON_ERROR_STOP=1", ...extra, "-f", join(AQUI, nome)]);
function comBanco(nome, fn) {
  assert.match(nome, /^g7_[a-z0-9_]+$/);
  sql("postgres", `DROP DATABASE IF EXISTS ${nome} WITH (FORCE)`);
  sql("postgres", `CREATE DATABASE ${nome}`);
  try {
    assert.equal(psql(nome, ["-v", "ON_ERROR_STOP=1", "-f", STUBS]).code, 0);
    fn(nome);
  } finally { sql("postgres", `DROP DATABASE IF EXISTS ${nome} WITH (FORCE)`); }
}
const U = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const HAS_ROLE = `CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
CREATE TABLE public.user_roles (user_id uuid, role public.app_role);
CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;`;
const como = (papel, sub, consulta) => `SET ROLE ${papel}; SET request.jwt.claims = '{"sub":"${sub}","role":"${papel}"}'; ${consulta}`;

// ── create-reset-log.sql ────────────────────────────────────────────────────
test("create-reset-log: cria tudo, é idempotente (2ª e 3ª execução sem erro) e preserva os dados", { skip: pular }, () => comBanco("g7_sql_log", (db) => {
  sql(db, HAS_ROLE);
  assert.equal(arquivo(db, "create-reset-log.sql").code, 0);
  sql(db, `INSERT INTO public.migration_password_reset_log (user_id, email_hash, status) VALUES ('${U(1)}', 'h', 'sent')`);
  for (let i = 0; i < 2; i++) { const r = arquivo(db, "create-reset-log.sql"); assert.equal(r.code, 0, r.err); } // antes: "policy … already exists"
  assert.equal(sql(db, "SELECT count(*) FROM public.migration_password_reset_log"), "1");
  assert.equal(sql(db, "SELECT count(*) FROM pg_policies WHERE tablename = 'migration_password_reset_log'"), "1");
  assert.equal(sql(db, "SELECT count(*) FROM pg_trigger WHERE tgrelid = 'public.migration_password_reset_log'::regclass AND NOT tgisinternal"), "1");
  assert.equal(sql(db, "SELECT relrowsecurity FROM pg_class WHERE oid = 'public.migration_password_reset_log'::regclass"), "t");
}));
test("create-reset-log: UNIQUE(user_id), CHECK de status, updated_at automático e RLS (só admin lê; authenticated não escreve)", { skip: pular }, () => comBanco("g7_sql_log2", (db) => {
  sql(db, HAS_ROLE);
  assert.equal(arquivo(db, "create-reset-log.sql").code, 0);
  sql(db, `INSERT INTO public.user_roles VALUES ('${U(9)}', 'admin')`);
  sql(db, `INSERT INTO public.migration_password_reset_log (user_id, email_hash, status, updated_at) VALUES ('${U(1)}', 'h', 'pending', '2000-01-01')`);
  assert.notEqual(psql(db, ["-v", "ON_ERROR_STOP=1", "-c", `INSERT INTO public.migration_password_reset_log (user_id, email_hash, status) VALUES ('${U(1)}', 'h', 'sent')`]).code, 0);
  assert.notEqual(psql(db, ["-v", "ON_ERROR_STOP=1", "-c", `INSERT INTO public.migration_password_reset_log (user_id, email_hash, status) VALUES ('${U(2)}', 'h', 'enviado')`]).code, 0);
  sql(db, `UPDATE public.migration_password_reset_log SET status = 'sent' WHERE user_id = '${U(1)}'`);
  assert.equal(sql(db, "SELECT updated_at > now() - interval '1 minute' FROM public.migration_password_reset_log"), "t");
  assert.equal(sql(db, como("authenticated", U(9), "SELECT count(*) FROM public.migration_password_reset_log")), "1");
  assert.equal(sql(db, como("authenticated", U(5), "SELECT count(*) FROM public.migration_password_reset_log")), "0");
  const w = psql(db, ["-v", "ON_ERROR_STOP=1", "-c", como("authenticated", U(9), `INSERT INTO public.migration_password_reset_log (user_id, email_hash, status) VALUES ('${U(3)}', 'h', 'sent')`)]);
  assert.notEqual(w.code, 0); assert.match(w.err, /row-level security/);
  assert.notEqual(psql(db, ["-v", "ON_ERROR_STOP=1", "-c", como("anon", U(5), "SELECT count(*) FROM public.migration_password_reset_log")]).code, 0);
  assert.equal(sql(db, "SELECT has_table_privilege('service_role', 'public.migration_password_reset_log', 'INSERT, UPDATE, DELETE')"), "t");
}));
test("create-reset-log: é atômico — sem has_role() falha e NÃO deixa tabela pela metade", { skip: pular }, () => comBanco("g7_sql_log3", (db) => {
  const r = arquivo(db, "create-reset-log.sql");
  assert.notEqual(r.code, 0); assert.match(r.err, /has_role/);
  assert.equal(sql(db, "SELECT to_regclass('public.migration_password_reset_log') IS NULL"), "t"); // antes: tabela ficava criada sem policy
}));

// ── mark-must-reset.sql ─────────────────────────────────────────────────────
const USUARIOS = `INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('${U(1)}', 'senha@x.com', '{"nome":"Ana"}'),
  ('${U(2)}', 'social@x.com', '{"nome":"Bia"}'),
  ('${U(3)}', 'misto@x.com', NULL),
  ('${U(4)}', 'estranho@x.com', '{"must_reset_password":"sim"}'),
  ('${U(5)}', 'jsonnull@x.com', 'null'::jsonb),
  ('${U(6)}', 'falso@x.com', '{"must_reset_password":false,"k":[1,2]}');
INSERT INTO auth.identities (user_id, provider) VALUES ('${U(1)}','email'), ('${U(2)}','google'), ('${U(3)}','email'), ('${U(3)}','google'), ('${U(4)}','email'), ('${U(5)}','email'), ('${U(6)}','email');`;
test("mark-must-reset: marca só quem tem login por senha, preserva metadados e não aborta com valor estranho (antes: 'invalid input syntax for type boolean')", { skip: pular }, () => comBanco("g7_sql_mark", (db) => {
  sql(db, USUARIOS);
  const r = arquivo(db, "mark-must-reset.sql", ["-At"]);
  assert.equal(r.code, 0, r.err);
  assert.equal(r.out.trim(), "5|6"); // must_reset | total
  const meta = (n) => JSON.parse(sql(db, `SELECT raw_user_meta_data FROM auth.users WHERE id = '${U(n)}'`) || "null");
  assert.equal(meta(1).must_reset_password, true); assert.equal(meta(1).nome, "Ana"); assert.match(meta(1).migrated_at, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/);
  assert.deepEqual(meta(2), { nome: "Bia" }); // só social: intocado
  assert.equal(meta(3).must_reset_password, true); // metadado NULL + login misto
  assert.equal(meta(4).must_reset_password, true); // "sim" vira true
  assert.equal(meta(5).must_reset_password, true); assert.ok(!Array.isArray(meta(5))); // antes: virava [null, {...}]
  assert.deepEqual(meta(6).k, [1, 2]); assert.equal(meta(6).must_reset_password, true);
}));
test("mark-must-reset: idempotente — 2ª execução não altera nenhuma linha nem o migrated_at; usuário novo entra depois", { skip: pular }, () => comBanco("g7_sql_mark2", (db) => {
  sql(db, USUARIOS);
  assert.equal(arquivo(db, "mark-must-reset.sql").code, 0);
  sql(db, `UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"migrated_at":"MARCA"}' WHERE id = '${U(1)}'`);
  const antes = sql(db, "SELECT md5(string_agg(id::text || raw_user_meta_data::text, ',' ORDER BY id)), max(xmin::text::bigint) FROM auth.users");
  assert.equal(arquivo(db, "mark-must-reset.sql").code, 0);
  assert.equal(sql(db, "SELECT md5(string_agg(id::text || raw_user_meta_data::text, ',' ORDER BY id)), max(xmin::text::bigint) FROM auth.users"), antes);
  sql(db, `INSERT INTO auth.users (id, email) VALUES ('${U(7)}', 'novo@x.com'); INSERT INTO auth.identities (user_id, provider) VALUES ('${U(7)}', 'email')`);
  assert.equal(arquivo(db, "mark-must-reset.sql", ["-At"]).out.trim(), "6|7");
  assert.equal(sql(db, `SELECT raw_user_meta_data->>'migrated_at' FROM auth.users WHERE id = '${U(1)}'`), "MARCA");
}));
test("mark-must-reset: banco sem usuários roda limpo (0|0)", { skip: pular }, () => comBanco("g7_sql_mark3", (db) => {
  const r = arquivo(db, "mark-must-reset.sql", ["-At"]);
  assert.equal(r.code, 0, r.err); assert.equal(r.out.trim(), "0|0");
}));

// ── heal-sequences.sql ──────────────────────────────────────────────────────
const prox = (db, seq) => sql(db, `SELECT CASE WHEN is_called THEN last_value + 1 ELSE last_value END FROM ${seq}`);
const CENARIO = `
CREATE TABLE public.atrasada (id serial PRIMARY KEY, v text);            INSERT INTO public.atrasada (id) VALUES (10), (500);
CREATE TABLE public.adiantada (id serial PRIMARY KEY);                   INSERT INTO public.adiantada (id) VALUES (5); SELECT setval('public.adiantada_id_seq', 9000);
CREATE TABLE public.vazia (id bigserial PRIMARY KEY);                    SELECT setval('public.vazia_id_seq', 77);
CREATE TABLE public.alinhada (id serial PRIMARY KEY);                    INSERT INTO public.alinhada DEFAULT VALUES; INSERT INTO public.alinhada DEFAULT VALUES;
CREATE TABLE public.ident_always (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, v int); INSERT INTO public.ident_always (id, v) OVERRIDING SYSTEM VALUE VALUES (300, 1);
CREATE TABLE public.ident_default (id int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY);     INSERT INTO public.ident_default (id) VALUES (41);
CREATE TABLE public."Nome Esquisito" ("Id Col" serial PRIMARY KEY);     INSERT INTO public."Nome Esquisito" ("Id Col") VALUES (88);
CREATE TABLE public.particionada (id bigserial, k int) PARTITION BY RANGE (k);
CREATE TABLE public.particionada_1 PARTITION OF public.particionada FOR VALUES FROM (0) TO (100);
INSERT INTO public.particionada (id, k) VALUES (700, 1);
CREATE TABLE public.dona (id serial PRIMARY KEY);
CREATE TABLE public.carona (id int PRIMARY KEY DEFAULT nextval('public.dona_id_seq'));
INSERT INTO public.dona (id) VALUES (10); INSERT INTO public.carona (id) VALUES (900);
INSERT INTO auth.refresh_tokens (id, token) VALUES (1234, 't');
CREATE SCHEMA app; CREATE TABLE app.pedidos (id serial PRIMARY KEY); INSERT INTO app.pedidos (id) VALUES (60);
CREATE SCHEMA fora; CREATE TABLE fora.t (id serial PRIMARY KEY);     INSERT INTO fora.t (id) VALUES (60);`;

test("heal-sequences: atrasada avança; adiantada NÃO recua; vazia intocada; identity, nome com espaço, particionada, sequence compartilhada e schema auth", { skip: pular }, () => comBanco("g7_sql_heal", (db) => {
  sql(db, CENARIO);
  const r = arquivo(db, "heal-sequences.sql");
  assert.equal(r.code, 0, r.err);
  assert.equal(prox(db, "public.atrasada_id_seq"), "501");
  assert.equal(prox(db, "public.adiantada_id_seq"), "9001"); // antes: voltava para 6
  assert.equal(prox(db, "public.vazia_id_seq"), "78");
  assert.equal(prox(db, "public.alinhada_id_seq"), "3");
  assert.equal(prox(db, "public.ident_always_id_seq"), "301");
  assert.equal(prox(db, "public.ident_default_id_seq"), "42");
  assert.equal(prox(db, `public."Nome Esquisito_Id Col_seq"`), "89");
  assert.equal(prox(db, "public.particionada_id_seq"), "701"); // antes: tabela particionada era ignorada
  assert.equal(prox(db, "public.dona_id_seq"), "901"); // antes: ficava em 11 e a tabela "carona" colidia em 900
  assert.equal(prox(db, "auth.refresh_tokens_id_seq"), "1235"); // serial fora de public
  assert.equal(prox(db, "app.pedidos_id_seq"), "1", "schema fora da lista padrão não é tocado");
  assert.match(r.err, /corrigidas=8 já_alinhadas=2 tabelas_vazias=1 falhas=0 \(schemas: public,auth\)/);
  // os INSERTs voltam a funcionar sem colisão
  sql(db, "INSERT INTO public.atrasada (v) VALUES ('x'); INSERT INTO public.ident_always (v) VALUES (2); INSERT INTO public.particionada (k) VALUES (2); INSERT INTO public.carona DEFAULT VALUES; INSERT INTO public.dona DEFAULT VALUES;");
  assert.equal(sql(db, "SELECT max(id) FROM public.atrasada"), "501");
}));
test("heal-sequences: idempotente (2ª execução corrige 0) e -v schemas= cobre schema próprio", { skip: pular }, () => comBanco("g7_sql_heal2", (db) => {
  sql(db, CENARIO);
  assert.equal(arquivo(db, "heal-sequences.sql").code, 0);
  const snap = () => sql(db, "SELECT string_agg(schemaname || '.' || sequencename || '=' || coalesce(last_value::text, '-'), ',' ORDER BY 1) FROM pg_sequences");
  const antes = snap();
  const r = arquivo(db, "heal-sequences.sql");
  assert.equal(r.code, 0); assert.match(r.err, /corrigidas=0 /); assert.equal(snap(), antes);
  const s = arquivo(db, "heal-sequences.sql", ["-v", "schemas=app, fora"]);
  assert.equal(s.code, 0, s.err); assert.match(s.err, /corrigidas=2 .*schemas: app,fora/);
  assert.equal(prox(db, "app.pedidos_id_seq"), "61"); assert.equal(prox(db, "fora.t_id_seq"), "61");
}));
test("heal-sequences: -v dry_run=1 mostra e não altera nada", { skip: pular }, () => comBanco("g7_sql_heal3", (db) => {
  sql(db, CENARIO);
  const r = arquivo(db, "heal-sequences.sql", ["-v", "dry_run=1"]);
  assert.equal(r.code, 0, r.err); assert.match(r.err, /\[dry_run\] atrasada\.id → setval\(atrasada_id_seq, 501\)/); assert.match(r.err, /Sequences \[dry_run\]: corrigidas=8/);
  assert.equal(prox(db, "public.atrasada_id_seq"), "1");
}));
test("heal-sequences: sequence que NÃO pôde ser corrigida derruba a saída (antes: WARNING e exit 0), mas as outras são corrigidas", { skip: pular }, () => comBanco("g7_sql_heal4", (db) => {
  sql(db, "CREATE TABLE public.cheia (id smallserial PRIMARY KEY); INSERT INTO public.cheia (id) VALUES (32767); CREATE TABLE public.boa (id serial PRIMARY KEY); INSERT INTO public.boa (id) VALUES (20);");
  const r = arquivo(db, "heal-sequences.sql");
  assert.notEqual(r.code, 0);
  assert.match(r.err, /cheia\.id \(cheia_id_seq\) falhou: setval: value 32768 is out of bounds/); assert.match(r.err, /1 sequence\(s\) não puderam ser corrigidas/);
  assert.equal(prox(db, "public.boa_id_seq"), "21");
}));
test("heal-sequences: banco sem nenhuma sequence nos schemas pedidos roda limpo", { skip: pular }, () => comBanco("g7_sql_heal5", (db) => {
  const r = arquivo(db, "heal-sequences.sql", ["-v", "schemas=public"]);
  assert.equal(r.code, 0, r.err); assert.match(r.err, /corrigidas=0 já_alinhadas=0 tabelas_vazias=0 falhas=0/);
}));
