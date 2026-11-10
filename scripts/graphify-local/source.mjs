import {lstat,realpath} from "node:fs/promises";
import path from "node:path";
import {extensions,ignoredParts,fileHash,digest,inside,secretPath,fail} from "./common.mjs";
import {git} from "./process.mjs";

export async function fingerprint(root, config) {
  const names = (
    await git(root, [
      "ls-files",
      "--cached",
      "--others",
      "--exclude-standard",
      "-z",
    ])
  )
    .split("\0")
    .filter(Boolean);
  const files = {},
    skipped = [];
  for (const file of [...new Set(names)].sort()) {
    if (
      !extensions.has(path.extname(file).toLowerCase()) ||
      file.split("/").some((p) => ignoredParts.has(p)) ||
      secretPath(file)
    )
      continue;
    if (
      !config.scope.some(
        (s) => s === "." || file === s || file.startsWith(`${s}/`),
      )
    )
      continue;
    const full = path.join(root, file);
    if (!inside(root, full)) fail("Git retornou caminho fora da raiz");
    const info = await lstat(full).catch((e) => {
      if (e.code === "ENOENT") return null;
      throw e;
    });
    if (!info) continue;
    if (
      !info.isFile() ||
      info.isSymbolicLink() ||
      !inside(root, await realpath(full))
    ) {
      skipped.push(file);
      continue;
    }
    if (info.size > 512 * 1024 * 1024)
      fail("Arquivo de código excede o limite de512MB");
    files[file] = await fileHash(full);
  }
  if (!Object.keys(files).length) fail("Corpus permitido não contém código");
  const metadata = {};
  for (const file of config.metadata) {
    const info = await lstat(path.join(root, file)).catch((e) => {
      if (e.code === "ENOENT") return null;
      throw e;
    });
    if (
      info?.isSymbolicLink() ||
      (info && !inside(root, await realpath(path.join(root, file))))
    )
      fail("Metadado do corpus não pode atravessar symlink");
    metadata[file] = info?.isFile()
      ? await fileHash(path.join(root, file))
      : null;
  }
  const head = await git(root, ["rev-parse", "HEAD"]),
    configHash = digest(config);
  return {
    head,
    configHash,
    sourceHash: digest(files),
    metadataHash: digest(metadata),
    files,
    metadata,
    skipped,
    hash: digest({ pin: config.pin, configHash, head, files, metadata }),
  };
}
