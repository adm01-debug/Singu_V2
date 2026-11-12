// Testes de monitoring/synthetic-checks.ts contra servidor falso.
import assert from "node:assert/strict";
import { MockSupabase, rodar } from "../_mock_supabase.ts";
import { laco, lerConfig as lerSint, reportSentry, rodada, ErroConfig as ErroSint } from "./synthetic-checks.ts";

const SINT = new URL("./synthetic-checks.ts", import.meta.url).pathname;
async function cena() {
  const m = await MockSupabase.iniciar();
  m.usuarios = [{ id: "u1", email: "teste@exemplo.com", senha: "s3nha" }];
  m.tabela("contacts", ["id"], [{ id: 1 }]); m.tabela("companies", ["id"], []);
  const sint: Record<string, string> = { APP_URL: m.url, DEST_SUPABASE_URL: m.url, DEST_ANON_KEY: "anon", SYNTHETIC_EMAIL: "teste@exemplo.com", SYNTHETIC_PASSWORD: "s3nha", INTERVAL_MS: "0", CHECK_TIMEOUT_MS: "400" };
  return { m, sint };
}

Deno.test("synthetic lerConfig: INTERVAL_MS=abc/negativo/1..999 são erro (antes: 'abc' virava laço sem pausa — 136 rodadas em 3 s)", () => {
  const b: Record<string, string> = { APP_URL: "https://a", DEST_SUPABASE_URL: "https://b", DEST_ANON_KEY: "k", SYNTHETIC_EMAIL: "e", SYNTHETIC_PASSWORD: "p" };
  const com = (x: Record<string, string>) => lerSint((k) => ({ ...b, ...x } as Record<string, string>)[k]);
  assert.equal(com({}).intervalMs, 300000); assert.equal(com({ INTERVAL_MS: "0" }).intervalMs, 0);
  for (const v of ["abc", "-5", "500"]) assert.throws(() => com({ INTERVAL_MS: v }), ErroSint);
  assert.throws(() => lerSint(() => undefined), ErroSint);
});
Deno.test("synthetic rodada: saudável = 5 OK; login sem token FALHA e os checks dependentes aparecem como não executados (antes: sumiam e a rodada passava)", async () => {
  const { m, sint } = await cena();
  try {
    const cfg = lerSint((k) => sint[k]);
    let r = await rodada(cfg);
    assert.deepEqual(r.map((x) => [x.name, x.ok]), [["app.healthcheck", true], ["auth.login", true], ["db.contacts", true], ["db.companies", true], ["edge.health", false]]);
    m.statusFuncoes = 200;
    assert.ok((await rodada(cfg)).every((x) => x.ok));
    const semToken: typeof fetch = (i, init) => (String(i).includes("/auth/v1/token") ? Promise.resolve(Response.json({})) : fetch(i, init));
    r = await rodada(cfg, semToken);
    assert.equal(r.length, 5); assert.equal(r.filter((x) => !x.ok).length, 4); assert.match(r[2].error!, /não executado/);
    m.falhar("GET", /rest\/v1\/companies/, [500]);
    assert.deepEqual((await rodada(cfg)).filter((x) => !x.ok).map((x) => x.name), ["db.companies"]);
    m.falhar("GET", /^\/$/, [0], { atrasoMs: 1200 });
    const lenta = await rodada(cfg);
    assert.equal(lenta[0].error, "timeout");
    await new Promise((ok) => setTimeout(ok, 1000));
  } finally { await m.parar(); }
});
Deno.test("synthetic laço: MAX_RUNS para, sai 1 se alguma rodada falhou, dorme INTERVAL entre rodadas; Sentry só em falha e nunca derruba", async () => {
  const { m, sint } = await cena();
  const [l, e] = [console.log, console.error]; console.log = console.error = () => {};
  try {
    m.statusFuncoes = 200;
    const sonos: number[] = [];
    const cfg = { ...lerSint((k) => sint[k]), intervalMs: 5000, maxRuns: 3 };
    assert.equal(await laco(cfg, { dormir: (ms) => { sonos.push(ms); return Promise.resolve(); } }), 0);
    assert.deepEqual(sonos, [5000, 5000]);
    m.falhar("GET", /rest\/v1\/contacts/, [503]);
    assert.equal(await laco(cfg, { dormir: () => Promise.resolve() }), 1);
    const ctl = new AbortController(); ctl.abort();
    assert.equal(await laco({ ...cfg, maxRuns: 0 }, { parar: ctl.signal, dormir: () => Promise.reject(new Error("não deveria dormir")) }), 0);
    const chamadas: string[] = [];
    const falso: typeof fetch = (i) => { chamadas.push(String(i)); return Promise.reject(new Error("sentry fora")); };
    const comSentry = { ...cfg, sentry: "https://chavepub@sentry.exemplo/42" };
    await reportSentry(comSentry, [{ name: "a", ok: true, durationMs: 1 }], falso);
    assert.equal(chamadas.length, 0);
    await reportSentry(comSentry, [{ name: "a", ok: false, durationMs: 1, error: "500" }], falso);
    assert.match(chamadas[0], /^https:\/\/sentry\.exemplo\/api\/42\/store\/\?sentry_key=chavepub/);
  } finally { console.log = l; console.error = e; await m.parar(); }
});
Deno.test("synthetic processo: rodada única 0/1; config inválida 2; senha nunca aparece", async () => {
  const { m, sint } = await cena();
  try {
    m.statusFuncoes = 200;
    let r = await rodar(SINT, sint);
    assert.equal(r.code, 0, r.out + r.err); assert.equal(r.out.trim().split("\n").length, 5);
    m.statusApp = 500;
    r = await rodar(SINT, sint);
    assert.equal(r.code, 1); assert.match(r.out, /FAIL app\.healthcheck\s+\d+ms 500/); assert.ok(!(r.out + r.err).includes("s3nha"));
    assert.equal((await rodar(SINT, { ...sint, INTERVAL_MS: "abc" })).code, 2);
    r = await rodar(SINT, { ...sint, INTERVAL_MS: "1000", MAX_RUNS: "2" });
    assert.equal(r.code, 1); assert.equal(r.out.match(/app\.healthcheck/g)!.length, 2);
  } finally { await m.parar(); }
});
