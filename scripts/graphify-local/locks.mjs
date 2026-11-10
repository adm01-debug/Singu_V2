import { lstat } from 'node:fs/promises';
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fail, json, atomic, GraphError, exists } from "./common.mjs";
import { environment } from "./process.mjs";

async function staleLockDirectory(directory) {
  const info = await lstat(directory).catch(error => { if(error.code === 'ENOENT') return null; throw error; });
  if (!info) return true;
  if (!info.isDirectory() || info.isSymbolicLink()) fail('Trava local não é diretório regular', 'busy');
  try {
    const owner = await json(path.join(directory, 'owner.json'));
    if (Number.isSafeInteger(owner.pid) && owner.pid > 1) {
      try { process.kill(owner.pid, 0); return false; } catch(error) { return error.code === 'ESRCH'; }
    }
  } catch(error) { if (!['ENOENT', 'SyntaxError'].includes(error.code || error.name)) throw error; }
  return Date.now() - info.mtimeMs > 300000;
}
export async function acquire(dir) {
  await mkdir(path.dirname(dir), { recursive: true, mode: 0o700 });
  const releaseProcess = await acquireGlobal(`${dir}.guard`);
  const token = randomUUID(); let owned = false;
  try {
    for (const current of [`${dir}.recovery`, dir]) if (await exists(current)) {
      if (!await staleLockDirectory(current)) fail('Trava com dono vivo ou criação recente', 'busy');
      await rm(current, { recursive: true, force: true });
    }
    await mkdir(dir, { mode: 0o700 });
    await atomic(path.join(dir, 'owner.json'), { pid: process.pid, token, startedAt: new Date().toISOString() });
    owned = true;
  } finally { if (!owned) await releaseProcess(); }
  return async () => {
    try {
      const owner = await json(path.join(dir, 'owner.json'));
      if (owner.pid !== process.pid || owner.token !== token) fail('Dono da trava mudou');
      await rm(dir, { recursive: true });
    } finally { await releaseProcess(); }
  };
}
export async function acquireGlobal(file) {
  await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  return new Promise((resolve, reject) => {
    const child = spawn(
      "flock",
      [
        "-n",
        "-E",
        "75",
        file,
        process.execPath,
        "-e",
        'process.stdout.write("LOCKED\\n");process.stdin.resume();process.stdin.on("end",()=>process.exit(0));',
      ],
      { detached: true, env: environment(), stdio: ["pipe", "pipe", "pipe"] },
    );
    let ready = false,
      output = "",
      finished = false;
    const kill = () => {
      if (child.pid)
        try {
          process.kill(-child.pid, "SIGKILL");
        } catch {
          /* lease encerrado */
        }
    };
    const timer = setTimeout(() => {
      kill();
      if (!ready)
        reject(new GraphError("failed", "Timeout ao adquirir trava global"));
    }, 5000);
    child.stderr.resume();
    child.stdout.on("data", (part) => {
      output += part;
      if (!ready && output.includes("LOCKED\n")) {
        ready = true;
        clearTimeout(timer);
        const release = async () => {
          if (finished) return;
          await new Promise((done) => {
            const timeout = setTimeout(() => {
              kill();
              done();
            }, 1500);
            child.once("close", () => {
              clearTimeout(timeout);
              done();
            });
            child.stdin.end();
          });
        };
        release.alive = () => !finished;
        resolve(release);
      }
    });
    child.once("error", () => {
      clearTimeout(timer);
      reject(new GraphError("failed", "flock indisponível"));
    });
    child.once("close", (code) => {
      finished = true;
      clearTimeout(timer);
      if (!ready)
        reject(
          new GraphError(
            code === 75 ? "busy" : "failed",
            "Outra manutenção usa a trava global",
          ),
        );
    });
  });
}
