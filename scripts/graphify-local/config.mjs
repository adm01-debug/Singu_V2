import {lstat} from "node:fs/promises";
import path from "node:path";
import {safeRelative,secretPath,fail,inside,exists} from "./common.mjs";
import {run,environment} from "./process.mjs";

export function validateConfig(c) {
  const keys = [
    "version",
    "project",
    "environment",
    "pin",
    "pythonVersion",
    "state",
    "output",
    "adapter",
    "scope",
    "partial",
    "timeoutMs",
    "minAvailableMb",
    "metadata",
  ];
  if (
    !c ||
    c.version !== 1 ||
    Object.keys(c).some((k) => !keys.includes(k)) ||
    !/^[A-Za-z0-9_.-]+$/.test(c.project || "") ||
    !/^\d+\.\d+\.\d+$/.test(c.pin || "")
  )
    fail("Configuração Graphify inválida");
  for (const key of ["environment", "state", "output"])
    if (!safeRelative(c[key]))
      fail("Caminho da configuração deve ser relativo e confinado");
  if (
    !["generic", "finance", "champions"].includes(c.adapter) ||
    !Array.isArray(c.scope) ||
    !c.scope.length ||
    !c.scope.every(safeRelative) ||
    typeof c.partial !== "boolean"
  )
    fail("Adapter ou corpus inválido");
  if (c.adapter === "generic" && c.scope.length !== 1)
    fail("Adapter genérico exige um escopo explícito");
  if (c.adapter === "finance" && (!c.partial || c.scope.length !== 5))
    fail("Finance exige perfil pilot parcial explícito");
  if (c.adapter === "champions" && (!c.partial || c.scope.length !== 1))
    fail("Champions exige escopo parcial explícito");
  if (
    !Number.isInteger(c.timeoutMs) ||
    c.timeoutMs < 100 ||
    c.timeoutMs > 1800000 ||
    !Number.isInteger(c.minAvailableMb) ||
    c.minAvailableMb < 1
  )
    fail("Limites de execução inválidos");
  if (
    !/^3\.1[012]$/.test(c.pythonVersion || "") ||
    !Array.isArray(c.metadata) ||
    !c.metadata.every((f) => safeRelative(f) && !secretPath(f))
  )
    fail("Python ou metadados inválidos");
  return c;
}

export function parse(args) {
  const options = { terms: [] };
  for (let i = 0; i < args.length; i++) {
    const value = args[i];
    if (value === "--root" || value === "--config") {
      const key = value.slice(2);
      if (options[key] || !args[i + 1] || args[i + 1].startsWith("--"))
        fail("Opção duplicada ou sem valor");
      options[key] = args[++i];
    } else if (value.startsWith("--")) fail("Opção desconhecida");
    else if (!options.action) options.action = value;
    else options.terms.push(value);
  }
  const { action } = options;
  if (
    ![
      "install",
      "status",
      "mark",
      "ensure",
      "query",
      "path",
      "explain",
    ].includes(action)
  )
    fail("Use install/status/mark/ensure/query/path/explain");
  if (options.terms.some((term) => term.startsWith("-") || term.includes("\0")))
    fail("Termo de consulta inválido");
  const count =
    action === "path" ? 2 : ["query", "explain"].includes(action) ? 1 : 0;
  if (options.terms.length !== count) fail("Quantidade de argumentos inválida");
  return options;
}

export async function confined(root, relative, { ignored = false } = {}) {
  const target = path.resolve(root, relative);
  if (!inside(root, target) || target === root) fail("Caminho fora da raiz");
  let cursor = root;
  for (const part of path.relative(root, target).split(path.sep)) {
    cursor = path.join(cursor, part);
    if ((await exists(cursor)) && (await lstat(cursor)).isSymbolicLink())
      fail("Caminho local atravessa symlink");
  }
  if (ignored) {
    const r = await run(
      [
        "git",
        "-c",
        "core.hooksPath=/dev/null",
        "-C",
        root,
        "check-ignore",
        "--quiet",
        `${target}/probe`,
      ],
      root,
      environment(),
      30000,
    );
    if (r.code !== 0) fail("Diretório local precisa estar ignorado pelo Git");
  }
  return target;
}
