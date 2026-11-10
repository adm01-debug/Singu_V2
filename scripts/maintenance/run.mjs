#!/usr/bin/env node
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {homedir} from "node:os";
import path from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
import {randomUUID} from "node:crypto";
import {MaintenanceError,fail,digest,run,git,validateConfig,inspect,acquire,reuseDependencies,dependencyFingerprint,writeJson,stopChildren,commitWithHooks} from "./lib.mjs";
import {parseArgs,redact} from "./options.mjs";
import {networkPrefix,quarantine,allowedSourceFiles} from "./sandbox.mjs";
import {changed} from "./changes.mjs";
import {fixes} from "./fixes.mjs";
import {checkPending,createExecutor,finishRun} from "./session.mjs";

export const originalGit = git;

export async function main(args = process.argv.slice(2)) {
  let prefix = [];
  const git = (cwd, argv, timeout) => originalGit(cwd, argv, timeout, prefix);
  const report = {
    version: 1,
    startedAt: new Date().toISOString(),
    status: "failed",
    steps: [],
  };
  let interrupted = false;
  const onSignal = () => {
    interrupted = true;
    stopChildren();
  };
  process.on("SIGTERM", onSignal);
  process.on("SIGINT", onSignal);
  const lifecycle = { keepBranch: false };
  let jobDir, source, stateDir, pendingFile, config;
  const finish = () => finishRun({ lifecycle, source, jobDir, report, git, onSignal });
  try {
    const options = parseArgs(args);
    report.action = options.action;
    source = path.resolve(options.root);
    report.root = source;
    const top = await git(source, ["rev-parse", "--show-toplevel"]);
    if (path.resolve(top) !== source)
      fail("--root deve ser a raiz Git do projeto");
    const common = await git(source, [
      "rev-parse",
      "--path-format=absolute",
      "--git-common-dir",
    ]);
    stateDir = path.join(
      path.resolve(
        options.state ||
          path.join(
            process.env.XDG_STATE_HOME || path.join(homedir(), ".local/state"),
            "repo-maintenance",
          ),
      ),
      digest(common).slice(0, 24),
    );
    await mkdir(stateDir, { recursive: true, mode: 0o700 });
    jobDir = path.join(stateDir, "runs", `${Date.now()}-${randomUUID()}`);
    await mkdir(jobDir, { recursive: true, mode: 0o700 });
    report.id = path.basename(jobDir);
    lifecycle.release = await acquire(path.join(stateDir, "running.lock"));
    config = validateConfig(
      JSON.parse(
        await readFile(
          path.resolve(
            options.config ||
              path.join(
                path.dirname(fileURLToPath(import.meta.url)),
                "config.json",
              ),
          ),
          "utf8",
        ),
      ),
    );
    report.configHash = digest(JSON.stringify(config));
    if (options.action === "doctor") {
      report.doctor = await inspect(source, config);
      report.status = "healthy";
      return await finish();
    }
    report.sourceDependencies = await dependencyFingerprint(source);
    report.base = await git(source, [
      "rev-parse",
      "--verify",
      "--end-of-options",
      `${options.ref}^{commit}`,
    ]);
    prefix = await networkPrefix(source);
    pendingFile = path.join(stateDir, "pending.json");
    await checkPending({ pendingFile, report, options, source, config, git, prefix, stateDir });
    lifecycle.workspace = path.join(jobDir, "worktree");
    await git(source, ["worktree", "add", "--detach", lifecycle.workspace, report.base]);
    report.dependencies = await reuseDependencies(source, lifecycle.workspace);
    const allowed = await allowedSourceFiles(lifecycle.workspace, config, prefix);
    const restore = await quarantine(lifecycle.workspace, jobDir, prefix);
    const execute = createExecutor({ lifecycle, isInterrupted: () => interrupted, prefix, config, report, jobDir });
    try {
      report.isolatedDoctor = await inspect(lifecycle.workspace, config);
      report.doctor = { ...report.isolatedDoctor, scope: "reference" };
      for (const g of config.gates)
        await execute("baseline", g.name, g.command, false, {
          nodeEnv:
            g.name === "test"
              ? "test"
              : g.name === "build"
                ? "production"
                : undefined,
          publicEnv: g.env,
        });
    } finally {
      await restore();
    }
    if ((await changed(lifecycle.workspace, config, prefix, allowed)).files.length)
      fail("Gate baseline alterou arquivos rastreados");
    if ((await dependencyFingerprint(source)).hash !== report.dependencies.hash)
      fail("Dependências do clone mudaram durante os gates baseline");
    if (options.action === "check") {
      report.status = "checked";
      return await finish();
    }
    const restoreFix = await quarantine(
      lifecycle.workspace,
      path.join(jobDir, "fix"),
      prefix,
    );
    try {
      report.scope = await fixes(
        lifecycle.workspace,
        config,
        jobDir,
        execute,
        prefix,
        allowed,
      );
    } finally {
      await restoreFix();
    }
    report.change = await changed(lifecycle.workspace, config, prefix, allowed);
    if ((await dependencyFingerprint(source)).hash !== report.dependencies.hash)
      fail("Dependências do clone mudaram durante a correção");
    if (!report.change.files.length) {
      report.status = "no_changes";
      return await finish();
    }
    const snapshotDiff = async (staged = false) => {
      const result = await run(
        [
          ...prefix,
          "git",
          "-c",
          "core.hooksPath=/dev/null",
          "diff",
          ...(staged ? ["--cached"] : []),
          "--binary",
          "--no-ext-diff",
          "--no-textconv",
        ],
        lifecycle.workspace,
        config.timeoutMs,
      );
      if (result.code !== 0 || result.timedOut || result.overflow)
        fail("Não foi possível congelar o patch");
      return result.output;
    };
    const fixedDiff = await snapshotDiff();
    const restoreAgain = await quarantine(
      lifecycle.workspace,
      path.join(jobDir, "after"),
      prefix,
    );
    try {
      for (const g of config.gates)
        await execute("patched", g.name, g.command, false, {
          nodeEnv:
            g.name === "test"
              ? "test"
              : g.name === "build"
                ? "production"
                : undefined,
          publicEnv: g.env,
        });
    } finally {
      await restoreAgain();
    }
    if ((await snapshotDiff()) !== fixedDiff)
      fail("Gate alterou o patch; resultado descartado");
    report.change = await changed(lifecycle.workspace, config, prefix, allowed);
    if (!report.change.files.length)
      fail("Gate removeu o patch depois da correção");
    if ((await dependencyFingerprint(source)).hash !== report.dependencies.hash)
      fail("Dependências do clone mudaram durante a execução");
    if (interrupted) fail("Execução interrompida por sinal");
    await git(lifecycle.workspace, ["diff", "--check"]);
    const patchResult = await run(
      [
        ...prefix,
        "git",
        "-c",
        "core.hooksPath=/dev/null",
        "diff",
        "--binary",
        "--no-ext-diff",
      ],
      lifecycle.workspace,
      config.timeoutMs,
    );
    if (patchResult.code !== 0 || patchResult.timedOut || patchResult.overflow)
      fail("Não foi possível exportar patch completo");
    const patchFile = path.join(jobDir, "validated.patch");
    await writeFile(patchFile, patchResult.output, { mode: 0o600 });
    const now = new Date().toISOString().replace(/[-:TZ.]/g, "");
    lifecycle.branch = `claude/chore-manutencao-${now.slice(2, 8)}-${now.slice(8, 12)}-${randomUUID().slice(0, 8)}`;
    await git(lifecycle.workspace, ["switch", "-c", lifecycle.branch]);
    await git(lifecycle.workspace, ["add", "--", ...report.change.files]);
    if ((await snapshotDiff(true)) !== fixedDiff)
      fail("Filtro Git alterou o patch ao preparar o commit");
    const restoreHooks = await quarantine(
      lifecycle.workspace,
      path.join(jobDir, "hooks"),
      prefix,
    );
    try {
      const hookResult = await commitWithHooks(
        source,
        lifecycle.workspace,
        jobDir,
        [
          "-c",
          "user.name=Manutencao local",
          "-c",
          "user.email=maintenance@localhost",
          "-c",
          "commit.gpgsign=false",
          "commit",
          "-m",
          "style(manutencao): aplica correcoes locais verificadas",
        ],
        config.timeoutMs,
        prefix,
      );
      const output = redact(hookResult.output);
      await writeFile(path.join(jobDir, "commit-hooks.log"), output, {
        mode: 0o600,
      });
      report.hooks = {
        names: hookResult.names,
        exit: hookResult.code,
        timeout: hookResult.timedOut,
        log: "commit-hooks.log",
      };
      report.steps.push({
        phase: "commit",
        name: "hooks",
        exit: hookResult.code,
        timeout: hookResult.timedOut,
        log: "commit-hooks.log",
        diagnostics: output
          .split("\n")
          .filter((line) => /error|failed|falhou/i.test(line))
          .slice(0, 5),
      });
      if (hookResult.code !== 0 || hookResult.timedOut || hookResult.overflow)
        fail(
          `Hook/commit obrigatório falhou (exit=${hookResult.code}, timeout=${hookResult.timedOut})`,
        );
    } finally {
      await restoreHooks();
    }
    const committed = await run(
      [
        ...prefix,
        "git",
        "-c",
        "core.hooksPath=/dev/null",
        "diff",
        report.base,
        "HEAD",
        "--binary",
        "--no-ext-diff",
        "--no-textconv",
      ],
      lifecycle.workspace,
      config.timeoutMs,
    );
    if (
      committed.code !== 0 ||
      committed.timedOut ||
      committed.overflow ||
      committed.stdout !== fixedDiff
    )
      fail("Hook alterou o patch commitado; resultado descartado");
    if (
      (await git(lifecycle.workspace, ["log", "-1", "--format=%s"])) !==
      "style(manutencao): aplica correcoes locais verificadas"
    )
      fail(
        "Hook alterou a mensagem obrigatória do commit; resultado descartado",
      );
    if ((await changed(lifecycle.workspace, config, prefix, allowed)).files.length)
      fail("Hook alterou a worktree depois da validação");
    if ((await dependencyFingerprint(source)).hash !== report.dependencies.hash)
      fail("Dependências do clone mudaram durante os hooks");
    report.commit = await git(lifecycle.workspace, ["rev-parse", "HEAD"]);
    report.branch = lifecycle.branch;
    report.patch = patchFile;
    await writeJson(pendingFile, {
      base: report.base,
      commit: report.commit,
      branch: lifecycle.branch,
      patch: patchFile,
      configHash: report.configHash,
    });
    lifecycle.keepBranch = true;
    report.status = "validated_patch";
  } catch (e) {
    report.status = e instanceof MaintenanceError ? e.code : "failed";
    report.message = redact(
      e instanceof MaintenanceError
        ? e.message
        : `Falha interna: ${e.code || e.name}`,
    );
  }
  return await finish();
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  const result = await main();
  console.log(JSON.stringify(result.report));
  process.exitCode = result.exitCode;
}
export {parseArgs} from "./options.mjs";
export {networkPrefix,allowedSourceFiles} from "./sandbox.mjs";
export {prettierCandidates} from "./fixes.mjs";
export {checkPending,createExecutor,finishRun} from "./session.mjs";
