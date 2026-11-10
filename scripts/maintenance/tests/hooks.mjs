import test from "node:test";
import assert from "node:assert/strict";
import {mkdir,writeFile,readFile} from "node:fs/promises";
import path from "node:path";
import {main} from "../run.mjs";
import {git,run,exists} from "../lib.mjs";
import {fixture,isolated,saveFixture} from "./fixture.mjs";

for (const name of ["pre-commit", "commit-msg"])
  test(
    `hook ${name} bloqueante impede commit validado`,
    isolated,
    async (t) => {
      const f = await fixture(t);
      await mkdir(path.join(f.root, ".husky"));
      await writeFile(
        path.join(f.root, ".husky", name),
        "#!/bin/sh\nexit 19\n",
      );
      await saveFixture(f);
      const refs = await git(f.root, ["show-ref"]);
      const result = await main(f.args());
      assert.equal(result.report.status, "failed");
      assert.match(result.report.message, /Hook\/commit obrigatório/);
      assert.equal(await git(f.root, ["show-ref"]), refs);
      assert.equal(await exists(path.join(f.root, ".husky/_")), false);
    },
  );

test(
  "hooks versionados rodam offline sem .env/segredo e commit inclui escopo obrigatório",
  isolated,
  async (t) => {
    const f = await fixture(t, { trackedEnv: true });
    await mkdir(path.join(f.root, ".husky"));
    await writeFile(
      path.join(f.root, ".husky/pre-commit"),
      `#!/bin/sh\ntest "$HUSKY" != 0\ntest ! -e .env\ntest -z "\${MAINTENANCE_TEST_SECRET:-}"\nnode -e "fetch('http://192.0.2.1:9').then(()=>process.exit(7),()=>process.exit(0))"\necho hook-offline-validado\n`,
    );
    await writeFile(
      path.join(f.root, ".husky/commit-msg"),
      `#!/bin/sh\ngrep -q '^style(manutencao): aplica correcoes locais verificadas$' "$1"\necho escopo-validado\n`,
    );
    await saveFixture(f);
    await git(f.root, ["config", "core.hooksPath", ".husky/_"]);
    process.env.MAINTENANCE_TEST_SECRET = "must-not-reach-hook";
    t.after(() => delete process.env.MAINTENANCE_TEST_SECRET);
    const result = await main(f.args());
    assert.equal(
      result.report.status,
      "validated_patch",
      JSON.stringify(result.report),
    );
    const hookLog = await readFile(
      path.join(
        path.dirname(result.report.reportFile),
        result.report.hooks.log,
      ),
      "utf8",
    );
    assert.deepEqual(result.report.hooks.names, ["pre-commit", "commit-msg"]);
    assert.match(hookLog, /hook-offline-validado/);
    assert.match(hookLog, /escopo-validado/);
    assert.equal(
      (
        await run(["git", "config", "--get", "core.hooksPath"], f.root)
      ).stdout.trim(),
      ".husky/_",
    );
    assert.equal(
      await git(f.root, ["log", "-1", "--format=%s", result.report.commit]),
      "style(manutencao): aplica correcoes locais verificadas",
    );
  },
);

test(
  "hook que altera e adiciona o patch é rejeitado depois do commit isolado",
  isolated,
  async (t) => {
    const f = await fixture(t);
    await mkdir(path.join(f.root, ".husky"));
    await writeFile(
      path.join(f.root, ".husky/pre-commit"),
      `#!/bin/sh\necho 'changed by hook' > src/value.ts\ngit add src/value.ts\n`,
    );
    await saveFixture(f);
    const refs = await git(f.root, ["show-ref"]),
      result = await main(f.args());
    assert.equal(result.report.status, "failed");
    assert.match(result.report.message, /Hook alterou o patch commitado/);
    assert.equal(await git(f.root, ["show-ref"]), refs);
  },
);

test(
  "hook que remove o escopo da mensagem não produz commit validado",
  isolated,
  async (t) => {
    const f = await fixture(t);
    await mkdir(path.join(f.root, ".husky"));
    await writeFile(
      path.join(f.root, ".husky/commit-msg"),
      `#!/bin/sh\nprintf 'style: mensagem sem escopo\\n' > "$1"\n`,
    );
    await saveFixture(f);
    const refs = await git(f.root, ["show-ref"]),
      result = await main(f.args());
    assert.equal(result.report.status, "failed");
    assert.match(result.report.message, /mensagem obrigatória/);
    assert.equal(await git(f.root, ["show-ref"]), refs);
  },
);

test(
  "hook customizado instalado fora dos arquivos versionados não é ignorado",
  isolated,
  async (t) => {
    const f = await fixture(t);
    await mkdir(path.join(f.root, ".hooks"));
    await writeFile(
      path.join(f.root, ".gitignore"),
      "node_modules/\ndist/\n.hooks/\n",
    );
    await saveFixture(f);
    await writeFile(
      path.join(f.root, ".hooks/pre-commit"),
      "#!/bin/sh\nexit 24\n",
      { mode: 0o700 },
    );
    await git(f.root, ["config", "core.hooksPath", ".hooks"]);
    const result = await main(f.args());
    assert.equal(result.report.status, "failed");
    assert.match(result.report.message, /Hook\/commit obrigatório/);
    assert.deepEqual(result.report.hooks.names, ["pre-commit"]);
  },
);

test(
  "post-commit que altera a worktree também invalida o resultado",
  isolated,
  async (t) => {
    const f = await fixture(t);
    await mkdir(path.join(f.root, ".husky"));
    await writeFile(
      path.join(f.root, ".husky/post-commit"),
      "#!/bin/sh\necho hook-modified > src/value.ts\n",
    );
    await saveFixture(f);
    const result = await main(f.args());
    assert.equal(result.report.status, "failed");
    assert.match(result.report.message, /Hook alterou a worktree/);
  },
);
