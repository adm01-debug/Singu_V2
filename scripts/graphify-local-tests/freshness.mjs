import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, writeFile, readFile, rm, readdir } from "node:fs/promises";
import path from "node:path";
import {
  main,
  fingerprint,
  validateGraph,
  adoptInitial,
} from "../graphify-local.mjs";
import { fixture } from "./fixture.mjs";

test("mark é leve, aceita flags intercaladas e não importa runtime nem gera grafo", async (t) => {
  const f = await fixture(t);
  await rm(path.join(f.env, "bin/python"));
  const result = await main(
    ["--root", f.root, "mark", "--config", f.configFile],
    f.options,
  );
  assert.equal(result.exitCode, 0);
  assert.equal(result.report.status, "marked");
  assert.equal(
    (await readdir(path.join(f.root, ".tools/graphify/state"))).includes(
      "dirty.json",
    ),
    true,
  );
  await assert.rejects(readFile(f.graph), /ENOENT/);
});

test("ensure gera em staging, valida e status usa fonte/config/versão/HEAD", async (t) => {
  const f = await fixture(t);
  assert.equal((await f.call("status")).report.status, "missing_graph");
  const first = await f.call("ensure");
  assert.equal(first.exitCode, 0, JSON.stringify(first.report));
  assert.equal(first.report.status, "generated");
  assert.equal((await f.call("status")).report.status, "current");
  await writeFile(
    path.join(f.root, "src/value.ts"),
    'export const value = "dirty";\n',
  );
  assert.equal((await f.call("status")).report.status, "stale");
  const second = await f.call("ensure");
  assert.equal(second.exitCode, 0, JSON.stringify(second.report));
  assert.ok(second.report.backup);
  assert.match(
    await readFile(path.join(second.report.backup, "graph.json"), "utf8"),
    /v1/,
  );
  assert.equal((await f.call("status")).report.status, "current");
  assert.match(await readFile(f.graph, "utf8"), /dirty/);
});

test("query/path/explain sempre verificam freshness e usam CLI local", async (t) => {
  const f = await fixture(t);
  const first = await f.call("query", "value");
  assert.equal(first.exitCode, 0, JSON.stringify(first.report));
  assert.equal(first.report.status, "queried");
  assert.match(first.report.output, /v1/);
  await writeFile(
    path.join(f.root, "src/value.ts"),
    'export const value = "v2";\n',
  );
  const updated = await f.call("path", "first", "second");
  assert.equal(updated.exitCode, 0, JSON.stringify(updated.report));
  assert.match(updated.report.output, /v2/);
  assert.equal((await f.call("explain", "value")).exitCode, 0);
  assert.equal((await f.call("query", "--root")).exitCode, 1);
});

test("mark com hash igual não desperdiça nova extração", async (t) => {
  const f = await fixture(t);
  assert.equal((await f.call("ensure")).exitCode, 0);
  const counter = path.join(f.env, "calls"),
    before = await readFile(counter, "utf8");
  assert.equal((await f.call("mark")).exitCode, 0);
  assert.equal((await f.call("ensure")).exitCode, 0);
  assert.equal(await readFile(counter, "utf8"), before);
});

test("arquivo novo e alteração de configuração tornam o snapshot stale", async (t) => {
  const f = await fixture(t);
  assert.equal((await f.call("ensure")).exitCode, 0);
  await writeFile(
    path.join(f.root, "src/new.ts"),
    "export const created = true;\n",
  );
  assert.equal((await f.call("status")).report.status, "stale");
  assert.equal((await f.call("ensure")).exitCode, 0);
  await writeFile(
    f.configFile,
    JSON.stringify({ ...f.config, timeoutMs: 4000 }),
  );
  assert.equal((await f.call("status")).report.status, "stale");
});

test("adoção inicial exige bytes, corpus, commit, pin e escopo iguais", async (t) => {
  const f = await fixture(t);
  await mkdir(path.dirname(f.graph));
  await writeFile(
    f.graph,
    JSON.stringify({ nodes: [{ id: "initial" }], links: [] }),
  );
  const fp = await fingerprint(f.root, f.config),
    info = await validateGraph(f.graph);
  const initial = path.join(
    f.root,
    f.config.output + "/graphify-local-initial-provenance.json",
  );
  await writeFile(
    initial,
    JSON.stringify({
      generator: "initial-code-only",
      root: f.root,
      graphifyVersion: "0.9.97",
      partial: false,
      scope: ["."],
      sourceFingerprint: { head: fp.head, files: fp.files },
      graphSha256: info.sha256,
      createdAt: new Date(Date.now() + 1000).toISOString(),
    }),
  );
  const ctx = {
    root: f.root,
    config: f.config,
    graph: f.graph,
    outputRoot: path.dirname(f.graph),
    provenance: path.join(
      path.dirname(f.graph),
      "graphify-local-provenance.json",
    ),
  };
  await writeFile(
    f.graph,
    JSON.stringify({ nodes: [{ id: "tampered" }], links: [] }),
  );
  assert.equal(await adoptInitial(ctx, fp), false);
  await writeFile(
    f.graph,
    JSON.stringify({ nodes: [{ id: "initial" }], links: [] }),
  );
  assert.equal(await adoptInitial(ctx, fp), true);
  assert.equal((await f.call("status")).report.status, "current");
  await assert.rejects(readFile(path.join(f.env, "calls")), /ENOENT/);
});

test("config relativo resolve em root mesmo com cwd diferente", async (t) => {
  const f = await fixture(t);
  await writeFile(
    path.join(f.root, "graphify.local.json"),
    JSON.stringify(f.config),
  );
  const r = await main(
    ["--root", f.root, "--config", "graphify.local.json", "mark"],
    f.options,
  );
  assert.equal(r.exitCode, 0);
});
test("fingerprint e consultas preservam nomes e conteúdo acentuados", async (t) => {
  const f = await fixture(t);
  await writeFile(
    path.join(f.root, "src/ação.ts"),
    'export const ação="João";\n',
  );
  const info = await fingerprint(f.root, f.config);
  assert.ok(info.files["src/ação.ts"]);
  assert.equal(
    Object.keys(info.files).some((name) => name.includes("\ufffd")),
    false,
  );
  await writeFile(
    path.join(f.root, "src/value.ts"),
    'export const value="coração";\n',
  );
  const result = await f.call("query", "coração");
  assert.equal(result.exitCode, 0, JSON.stringify(result.report));
  assert.match(result.report.output, /coração/);
  assert.equal(result.report.output.includes("\ufffd"), false);
});

test("output isolado preserva grafo canônico e configuração não pode direcionar escrita a ele", async (t) => {
  const f = await fixture(t),
    canonical = path.join(f.root, "graphify-out/graph.json");
  await mkdir(path.dirname(canonical));
  const before = JSON.stringify({
    nodes: [{ id: "canonical-enriched" }],
    links: [],
  });
  await writeFile(canonical, before);
  assert.equal((await f.call("ensure")).exitCode, 0);
  assert.equal(await readFile(canonical, "utf8"), before);
  assert.notEqual(f.graph, canonical);
  await writeFile(
    f.configFile,
    JSON.stringify({ ...f.config, output: "graphify-out" }),
  );
  const result = await f.call("ensure");
  assert.equal(result.exitCode, 1);
  assert.match(result.report.message, /canônico/);
  assert.equal(await readFile(canonical, "utf8"), before);
});
