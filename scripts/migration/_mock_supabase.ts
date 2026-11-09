// _mock_supabase.ts — servidor HTTP local (127.0.0.1) que imita o mínimo de
// Storage, PostgREST e Auth do Supabase. SOMENTE PARA TESTES (*_test.ts):
// nenhum script de migração importa este arquivo. Nunca fala com rede externa.
import { createHash } from "node:crypto";

export interface MockObjeto {
  corpo: Uint8Array;
  contentType: string;
  cacheControl: string;
  userMetadata?: Record<string, unknown>;
  etag: string;
}
export interface MockBucket {
  id: string;
  name: string;
  public: boolean;
  file_size_limit: number | null;
  allowed_mime_types: string[] | null;
}
export interface MockTabela {
  pk: string[];
  linhas: Record<string, unknown>[];
  colunas?: string[]; // se definido, coluna desconhecida → 400 PGRST204
  obrigatorias?: string[]; // NOT NULL sem default → 400 23502
}
export interface MockUsuario {
  id: string;
  email?: string;
  senha?: string;
  identities?: { provider: string }[];
}
export interface MockReq { method: string; path: string; search: string; headers: Headers; corpo: Uint8Array }
interface Falha { metodo: string; re: RegExp; status: number[]; headers?: Record<string, string>; atrasoMs?: number; corpo?: string }

const enc = new TextEncoder();
const dec = new TextDecoder();

export function md5Hex(b: Uint8Array): string {
  return createHash("md5").update(b).digest("hex");
}

export class MockSupabase {
  buckets = new Map<string, MockBucket>();
  objetos = new Map<string, Map<string, MockObjeto>>();
  tabelas = new Map<string, MockTabela>();
  usuarios: MockUsuario[] = [];
  reqs: MockReq[] = [];
  recuperacoes: string[] = []; // e-mails que receberam /recover
  linksGerados: string[] = []; // e-mails de /admin/generate_link
  maxListLimit = 1000; // teto do servidor para "limit" em object/list
  maxRows = 1000; // db-max-rows do PostgREST
  statusApp = 200;
  statusFuncoes = 404;
  emUso = 0;
  picoEmUso = 0;
  private falhas: Falha[] = [];
  private servidor!: Deno.HttpServer;
  url = "";

  static async iniciar(): Promise<MockSupabase> {
    const m = new MockSupabase();
    await new Promise<void>((ok) => {
      m.servidor = Deno.serve({ hostname: "127.0.0.1", port: 0, onListen: (a) => { m.url = `http://127.0.0.1:${a.port}`; ok(); } },
        (r) => m.tratar(r));
    });
    return m;
  }
  async parar(): Promise<void> { await this.servidor.shutdown(); }

  /** Enfileira respostas de erro para as próximas requisições que casarem. */
  falhar(metodo: string, re: RegExp, status: number[], extra: { headers?: Record<string, string>; atrasoMs?: number; corpo?: string } = {}): void {
    this.falhas.push({ metodo, re, status: [...status], ...extra });
  }
  bucket(id: string, pub = false, extra: Partial<MockBucket> = {}): void {
    this.buckets.set(id, { id, name: id, public: pub, file_size_limit: null, allowed_mime_types: null, ...extra });
    if (!this.objetos.has(id)) this.objetos.set(id, new Map());
  }
  objeto(bucket: string, chave: string, corpo: Uint8Array | string, extra: Partial<MockObjeto> = {}): void {
    const b = typeof corpo === "string" ? enc.encode(corpo) : corpo;
    if (!this.objetos.has(bucket)) this.bucket(bucket);
    this.objetos.get(bucket)!.set(chave, { corpo: b, contentType: "application/octet-stream", cacheControl: "max-age=3600", etag: md5Hex(b), ...extra });
  }
  tabela(nome: string, pk: string[], linhas: Record<string, unknown>[] = [], extra: Partial<MockTabela> = {}): MockTabela {
    const t = { pk, linhas: linhas.map((l) => ({ ...l })), ...extra };
    this.tabelas.set(nome, t);
    return t;
  }
  contar(metodo: string, re: RegExp): number {
    return this.reqs.filter((r) => r.method === metodo && re.test(r.path)).length;
  }

