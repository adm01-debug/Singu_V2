// Testes de cdc/replay.ts — wal2json v2 (formato que cdc/drain.sh grava) contra PostgREST falso.
import assert from "node:assert/strict";
import { MockSupabase, rodar } from "../_mock_supabase.ts";
import { Agrupador, destinoSupabase, lerDiretorio, paraFiltro, parseSemPerda, reproduzir, type Destino, type EntradaLinha } from "./replay.ts";

const col = (name: string, value: unknown, type = "text") => ({ name, type, value });
const B = (lsn: string) => JSON.stringify({ action: "B", lsn, nextlsn: lsn });
const C = (lsn: string) => JSON.stringify({ action: "C", lsn, nextlsn: lsn });
const I = (lsn: string, tabela: string, cols: ReturnType<typeof col>[], schema = "public") => JSON.stringify({ action: "I", lsn, schema, table: tabela, columns: cols });
const U = (lsn: string, tabela: string, cols: ReturnType<typeof col>[], ident: ReturnType<typeof col>[]) => JSON.stringify({ action: "U", lsn, schema: "public", table: tabela, columns: cols, identity: ident });
const D = (lsn: string, tabela: string, ident?: ReturnType<typeof col>[]) => JSON.stringify({ action: "D", lsn, schema: "public", table: tabela, ...(ident ? { identity: ident } : {}) });
const tx = (lsn: string, ...mud: string[]) => [B(lsn), ...mud, C(lsn)];
async function* de(linhas: string[], origem = "t.json"): AsyncGenerator<EntradaLinha> {
  for (let i = 0; i < linhas.length; i++) yield { texto: linhas[i], origem: `${origem}:${i + 1}`, ultimaSemQuebra: false };
}
/** Destino em memória que registra a ordem das operações. */
function memoria(lsns: string[] = []) {
  const ops: string[] = []; const linhas = new Map<string, Record<string, unknown>>();
  const d: Destino & { falharEm?: string } = {
    lsnsAplicados: () => Promise.resolve([...lsns]),
    marcar: (l) => { if (d.falharEm === `marcar:${l}`) return Promise.reject(new Error("checkpoint fora")); lsns.push(l); ops.push(`ck:${l}`); return Promise.resolve(); },
    upsert: (t, l) => { if (d.falharEm === `upsert:${l.id}`) return Promise.reject(new Error("503")); ops.push(`up:${t}:${paraFiltro(l.id)}`); linhas.set(`${t}:${paraFiltro(l.id)}`, { ...linhas.get(`${t}:${paraFiltro(l.id)}`), ...l }); return Promise.resolve(); },
    atualizar: (t, ch, l) => { const k = `${t}:${paraFiltro(ch.id)}`; if (!linhas.has(k)) return Promise.resolve(0); const v = { ...linhas.get(k), ...l }; linhas.delete(k); linhas.set(`${t}:${paraFiltro(l.id)}`, v); ops.push(`mv:${k}`); return Promise.resolve(1); },
    remover: (t, ch) => { ops.push(`rm:${t}:${paraFiltro(ch.id)}`); linhas.delete(`${t}:${paraFiltro(ch.id)}`); return Promise.resolve(); },
  };
  return { d, ops, linhas, lsns };
}
const quieto = { aviso: () => {} };

Deno.test("parseSemPerda: bigint, numeric longo e 1.50 sobrevivem ao JSON.stringify", () => {
  const o = parseSemPerda(`{"a":12345678901234567890,"b":1.50,"c":3,"d":"x"}`);
  assert.equal(JSON.stringify(o), `{"a":12345678901234567890,"b":1.50,"c":3,"d":"x"}`);
  assert.equal(paraFiltro((o as Record<string, unknown>).a), "12345678901234567890");
});
Deno.test("Agrupador: transação v2, mudança solta, v1 em uma linha, json/jsonb e bytea reconvertidos", () => {
  const g = new Agrupador();
  assert.deepEqual(g.push(B("0/10"), "f"), []);
  assert.deepEqual(g.push(I("0/11", "t", [col("id", 1, "integer"), col("j", `{"k":[1,2]}`, "jsonb"), col("b", "6869", "bytea"), col("s", `{"x"}`, "text")]), "f"), []);
  const [u] = g.push(C("0/10"), "f");
  assert.equal(u.lsn, "0/10");
  assert.deepEqual(u.mudancas[0].linha, { id: 1, j: { k: [1, 2] }, b: "\\x6869", s: `{"x"}` }); // jsonb vira objeto (como string viraria escalar no destino)
  assert.equal(g.push(I("0/20", "t", [col("id", 2)]), "f")[0].lsn, "0/20");
  const v1 = g.push(JSON.stringify({ nextlsn: "0/30", change: [{ kind: "delete", schema: "public", table: "t", oldkeys: { keynames: ["id"], keytypes: ["integer"], keyvalues: [7] } }] }), "f");
  assert.deepEqual(v1[0].mudancas[0], { acao: "D", schema: "public", tabela: "t", linha: {}, chave: { id: 7 } });
  assert.deepEqual(g.push(JSON.stringify({ action: "M", lsn: "0/31" }), "f"), []);
  assert.throws(() => g.push(JSON.stringify({ action: "T", lsn: "0/40", schema: "public", table: "t" }), "f"), /TRUNCATE/);
  assert.throws(() => g.push(JSON.stringify({ action: "I", schema: "public", table: "t", columns: [] }), "f"), /sem LSN/);
  assert.throws(() => g.push(JSON.stringify({ action: "?", lsn: "0/1" }), "f"), /desconhecida/);
});

