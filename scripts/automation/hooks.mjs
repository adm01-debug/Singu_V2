import {existsSync,realpathSync,statSync} from "node:fs";
import {dirname,isAbsolute,join,resolve} from "node:path";
import {EVENTS,fail,within,json,pattern} from "./common.mjs";
import {execute,git} from "./process.mjs";
import {statePath,doctor} from "./inventory.mjs";
import {runTests,graph} from "./dispatch.mjs";

export async function hook(ctx, args) {
  const event = args[0];
  if (!EVENTS.includes(event)) throw fail("evento Git desconhecido");
  const savedPath = await statePath(ctx.root);
  if (!existsSync(savedPath)) throw fail("ponte sem estado instalado");
  const state = json(savedPath);
  const common = realpathSync(
    resolve(
      ctx.root,
      (await git(ctx.root, ["rev-parse", "--git-common-dir"])).stdout.trim(),
    ),
  );
  if (state.common !== common)
    throw fail("estado pertence a outro repositório");
  if (process.env.REPO_AUTOMATION_CHAINING)
    throw fail("recursão de hook recusada");
  let original = isAbsolute(state.previousPath)
      ? join(state.previousPath, event)
      : resolve(ctx.root, state.previousPath, event),
    viaSh = false;
  if (
    /(?:^|[\\/])\.husky[\\/]_$/.test(state.previousPath) &&
    (!existsSync(original) || !existsSync(join(dirname(original), "h")))
  ) {
    original = join(ctx.root, ".husky", event);
    viaSh = true;
  }
  if (existsSync(original) && (viaSh || statSync(original).mode & 0o111)) {
    if (within(realpathSync(state.hooks), realpathSync(original)))
      throw fail("hook original recursivo");
    const r = await execute(
      [...(viaSh ? ["sh"] : []), original, ...args.slice(1)],
      {
        cwd: ctx.root,
        timeout: ctx.c.timeoutMs || 300000,
        env: {
          ...process.env,
          REPO_AUTOMATION_CHAINING: state.id + ":" + event,
        },
      },
    );
    if (r.code !== 0) return { ...r, status: "original_hook_failed" };
  }
  if (event === "pre-push") {
    const health = await doctor(ctx, false);
    if (!health.ok) {
      console.error(JSON.stringify(health));
      return { code: 1, status: "doctor_failed" };
    }
    return runTests(ctx);
  }
  if (event === "pre-commit") {
    const files = (
      await git(ctx.root, [
        "diff",
        "--cached",
        "--name-only",
        "-z",
        "--diff-filter=ACMRD",
      ])
    ).stdout
      .split("\0")
      .filter(Boolean);
    const tooling = ctx.c.toolingPatterns || [
      "scripts/**",
      ".github/**",
      ".husky/**",
      "package.json",
      "*lock*",
      "graphify.local.json",
    ];
    if (files.some((f) => tooling.some((g) => pattern(g).test(f)))) {
      const r = await runTests(ctx);
      if (r.code !== 0) return r;
    }
    const sources = ctx.c.sourcePatterns || ["src/**"];
    if (files.some((f) => sources.some((g) => pattern(g).test(f))))
      return graph(ctx, ["mark"]);
  }
  if (["post-commit", "post-merge", "post-checkout"].includes(event))
    return graph(ctx, ["mark"]);
  return { code: 0, status: "hook_chained" };
}