  private async tratar(req: Request): Promise<Response> {
    const u = new URL(req.url);
    const corpo = new Uint8Array(await req.arrayBuffer());
    this.reqs.push({ method: req.method, path: u.pathname, search: u.search, headers: req.headers, corpo });
    this.emUso++;
    this.picoEmUso = Math.max(this.picoEmUso, this.emUso);
    try {
      for (const f of this.falhas) {
        if (f.status.length && f.metodo === req.method && f.re.test(u.pathname)) {
          const s = f.status.shift()!;
          if (f.atrasoMs) await new Promise((r) => setTimeout(r, f.atrasoMs));
          if (s > 0) return new Response(req.method === "HEAD" ? null : f.corpo ?? `falha injetada ${s}`, { status: s, headers: f.headers });
        }
      }
      await new Promise((r) => setTimeout(r, 2)); // deixa a concorrência aparecer
      if (u.pathname.startsWith("/storage/v1/")) return this.storage(req, u, corpo);
      if (u.pathname.startsWith("/rest/v1")) return this.rest(req, u, corpo);
      if (u.pathname.startsWith("/auth/v1/")) return this.auth(req, u, corpo);
      if (u.pathname.startsWith("/functions/v1/")) return new Response("{}", { status: this.statusFuncoes });
      return new Response("app", { status: this.statusApp });
    } finally { this.emUso--; }
  }

  // ── Storage ──────────────────────────────────────────────────────────────
  private storage(req: Request, u: URL, corpo: Uint8Array): Response {
    const p = u.pathname.slice("/storage/v1/".length);
    const j = (o: unknown, status = 200) => Response.json(o, { status });
    if (p === "bucket" && req.method === "GET") return j([...this.buckets.values()]);
    if (p === "bucket" && req.method === "POST") {
      const b = JSON.parse(dec.decode(corpo)) as MockBucket;
      if (this.buckets.has(b.id)) return j({ error: "Duplicate" }, 409);
      this.bucket(b.id, b.public, b);
      return j({ name: b.id });
    }
    if (p.startsWith("bucket/") && req.method === "PUT") {
      const id = decodeURIComponent(p.slice(7));
      if (!this.buckets.has(id)) return j({ error: "not found" }, 404);
      this.bucket(id, false, { ...JSON.parse(dec.decode(corpo)), id, name: id });
      return j({ message: "Successfully updated" });
    }
    const seg = p.split("/").map(decodeURIComponent);
    if (seg[0] !== "object") return j({ error: "rota" }, 404);
    if (seg[1] === "list" && req.method === "POST") return this.listar(seg[2], JSON.parse(dec.decode(corpo)));
    let modo = "upload";
    let resto = seg.slice(1);
    if (["authenticated", "info", "sign", "public"].includes(seg[1])) { modo = seg[1]; resto = seg.slice(2); }
    if (modo === "info" && resto[0] === "authenticated") resto = resto.slice(1);
    const [bucket, ...partes] = resto;
    const chave = partes.join("/");
    const mapa = this.objetos.get(bucket);
    if (!mapa) return j({ error: "Bucket not found" }, 404);
    if (modo === "upload" && req.method === "POST") {
      if (mapa.has(chave) && req.headers.get("x-upsert") !== "true") return j({ error: "Duplicate" }, 409);
      const xm = req.headers.get("x-metadata");
      mapa.set(chave, {
        corpo, etag: md5Hex(corpo),
        contentType: req.headers.get("content-type") ?? "application/octet-stream",
        cacheControl: req.headers.get("cache-control") ?? "no-cache",
        userMetadata: xm ? JSON.parse(dec.decode(Uint8Array.from(atob(xm), (c) => c.charCodeAt(0)))) : undefined,
      });
      return j({ Key: `${bucket}/${chave}`, Id: crypto.randomUUID() });
    }
    const o = mapa.get(chave);
    if (!o) return j({ error: "Object not found" }, req.method === "HEAD" ? 400 : 404);
    if (modo === "sign" && req.method === "POST") return j({ signedURL: `/object/sign/${[bucket, ...partes].map(encodeURIComponent).join("/")}?token=t` });
    if (modo === "info") {
      return j({ name: chave, bucket_id: bucket, size: o.corpo.length, content_type: o.contentType, cache_control: o.cacheControl, etag: `"${o.etag}"`, metadata: o.userMetadata ?? {} });
    }
    const h: Record<string, string> = { "content-type": o.contentType, "cache-control": o.cacheControl, etag: `"${o.etag}"`, "content-length": String(o.corpo.length), "accept-ranges": "bytes" };
    if (req.method === "HEAD") return new Response(null, { headers: h });
    const range = /^bytes=(\d+)-(\d+)?$/.exec(req.headers.get("range") ?? "");
    if (range) {
      const ini = Number(range[1]);
      const fim = Math.min(range[2] ? Number(range[2]) : o.corpo.length - 1, o.corpo.length - 1);
      const parte = o.corpo.slice(ini, fim + 1);
      return new Response(parte, { status: 206, headers: { ...h, "content-length": String(parte.length), "content-range": `bytes ${ini}-${fim}/${o.corpo.length}` } });
    }
    return new Response(o.corpo.slice(), { headers: h });
  }
  private listar(bucket: string, q: { prefix?: string; limit?: number; offset?: number }): Response {
    const mapa = this.objetos.get(bucket);
    if (!mapa) return Response.json({ error: "Bucket not found" }, { status: 404 });
    const prefixo = q.prefix ?? "";
    const itens = new Map<string, unknown>();
    for (const [chave, o] of [...mapa.entries()].sort(([a], [b]) => (a < b ? -1 : 1))) {
      if (!chave.startsWith(prefixo)) continue;
      const resto = chave.slice(prefixo.length);
      const barra = resto.indexOf("/");
      if (barra >= 0) {
        const pasta = resto.slice(0, barra);
        if (!itens.has(`d:${pasta}`)) itens.set(`d:${pasta}`, { name: pasta, id: null, updated_at: null, created_at: null, last_accessed_at: null, metadata: null });
      } else {
        itens.set(`f:${resto}`, { name: resto, id: crypto.randomUUID(), updated_at: "2026-01-01T00:00:00Z", created_at: "2026-01-01T00:00:00Z", last_accessed_at: null,
          metadata: { size: o.corpo.length, mimetype: o.contentType, cacheControl: o.cacheControl, eTag: `"${o.etag}"` } });
      }
    }
    const tudo = [...itens.values()];
    const limite = Math.min(q.limit ?? 100, this.maxListLimit);
    return Response.json(tudo.slice(q.offset ?? 0, (q.offset ?? 0) + limite));
  }