Deno.test("aplica em ordem, 1 checkpoint por transação, e a 2ª execução aplica ZERO (antes: v2 marcava LSN e não aplicava nada)", async () => {
  const m = memoria();
  const wal = [...tx("0/100", I("0/90", "contacts", [col("id", 1), col("nome", "Ana")]), I("0/91", "contacts", [col("id", 2), col("nome", "Bia")])),
    ...tx("0/200", U("0/190", "contacts", [col("id", 1), col("nome", "Ana Maria")], [col("id", 1)]), D("0/191", "contacts", [col("id", 2)]))];
  let r = await reproduzir(de(wal), m.d, quieto);
  assert.deepEqual(r, { total: 2, applied: 2, skipped: 0, ignoradas: 0, incompletas: 0, mudancas: 4 });
  assert.deepEqual(m.ops, ["up:contacts:1", "up:contacts:2", "ck:0/100", "up:contacts:1", "rm:contacts:2", "ck:0/200"]);
  assert.deepEqual([...m.linhas.values()], [{ id: 1, nome: "Ana Maria" }]);
  const antes = m.ops.length;
  r = await reproduzir(de(wal), m.d, quieto);
  assert.deepEqual({ applied: r.applied, skipped: r.skipped }, { applied: 0, skipped: 2 });
  assert.equal(m.ops.length, antes, "re-execução não pode tocar no destino");
});
Deno.test("falha no meio PARA tudo: nada depois é aplicado, transação falha não entra no checkpoint, e o rerun completa", async () => {
  const m = memoria();
  const wal = [...tx("0/100", I("0/90", "t", [col("id", 1)])), ...tx("0/200", I("0/190", "t", [col("id", 2)]), I("0/191", "t", [col("id", 3)])), ...tx("0/300", I("0/290", "t", [col("id", 4)]))];
  m.d.falharEm = "upsert:3";
  await assert.rejects(reproduzir(de(wal), m.d, quieto), /falha ao aplicar I em t \(lsn 0\/200\)/);
  assert.deepEqual(m.lsns, ["0/100"]); assert.ok(!m.ops.includes("up:t:4"), "não pode pular para a transação seguinte");
  m.d.falharEm = undefined;
  const r = await reproduzir(de(wal), m.d, quieto);
  assert.deepEqual({ applied: r.applied, skipped: r.skipped }, { applied: 2, skipped: 1 });
  assert.deepEqual(m.lsns, ["0/100", "0/200", "0/300"]);
});
Deno.test("falha ao gravar checkpoint também para (antes: erro ignorado → evento reaplicado fora de ordem depois)", async () => {
  const m = memoria(); m.d.falharEm = "marcar:0/100";
  await assert.rejects(reproduzir(de([...tx("0/100", I("0/90", "t", [col("id", 1)])), ...tx("0/200", I("0/190", "t", [col("id", 2)]))]), m.d, quieto), /checkpoint fora/);
  assert.ok(!m.ops.includes("up:t:2"));
});
Deno.test("fora de ordem: transação antiga que não consta no checkpoint aborta em vez de regredir dado", async () => {
  const m = memoria(["0/500"]);
  await assert.rejects(reproduzir(de(tx("0/300", I("0/290", "t", [col("id", 1), col("v", "velho")]))), m.d, quieto), /fora de ordem/);
  assert.deepEqual(m.ops, []);
  const n = memoria(); // dentro da mesma execução: arquivos invertidos
  await assert.rejects(reproduzir(de([...tx("0/300", I("0/290", "t", [col("id", 1)])), ...tx("0/200", I("0/190", "t", [col("id", 1)]))]), n.d, quieto), /fora de ordem/);
});
Deno.test("duplicata (drain reiniciado reenvia a mesma transação) é pulada; LSN alto compara por valor, não por texto", async () => {
  const m = memoria();
  const t1 = tx("9/FFFFFFF0", I("9/FFFFFF00", "t", [col("id", 1)])), t2 = tx("A/10", I("A/5", "t", [col("id", 2)]));
  const r = await reproduzir(de([...t1, ...t1, ...t2]), m.d, quieto);
  assert.deepEqual({ applied: r.applied, skipped: r.skipped }, { applied: 2, skipped: 1 });
});
Deno.test("checkpoint com LSN inválido (chaos: 'CHAOS/BADLSN') é ignorado com aviso", async () => {
  const m = memoria(["CHAOS/BADLSN"]); const avisos: string[] = [];
  const r = await reproduzir(de(tx("0/100", I("0/90", "t", [col("id", 1)]))), m.d, { aviso: (a) => avisos.push(a) });
  assert.equal(r.applied, 1); assert.match(avisos[0], /LSN inválido ignorado/);
});
Deno.test("linha corrompida NO MEIO aborta; última linha truncada e transação sem C não são aplicadas (aviso)", async () => {
  const m = memoria();
  await assert.rejects(reproduzir(de([...tx("0/100", I("0/90", "t", [col("id", 1)])), "{lixo", ...tx("0/200", I("0/190", "t", [col("id", 2)]))]), m.d, quieto), /linha JSON corrompida/);
  const n = memoria(); const avisos: string[] = [];
  async function* truncado(): AsyncGenerator<EntradaLinha> {
    yield* de([...tx("0/100", I("0/90", "t", [col("id", 1)])), B("0/200"), I("0/190", "t", [col("id", 2)])]);
    yield { texto: `{"action":"I","lsn":"0/19`, origem: "t.json:6", ultimaSemQuebra: true };
  }
  const r = await reproduzir(truncado(), n.d, { aviso: (a) => avisos.push(a) });
  assert.deepEqual({ applied: r.applied, incompletas: r.incompletas }, { applied: 1, incompletas: 1 });
  assert.ok(!n.ops.includes("up:t:2")); assert.equal(avisos.length, 2);
});
Deno.test("DELETE sem chave é recusado; schema ≠ public é ignorado; UPDATE que troca a PK move a linha; --dry-run não escreve", async () => {
  const m = memoria();
  await assert.rejects(reproduzir(de(tx("0/100", D("0/90", "t"))), m.d, quieto), /DELETE em t sem chave/);
  let r = await reproduzir(de(tx("0/200", I("0/190", "users", [col("id", 1)], "auth"), I("0/191", "t", [col("id", 1), col("v", "a")]))), m.d, quieto);
  assert.deepEqual({ mudancas: r.mudancas, ignoradas: r.ignoradas }, { mudancas: 1, ignoradas: 1 });
  r = await reproduzir(de(tx("0/300", U("0/290", "t", [col("id", 9), col("v", "b")], [col("id", 1)]))), m.d, quieto);
  assert.deepEqual([...m.linhas.keys()], ["t:9"]);
  const d = memoria();
  r = await reproduzir(de(tx("0/100", I("0/90", "t", [col("id", 1)]))), d.d, { dryRun: true, ...quieto });
  assert.equal(r.applied, 1); assert.deepEqual(d.ops, []);
});

