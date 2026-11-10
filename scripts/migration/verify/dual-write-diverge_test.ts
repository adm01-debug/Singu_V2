// Testes de verify/dual-write-diverge.ts contra dois PostgREST falsos.
import assert from "node:assert/strict";
import { MockSupabase, rodar } from "../_mock_supabase.ts";
import { comparar, detectar, normalizarTs } from "./dual-write-diverge.ts";

const SCRIPT = new URL("./dual-write-diverge.ts", import.meta.url).pathname;
const recente = (segAtras: number) => new Date(Date.now() - segAtras * 1000).toISOString().replace("Z", "+00:00");
async function par() {
  const a = await MockSupabase.iniciar(), b = await MockSupabase.iniciar();
  const env: Record<string, string> = { LEGACY_SUPABASE_URL: a.url, LEGACY_SERVICE_ROLE_KEY: "chave-legado", DEST_SUPABASE_URL: b.url, DEST_SERVICE_ROLE_KEY: "chave-destino", TABLES: "contacts", GRACE_SEC: "0" };
  const alertas = b.tabela("system_alerts", ["id"], [], { obrigatorias: ["alert_type", "severity", "threshold_pct", "consumed_pct", "message"] });
  const flags = b.tabela("feature_flags", ["name"], [{ name: "dual_write_enabled", enabled: true }], { colunas: ["name", "enabled", "description", "roles", "created_at", "updated_at"] });
  return { a, b, env, alertas, flags, fim: async () => { await a.parar(); await b.parar(); } };
}

Deno.test("normalizarTs: fuso e zeros à direita não importam; microssegundo importa", () => {
  assert.equal(normalizarTs("2026-01-01T12:00:00+00:00"), normalizarTs("2026-01-01T09:00:00.000000-03:00"));
  assert.equal(normalizarTs("2026-01-01T12:00:00.5+00:00"), normalizarTs("2026-01-01T12:00:00.500000Z"));
  assert.notEqual(normalizarTs("2026-01-01T12:00:00.000001+00:00"), normalizarTs("2026-01-01T12:00:00.000002+00:00"));
  assert.equal(normalizarTs("lixo"), "lixo");
});
Deno.test("comparar: simétrico — linha só no destino também é divergência (antes: legado vazio = 0%)", () => {
  const m = (o: Record<string, string>) => new Map(Object.entries(o));
  assert.deepEqual(comparar(m({ a: "1", b: "2" }), m({ a: "1", b: "2" })), { legacy: 2, dest: 2, mismatch: 0, pct: 0 });
  assert.deepEqual(comparar(m({}), m({ x: "1" })), { legacy: 0, dest: 1, mismatch: 1, pct: 100 });
  assert.deepEqual(comparar(m({ a: "1", b: "2" }), m({ a: "9", c: "3" })), { legacy: 2, dest: 2, mismatch: 3, pct: 100 });
  assert.equal(comparar(m({}), m({})).pct, 0);
});
Deno.test("detectar: erro de leitura é reportado à parte e NÃO conta como divergência", async () => {
  const d = await detectar(["ok", "quebra"], (t) => (t === "quebra" ? Promise.reject(new Error("503")) : Promise.resolve(new Map([["1", "x"]]))), () => Promise.resolve(new Map([["1", "x"]])), 0.1, () => {});
  assert.equal(d.divergiu, false); assert.deepEqual(d.erros, ["quebra: 503"]); assert.equal(d.summary.ok.mismatch, 0);
});

