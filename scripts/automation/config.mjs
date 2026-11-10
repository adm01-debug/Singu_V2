import {isAbsolute,resolve} from "node:path";
import {fail,TRIGGERS,relativePath,command,onlyKeys} from "./common.mjs";

export function parseArgs(argv) {
  let root = process.cwd(),
    config,
    staticOnly = false,
    ref,
    action,
    positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--") {
      positional.push(...argv.slice(i + 1));
      break;
    }
    if (["--root", "--config", "--ref"].includes(a)) {
      const v = argv[++i];
      if (!v || v.startsWith("--")) throw fail(`${a} exige valor`);
      if (a === "--root") root = resolve(v);
      else if (a === "--config") config = v;
      else ref = v;
    } else if (a === "--static") staticOnly = true;
    else if (a.startsWith("--") && action !== "graph")
      throw fail(`opção desconhecida ${a}`);
    else if (!action) action = a;
    else positional.push(a);
  }
  if (
    ![
      "doctor",
      "test",
      "check",
      "heal",
      "nightly",
      "graph",
      "hook",
      "install-hooks",
      "uninstall-hooks",
    ].includes(action)
  )
    throw fail("comando desconhecido");
  if (staticOnly && action !== "doctor")
    throw fail("--static só é aceito em doctor");
  if (ref && !["check", "heal", "nightly"].includes(action))
    throw fail("--ref só é aceito em check/heal/nightly");
  if (["check", "heal", "nightly"].includes(action) && !ref)
    throw fail("--ref explícita obrigatória");
  if (!["graph", "hook"].includes(action) && positional.length)
    throw fail("argumentos adicionais não aceitos");
  return {
    root: resolve(root),
    config: resolve(root, config || "scripts/automation.config.json"),
    staticOnly,
    ref,
    action,
    positional,
  };
}

export function validateConfig(c) {
  onlyKeys(
    c,
    [
      "version",
      "name",
      "entrypoint",
      "testSuites",
      "motor",
      "graph",
      "graphConfig",
      "aliases",
      "registrations",
      "ci",
      "nightly",
      "timeoutMs",
      "toolingPatterns",
      "sourcePatterns",
      "requirements",
      "snapshot",
      "motorConfig",
      "motorSource",
    ],
    "config",
  );
  if (c.version !== 1 || typeof c.name !== "string" || !c.name)
    throw fail("config: version 1 e name obrigatórios");
  if (typeof c.entrypoint !== "string" || !c.entrypoint)
    throw fail("entrypoint obrigatório");
  if (
    !Array.isArray(c.testSuites) ||
    !c.testSuites.length ||
    c.testSuites.some((p) => typeof p !== "string" || !p.endsWith(".mjs"))
  )
    throw fail("testSuites: liste suites node:test .mjs");
  for (const k of ["motor", "graph"])
    if (
      !command(c[k]) ||
      c[k].length < 2 ||
      !["node", "sh", process.execPath].includes(c[k][0]) ||
      c[k][1].startsWith("-")
    )
      throw fail(`${k}: comando node/sh e arquivo explícito obrigatórios`);
  for (const k of ["motorConfig", "motorSource"])
    if (c[k] !== undefined && !relativePath(c[k]) && !isAbsolute(c[k]))
      throw fail(`${k}: caminho inválido`);
  if (!relativePath(c.graphConfig) && !isAbsolute(c.graphConfig || ""))
    throw fail("graphConfig obrigatório");
  onlyKeys(c.aliases, Object.keys(c.aliases || {}), "aliases");
  if (
    !Object.keys(c.aliases).length ||
    Object.values(c.aliases).some((v) => typeof v !== "string" || !v)
  )
    throw fail("aliases obrigatórios");
  if (!Array.isArray(c.registrations) || !c.registrations.length)
    throw fail("registrations obrigatório");
  const ids = new Set();
  for (const r of c.registrations) {
    onlyKeys(
      r,
      ["id", "kind", "files", "manual", "triggers", "reason", "callers"],
      "registro",
    );
    if (!r.id || ids.has(r.id)) throw fail("id de registro vazio/duplicado");
    ids.add(r.id);
    if (
      !["test", "motor", "graph", "tool", "helper", "legacy"].includes(
        r.kind,
      ) ||
      !Array.isArray(r.files) ||
      !r.files.length ||
      r.files.some((p) => !relativePath(p))
    )
      throw fail(`registro ${r.id}: files/kind inválidos`);
    if (
      !Array.isArray(r.triggers) ||
      r.triggers.some((t) => !TRIGGERS.includes(t))
    )
      throw fail(`registro ${r.id}: gatilhos inválidos`);
    if (r.kind === "helper") {
      if (
        !Array.isArray(r.callers) ||
        !r.callers.length ||
        r.callers.some((p) => !relativePath(p))
      )
        throw fail(`helper ${r.id}: callers explícitos obrigatórios`);
    } else if (!command(r.manual) || !r.triggers.includes("manual"))
      throw fail(`registro ${r.id}: comando/gatilho manual obrigatório`);
    if (r.kind === "legacy") {
      if (
        r.files.some((p) => /[*?]/.test(p)) ||
        typeof r.reason !== "string" ||
        r.reason.length < 12
      )
        throw fail(
          `legado ${r.id}: arquivos exatos e justificativa obrigatórios`,
        );
      if (r.triggers.some((t) => t !== "manual"))
        throw fail(`legado ${r.id}: execução automática proibida`);
    } else if (r.kind !== "helper" && !r.triggers.some((t) => t !== "manual"))
      throw fail(`registro ${r.id}: gatilho automático obrigatório`);
  }
  if (!Array.isArray(c.ci) || !c.ci.length)
    throw fail("ci: vínculo de workflow obrigatório");
  for (const x of c.ci) {
    onlyKeys(x, ["file", "events", "command"], "ci");
    if (
      !relativePath(x.file) ||
      !Array.isArray(x.events) ||
      !x.events.length ||
      x.events.some((e) => !["PR", "pushmain"].includes(e)) ||
      typeof x.command !== "string" ||
      !x.command
    )
      throw fail("ci: contrato inválido");
  }
  onlyKeys(c.nightly, ["command", "file"], "nightly");
  if (
    !command(c.nightly.command) ||
    (c.nightly.file &&
      !relativePath(c.nightly.file) &&
      !isAbsolute(c.nightly.file))
  )
    throw fail("nightly: comando obrigatório");
  for (const k of ["toolingPatterns", "sourcePatterns", "requirements"])
    if (c[k] && (!Array.isArray(c[k]) || c[k].some((p) => !relativePath(p))))
      throw fail(`${k}: caminhos/globs relativos obrigatórios`);
  if (
    c.timeoutMs !== undefined &&
    (!Number.isInteger(c.timeoutMs) ||
      c.timeoutMs < 100 ||
      c.timeoutMs > 900000)
  )
    throw fail("timeoutMs inválido");
  if (c.snapshot) {
    onlyKeys(c.snapshot, ["root", "ref"], "snapshot");
    if (
      !isAbsolute(c.snapshot.root || "") ||
      !/^[a-f0-9]{40}$/i.test(c.snapshot.ref || "")
    )
      throw fail("snapshot: root absoluto/ref SHA obrigatórios");
  }
  return c;
}