Deno.test("lerDiretorio: ordena pelos LSN (não pelo nome), lê em stream e marca última linha sem quebra", async () => {
  const dir = await Deno.makeTempDir({ prefix: "g7-cdc-" });
  try {
    await Deno.writeTextFile(`${dir}/wal-a-renomeado.json`, tx("0/200", I("0/190", "t", [col("id", 2)])).join("\n") + "\n");
    await Deno.writeTextFile(`${dir}/wal-z-primeiro.json`, tx("0/100", I("0/90", "t", [col("id", 1)])).join("\n") + "\n" + `{"action":"B"`);
    await Deno.writeTextFile(`${dir}/ignorar.log`, "x");
    const lidas: EntradaLinha[] = []; for await (const l of lerDiretorio(dir)) lidas.push(l);
    assert.equal(lidas.length, 7); assert.match(lidas[0].origem, /wal-z-primeiro\.json:1/);
    assert.deepEqual(lidas.filter((l) => l.ultimaSemQuebra).map((l) => l.origem), ["wal-z-primeiro.json:4"]);
    const m = memoria();
    const r = await reproduzir(lerDiretorio(dir), m.d, quieto);
    assert.equal(r.applied, 2); assert.deepEqual(m.lsns, ["0/100", "0/200"]);
  } finally { await Deno.remove(dir, { recursive: true }); }
});

