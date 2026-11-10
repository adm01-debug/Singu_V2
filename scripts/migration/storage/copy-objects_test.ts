// Testes de storage/copy-objects.ts contra dois Storages falsos em 127.0.0.1.
import assert from "node:assert/strict";
import { MockSupabase, rodar } from "../_mock_supabase.ts";
import { ajustes, parseEnv, type Env, type InfoDestino } from "./_lib.ts";
import { copiarTudo, criarLimitador, jaReplicado } from "./copy-objects.ts";

ajustes.baseDelayMs = 1;
const txt = (b?: Uint8Array) => (b ? new TextDecoder().decode(b) : undefined);
async function par(extra: Record<string, string> = {}) {
  const a = await MockSupabase.iniciar(), b = await MockSupabase.iniciar();
  const vars: Record<string, string> = { SRC_SUPABASE_URL: a.url, SRC_SERVICE_ROLE_KEY: "chave-origem", DEST_SUPABASE_URL: b.url, DEST_SERVICE_ROLE_KEY: "chave-destino", RETRY_BASE_MS: "1", ...extra };
  const env: Env = parseEnv((k) => vars[k]);
  return { a, b, env, vars, fim: async () => { await a.parar(); await b.parar(); } };
}
const calado = async <T>(f: () => Promise<T>): Promise<T> => {
  const [l, e, w] = [console.log, console.error, console.warn];
  console.log = console.error = console.warn = () => {};
  try { return await f(); } finally { console.log = l; console.error = e; console.warn = w; }
};
const SCRIPT = new URL("./copy-objects.ts", import.meta.url).pathname;

Deno.test("jaReplicado: tamanho+ETag iguais pula; mesmo tamanho com MD5 diferente NÃO pula", () => {
  const d = (o: Partial<InfoDestino>): InfoDestino => ({ ok: true, status: 200, size: 4, etag: "", contentType: "", cacheControl: "", ...o });
  const m1 = "a".repeat(32), m2 = "b".repeat(32);
  assert.equal(jaReplicado(4, m1, d({ etag: m1 })), true);
  assert.equal(jaReplicado(4, m1, d({ etag: m2 })), false);
  assert.equal(jaReplicado(4, m1, d({ size: 5, etag: m1 })), false);
  assert.equal(jaReplicado(4, `${m1}-2`, d({ etag: m2 })), true); // multipart: só tamanho
  assert.equal(jaReplicado(0, "", d({ size: 0 })), false); // vazio sem ETag: recopia
  assert.equal(jaReplicado(0, m1, d({ size: 0, etag: m1 })), true);
  assert.equal(jaReplicado(4, m1, d({ ok: false, status: 404 })), false);
  assert.equal(jaReplicado(undefined, m1, d({ etag: m1 })), false);
});

Deno.test("copia tudo: pastas aninhadas, nomes com espaço/acento/#/?/%, contentType, cacheControl e metadata de usuário", async () => {
  const { a, b, env, fim } = await par();
  try {
    b.bucket("docs");
    const nomes = ["pasta a/sub/ação #1?.txt", "x/y/z/w.txt", "100%.txt", "a+b&c=d.txt", "raiz.txt", "vazio.bin"];
    for (const n of nomes) a.objeto("docs", n, n === "vazio.bin" ? "" : `conteúdo de ${n}`, { contentType: "text/plain", cacheControl: "max-age=86400", userMetadata: { dono: "ana", nível: 3 } });
    const t = await calado(() => copiarTudo(env));
    assert.deepEqual({ ok: t.ok, fail: t.fail, skipped: t.skipped }, { ok: 6, fail: 0, skipped: 0 });
    const destino = b.objetos.get("docs")!;
    assert.deepEqual([...destino.keys()].sort(), [...nomes].sort());
    const o = destino.get("pasta a/sub/ação #1?.txt")!;
    assert.equal(txt(o.corpo), "conteúdo de pasta a/sub/ação #1?.txt");
    assert.equal(o.contentType, "text/plain"); assert.equal(o.cacheControl, "max-age=86400");
    assert.deepEqual(o.userMetadata, { dono: "ana", nível: 3 }); // antes: metadata de usuário era perdida
    assert.equal(destino.get("vazio.bin")!.corpo.length, 0);
  } finally { await fim(); }
});

