import { readFile, realpath, symlink, readdir, lstat } from "node:fs/promises";
import path from "node:path";
import { MaintenanceError, digest, exists, inside } from "./common.mjs";

export const locks = [
  "bun.lock",
  "bun.lockb",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
];

export async function directoryHash(root) {
  const entries = [];
  async function visit(file, relative) {
    const info = await lstat(file);
    if (info.isSymbolicLink())
      throw new MaintenanceError(
        "missing_dependencies",
        "Symlink interno em dependência local não suportado",
      );
    if (info.isDirectory()) {
      for (const name of (await readdir(file)).sort()) {
        if (name === ".git")
          throw new MaintenanceError(
            "missing_dependencies",
            "Submódulo local precisa de instalação isolada explícita",
          );
        await visit(
          path.join(file, name),
          relative ? `${relative}/${name}` : name,
        );
      }
    } else if (info.isFile())
      entries.push([relative, info.mode & 0o111, digest(await readFile(file))]);
    else
      throw new MaintenanceError(
        "missing_dependencies",
        "Entrada especial em dependência local não suportada",
      );
  }
  await visit(root, "");
  return digest(JSON.stringify(entries));
}

export async function localDependencies(root) {
  const paths = new Set(),
    links = {};
  const add = (value) => {
    const relative = value
      .replace(/^(file:|link:)/, "")
      .replaceAll("\\", "/")
      .replace(/^\.\//, "");
    const absolute = path.resolve(root, relative);
    if (!relative || relative === "." || !inside(root, absolute))
      throw new MaintenanceError(
        "missing_dependencies",
        "Dependência local fora do repositório não suportada",
      );
    paths.add(path.relative(root, absolute).replaceAll("\\", "/"));
    return path.relative(root, absolute).replaceAll("\\", "/");
  };
  const manifest = JSON.parse(
    await readFile(path.join(root, "package.json"), "utf8"),
  );
  const visit = (value) => {
    if (typeof value === "string" && /^(file:|link:)/.test(value)) add(value);
    else if (typeof value === "string" && value.startsWith("workspace:"))
      throw new MaintenanceError(
        "missing_dependencies",
        "Dependência workspace precisa de instalação isolada explícita",
      );
    else if (value && typeof value === "object")
      for (const child of Object.values(value)) visit(child);
  };
  visit(manifest);
  for (const name of [
    "package-lock.json",
    "bun.lock",
    "pnpm-lock.yaml",
    "yarn.lock",
  ])
    if (await exists(path.join(root, name))) {
      const text = await readFile(path.join(root, name), "utf8");
      if (name === "package-lock.json") {
        const lock = JSON.parse(text);
        for (const [key, entry] of Object.entries(lock.packages || {})) {
          if (entry.link === true && typeof entry.resolved === "string")
            links[key] = add(entry.resolved);
          else if (
            typeof entry.resolved === "string" &&
            /^(file:|link:)/.test(entry.resolved)
          )
            links[key] = add(entry.resolved);
        }
      } else if (
        /\b(?:file:|link:|workspace:)/.test(text) &&
        paths.size === 0
      ) {
        throw new MaintenanceError(
          "missing_dependencies",
          "Dependência local no lockfile sem manifesto/package-lock verificável",
        );
      }
    }
  const local = {};
  for (const relative of [...paths].sort()) {
    const absolute = path.join(root, relative);
    if (!(await exists(absolute)) || !(await lstat(absolute)).isDirectory())
      throw new MaintenanceError(
        "missing_dependencies",
        "Dependência local precisa ser um diretório versionado",
      );
    const metadata = JSON.parse(
      await readFile(path.join(absolute, "package.json"), "utf8"),
    );
    local[relative] = await directoryHash(absolute);
    if (typeof metadata.name === "string") {
      const installed = path.posix.join("node_modules", metadata.name);
      if (
        !inside(path.join(root, "node_modules"), path.resolve(root, installed))
      )
        throw new MaintenanceError(
          "missing_dependencies",
          "Nome de dependência local inválido",
        );
      links[installed] ||= relative;
    }
  }
  return { local, links };
}

export async function dependencyFingerprint(root) {
  const files = {};
  for (const file of ["package.json", ...locks])
    if (await exists(path.join(root, file)))
      files[file] = digest(await readFile(path.join(root, file)));
  if (!files["package.json"] || !locks.some((f) => files[f]))
    throw new MaintenanceError(
      "missing_dependencies",
      "Manifesto ou lockfile ausente",
    );
  const dependencies = await localDependencies(root);
  if (await exists(path.join(root, "node_modules"))) {
    for (const [installed, relative] of Object.entries(dependencies.links))
      if (installed.startsWith("node_modules/")) {
        let actual;
        try {
          actual = await realpath(path.join(root, installed));
        } catch {
          throw new MaintenanceError(
            "missing_dependencies",
            "Dependência local instalada ausente",
          );
        }
        if ((await directoryHash(actual)) !== dependencies.local[relative])
          throw new MaintenanceError(
            "missing_dependencies",
            "Dependência local instalada difere do conteúdo versionado",
          );
      }
  }
  return {
    files,
    ...dependencies,
    hash: digest(JSON.stringify({ files, ...dependencies })),
  };
}

export async function reuseDependencies(source, target) {
  const before = await dependencyFingerprint(source),
    after = await dependencyFingerprint(target);
  if (before.hash !== after.hash)
    throw new MaintenanceError(
      "missing_dependencies",
      "Manifesto/lockfiles/dependências locais do clone diferem da referência isolada",
    );
  const modules = path.join(source, "node_modules");
  if (!(await exists(modules)))
    throw new MaintenanceError(
      "missing_dependencies",
      "node_modules ausente; instalação automática desabilitada",
    );
  for (const [installed, relative] of Object.entries(before.links)) {
    if (!installed.startsWith("node_modules/")) continue;
    let actual;
    try {
      actual = await realpath(path.join(source, installed));
    } catch {
      throw new MaintenanceError(
        "missing_dependencies",
        "Dependência local instalada ausente",
      );
    }
    if ((await directoryHash(actual)) !== before.local[relative])
      throw new MaintenanceError(
        "missing_dependencies",
        "Dependência local instalada difere da referência isolada",
      );
  }
  const modulesReal = await realpath(modules);
  async function checkLinks(folder, scope = "") {
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const full = path.join(folder, entry.name),
        name = scope ? `${scope}/${entry.name}` : entry.name;
      if (!scope && entry.name.startsWith("@") && entry.isDirectory())
        await checkLinks(full, entry.name);
      if (entry.isSymbolicLink()) {
        const actual = await realpath(full);
        if (
          !inside(modulesReal, actual) &&
          !before.links[`node_modules/${name}`]
        )
          throw new MaintenanceError(
            "missing_dependencies",
            "Link externo em node_modules sem dependência local verificável",
          );
      }
    }
  }
  await checkLinks(modulesReal);
  await symlink(
    await realpath(modules),
    path.join(target, "node_modules"),
    "dir",
  );
  return {
    source,
    hash: before.hash,
    files: before.files,
    local: before.local,
  };
}
