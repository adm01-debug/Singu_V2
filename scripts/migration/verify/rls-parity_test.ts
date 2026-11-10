// Testes de verify/rls-parity.ts — parte pura sempre; parte com Postgres se PGHOST estiver definido.
import assert from "node:assert/strict";
import { rodar } from "../_mock_supabase.ts";
import { derrubar, motivoPulo, recriar, sql, temPg, urlDe } from "../_pg_teste.ts";
import { canonical, comparar, fetchEstado, paridadeOk, type Estado, type Policy } from "./rls-parity.ts";

const pol = (o: Partial<Policy> = {}): Policy => ({ schemaname: "public", tablename: "t", policyname: "p", cmd: "SELECT", permissive: "PERMISSIVE", roles: ["authenticated"], qual: "(dono = auth.uid())", with_check: null, ...o });
const est = (policies: Policy[], rls = true, force = false): Estado => ({ policies, tabelas: [{ schemaname: "public", tablename: "t", rls, force }] });

Deno.test("canonical: ignora espaços e ordem dos roles; distingue expressão, cmd e permissive", () => {
  assert.equal(canonical(pol({ roles: ["b", "a"], qual: "(a  =\n 1)" })), canonical(pol({ roles: ["a", "b"], qual: "(a = 1)" })));
  assert.notEqual(canonical(pol()), canonical(pol({ qual: "true" })));
  assert.notEqual(canonical(pol()), canonical(pol({ cmd: "ALL" })));
  assert.notEqual(canonical(pol()), canonical(pol({ permissive: "RESTRICTIVE" })));
  assert.notEqual(canonical(pol()), canonical(pol({ roles: ["anon"] })));
  assert.notEqual(canonical(pol()), canonical(pol({ with_check: "true" })));
});
Deno.test("comparar: ausente, extra, alterada, RLS desligado e FORCE diferente", () => {
  assert.ok(paridadeOk(comparar(est([pol()]), est([pol()])), false));
  let d = comparar(est([pol(), pol({ policyname: "q" })]), est([pol({ qual: "true" }), pol({ policyname: "extra" })]));
  assert.deepEqual([d.missing, d.extra, d.changed], [["public.t::q"], ["public.t::extra"], ["public.t::p"]]);
  d = comparar(est([pol()]), est([pol()], false));
  assert.equal(d.rls.length, 1); assert.ok(!paridadeOk(d, true));
  d = comparar(est([pol()], true, true), est([pol()], true, false));
  assert.match(d.rls[0], /FORCE/);
  d = comparar(est([pol()]), { policies: [pol()], tabelas: [] }); // destino sem a tabela nas flags = RLS off
  assert.equal(d.rls.length, 1);
});
Deno.test("paridadeOk: policy a mais no destino falha, salvo tolerância explícita", () => {
  const d = comparar(est([pol()]), est([pol(), pol({ policyname: "aberta", qual: "true" })]));
  assert.equal(paridadeOk(d, false), false);
  assert.equal(paridadeOk(d, true), true);
});

const BASE = `create table t(id int primary key, dono text);
alter table t enable row level security;
create policy p_sel on t for select to public using (dono = current_user);
create policy p_restr on t as restrictive for all using (id > 0) with check (id > 0);
create schema app; create table app.x(id int); alter table app.x enable row level security; alter table app.x force row level security;
create policy px on app.x for insert with check (id < 10);`;
const SCRIPT = new URL("./rls-parity.ts", import.meta.url).pathname;

Deno.test({ name: "Postgres: bancos idênticos passam; cada tipo de desvio é pego (antes: RESTRICTIVE→PERMISSIVE, RLS off e policy extra saíam 'OK')", ignore: !temPg, async fn() {
  const [A, B] = ["g7_rls_src", "g7_rls_dst"];
  const env = { SRC_DB_URL: urlDe(A), DEST_DB_URL: urlDe(B) };
  try {
    await recriar(A); await recriar(B); await sql(A, BASE); await sql(B, BASE);
    const e = await fetchEstado(env.SRC_DB_URL);
    assert.equal(e.policies.length, 3); assert.equal(e.policies.find((p) => p.policyname === "p_restr")!.permissive, "RESTRICTIVE");
    assert.deepEqual(e.tabelas.find((t) => t.schemaname === "app"), { schemaname: "app", tablename: "x", rls: true, force: true });
    let r = await rodar(SCRIPT, env);
    assert.equal(r.code, 0, r.out + r.err); assert.match(r.out, /RLS parity OK/);
    const desvios: [string, RegExp][] = [
      ["drop policy p_restr on t; create policy p_restr on t as permissive for all using (id > 0) with check (id > 0)", /Alteradas: 1/],
      ["alter table t disable row level security", /RLS origem=on destino=off/],
      ["create policy aberta on t for select using (true)", /Extras no destino: 1/],
      ["drop policy p_sel on t", /Ausentes no destino: 1/],
      ["alter policy p_sel on t using (true)", /Alteradas: 1/],
      ["alter policy p_sel on t to postgres", /Alteradas: 1/],
      ["alter table app.x no force row level security", /FORCE origem=on destino=off/],
      ["alter policy px on app.x with check (id < 99)", /Alteradas: 1/],
    ];
    for (const [ddl, esperado] of desvios) {
      await recriar(B); await sql(B, BASE); await sql(B, ddl);
      r = await rodar(SCRIPT, env);
      assert.equal(r.code, 1, `${ddl}\n${r.out}`); assert.match(r.out, esperado, ddl); assert.match(r.out, /RLS parity FALHOU/);
    }
    await recriar(B); await sql(B, BASE); await sql(B, "create policy aberta on t for select using (true)");
    assert.equal((await rodar(SCRIPT, { ...env, RLS_ALLOW_EXTRA: "1" })).code, 0);
  } finally { await derrubar(A, B); }
} });
Deno.test({ name: "Postgres: origem sem policy não é 'paridade'; banco inacessível sai 1 sem vazar a senha; sem env sai 2", ignore: !temPg, async fn() {
  const [A, B] = ["g7_rls_vazio_a", "g7_rls_vazio_b"];
  try {
    await recriar(A); await recriar(B);
    let r = await rodar(SCRIPT, { SRC_DB_URL: urlDe(A), DEST_DB_URL: urlDe(B) });
    assert.equal(r.code, 1); assert.match(r.out, /origem sem nenhuma policy/);
    r = await rodar(SCRIPT, { SRC_DB_URL: "postgres://u:SENHA-SECRETA@127.0.0.1:1/x", DEST_DB_URL: urlDe(B) });
    assert.equal(r.code, 1); assert.ok(!(r.out + r.err).includes("SENHA-SECRETA"));
    assert.equal((await rodar(SCRIPT, { SRC_DB_URL: urlDe(A) })).code, 2);
  } finally { await derrubar(A, B); }
} });
if (!temPg) console.log(`rls-parity: ${motivoPulo}`);
