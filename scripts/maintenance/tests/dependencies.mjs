import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, writeFile, rm, symlink } from "node:fs/promises";
import path from "node:path";
import { main } from "../run.mjs";
import { git, dependencyFingerprint } from "../lib.mjs";
import { fixture, isolated, vendorFixture, saveFixture } from "./fixture.mjs";

test(
  "dependências divergentes da referência bloqueiam reutilização",
  isolated,
  async (t) => {
    const f = await fixture(t);
    await writeFile(path.join(f.root, "package-lock.json"), '{"changed":true}');
    const result = await main(f.args());
    assert.equal(result.report.status, "missing_dependencies");
    assert.equal(result.exitCode, 2);
  },
);

test(
  "dependência vendor por link idêntico é reutilizada sem instalar pacotes",
  isolated,
  async (t) => {
    const f = await vendorFixture(t);
    const result = await main(f.args());
    assert.equal(
      result.report.status,
      "validated_patch",
      JSON.stringify(result.report),
    );
    assert.equal(
      typeof result.report.dependencies.local["vendor/local-dep"],
      "string",
    );
  },
);

test(
  "vendor sujo e referência com vendor diferente bloqueiam antes dos gates",
  isolated,
  async (t) => {
    const f = await vendorFixture(t),
      base = await git(f.root, ["rev-parse", "HEAD"]);
    await writeFile(
      path.join(f.vendor, "index.cjs"),
      "module.exports = 'modified';\n",
    );
    const dirty = await main(f.args());
    assert.equal(dirty.report.status, "missing_dependencies");
    assert.equal(dirty.report.steps.length, 0);
    await saveFixture(f);
    const args = f.args();
    args[args.indexOf("--ref") + 1] = base;
    const old = await main(args);
    assert.equal(old.report.status, "missing_dependencies");
    assert.equal(old.report.steps.length, 0);
  },
);

test(
  "link instalado para outro vendor divergente e file externo são recusados",
  isolated,
  async (t) => {
    const f = await vendorFixture(t),
      outside = path.join(f.dir, "other");
    await mkdir(outside);
    await writeFile(path.join(outside, "package.json"), '{"name":"local-dep"}');
    await rm(path.join(f.root, "node_modules/local-dep"));
    await symlink(outside, path.join(f.root, "node_modules/local-dep"));
    const result = await main(f.args());
    assert.equal(result.report.status, "missing_dependencies");
    await writeFile(
      path.join(f.root, "package.json"),
      '{"dependencies":{"outside":"file:../other"}}',
    );
    await assert.rejects(dependencyFingerprint(f.root), /fora do repositório/);
  },
);

test(
  "mudança do vendor durante gate impede sucesso mesmo em check sem patch",
  isolated,
  async (t) => {
    const f = await vendorFixture(t);
    await writeFile(
      path.join(f.root, "scripts/gate.mjs"),
      `import fs from 'node:fs';if(process.argv[2]==='build')fs.writeFileSync(${JSON.stringify(path.join(f.vendor, "index.cjs"))}, 'modified during gate');`,
    );
    await saveFixture(f);
    const result = await main(f.args("check"));
    assert.equal(result.report.status, "failed");
    assert.match(result.report.message, /Dependências do clone mudaram/);
  },
);