  // ── PostgREST ────────────────────────────────────────────────────────────
  private rest(req: Request, u: URL, corpo: Uint8Array): Response {
    const nome = decodeURIComponent(u.pathname.replace(/^\/rest\/v1\/?/, ""));
    if (!nome) return Response.json({ swagger: "2.0" });
    const t = this.tabelas.get(nome);
    const erro = (status: number, code: string, message: string) => Response.json({ code, message, details: null, hint: null }, { status });
    if (!t) return erro(404, "PGRST205", `Could not find the table 'public.${nome}' in the schema cache`);
    const filtros: ((l: Record<string, unknown>) => boolean)[] = [];
    let ordem: [string, boolean][] = [];
    let limite: number | null = null;
    let deslocamento = 0;
    let selecao: string[] | null = null;
    for (const [k, v] of u.searchParams) {
      if (k === "select") { selecao = v === "*" ? null : v.split(",").map((s) => s.trim()); continue; }
      if (k === "order") { ordem = v.split(",").map((s) => [s.split(".")[0], s.includes(".desc")]); continue; }
      if (k === "limit") { limite = Number(v); continue; }
      if (k === "offset") { deslocamento = Number(v); continue; }
      if (k === "on_conflict" || k === "columns") continue;
      const m = /^(eq|gte|gt|lte|lt|is)\.(.*)$/s.exec(v);
      if (!m) return erro(400, "PGRST100", `filtro não suportado no mock: ${k}=${v}`);
      if (t.colunas && !t.colunas.includes(k)) return erro(400, "42703", `column ${nome}.${k} does not exist`);
      const [, op, val] = m;
      filtros.push((l) => {
        const a = l[k];
        if (op === "is") return val === "null" ? a == null : String(a) === val;
        if (a == null) return false;
        const s = String(a);
        return op === "eq" ? s === val : op === "gte" ? s >= val : op === "gt" ? s > val : op === "lte" ? s <= val : s < val;
      });
    }
    if (selecao && t.colunas) for (const c of selecao) if (!t.colunas.includes(c)) return erro(400, "42703", `column ${nome}.${c} does not exist`);
    const casa = (l: Record<string, unknown>) => filtros.every((f) => f(l));
    if (req.method === "GET" || req.method === "HEAD") {
      let linhas = t.linhas.filter(casa);
      const total = linhas.length;
      for (const [col, desc] of [...ordem].reverse()) {
        linhas = [...linhas].sort((a, b) => (String(a[col]) < String(b[col]) ? -1 : String(a[col]) > String(b[col]) ? 1 : 0) * (desc ? -1 : 1));
      }
      const range = /^(\d+)-(\d+)$/.exec(req.headers.get("range") ?? "");
      if (range) { deslocamento = Number(range[1]); limite = Number(range[2]) - deslocamento + 1; }
      const lim = Math.min(limite ?? this.maxRows, this.maxRows);
      linhas = linhas.slice(deslocamento, deslocamento + lim);
      if (selecao) linhas = linhas.map((l) => Object.fromEntries(selecao!.map((c) => [c, l[c] ?? null])));
      const h = { "content-range": `${linhas.length ? `${deslocamento}-${deslocamento + linhas.length - 1}` : "*"}/${total}` };
      return req.method === "HEAD" ? new Response(null, { headers: h }) : Response.json(linhas, { headers: h });
    }
    if (req.method === "DELETE") {
      if (filtros.length === 0) return erro(400, "21000", "DELETE requires a WHERE clause");
      const antes = t.linhas.length;
      t.linhas = t.linhas.filter((l) => !casa(l));
      return new Response(null, { status: 204, headers: { "x-removidas": String(antes - t.linhas.length) } });
    }
    const dados = corpo.length ? JSON.parse(dec.decode(corpo)) : {};
    const novas: Record<string, unknown>[] = Array.isArray(dados) ? dados : [dados];
    if (req.method === "PATCH") {
      const tocadas = t.linhas.filter(casa);
      for (const l of tocadas) Object.assign(l, novas[0]);
      return (req.headers.get("prefer") ?? "").includes("return=representation") ? Response.json(tocadas) : new Response(null, { status: 204 });
    }
    if (req.method === "POST") {
      const mesclar = (req.headers.get("prefer") ?? "").includes("resolution=merge-duplicates");
      const conflito = u.searchParams.get("on_conflict")?.split(",") ?? t.pk;
      for (const n of novas) {
        for (const c of Object.keys(n)) if (t.colunas && !t.colunas.includes(c)) return erro(400, "PGRST204", `Could not find the '${c}' column of '${nome}' in the schema cache`);
        for (const c of t.obrigatorias ?? []) if (n[c] == null) return erro(400, "23502", `null value in column "${c}" of relation "${nome}" violates not-null constraint`);
        const i = t.linhas.findIndex((l) => conflito.every((c) => String(l[c]) === String(n[c])));
        if (i >= 0 && !mesclar) return erro(409, "23505", `duplicate key value violates unique constraint "${nome}_pkey"`);
        if (i >= 0) Object.assign(t.linhas[i], n); else t.linhas.push({ ...n });
      }
      return new Response(null, { status: 201 });
    }
    return erro(405, "PGRST000", "método não suportado no mock");
  }

