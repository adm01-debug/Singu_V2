import { spawn } from "node:child_process";
import { existsSync, lstatSync, realpathSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { fail, APPROVED, within, relativePath } from "./common.mjs";

export async function execute(
  argv,
  { cwd, timeout = 300000, capture = false, env = process.env } = {},
) {
  return new Promise((done) => {
    const args =
      argv[0] === "node" ? [process.execPath, ...argv.slice(1)] : argv;
    const child = spawn(args[0], args.slice(1), {
      cwd,
      env,
      shell: false,
      detached: process.platform !== "win32",
      stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    });
    const chunks = [],
      errors = [];
    let finished = false,
      timedOut = false,
      interrupted = false,
      forced;
    const kill = (signal) => {
      try {
        process.kill(
          process.platform === "win32" ? child.pid : -child.pid,
          signal,
        );
      } catch { /* Filho pode já ter terminado. */ }
    };
    const finish = (code, message) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      clearTimeout(forced);
      process.removeListener("SIGTERM", terminate);
      process.removeListener("SIGINT", terminate);
      done({
        code,
        timedOut,
        ...(capture
          ? {
              stdout: Buffer.concat(chunks).toString("utf8"),
              stderr: Buffer.concat(errors).toString("utf8"),
            }
          : {}),
        ...(message ? { error: message } : {}),
      });
    };
    const terminate = () => {
      interrupted = true;
      kill("SIGTERM");
      forced = setTimeout(() => {
        kill("SIGKILL");
        finish(130, "interrompido");
      }, 500);
    };
    process.once("SIGTERM", terminate);
    process.once("SIGINT", terminate);
    const timer = setTimeout(() => {
      timedOut = true;
      kill("SIGTERM");
      forced = setTimeout(() => {
        kill("SIGKILL");
        finish(124, "timeout");
      }, 500);
    }, timeout);
    child.stdout?.on("data", (x) => {
      if (chunks.reduce((a, b) => a + b.length, 0) < 4 * 1024 * 1024)
        chunks.push(x);
    });
    child.stderr?.on("data", (x) => {
      if (errors.reduce((a, b) => a + b.length, 0) < 4 * 1024 * 1024)
        errors.push(x);
    });
    child.once("error", (e) => finish(127, e.code || "spawn_failed"));
    child.once("close", (code, signal) => {
      if (timedOut || interrupted) kill("SIGKILL");
      finish(timedOut ? 124 : interrupted ? 130 : (code ?? 1), signal);
    });
  });
}

export async function git(root, args, allowed = [0]) {
  const r = await execute(["git", "-C", root, ...args], {
    cwd: root,
    capture: true,
    timeout: 15000,
  });
  if (!allowed.includes(r.code))
    throw fail(`git ${args[0]} falhou (${r.code})`);
  return r;
}

export function approved(path, configPath) {
  if (
    !existsSync(APPROVED) ||
    lstatSync(APPROVED).isSymbolicLink() ||
    !existsSync(configPath) ||
    !within(realpathSync(APPROVED), realpathSync(configPath)) ||
    !within(realpathSync(APPROVED), realpathSync(path))
  )
    throw fail("caminho externo fora do runtime instalado aprovado");
  return realpathSync(path);
}

export function locate(root, c, configPath, path) {
  if (isAbsolute(path)) return approved(path, configPath);
  if (!relativePath(path)) throw fail(`caminho inválido ${path}`);
  const target = resolve(root, path);
  if (c.snapshot) {
    const snapshotRoot = approved(c.snapshot.root, configPath);
    const candidate = resolve(snapshotRoot, path);
    if (existsSync(candidate)) return approved(candidate, configPath);
  }
  if (existsSync(target)) {
    if (!within(realpathSync(root), realpathSync(target)))
      throw fail(`symlink fora do repositório: ${path}`);
    return target;
  }
  if (c.snapshot) {
    const snapshotRoot = approved(c.snapshot.root, configPath);
    const targetSnapshot = resolve(snapshotRoot, path);
    if (existsSync(targetSnapshot)) return approved(targetSnapshot, configPath);
  }
  throw fail(`arquivo ausente: ${path}`);
}
