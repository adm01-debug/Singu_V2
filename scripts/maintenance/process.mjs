import {spawn} from "node:child_process";
import {StringDecoder} from "node:string_decoder";
import path from "node:path";
import {MaintenanceError,safeEnv,fail} from "./common.mjs";

export const activeChildren = new Map();

export function stopChildren() {
  for (const [pid, child] of activeChildren) {
    try {
      process.kill(-pid, "SIGTERM");
    } catch {
      /* O processo pode já ter encerrado. */
    }
    setTimeout(() => {
      if (activeChildren.get(pid) === child) {
        try {
          process.kill(-pid, "SIGKILL");
        } catch {
          /* O processo pode já ter encerrado. */
        }
        child.stdout.destroy();
        child.stderr.destroy();
      }
    }, 1000).unref();
  }
}

export function run(command, cwd, timeoutMs = 120000, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command[0], command.slice(1), {
      cwd,
      shell: false,
      detached: true,
      env: safeEnv(options),
      stdio: ["ignore", "pipe", "pipe"],
    });
    if (child.pid) activeChildren.set(child.pid, child);
    let output = "",
      stdout = "",
      stderr = "",
      bytes = 0,
      timedOut = false,
      overflow = false;
    const decoders = {
      stdout: new StringDecoder("utf8"),
      stderr: new StringDecoder("utf8"),
    };
    const kill = (signal) => {
      try {
        process.kill(-child.pid, signal);
      } catch {
        /* O processo pode já ter encerrado. */
      }
    };
    const timer = setTimeout(() => {
      timedOut = true;
      kill("SIGTERM");
    }, timeoutMs);
    const hardTimer = setTimeout(() => {
      kill("SIGKILL");
      child.stdout.destroy();
      child.stderr.destroy();
    }, timeoutMs + 1000);
    const collect = (stream, data) => {
      bytes += data.length;
      if (bytes > 4 * 1024 * 1024) {
        overflow = true;
        kill("SIGKILL");
        child.stdout.destroy();
        child.stderr.destroy();
        return;
      }
      const text = decoders[stream].write(data);
      output += text;
      if (stream === "stdout") stdout += text;
      else stderr += text;
    };
    child.stdout.on("data", (data) => collect("stdout", data));
    child.stderr.on("data", (data) => collect("stderr", data));
    child.once("error", (e) => {
      activeChildren.delete(child.pid);
      clearTimeout(timer);
      clearTimeout(hardTimer);
      reject(
        new MaintenanceError(
          "failed",
          `Não foi possível executar ${path.basename(command[0])}: ${e.code}`,
        ),
      );
    });
    child.once("close", (code, signal) => {
      const outEnd = decoders.stdout.end(),
        errEnd = decoders.stderr.end();
      stdout += outEnd;
      stderr += errEnd;
      output += outEnd + errEnd;
      activeChildren.delete(child.pid);
      kill("SIGKILL");
      clearTimeout(timer);
      clearTimeout(hardTimer);
      resolve({ code, signal, timedOut, overflow, output, stdout, stderr });
    });
  });
}

export async function checked(command, cwd, timeout) {
  const result = await run(command, cwd, timeout);
  if (result.code !== 0 || result.timedOut || result.overflow)
    fail(
      `Comando ${path.basename(command[0])} falhou (exit=${result.code}, timeout=${result.timedOut}, limiteSaida=${result.overflow})`,
    );
  return result.output.trim();
}

export const git = (cwd, args, timeout, prefix = []) =>
  checked(
    [...prefix, "git", "-c", "core.hooksPath=/dev/null", ...args],
    cwd,
    timeout,
  );
