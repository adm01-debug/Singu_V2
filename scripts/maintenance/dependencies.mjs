import { readFile, realpath, symlink, readdir } from "node:fs/promises";
import path from "node:path";
import {
  MaintenanceError,
  digest,
  exists,
  inside,
  directoryHash,
} from "./common.mjs";
import { localDependencies } from "./local-dependencies.mjs";

export const locks = [
  "bun.lock",
  "bun.lockb",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
];

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
    const modulesReal = await realpath(path.join(root, "node_modules"));
    for (const entries of Object.values(dependencies.archives))
      for (const entry of entries) {
        let installed;
        try {
          installed = await realpath(path.join(root, entry.installed));
        } catch {
          throw new MaintenanceError(
            "missing_dependencies",
            "Pacote do tarball local não está instalado",
          );
        }
        if (!inside(modulesReal, installed))
          throw new MaintenanceError(
            "missing_dependencies",
            "Pacote de tarball instalado fora de node_modules",
          );
        const metadata = JSON.parse(
          await readFile(path.join(installed, "package.json"), "utf8"),
        );
        const name = entry.installed.split("node_modules/").at(-1);
        if (metadata.name !== name || metadata.version !== entry.version)
          throw new MaintenanceError(
            "missing_dependencies",
            "Identidade instalada do tarball local difere do lockfile",
          );
      }
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
