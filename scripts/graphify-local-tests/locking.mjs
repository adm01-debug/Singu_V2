import test from "node:test";
import assert from "node:assert/strict";
import {mkdir,writeFile,readFile} from "node:fs/promises";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {acquire,acquireGlobal,run} from "../graphify-local.mjs";
import {fixture} from "./fixture.mjs";

test("trava local impede concorrência e recupera apenas dono comprovadamente morto", async (t) => {
  const f = await fixture(t),
    lock = path.join(f.dir, "local.lock"),
    release = await acquire(lock);
  await assert.rejects(acquire(lock), (e) => e.status === "busy");
  await release();
  await mkdir(lock);
  await writeFile(
    path.join(lock, "owner.json"),
    JSON.stringify({ pid: 2147483647, token: "old" }),
  );
  const recovered = await acquire(lock);
  await recovered();
});

test("lease global é interoperável com flock e libera FD ao terminar", async (t) => {
  const f = await fixture(t),
    file = path.join(f.dir, "shared.lock"),
    release = await acquireGlobal(file);
  const held = spawnSync("flock", ["-n", "-E", "75", file, "true"]);
  assert.equal(held.status, 75);
  await release();
  const free = spawnSync("flock", ["-n", "-E", "75", file, "true"]);
  assert.equal(free.status, 0);
});

test("timeout termina grupos de subprocessos e não deixa grafo parcial", async (t) => {
  const f = await fixture(t);
  await writeFile(
    f.configFile,
    JSON.stringify({ ...f.config, timeoutMs: 100 }),
  );
  await writeFile(
    path.join(f.root, "src/value.ts"),
    'export const value = "TIMEOUT";\n',
  );
  const started = Date.now(),
    result = await f.call("ensure");
  assert.equal(result.exitCode, 1);
  assert.ok(Date.now() - started < 5000);
  await assert.rejects(readFile(f.graph), /ENOENT/);
  const child = await run(
    [process.execPath, "-e", "setInterval(()=>{},1000)"],
    f.root,
    { PATH: process.env.PATH },
    100,
  );
  assert.equal(child.timedOut, true);
  assert.notEqual(child.code, 0);
});

test("lock global da manutenção impede extração e libera lock local", async (t) => {
  const f = await fixture(t),
    release = await acquireGlobal(f.options.globalLock);
  const result = await f.call("ensure");
  assert.equal(result.exitCode, 75);
  assert.equal(result.report.status, "busy");
  await release();
  assert.equal((await f.call("ensure")).exitCode, 0);
});
