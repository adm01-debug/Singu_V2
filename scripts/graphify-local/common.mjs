import {createReadStream} from "node:fs";
import {createHash,randomUUID} from "node:crypto";
import {readFile,writeFile,mkdir,lstat,rename} from "node:fs/promises";
import path from "node:path";

export const extensions = new Set(
  ".ts .tsx .js .jsx .mjs .cjs .py .sql .sh .bash .go .rs .java .c .h .cpp .hpp .cs .php .rb .kt .swift .lua .zig .f .f90 .scala .groovy .ex .exs .json .toml .yaml .yml".split(
    " ",
  ),
);

export const ignoredParts = new Set([
  ".git",
  ".tools",
  ".venv",
  ".venv-graphify",
  "venv",
  "node_modules",
  "graphify-out",
  ".graphify-local",
  "dist",
  "coverage",
  "test-results",
  "playwright-report",
  "__pycache__",
  ".audit",
  ".autofix",
]);

export const hash = (v) => createHash("sha256").update(v).digest("hex");

export const fileHash = async (file) => {
  const digest = createHash("sha256");
  for await (const part of createReadStream(file)) digest.update(part);
  return digest.digest("hex");
};

export const canonical = (v) =>
  Array.isArray(v)
    ? v.map(canonical)
    : v && typeof v === "object"
      ? Object.fromEntries(
          Object.keys(v)
            .sort()
            .map((k) => [k, canonical(v[k])]),
        )
      : v;

export const digest = (v) => hash(JSON.stringify(canonical(v)));

export const inside = (root, file) => {
  const rel = path.relative(root, file);
  return (
    rel === "" ||
    (rel !== ".." && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel))
  );
};

export const safeRelative = (v) =>
  typeof v === "string" &&
  v.length > 0 &&
  !v.startsWith("-") &&
  !path.isAbsolute(v) &&
  !v.split(/[\\/]/).includes("..");

export const secretPath = (file) =>
  file.split("/").some((p) => /^\.env(?:\.|$)/i.test(p)) ||
  /(?:^|\/)(?:credentials?|secrets?|private[-_]keys?)\.(?:json|ya?ml|toml)$|\.(?:pem|key|p12|pfx|keystore)$/i.test(
    file,
  );

export const redact = (text) =>
  String(text)
    .replace(
      /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
      "[JWT REDIGIDO]",
    )
    .replace(/\bBearer\s+\S+/gi, "Bearer [REDIGIDO]")
    .replace(
      /\b(?:gh[pousr]_|github_pat_|sk-|sb_secret_)[A-Za-z0-9_-]{12,}/g,
      "[TOKEN REDIGIDO]",
    )
    .replace(
      /\b([A-Z][A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL)[A-Z0-9_]*\s*[=:]\s*)[^\s,;]+/g,
      "$1[REDIGIDO]",
    );

export class GraphError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const fail = (message, status = "failed") => {
  throw new GraphError(status, message);
};

export const exists = async (p) =>
  lstat(p).then(
    () => true,
    (e) => {
      if (e.code === "ENOENT") return false;
      throw e;
    },
  );

export const json = async (p) => JSON.parse(await readFile(p, "utf8"));

export const codes = {
  current: 0,
  installed: 0,
  marked: 0,
  generated: 0,
  queried: 0,
  missing_runtime: 2,
  missing_graph: 3,
  unverified: 3,
  stale: 3,
  busy: 75,
  resources: 75,
  failed: 1,
};

export async function atomic(file, value) {
  await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  const temp = `${file}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(value, null, 2) + "\n", { mode: 0o600 });
  await rename(temp, file);
}
