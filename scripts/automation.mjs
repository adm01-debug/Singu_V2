#!/usr/bin/env node
import { realpathSync } from "node:fs";
import { resolve } from "node:path";
import { fail, json, SELF } from "./automation/common.mjs";
import { parseArgs, validateConfig } from "./automation/config.mjs";
import { git } from "./automation/process.mjs";
import { doctor } from "./automation/inventory.mjs";
import { runTests, graph, motor } from "./automation/dispatch.mjs";
import { install, uninstall } from "./automation/install.mjs";
import { hook } from "./automation/hooks.mjs";

export async function main(argv) {
  const opts = parseArgs(argv);
  const c =
    opts.action === "uninstall-hooks"
      ? null
      : validateConfig(json(opts.config));
  const root = (
    await git(opts.root, ["rev-parse", "--show-toplevel"])
  ).stdout.trim();
  if (realpathSync(root) !== realpathSync(opts.root))
    throw fail("--root deve ser a raiz do repositório");
  const ctx = { root: opts.root, config: opts.config, c };
  if (opts.action === "doctor") {
    const r = await doctor(ctx, opts.staticOnly);
    process.stdout.write(JSON.stringify(r) + "\n");
    return r.ok ? 0 : 1;
  }
  if (opts.action === "test") return (await runTests(ctx)).code;
  if (opts.action === "graph") return (await graph(ctx, opts.positional)).code;
  if (["check", "heal"].includes(opts.action))
    return (await motor(ctx, opts.action, opts.ref)).code;
  if (opts.action === "hook") return (await hook(ctx, opts.positional)).code;
  if (opts.action === "nightly") {
    const results = {};
    for (const [name, action] of [
      ["graph", () => graph(ctx, ["ensure"])],
      ["heal", () => motor(ctx, "heal", opts.ref)],
    ]) {
      try {
        results[name] = await action();
      } catch (e) {
        results[name] = { code: 1, error: e.message };
      }
    }
    process.stdout.write(
      JSON.stringify({
        status: Object.values(results).every((r) => r.code === 0)
          ? "completed"
          : "failed",
        results,
      }) + "\n",
    );
    return Object.values(results).every((r) => r.code === 0) ? 0 : 1;
  }
  if (opts.action === "install-hooks") {
    const health = await doctor(ctx, true);
    if (!health.ok)
      throw fail("instalação bloqueada: " + health.issues.join("; "));
  }
  const r = await (opts.action === "install-hooks"
    ? install(ctx)
    : uninstall(ctx));
  process.stdout.write(JSON.stringify(r) + "\n");
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === SELF) {
  try {
    process.exitCode = await main(process.argv.slice(2));
  } catch (error) {
    console.error(JSON.stringify({ status: "failed", error: error.message }));
    process.exitCode = Number.isInteger(error.code) ? error.code : 1;
  }
}
export { parseArgs, validateConfig } from "./automation/config.mjs";
export { execute } from "./automation/process.mjs";
