// Testes de storage/_lib.ts — rodar: deno test --no-lock --node-modules-dir=none -A scripts/migration/storage/_lib_test.ts
import assert from "node:assert/strict";
import { MockSupabase } from "../_mock_supabase.ts";
import { ajustes, encodePath, ErroConfig, etagEhMd5, etagLimpo, filtrarBuckets, fmtBytes, headObjeto, intEnv, iterObjects, listBuckets, parseEnv, redact, retryFetch, runPool, type Bucket } from "./_lib.ts";

ajustes.baseDelayMs = 1;
const base = { SRC_SUPABASE_URL: "https://a.exemplo", SRC_SERVICE_ROLE_KEY: "k1", DEST_SUPABASE_URL: "https://b.exemplo/", DEST_SERVICE_ROLE_KEY: "k2" };
const env = (extra: Record<string, string> = {}) => parseEnv((k) => ({ ...base, ...extra } as Record<string, string>)[k]);

Deno.test("parseEnv: padrões, barra final removida e variável ausente", () => {
  const e = env();
  assert.equal(e.DEST_SUPABASE_URL, "https://b.exemplo");
  assert.equal(e.CONCURRENCY, 8);
  assert.equal(e.DRY_RUN, false);
  assert.throws(() => parseEnv(() => undefined), ErroConfig);
});
Deno.test("parseEnv: CONCURRENCY=abc/0/-1 é erro (antes virava NaN e nada era copiado, saída 0)", () => {
  for (const v of ["abc", "0", "-1", "1.5"]) assert.throws(() => env({ CONCURRENCY: v }), /CONCURRENCY inválido/);
  assert.equal(env({ CONCURRENCY: " 3 " }).CONCURRENCY, 3);
});
Deno.test("parseEnv: DRY_RUN só aceita 0/1/true/false; URL inválida e origem=destino são erro", () => {
  assert.equal(env({ DRY_RUN: "1" }).DRY_RUN, true);
  assert.equal(env({ DRY_RUN: "true" }).DRY_RUN, true);
  assert.throws(() => env({ DRY_RUN: "sim" }), /DRY_RUN inválido/);
  assert.throws(() => env({ SRC_SUPABASE_URL: "nao-e-url" }), /não é uma URL/);
  assert.throws(() => env({ DEST_SUPABASE_URL: "https://a.exemplo/" }), /iguais/);
});
Deno.test("intEnv: vazio usa padrão; lixo lança", () => {
  assert.equal(intEnv(() => "", "X", 7), 7);
  assert.throws(() => intEnv(() => "7x", "X", 7), ErroConfig);
});
Deno.test("redact: JWT, senha em URL e token de query não vazam", () => {
  const s = redact("erro eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abc.def em postgres://postgres:S3nh4@db.x:5432/p ?token=abc123&x=1");
  assert.ok(!s.includes("S3nh4") && !s.includes("abc123") && !s.includes("IkpXVCJ9"), s);
});
Deno.test("encodePath: espaço, acento, #, ?, % e + codificados; barras preservadas", () => {
  assert.equal(encodePath("pasta a/ação #1?.txt"), "pasta%20a/a%C3%A7%C3%A3o%20%231%3F.txt");
  assert.equal(encodePath("100%/a+b"), "100%25/a%2Bb");
});
Deno.test("etag: limpa aspas/W/ e distingue MD5 de multipart", () => {
  assert.equal(etagLimpo('W/"ABCDEF"'), "abcdef");
  assert.ok(etagEhMd5("d41d8cd98f00b204e9800998ecf8427e"));
  assert.ok(!etagEhMd5("d41d8cd98f00b204e9800998ecf8427e-3"));
});
Deno.test("fmtBytes", () => { assert.equal(fmtBytes(1536), "1.5 KiB"); assert.equal(fmtBytes(0), "0.0 B"); });

