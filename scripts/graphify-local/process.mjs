import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { homedir, loadavg, availableParallelism } from "node:os";
import { fail } from "./common.mjs";

export const active = new Set();

export function run(command, cwd, env, timeoutMs = 120000) {
  return new Promise((resolve) => {
    const child = spawn(command[0], command.slice(1), {
      cwd,
      env,
      shell: false,
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "",
      timedOut = false,
      overflow = false,
      canceled = false,
      settled = false,
      hard;
    const kill = (signal) => {
      if (child.pid)
        try {
          process.kill(-child.pid, signal);
        } catch {
          /* processo encerrado */
        }
    };
    const finish = (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearTimeout(hard);
      active.delete(cancel);
      kill("SIGKILL");
      child.stdout.destroy();
      child.stderr.destroy();
      resolve({
        code: timedOut || overflow || canceled ? 1 : (code ?? 1),
        output,
        timedOut,
        overflow,
        canceled,
      });
    };
    const stop = () => {
      kill("SIGTERM");
      hard ||= setTimeout(() => {
        kill("SIGKILL");
        finish(1);
      }, 1000);
    };
    const cancel = () => {
      canceled = true;
      stop();
    };
    active.add(cancel);
    const timer = setTimeout(() => {
      timedOut = true;
      stop();
    }, timeoutMs);
    const collect = (chunk) => {
      if (Buffer.byteLength(output) + chunk.length > 4 * 1024 * 1024) {
        overflow = true;
        stop();
      } else output += chunk;
    };
    child.stdout.on("data", collect);
    child.stderr.on("data", collect);
    child.once("error", () => finish(1));
    child.once("close", finish);
  });
}

export function environment(extra = {}) {
  return {
    PATH: `${path.dirname(process.execPath)}:${path.join(homedir(), ".local/bin")}:/usr/local/bin:/usr/bin:/bin`,
    HOME: homedir(),
    LANG: "C.UTF-8",
    TZ: "America/Sao_Paulo",
    PYTHONNOUSERSITE: "1",
    PYTHONHASHSEED: "0",
    GRAPHIFY_MAX_WORKERS: "1",
    NO_COLOR: "1",
    GIT_TERMINAL_PROMPT: "0",
    ...extra,
  };
}

export async function checked(command, root, env, timeout) {
  const r = await run(command, root, env, timeout);
  if (r.code !== 0 || r.timedOut || r.overflow || r.canceled)
    fail(
      `Comando ${path.basename(command[0])} falhou (exit=${r.code}, timeout=${r.timedOut})`,
    );
  return r.output.trim();
}

export const git = async (root, args) => {
  const r = await run(
    ["git", "-c", "core.hooksPath=/dev/null", "-C", root, ...args],
    root,
    environment(),
    30000,
  );
  if (r.code !== 0 || r.timedOut || r.overflow || r.canceled)
    fail("Leitura Git falhou");
  return args.includes("-z") ? r.output : r.output.trim();
};

export async function offline(ctx) {
  if (ctx.fixtureOfflinePrefix !== undefined) return ctx.fixtureOfflinePrefix; // Injeção só da API de testes; nenhuma flag/config permite isso.
  const script =
    'process.stdout.write(require("node:fs").readlinkSync("/proc/self/ns/net"))';
  const host = await checked(
    [process.execPath, "-e", script],
    ctx.root,
    ctx.env,
    5000,
  );
  const prefix = ["unshare", "--user", "--map-root-user", "--net", "--"];
  const isolated = await checked(
    [...prefix, process.execPath, "-e", script],
    ctx.root,
    ctx.env,
    5000,
  );
  if (isolated === host || !isolated.startsWith("net:["))
    fail("Namespace offline indisponível");
  return prefix;
}

export function assertResources(sample, minAvailableMb) {
  const { availableMb, load, parallelism } = sample;
  if (![availableMb, load, parallelism].every(Number.isFinite) || availableMb < minAvailableMb || load < 0 || parallelism < 1 || load > parallelism) fail('Geração adiada por memória/carga', 'resources');
}
async function resourceProbe() {
  const bytes = await readFile('/proc/meminfo', 'utf8');
  return { availableMb: Number(/MemAvailable:\s+(\d+)/.exec(bytes)?.[1] || 0) / 1024, load: loadavg()[0], parallelism: availableParallelism() };
}
export async function resources(ctx) {
  assertResources(await (ctx.resourceProbe || resourceProbe)(), ctx.config.minAvailableMb);
}
