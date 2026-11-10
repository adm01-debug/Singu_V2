#!/usr/bin/env node
import { mkdir, realpath, rm } from "node:fs/promises";
import path from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import {
  redact,
  GraphError,
  fail,
  exists,
  json,
  codes,
  atomic,
} from "./graphify-local/common.mjs";
import {
  active,
  environment,
  checked,
  git,
  offline,
} from "./graphify-local/process.mjs";
import { acquire, acquireGlobal } from "./graphify-local/locks.mjs";
import { validateConfig, parse, confined } from "./graphify-local/config.mjs";
import { fingerprint } from "./graphify-local/source.mjs";
import { runtime, status } from "./graphify-local/artifacts.mjs";
import { generate, adoptInitial } from "./graphify-local/build.mjs";

export async function main(args = process.argv.slice(2), options = {}) {
  let release, globalRelease, ctx;
  let interrupted = false;
  const stop = () => {
    interrupted = true;
    for (const cancel of active) cancel();
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
  const report = {
    version: 1,
    startedAt: new Date().toISOString(),
    status: "failed",
  };
  try {
    const parsed = parse(args),
      root = await realpath(path.resolve(parsed.root || process.cwd()));
    report.action = parsed.action;
    report.root = root;
    if (
      (await realpath(await git(root, ["rev-parse", "--show-toplevel"]))) !==
      root
    )
      fail("--root deve apontar para a raiz Git");
    const config = validateConfig(
      await json(path.resolve(root, parsed.config || "graphify.local.json")),
    );
    report.project = config.project;
    ctx = {
      root,
      config,
      envRoot: await confined(root, config.environment, { ignored: true }),
      state: await confined(root, config.state, { ignored: true }),
      outputRoot: await confined(root, config.output, { ignored: true }),
      interrupted: () => interrupted,
      fixtureOfflinePrefix: options.fixtureOfflinePrefix,
    };
    ctx.python = path.join(ctx.envRoot, "bin/python");
    ctx.binary = path.join(ctx.envRoot, "bin/graphify");
    ctx.env = environment({
      PATH: `${ctx.envRoot}/bin:${path.dirname(process.execPath)}:/usr/local/bin:/usr/bin:/bin`,
    });
    ctx.graph = path.join(ctx.outputRoot, "graph.json");
    ctx.provenance = path.join(
      ctx.outputRoot,
      "graphify-local-provenance.json",
    );
    await mkdir(ctx.state, { recursive: true, mode: 0o700 });
    if (parsed.action === "mark") {
      await atomic(path.join(ctx.state, "dirty.json"), {
        markedAt: new Date().toISOString(),
      });
      report.status = "marked";
    } else if (parsed.action === "install") {
      release = await acquire(path.join(ctx.state, "running.lock"));
      if (await exists(ctx.python)) {
        report.runtime = await runtime(ctx);
        report.status = "installed";
      } else {
        if (await exists(path.join(ctx.envRoot, "pyvenv.cfg")))
          fail(
            "Ambiente incompleto preservado; reparo precisa ser explícito",
            "missing_runtime",
          );
        await checked(
          [
            "uv",
            "venv",
            "--allow-existing",
            "--python",
            config.pythonVersion,
            ctx.envRoot,
          ],
          root,
          environment(),
          config.timeoutMs,
        );
        if (config.adapter === "champions") {
          if (config.environment !== "tools/graphify/.venv")
            fail("Ambiente Champions diverge do wrapper");
          await checked(
            [
              "uv",
              "sync",
              "--directory",
              path.join(root, "tools/graphify"),
              "--locked",
              "--python",
              config.pythonVersion,
              "--no-dev",
              "--link-mode",
              "copy",
            ],
            root,
            environment(),
            config.timeoutMs,
          );
          await checked(
            [
              "uv",
              "pip",
              "install",
              "--python",
              ctx.python,
              "--link-mode",
              "copy",
              `graphifyy[sql]==${config.pin}`,
            ],
            root,
            environment(),
            config.timeoutMs,
          );
        } else {
          const lock =
            config.adapter === "finance"
              ? path.join(
                  root,
                  "scripts/graphify/requirements-linux-py311.lock",
                )
              : path.join(root, "scripts/graphify/requirements.lock");
          if (await exists(lock))
            await checked(
              [
                "uv",
                "pip",
                "sync",
                "--python",
                ctx.python,
                "--require-hashes",
                "--link-mode",
                "copy",
                lock,
              ],
              root,
              environment(),
              config.timeoutMs,
            );
          else
            await checked(
              [
                "uv",
                "pip",
                "install",
                "--python",
                ctx.python,
                "--link-mode",
                "copy",
                `graphifyy[sql]==${config.pin}`,
              ],
              root,
              environment(),
              config.timeoutMs,
            );
        }
        report.runtime = await runtime(ctx);
        report.status = "installed";
      }
    } else {
      if (parsed.action === "status") Object.assign(report, await status(ctx));
      else {
        release = await acquire(path.join(ctx.state, "running.lock"));
        const fp = await fingerprint(root, config);
        const state = await status(ctx, fp);
        if (state.status === "current") {
          Object.assign(report, state);
          await rm(path.join(ctx.state, "dirty.json"), { force: true });
        } else if (
          state.status === "unverified" &&
          (await adoptInitial(ctx, fp))
        )
          Object.assign(report, await status(ctx, fp), {
            adoptedInitial: true,
          });
        else {
          globalRelease = await acquireGlobal(
            options.globalLock ||
              path.join(homedir(), ".cache/repo-maintenance/fleet.lock"),
          );
          ctx.lockAlive = globalRelease.alive;
          Object.assign(report, await generate(ctx, fp, state.graph));
        }
        if (["query", "path", "explain"].includes(parsed.action)) {
          const prefix = await offline(ctx);
          const command = [
            ctx.binary,
            parsed.action,
            ...parsed.terms,
            "--graph",
            ctx.graph,
            ...(parsed.action === "query" ? ["--budget", "1500"] : []),
          ];
          const output = await checked(
            [...prefix, ...command],
            root,
            ctx.env,
            config.timeoutMs,
          );
          report.output = redact(output);
          report.status = "queried";
        }
      }
    }
  } catch (e) {
    report.status = e instanceof GraphError ? e.status : "failed";
    report.message =
      e instanceof GraphError
        ? e.message
        : `Falha interna: ${e.code || e.name}`;
  } finally {
    try {
      if (globalRelease) await globalRelease();
      if (release) await release();
    } catch {
      report.status = "failed";
      report.message = "Falha ao liberar trava";
    }
    process.removeListener("SIGTERM", stop);
    process.removeListener("SIGINT", stop);
  }
  report.finishedAt = new Date().toISOString();
  if (ctx) {
    try {
      await atomic(path.join(ctx.state, "last-report.json"), report);
    } catch {
      report.status = "failed";
      report.message = "Falha ao gravar relatório privado";
    }
  }
  return { exitCode: codes[report.status] ?? 1, report };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const result = await main();
  process.stdout.write(JSON.stringify(result.report) + "\n");
  process.exitCode = result.exitCode;
}
export { GraphError } from "./graphify-local/common.mjs";
export { run } from "./graphify-local/process.mjs";
export { acquire, acquireGlobal } from "./graphify-local/locks.mjs";
export { validateConfig } from "./graphify-local/config.mjs";
export { fingerprint } from "./graphify-local/source.mjs";
export { validateGraph } from "./graphify-local/artifacts.mjs";
export { adoptInitial } from "./graphify-local/build.mjs";