Deno.test("retryFetch: 503,429 → sucesso na 3ª tentativa", async () => {
  const m = await MockSupabase.iniciar();
  try {
    m.bucket("b"); m.falhar("GET", /\/bucket$/, [503, 429]);
    const r = await retryFetch(`${m.url}/storage/v1/bucket`, { method: "GET" }, { retries: 3 });
    assert.equal(r.status, 200); await r.body?.cancel();
    assert.equal(m.contar("GET", /\/bucket$/), 3);
  } finally { await m.parar(); }
});
Deno.test("retryFetch: 4xx não é retentado; 5xx esgotado lança sem dormir depois da última", async () => {
  const m = await MockSupabase.iniciar();
  try {
    m.falhar("GET", /\/bucket$/, [404]);
    const r = await retryFetch(`${m.url}/storage/v1/bucket`, {}, { retries: 3 }); await r.body?.cancel();
    assert.equal(r.status, 404); assert.equal(m.contar("GET", /\/bucket$/), 1);
    m.falhar("GET", /\/bucket$/, [500, 500, 500]);
    const sonos: number[] = [];
    await assert.rejects(retryFetch(`${m.url}/storage/v1/bucket`, {}, { retries: 2, sleep: (ms) => { sonos.push(ms); return Promise.resolve(); } }), /HTTP 500/);
    assert.equal(sonos.length, 2);
  } finally { await m.parar(); }
});
Deno.test("retryFetch: respeita Retry-After e tem timeout", async () => {
  const m = await MockSupabase.iniciar();
  try {
    m.falhar("GET", /\/bucket$/, [429], { headers: { "retry-after": "7" } });
    const sonos: number[] = [];
    const r = await retryFetch(`${m.url}/storage/v1/bucket`, {}, { sleep: (ms) => { sonos.push(ms); return Promise.resolve(); } }); await r.body?.cancel();
    assert.ok(sonos[0] >= 7000, String(sonos[0]));
    m.falhar("GET", /\/bucket$/, [0, 0], { atrasoMs: 300 });
    await assert.rejects(retryFetch(`${m.url}/storage/v1/bucket`, {}, { retries: 1, timeoutMs: 50 }), /timeout em/);
  } finally { await m.parar(); }
});
Deno.test("retryFetch: fábrica de init é chamada a cada tentativa (corpo em stream reenviável)", async () => {
  const m = await MockSupabase.iniciar();
  try {
    m.bucket("b"); m.falhar("POST", /object\/b\//, [503]);
    let chamadas = 0;
    const r = await retryFetch(`${m.url}/storage/v1/object/b/x`, () => { chamadas++; return { method: "POST", body: new Blob(["abc"]).stream() }; }, { retries: 2 });
    await r.body?.cancel();
    assert.equal(chamadas, 2);
    assert.equal(new TextDecoder().decode(m.objetos.get("b")!.get("x")!.corpo), "abc");
  } finally { await m.parar(); }
});

Deno.test("iterObjects: 2.500 objetos, pastas aninhadas e servidor que limita a página em 100", async () => {
  const m = await MockSupabase.iniciar();
  try {
    for (let i = 0; i < 2500; i++) m.objeto("b", `f${String(i).padStart(4, "0")}`, "x");
    m.objeto("b", "p1/p2/p3/fundo.txt", "y"); m.objeto("b", "p1/irmão.txt", "z");
    const contar = async () => { let n = 0; const nomes = new Set<string>(); for await (const o of iterObjects(m.url, "k", "b")) { n++; nomes.add(o.name); } return { n, nomes }; };
    let r = await contar();
    assert.equal(r.n, 2502); assert.ok(r.nomes.has("p1/p2/p3/fundo.txt") && r.nomes.has("p1/irmão.txt"));
    m.maxListLimit = 100; // antes: parava na 1ª página (100 < 1000) e perdia 2.400 objetos
    r = await contar();
    assert.equal(r.nomes.size, 2502);
  } finally { await m.parar(); }
});
Deno.test("iterObjects: erro HTTP na listagem lança (não devolve lista parcial como se fosse tudo)", async () => {
  const m = await MockSupabase.iniciar();
  try {
    await assert.rejects(async () => { for await (const _ of iterObjects(m.url, "k", "nao-existe")) { /* */ } }, /HTTP 404/);
  } finally { await m.parar(); }
});
Deno.test("iterObjects: servidor que ignora offset é detectado (sem loop infinito)", async () => {
  const pagina = JSON.stringify([{ name: "a", id: "1", metadata: { size: 1 } }]);
  const falso = (() => Promise.resolve(new Response(pagina))) as typeof fetch;
  await assert.rejects(async () => { for await (const _ of iterObjects("http://x.invalid", "k", "b", "", falso)) { /* */ } }, /ignorou offset/);
});
Deno.test("listBuckets: resposta que não é lista lança; filtrarBuckets rejeita ONLY_BUCKET inexistente", async () => {
  const falso = (() => Promise.resolve(Response.json({ error: "x" }))) as typeof fetch;
  await assert.rejects(listBuckets("http://x.invalid", "k", falso), /não é lista/);
  const bs = [{ id: "a" }, { id: "b" }] as Bucket[];
  assert.deepEqual(filtrarBuckets(bs, "b").map((b) => b.id), ["b"]);
  assert.equal(filtrarBuckets(bs, "").length, 2);
  assert.throws(() => filtrarBuckets(bs, "zzz"), ErroConfig);
});
Deno.test("headObjeto: 200 traz tamanho/etag; inexistente não lança", async () => {
  const m = await MockSupabase.iniciar();
  try {
    m.objeto("b", "a b.txt", "olá");
    const h = await headObjeto(m.url, "k", "b", "a b.txt");
    assert.equal(h.ok, true); assert.equal(h.size, 4); assert.ok(etagEhMd5(h.etag));
    assert.equal((await headObjeto(m.url, "k", "b", "nada")).ok, false);
  } finally { await m.parar(); }
});

async function* gerar(n: number) { for (let i = 0; i < n; i++) yield i; }
Deno.test("runPool: nunca passa da concorrência e processa tudo", async () => {
  let emVoo = 0, pico = 0; const feitos: number[] = [];
  await runPool(gerar(50), async (i) => { emVoo++; pico = Math.max(pico, emVoo); await new Promise((r) => setTimeout(r, 2)); emVoo--; feitos.push(i); }, 4);
  assert.equal(feitos.length, 50); assert.equal(pico, 4);
});
Deno.test("runPool: concorrência inválida lança; erro do worker é relançado depois de drenar; lista vazia ok", async () => {
  await assert.rejects(runPool(gerar(3), () => Promise.resolve(), NaN), ErroConfig);
  await assert.rejects(runPool(gerar(3), () => Promise.resolve(), 0), ErroConfig);
  let feitos = 0;
  await assert.rejects(runPool(gerar(10), (i) => { if (i === 2) return Promise.reject(new Error("boom")); feitos++; return Promise.resolve(); }, 2), /boom/);
  assert.ok(feitos >= 2 && feitos < 10);
  await runPool(gerar(0), () => Promise.reject(new Error("nunca")), 3);
});
Deno.test("runPool: erro na própria listagem é propagado", async () => {
  async function* quebra() { yield 1; throw new Error("list falhou"); }
  await assert.rejects(runPool(quebra(), () => Promise.resolve(), 2), /list falhou/);
});
