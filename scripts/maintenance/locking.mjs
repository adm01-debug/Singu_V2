import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, stat, rm, open } from "node:fs/promises";
import path from "node:path";
import { MaintenanceError, safeEnv, fail, exists } from "./common.mjs";

export async function holdAdvisoryLock(file) {
  const handle = await open(file, "a", 0o600);
  await handle.close();
  return await new Promise((resolve, reject) => {
    const child = spawn(
      "flock",
      [
        "--nonblock",
        "--conflict-exit-code",
        "75",
        file,
        process.execPath,
        "-e",
        'process.stdout.write("locked\\n");process.stdin.resume();',
      ],
      { env: safeEnv(), stdio: ["pipe", "pipe", "pipe"] },
    );
    let ready = false,
      closed = false,
      response = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new MaintenanceError("failed", "flock não respondeu"));
    }, 5000);
    child.once("error", () => {
      clearTimeout(timer);
      reject(
        new MaintenanceError(
          "failed",
          "flock obrigatório para recuperar travas com segurança",
        ),
      );
    });
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (data) => {
      response += data;
      if (!ready && response.includes("locked\n")) {
        ready = true;
        clearTimeout(timer);
        resolve(async () => {
          if (closed) return;
          const completion = new Promise((done) => child.once("close", done));
          child.stdin.end();
          await completion;
        });
      }
    });
    child.once("close", (code) => {
      closed = true;
      clearTimeout(timer);
      if (!ready)
        reject(
          new MaintenanceError(
            code === 75 ? "skipped_busy" : "failed",
            code === 75
              ? "Outra execução mantém a trava do processo"
              : "Falha no processo de trava",
          ),
        );
    });
  });
}

export async function staleDirectory(directory) {
  try {
    const owner = JSON.parse(
      await readFile(path.join(directory, "owner.json"), "utf8"),
    );
    if (Number.isSafeInteger(owner.pid) && owner.pid > 1) {
      try {
        process.kill(owner.pid, 0);
        return false;
      } catch (error) {
        return error.code === "ESRCH";
      }
    }
  } catch (error) {
    if (!["ENOENT", "SyntaxError"].includes(error.code || error.name))
      throw error;
  }
  const info = await stat(directory).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  return info === null || Date.now() - info.mtimeMs > 300000;
}

export async function acquire(directory) {
  await mkdir(path.dirname(directory), { recursive: true, mode: 0o700 });
  const releaseProcess = await holdAdvisoryLock(`${directory}.guard`);
  const token = randomUUID();
  let owned = false;
  try {
    // O guard do SO serializa inclusive a recuperação da trava auxiliar. Um
    // crash fecha o pipe e libera o flock, sem depender de apagar diretórios.
    for (const current of [`${directory}.recovery`, directory])
      if (await exists(current)) {
        if (!(await staleDirectory(current)))
          throw new MaintenanceError(
            "skipped_busy",
            "Trava com dono vivo ou criação recente; consulte owner.json",
          );
        await rm(current, { recursive: true, force: true });
      }
    await mkdir(directory, { mode: 0o700 });
    await writeFile(
      path.join(directory, "owner.json"),
      JSON.stringify({
        pid: process.pid,
        token,
        startedAt: new Date().toISOString(),
      }),
      { mode: 0o600 },
    );
    owned = true;
  } finally {
    if (!owned) await releaseProcess();
  }
  return async () => {
    try {
      const owner = JSON.parse(
        await readFile(path.join(directory, "owner.json"), "utf8"),
      );
      if (owner.pid !== process.pid || owner.token !== token)
        fail("Dono da trava mudou; limpeza interrompida");
      await rm(directory, { recursive: true, force: true });
    } finally {
      await releaseProcess();
    }
  };
}
