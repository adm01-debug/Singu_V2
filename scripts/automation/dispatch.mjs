import { execute, locate, git } from "./process.mjs";
import { fail } from "./common.mjs";

export async function runTests(ctx) {
  const files = ctx.c.testSuites.map((p) =>
    locate(ctx.root, ctx.c, ctx.config, p),
  );
  const env = { ...process.env };
  const localNames = (
    await git(ctx.root, ["rev-parse", "--local-env-vars"])
  ).stdout
    .trim()
    .split(/\s+/);
  for (const name of localNames) if (name) delete env[name];
  delete env.NODE_TEST_CONTEXT;
  delete env.NODE_TEST_REPORTER;
  return execute(
    [process.execPath, "--test", "--test-concurrency=1", ...files],
    { cwd: ctx.root, timeout: ctx.c.timeoutMs || 300000, env },
  );
}

export function adapter(ctx, key) {
  const result = [...ctx.c[key]];
  result[1] = locate(ctx.root, ctx.c, ctx.config, result[1]);
  return result;
}

export async function graph(ctx, args) {
  const action = args[0] || "status";
  const mapped =
    { doctor: "status", build: "ensure", update: "ensure" }[action] || action;
  if (
    ![
      "install",
      "status",
      "mark",
      "ensure",
      "query",
      "path",
      "explain",
    ].includes(mapped)
  )
    throw fail("subcomando graph desconhecido");
  return execute(
    [
      ...adapter(ctx, "graph"),
      mapped,
      ...args.slice(1),
      "--root",
      ctx.root,
      "--config",
      locate(ctx.root, ctx.c, ctx.config, ctx.c.graphConfig),
    ],
    { cwd: ctx.root, timeout: ctx.c.timeoutMs || 300000 },
  );
}

export async function motor(ctx, mode, ref) {
  return execute(
    [
      ...adapter(ctx, "motor"),
      mode,
      "--root",
      ctx.root,
      "--ref",
      ref,
      ...(ctx.c.motorConfig
        ? ["--config", locate(ctx.root, ctx.c, ctx.config, ctx.c.motorConfig)]
        : []),
    ],
    { cwd: ctx.root, timeout: ctx.c.timeoutMs || 300000 },
  );
}
