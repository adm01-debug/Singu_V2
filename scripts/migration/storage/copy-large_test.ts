// Testes de storage/copy-large.ts (download em pedaços com retomada em disco).
import assert from "node:assert/strict";
import { MockSupabase, rodar } from "../_mock_supabase.ts";
import { ajustes, parseEnv } from "./_lib.ts";
import { copiarGrande, nomeCkpt, pontoDeRetomada, type InfoOrigem } from "./copy-large.ts";

ajustes.baseDelayMs = 1;
const dados = new Uint8Array(3000).map((_, i) => (i % 251) + 1); // nenhum byte zero
async function cena(extra: Record<string, string> = {}) {
  const a = await MockSupabase.iniciar(), b = await MockSupabase.iniciar();
  const dir = await Deno.makeTempDir({ prefix: "g7-large-" });
  const vars: Record<string, string> = { SRC_SUPABASE_URL: a.url, SRC_SERVICE_ROLE_KEY: "k1", DEST_SUPABASE_URL: b.url, DEST_SERVICE_ROLE_KEY: "k2", RETRY_BASE_MS: "1", ...extra };
  a.objeto("docs", "v/g d.bin", dados, { contentType: "video/mp4", cacheControl: "max-age=60" }); b.bucket("docs");
  const op = { bucket: "docs", object: "v/g d.bin", chunk: 1000, threshold: 10, ckptDir: dir };
  return { a, b, dir, vars, op, env: parseEnv((k) => vars[k]), fim: async () => { await a.parar(); await b.parar(); await Deno.remove(dir, { recursive: true }); } };
}
const calado = async <T>(f: () => Promise<T>): Promise<T> => {
  const [l, w] = [console.log, console.warn];
  console.log = console.warn = () => {};
  try { return await f(); } finally { console.log = l; console.warn = w; }
};

Deno.test("pontoDeRetomada: só retoma se origem não mudou e o parcial cobre o checkpoint", () => {
  const o: InfoOrigem = { size: 3000, contentType: "", cacheControl: "", etag: "e1" };
  assert.equal(pontoDeRetomada(null, o, 0), 0);
  assert.equal(pontoDeRetomada({ uploaded: 1000, size: 3000, etag: "e1" }, o, 1000), 1000);
  assert.equal(pontoDeRetomada({ uploaded: 1000, size: 3000, etag: "e1" }, o, 2500), 1000);
  assert.equal(pontoDeRetomada({ uploaded: 1000, size: 3000, etag: "e1" }, o, 400), 0); // parcial menor: recomeça
  assert.equal(pontoDeRetomada({ uploaded: 1000, size: 3000, etag: "OUTRO" }, o, 1000), 0); // origem mudou
  assert.equal(pontoDeRetomada({ uploaded: 1000, size: 9999, etag: "e1" }, o, 1000), 0);
  assert.equal(pontoDeRetomada({ uploaded: 5000, size: 3000, etag: "e1" }, o, 5000), 0);
  assert.equal(pontoDeRetomada({ uploaded: NaN, size: 3000, etag: "e1" }, o, 5000), 0);
});
Deno.test("nomeCkpt: 'a/b' e 'a_b' não colidem e o nome é seguro", async () => {
  const [x, y] = [await nomeCkpt("docs", "a/b"), await nomeCkpt("docs", "a_b")];
  assert.notEqual(x, y); assert.match(x, /^[0-9a-f]{32}$/);
});

Deno.test("cópia completa em pedaços preserva bytes, content-type e cache-control; limpa checkpoint", async () => {
  const c = await cena();
  try {
    assert.equal(await calado(() => copiarGrande(c.env, c.op)), "copiado");
    const o = c.b.objetos.get("docs")!.get("v/g d.bin")!;
    assert.deepEqual(o.corpo, dados);
    assert.equal(o.contentType, "video/mp4"); // antes: lia "mimetype" (campo inexistente) e gravava octet-stream
    assert.equal(o.cacheControl, "max-age=60");
    assert.equal(c.a.contar("GET", /authenticated\/docs/), 3);
    assert.deepEqual([...Deno.readDirSync(c.dir)], []);
  } finally { await c.fim(); }
});

