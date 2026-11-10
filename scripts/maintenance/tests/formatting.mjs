import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { main } from "../run.mjs";
import { git } from "../lib.mjs";
import {
  fixture,
  isolated,
  formatter,
  saveFixture,
  saveConfig,
  genericFormatter,
  fakeEslint,
} from "./fixture.mjs";

for (const [name, body] of [
  ["crash de inicialização", `throw new Error('formatter fixture failed');`],
  ["exit 1 vazio", "process.exit(1);"],
  [
    "lista misturada com diagnóstico",
    `console.log('src/value.ts');console.log('Error: invalid formatter');process.exit(1);`,
  ],
  [
    "diagnóstico em stderr",
    `console.log('src/value.ts');console.error('Error: invalid formatter');process.exit(1);`,
  ],
  ["exit 0 com lista contraditória", `console.log('src/value.ts');`],
])
  test(`scan Prettier rejeita ${name}`, isolated, async (t) => {
    const f = await fixture(t);
    await formatter(f, body);
    const result = await main(f.args());
    assert.equal(result.report.status, "failed", JSON.stringify(result.report));
    assert.match(result.report.message, /lista válida|Gate.*scan/);
    assert.equal(
      await git(f.root, ["branch", "--format=%(refname:short)"]),
      "main",
    );
  });

test(
  "generated e types.ts ficam fora de candidatos e alterações laterais são rejeitadas",
  isolated,
  async (t) => {
    const f = await fixture(t);
    await formatter(f, genericFormatter);
    await mkdir(path.join(f.root, "src/integrations/supabase"), {
      recursive: true,
    });
    await writeFile(
      path.join(f.root, "src/integrations/supabase/types.ts"),
      "export const generated = 'bad';\n",
    );
    await writeFile(
      path.join(f.root, "src/auto.ts"),
      "// @generated DO NOT EDIT\nexport const generated = 'bad';\n",
    );
    await writeFile(
      path.join(f.root, "src/component.generated.ts"),
      "export const generated = 'bad';\n",
    );
    await writeFile(
      path.join(f.root, "src/excluded.ts"),
      "export const excluded = 'bad';\n",
    );
    f.config.fix.exclude = ["src/excluded.ts"];
    await saveConfig(f);
    await saveFixture(f);
    const result = await main(f.args());
    assert.equal(
      result.report.status,
      "validated_patch",
      JSON.stringify(result.report),
    );
    assert.deepEqual(result.report.scope.selected, ["src/value.ts"]);
    for (const file of [
      "src/auto.ts",
      "src/component.generated.ts",
      "src/excluded.ts",
      "src/integrations/supabase/types.ts",
    ])
      assert.match(
        await git(f.root, ["show", `${result.report.commit}:${file}`]),
        /bad/,
      );
    const second = await fixture(t);
    await mkdir(path.join(second.root, "src/integrations/supabase"), {
      recursive: true,
    });
    await writeFile(
      path.join(second.root, "src/integrations/supabase/types.ts"),
      "// generated\nexport const x = 'bad';\n",
    );
    await saveFixture(second);
    await formatter(
      second,
      genericFormatter +
        "fs.writeFileSync('src/integrations/supabase/types.ts','changed');",
    );
    const rejected = await main(second.args());
    assert.equal(rejected.report.status, "failed");
    assert.match(rejected.report.message, /gerado ou excluído/);
  },
);

test(
  "formatter não pode mudar permissões ou remover arquivos rastreados",
  isolated,
  async (t) => {
    const f = await fixture(t);
    await formatter(f, genericFormatter + "fs.chmodSync(file,0o755);");
    const result = await main(f.args());
    assert.equal(result.report.status, "failed");
    assert.match(result.report.message, /modo\/tipo/);
  },
);

test(
  "ESLint não aceita diretivas inline para regras fora da allowlist",
  isolated,
  async (t) => {
    const f = await fixture(t);
    await fakeEslint(f);
    await writeFile(
      path.join(f.root, "src/value.ts"),
      "/* eslint no-unused-vars: error */\nexport const value = 'bad';\n",
    );
    await saveFixture(f);
    const result = await main(f.args());
    assert.equal(
      result.report.status,
      "validated_patch",
      JSON.stringify(result.report),
    );
    assert.match(
      await git(f.root, ["show", `${result.report.commit}:src/value.ts`]),
      /eslint no-unused-vars.*\nexport const value = 'good'/,
    );
  },
);

test(
  "scans ESLint em lotes cabem em 4MB e orçamento de 20 arquivos continua global",
  isolated,
  async (t) => {
    const f = await fixture(t);
    await fakeEslint(f);
    for (let i = 0; i < 39; i++)
      await writeFile(
        path.join(f.root, `src/batch-${String(i).padStart(2, "0")}.ts`),
        `// ${"x".repeat(150000)}\nexport const value = 'bad';\n`,
      );
    await saveFixture(f);
    const result = await main(f.args());
    assert.equal(
      result.report.status,
      "validated_patch",
      JSON.stringify(result.report),
    );
    assert.equal(result.report.scope.candidates, 40);
    assert.equal(result.report.scope.selected.length, 20);
    assert.equal(result.report.scope.skippedBudget.length, 20);
    assert.equal(
      result.report.steps.filter((step) => step.phase === "scan").length,
      3,
    );
    assert.ok(result.report.change.lines <= 400);
  },
);