Deno.test("divergência aciona o kill-switch DE VERDADE: alerta com colunas obrigatórias e flag por 'name' (antes: 2 escritas falhavam caladas)", async () => {
  const { a, b, env, alertas, flags, fim } = await par();
  try {
    a.tabela("contacts", ["id"], [{ id: "1", updated_at: recente(60) }]); b.tabela("contacts", ["id"], []);
    const r = await rodar(SCRIPT, env);
    assert.equal(r.code, 1); assert.match(r.err, /kill-switch acionado/);
    assert.equal(alertas.linhas.length, 1);
    assert.deepEqual({ t: alertas.linhas[0].alert_type, s: alertas.linhas[0].severity, th: alertas.linhas[0].threshold_pct, c: alertas.linhas[0].consumed_pct }, { t: "dual_write_divergence", s: "critical", th: 0.1, c: 100 });
    assert.equal(flags.linhas.length, 1); assert.equal(flags.linhas[0].enabled, false);
    assert.ok(!(r.out + r.err).includes("chave-"));
  } finally { await fim(); }
});
Deno.test("dentro do threshold sai 0 e não escreve nada; fuso diferente nos dois lados não é divergência", async () => {
  const { a, b, env, alertas, flags, fim } = await par();
  try {
    const t = new Date(Date.now() - 60_000);
    a.tabela("contacts", ["id"], [{ id: "1", updated_at: t.toISOString() }]);
    b.tabela("contacts", ["id"], [{ id: "1", updated_at: t.toISOString().replace("Z", "000+00:00") }]);
    const r = await rodar(SCRIPT, env);
    assert.equal(r.code, 0, r.out + r.err); assert.match(r.out, /Dual-write dentro do threshold/);
    assert.equal(alertas.linhas.length, 0); assert.equal(flags.linhas[0].enabled, true);
    assert.equal(b.contar("POST", /./), 0);
  } finally { await fim(); }
});
Deno.test("pagina além de 1.000 linhas (db-max-rows): 2.500 linhas iguais = 0 mismatch (antes: limit(5000) cortado em 1.000 sem ordem)", async () => {
  const { a, b, env, fim } = await par();
  try {
    const linhas = Array.from({ length: 2500 }, (_, i) => ({ id: String(i).padStart(5, "0"), updated_at: recente(60) }));
    a.tabela("contacts", ["id"], linhas); b.tabela("contacts", ["id"], [...linhas].reverse());
    const r = await rodar(SCRIPT, env);
    assert.equal(r.code, 0, r.out + r.err); assert.match(r.out, /contacts: legacy=2500 dest=2500 mismatch=0/);
  } finally { await fim(); }
});
Deno.test("tabela sem updated_at usa created_at (interactions, padrão de TABLES, antes dava erro e disparava o kill-switch sempre)", async () => {
  const { a, b, env, alertas, fim } = await par();
  try {
    const l = [{ id: "1", created_at: recente(60) }];
    a.tabela("interactions", ["id"], l, { colunas: ["id", "created_at"] }); b.tabela("interactions", ["id"], l, { colunas: ["id", "created_at"] });
    const r = await rodar(SCRIPT, { ...env, TABLES: "interactions" });
    assert.equal(r.code, 0, r.out + r.err); assert.match(r.out, /interactions: legacy=1 dest=1 mismatch=0/); assert.equal(alertas.linhas.length, 0);
  } finally { await fim(); }
});
Deno.test("GRACE_SEC ignora escrita muito recente; --dry-run mede mas não aciona; erro de leitura sai 3 sem pausar", async () => {
  const { a, b, env, alertas, flags, fim } = await par();
  try {
    a.tabela("contacts", ["id"], [{ id: "1", updated_at: recente(2) }]); b.tabela("contacts", ["id"], []);
    assert.equal((await rodar(SCRIPT, { ...env, GRACE_SEC: "30" })).code, 0); // ainda em voo
    let r = await rodar(SCRIPT, { ...env, WINDOW_MIN: "5" }, ["--dry-run"]);
    assert.equal(r.code, 1); assert.match(r.err, /DRY_RUN.*NÃO acionado/); assert.equal(alertas.linhas.length, 0); assert.equal(flags.linhas[0].enabled, true);
    r = await rodar(SCRIPT, { ...env, TABLES: "tabela_inexistente" });
    assert.equal(r.code, 3); assert.match(r.err, /ERRO de leitura/); assert.equal(flags.linhas[0].enabled, true);
  } finally { await fim(); }
});
Deno.test("kill-switch que falha é dito com todas as letras (saída 1); config inválida sai 2", async () => {
  const { a, b, env, fim } = await par();
  try {
    a.tabela("contacts", ["id"], [{ id: "1", updated_at: recente(60) }]); b.tabela("contacts", ["id"], []);
    b.tabelas.delete("feature_flags");
    const r = await rodar(SCRIPT, env);
    assert.equal(r.code, 1); assert.match(r.err, /KILL-SWITCH NÃO ACIONADO POR COMPLETO: feature_flags/);
    assert.equal((await rodar(SCRIPT, { ...env, WINDOW_MIN: "abc" })).code, 2);
    assert.equal((await rodar(SCRIPT, { ...env, TABLES: "a;drop" })).code, 2);
    assert.equal((await rodar(SCRIPT, { TABLES: "contacts" })).code, 2);
  } finally { await fim(); }
});
