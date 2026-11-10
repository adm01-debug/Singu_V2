import test from "node:test";
import assert from "node:assert/strict";
import {cpSync,mkdirSync,writeFileSync} from "node:fs";
import {dirname,join} from "node:path";
import {fixture} from "./fixture.mjs";

test("snapshot aprovado atende pré-merge sem afirmar source/CI integrados", (t) => {
  const f = fixture(t);
  const home = join(f.root, "fixture-home"),
    store = join(home, ".local/share/repo-maintenance"),
    snapshot = join(store, "snapshots/fixture");
  mkdirSync(snapshot, { recursive: true });
  for (const rel of [
    "scripts",
    ".github",
    "package.json",
    "graphify.local.json",
  ])
    cpSync(join(f.root, rel), join(snapshot, rel), { recursive: true });
  f.write("package.json", '{"scripts":{}}');
  const config = {
    ...f.config,
    snapshot: { root: snapshot, ref: "1".repeat(40) },
  };
  const installed = join(store, "profiles/fixture.json");
  mkdirSync(dirname(installed), { recursive: true });
  writeFileSync(installed, JSON.stringify(config));
  const r = f.run(
    process.execPath,
    [
      join(snapshot, "scripts/automation.mjs"),
      "--root",
      f.root,
      "--config",
      installed,
      "doctor",
      "--static",
    ],
    { env: { ...process.env, HOME: home } },
  );
  assert.equal(r.status, 0, r.stderr + r.stdout);
  const health = JSON.parse(r.stdout);
  assert.equal(health.source, "installed_snapshot");
  assert.equal(health.ciActive, false);
  const outside = join(f.root, "outside.mjs");
  writeFileSync(outside, "process.exit(0)");
  config.entrypoint = outside;
  writeFileSync(installed, JSON.stringify(config));
  const blocked = f.run(
    process.execPath,
    [
      join(snapshot, "scripts/automation.mjs"),
      "--root",
      f.root,
      "--config",
      installed,
      "doctor",
      "--static",
    ],
    { env: { ...process.env, HOME: home } },
  );
  assert.equal(blocked.status, 1);
  assert.match(blocked.stdout, /fora do runtime instalado aprovado/);
});
