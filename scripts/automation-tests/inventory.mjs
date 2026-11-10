import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { parseArgs, validateConfig } from "../automation.mjs";
import { fixture } from "./fixture.mjs";

test("doctor static verifica alias, arquivos, eventos e run real sem ativar Git", (t) => {
  const f = fixture(t);
  const before = f.git("config", "core.hooksPath");
  let result = f.cli("doctor", "--static");
  assert.equal(result.status, 0, result.stdout);
  const health = JSON.parse(result.stdout);
  assert.equal(health.source, "source_integrated");
  assert.equal(health.ciActive, false);
  assert.equal(health.hooks, "not_installed");
  assert.equal(f.git("config", "core.hooksPath"), before);
  f.write("package.json", '{"scripts":{}}');
  result = f.cli("doctor", "--static");
  assert.equal(result.status, 1);
  assert.match(result.stdout, /alias não encadeado/);
});

test("doctor bloqueia script novo órfão e legado catch-all ou sem justificativa", (t) => {
  const f = fixture(t);
  f.write("scripts/orphan.sh", "exit 0\n");
  const r = f.cli("doctor", "--static");
  assert.equal(r.status, 1);
  assert.match(r.stdout, /script sem registro\/gatilho/);
  f.config.registrations.push({
    id: "legacy",
    kind: "legacy",
    files: ["scripts/**"],
    manual: ["sh", "scripts/orphan.sh"],
    triggers: ["manual"],
    reason: "Operação destrutiva, somente manual.",
  });
  assert.throws(() => validateConfig(f.config), /arquivos exatos/);
});

test("doctor não confunde comentário de workflow com execução", (t) => {
  const f = fixture(t);
  f.write(
    ".github/workflows/ci.yml",
    "on:\n  pull_request: {}\n  push:\n    branches: [main]\n# run: node scripts/automation.mjs test\njobs: {}\n",
  );
  const r = f.cli("doctor", "--static");
  assert.equal(r.status, 1);
  assert.match(r.stdout, /sem run encadeado/);
});

test("CLI/config desconhecidos falham e check/heal exigem ref explícita", (t) => {
  const f = fixture(t);
  for (const args of [
    ["unknown"],
    ["doctor", "--oops"],
    ["check"],
    ["heal"],
    ["nightly"],
  ])
    assert.notEqual(f.cli(...args).status, 0);
  f.config.secretEscape = true;
  f.save();
  assert.notEqual(f.cli("doctor", "--static").status, 0);
  assert.throws(() => parseArgs(["doctor", "--root"]), /exige valor/);
});

test("dependência ausente falha no doctor local sem instalação automática", (t) => {
  const f = fixture(t);
  f.config.requirements = ["node_modules/fixture-cli/package.json"];
  f.save();
  f.install();
  assert.equal(f.cli("doctor", "--static").status, 0);
  const r = f.cli("doctor");
  assert.equal(r.status, 1);
  assert.match(r.stdout, /arquivo ausente: node_modules/);
  assert.equal(existsSync(join(f.root, "node_modules")), false);
});

test("registro operacional manual não é executado por hooks ou nightly", (t) => {
  const f = fixture(t);
  f.write(
    "scripts/legacy-danger.sh",
    "#!/bin/sh\nprintf indevido > fixture-legacy.log\nexit 9\n",
  );
  f.config.registrations.push({
    id: "legacy-op",
    kind: "legacy",
    files: ["scripts/legacy-danger.sh"],
    manual: ["sh", "scripts/legacy-danger.sh"],
    triggers: ["manual"],
    reason:
      "Operação operacional exige seleção manual explícita; não pertence aos gates.",
  });
  f.save();
  f.install();
  assert.equal(f.cli("nightly", "--ref", "HEAD").status, 0);
  const hook = f.run(
    join(f.root, ".tools/repo-automation/hooks/pre-push"),
    ["origin", "fixture"],
    { input: "" },
  );
  assert.equal(hook.status, 0, hook.stderr);
  assert.equal(existsSync(join(f.root, "fixture-legacy.log")), false);
});
