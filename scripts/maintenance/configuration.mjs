import { mkdtemp, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { tmpdir } from "node:os";
import { MaintenanceError, fail } from "./common.mjs";
import { run } from "./process.mjs";
import { dependencyFingerprint } from "./dependencies.mjs";

export const localRequire = (root) =>
  createRequire(path.join(root, "package.json"));

export function tool(root, name) {
  try {
    const req = localRequire(root),
      pkg = req.resolve(`${name}/package.json`),
      dir = path.dirname(pkg);
    return { req, dir, pkg };
  } catch {
    throw new MaintenanceError(
      "missing_dependencies",
      `Dependência local ausente: ${name}`,
    );
  }
}

export function validateConfig(c) {
  const keys = [
    "version",
    "manager",
    "tsconfigs",
    "gates",
    "fix",
    "timeoutMs",
    "maxFiles",
    "maxChangedLines",
  ];
  if (
    !c ||
    typeof c !== "object" ||
    Object.keys(c).some((k) => !keys.includes(k)) ||
    c.version !== 1
  )
    fail("Configuração inválida ou versão desconhecida");
  if (!["npm", "bun"].includes(c.manager))
    fail("Gerenciador deve ser npm ou bun");
  const relative = (x) =>
    typeof x === "string" &&
    x.length &&
    !path.isAbsolute(x) &&
    !x.split(/[\\/]/).includes("..") &&
    !x.startsWith("-");
  if (
    !Array.isArray(c.tsconfigs) ||
    !c.tsconfigs.length ||
    !c.tsconfigs.every(relative)
  )
    fail("tsconfigs explícitos obrigatórios");
  const expected = ["lint", "types", "test", "build"];
  if (
    !Array.isArray(c.gates) ||
    c.gates.length !== 4 ||
    expected.some((name) => c.gates.filter((g) => g.name === name).length !== 1)
  )
    fail("Gates lint/types/test/build obrigatórios e únicos");
  for (const g of c.gates) {
    if (
      Object.keys(g).some((k) => !["name", "command", "env"].includes(k)) ||
      !Array.isArray(g.command) ||
      !g.command.length ||
      !g.command.every((s) => typeof s === "string" && s && !s.includes("\0"))
    )
      fail("Comando de gate inválido");
    if (g.env !== undefined) {
      if (!g.env || typeof g.env !== "object" || Array.isArray(g.env))
        fail("Ambiente de gate inválido");
      for (const [name, value] of Object.entries(g.env)) {
        if (typeof value !== "string") fail("Variável de teste deve ser texto");
        if (name === "VITE_SUPABASE_URL") {
          let url;
          try {
            url = new URL(value);
          } catch {
            fail("URL pública de teste inválida");
          }
          if (
            !["http:", "https:"].includes(url.protocol) ||
            (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) &&
              !url.hostname.endsWith(".invalid")) ||
            url.username ||
            url.password ||
            url.search ||
            url.hash
          )
            fail("URL pública deve ser local ou .invalid, sem credenciais");
        } else if (name === "VITE_SUPABASE_PROJECT_ID") {
          if (!["maintenance_test", "test_fixture"].includes(value))
            fail("Project ID deve ser um identificador sintético de teste");
        } else if (
          ["VITE_SUPABASE_ANON_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY"].includes(
            name,
          )
        ) {
          if (
            !/^(?:sb_publishable_)?(?:test|example|fixture|local|maintenance)[A-Za-z0-9_.-]{0,128}$/.test(
              value,
            )
          )
            fail("Chave pública deve ser um placeholder explícito de teste");
        } else fail("Variável de ambiente fora da allowlist pública de teste");
      }
    }
    if (
      !["node", "npm", "bun"].includes(g.command[0]) ||
      g.command.some((s) =>
        ["--watch", "-w", "--fix", "--write", "--update-baseline"].includes(s),
      )
    )
      fail("Gate deve ser finito e não corretivo");
    if (
      g.name === "types" &&
      (g.command[0] !== "node" ||
        path.basename(g.command[1] || "") !== "typecheck.mjs" ||
        !c.tsconfigs.every((cfg) => g.command.includes(cfg)))
    )
      fail("Gate types deve usar typecheck.mjs e incluir todos os tsconfigs");
  }
  const f = c.fix;
  if (
    !f ||
    Object.keys(f).some(
      (k) => !["roots", "eslintRules", "prettier", "exclude"].includes(k),
    ) ||
    !Array.isArray(f.roots) ||
    !f.roots.length ||
    !f.roots.every(
      (x) => x === "src" || (x.startsWith("src/") && relative(x)),
    ) ||
    typeof f.prettier !== "boolean"
  )
    fail("Escopo de correção deve ficar em src");
  if (
    f.exclude !== undefined &&
    (!Array.isArray(f.exclude) ||
      !f.exclude.every((file) => relative(file) && !/[*?[\]{}]/.test(file)))
  )
    fail("Exclusões devem ser caminhos relativos explícitos, sem globs");
  const allowed = [
    "semi",
    "quotes",
    "indent",
    "comma-dangle",
    "eol-last",
    "no-trailing-spaces",
    "space-infix-ops",
    "keyword-spacing",
    "object-curly-spacing",
    "array-bracket-spacing",
  ];
  if (
    !Array.isArray(f.eslintRules) ||
    !f.eslintRules.every((x) => allowed.includes(x))
  )
    fail("Regra ESLint não autorizada para correção");
  for (const key of ["timeoutMs", "maxFiles", "maxChangedLines"])
    if (!Number.isInteger(c[key]) || c[key] < 1) fail(`Limite ${key} inválido`);
  if (c.timeoutMs > 900000 || c.maxFiles > 20 || c.maxChangedLines > 400)
    fail("Limites excedem política: timeout 15min, 20 arquivos, 400 linhas");
  return c;
}

