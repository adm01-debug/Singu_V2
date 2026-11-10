import {
  constants,
  openSync,
  closeSync,
  fstatSync,
  readSync,
  writeSync,
} from "node:fs";
import { cacheRuntime } from "./runtime-copy.mjs";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  chmodSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import {
  EVENTS,
  digest,
  nonempty,
  fail,
  within,
  json,
  atomic,
} from "./common.mjs";
import { git, locate } from "./process.mjs";

function excludeIdentity(path, fd) {
  const opened = fstatSync(fd),
    current = lstatSync(path);
  if (
    !opened.isFile() ||
    opened.nlink !== 1 ||
    current.isSymbolicLink() ||
    current.dev !== opened.dev ||
    current.ino !== opened.ino
  )
    throw fail("info/exclude mudou de identidade; alteração recusada");
}
function excludeFlags(append) {
  if (typeof constants.O_NOFOLLOW !== "number")
    throw fail("O_NOFOLLOW indisponível; alteração de info/exclude bloqueada");
  return (
    constants.O_RDWR |
    constants.O_NOFOLLOW |
    constants.O_NONBLOCK |
    (append ? constants.O_APPEND | constants.O_CREAT : 0)
  );
}
export function appendExclude(path, beforeAppend = () => {}) {
  mkdirSync(dirname(path), { recursive: true });
  const fd = openSync(path, excludeFlags(true), 0o600);
  try {
    excludeIdentity(path, fd);
    const contents = readFileSync(fd, "utf8");
    const addition = contents.includes("/.tools/repo-automation/")
      ? ""
      : `${contents.endsWith("\n") || !contents ? "" : "\n"}# repo-automation local bridge\n/.tools/repo-automation/\n`;
    beforeAppend(addition);
    excludeIdentity(path, fd);
    if (addition) {
      const data = Buffer.from(addition);
      if (writeSync(fd, data, 0, data.length, null) !== data.length)
        throw fail("append incompleto em info/exclude");
      excludeIdentity(path, fd);
    }
    return addition;
  } finally {
    closeSync(fd);
  }
}
export function removeExclude(path, addition) {
  if (!addition) return false;
  let fd;
  try {
    fd = openSync(path, excludeFlags(false));
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
  try {
    excludeIdentity(path, fd);
    const contents = readFileSync(fd),
      block = Buffer.from(addition),
      offset = contents.indexOf(block);
    if (offset < 0) return false;
    excludeIdentity(path, fd);
    const current = Buffer.alloc(block.length);
    if (
      readSync(fd, current, 0, current.length, offset) !== block.length ||
      !current.equals(block)
    )
      throw fail("bloco próprio de info/exclude mudou; remoção recusada");
    // Não trunque: um append concorrente deve sobreviver à reversão.
    const blank = Buffer.from(
      block.map((byte) => (byte === 10 || byte === 13 ? byte : 32)),
    );
    if (writeSync(fd, blank, 0, blank.length, offset) !== blank.length)
      throw fail("remoção incompleta de bloco próprio");
    excludeIdentity(path, fd);
    return true;
  } finally {
    closeSync(fd);
  }
}

export async function install(ctx) {
  const { root, c, config } = ctx;
  const base = join(root, ".tools/repo-automation"),
    hooks = join(base, "hooks"),
    stateFile = join(base, "state.json");
  for (const path of [base, hooks, join(base, "runtime")])
    if (existsSync(path) && lstatSync(path).isSymbolicLink())
      throw fail("diretório da ponte não pode ser symlink");
  const tracked = (
    await git(root, ["ls-files", "-z", "--", ".tools/repo-automation"])
  ).stdout;
  if (tracked) throw fail("diretório da ponte contém arquivos rastreados");
  const effective = (
    await git(root, ["config", "--get", "core.hooksPath"], [0, 1])
  ).stdout.trim();
  let state;
  if (existsSync(stateFile)) {
    state = json(stateFile);
    if (
      state.root !== root ||
      state.hooks !== hooks ||
      ![hooks, state.previousEffective || ""].includes(effective)
    )
      throw fail("estado/ configuração de hooks mudou; instalação recusada");
    for (const [path, hash] of Object.entries(state.files || {})) {
      const target = resolve(base, path);
      if (
        !within(base, target) ||
        (existsSync(target) &&
          (lstatSync(target).isSymbolicLink() || digest(target) !== hash))
      )
        throw fail("ponte alterada por terceiro; reinstalação recusada");
    }
  } else {
    if (existsSync(base) && nonempty(base))
      throw fail(
        "diretório da ponte contém arquivos sem estado de propriedade",
      );
    if (effective === hooks)
      throw fail("hooksPath aponta à ponte sem estado de restauração");
    const previousLocal = (
      await git(
        root,
        ["config", "--local", "--get-all", "core.hooksPath"],
        [0, 1],
      )
    ).stdout
      .split("\n")
      .filter(Boolean);
    const effectivePath = (
      await git(root, ["config", "--path", "--get", "core.hooksPath"], [0, 1])
    ).stdout.trim();
    const defaultHooks = (
      await git(root, ["rev-parse", "--git-path", "hooks"])
    ).stdout.trim();
    const exclude = resolve(
      root,
      (
        await git(root, ["rev-parse", "--git-path", "info/exclude"])
      ).stdout.trim(),
    );
    state = {
      version: 1,
      id: randomUUID(),
      root,
      hooks,
      previousLocal,
      previousEffective: effective,
      previousPath: effectivePath || resolve(root, defaultHooks),
      common: realpathSync(
        resolve(
          root,
          (await git(root, ["rev-parse", "--git-common-dir"])).stdout.trim(),
        ),
      ),
      exclude,
      addition: "",
    };
    mkdirSync(base, { recursive: true, mode: 0o700 });
    chmodSync(base, 0o700);
    appendExclude(exclude, (addition) => {
      state.addition = addition;
      atomic(stateFile, JSON.stringify(state, null, 2));
    });
  }
  mkdirSync(hooks, { recursive: true });
  const script = locate(root, c, config, c.entrypoint);
  const quote = (s) => "'" + s.replace(/'/g, "'\\''") + "'";
  atomic(join(base, "runtime/automation.mjs"), readFileSync(script));
  const modules = cacheRuntime(script, base);
  atomic(join(base, "runtime/automation.config.json"), JSON.stringify(c));
  for (const event of EVENTS) {
    const configArg = within(root, config)
      ? '"$repo_root"/' + quote(relative(root, config))
      : quote(config);
    const scriptArg = within(root, script)
      ? '"$repo_root"/' + quote(relative(root, script))
      : quote(script);
    const body = `#!/bin/sh\nrepo_root=$(git rev-parse --show-toplevel) || exit 1\nscript=${scriptArg}\nconfig=${configArg}\n[ -f "$script" ] || script=${quote(join(base, "runtime/automation.mjs"))}\n[ -f "$config" ] || config=${quote(join(base, "runtime/automation.config.json"))}\nexec ${quote(process.execPath)} "$script" --root "$repo_root" --config "$config" hook ${quote(event)} -- "$@"\n`;
    atomic(join(hooks, event), body, 0o700);
  }
  state.files = Object.fromEntries(
    [
      ...EVENTS.map((e) => "hooks/" + e),
      "runtime/automation.mjs",
      "runtime/automation.config.json",
      ...modules,
    ].map((p) => [p, digest(join(base, p))]),
  );
  atomic(stateFile, JSON.stringify(state, null, 2));
  await git(root, ["config", "--local", "core.hooksPath", hooks]);
  return {
    ok: true,
    status: "installed",
    hooks,
    previousHooksPath: state.previousEffective || "(Git default)",
  };
}

export async function uninstall(ctx) {
  const stateFile = join(ctx.root, ".tools/repo-automation/state.json");
  if (!existsSync(stateFile)) return { ok: true, status: "not_installed" };
  const state = json(stateFile),
    expected = join(ctx.root, ".tools/repo-automation/hooks");
  if (state.root !== ctx.root || state.hooks !== expected)
    throw fail("estado de hooks inválido");
  for (const path of [
    dirname(expected),
    expected,
    join(dirname(expected), "runtime"),
    join(dirname(expected), "runtime/automation"),
  ])
    if (existsSync(path) && lstatSync(path).isSymbolicLink())
      throw fail(
        "diretório da ponte alterado para symlink; restauração recusada",
      );
  const effective = (
    await git(ctx.root, ["config", "--get", "core.hooksPath"], [0, 1])
  ).stdout.trim();
  if (effective !== expected)
    throw fail("hooksPath foi alterado por terceiro; restauração recusada");
  for (const [path, hash] of Object.entries(state.files || {})) {
    const target = resolve(dirname(expected), path);
    if (
      !within(dirname(expected), target) ||
      (existsSync(target) &&
        (lstatSync(target).isSymbolicLink() || digest(target) !== hash))
    )
      throw fail(
        "arquivo da ponte alterado por terceiro; desinstalação recusada",
      );
  }
  removeExclude(state.exclude, state.addition);
  await git(
    ctx.root,
    ["config", "--local", "--unset-all", "core.hooksPath"],
    [0, 5],
  );
  for (const value of state.previousLocal)
    await git(ctx.root, [
      "config",
      "--local",
      "--add",
      "core.hooksPath",
      value,
    ]);
  // Remove somente os arquivos conhecidos criados por esta instalação.
  for (const event of EVENTS) rmSync(join(expected, event), { force: true });
  for (const file of [
    "runtime/automation.mjs",
    "runtime/automation.config.json",
    ...Object.keys(state.files || {}).filter((file) =>
      file.startsWith("runtime/automation/"),
    ),
  ])
    rmSync(join(dirname(expected), file), { force: true });
  rmSync(stateFile);
  return { ok: true, status: "uninstalled" };
}