  // ── Auth ─────────────────────────────────────────────────────────────────
  private auth(req: Request, u: URL, corpo: Uint8Array): Response {
    const p = u.pathname.slice("/auth/v1/".length);
    const dados = corpo.length ? JSON.parse(dec.decode(corpo)) : {};
    if (p === "health") return Response.json({ name: "GoTrue" });
    if (p === "token") {
      const ok = this.usuarios.find((x) => x.email === dados.email && x.senha === dados.password);
      return ok ? Response.json({ access_token: "tok-" + ok.id, token_type: "bearer" }) : Response.json({ error: "invalid_grant" }, { status: 400 });
    }
    if (p === "admin/users" && req.method === "GET") {
      const pagina = Number(u.searchParams.get("page") ?? "1");
      const por = Number(u.searchParams.get("per_page") ?? "50");
      const fatia = this.usuarios.slice((pagina - 1) * por, pagina * por).map(({ senha: _s, ...resto }) => resto);
      return Response.json({ users: fatia, aud: "authenticated" }, { headers: { "x-total-count": String(this.usuarios.length) } });
    }
    if (p === "admin/generate_link") { this.linksGerados.push(dados.email); return Response.json({ action_link: `${this.url}/verify?token=SEGREDO-${dados.email}`, email: dados.email }); }
    if (p === "recover") { this.recuperacoes.push(dados.email); return Response.json({}); }
    return Response.json({ error: "rota" }, { status: 404 });
  }
}

export interface Saida { code: number; out: string; err: string }
/** Roda um script Deno em subprocesso com ambiente controlado (sem herdar segredos). */
export async function rodar(script: string, env: Record<string, string>, args: string[] = [], cwd?: string): Promise<Saida> {
  const r = await new Deno.Command(Deno.execPath(), {
    args: ["run", "--no-lock", "--node-modules-dir=none", "-A", script, ...args],
    env: { ...env, NO_COLOR: "1" }, cwd, stdout: "piped", stderr: "piped",
  }).output();
  return { code: r.code, out: dec.decode(r.stdout), err: dec.decode(r.stderr) };
}
