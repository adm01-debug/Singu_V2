import {mkdirSync,readFileSync,readdirSync,renameSync,writeFileSync} from "node:fs";
import {homedir} from "node:os";
import {dirname,isAbsolute,join,sep} from "node:path";
import {fileURLToPath} from "node:url";
import {createHash,randomUUID} from "node:crypto";

export const SELF = fileURLToPath(new URL("../automation.mjs", import.meta.url));

export const APPROVED = join(homedir(), ".local/share/repo-maintenance");

export const EVENTS = [
  "applypatch-msg",
  "pre-applypatch",
  "post-applypatch",
  "pre-commit",
  "pre-merge-commit",
  "prepare-commit-msg",
  "commit-msg",
  "post-commit",
  "pre-rebase",
  "post-checkout",
  "post-merge",
  "pre-push",
  "pre-receive",
  "update",
  "proc-receive",
  "post-receive",
  "post-update",
  "reference-transaction",
  "push-to-checkout",
  "post-rewrite",
  "sendemail-validate",
  "fsmonitor-watchman",
  "p4-changelist",
  "p4-prepare-changelist",
  "p4-post-changelist",
  "p4-pre-submit",
  "post-index-change",
];

export const TRIGGERS = [
  "manual",
  "precommit",
  "prepush",
  "postcommit",
  "postmerge",
  "postcheckout",
  "PR",
  "pushmain",
  "nightly",
];

export const digest = (path) =>
  createHash("sha256").update(readFileSync(path)).digest("hex");

export const nonempty = (dir) =>
  readdirSync(dir, { withFileTypes: true }).some(
    (e) => !e.isDirectory() || nonempty(join(dir, e.name)),
  );

export const fail = (message, code = 1) => Object.assign(new Error(message), { code });

export const within = (base, target) =>
  target === base || target.startsWith(base + sep);

export const json = (path) => JSON.parse(readFileSync(path, "utf8"));

export const atomic = (path, data, mode = 0o600) => {
  mkdirSync(dirname(path), { recursive: true });
  const temp = path + "." + randomUUID();
  writeFileSync(temp, data, { mode });
  renameSync(temp, path);
};

export const pattern = (glob) =>
  new RegExp(
    "^" +
      glob
        .split("**")
        .map((p) =>
          p
            .split("*")
            .map((s) =>
              s.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\?/g, "."),
            )
            .join("[^/]*"),
        )
        .join(".*") +
      "$",
  );

export const relativePath = (value) =>
  typeof value === "string" &&
  value.length > 0 &&
  !isAbsolute(value) &&
  !value.split(/[\\/]/).includes("..") &&
  !value.includes("\0");

export const command = (value) =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every(
    (p) => typeof p === "string" && p.length > 0 && !p.includes("\0"),
  );

export function onlyKeys(value, keys, label) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw fail(`${label}: objeto obrigatório`);
  for (const k of Object.keys(value))
    if (!keys.includes(k)) throw fail(`${label}: chave desconhecida ${k}`);
}
