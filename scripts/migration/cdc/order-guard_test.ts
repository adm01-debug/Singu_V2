// Testes de cdc/order-guard.ts — lógica pura sempre; coletor real com Postgres se PGHOST definido.
import assert from "node:assert/strict";
import { rodar } from "../_mock_supabase.ts";
import { derrubar, motivoPulo, recriar, sql, temPg, urlDe } from "../_pg_teste.ts";
import { avaliar, cmpLsn, desvio, estadoInicial, parseLsn, vigiar, type Ciclo } from "./order-guard.ts";

const rel = (epoch: number, t0 = 1_000_000, lat = 10) => ({ epoch, t0, t1: t0 + lat });
const ok = (lsn: string, extra: Partial<Ciclo> = {}): Ciclo => ({ slotLsn: lsn, destLsn: null, src: rel(1000.005), dst: rel(1000.005), ...extra });
const mudo = { log: () => {}, dormir: () => Promise.resolve() };

Deno.test("parseLsn/cmpLsn: compara por valor (A/0 > 9/FFFFFFFF) e rejeita lixo", () => {
  assert.equal(parseLsn("0/16B2D30"), 0x16B2D30n);
  assert.equal(parseLsn("CHAOS/BADLSN"), null); assert.equal(parseLsn(""), null); assert.equal(parseLsn("1/"), null);
  assert.ok(cmpLsn("A/0", "9/FFFFFFFF") > 0); // comparação de texto diria o contrário
  assert.ok(cmpLsn("0/FFFFFFFF", "1/0") < 0); assert.equal(cmpLsn("1/A", "1/a"), 0);
  assert.throws(() => cmpLsn("x", "0/1"), /LSN inválido/);
});
Deno.test("desvio: latência de rede não conta como skew", () => {
  const d = desvio({ epoch: 1000.5, t0: 1_000_000, t1: 1_001_000 }); // 1s de latência, relógio igual ao ponto médio
  assert.equal(d.offset, 0); assert.equal(d.incerteza, 0.5);
});
Deno.test("avaliar: avanço normal, regressão do slot, regressão do checkpoint, slot ausente e erro de conexão", () => {
  let r = avaliar(estadoInicial(), ok("0/100"), 2);
  assert.deepEqual(r.violacoes, []); assert.equal(r.estado.ultimoLsn, "0/100");
  r = avaliar(r.estado, ok("0/100"), 2); assert.deepEqual(r.violacoes, []); // parado não é regressão
  r = avaliar(r.estado, ok("0/50"), 2);
  assert.match(r.violacoes[0], /LSN REGRESSION no slot/); assert.equal(r.estado.ultimoLsn, "0/100"); assert.equal(r.estado.consecutivas, 1);
  r = avaliar(r.estado, ok("0/200", { destLsn: "0/80" }), 2);
  assert.deepEqual(r.violacoes, []); assert.equal(r.estado.consecutivas, 0, "ciclo limpo zera o contador");
  r = avaliar(r.estado, ok("0/200", { destLsn: "0/70" }), 2); assert.match(r.violacoes[0], /checkpoint do destino/);
  assert.match(avaliar(estadoInicial(), ok("0/1", { slotLsn: null }), 2).violacoes[0], /slot de replicação não encontrado/);
  assert.match(avaliar(estadoInicial(), { erroSrc: "ECONNREFUSED" }, 2).violacoes[0], /origem inacessível/);
  assert.match(avaliar(estadoInicial(), ok("0/1", { erroDst: "timeout" }), 2).violacoes[0], /destino inacessível/);
  assert.match(avaliar(estadoInicial(), ok("lixo"), 2).violacoes[0], /ilegível/);
});
Deno.test("avaliar: skew real acima do limite é violação; latência alta sozinha não; relógio NaN é violação", () => {
  assert.match(avaliar(estadoInicial(), ok("0/1", { dst: rel(1005.005) }), 2).violacoes[0], /CLOCK SKEW=5\.00s/);
  assert.deepEqual(avaliar(estadoInicial(), ok("0/1", { dst: rel(1001.005) }), 2).violacoes, []);
  const lento = { epoch: 1002.0, t0: 1_000_000, t1: 1_004_000 }; // 4s de ida e volta
  assert.deepEqual(avaliar(estadoInicial(), ok("0/1", { dst: lento }), 2).violacoes, []);
  assert.match(avaliar(estadoInicial(), ok("0/1", { dst: rel(NaN) }), 2).violacoes[0], /ilegível/);
});
Deno.test("vigiar: aborta só com N violações CONSECUTIVAS (antes: contador nunca zerava); --once devolve 0/1", async () => {
  const fila = (cs: Ciclo[]) => { let i = 0; return () => Promise.resolve(cs[Math.min(i++, cs.length - 1)]); };
  const ruim: Ciclo = { erroSrc: "x" };
  const op = { skewMax: 2, pollMs: 0, maxViolacoes: 3, once: false, ...mudo };
  // 2 ruins, 1 bom, 2 ruins, 1 bom… nunca 3 seguidos → não aborta dentro de 12 ciclos
  assert.equal(await vigiar(fila([ruim, ruim, ok("0/1"), ruim, ruim, ok("0/2"), ruim, ruim, ok("0/3"), ok("0/4"), ok("0/5"), ok("0/6")]), { ...op, maxCiclos: 12 }), 0);
  let ciclos = 0;
  assert.equal(await vigiar(() => { ciclos++; return Promise.resolve(ruim); }, op), 1);
  assert.equal(ciclos, 3);
  assert.equal(await vigiar(fila([ok("0/1")]), { ...op, once: true }), 0);
  assert.equal(await vigiar(fila([ruim]), { ...op, once: true }), 1);
});

