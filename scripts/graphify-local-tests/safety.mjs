import test from "node:test";
import assert from "node:assert/strict";
import {mkdir,writeFile,readFile,rm,readdir,symlink} from "node:fs/promises";
import path from "node:path";
import {fingerprint,validateGraph} from "../graphify-local.mjs";
import {fixture,git} from "./fixture.mjs";

test("fingerprint ignora secrets/env, dependências, saídas e symlinks", async (t) => {
  const f = await fixture(t),
    before = await fingerprint(f.root, f.config);
  await writeFile(
    path.join(f.root, ".env"),
    "PRIVATE_FIXTURE_TOKEN=private-value",
  );
  await writeFile(
    path.join(f.root, "credentials.json"),
    '{"token":"private-value"}',
  );
  await mkdir(path.join(f.root, "node_modules"));
  await writeFile(path.join(f.root, "node_modules/pkg.js"), "module.exports=1");
  await symlink(
    path.join(f.dir, "outside.ts"),
    path.join(f.root, "src/link.ts"),
  );
  await writeFile(
    path.join(f.dir, "outside.ts"),
    "export const outside = true;",
  );
  const after = await fingerprint(f.root, f.config);
  assert.deepEqual(after.files, before.files);
  assert.ok(after.skipped.includes("src/link.ts"));
  assert.equal(
    Object.keys(after.files).some(
      (file) => file.includes("credentials") || file.includes(".env"),
    ),
    false,
  );
});

test("runtime ausente/divergente e CLI global por symlink falham fechados", async (t) => {
  const f = await fixture(t);
  await writeFile(f.configFile, JSON.stringify({ ...f.config, pin: "0.9.68" }));
  assert.equal((await f.call("ensure")).report.status, "missing_runtime");
  await writeFile(f.configFile, JSON.stringify(f.config));
  await rm(path.join(f.env, "bin/graphify"));
  await symlink(process.execPath, path.join(f.env, "bin/graphify"));
  assert.equal((await f.call("ensure")).report.status, "missing_runtime");
});

test("grafo vazio ou inválido não substitui snapshot anterior", async (t) => {
  const f = await fixture(t);
  assert.equal((await f.call("ensure")).exitCode, 0);
  const before = await readFile(f.graph, "utf8");
  await writeFile(
    path.join(f.root, "src/value.ts"),
    'export const value = "INVALID";\n',
  );
  const result = await f.call("ensure");
  assert.equal(result.exitCode, 1);
  assert.equal(await readFile(f.graph, "utf8"), before);
});

test("mudança de código durante geração impede promoção", async (t) => {
  const f = await fixture(t);
  await writeFile(
    path.join(f.root, "src/value.ts"),
    'export const value = "MUTATE";\n',
  );
  const result = await f.call("ensure");
  assert.equal(result.exitCode, 1);
  assert.match(result.report.message, /Fonte mudou/);
  await assert.rejects(readFile(f.graph), /ENOENT/);
});

test("saída rastreada é preservada e exige fluxo versionado", async (t) => {
  const f = await fixture(t);
  await mkdir(path.dirname(f.graph));
  await writeFile(
    f.graph,
    JSON.stringify({ nodes: [{ id: "old" }], links: [] }),
  );
  git(f.root, "add", "-f", "graphify-out/graph.json");
  git(f.root, "commit", "-m", "tracked graph");
  const result = await f.call("ensure");
  assert.equal(result.exitCode, 1);
  assert.match(result.report.message, /rastreada/);
  assert.match(await readFile(f.graph, "utf8"), /old/);
});

test("corpus parcial permite apenas imports externos documentados", async (t) => {
  const f = await fixture(t);
  await mkdir(path.dirname(f.graph));
  await writeFile(
    f.graph,
    JSON.stringify({
      nodes: [{ id: "source" }],
      edges: [{ source: "source", target: "external", relation: "imports" }],
    }),
  );
  assert.equal((await validateGraph(f.graph, true)).unresolvedImports, 1);
  await assert.rejects(validateGraph(f.graph), /sem origem/);
  await writeFile(
    f.graph,
    JSON.stringify({
      nodes: [{ id: "source" }],
      edges: [{ source: "missing", target: "external", relation: "imports" }],
    }),
  );
  await assert.rejects(validateGraph(f.graph, true), /sem origem/);
});

test("configuração não pode desativar rede, escapar raiz ou trocar corpus silenciosamente", async (t) => {
  const f = await fixture(t);
  for (const update of [
    { environment: "../outside" },
    { offline: false },
    { adapter: "finance", partial: false },
  ]) {
    await writeFile(f.configFile, JSON.stringify({ ...f.config, ...update }));
    assert.equal((await f.call("mark")).exitCode, 1);
  }
});

test("install preserva ambiente individual válido sem chamar CLI global", async (t) => {
  const f = await fixture(t),
    result = await f.call("install");
  assert.equal(result.exitCode, 0);
  assert.equal(result.report.runtime.prefix, f.env);
  await assert.rejects(readFile(f.graph), /ENOENT/);
});

test("chaves do processo pai não chegam ao extrator", async (t) => {
  const f = await fixture(t);
  process.env.GRAPHIFY_FIXTURE_SECRET = "private-fixture-value";
  t.after(() => delete process.env.GRAPHIFY_FIXTURE_SECRET);
  const result = await f.call("ensure");
  assert.equal(result.exitCode, 0, JSON.stringify(result.report));
});

test("corpus de geração contém apenas arquivos permitidos e hashes grandes usam streaming", async (t) => {
  const f = await fixture(t);
  await writeFile(path.join(f.root, ".env"), "PRIVATE_FIXTURE_TOKEN=private");
  await writeFile(path.join(f.root, "credentials.json"), '{"token":"private"}');
  await mkdir(path.join(f.root, "node_modules"));
  await writeFile(path.join(f.root, "node_modules/dep.js"), "dep");
  await mkdir(path.join(f.root, "src/tools"));
  await writeFile(
    path.join(f.root, "src/tools/tool.ts"),
    "export const tool=1",
  );
  await writeFile(
    path.join(f.root, "src/large.sql"),
    Buffer.alloc(11 * 1024 * 1024, 32),
  );
  const fp = await fingerprint(f.root, f.config);
  assert.ok(fp.files["src/tools/tool.ts"]);
  assert.ok(fp.files["src/large.sql"]);
  assert.equal((await f.call("ensure")).exitCode, 0);
  const states = await readdir(path.join(f.root, f.config.state, "runs"));
  const corpus = path.join(f.root, f.config.state, "runs", states[0], "corpus");
  await assert.rejects(readdir(corpus), /ENOENT/);
  assert.equal((await f.call("status")).report.status, "current");
});