Deno.test("retomada: 2ª execução pula tudo; objeto alterado com MESMO tamanho é recopiado", async () => {
  const { a, b, env, fim } = await par();
  try {
    b.bucket("docs"); a.objeto("docs", "a.txt", "AAAA"); a.objeto("docs", "b.txt", "BBBB");
    await calado(() => copiarTudo(env));
    const uploads = b.contar("POST", /object\/docs\//);
    let t = await calado(() => copiarTudo(env));
    assert.deepEqual({ ok: t.ok, skipped: t.skipped }, { ok: 0, skipped: 2 });
    assert.equal(b.contar("POST", /object\/docs\//), uploads, "retomada não pode reenviar");
    a.objeto("docs", "a.txt", "ZZZZ"); // mesmo tamanho, conteúdo novo (antes: SKIP e destino ficava velho)
    t = await calado(() => copiarTudo(env));
    assert.deepEqual({ ok: t.ok, skipped: t.skipped }, { ok: 1, skipped: 1 });
    assert.equal(txt(b.objetos.get("docs")!.get("a.txt")!.corpo), "ZZZZ");
  } finally { await fim(); }
});

Deno.test("objeto acima do limite vai por arquivo temporário e o upload sobrevive a 503 (antes: 'Bad resource ID')", async () => {
  const { a, b, env, fim } = await par({ STREAM_TMPFILE_THRESHOLD: "1000" });
  try {
    b.bucket("docs");
    const dados = new Uint8Array(50_000).map((_, i) => i % 251);
    a.objeto("docs", "grande.bin", dados);
    b.falhar("POST", /object\/docs\//, [503, 429]);
    const t = await calado(() => copiarTudo(env));
    assert.deepEqual({ ok: t.ok, fail: t.fail }, { ok: 1, fail: 0 });
    assert.deepEqual(b.objetos.get("docs")!.get("grande.bin")!.corpo, dados);
    assert.equal(b.contar("POST", /object\/docs\//), 3);
  } finally { await fim(); }
});

Deno.test("falha em um objeto não derruba os outros, é contada e registrada sem segredo", async () => {
  const { a, b, env, fim } = await par();
  try {
    b.bucket("docs"); for (const n of ["a", "b", "c"]) a.objeto("docs", n, n.repeat(10));
    a.falhar("GET", /authenticated\/docs\/b$/, [404]);
    const linhas: Record<string, unknown>[] = [];
    const t = await calado(() => copiarTudo(env, { log: (l) => { linhas.push(l); } }));
    assert.deepEqual({ ok: t.ok, fail: t.fail }, { ok: 2, fail: 1 });
    assert.equal(linhas.filter((l) => l.status === "fail").length, 1);
    assert.ok(!JSON.stringify(linhas).includes("chave-"));
  } finally { await fim(); }
});

Deno.test("download truncado e upload corrompido são detectados (não contam como OK)", async () => {
  const { a, b, env, fim } = await par();
  try {
    b.bucket("docs"); a.objeto("docs", "a", "0123456789");
    // origem devolve menos bytes do que a listagem anuncia
    const corta: typeof fetch = async (input, init) => {
      const r = await fetch(input, init);
      return String(input).includes("/object/authenticated/docs/a") && (init?.method ?? "GET") === "GET" && String(input).startsWith(a.url)
        ? new Response((await r.arrayBuffer()).slice(0, 4), { status: 200 }) : r;
    };
    let t = await calado(() => copiarTudo(env, { fetchFn: corta }));
    assert.deepEqual({ ok: t.ok, fail: t.fail }, { ok: 0, fail: 1 });
    assert.equal(b.objetos.get("docs")!.size, 0);
    // destino grava outra coisa: verificação pós-upload pega
    const estraga: typeof fetch = async (input, init) => {
      const r = await fetch(input, init);
      if (init?.method === "POST" && String(input).includes("/object/docs/a")) b.objeto("docs", "a", "XXXXXXXXXX");
      return r;
    };
    t = await calado(() => copiarTudo(env, { fetchFn: estraga }));
    assert.deepEqual({ ok: t.ok, fail: t.fail }, { ok: 0, fail: 1 });
  } finally { await fim(); }
});

Deno.test("DRY_RUN não baixa nem envia nada", async () => {
  const { a, b, env, fim } = await par({ DRY_RUN: "1" });
  try {
    b.bucket("docs"); a.objeto("docs", "a", "x");
    const t = await calado(() => copiarTudo(env));
    assert.equal(t.ok, 1);
    assert.equal(b.contar("POST", /./), 0); assert.equal(a.contar("GET", /object\/authenticated/), 0);
    assert.equal(b.objetos.get("docs")!.size, 0);
  } finally { await fim(); }
});

Deno.test("concorrência é respeitada com 300 objetos e todos chegam", async () => {
  const { a, b, env, fim } = await par({ CONCURRENCY: "5" });
  try {
    b.bucket("docs"); for (let i = 0; i < 300; i++) a.objeto("docs", `d${i % 7}/f${i}`, `c${i}`);
    const t = await calado(() => copiarTudo(env, { preservarMetadata: false, verificarAposPut: false }));
    assert.equal(t.ok, 300); assert.equal(b.objetos.get("docs")!.size, 300);
    assert.ok(b.picoEmUso <= 5, `pico no destino = ${b.picoEmUso}`);
  } finally { await fim(); }
});

Deno.test("INFO indisponível na origem vira aviso (copia sem metadata) e não falha", async () => {
  const { a, b, env, fim } = await par();
  try {
    b.bucket("docs"); a.objeto("docs", "a", "x", { userMetadata: { k: 1 } });
    a.falhar("GET", /object\/info\//, [404]);
    const t = await calado(() => copiarTudo(env));
    assert.deepEqual({ ok: t.ok, fail: t.fail, avisos: t.avisos }, { ok: 1, fail: 0, avisos: 1 });
  } finally { await fim(); }
});

Deno.test("criarLimitador: acima do teto espera; 0 = ilimitado", async () => {
  let agora = 0; const sonos: number[] = [];
  const lim = criarLimitador(100, () => agora, (ms) => { sonos.push(ms); agora += ms; return Promise.resolve(); });
  await lim(60); assert.equal(sonos.length, 0);
  await lim(60); assert.equal(sonos.length, 1);
  const livre = criarLimitador(0, () => 0, () => { throw new Error("não deveria dormir"); });
  await livre(1e9);
});

Deno.test("processo: CONCURRENCY=abc sai 2; ONLY_BUCKET inexistente sai 2; falha sai 1; sucesso sai 0 e grava log JSONL", async () => {
  const { a, b, vars, fim } = await par();
  const tmp = await Deno.makeTempDir();
  try {
    b.bucket("docs"); a.objeto("docs", "a.txt", "aaa");
    const v = { ...vars, STORAGE_COPY_LOG: `${tmp}/copia.log` };
    let r = await rodar(SCRIPT, { ...v, CONCURRENCY: "abc" });
    assert.equal(r.code, 2, r.err); assert.match(r.err, /CONCURRENCY inválido/);
    r = await rodar(SCRIPT, { ...v, ONLY_BUCKET: "nao-existe" });
    assert.equal(r.code, 2, r.err);
    r = await rodar(SCRIPT, v);
    assert.equal(r.code, 0, r.err); assert.match(r.out, /TOTAL: OK=1 SKIP=0 FAIL=0/);
    const log = (await Deno.readTextFile(`${tmp}/copia.log`)).trim().split("\n").map((l) => JSON.parse(l));
    assert.equal(log.at(-1).status, "ok");
    a.objeto("docs", "b.txt", "bbb"); a.falhar("GET", /authenticated\/docs\/b\.txt/, [403]);
    r = await rodar(SCRIPT, v);
    assert.equal(r.code, 1); assert.match(r.out, /FAIL=1/);
    assert.ok(!(r.out + r.err).includes("chave-origem") && !(r.out + r.err).includes("chave-destino"));
    r = await rodar(SCRIPT, { DEST_SUPABASE_URL: b.url });
    assert.equal(r.code, 2);
  } finally { await fim(); await Deno.remove(tmp, { recursive: true }); }
});
