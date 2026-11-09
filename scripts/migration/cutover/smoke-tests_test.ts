// Testes de cutover/smoke-tests.ts contra servidor falso.
import assert from "node:assert/strict";
import { MockSupabase, rodar } from "../_mock_supabase.ts";
import { ErroConfig, executar, lerConfig, montarChecks } from "./smoke-tests.ts";

const SMOKE = new URL("./smoke-tests.ts", import.meta.url).pathname;
const mudo = { ok: () => {}, erro: () => {} };
async function cena() {
  const m = await MockSupabase.iniciar();
  m.usuarios = [{ id: "u1", email: "teste@exemplo.com", senha: "s3nha" }];
  m.tabela("contacts", ["id"], [{ id: 1 }]); m.tabela("companies", ["id"], []);
  const env: Record<string, string> = { TEST_URL: m.url, DEST_SUPABASE_URL: m.url, DEST_ANON_KEY: "anon", TEST_EMAIL: "teste@exemplo.com", TEST_PASSWORD: "s3nha", SMOKE_TIMEOUT_MS: "400" };
  return { m, env };
}
const smoke = async (env: Record<string, string>) => executar(montarChecks(lerConfig((k) => env[k])), mudo);

Deno.test("smoke lerConfig: obrigatórias, e-mail sem senha, timeout e tabela inválidos", () => {
  assert.throws(() => lerConfig(() => undefined), ErroConfig);
  const b: Record<string, string> = { DEST_SUPABASE_URL: "http://x/", DEST_ANON_KEY: "k" };
  assert.equal(lerConfig((k) => b[k]).supabaseUrl, "http://x");
  assert.throws(() => lerConfig((k) => ({ ...b, TEST_EMAIL: "a@b" } as Record<string, string>)[k]), /juntos/);
  assert.throws(() => lerConfig((k) => ({ ...b, SMOKE_TIMEOUT_MS: "abc" } as Record<string, string>)[k]), ErroConfig);
  assert.throws(() => lerConfig((k) => ({ ...b, SMOKE_TABLE: "a;b" } as Record<string, string>)[k]), ErroConfig);
});
Deno.test("smoke: tudo saudável passa; função opcional 404 conta como PULADA, não aprovada", async () => {
  const { m, env } = await cena();
  try {
    assert.deepEqual(await smoke(env), { passaram: 5, falharam: 0, pulados: 1 });
    m.statusFuncoes = 200;
    assert.deepEqual(await smoke(env), { passaram: 6, falharam: 0, pulados: 0 });
  } finally { await m.parar(); }
});
Deno.test("smoke: HTTP 500 em cada ponto FALHA (app, auth, REST, login, função)", async () => {
  const { m, env } = await cena();
  try {
    for (const [metodo, re] of [["GET", /^\/$/], ["GET", /auth\/v1\/health/], ["GET", /rest\/v1\/contacts/], ["POST", /auth\/v1\/token/], ["GET", /functions\/v1/]] as [string, RegExp][]) {
      m.falhar(metodo, re, [500]);
      const r = await smoke(env);
      assert.ok(r.falharam >= 1, `${re} devia falhar: ${JSON.stringify(r)}`);
    }
    assert.equal((await smoke(env)).falharam, 0);
  } finally { await m.parar(); }
});
Deno.test("smoke: chave inválida (401) e tabela inexistente (404) FALHAM (antes: 'Data API responde' passava com qualquer 4xx)", async () => {
  const { m, env } = await cena();
  try {
    m.falhar("GET", /rest\/v1\/contacts/, [401]);
    assert.equal((await smoke(env)).falharam, 1);
    m.tabelas.delete("contacts");
    assert.equal((await smoke(env)).falharam, 2); // anon + autenticado
  } finally { await m.parar(); }
});
Deno.test("smoke: 'permission denied' para anon é aceito; para usuário logado é falha (chaos revoke-grant)", async () => {
  const negado = () => Response.json({ code: "42501", message: "permission denied for table contacts" }, { status: 401 });
  const { m, env } = await cena();
  try {
    const cfg = lerConfig((k) => env[k]);
    const soAnon: typeof fetch = (i, init) => (String(i).includes("/rest/v1/contacts") && new Headers(init?.headers).get("authorization") === "Bearer anon" ? Promise.resolve(negado()) : fetch(i, init));
    assert.equal((await executar(montarChecks(cfg, soAnon), mudo)).falharam, 0);
    const todos: typeof fetch = (i, init) => (String(i).includes("/rest/v1/contacts") ? Promise.resolve(negado()) : fetch(i, init));
    const r = await executar(montarChecks(cfg, todos), mudo);
    assert.equal(r.falharam, 1);
  } finally { await m.parar(); }
});
Deno.test("smoke: servidor pendurado estoura o timeout (antes: esperava para sempre); login sem token falha; corpo vazio falha", async () => {
  const { m, env } = await cena();
  try {
    m.falhar("GET", /auth\/v1\/health/, [0], { atrasoMs: 1500 });
    const t0 = Date.now();
    const erros: string[] = [];
    const r = await executar(montarChecks(lerConfig((k) => env[k])), { ok: () => {}, erro: (x) => erros.push(x) });
    assert.equal(r.falharam, 1); assert.match(erros[0], /timeout após 400ms/); assert.ok(Date.now() - t0 < 1400);
    const semToken: typeof fetch = (i, init) => (String(i).includes("/auth/v1/token") ? Promise.resolve(Response.json({})) : fetch(i, init));
    assert.equal((await executar(montarChecks(lerConfig((k) => env[k]), semToken), mudo)).falharam, 2);
    const vazio: typeof fetch = (i, init) => (String(i) === m.url ? Promise.resolve(new Response("")) : fetch(i, init));
    assert.equal((await executar(montarChecks(lerConfig((k) => env[k]), vazio), mudo)).falharam, 1);
    await new Promise((ok) => setTimeout(ok, 1200)); // deixa a resposta atrasada do mock terminar
  } finally { await m.parar(); }
});
Deno.test("smoke processo: 0 saudável, 1 com falha (sem vazar senha), 2 sem env; sem credenciais o login aparece como pulado", async () => {
  const { m, env } = await cena();
  try {
    let r = await rodar(SMOKE, env);
    assert.equal(r.code, 0, r.out + r.err); assert.match(r.out, /5\/5 passaram \(1 pulado/);
    r = await rodar(SMOKE, { ...env, TEST_PASSWORD: "errada-SECRETA" });
    assert.equal(r.code, 1); assert.ok(!(r.out + r.err).includes("errada-SECRETA") && !(r.out + r.err).includes("teste@exemplo.com"));
    const { TEST_EMAIL: _e, TEST_PASSWORD: _p, ...sem } = env;
    r = await rodar(SMOKE, sem);
    assert.equal(r.code, 0); assert.match(r.out, /– Login com credenciais de teste \(pulado\)/);
    assert.equal((await rodar(SMOKE, {})).code, 2);
    m.statusApp = 500;
    assert.equal((await rodar(SMOKE, env)).code, 1);
  } finally { await m.parar(); }
});

