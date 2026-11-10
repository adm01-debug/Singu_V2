// Testes de compliance/lgpd-snapshot.ts.
import assert from "node:assert/strict";
import { MockSupabase, rodar } from "../_mock_supabase.ts";
import { assinar, canonico, hashTabela, montarManifesto, TABELAS, verificarManifesto, type LeitorPagina } from "./lgpd-snapshot.ts";

const SCRIPT = new URL("./lgpd-snapshot.ts", import.meta.url).pathname;
const SEGREDO = "segredo-de-teste-com-32-caracteres!!";
const leitorDe = (dados: Record<string, Record<string, unknown>[]>): LeitorPagina => (t, cols, apos, lim) => {
  if (!(t in dados)) return Promise.reject(new Error(`${t}: relation does not exist`));
  const ord = [...dados[t]].sort((a, b) => (String(a.id) < String(b.id) ? -1 : 1));
  return Promise.resolve(ord.filter((l) => apos === null || String(l.id) > apos).slice(0, lim).map((l) => Object.fromEntries(cols.map((c) => [c, l[c] ?? null]))));
};
const base = () => Object.fromEntries(TABELAS.map((t) => [t.tabela, [{ id: "a1", created_at: "2026-01-01", updated_at: "2026-01-02", email: "pii@exemplo.com", nome: "Fulano" }]]));
function popular(m: MockSupabase, n = 3) {
  for (const t of TABELAS) m.tabela(t.tabela, ["id"], Array.from({ length: n }, (_, i) => ({ id: `id-${String(i).padStart(5, "0")}`, created_at: "2026-01-01T00:00:00+00:00", updated_at: "2026-01-02T00:00:00+00:00", email: `pessoa${i}@exemplo.com`, cpf: "123.456.789-00" })), { colunas: [...t.colunas, "email", "cpf"] });
}