Deno.test("retomada após queda no meio: continua do byte certo e o resultado é idêntico (antes: 1.000 bytes zerados)", async () => {
  const c = await cena();
  try {
    c.a.falhar("GET", /authenticated\/docs/, [0, 404]); // 1º pedaço ok, 2º falha sem retry
    await assert.rejects(calado(() => copiarGrande(c.env, c.op)), /chunk 1000-1999 falhou/);
    assert.equal(c.b.objetos.get("docs")!.size, 0, "nada pode subir pela metade");
    const antes = c.a.contar("GET", /authenticated\/docs/);
    assert.equal(await calado(() => copiarGrande(c.env, c.op)), "copiado");
    assert.equal(c.a.contar("GET", /authenticated\/docs/) - antes, 2, "só os 2 pedaços que faltavam");
    assert.deepEqual(c.b.objetos.get("docs")!.get("v/g d.bin")!.corpo, dados);
  } finally { await c.fim(); }
});

Deno.test("checkpoint órfão (sem arquivo parcial) ou de objeto que mudou na origem recomeça do zero", async () => {
  const c = await cena();
  try {
    const nome = await nomeCkpt("docs", "v/g d.bin");
    await Deno.writeTextFile(`${c.dir}/${nome}.json`, JSON.stringify({ uploaded: 1000, size: 3000, etag: "qualquer" }));
    await Deno.writeFile(`${c.dir}/${nome}.part`, new Uint8Array(1000)); // zeros de uma versão antiga
    assert.equal(await calado(() => copiarGrande(c.env, c.op)), "copiado");
    assert.deepEqual(c.b.objetos.get("docs")!.get("v/g d.bin")!.corpo, dados);
  } finally { await c.fim(); }
});

Deno.test("servidor que ignora Range (200 em vez de 206) é erro, nunca arquivo errado", async () => {
  const c = await cena();
  try {
    const semRange: typeof fetch = (input, init) => {
      const h = new Headers(init?.headers); h.delete("range");
      return fetch(input, { ...init, headers: h });
    };
    await assert.rejects(calado(() => copiarGrande(c.env, { ...c.op, fetchFn: semRange })), /esperado 206/);
    assert.equal(c.b.objetos.get("docs")!.size, 0);
  } finally { await c.fim(); }
});

Deno.test("abaixo do threshold e DRY_RUN não escrevem; upload 503 é retentado com corpo íntegro", async () => {
  const c = await cena();
  try {
    assert.equal(await calado(() => copiarGrande(c.env, { ...c.op, threshold: 10_000 })), "abaixo-do-limite");
    assert.equal(await calado(() => copiarGrande({ ...c.env, DRY_RUN: true }, c.op)), "dry-run");
    assert.equal(c.b.contar("POST", /./), 0);
    c.b.falhar("POST", /object\/docs/, [503]);
    assert.equal(await calado(() => copiarGrande(c.env, c.op)), "copiado");
    assert.deepEqual(c.b.objetos.get("docs")!.get("v/g d.bin")!.corpo, dados);
  } finally { await c.fim(); }
});

Deno.test("processo: sem BUCKET/OBJECT sai 2; objeto inexistente sai 1; sucesso sai 0", async () => {
  const c = await cena();
  const script = new URL("./copy-large.ts", import.meta.url).pathname;
  try {
    assert.equal((await rodar(script, c.vars)).code, 2);
    const v = { ...c.vars, BUCKET: "docs", CHUNK_BYTES: "1000", LARGE_THRESHOLD: "10", LARGE_CKPT_DIR: c.dir };
    let r = await rodar(script, { ...v, OBJECT: "nao-existe" });
    assert.equal(r.code, 1); assert.match(r.err, /INFO da origem falhou: HTTP 404/);
    r = await rodar(script, { ...v, OBJECT: "v/g d.bin" });
    assert.equal(r.code, 0, r.err); assert.match(r.out, /copiado \(3000 bytes\)/);
    assert.equal((await rodar(script, { ...v, OBJECT: "v/g d.bin", CHUNK_BYTES: "0" })).code, 2);
  } finally { await c.fim(); }
});