Deno.test("ponta a ponta com PostgREST falso: checkpoint paginado (2.500 LSNs, db-max-rows=1000), números sem perda, jsonb, exit codes", async () => {
  const m = await MockSupabase.iniciar();
  const dir = await Deno.makeTempDir({ prefix: "g7-cdc-" });
  const script = new URL("./replay.ts", import.meta.url).pathname;
  const env = { DEST_SUPABASE_URL: m.url, DEST_SERVICE_ROLE_KEY: "chave-secreta", CDC_OUT_DIR: dir };
  try {
    const ck = m.tabela("_migration_cdc_checkpoint", ["lsn"]);
    const contatos = m.tabela("contacts", ["id"], [{ id: 5, nome: "apagar" }]);
    const antigas: string[] = [];
    for (let i = 1; i <= 2500; i++) antigas.push(...tx(`0/${i.toString(16).toUpperCase()}`, I(`0/${i.toString(16)}`, "contacts", [col("id", 100000 + i, "integer")])));
    await Deno.writeTextFile(`${dir}/wal-1.json`, antigas.join("\n") + "\n");
    let r = await rodar(script, env);
    assert.equal(r.code, 0, r.err); assert.match(r.out, /total=2500 applied=2500 skipped=0/);
    assert.equal(ck.linhas.length, 2500);
    await Deno.writeTextFile(`${dir}/wal-2.json`, [
      ...tx("1/10", I("1/5", "contacts", [col("id", "12345678901234567890", "numeric"), col("saldo", 1.5, "numeric"), col("meta", `{"n":9007199254740993}`, "jsonb")])),
      ...tx("1/20", D("1/15", "contacts", [col("id", 5, "integer")])),
    ].join("\n").replace(`"value":"12345678901234567890"`, `"value":12345678901234567890`).replace(`"value":1.5`, `"value":1.50`) + "\n");
    r = await rodar(script, env);
    assert.equal(r.code, 0, r.err); assert.match(r.out, /total=2502 applied=2 skipped=2500/); // marca d'água leu as 3 páginas
    const corpo = new TextDecoder().decode(m.reqs.filter((q) => q.method === "POST" && q.path.endsWith("/contacts")).at(-1)!.corpo);
    assert.match(corpo, /"id":12345678901234567890/); assert.match(corpo, /"saldo":1\.50/); assert.match(corpo, /"meta":\{"n":9007199254740993\}/);
    assert.ok(!contatos.linhas.some((l) => l.id === 5), "DELETE aplicado");
    r = await rodar(script, env);
    assert.match(r.out, /applied=0 skipped=2502/); // contrato usado por cdc/dry-run.sh
    await Deno.writeTextFile(`${dir}/wal-3.json`, tx("1/30", I("1/25", "tabela_que_nao_existe", [col("id", 1)])).join("\n") + "\n");
    r = await rodar(script, env);
    assert.equal(r.code, 1); assert.match(r.err, /falha ao aplicar I em tabela_que_nao_existe/); assert.ok(!(r.out + r.err).includes("chave-secreta"));
    assert.equal(ck.linhas.length, 2502);
    r = await rodar(script, env, ["--dry-run"]);
    assert.equal(r.code, 0); assert.match(r.out, /applied=1 .*DRY_RUN/); assert.equal(ck.linhas.length, 2502);
    assert.equal((await rodar(script, { CDC_OUT_DIR: dir })).code, 2);
    assert.equal((await rodar(script, { ...env, CDC_OUT_DIR: `${dir}/nao-existe` })).code, 2);
  } finally { await m.parar(); await Deno.remove(dir, { recursive: true }); }
});
Deno.test("destinoSupabase: tabela de checkpoint ausente dá erro claro (não segue como 'nada aplicado')", async () => {
  const m = await MockSupabase.iniciar();
  try {
    await assert.rejects(destinoSupabase(m.url, "k").lsnsAplicados(), /ler checkpoint.*checkpoint\.sql/);
  } finally { await m.parar(); }
});
