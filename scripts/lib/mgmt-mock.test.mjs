// Apoio de teste da família apply-*: imita a Management API do Supabase em 127.0.0.1 e executa o SQL
// recebido num Postgres LOCAL (protocolo "simple query", igual à API real: várias instruções num único
// POST rodam numa transação implícita). Nunca fala com api.supabase.com.
// Sem banco (PGHOST/PGPORT/PGUSER) os testes que dependem dele se PULAM; rodado sozinho, este arquivo
// testa o próprio mock.
import net from 'node:net';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

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
  /** Executa `sql` (uma ou várias instruções). Devolve { linhas, erro, emTransacao }. */
  async consultar(sql) {
    this.#enviar('Q', Buffer.from(`${sql}\0`));
    let campos = []; let linhas = []; let erro = null;
    for (;;) {
      const m = await this.#proxima();
      if (m.tipo === 'T') { campos = lerCampos(m.dados); linhas = []; }
      else if (m.tipo === 'D') linhas.push(lerLinha(m.dados, campos));
      else if (m.tipo === 'E') erro = lerErro(m.dados);
      else if (m.tipo === 'Z') return { linhas, erro, emTransacao: m.dados[0] !== 0x49 };
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
GRANT USAGE ON SCHEMA public, auth, extensions TO anon, authenticated, service_role;
`;

/** Cria um banco descartável (prefixo do grupo: g1_) já com os stubs do Supabase. */
export async function criarBanco(sufixo) {
  const nome = `g1_${sufixo}_${process.pid}_${Date.now().toString(36)}`.toLowerCase();
  await sqlLocal('postgres', `CREATE DATABASE "${nome}"`);
  await sqlLocal(nome, `${STUBS_SUPABASE}\nALTER DATABASE "${nome}" SET search_path TO "$user", public, extensions;`);
  return nome;
}
export async function removerBanco(nome) {
  if (!/^g1_/.test(nome)) throw new Error('só removo bancos do grupo g1_');
  await sqlLocal('postgres', `DROP DATABASE IF EXISTS "${nome}" WITH (FORCE)`);
}

/**
 * Sobe o mock. `interceptar(chamada)` permite injetar falhas: devolva { status, corpo } para responder
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
  const responder = (res, status, obj) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(typeof obj === 'string' ? obj : JSON.stringify(obj));
  };
  async function tratar(req, res, corpo) {
    const m = /^\/v1\/projects\/([a-z0-9]+)\/database\/query$/.exec(req.url);
    if (req.method !== 'POST' || !m) return responder(res, 404, { message: 'Not Found' });
    let sql;
    try { sql = JSON.parse(corpo).query; } catch { return responder(res, 400, { message: 'JSON inválido' }); }
    const chamada = { n: chamadas.length + 1, ref: m[1], sql, autorizacao: req.headers.authorization };
    chamadas.push(chamada);
    const sair = (status, obj) => { chamada.status = status; chamada.erro = obj?.message ?? null; return responder(res, status, obj); };
    if (chamada.autorizacao !== `Bearer ${token}`) return sair(401, { message: 'Unauthorized' });
    const acao = (await interceptar?.(chamada)) ?? {};
    if (acao.derrubar) { chamada.status = 0; return req.socket.destroy(); }
    if (acao.atrasoMs) await new Promise((r) => setTimeout(r, acao.atrasoMs));
    if (acao.status) return sair(acao.status, acao.corpo ?? { message: `falha injetada ${acao.status}` });
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
export function rodarCli(script, args = [], { mock, env = {}, cwd } = {}) {
  const caminho = fileURLToPath(new URL(`../${script}`, import.meta.url));
  return new Promise((ok) => {
    const filho = spawn(process.execPath, [caminho, ...args], {
      cwd, env: { PATH: process.env.PATH, ...(mock ? { SUPABASE_MGMT_API_URL: mock.url, SUPABASE_ACCESS_TOKEN: mock.token } : {}), ...env },
    });
    let stdout = ''; let stderr = '';
    filho.stdout.on('data', (d) => { stdout += d; });
    filho.stderr.on('data', (d) => { stderr += d; });
    filho.on('close', (codigo, sinal) => ok({ codigo, sinal, stdout, stderr }));
  });
}
