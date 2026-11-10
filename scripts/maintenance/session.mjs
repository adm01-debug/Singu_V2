import { readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { MaintenanceError, fail, exists, run, writeJson } from "./lib.mjs";
import { redact, exits } from "./options.mjs";

export async function checkPending({
  pendingFile,
  report,
  options,
  source,
  config,
  git,
  prefix,
  stateDir,
}) {
  let pending;
  if (await exists(pendingFile)) {
    pending = JSON.parse(await readFile(pendingFile, "utf8"));
    const integrated = await run(
      [
        ...prefix,
        "git",
        "merge-base",
        "--is-ancestor",
        pending.commit,
        report.base,
      ],
      source,
      config.timeoutMs,
    );
    if (integrated.code === 0) {
      await writeJson(
        path.join(stateDir, "integrated", `${pending.commit}.json`),
        pending,
      );
      await rm(pendingFile);
      pending = null;
    } else {
      const merge = await run(
        [
          ...prefix,
          "git",
          "merge-tree",
          "--write-tree",
          "--merge-base",
          pending.base,
          report.base,
          pending.commit,
        ],
        source,
        config.timeoutMs,
      );
      const tree = await git(source, ["rev-parse", `${report.base}^{tree}`]);
      if (merge.code === 0 && merge.output.split("\n")[0] === tree) {
        await writeJson(
          path.join(stateDir, "integrated", `${pending.commit}.json`),
          pending,
        );
        await rm(pendingFile);
        pending = null;
      }
    }
    if (pending && options.action === "heal")
      throw new MaintenanceError(
        "pending_patch",
        `Patch local pendente para base ${pending.base.slice(0, 12)}; branch ${pending.branch}`,
      );
  }
}

export function createExecutor({
  lifecycle,
  isInterrupted,
  prefix,
  config,
  report,
  jobDir,
}) {
  const execute = async (
    phase,
    name,
    command,
    allowOne = false,
    environment = {},
  ) => {
    if (isInterrupted()) fail("Execução interrompida por sinal");
    const result = await run(
      [...prefix, ...command],
      lifecycle.workspace,
      config.timeoutMs,
      environment,
    );
    const output = redact(result.output);
    const logFile = `${report.steps.length}-${phase}-${name}.log`;
    await writeFile(path.join(jobDir, logFile), output, { mode: 0o600 });
    report.steps.push({
      phase,
      name,
      exit: result.code,
      timeout: result.timedOut,
      log: logFile,
      diagnostics: output
        .split("\n")
        .filter((s) =>
          /error TS\d+:|^Error:|^error:|FAIL|failed|Error \[/.test(s),
        )
        .slice(0, 5),
    });
    if (
      (result.code !== 0 && !(allowOne && result.code === 1)) ||
      result.timedOut ||
      result.overflow
    )
      throw new MaintenanceError(
        phase === "baseline" ? "blocked_baseline" : "failed",
        `Gate ${name} (${phase}) falhou: exit=${result.code}, timeout=${result.timedOut}`,
      );
    return result;
  };

  return execute;
}

export async function finishRun({
  lifecycle,
  source,
  jobDir,
  report,
  git,
  onSignal,
}) {
  if (lifecycle.workspace && (await exists(lifecycle.workspace))) {
    try {
      await git(source, ["worktree", "remove", "--force", lifecycle.workspace]);
    } catch {
      report.cleanupFailed = true;
      report.status = "failed";
    }
    lifecycle.workspace = null;
  }
  if (lifecycle.branch && !lifecycle.keepBranch)
    await git(source, ["branch", "-D", lifecycle.branch]).catch(() => {});
  if (lifecycle.release) {
    try {
      await lifecycle.release();
    } catch {
      report.cleanupFailed = true;
      report.status = "failed";
      report.message = "Dono da trava mudou; limpeza interrompida";
    }
    lifecycle.release = null;
  }
  process.removeListener("SIGTERM", onSignal);
  process.removeListener("SIGINT", onSignal);
  report.finishedAt = new Date().toISOString();
  if (jobDir) {
    report.reportFile = path.join(jobDir, "report.json");
    await writeJson(report.reportFile, report);
  }
  return { exitCode: exits[report.status] ?? 1, report };
}
