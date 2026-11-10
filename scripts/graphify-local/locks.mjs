import {spawn} from "node:child_process";
import {randomUUID} from "node:crypto";
import {mkdir,rename,rm} from "node:fs/promises";
import path from "node:path";
import {fail,json,atomic,GraphError} from "./common.mjs";
import {environment} from "./process.mjs";

export async function acquire(dir) {
  await mkdir(path.dirname(dir), { recursive: true, mode: 0o700 });
  try {
    await mkdir(dir, { mode: 0o700 });
  } catch (e) {
    if (e.code !== "EEXIST") throw e;
    const recovery = `${dir}.recovery`;
    try {
      await mkdir(recovery, { mode: 0o700 });
    } catch {
      fail("Trava em recuperação por outro executor", "busy");
    }
    try {
      let owner;
      try {
        owner = await json(path.join(dir, "owner.json"));
      } catch {
        fail("Trava sem dono verificável", "busy");
      }
      if (!Number.isSafeInteger(owner.pid) || owner.pid <= 1)
        fail("Dono da trava inválido", "busy");
      let stale = false;
      try {
        process.kill(owner.pid, 0);
      } catch (error) {
        stale = error.code === "ESRCH";
      }
      if (!stale) fail("Outra execução usa o grafo", "busy");
      const old = `${dir}.stale-${randomUUID()}`;
      await rename(dir, old);
      try {
        await mkdir(dir, { mode: 0o700 });
      } finally {
        await rm(old, { recursive: true, force: true });
      }
    } finally {
      await rm(recovery, { recursive: true, force: true });
    }
  }
  const token = randomUUID();
  await atomic(path.join(dir, "owner.json"), { pid: process.pid, token });
  return async () => {
    const owner = await json(path.join(dir, "owner.json"));
    if (owner.token !== token) fail("Dono da trava mudou");
    await rm(dir, { recursive: true });
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