Deno.test("canonico: independe da ordem das chaves", () => {
  assert.equal(canonico({ b: 1, a: [{ d: 1, c: 2 }] }), canonico({ a: [{ c: 2, d: 1 }], b: 1 }));
  assert.equal(canonico({ a: undefined, b: null }), `{"b":null}`);
});
Deno.test("hashTabela: cobre TODAS as linhas (2.500, paginado), muda com 1 linha alterada/removida, independe da paginação", async () => {
  const linhas = Array.from({ length: 2500 }, (_, i) => ({ id: String(i).padStart(6, "0"), created_at: "x" }));
  const a = await hashTabela(leitorDe({ t: linhas }), "t", ["id", "created_at"]);
  assert.equal(a.count, 2500);
  assert.equal((await hashTabela(leitorDe({ t: linhas }), "t", ["id", "created_at"], 7)).rows_hash, a.rows_hash);
  const alterada = linhas.map((l, i) => (i === 2400 ? { ...l, created_at: "y" } : l)); // além da linha 500 (limite antigo)
  assert.notEqual((await hashTabela(leitorDe({ t: alterada }), "t", ["id", "created_at"])).rows_hash, a.rows_hash);
  assert.notEqual((await hashTabela(leitorDe({ t: linhas.slice(0, 2499) }), "t", ["id", "created_at"])).rows_hash, a.rows_hash);
  assert.equal((await hashTabela(leitorDe({ t: [] }), "t", ["id"])).count, 0);
});
Deno.test("manifesto: sem PII, assinatura cobre tudo; qualquer adulteração invalida; segredo errado invalida", async () => {
  const m = await montarManifesto(leitorDe(base()), "https://destino.exemplo", SEGREDO, new Date("2026-11-09T00:00:00Z"), () => {});
  const txt = JSON.stringify(m);
  assert.ok(!txt.includes("pii@exemplo.com") && !txt.includes("Fulano") && !txt.includes(SEGREDO));
  assert.equal(m.tables.length, 7); assert.equal(m.version, "1.1");
  assert.equal(await verificarManifesto(m, SEGREDO), true);
  assert.equal(await verificarManifesto(m, SEGREDO + "x"), false);
  assert.equal(await verificarManifesto({ ...m, generated_at: "2020-01-01T00:00:00.000Z" }, SEGREDO), false); // antes: data/destino não eram assinados
  assert.equal(await verificarManifesto({ ...m, destination: "https://outro" }, SEGREDO), false);
  assert.equal(await verificarManifesto({ ...m, tables: m.tables.map((t, i) => (i ? t : { ...t, count: 999 })) }, SEGREDO), false);
  assert.equal(await verificarManifesto({ ...m, signature: undefined }, SEGREDO), false);
  const corpo = { version: m.version, generated_at: m.generated_at, destination: m.destination, tables: m.tables, aggregate_hash: m.aggregate_hash };
  assert.equal(await assinar(SEGREDO, corpo), m.signature);
});
Deno.test("tabela que não pôde ser lida: erro (antes: count=null e hash de '[]' num manifesto 'válido')", async () => {
  const dados = base(); delete dados.deals;
  await assert.rejects(montarManifesto(leitorDe(dados), "d", SEGREDO, new Date(), () => {}), /deals/);
});
Deno.test("processo: gera arquivo 600 sem PII, --verify aceita, adulterado/segredo errado sai 1, tabela ausente sai 1 sem arquivo, config sai 2", async () => {
  const m = await MockSupabase.iniciar();
  const dir = await Deno.makeTempDir({ prefix: "g7-lgpd-" });
  const env = { DEST_SUPABASE_URL: m.url, DEST_SERVICE_ROLE_KEY: "chave-secreta", LGPD_MANIFEST_SECRET: SEGREDO, LGPD_OUT_DIR: dir };
  try {
    assert.equal((await rodar(SCRIPT, { ...env, LGPD_MANIFEST_SECRET: "curto" })).code, 2);
    assert.equal((await rodar(SCRIPT, { LGPD_MANIFEST_SECRET: SEGREDO })).code, 2);
    let r = await rodar(SCRIPT, env);
    assert.equal(r.code, 1); assert.match(r.err, /manifesto NÃO gerado/); assert.deepEqual([...Deno.readDirSync(dir)], []);
    popular(m, 1203);
    r = await rodar(SCRIPT, env);
    assert.equal(r.code, 0, r.err); assert.match(r.out, /contacts: count=1203/);
    const [arq] = [...Deno.readDirSync(dir)].map((e) => `${dir}/${e.name}`);
    assert.equal((await Deno.stat(arq)).mode! & 0o777, 0o600);
    const txt = await Deno.readTextFile(arq);
    assert.ok(!/pessoa\d+@|123\.456|chave-secreta|segredo-de-teste/.test(txt));
    assert.ok(!(r.out + r.err).includes("chave-secreta") && !(r.out + r.err).includes(SEGREDO));
    assert.equal((await rodar(SCRIPT, { LGPD_MANIFEST_SECRET: SEGREDO }, ["--verify", arq])).code, 0);
    assert.equal((await rodar(SCRIPT, { LGPD_MANIFEST_SECRET: SEGREDO + "outro" }, ["--verify", arq])).code, 1);
    await Deno.writeTextFile(`${dir}/adulterado.json`, txt.replace(`"count": 1203`, `"count": 1204`));
    assert.equal((await rodar(SCRIPT, { LGPD_MANIFEST_SECRET: SEGREDO }, ["--verify", `${dir}/adulterado.json`])).code, 1);
    assert.equal((await rodar(SCRIPT, { LGPD_MANIFEST_SECRET: SEGREDO }, ["--verify", `${dir}/nao-existe.json`])).code, 2);
    // interactions/call_logs/user_roles não têm updated_at no schema real: o script não pode pedir essa coluna
    const pedidas = m.reqs.filter((q) => q.path.endsWith("/user_roles")).map((q) => new URLSearchParams(q.search).get("select"));
    assert.deepEqual([...new Set(pedidas)], ["id"]);
  } finally { await m.parar(); await Deno.remove(dir, { recursive: true }); }
});
