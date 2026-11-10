import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile, stat } from "node:fs/promises";
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
  const { rename } = await import("node:fs/promises");
  await rename(temp, file);
}
