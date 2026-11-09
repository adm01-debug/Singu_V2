// Apoio de teste da família apply-*: imita a Management API do Supabase em 127.0.0.1 e executa o SQL
// recebido num Postgres LOCAL (protocolo "simple query", igual à API real: várias instruções num único
// POST rodam numa transação implícita). Nunca fala com api.supabase.com.
// Sem banco (PGHOST/PGPORT/PGUSER) os testes que dependem dele se PULAM; rodado sozinho, este arquivo
// testa o próprio mock.
import net from 'node:net';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const cfgPg = () => ({
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '',
});

const NUMERICOS = new Set([20, 21, 23, 26, 700, 701, 1700]);
const converter = (oid, txt) => {
  if (txt === null) return null;
  if (NUMERICOS.has(oid)) return Number(txt);
  if (oid === 16) return txt === 't';
  if (oid === 114 || oid === 3802) return JSON.parse(txt);
  return txt;
};

/** Cliente mínimo do protocolo v3 do Postgres (só simple query; auth trust ou senha em claro). */
export class ConexaoPg {
  #sock; #buf = Buffer.alloc(0); #espera = null; #msgs = [];
  static async abrir(banco, cfg = cfgPg()) {
    const c = new ConexaoPg();
    await new Promise((ok, falha) => {
      c.#sock = net.connect({ host: cfg.host, port: cfg.port }, ok);
      c.#sock.once('error', falha);
      c.#sock.setTimeout(5000, () => c.#sock.destroy(new Error('timeout ao conectar no Postgres')));
    });
    c.#sock.setTimeout(0);
    c.#sock.on('data', (d) => { c.#buf = Buffer.concat([c.#buf, d]); c.#drenar(); });
    c.#sock.on('error', (e) => c.#espera?.falha(e));
    c.#sock.on('close', () => c.#espera?.falha(new Error('conexão com o Postgres encerrada')));
    const params = `user\0${cfg.user}\0database\0${banco}\0client_encoding\0UTF8\0\0`;
    const corpo = Buffer.concat([Buffer.alloc(8), Buffer.from(params)]);
    corpo.writeInt32BE(corpo.length, 0); corpo.writeInt32BE(196608, 4);
    c.#sock.write(corpo);
    for (;;) {
      const m = await c.#proxima();
      if (m.tipo === 'R') {
        const cod = m.dados.readInt32BE(0);
        if (cod === 3) c.#enviar('p', Buffer.from(`${cfg.password}\0`));
        else if (cod !== 0) throw new Error(`autenticação Postgres não suportada pelo mock (código ${cod})`);
      } else if (m.tipo === 'E') { c.fechar(); throw new Error(lerErro(m.dados).message); }
      else if (m.tipo === 'Z') return c;
    }
  }
  #enviar(tipo, dados) {
    const cab = Buffer.alloc(5); cab.write(tipo, 0); cab.writeInt32BE(dados.length + 4, 1);
    this.#sock.write(Buffer.concat([cab, dados]));
  }
  #drenar() {
    while (this.#buf.length >= 5) {
      const tam = this.#buf.readInt32BE(1);
      if (this.#buf.length < tam + 1) break;
      this.#msgs.push({ tipo: String.fromCharCode(this.#buf[0]), dados: this.#buf.subarray(5, tam + 1) });
      this.#buf = this.#buf.subarray(tam + 1);
    }
    if (this.#espera && this.#msgs.length) { const e = this.#espera; this.#espera = null; e.ok(this.#msgs.shift()); }
  }
  #proxima() {
    if (this.#msgs.length) return Promise.resolve(this.#msgs.shift());
    return new Promise((ok, falha) => { this.#espera = { ok, falha }; });
  }
  /** Executa `sql` (uma ou várias instruções). Devolve { linhas, erro, comandos, emTransacao }. */
  async consultar(sql) {
    this.#enviar('Q', Buffer.from(`${sql}\0`));
    let campos = []; let linhas = []; let erro = null; let comandos = 0;
    for (;;) {
      const m = await this.#proxima();
      if (m.tipo === 'T') { campos = lerCampos(m.dados); linhas = []; }
      else if (m.tipo === 'D') linhas.push(lerLinha(m.dados, campos));
      else if (m.tipo === 'C') comandos++; // um CommandComplete por instrução executada
      else if (m.tipo === 'E') erro = lerErro(m.dados);
      else if (m.tipo === 'Z') return { linhas, erro, comandos, emTransacao: m.dados[0] !== 0x49 };
    }
  }
  fechar() { try { this.#enviar('X', Buffer.alloc(0)); } catch { /* já fechada */ } this.#sock.destroy(); }
}

function lerCampos(d) {
  const n = d.readInt16BE(0); const campos = []; let p = 2;
  for (let i = 0; i < n; i++) {
    const fim = d.indexOf(0, p);
    campos.push({ nome: d.toString('utf8', p, fim), oid: d.readInt32BE(fim + 7) });
    p = fim + 19;
  }
  return campos;
}
function lerLinha(d, campos) {
  const n = d.readInt16BE(0); const linha = {}; let p = 2;
  for (let i = 0; i < n; i++) {
    const tam = d.readInt32BE(p); p += 4;
    linha[campos[i].nome] = converter(campos[i].oid, tam < 0 ? null : d.toString('utf8', p, p + tam));
    if (tam > 0) p += tam;
  }
  return linha;
}
function lerErro(d) {
  const f = {}; let p = 0;
  while (d[p] !== 0) { const fim = d.indexOf(0, p + 1); f[String.fromCharCode(d[p])] = d.toString('utf8', p + 1, fim); p = fim + 1; }
  return { severity: f.S, code: f.C, message: f.M };
}

/** Roda SQL avulso num banco (abre e fecha a conexão). Lança se o SQL falhar. */
export async function sqlLocal(banco, sql) {
  const c = await ConexaoPg.abrir(banco);
  try {
    const r = await c.consultar(sql);
    if (r.erro) throw new Error(`${r.erro.code}: ${r.erro.message}`);
    return r.linhas;
  } finally { c.fechar(); }
}

export async function pgDisponivel() {
  try { await sqlLocal('postgres', 'select 1'); return true; } catch { return false; }
}

// Objetos que o Supabase entrega prontos e que os DDL do repo pressupõem.
export const STUBS_SUPABASE = `
DO $$ DECLARE r text; BEGIN
  FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
    BEGIN EXECUTE format('CREATE ROLE %I NOLOGIN', r);
    EXCEPTION WHEN duplicate_object OR unique_violation THEN NULL; END;
  END LOOP;
END $$;
CREATE SCHEMA IF NOT EXISTS auth; CREATE SCHEMA IF NOT EXISTS extensions;
CREATE SCHEMA IF NOT EXISTS storage; CREATE SCHEMA IF NOT EXISTS vault; CREATE SCHEMA IF NOT EXISTS net;
CREATE TABLE auth.users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text, raw_user_meta_data jsonb, created_at timestamptz DEFAULT now());
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $f$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $f$;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $f$ SELECT coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'anon') $f$;
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $f$ SELECT coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $f$;
CREATE FUNCTION auth.email() RETURNS text LANGUAGE sql STABLE AS $f$ SELECT nullif(current_setting('request.jwt.claim.email', true), '') $f$;
CREATE TABLE storage.buckets (id text PRIMARY KEY, name text, public boolean DEFAULT false);
CREATE TABLE storage.objects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id text, name text, owner uuid);
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;
GRANT USAGE ON SCHEMA public, auth, extensions TO anon, authenticated, service_role;
`;

/** Cria um banco descartável (prefixo do grupo: g1_) já com os stubs do Supabase. */
let serie = 0;
export async function criarBanco(sufixo, { modelo } = {}) {
  const nome = `g1_${sufixo}_${process.pid}_${Date.now().toString(36)}_${++serie}`.toLowerCase();
  await sqlLocal('postgres', `CREATE DATABASE "${nome}"${modelo ? ` TEMPLATE "${modelo}"` : ''}`);
  if (!modelo) await sqlLocal(nome, STUBS_SUPABASE);
  await sqlLocal(nome, `ALTER DATABASE "${nome}" SET search_path TO "$user", public, extensions`);
  return nome;
}

/** Retrato do schema public (nomes de tudo que os DDL criam) para comparar dois bancos. */
export async function retrato(banco) {
  const [l] = await sqlLocal(banco, `SELECT json_build_object(
    'tabelas', (SELECT coalesce(json_agg(relname ORDER BY relname), '[]') FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relkind IN ('r', 'p')),
    'rls', (SELECT coalesce(json_agg(relname ORDER BY relname), '[]') FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relrowsecurity),
    'indices', (SELECT coalesce(json_agg(indexname ORDER BY indexname), '[]') FROM pg_indexes WHERE schemaname = 'public'),
    'fks', (SELECT coalesce(json_agg(conname ORDER BY conname), '[]') FROM pg_constraint WHERE contype = 'f' AND connamespace = 'public'::regnamespace),
    'funcoes', (SELECT coalesce(json_agg(x ORDER BY x), '[]') FROM (SELECT oid::regprocedure::text x FROM pg_proc WHERE pronamespace = 'public'::regnamespace) f),
    'policies', (SELECT coalesce(json_agg(x ORDER BY x), '[]') FROM (SELECT tablename || ': ' || policyname x FROM pg_policies WHERE schemaname = 'public') p),
    'triggers', (SELECT coalesce(json_agg(x ORDER BY x), '[]') FROM (SELECT c.relname || ': ' || t.tgname x FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid WHERE NOT t.tgisinternal AND c.relnamespace = 'public'::regnamespace) t),
    'views', (SELECT coalesce(json_agg(viewname ORDER BY viewname), '[]') FROM pg_views WHERE schemaname = 'public'),
    'enums', (SELECT coalesce(json_agg(typname ORDER BY typname), '[]') FROM pg_type WHERE typtype = 'e' AND typnamespace = 'public'::regnamespace),
    'grants', (SELECT count(*) FROM information_schema.role_table_grants WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated', 'service_role'))
  ) AS r`);
  return l.r;
}
export async function removerBanco(nome) {
  if (!/^g1_/.test(nome)) throw new Error('só removo bancos do grupo g1_');
  await sqlLocal('postgres', `DROP DATABASE IF EXISTS "${nome}" WITH (FORCE)`);
}

/**
 * Sobe o mock. `interceptar(chamada)` permite injetar falhas: devolva { status, corpo, cabecalhos } para responder
 * sem tocar no banco, { atrasoMs } para segurar a resposta, { derrubar: true } para cortar a conexão,
 * ou nada para executar de verdade. `mock.chamadas` guarda { n, ref, sql, autorizacao, status, erro } de cada POST.
 */
export async function iniciarMock({ banco, token = 'token-de-teste', interceptar } = {}) {
  const chamadas = [];
  let conexao = banco ? await ConexaoPg.abrir(banco) : null;
  let fila = Promise.resolve();
  const servidor = http.createServer((req, res) => {
    let corpo = '';
    req.on('data', (c) => { corpo += c; });
    req.on('end', () => { fila = fila.then(() => tratar(req, res, corpo)).catch(() => { res.destroy(); }); });
  });
  const responder = (res, status, obj, cabecalhos = {}) => {
    res.writeHead(status, { 'Content-Type': 'application/json', ...cabecalhos });
    res.end(typeof obj === 'string' ? obj : JSON.stringify(obj));
  };
  async function tratar(req, res, corpo) {
    const m = /^\/v1\/projects\/([a-z0-9]+)\/database\/query$/.exec(req.url);
    if (req.method !== 'POST' || !m) return responder(res, 404, { message: 'Not Found' });
    let sql;
    try { sql = JSON.parse(corpo).query; } catch { return responder(res, 400, { message: 'JSON inválido' }); }
    const chamada = { n: chamadas.length + 1, ref: m[1], sql, autorizacao: req.headers.authorization };
    chamadas.push(chamada);
    const sair = (status, obj, cabecalhos) => { chamada.status = status; chamada.erro = obj?.message ?? null; return responder(res, status, obj, cabecalhos); };
    if (chamada.autorizacao !== `Bearer ${token}`) return sair(401, { message: 'Unauthorized' });
    const acao = (await interceptar?.(chamada)) ?? {};
    if (acao.derrubar) { chamada.status = 0; return req.socket.destroy(); }
    if (acao.atrasoMs) await new Promise((r) => setTimeout(r, acao.atrasoMs));
    if (acao.status) return sair(acao.status, acao.corpo ?? { message: `falha injetada ${acao.status}` }, acao.cabecalhos);
    if (!conexao) return sair(201, []);
    const r = await conexao.consultar(sql);
    if (r.emTransacao) await conexao.consultar('ROLLBACK');
    if (r.erro) return sair(400, { message: `Failed to run sql query: ERROR:  ${r.erro.code}: ${r.erro.message}\n` });
    return sair(201, r.linhas);
  }
  await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
  return {
    url: `http://127.0.0.1:${servidor.address().port}`, token, chamadas,
    async fechar() { conexao?.fechar(); conexao = null; servidor.closeAllConnections(); await new Promise((ok) => servidor.close(ok)); },
  };
}

/** Roda um script da família como CLI (processo filho), apontado para o mock. */
export function rodarCli(script, args = [], { mock, env = {}, cwd, aoIniciar } = {}) {
  const caminho = script.startsWith('/') ? script : fileURLToPath(new URL(`../${script}`, import.meta.url));
  const ambiente = { PATH: process.env.PATH, SUPABASE_MGMT_PAUSA_MS: '0', SUPABASE_MGMT_BACKOFF_MS: '5',
    ...(mock ? { SUPABASE_MGMT_API_URL: mock.url, SUPABASE_ACCESS_TOKEN: mock.token } : {}), ...env };
  // Trava de segurança dos testes: --apply só com a API apontada para 127.0.0.1.
  if (args.includes('--apply') && !/^http:\/\/127\.0\.0\.1:\d+/.test(ambiente.SUPABASE_MGMT_API_URL ?? '')) {
    throw new Error('rodarCli: --apply em teste exige SUPABASE_MGMT_API_URL em 127.0.0.1 (mock)');
  }
  return new Promise((ok) => {
    const filho = spawn(process.execPath, [caminho, ...args], { cwd, env: ambiente });
    aoIniciar?.(filho);
    let stdout = ''; let stderr = '';
    filho.stdout.on('data', (d) => { stdout += d; });
    filho.stderr.on('data', (d) => { stderr += d; });
    filho.on('close', (codigo, sinal) => ok({ codigo, sinal, stdout, stderr }));
  });
}

// DDL de teste, pequeno e cheio de armadilhas léxicas (mesmos nomes de arquivo dos DDL reais): cabeçalho em
// comentário antes da 1ª instrução, `;` e apóstrofo em string/comentário/identificador, $function$ com $q$ e $$
// dentro, BEGIN ATOMIC, CONCURRENTLY, índice que depende de função criada depois, quebras CRLF.
export const DDL_DE_TESTE = {
  '00_extensions.sql': '-- Extensões\nCREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;\n',
  '01_schemas_and_enums.sql': `-- Generated; teste\n\nCREATE SCHEMA IF NOT EXISTS public;\n
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.entity_relationship_role AS ENUM ('buyer', 'manager', 'owner', 'decision_maker', 'influencer', 'user', 'sponsor', 'partner', 'supplier', 'subsidiary', 'parent', 'employee_of', 'other');
CREATE TYPE public.entity_type AS ENUM ('company', 'contact');
CREATE TYPE public.error_severity AS ENUM ('info', 'warning', 'error', 'critical');
CREATE TYPE public.passo_outcome AS ENUM ('respondeu_positivo', 'respondeu_neutro', 'nao_respondeu', 'nao_atendeu', 'pulou');
CREATE TYPE public.validation_kind AS ENUM ('email', 'phone');
CREATE TYPE public.validation_queue_status AS ENUM ('pending', 'processing', 'done', 'error');
CREATE TYPE public.humor AS ENUM ('bom; ótimo', 'it''s');\n`,
  '02_tables.sql': `-- ====\n-- TABLES\n-- ====\n
-- ─── public.contas ───
CREATE TABLE public.contas (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  nome text DEFAULT 'sem; nome'::text NOT NULL, -- comentário com ; e d'água
  tipo public.entity_type,
  CONSTRAINT contas_pkey PRIMARY KEY (id),
  CONSTRAINT contas_nome_check CHECK ((nome <> ');'::text))
);\n
-- ─── public."Itens; do Pedido" ───
CREATE TABLE public."Itens; do Pedido" (id integer NOT NULL, conta_id uuid, CONSTRAINT itens_pkey PRIMARY KEY (id));\n
-- ─── public.audit_log ───
CREATE TABLE public.audit_log (
  id bigint NOT NULL,
  created_at timestamp with time zone NOT NULL
) PARTITION BY RANGE (created_at);\n
-- ─── public.entity_relationships ───
CREATE TABLE public.entity_relationships (id integer NOT NULL, from_type public.entity_type NOT NULL, role public.entity_relationship_role NOT NULL);
-- ─── public.error_logs ───
CREATE TABLE public.error_logs (id integer NOT NULL, severity public.error_severity DEFAULT 'error'::error_severity NOT NULL);
-- ─── public.proximo_passo_feedback ───
CREATE TABLE public.proximo_passo_feedback (id integer NOT NULL, outcome public.passo_outcome);
-- ─── public.validation_queue ───
CREATE TABLE public.validation_queue (id integer NOT NULL, kind public.validation_kind, status public.validation_queue_status DEFAULT 'pending'::validation_queue_status);\n\n
-- Comentários
COMMENT ON TABLE public.contas IS 'Contas; com ponto e vírgula';\n`,
  '11_partitions.sql': `-- Generated\n
CREATE TABLE public.audit_log_2026_11 PARTITION OF public.audit_log FOR VALUES FROM ('2026-11-01 00:00:00+00') TO ('2026-12-01 00:00:00+00');
CREATE TABLE public.audit_log_default PARTITION OF public.audit_log DEFAULT;\n`,
  '03_indexes.sql': `-- Generated\n
CREATE INDEX idx_contas_user ON public.contas USING btree (user_id);
CREATE UNIQUE INDEX idx_contas_nome ON public.contas USING btree (public.sem_acento(nome));
CREATE INDEX CONCURRENTLY idx_itens_conta ON public."Itens; do Pedido" USING btree (conta_id);\n`,
  '04_foreign_keys.sql': '-- Generated\n\nALTER TABLE public."Itens; do Pedido" ADD CONSTRAINT itens_conta_fk FOREIGN KEY (conta_id) REFERENCES contas(id) ON DELETE CASCADE;\n',
  '05_grants.sql': '-- Generated\n\nGRANT SELECT, INSERT, UPDATE, DELETE ON public.contas TO authenticated;\nGRANT ALL ON public.contas TO service_role;\nGRANT SELECT ON public."Itens; do Pedido" TO anon;\n',
  '06_rls_enable.sql': '-- Generated\n\nALTER TABLE public.contas ENABLE ROW LEVEL SECURITY;\nALTER TABLE public."Itens; do Pedido" ENABLE ROW LEVEL SECURITY;\nALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;\n',
  '07_policies.sql': `-- Generated\n
CREATE POLICY contas_select ON public.contas AS PERMISSIVE FOR SELECT TO public USING (public.eh_dono(user_id));
CREATE POLICY "dono's; itens" ON public."Itens; do Pedido" AS PERMISSIVE FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY contas_insert ON public.contas AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));\n`,
  '08_functions.sql': `-- Generated\n
CREATE OR REPLACE FUNCTION public.sem_acento(text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$ SELECT lower($1) $function$
;
CREATE OR REPLACE FUNCTION public.tocar_atualizacao()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- comentário; com ponto e vírgula e 'apóstrofo
  PERFORM 'a;b', $q$ interno; $$ $q$;
  RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.eh_dono(uid uuid) RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT uid = auth.uid() $$;
CREATE OR REPLACE FUNCTION public.dobro(n integer) RETURNS integer LANGUAGE sql BEGIN ATOMIC SELECT n * 2; END;\n`,
  '09_triggers.sql': '-- Generated\n\nCREATE TRIGGER contas_toque BEFORE UPDATE ON contas FOR EACH ROW EXECUTE FUNCTION tocar_atualizacao();\nCREATE TRIGGER itens_toque BEFORE UPDATE ON "Itens; do Pedido" FOR EACH ROW EXECUTE FUNCTION tocar_atualizacao();\n',
  '10_views.sql': "-- Generated\r\n\r\nCREATE OR REPLACE VIEW public.contas_publicas WITH (security_invoker=on) AS \r\n SELECT id,\r\n    nome\r\n   FROM contas\r\n  WHERE nome <> ';'::text;\r\nCREATE OR REPLACE VIEW public.v_itens AS SELECT id FROM \"Itens; do Pedido\";\r\n",
};

/** Grava DDL_DE_TESTE (com `trocas` por cima: { arquivo: conteúdo | null para omitir }) em `dir`. */
export function gravarDdlDeTeste(dir, trocas = {}) {
  mkdirSync(dir, { recursive: true });
  for (const [arquivo, texto] of Object.entries({ ...DDL_DE_TESTE, ...trocas })) if (texto !== null) writeFileSync(join(dir, arquivo), texto);
  return dir;
}

// ── autoteste do mock (só quando este arquivo é o alvo do `node --test`) ──────────────────────────────
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { test } = await import('node:test');
  const assert = (await import('node:assert/strict')).default;
  const temPg = await pgDisponivel();
  const pular = temPg ? false : 'Postgres local indisponível (defina PGHOST/PGPORT/PGUSER)';
  const post = (mock, sql, token = mock.token) => fetch(`${mock.url}/v1/projects/abcdefghij0123456789/database/query`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: sql }),
  });

  test('mock sem banco: 201 [], 401 com token errado, 404 em rota desconhecida, falha injetada', async () => {
    const mock = await iniciarMock({ interceptar: (c) => (c.sql === 'x' ? { status: 503 } : null) });
    try {
      const ok = await post(mock, 'select 1');
      assert.equal(ok.status, 201); assert.deepEqual(await ok.json(), []);
      assert.equal((await post(mock, 'select 1', 'errado')).status, 401);
      assert.equal((await fetch(`${mock.url}/v1/outra`, { method: 'POST', body: '{}' })).status, 404);
      assert.equal((await post(mock, 'x')).status, 503);
      assert.deepEqual(mock.chamadas.map((c) => c.status), [201, 401, 503]);
    } finally { await mock.fechar(); }
  });

  test('mock com banco: linhas tipadas, erro 400 com SQLSTATE e lote atômico como na API real', { skip: pular }, async () => {
    const banco = await criarBanco('mock');
    const mock = await iniciarMock({ banco });
    try {
      assert.deepEqual(await (await post(mock, "select 2::int AS t, 'a' AS s, true AS b")).json(), [{ t: 2, s: 'a', b: true }]);
      const erro = await post(mock, 'create table t1 (id int); create table t1 (id int)');
      assert.equal(erro.status, 400);
      assert.match((await erro.json()).message, /^Failed to run sql query: ERROR: {2}42P07: relation "t1" already exists/);
      assert.deepEqual(await sqlLocal(banco, "select count(*)::int AS n from pg_tables where tablename = 't1'"), [{ n: 0 }], 'lote com erro é revertido inteiro');
      assert.equal((await post(mock, 'begin; create table t2 (id int)')).status, 201);
      assert.equal((await retrato(banco)).tabelas.length, 0, 'transação deixada aberta é desfeita');
    } finally { await mock.fechar(); await removerBanco(banco); }
  });
}
