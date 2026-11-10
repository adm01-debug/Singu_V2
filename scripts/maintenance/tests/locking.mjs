import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  rm,
  utimes,
} from "node:fs/promises";
import { spawn } from "node:child_process";
import { once } from "node:events";
import os from "node:os";
import path from "node:path";
import { networkPrefix } from "../run.mjs";
import { run, acquire, exists } from "../lib.mjs";
import { isolated } from "./fixture.mjs";

test("trava atômica impede segundo executor", async (t) => {
  const d = await mkdtemp(path.join(os.tmpdir(), "maintenance-lock-"));
  t.after(() => rm(d, { recursive: true, force: true }));
  const unlock = await acquire(path.join(d, "lock"));
  await assert.rejects(
    acquire(path.join(d, "lock")),
    (e) => e.code === "skipped_busy",
  );
  await unlock();
  const again = await acquire(path.join(d, "lock"));
  await again();
});

test("timeout mata grupo de subprocessos e distingue resultado", async () => {
  const start = Date.now();
  const result = await run(
    ["node", "-e", "setInterval(()=>{},1000)"],
    process.cwd(),
    100,
  );
  assert.equal(result.timedOut, true);
  assert.notEqual(result.code, 0);
  assert.ok(Date.now() - start < 2500);
});

test("trava de pid morto é recuperada, trava recente sem dono fica bloqueante", async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "maintenance-stale-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const lock = path.join(dir, "lock");
  await mkdir(lock);
  await writeFile(
    path.join(lock, "owner.json"),
    JSON.stringify({ pid: 2147483647 }),
  );
  const release = await acquire(lock);
  await release();
  await mkdir(lock);
  await assert.rejects(acquire(lock), (e) => e.code === "skipped_busy");
});

test(
  "namespace de rede impede acesso externo de todos os filhos",
  isolated,
  async () => {
    const prefix = await networkPrefix(process.cwd());
    const result = await run(
      [
        ...prefix,
        "node",
        "-e",
        "fetch('http://192.0.2.1:9').then(()=>process.exit(7),()=>process.exit(0))",
      ],
      process.cwd(),
      5000,
    );
    assert.equal(result.code, 0);
    assert.equal(result.timedOut, false);
  },
);

test("stdout e stderr preservam UTF8 partido entre eventos", async () => {
  const code = `process.stdout.write(Buffer.from([0xc3]));process.stderr.write(Buffer.from([0xf0,0x9f]));setTimeout(()=>{process.stdout.write(Buffer.from([0xa7]));process.stderr.write(Buffer.from([0x98,0x80]));},30);`;
  const result = await run(["node", "-e", code], process.cwd(), 1000);
  assert.equal(result.stdout, "ç");
  assert.equal(result.stderr, "😀");
  assert.ok(!result.output.includes("\ufffd"));
});

test("trava recovery abandonada também é recuperada e recovery de dono vivo permanece", async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "maintenance-recovery-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const lock = path.join(dir, "lock");
  for (const name of [lock, `${lock}.recovery`]) {
    await mkdir(name);
    await writeFile(
      path.join(name, "owner.json"),
      JSON.stringify({ pid: 2147483647, token: "dead" }),
    );
  }
  const release = await acquire(lock);
  await release();
  assert.equal(await exists(`${lock}.recovery`), false);
  await mkdir(`${lock}.recovery`);
  await writeFile(
    path.join(`${lock}.recovery`, "owner.json"),
    JSON.stringify({ pid: process.pid, token: "live" }),
  );
  await assert.rejects(acquire(lock), (error) => error.code === "skipped_busy");
  assert.equal(
    JSON.parse(
      await readFile(path.join(`${lock}.recovery`, "owner.json"), "utf8"),
    ).token,
    "live",
  );
});

test("recovery antiga sem dono é recuperada e token alheio impede limpeza", async (t) => {
  const dir = await mkdtemp(
    path.join(os.tmpdir(), "maintenance-recovery-age-"),
  );
  t.after(() => rm(dir, { recursive: true, force: true }));
  const lock = path.join(dir, "lock");
  await mkdir(`${lock}.recovery`);
  const old = new Date(Date.now() - 600000);
  await utimes(`${lock}.recovery`, old, old);
  const release = await acquire(lock);
  await writeFile(
    path.join(lock, "owner.json"),
    JSON.stringify({ pid: process.pid, token: "different-owner" }),
  );
  await assert.rejects(release(), /Dono da trava mudou/);
  assert.equal(await exists(lock), true);
});

test("crash libera flock automaticamente e permite recuperar a trava de PID morto", async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "maintenance-lock-crash-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const lock = path.join(dir, "lock");
  const child = spawn(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `import {acquire} from ${JSON.stringify(new URL("../lib.mjs", import.meta.url).href)};await acquire(${JSON.stringify(lock)});console.log('ready');setInterval(()=>{},1000);`,
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  t.after(() => child.kill("SIGKILL"));
  await once(child.stdout, "data");
  const closed = once(child, "close");
  child.kill("SIGKILL");
  await closed;
  let release;
  for (let attempt = 0; attempt < 50 && !release; attempt++) {
    try {
      release = await acquire(lock);
    } catch (error) {
      if (error.code !== "skipped_busy") throw error;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }
  assert.equal(typeof release, "function");
  await release();
});

test("run transmite entrada binária apenas pelo pipe sem shell ou arquivos temporários", async () => {
  const input = Buffer.from([0, 255, 128, 42]);
  const result = await run(
    [process.execPath, "-e", "process.stdin.pipe(process.stdout)"],
    process.cwd(),
    5000,
    { input },
  );
  assert.equal(result.code, 0);
  assert.equal(result.stdout, input.toString("utf8"));
});
