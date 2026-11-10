import { mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { fail, exists, inside } from "./common.mjs";
import { run, git } from "./process.mjs";

export async function commitWithHooks(
  source,
  workspace,
  jobDir,
  args,
  timeout,
  prefix = [],
) {
  const configured = await run(
    [...prefix, "git", "config", "--get", "core.hooksPath"],
    source,
    timeout,
  );
  if (
    ![0, 1].includes(configured.code) ||
    configured.timedOut ||
    configured.overflow
  )
    fail("Não foi possível resolver os hooks obrigatórios");
  const value = configured.stdout.trim();
  const relative = value
    ? path.relative(source, path.resolve(source, value))
    : "";
  const husky =
    relative.replaceAll("\\", "/").match(/^(.*\.husky)(?:\/_)?$/)?.[1] ||
    (!value && (await exists(path.join(workspace, ".husky")))
      ? ".husky"
      : null);
  const directory = path.join(jobDir, "commit-hooks");
  await mkdir(directory, { mode: 0o700 });
  let bootstrap;
  if (husky) {
    const helper = path.join(workspace, husky, "_", "husky.sh");
    if (!(await exists(helper))) {
      const parent = path.dirname(helper),
        createdParent = !(await exists(parent));
      await mkdir(parent, { recursive: true });
      await writeFile(
        helper,
        "# Bootstrap isolado: o dispatcher executa os hooks com sh -e.\n",
        { mode: 0o600 },
      );
      bootstrap = async () => {
        await rm(helper, { force: true });
        if (createdParent) await rm(parent, { recursive: true, force: true });
      };
    }
  }
  const names = [];
  const quote = (text) => `'${text.replaceAll("'", "'\\''")}'`;
  try {
    for (const name of [
      "pre-commit",
      "prepare-commit-msg",
      "commit-msg",
      "post-commit",
    ]) {
      let script;
      if (husky) script = path.join(workspace, husky, name);
      else if (value && inside(source, path.resolve(source, value))) {
        script = path.join(workspace, relative, name);
        if (!(await exists(script))) {
          const installed = path.resolve(source, value, name);
          if (await exists(installed)) {
            const tracked = await run(
              [
                ...prefix,
                "git",
                "ls-files",
                "-z",
                "--",
                path.relative(source, installed),
              ],
              source,
              timeout,
            );
            if (tracked.code !== 0 || tracked.timedOut || tracked.overflow)
              fail("Não foi possível resolver o hook instalado");
            if (!tracked.stdout) script = installed;
          }
        }
      } else if (value) script = path.resolve(source, value, name);
      else
        script = path.join(
          await git(
            source,
            ["rev-parse", "--path-format=absolute", "--git-common-dir"],
            timeout,
            prefix,
          ),
          "hooks",
          name,
        );
      if (!(await exists(script))) continue;
      const invocation = husky ? `sh -e ${quote(script)}` : quote(script);
      await writeFile(
        path.join(directory, name),
        `#!/bin/sh\nset -eu\nPATH=${quote(path.join(workspace, "node_modules/.bin"))}:"$PATH"\nexport PATH\nexec ${invocation} "$@"\n`,
        { mode: 0o700 },
      );
      names.push(name);
    }
    const result = await run(
      [...prefix, "git", "-c", `core.hooksPath=${directory}`, ...args],
      workspace,
      timeout,
      { hooks: true },
    );
    return { names, ...result };
  } finally {
    if (bootstrap) await bootstrap();
  }
}
