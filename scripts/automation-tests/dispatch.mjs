import test from "node:test";
import assert from "node:assert/strict";
import {existsSync} from "node:fs";
import {join} from "node:path";
import {execute} from "../automation.mjs";
import {fixture,text} from "./fixture.mjs";

test("test propaga falha real de node:test", (t) => {
  const f = fixture(t);
  f.write(
    "scripts/smoke.unit.mjs",
    "import test from 'node:test';test('erro',()=>{throw new Error('falha fixture')});\n",
  );
  assert.equal(f.cli("test").status, 1);
});

test("check/heal preservam root/ref e encaminham configuração do motor", (t) => {
  const f = fixture(t);
  f.config.motorConfig = "motor.json";
  f.write("motor.json", "{}");
  f.save();
  for (const action of ["check", "heal"]) {
    const r = f.cli(action, "--ref", "HEAD");
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(
      text(join(f.root, "fixture-motor.log")).trim().split("\n"),
      [
        action,
        "--root",
        f.root,
        "--ref",
        "HEAD",
        "--config",
        join(f.root, "motor.json"),
      ],
    );
  }
});

test("graph usa seu próprio config e traduz doctor/build, sem instalar implicitamente", (t) => {
  const f = fixture(t);
  for (const [input, expected] of [
    ["doctor", "status"],
    ["build", "ensure"],
  ]) {
    const r = f.cli("graph", input);
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(JSON.parse(text(join(f.root, "fixture-graph.log"))), [
      expected,
      "--root",
      f.root,
      "--config",
      join(f.root, "graphify.local.json"),
    ]);
  }
});

test("nightly tenta grafo e heal independentes e agrega falha", (t) => {
  const f = fixture(t);
  const r = f.run(
    process.execPath,
    ["scripts/automation.mjs", "nightly", "--ref", "origin/main"],
    { env: { ...process.env, FIXTURE_GRAPH_EXIT: "3" } },
  );
  assert.equal(r.status, 1);
  assert.ok(existsSync(join(f.root, "fixture-motor.log")));
  const report = JSON.parse(r.stdout);
  assert.equal(report.results.graph.code, 3);
  assert.equal(report.results.heal.code, 0);
});

test("timeout encerra subprocesso e retorna 124 em prazo finito", async () => {
  const before = Date.now();
  const r = await execute(
    [
      process.execPath,
      "-e",
      "process.on('SIGTERM',()=>{});setInterval(()=>{},1000)",
    ],
    { timeout: 100, capture: true },
  );
  assert.equal(r.code, 124);
  assert.equal(r.timedOut, true);
  assert.ok(Date.now() - before < 2000);
});

test("captura preserva UTF-8 dividido em eventos de saída", async () => {
  const r = await execute(
    [
      process.execPath,
      "-e",
      "process.stdout.write(Buffer.from([0xc3]));setTimeout(()=>process.stdout.write(Buffer.from([0xa7])),20)",
    ],
    { capture: true },
  );
  assert.equal(r.code, 0);
  assert.equal(r.stdout, "ç");
});
