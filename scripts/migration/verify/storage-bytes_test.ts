// Testes de verify/storage-bytes.ts e verify/storage-public-guard.ts.
import assert from "node:assert/strict";
import { MockSupabase, rodar } from "../_mock_supabase.ts";
import { ajustes, parseEnv } from "../storage/_lib.ts";
import { sha256Objeto, tamanhoAmostra, verificarBytes } from "./storage-bytes.ts";
import { parseAllowlist, violacoes } from "./storage-public-guard.ts";

ajustes.baseDelayMs = 1;
async function par() {
  const a = await MockSupabase.iniciar(), b = await MockSupabase.iniciar();
  const vars: Record<string, string> = { SRC_SUPABASE_URL: a.url, SRC_SERVICE_ROLE_KEY: "k1", DEST_SUPABASE_URL: b.url, DEST_SERVICE_ROLE_KEY: "k2", RETRY_BASE_MS: "1" };
  return { a, b, vars, env: parseEnv((k) => vars[k]), fim: async () => { await a.parar(); await b.parar(); } };
}
const calado = async <T>(f: () => Promise<T>): Promise<T> => {
  const [l, e, w] = [console.log, console.error, console.warn];
  console.log = console.error = console.warn = () => {};
  try { return await f(); } finally { console.log = l; console.error = e; console.warn = w; }
};

Deno.test("tamanhoAmostra: mínimo 1, teto por bucket, vazio = 0", () => {
  assert.equal(tamanhoAmostra(0, 0.5, 100), 0);
  assert.equal(tamanhoAmostra(10, 0.5, 100), 1);
  assert.equal(tamanhoAmostra(1000, 50, 100), 100);
  assert.equal(tamanhoAmostra(3, 100, 100), 3);
});
Deno.test("sha256Objeto: hash correto em stream; download que não é 200 lança", async () => {
  const { a, fim } = await par();
  try {
    a.objeto("b", "é isso.txt", "abc");
    assert.equal(await sha256Objeto(a.url, "k", "b", "é isso.txt", 5000), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    await assert.rejects(sha256Objeto(a.url, "k", "b", "nada", 5000), /download HTTP 404/);
  } finally { await fim(); }
});
Deno.test("iguais passam; conteúdo diferente acusa; erro de download nos DOIS lados não vira 'OK' (antes: hash da página de erro batia)", async () => {
  const { a, b, env, fim } = await par();
  try {
    for (let i = 0; i < 5; i++) { a.objeto("docs", `f${i}`, `c${i}`); b.objeto("docs", `f${i}`, `c${i}`); }
    let r = await calado(() => verificarBytes(env, { pct: 100, max: 100 }));
    assert.deepEqual(r, [{ bucket: "docs", total: 5, sampled: 5, mismatches: [] }]);
    b.objeto("docs", "f3", "cX");
    r = await calado(() => verificarBytes(env, { pct: 100, max: 100 }));
    assert.equal(r[0].mismatches.length, 1); assert.match(r[0].mismatches[0], /^f3 src=/);
    b.objeto("docs", "f3", "c3");
    a.falhar("GET", /authenticated\/docs\/f1/, [404]); b.falhar("GET", /authenticated\/docs\/f1/, [404]);
    r = await calado(() => verificarBytes(env, { pct: 100, max: 100 }));
    assert.equal(r[0].mismatches.length, 1); assert.match(r[0].mismatches[0], /f1 err=origem: download HTTP 404/);
  } finally { await fim(); }
});
Deno.test("processo storage-bytes: 0 em paridade, 1 em divergência, 1 quando nada foi amostrado, 2 em config", async () => {
  const { a, b, vars, fim } = await par();
  const tmp = await Deno.makeTempDir();
  const script = new URL("./storage-bytes.ts", import.meta.url).pathname;
  try {
    const v = { ...vars, BYTES_REPORT: `${tmp}/b.json`, BYTES_SAMPLE_PCT: "100" };
    a.bucket("docs"); b.bucket("docs");
    assert.equal((await rodar(script, v)).code, 1); // bucket vazio: nada verificado
    a.objeto("docs", "x", "1"); b.objeto("docs", "x", "1");
    assert.equal((await rodar(script, v)).code, 0);
    b.objeto("docs", "x", "2");
    assert.equal((await rodar(script, v)).code, 1);
    assert.equal((await rodar(script, { ...v, BYTES_SAMPLE_PCT: "abc" })).code, 2);
  } finally { await fim(); await Deno.remove(tmp, { recursive: true }); }
});

Deno.test("allowlist: comentários, CRLF e comentário na mesma linha", () => {
  assert.deepEqual([...parseAllowlist("# c\r\npublic-assets  # logo\r\n\r\n  avatars  \n")], ["public-assets", "avatars"]);
});
Deno.test("violacoes: só bucket público fora do allowlist; casa por id ou name", () => {
  const al = new Set(["public-assets"]);
  assert.deepEqual(violacoes([{ name: "public-assets", public: true }, { name: "privado", public: false }], al), []);
  assert.deepEqual(violacoes([{ name: "vazou", public: true }, { id: "public-assets", name: "Outro Nome", public: true }], al).map((b) => b.name), ["vazou"]);
});
Deno.test("processo storage-public-guard (node e deno): 0 limpo, 1 violação, 1 API fora, 2 sem env", async () => {
  const m = await MockSupabase.iniciar();
  const script = new URL("./storage-public-guard.ts", import.meta.url).pathname;
  const node = async (env: Record<string, string>) => (await new Deno.Command("node", { args: ["--experimental-strip-types", "--no-warnings", script], env, clearEnv: true, stdout: "piped", stderr: "piped" }).output()).code;
  try {
    const env = { DEST_SUPABASE_URL: m.url, DEST_SERVICE_ROLE_KEY: "k", PATH: Deno.env.get("PATH") ?? "" };
    m.bucket("public-assets", true); m.bucket("privado", false);
    assert.equal((await rodar(script, env)).code, 0); assert.equal(await node(env), 0);
    m.bucket("vazou", true);
    const r = await rodar(script, env);
    assert.equal(r.code, 1); assert.match(r.err, /vazou/); assert.equal(await node(env), 1);
    m.falhar("GET", /\/bucket$/, [500, 500]);
    assert.equal((await rodar(script, env)).code, 1); assert.equal(await node(env), 1);
    assert.equal((await rodar(script, {})).code, 2); assert.equal(await node({ PATH: env.PATH }), 2);
  } finally { await m.parar(); }
});
