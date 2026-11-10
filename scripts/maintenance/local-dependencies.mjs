import { createHash } from "node:crypto";
import { readFile, lstat } from "node:fs/promises";
import path from "node:path";
import {
  MaintenanceError,
  digest,
  exists,
  inside,
  readRegularDependency,
  directoryHash,
} from "./common.mjs";
import { run } from "./process.mjs";

export function parseBunJson(text) {
  let result = "",
    quoted = false,
    escaped = false;
  for (let i = 0; i < text.length; i++) {
    const value = text[i];
    if (quoted) {
      result += value;
      if (escaped) escaped = false;
      else if (value === "\\") escaped = true;
      else if (value === '"') quoted = false;
      continue;
    }
    if (value === '"') quoted = true;
    if (value === ",") {
      let next = i + 1;
      while (next < text.length && /\s/.test(text[next])) next++;
      if (text[next] === "]" || text[next] === "}") continue;
    }
    result += value;
  }
  try {
    return JSON.parse(result);
  } catch {
    throw new MaintenanceError(
      "missing_dependencies",
      "Bun lock não pôde ser lido como JSON com vírgulas finais",
    );
  }
}

export async function tarballMetadata(bytes, root) {
  const result = await run(
    [
      "tar",
      "--extract",
      "--gzip",
      "--to-stdout",
      "--file",
      "-",
      "--",
      "package/package.json",
    ],
    root,
    5000,
    { input: bytes },
  );
  if (
    result.code !== 0 ||
    result.timedOut ||
    result.overflow ||
    result.stdout.length > 65536
  )
    throw new MaintenanceError(
      "missing_dependencies",
      "Não foi possível ler a identidade do tarball local sem extrair arquivos",
    );
  let metadata;
  try {
    metadata = JSON.parse(result.stdout);
  } catch {
    throw new MaintenanceError(
      "missing_dependencies",
      "Manifesto do tarball local inválido",
    );
  }
  if (typeof metadata.name !== "string" || typeof metadata.version !== "string")
    throw new MaintenanceError(
      "missing_dependencies",
      "Tarball local sem nome ou versão",
    );
  return metadata;
}

export async function localDependencies(root) {
  const paths = new Set(),
    links = {},
    archives = {};
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
          ) {
            const relative = add(entry.resolved);
            if (/\.(?:tgz|tar\.gz)$/.test(relative)) {
              if (
                !key.startsWith("node_modules/") ||
                !inside(
                  path.join(root, "node_modules"),
                  path.resolve(root, key),
                ) ||
                typeof entry.version !== "string" ||
                typeof entry.integrity !== "string"
              )
                throw new MaintenanceError(
                  "missing_dependencies",
                  "Tarball local sem identidade verificável no lockfile",
                );
              (archives[relative] ||= []).push({
                installed: key,
                version: entry.version,
                integrity: entry.integrity,
              });
            } else links[key] = relative;
          }
        }
      } else if (
        name === "bun.lock" &&
        [...paths].some((file) => /\.(?:tgz|tar\.gz)$/.test(file))
      ) {
        const lock = parseBunJson(text);
        for (const [key, entry] of Object.entries(lock.packages || {})) {
          if (
            !Array.isArray(entry) ||
            typeof entry[0] !== "string" ||
            !entry[0].startsWith(key + "@")
          )
            continue;
          const spec = entry[0].slice(key.length + 1).replace(/^file:/, "");
          if (!/\.(?:tgz|tar\.gz)$/.test(spec) || /^[A-Za-z]+:\/\//.test(spec))
            continue;
          const relative = add("file:" + spec),
            installed = path.posix.join("node_modules", key);
          const integrity = entry.find(
            (value) =>
              typeof value === "string" && /^sha(?:512|384|256|1)-/.test(value),
          );
          if (
            !inside(
              path.join(root, "node_modules"),
              path.resolve(root, installed),
            ) ||
            !integrity
          )
            throw new MaintenanceError(
              "missing_dependencies",
              "Bun lock contém tarball sem resolução verificável",
            );
          (archives[relative] ||= []).push({ installed, integrity });
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
    if (!(await exists(absolute)))
      throw new MaintenanceError(
        "missing_dependencies",
        "Dependência local versionada ausente",
      );
    const info = await lstat(absolute);
    if (info.isFile() && /\.(?:tgz|tar\.gz)$/.test(relative)) {
      const { bytes } = await readRegularDependency(absolute, info);
      if (!archives[relative]?.length)
        throw new MaintenanceError(
          "missing_dependencies",
          "Tarball local exige resolução e integridade em lockfile suportado",
        );
      for (const entry of archives[relative]) {
        const matches = entry.integrity.split(/\s+/).some((token) => {
          const match = /^(sha512|sha384|sha256|sha1)-([A-Za-z0-9+/=]+)$/.exec(
            token,
          );
          return (
            match &&
            createHash(match[1]).update(bytes).digest("base64") === match[2]
          );
        });
        if (!matches)
          throw new MaintenanceError(
            "missing_dependencies",
            "Integridade do tarball local difere do lockfile",
          );
      }
      const metadata = await tarballMetadata(bytes, root);
      for (const entry of archives[relative]) {
        const name = entry.installed.split("node_modules/").at(-1);
        if (
          metadata.name !== name ||
          (entry.version !== undefined && metadata.version !== entry.version)
        )
          throw new MaintenanceError(
            "missing_dependencies",
            "Identidade do tarball difere da resolução no lockfile",
          );
        entry.version = metadata.version;
      }
      local[relative] = digest(bytes);
      continue;
    }
    if (!info.isDirectory())
      throw new MaintenanceError(
        "missing_dependencies",
        "Dependência local precisa ser diretório ou tarball regular versionado",
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
  return { local, links, archives };
}
