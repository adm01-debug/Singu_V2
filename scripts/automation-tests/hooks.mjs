import test from "node:test";
import assert from "node:assert/strict";
import {existsSync,mkdtempSync,rmSync,writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {text,fixture} from "./fixture.mjs";

test("install/uninstall idempotentes restauram hooksPath e exclusões anteriores", (t) => {
  const f = fixture(t);
  const exclude = join(f.root, ".git/info/exclude");
  const before = text(exclude);
  f.install();
  f.install();
  assert.equal(
    f.git("check-ignore", ".tools/repo-automation/state.json"),
    ".tools/repo-automation/state.json",
  );
  assert.equal(f.cli("doctor").status, 0);
  assert.equal(f.cli("uninstall-hooks").status, 0);
  assert.equal(f.cli("uninstall-hooks").status, 0);
  assert.equal(f.git("config", "core.hooksPath"), ".original-hooks");
  assert.equal(text(exclude), before);
});

test("uninstall funciona se o config versionado foi removido e não apaga mudança de terceiro", (t) => {
  const f = fixture(t);
  f.install();
  f.git("config", "core.hooksPath", ".third-party");
  assert.notEqual(f.cli("uninstall-hooks").status, 0);
  assert.equal(f.git("config", "core.hooksPath"), ".third-party");
  f.git(
    "config",
    "core.hooksPath",
    join(f.root, ".tools/repo-automation/hooks"),
  );
  rmSync(join(f.root, "scripts/automation.config.json"));
  assert.equal(f.cli("uninstall-hooks").status, 0);
  assert.equal(f.git("config", "core.hooksPath"), ".original-hooks");
});

test("commit real aciona ponte e conserva falha original antes de nossos testes", (t) => {
  const f = fixture(t, {
    originalHook: "printf original > fixture-original.log\nexit 7\n",
  });
  f.install();
  f.write("src/source.txt", "novo\n");
  f.git("add", "src/source.txt");
  const before = f.git("rev-parse", "HEAD");
  const r = f.run("git", ["commit", "-m", "não pode"]);
  assert.notEqual(r.status, 0);
  assert.equal(text(join(f.root, "fixture-original.log")), "original");
  assert.equal(f.git("rev-parse", "HEAD"), before);
});

test("commit-msg original também permanece obrigatório", (t) => {
  const f = fixture(t, {
    hookName: "commit-msg",
    originalHook: 'printf "%s" "$1" > fixture-message.log\nexit 9\n',
  });
  f.install();
  f.write("src/source.txt", "novo\n");
  f.git("add", "src/source.txt");
  assert.notEqual(f.run("git", ["commit", "-m", "bloqueado"]).status, 0);
  assert.match(text(join(f.root, "fixture-message.log")), /COMMIT_EDITMSG/);
});

test("ponte preserva argumentos e stdin completos do pre-push", (t) => {
  const f = fixture(t, {
    hookName: "pre-push",
    originalHook:
      'printf "%s\\n" "$@" > fixture-args.log\ncat > fixture-stdin.log\n',
  });
  f.install();
  const input =
    "refs/heads/main " +
    "1".repeat(40) +
    " refs/heads/main " +
    "0".repeat(40) +
    "\n";
  const r = f.run(
    join(f.root, ".tools/repo-automation/hooks/pre-push"),
    ["origin", "remote fixture"],
    { input },
  );
  assert.equal(r.status, 0, r.stderr);
  assert.equal(text(join(f.root, "fixture-stdin.log")), input);
  assert.equal(
    text(join(f.root, "fixture-args.log")),
    "origin\nremote fixture\n",
  );
});

test("hook versionado Husky executa via sh quando bootstrap não existe", (t) => {
  const f = fixture(t, { previous: ".husky/_" });
  f.write(".husky/pre-commit", "printf husky > fixture-husky.log\nexit 6\n");
  f.install();
  f.write("src/source.txt", "novo\n");
  f.git("add", "src/source.txt");
  assert.notEqual(f.run("git", ["commit", "-m", "bloqueado"]).status, 0);
  assert.equal(text(join(f.root, "fixture-husky.log")), "husky");
});

test("sem Husky, ponte não reformata nem perde partial staging", (t) => {
  const f = fixture(t);
  f.install();
  f.write("src/source.txt", "staged\n");
  f.git("add", "src/source.txt");
  f.write("src/source.txt", "unstaged\n");
  const r = f.run("git", ["commit", "-m", "parcial"]);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(f.git("show", "HEAD:src/source.txt"), "staged");
  assert.equal(text(join(f.root, "src/source.txt")), "unstaged\n");
  assert.ok(existsSync(join(f.root, ".tools/graph-state/dirty.json")));
});

test("pre-commit executa testes de tooling e conserva erro de suite", (t) => {
  const f = fixture(t);
  f.install();
  f.write(
    "scripts/smoke.unit.mjs",
    "import test from 'node:test';test('bloqueia',()=>{throw Error('fixture')});\n",
  );
  f.git("add", "scripts/smoke.unit.mjs");
  const r = f.run("git", ["commit", "-m", "tool quebrado"]);
  assert.notEqual(r.status, 0);
  assert.match(f.git("diff", "--cached", "--name-only"), /smoke.unit.mjs/);
});

test("hook recursivo original é bloqueado sem bypass", (t) => {
  const f = fixture(t, { originalHook: "git hook run pre-commit\n" });
  f.install();
  f.write("src/source.txt", "novo\n");
  f.git("add", "src/source.txt");
  const r = f.run("git", ["commit", "-m", "recursão"]);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /recursão de hook recusada/);
});

test("ponte compartilhada usa raiz e staging da worktree que disparou o hook", (t) => {
  const f = fixture(t);
  f.install();
  const worktree = mkdtempSync(join(tmpdir(), "repo-automation-linked-"));
  t.after(() => rmSync(worktree, { recursive: true, force: true }));
  f.git("worktree", "add", "--detach", worktree, "HEAD");
  writeFileSync(join(worktree, "src/source.txt"), "outra worktree\n");
  const add = f.run("git", ["-C", worktree, "add", "src/source.txt"]);
  assert.equal(add.status, 0, add.stderr);
  const r = f.run("git", ["-C", worktree, "commit", "-m", "worktree fixture"]);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(text(join(f.root, "src/source.txt")), "base\n");
  assert.ok(existsSync(join(worktree, ".tools/graph-state/dirty.json")));
  assert.equal(f.git("show", "HEAD:src/source.txt"), "base");
});

test("não sobrescreve arquivos de terceiros na instalação nem na reversão", (t) => {
  const f = fixture(t);
  f.write(".tools/repo-automation/foreign.txt", "preservar\n");
  assert.notEqual(f.cli("install-hooks").status, 0);
  assert.equal(
    text(join(f.root, ".tools/repo-automation/foreign.txt")),
    "preservar\n",
  );
  rmSync(join(f.root, ".tools/repo-automation/foreign.txt"));
  f.install();
  const bridge = join(f.root, ".tools/repo-automation/hooks/pre-commit");
  writeFileSync(bridge, "#!/bin/sh\nexit 3\n");
  assert.notEqual(f.cli("uninstall-hooks").status, 0);
  assert.equal(text(bridge), "#!/bin/sh\nexit 3\n");
});
