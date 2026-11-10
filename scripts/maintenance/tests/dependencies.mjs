import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdir,
  writeFile,
  rm,
  symlink,
  lstat,
  rename,
  readFile,
} from "node:fs/promises";
import path from "node:path";
import { main } from "../run.mjs";
import { git, dependencyFingerprint, readRegularDependency } from "../lib.mjs";
import {
  fixture,
  isolated,
  vendorFixture,
  saveFixture,
  archiveFixture,
} from "./fixture.mjs";

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

test("leitura vendor rejeita symlink trocado após inspeção sem seguir seu alvo", async (t) => {
  const f = await fixture(t),
    file = path.join(f.root, "src/value.ts");
  const expected = await lstat(file),
    outside = path.join(f.dir, "outside.ts");
  await writeFile(outside, "outside fixture");
  await rm(file);
  await symlink(outside, file);
  await assert.rejects(
    readRegularDependency(file, expected),
    (e) => e.code === "missing_dependencies",
  );
  assert.equal(await readFile(outside, "utf8"), "outside fixture");
});

test("leitura vendor vincula validação e bytes ao mesmo inode", async (t) => {
  const f = await fixture(t),
    file = path.join(f.root, "src/value.ts");
  const expected = await lstat(file),
    replacement = path.join(f.dir, "replacement.ts");
  await writeFile(replacement, "replacement fixture");
  await rename(replacement, file);
  await assert.rejects(
    readRegularDependency(file, expected),
    /substituído durante a inspeção/,
  );
});

test(
  "tarball local versionado com integridade é reutilizado sem extração ou instalação",
  isolated,
  async (t) => {
    const f = await archiveFixture(t),
      fingerprint = await dependencyFingerprint(f.root);
    assert.equal(typeof fingerprint.local[f.relative], "string");
    assert.equal(fingerprint.archives[f.relative][0].version, "1.0.0");
    const result = await main(f.args("check"));
    assert.equal(
      result.report.status,
      "checked",
      JSON.stringify(result.report),
    );
  },
);

test("bytes alterados de tarball local são recusados pelo lock antes dos gates", async (t) => {
  const f = await archiveFixture(t);
  await writeFile(f.archive, "modified bytes");
  await assert.rejects(dependencyFingerprint(f.root), /Integridade do tarball/);
});

test("tarball local exige identidade instalada e não admite links externos", async (t) => {
  const f = await archiveFixture(t);
  await writeFile(
    path.join(f.installed, "package.json"),
    JSON.stringify({ name: "local-tgz", version: "2.0.0" }),
  );
  await assert.rejects(dependencyFingerprint(f.root), /Identidade instalada/);
  await rm(f.installed, { recursive: true });
  const outside = path.join(f.dir, "external-package");
  await mkdir(outside);
  await symlink(outside, f.installed);
  await assert.rejects(dependencyFingerprint(f.root), /fora de node_modules/);
});

test("tarball substituído por symlink é recusado sem ler o destino externo", async (t) => {
  const f = await archiveFixture(t),
    outside = path.join(f.dir, "external-archive");
  await writeFile(outside, "external fixture");
  await rm(f.archive);
  await symlink(outside, f.archive);
  await assert.rejects(
    dependencyFingerprint(f.root),
    /diretório ou tarball regular/,
  );
});

test(
  "tarball em Bun lock com vírgulas finais usa integridade e manifesto sem extração",
  isolated,
  async (t) => {
    const f = await archiveFixture(t);
    const lock = JSON.parse(
      await readFile(path.join(f.root, "package-lock.json"), "utf8"),
    );
    const integrity = lock.packages["node_modules/local-tgz"].integrity;
    await rm(path.join(f.root, "package-lock.json"));
    await writeFile(
      path.join(f.root, "bun.lock"),
      '{"lockfileVersion":1,"packages":{"local-tgz":["local-tgz@vendor/local.tgz",{},' +
        JSON.stringify(integrity) +
        ",],},}",
    );
    await saveFixture(f);
    const fingerprint = await dependencyFingerprint(f.root);
    assert.equal(fingerprint.archives[f.relative][0].version, "1.0.0");
    assert.equal((await main(f.args("check"))).report.status, "checked");
  },
);
