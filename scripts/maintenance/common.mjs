import { createHash, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import {
  mkdir,
  writeFile,
  stat,
  readdir,
  lstat,
  open,
  rename,
} from "node:fs/promises";
import path from "node:path";

export class MaintenanceError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export const fail = (message) => {
  throw new MaintenanceError("failed", message);
};

export const digest = (value) =>
  createHash("sha256").update(value).digest("hex");

export const exists = async (file) => {
  try {
    await stat(file);
    return true;
  } catch (e) {
    if (e.code === "ENOENT") return false;
    throw e;
  }
};

export const safeEnv = ({ nodeEnv, publicEnv = {}, hooks = false } = {}) => ({
  ...Object.fromEntries(
    Object.entries(process.env).filter(([k]) =>
      [
        "PATH",
        "HOME",
        "TMPDIR",
        "TEMP",
        "SystemRoot",
        "COMSPEC",
        "TZ",
        "LANG",
      ].includes(k),
    ),
  ),
  CI: "true",
  NO_COLOR: "1",
  ...(nodeEnv ? { NODE_ENV: nodeEnv } : {}),
  ...(hooks ? { HUSKY: "1" } : {}),
  ...publicEnv,
});

export const inside = (root, file) => {
  const relative = path.relative(root, file);
  return (
    relative === "" ||
    (!path.isAbsolute(relative) &&
      relative !== ".." &&
      !relative.startsWith(`..${path.sep}`))
  );
};

export async function writeJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  const temp = `${file}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(value, null, 2) + "\n", { mode: 0o600 });
  await rename(temp, file);
}

export async function readRegularDependency(file, expected) {
  let handle;
  try {
    handle = await open(
      file,
      constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK,
    );
  } catch {
    throw new MaintenanceError(
      "missing_dependencies",
      "Arquivo de dependência local mudou ou não pode ser aberto com segurança",
    );
  }
  try {
    const before = await handle.stat();
    if (
      !before.isFile() ||
      before.ino !== expected.ino ||
      before.dev !== expected.dev
    )
      throw new MaintenanceError(
        "missing_dependencies",
        "Arquivo de dependência local foi substituído durante a inspeção",
      );
    const bytes = await handle.readFile();
    const after = await handle.stat();
    if (
      before.size !== after.size ||
      before.mtimeMs !== after.mtimeMs ||
      before.ctimeMs !== after.ctimeMs
    )
      throw new MaintenanceError(
        "missing_dependencies",
        "Arquivo de dependência local mudou durante a leitura",
      );
    return { bytes, mode: before.mode };
  } finally {
    await handle.close();
  }
}

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
    } else if (info.isFile()) {
      const content = await readRegularDependency(file, info);
      entries.push([relative, content.mode & 0o111, digest(content.bytes)]);
    } else
      throw new MaintenanceError(
        "missing_dependencies",
        "Entrada especial em dependência local não suportada",
      );
  }
  await visit(root, "");
  return digest(JSON.stringify(entries));
}
