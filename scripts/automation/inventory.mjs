import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { git, approved, locate } from "./process.mjs";
import { EVENTS, digest, fail, within, json, pattern } from "./common.mjs";

export function scan(dir, prefix = "") {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (
      ["node_modules", "__pycache__", ".venv", ".venv-graphify"].includes(
        e.name,
      ) ||
      e.isSymbolicLink()
    )
      continue;
    const p = prefix ? prefix + "/" + e.name : e.name;
    if (e.isDirectory()) out.push(...scan(join(dir, e.name), p));
    else if (/\.(mjs|cjs|js|ts|tsx|sh|py)$/.test(e.name)) out.push(p);
  }
  return out;
}

export function workflowEvent(text, event) {
  const plain = text
    .split("\n")
    .filter((l) => !/^\s*#/.test(l))
    .join("\n");
  const on =
    /^(?:on|'on'|"on"):\s*([^\n]*)(?:\n([\s\S]*?))?(?=^\S|(?![\s\S]))/m.exec(
      plain,
    );
  const block = on ? on[0] : "";
  return event === "PR"
    ? /\bpull_request\b/.test(block)
    : /\bpush\b/.test(block) && /\bmain\b/.test(block);
}

export function workflowRuns(text, commandText) {
  const lines = text.split("\n");
  let indent = -1;
  for (const line of lines) {
    if (/^\s*#/.test(line)) continue;
    const run = /^(\s*)(?:-\s*)?run:\s*(.*)$/.exec(line);
    if (run) {
      indent = run[1].length;
      const value = run[2].trim().replace(/^(['"])(.*)\1$/, "$2");
      if (
        (value === commandText || value.startsWith(commandText + " ")) &&
        !value.includes("|| true")
      )
        return true;
      continue;
    }
    if (indent >= 0 && line.trim()) {
      if (line.search(/\S/) <= indent) indent = -1;
      else if (
        line.trim() === commandText ||
        line.trim().startsWith(commandText + " ")
      )
        return true;
    }
  }
  return false;
}

export async function statePath(root) {
  const value = (
    await git(root, ["config", "--get", "core.hooksPath"], [0, 1])
  ).stdout.trim();
  const hooks = value ? resolve(root, value) : "";
  return hooks.endsWith("/.tools/repo-automation/hooks")
    ? join(dirname(hooks), "state.json")
    : join(root, ".tools/repo-automation/state.json");
}

export async function doctor(ctx, staticOnly) {
  const { root, c, config } = ctx;
  const issues = [],
    check = (fn) => {
      try {
        return fn();
      } catch (e) {
        issues.push(e.message);
      }
    };
  const paths = [
    c.entrypoint,
    ...c.testSuites,
    c.motor[1],
    c.graph[1],
    c.graphConfig,
    ...(c.motorConfig ? [c.motorConfig] : []),
  ];
  for (const path of paths) check(() => locate(root, c, config, path));
  const packageFile = check(() => locate(root, c, config, "package.json"));
  const pkg = packageFile ? check(() => json(packageFile)) : null;
  for (const [name, value] of Object.entries(c.aliases))
    if (pkg?.scripts?.[name] !== value)
      issues.push(`alias não encadeado: ${name}`);
  const roots = [
    root,
    ...(c.snapshot
      ? [check(() => approved(c.snapshot.root, config))].filter(Boolean)
      : []),
  ];
  const scripts = [
    ...new Set(roots.flatMap((r) => scan(join(r, "scripts"), "scripts"))),
  ];
  const matches = (p, glob) => pattern(glob).test(p);
  for (const path of scripts)
    if (!c.registrations.some((r) => r.files.some((g) => matches(path, g))))
      issues.push(`script sem registro/gatilho: ${path}`);
  for (const r of c.registrations) {
    for (const file of r.files)
      if (
        /[*?]/.test(file)
          ? !scripts.some((p) => matches(p, file))
          : !check(() => locate(root, c, config, file))
      )
        issues.push(`registro sem arquivo: ${r.id}/${file}`);
    if (r.manual)
      for (const arg of r.manual)
        if (/^scripts\/.+\.(?:mjs|cjs|js|ts|tsx|sh|py)$/.test(arg))
          check(() => locate(root, c, config, arg));
    if (
      r.kind === "test" &&
      !c.testSuites.some((p) => r.files.some((g) => matches(p, g)))
    )
      issues.push(`suite sem ligação ao runner: ${r.id}`);
    if (
      r.kind === "motor" &&
      !r.files.some((g) => matches(c.motorSource || c.motor[1], g))
    )
      issues.push(`motor não encadeado: ${r.id}`);
    if (r.kind === "graph" && !r.files.some((g) => matches(c.graph[1], g)))
      issues.push(`grafo não encadeado: ${r.id}`);
    if (r.kind === "helper")
      for (const caller of r.callers) {
        const path = check(() => locate(root, c, config, caller));
        if (
          !c.registrations.some(
            (x) => x.id !== r.id && x.files.some((g) => matches(caller, g)),
          ) ||
          !path ||
          !r.files.some((g) =>
            readFileSync(path, "utf8").includes(g.split("/").at(-1)),
          )
        )
          issues.push(`helper sem caller encadeado: ${r.id}/${caller}`);
      }
    if (r.kind === "tool" && !r.files.some((g) => matches(c.entrypoint, g)))
      issues.push(
        `tool sem dispatcher implementado: ${r.id}; use helper com callers ou legacy manual`,
      );
  }
  const ci = [];
  const testCommand = (value) =>
    value.includes(basename(c.entrypoint) + " test") ||
    Object.entries(c.aliases).some(
      ([name, cmd]) =>
        cmd.includes(basename(c.entrypoint) + " test") &&
        new RegExp(
          "(?:npm|bun) run " +
            name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
            "(?:\\s|$)",
        ).test(value),
    );
  for (const event of ["PR", "pushmain"])
    if (!c.ci.some((x) => x.events.includes(event)))
      issues.push(`testes sem gatilho CI ${event}`);
  for (const item of c.ci) {
    const path = check(() => locate(root, c, config, item.file));
    const text = path ? readFileSync(path, "utf8") : "";
    for (const event of item.events)
      if (!workflowEvent(text, event))
        issues.push(`workflow sem evento ${event}: ${item.file}`);
    if (!testCommand(item.command))
      issues.push(`CI não chama runner de testes: ${item.file}`);
    if (!workflowRuns(text, item.command))
      issues.push(`workflow sem run encadeado: ${item.file}`);
    ci.push({
      file: item.file,
      declaredEvents: item.events,
      sourceIntegrated: existsSync(join(root, item.file)),
    });
  }
  if (c.nightly.file) {
    const path = check(() => locate(root, c, config, c.nightly.file));
    if (
      path &&
      !readFileSync(path, "utf8").includes(c.nightly.command.join(" "))
    )
      issues.push("nightly não encadeado");
  }
  const stateFile = await statePath(root);
  let hooks = "not_installed";
  if (existsSync(stateFile)) {
    const state = check(() => json(stateFile));
    const effective = (
      await git(root, ["config", "--get", "core.hooksPath"], [0, 1])
    ).stdout.trim();
    if (state && effective === state.hooks) hooks = "installed";
    else issues.push("ponte instalada não é o hooksPath efetivo");
    if (state)
      for (const event of EVENTS)
        if (!existsSync(join(state.hooks, event)))
          issues.push(`ponte ausente: ${event}`);
    if (state)
      for (const [path, hash] of Object.entries(state.files || {}))
        check(() => {
          const target = resolve(dirname(state.hooks), path);
          if (
            !within(dirname(state.hooks), target) ||
            !existsSync(target) ||
            lstatSync(target).isSymbolicLink() ||
            digest(target) !== hash
          )
            throw fail(`ponte divergente: ${path}`);
        });
  } else if (!staticOnly)
    issues.push(
      "hooks não instalados; use install-hooks após validar o snapshot",
    );
  if (!staticOnly)
    for (const path of c.requirements || [])
      check(() => locate(root, { ...c, snapshot: undefined }, config, path));
  const sourcePackage = existsSync(join(root, "package.json"))
    ? check(() => json(join(root, "package.json")))
    : null;
  const sourceIntegrated =
    Object.entries(c.aliases).every(
      ([k, v]) => sourcePackage?.scripts?.[k] === v,
    ) &&
    paths.every(
      (p) =>
        !isAbsolute(p) &&
        existsSync(join(root, p)) &&
        (!c.snapshot ||
          readFileSync(join(root, p)).equals(
            readFileSync(locate(root, c, config, p)),
          )),
    );
  return {
    ok: issues.length === 0,
    status: issues.length ? "failed" : "healthy",
    mode: staticOnly ? "static" : "local",
    source: sourceIntegrated ? "source_integrated" : "installed_snapshot",
    ciActive: false,
    ciVerification: "remote_merge_and_run_not_verified",
    hooks,
    ci,
    issues,
  };
}