const SCRIPT = new URL("./order-guard.ts", import.meta.url).pathname;
Deno.test({ name: "Postgres: --once lê slot e checkpoint reais; slot inexistente e origem fora do ar saem 1 (antes: laço infinito); senha não vaza", ignore: !temPg, async fn() {
  const [A, B] = ["g7_og_src", "g7_og_dst"];
  const slot = "g7_og_slot";
  try {
    await recriar(A); await recriar(B);
    await sql("postgres", `SELECT pg_drop_replication_slot(slot_name) FROM pg_replication_slots WHERE slot_name = '${slot}'; SELECT pg_create_physical_replication_slot('${slot}', true);`);
    await sql(B, `CREATE TABLE public._migration_cdc_checkpoint (lsn text PRIMARY KEY, applied_at timestamptz DEFAULT now()); INSERT INTO public._migration_cdc_checkpoint(lsn) VALUES ('0/10'), ('A/0'), ('9/FFFFFFFF'), ('CHAOS/BADLSN');`);
    const env = { SRC_DB_URL: urlDe(A), DEST_DB_URL: urlDe(B), CDC_SLOT: slot };
    let r = await rodar(SCRIPT, env, ["--once"]);
    assert.equal(r.code, 0, r.out + r.err); assert.match(r.out, /✔ lsn=[0-9A-F]+\/[0-9A-F]+ destino=A\/0 skew=0\.\d\ds/);
    r = await rodar(SCRIPT, { ...env, CDC_SLOT: "g7_nao_existe" }, ["--once"]);
    assert.equal(r.code, 1); assert.match(r.out, /slot de replicação não encontrado/);
    r = await rodar(SCRIPT, { ...env, SRC_DB_URL: "postgres://u:SENHA-SECRETA@127.0.0.1:1/x", POLL_SEC: "0.1" });
    assert.equal(r.code, 1); assert.match(r.out, /3 ciclos consecutivos/); assert.ok(!(r.out + r.err).includes("SENHA-SECRETA"));
  } finally {
    await sql("postgres", `SELECT pg_drop_replication_slot(slot_name) FROM pg_replication_slots WHERE slot_name = '${slot}';`);
    await derrubar(A, B);
  }
} });
Deno.test("processo: sem env sai 2; POLL_SEC/SKEW inválidos saem 2", async () => {
  assert.equal((await rodar(SCRIPT, {})).code, 2);
  const env = { SRC_DB_URL: "postgres://u@127.0.0.1:1/x", DEST_DB_URL: "postgres://u@127.0.0.1:1/x" };
  assert.equal((await rodar(SCRIPT, { ...env, POLL_SEC: "abc" })).code, 2);
  assert.equal((await rodar(SCRIPT, { ...env, SKEW_MAX_SEC: "-1" })).code, 2);
});
if (!temPg) console.log(`order-guard: ${motivoPulo}`);
