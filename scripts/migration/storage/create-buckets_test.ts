// Testes de storage/create-buckets.ts e list-buckets.ts.
import assert from "node:assert/strict";
import { MockSupabase, rodar } from "../_mock_supabase.ts";
import { ajustes, parseEnv, type Bucket } from "./_lib.ts";
import { bucketEqual, planejar, sincronizarBuckets } from "./create-buckets.ts";
import { inventariar } from "./list-buckets.ts";

ajustes.baseDelayMs = 1;
const bk = (id: string, o: Partial<Bucket> = {}): Bucket => ({ id, name: id, public: false, file_size_limit: null, allowed_mime_types: null, ...o });
async function par(extra: Record<string, string> = {}) {
  const a = await MockSupabase.iniciar(), b = await MockSupabase.iniciar();
  const vars: Record<string, string> = { SRC_SUPABASE_URL: a.url, SRC_SERVICE_ROLE_KEY: "k1", DEST_SUPABASE_URL: b.url, DEST_SERVICE_ROLE_KEY: "k2", RETRY_BASE_MS: "1", ...extra };
  return { a, b, vars, env: parseEnv((k) => vars[k]), fim: async () => { await a.parar(); await b.parar(); } };
}
const calado = async <T>(f: () => Promise<T>): Promise<T> => {
  const [l, e, w] = [console.log, console.error, console.warn];
  console.log = console.error = console.warn = () => {};
  try { return await f(); } finally { console.log = l; console.error = e; console.warn = w; }
};

Deno.test("bucketEqual/planejar: ordem dos mime types não importa; mudança de público/limite é detectada", () => {
  assert.ok(bucketEqual(bk("a", { allowed_mime_types: ["x", "y"] }), bk("a", { allowed_mime_types: ["y", "x"] })));
  assert.ok(bucketEqual(bk("a", { allowed_mime_types: [] }), bk("a")));
  assert.ok(!bucketEqual(bk("a", { public: true }), bk("a")));
  assert.ok(!bucketEqual(bk("a", { file_size_limit: 5 }), bk("a")));
  assert.deepEqual(planejar([bk("a"), bk("b", { public: true }), bk("c")], [bk("a"), bk("b")]).map((p) => p.acao), ["identico", "atualizar", "criar"]);
});
Deno.test("cria, atualiza e é idempotente na 2ª execução", async () => {
  const { a, b, env, fim } = await par();
  try {
    a.bucket("novo", true, { file_size_limit: 1024, allowed_mime_types: ["image/png"] }); a.bucket("muda", true); a.bucket("igual");
    b.bucket("muda", false); b.bucket("igual");
    let r = await calado(() => sincronizarBuckets(env));
    assert.deepEqual(r, { created: 1, updated: 1, identical: 1, failed: 0, planned: 0 });
    assert.deepEqual({ ...b.buckets.get("novo") }, { id: "novo", name: "novo", public: true, file_size_limit: 1024, allowed_mime_types: ["image/png"] });
    assert.equal(b.buckets.get("muda")!.public, true);
    const escritas = b.contar("POST", /bucket/) + b.contar("PUT", /bucket/);
    r = await calado(() => sincronizarBuckets(env));
    assert.deepEqual(r, { created: 0, updated: 0, identical: 3, failed: 0, planned: 0 });
    assert.equal(b.contar("POST", /bucket/) + b.contar("PUT", /bucket/), escritas);
  } finally { await fim(); }
});
Deno.test("DRY_RUN não escreve; 409 na criação cai para PUT; erro 400 é contado como falha", async () => {
  const { a, b, env, fim } = await par();
  try {
    a.bucket("x", true);
    let r = await calado(() => sincronizarBuckets({ ...env, DRY_RUN: true }));
    assert.equal(r.planned, 1); assert.equal(b.buckets.size, 0); assert.equal(b.contar("POST", /./), 0);
    b.falhar("POST", /\/bucket$/, [409]); b.bucket("x", false); b.buckets.delete("x"); b.bucket("x", false);
    const corrida: typeof fetch = (i, init) => (init?.method === "GET" && String(i).startsWith(b.url) ? Promise.resolve(Response.json([])) : fetch(i, init));
    r = await calado(() => sincronizarBuckets(env, corrida));
    assert.deepEqual({ updated: r.updated, failed: r.failed }, { updated: 1, failed: 0 });
    a.bucket("y"); b.falhar("POST", /\/bucket$/, [400]);
    r = await calado(() => sincronizarBuckets(env));
    assert.equal(r.failed, 1);
  } finally { await fim(); }
});
Deno.test("processo create-buckets: falha sai 1, ok sai 0, ONLY_BUCKET inexistente sai 2", async () => {
  const { a, b, vars, fim } = await par();
  const script = new URL("./create-buckets.ts", import.meta.url).pathname;
  try {
    a.bucket("x");
    assert.equal((await rodar(script, { ...vars, ONLY_BUCKET: "zzz" })).code, 2);
    b.falhar("POST", /\/bucket$/, [403]);
    assert.equal((await rodar(script, vars)).code, 1);
    const r = await rodar(script, vars);
    assert.equal(r.code, 0, r.err); assert.match(r.out, /criados=1/);
  } finally { await fim(); }
});
Deno.test("list-buckets: conta arquivos e bytes de todas as páginas e pastas; processo imprime TOTAL", async () => {
  const { a, vars, env, fim } = await par();
  try {
    for (let i = 0; i < 1203; i++) a.objeto("docs", `p${i % 3}/f${i}`, "12345");
    a.bucket("vazio", true);
    const linhas = await inventariar(env);
    assert.deepEqual(linhas, [{ id: "docs", public: false, files: 1203, bytes: 6015 }, { id: "vazio", public: true, files: 0, bytes: 0 }]);
    a.maxListLimit = 100;
    assert.equal((await inventariar(env))[0].files, 1203);
    const r = await rodar(new URL("./list-buckets.ts", import.meta.url).pathname, vars);
    assert.equal(r.code, 0, r.err); assert.match(r.out, /TOTAL\s+1203/);
    a.falhar("GET", /\/bucket$/, [401]);
    assert.equal((await rodar(new URL("./list-buckets.ts", import.meta.url).pathname, vars)).code, 1);
  } finally { await fim(); }
});
