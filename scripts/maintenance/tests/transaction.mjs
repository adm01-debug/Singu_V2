import test from "node:test";
import assert from "node:assert/strict";
import {writeFile,readFile} from "node:fs/promises";
import path from "node:path";
import {main} from "../run.mjs";
import {git} from "../lib.mjs";
import {fixture,isolated} from "./fixture.mjs";

test(
  "gate baseline falha sem criar branch ou tocar clone sujo",
  isolated,
  async (t) => {
    const f = await fixture(t, { failure: "baseline" });
    await writeFile(path.join(f.root, "src/value.ts"), "human dirty edit\n");
    const before = await git(f.root, ["show-ref"]);
    const result = await main(f.args());
    assert.equal(result.report.status, "blocked_baseline");
    assert.equal(result.exitCode, 3);
    assert.equal(
      await readFile(path.join(f.root, "src/value.ts"), "utf8"),
      "human dirty edit\n",
    );
    assert.equal(await git(f.root, ["show-ref"]), before);
    assert.equal(
      (await git(f.root, ["worktree", "list", "--porcelain"])).match(
        /worktree /g,
      ).length,
      1,
    );
  },
);

test(
  "patch isolado é validado, commitado localmente e não duplicado",
  isolated,
  async (t) => {
    const f = await fixture(t, { trackedEnv: true });
    const base = await git(f.root, ["rev-parse", "HEAD"]);
    process.env.MAINTENANCE_TEST_SECRET = "must-not-reach-child";
    t.after(() => delete process.env.MAINTENANCE_TEST_SECRET);
    const result = await main(f.args());
    assert.equal(
      result.report.status,
      "validated_patch",
      JSON.stringify(result.report),
    );
    assert.equal(result.exitCode, 0);
    assert.equal(await git(f.root, ["rev-parse", "HEAD"]), base);
    assert.match(
      await readFile(path.join(f.root, "src/value.ts"), "utf8"),
      /bad/,
    );
    assert.equal(
      result.report.steps.filter((s) => s.phase === "patched").length,
      4,
    );
    const patch = await readFile(result.report.patch, "utf8");
    assert.match(patch, /good/);
    assert.ok(!patch.includes("private-fixture-value"));
    assert.match(
      await git(f.root, ["show", `${result.report.commit}:src/value.ts`]),
      /good/,
    );
    assert.equal(
      await git(f.root, ["show", `${result.report.commit}:.env`]),
      "MAINTENANCE_TEST_SECRET=private-fixture-value",
    );
    assert.equal((await main(f.args())).report.status, "pending_patch");
    assert.equal(
      (await git(f.root, ["worktree", "list", "--porcelain"])).match(
        /worktree /g,
      ).length,
      1,
    );
  },
);

test(
  "gate após patch falha sem commit nem branch restante",
  isolated,
  async (t) => {
    const f = await fixture(t, { failure: "patched" });
    const before = await git(f.root, ["show-ref"]);
    const result = await main(f.args());
    assert.equal(result.report.status, "failed");
    assert.match(result.report.message, /patched/);
    assert.equal(await git(f.root, ["show-ref"]), before);
    assert.match(
      await readFile(path.join(f.root, "src/value.ts"), "utf8"),
      /bad/,
    );
  },
);

test(
  "formatter fora do escopo é descartado antes de commit",
  isolated,
  async (t) => {
    const f = await fixture(t, { formatterEscapes: true });
    const result = await main(f.args());
    assert.equal(result.report.status, "failed");
    assert.match(result.report.message, /fora do escopo/);
    assert.equal(
      JSON.parse(await readFile(path.join(f.root, "package.json"), "utf8"))
        .name,
      "fixture",
    );
  },
);

test("código de saída baseline timeout é bloqueante", isolated, async (t) => {
  const f = await fixture(t, { failure: "timeout" });
  const result = await main(f.args());
  assert.equal(result.report.status, "blocked_baseline");
  assert.equal(result.exitCode, 3);
  assert.ok(result.report.steps.some((s) => s.timeout));
});

test("sem alterações termina sem branch ou pending", isolated, async (t) => {
  const f = await fixture(t, { content: "good" });
  const result = await main(f.args());
  assert.equal(
    result.report.status,
    "no_changes",
    JSON.stringify(result.report),
  );
  assert.equal(result.exitCode, 0);
  assert.equal(
    (await git(f.root, ["branch", "--format=%(refname:short)"])).split("\n")
      .length,
    1,
  );
});

test(
  "índice alterado por gate bloqueia commit de arquivos indevidos",
  isolated,
  async (t) => {
    const f = await fixture(t, { failure: "staged" });
    const before = await git(f.root, ["show-ref"]);
    const result = await main(f.args());
    assert.equal(result.report.status, "failed");
    assert.match(result.report.message, /índice Git/);
    assert.equal(await git(f.root, ["show-ref"]), before);
  },
);

test("gate que modifica o patch é descartado", isolated, async (t) => {
  const f = await fixture(t, { failure: "mutating" });
  const before = await git(f.root, ["show-ref"]);
  const result = await main(f.args());
  assert.equal(result.report.status, "failed");
  assert.match(result.report.message, /alterou o patch/);
  assert.equal(await git(f.root, ["show-ref"]), before);
});

test(
  "patch integrado por squash é reconhecido e não bloqueia manutenção",
  isolated,
  async (t) => {
    const f = await fixture(t);
    const first = await main(f.args());
    assert.equal(first.report.status, "validated_patch");
    await git(f.root, ["cherry-pick", "--no-commit", first.report.commit]);
    await git(f.root, [
      "-c",
      "user.name=Fixture",
      "-c",
      "user.email=fixture@localhost",
      "commit",
      "-qm",
      "squash integration",
    ]);
    const second = await main(f.args());
    assert.equal(
      second.report.status,
      "no_changes",
      JSON.stringify(second.report),
    );
  },
);

test(
  "patch Git real com linha longa UTF8 é preservado na exportação e no commit",
  isolated,
  async (t) => {
    const text = "ç".repeat(90000),
      f = await fixture(t, { content: `bad${text}` });
    const result = await main(f.args());
    assert.equal(
      result.report.status,
      "validated_patch",
      JSON.stringify(result.report),
    );
    const patch = await readFile(result.report.patch, "utf8");
    assert.ok(!patch.includes("\ufffd"));
    assert.ok(patch.includes(text));
    assert.equal(
      await git(f.root, ["show", `${result.report.commit}:src/value.ts`]),
      `export const value = 'good${text}';`,
    );
  },
);
