import {once} from 'node:events';
import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, writeFile, readFile, rm, utimes } from "node:fs/promises";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import {
  acquire,
  acquireGlobal,
  run,
  main,
  assertResources,
} from "../graphify-local.mjs";
import { fixture } from "./fixture.mjs";

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

test("política de recursos usa amostra determinística e bloqueia memória/carga insuficientes", async (t) => {
  assert.doesNotThrow(() =>
    assertResources({ availableMb: 6144, load: 2, parallelism: 2 }, 6144),
  );
  for (const sample of [
    { availableMb: 6143, load: 0, parallelism: 2 },
    { availableMb: 8192, load: 2.01, parallelism: 2 },
    { availableMb: NaN, load: 0, parallelism: 2 },
  ])
    assert.throws(
      () => assertResources(sample, 6144),
      (e) => e.status === "resources",
    );
  const f = await fixture(t);
  const denied = await main(f.args("ensure"), {
    ...f.options,
    resourceProbe: async () => ({ availableMb: 0, load: 0, parallelism: 2 }),
  });
  assert.equal(denied.exitCode, 75);
  assert.equal(denied.report.status, "resources");
  await assert.rejects(readFile(f.graph), /ENOENT/);
  assert.equal((await f.call("ensure")).exitCode, 0);
  for (const key of ["resourceProbe", "fixtureOfflinePrefix"]) {
    await writeFile(
      f.configFile,
      JSON.stringify({ ...f.config, [key]: { availableMb: 1e9 } }),
    );
    assert.equal((await f.call("ensure")).exitCode, 1);
  }
});

const KIT_MODULE = new URL('../graphify-local.mjs',import.meta.url).href;

test('recovery antigo sem dono é removido sob flock e não bloqueia novas execuções', async(t)=>{
 const f=await fixture(t),lock=path.join(f.dir,'recovery.lock'),recovery=lock+'.recovery';
 await mkdir(recovery);await utimes(recovery,new Date(0),new Date(0));
 const first=await acquire(lock);await first();const second=await acquire(lock);await second();
 await assert.rejects(readFile(path.join(recovery,'owner.json')),/ENOENT/);
});

test('recovery com dono vivo é preservado e a tentativa libera seu flock', async(t)=>{
 const f=await fixture(t),lock=path.join(f.dir,'alive.lock'),recovery=lock+'.recovery';await mkdir(recovery);
 await writeFile(path.join(recovery,'owner.json'),JSON.stringify({pid:process.pid,token:'owner-fixture'}));
 await assert.rejects(acquire(lock),e=>e.status==='busy');
 assert.equal(JSON.parse(await readFile(path.join(recovery,'owner.json'),'utf8')).token,'owner-fixture');
 await rm(recovery,{recursive:true});const release=await acquire(lock);await release();
});

test('SIGKILL libera o guard do SO e duas aquisições seguintes recuperam a trava', async(t)=>{
 const f=await fixture(t),lock=path.join(f.dir,'crashed.lock');
 const child=spawn(process.execPath,['--input-type=module','-e',`import{acquire}from${JSON.stringify(KIT_MODULE)};await acquire(${JSON.stringify(lock)});process.stdout.write('ready\\n');setInterval(()=>{},1000);`],{stdio:['ignore','pipe','pipe']});
 t.after(()=>child.kill('SIGKILL'));await once(child.stdout,'data');child.kill('SIGKILL');await once(child,'close');
 let release;
 for(let attempt=0;attempt<100&&!release;attempt++){
  try{release=await acquire(lock);}catch(error){if(error.status!=='busy')throw error;await new Promise(resolve=>setTimeout(resolve,10));}
 }
 assert.equal(typeof release,'function');await release();const again=await acquire(lock);await again();
});

test('run preserva UTF8 dividido por stream e distingue stdout de stderr', async()=>{
 const code="process.stdout.write(Buffer.from([0xc3]));process.stderr.write(Buffer.from([0xc3]));setTimeout(()=>{process.stdout.write(Buffer.from([0xa7]));process.stderr.write(Buffer.from([0xa3]));},30)";
 const result=await run([process.execPath,'-e',code],process.cwd(),process.env,2000);
 assert.equal(result.code,0);assert.equal(result.stdout,'ç');assert.equal(result.stderr,'ã');assert.equal(result.output.includes('\ufffd'),false);
});