export async function inspect(root, config) {
  const { req } = tool(root, "typescript");
  tool(root, "eslint");
  if (config.fix.prettier) tool(root, "prettier");
  const ts = req("typescript"),
    coverage = [];
  const hasApi =
    typeof ts.readConfigFile === "function" &&
    typeof ts.parseJsonConfigFileContent === "function" &&
    typeof ts.sys?.readFile === "function";
  for (const cfg of config.tsconfigs) {
    const filename = path.resolve(root, cfg);
    let fileNames;
    if (hasApi) {
      const parsed = ts.readConfigFile(filename, ts.sys.readFile);
      if (parsed.error) fail(`Não foi possível ler tsconfig ${cfg}`);
      const result = ts.parseJsonConfigFileContent(
        parsed.config,
        ts.sys,
        path.dirname(filename),
      );
      if (result.errors.length) fail(`tsconfig inválido: ${cfg}`);
      fileNames = result.fileNames;
      if (!fileNames.length)
        fail(`Projeto TypeScript vazio ou inválido: ${cfg}`);
    } else {
      const temporary = await mkdtemp(
        path.join(tmpdir(), "maintenance-ts-list-"),
      );
      try {
        const bin = path.join(tool(root, "typescript").dir, "bin/tsc");
        const result = await run(
          [
            "unshare",
            "--user",
            "--map-root-user",
            "--net",
            "--",
            process.execPath,
            bin,
            "--noEmit",
            "--project",
            cfg,
            "--tsBuildInfoFile",
            path.join(temporary, "list.tsbuildinfo"),
            "--listFilesOnly",
          ],
          root,
          config.timeoutMs,
        );
        if (result.code !== 0 || result.timedOut || result.overflow)
          fail(
            `TypeScript CLI não conseguiu listar arquivos de ${cfg} (exit=${result.code}, timeout=${result.timedOut})`,
          );
        fileNames = result.output
          .split("\n")
          .map((f) => f.trim())
          .filter((f) => path.isAbsolute(f) && /\.[cm]?[jt]sx?$/.test(f));
        if (!fileNames.length)
          fail(`Projeto TypeScript vazio ou inválido: ${cfg}`);
      } finally {
        await rm(temporary, { recursive: true, force: true });
      }
    }
    const source = fileNames.filter((f) =>
      path.relative(root, f).replaceAll("\\", "/").startsWith("src/"),
    );
    coverage.push({
      config: cfg,
      files: fileNames.length,
      sourceFiles: source.length,
      method: hasApi ? "api" : "cli",
    });
  }
  if (!coverage.some((c) => c.sourceFiles > 0))
    fail("tsconfigs não incluem nenhum arquivo src");
  return { coverage, dependencies: await dependencyFingerprint(root) };
}
