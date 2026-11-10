// Testes de storage/verify-counts.ts.
import assert from "node:assert/strict";
import { MockSupabase, rodar } from "../_mock_supabase.ts";
import { ajustes, parseEnv, type StorageObject } from "./_lib.ts";
import { amostrar, compararListagens, verificar } from "./verify-counts.ts";

ajustes.baseDelayMs = 1;
const o = (name: string, size: number, eTag = "", mimetype = "text/plain"): StorageObject => ({ name, id: "x", updated_at: null, created_at: null, last_accessed_at: null, metadata: { size, eTag, mimetype } });
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
const M1 = "a".repeat(32), M2 = "b".repeat(32);

Deno.test("compararListagens: faltando, sobrando, tamanho, ETag e mimetype", () => {
  const d = compararListagens(
    [o("igual", 1, M1), o("falta", 1), o("tam", 5), o("etag", 4, M1), o("mime", 2, "", "image/png"), o("multipart", 9, `${M1}-2`)],
    [o("igual", 1, M1), o("sobra", 1), o("tam", 6), o("etag", 4, M2), o("mime", 2, "", "text/plain"), o("multipart", 9, M2)],
  );
  assert.deepEqual(d.missing, ["falta"]); assert.deepEqual(d.extra, ["sobra"]);
  assert.equal(d.divergentes.length, 3);
  assert.match(d.divergentes.join("|"), /tam \(size 5≠6\).*etag \(etag.*mime \(mimetype image\/png≠text\/plain\)/);
});
Deno.test("amostrar: determinístico com rng fixo, sem repetição e limitado ao total", () => {
  const itens = [1, 2, 3, 4, 5];
  const s = amostrar(itens, 3, () => 0);
  assert.deepEqual(s, [1, 2, 3]); assert.equal(amostrar(itens, 99).length, 5); assert.equal(new Set(amostrar(itens, 5)).size, 5);
  assert.deepEqual(amostrar([], 3), []);
});

Deno.test("paridade completa passa; mesma contagem e tamanho com CONTEÚDO diferente falha (antes: 'Paridade completa')", async () => {
  const { a, b, env, fim } = await par();
  try {
    for (let i = 0; i < 30; i++) { a.objeto("docs", `d/f${i}`, "AAAA"); b.objeto("docs", `d/f${i}`, "AAAA"); }
    let r = await calado(() => verificar(env));
    assert.equal(r[0].ok, true); assert.equal(r[0].src_count, 30);
    b.objeto("docs", "d/f17", "ZZZZ");
    r = await calado(() => verificar(env));
    assert.equal(r[0].ok, false); assert.equal(r[0].mismatches, 1);
    assert.match(r[0].sample_mismatches[0], /d\/f17 \(etag/);
  } finally { await fim(); }
});
Deno.test("mesma contagem com nomes diferentes: acusa faltando E sobrando (30 objetos, fora de qualquer amostra)", async () => {
  const { a, b, env, fim } = await par();
  try {
    for (let i = 0; i < 30; i++) { a.objeto("docs", `f${i}`, "x"); b.objeto("docs", i === 29 ? "outro" : `f${i}`, "x"); }
    const r = await calado(() => verificar(env, { amostra: 0 }));
    assert.deepEqual({ ok: r[0].ok, missing: r[0].missing, extra: r[0].extra, s: r[0].src_count, d: r[0].dest_count }, { ok: false, missing: 1, extra: 1, s: 30, d: 30 });
  } finally { await fim(); }
});
Deno.test("bucket ausente no destino, HEAD que falha e listagem com 1.500 objetos em páginas de 100", async () => {
  const { a, b, env, fim } = await par();
  try {
    a.bucket("so-na-origem");
    for (let i = 0; i < 1500; i++) { a.objeto("docs", `f${i}`, "x"); b.objeto("docs", `f${i}`, "x"); }
    a.maxListLimit = 100; b.maxListLimit = 100;
    let r = await calado(() => verificar(env, { amostra: 5 }));
    assert.deepEqual(r.map((x) => [x.bucket, x.ok, x.src_count]).sort(), [["docs", true, 1500], ["so-na-origem", false, -1]]);
    b.falhar("HEAD", /authenticated\/docs/, [404, 404, 404]); // listagem diz que existe, mas não é servido
    r = await calado(() => verificar({ ...env, ONLY_BUCKET: "docs" }, { amostra: 1 }));
    assert.equal(r[0].ok, false); assert.match(r[0].sample_mismatches[0], /HEAD 404/);
  } finally { await fim(); }
});
Deno.test("processo: divergência sai 1 e grava relatório; paridade sai 0; origem sem bucket sai 1", async () => {
  const { a, b, vars, fim } = await par();
  const tmp = await Deno.makeTempDir();
  const script = new URL("./verify-counts.ts", import.meta.url).pathname;
  try {
    const v = { ...vars, VERIFY_REPORT: `${tmp}/r.json` };
    let r = await rodar(script, v);
    assert.equal(r.code, 1); assert.match(r.err, /Nenhum bucket/); // nada verificado nunca é "paridade"
    a.objeto("docs", "a", "1"); b.objeto("docs", "a", "1");
    r = await rodar(script, v);
    assert.equal(r.code, 0, r.err); assert.match(r.out, /Paridade completa/);
    b.objeto("docs", "extra", "1");
    r = await rodar(script, v);
    assert.equal(r.code, 1);
    const rel = JSON.parse(await Deno.readTextFile(`${tmp}/r.json`));
    assert.equal(rel[0].extra, 1); assert.equal(rel[0].ok, false);
  } finally { await fim(); await Deno.remove(tmp, { recursive: true }); }
});
