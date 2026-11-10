import test from "node:test";
import assert from "node:assert/strict";
import { writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { main, parseArgs } from "../run.mjs";
import { validateConfig, inspect } from "../lib.mjs";
import { fixture, isolated, saveFixture, saveConfig } from "./fixture.mjs";

test("CLI e config desconhecidas falham fechadas", () => {
  assert.throws(() => parseArgs(["heal", "--root", "/tmp/x"]), /--ref/);
  assert.throws(
    () => parseArgs(["doctor", "--root", "/tmp/x", "--apply", "yes"]),
    /Argumento/,
  );
  assert.throws(
    () => validateConfig({ version: 1, surprise: true }),
    /Configuração/,
  );
});

test("tsconfig vazio impede doctor saudável", async (t) => {
  const f = await fixture(t, { emptyTypes: true });
  const result = await main(f.args("doctor"));
  assert.equal(result.exitCode, 1);
  assert.equal(result.report.status, "failed");
  assert.match(result.report.message, /Projeto TypeScript vazio ou inválido/);
});

test(
  "TypeScript 7 sem API usa CLI isolada e valida o patch",
  isolated,
  async (t) => {
    const f = await fixture(t, { nativeTypes: true });
    const result = await main(f.args());
    assert.equal(
      result.report.status,
      "validated_patch",
      JSON.stringify(result.report),
    );
    assert.equal(result.report.doctor.coverage[0].method, "cli");
    assert.equal(result.report.doctor.coverage[0].sourceFiles, 1);
  },
);

test(
  "TypeScript 7 com CLI sem arquivos bloqueia doctor",
  isolated,
  async (t) => {
    const f = await fixture(t, { nativeTypes: true, emptyTypes: true });
    const result = await main(f.args("doctor"));
    assert.equal(result.report.status, "failed");
    assert.match(result.report.message, /vazio ou inválido/);
  },
);

test(
  "check/heal validam tsconfig da ref e doctor continua validando checkout sujo",
  isolated,
  async (t) => {
    const f = await fixture(t);
    await writeFile(path.join(f.root, "tsconfig.app.json"), '{"files":[]}');
    assert.equal((await main(f.args("check"))).report.status, "checked");
    assert.equal((await main(f.args())).report.status, "validated_patch");
    assert.equal((await main(f.args("doctor"))).report.status, "failed");
    assert.equal(
      await readFile(path.join(f.root, "tsconfig.app.json"), "utf8"),
      '{"files":[]}',
    );
  },
);

test(
  "NODE_ENV é escolhido por gate e variáveis privadas não chegam aos filhos",
  isolated,
  async (t) => {
    const f = await fixture(t);
    await writeFile(
      path.join(f.root, "scripts/gate.mjs"),
      `const phase=process.argv[2];const expected=phase==='test'?'test':phase==='build'?'production':undefined;if(process.env.NODE_ENV!==expected||process.env.SECRET_KEY||process.env.VITE_SUPABASE_URL)process.exit(11);`,
    );
    await saveFixture(f);
    process.env.NODE_ENV = "development";
    process.env.SECRET_KEY = "private-placeholder";
    process.env.VITE_SUPABASE_URL = "https://production.invalid";
    t.after(() => {
      delete process.env.NODE_ENV;
      delete process.env.SECRET_KEY;
      delete process.env.VITE_SUPABASE_URL;
    });
    assert.equal((await main(f.args("check"))).report.status, "checked");
  },
);

test(
  "ambiente público explícito aceita placeholders e rejeita secret/host de produção",
  isolated,
  async (t) => {
    const f = await fixture(t);
    f.config.gates.find((gate) => gate.name === "build").env = {
      VITE_SUPABASE_URL: "https://maintenance.invalid",
      VITE_SUPABASE_PROJECT_ID: "maintenance_test",
      VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_maintenance_test",
    };
    await saveConfig(f);
    await writeFile(
      path.join(f.root, "scripts/gate.mjs"),
      `if(process.argv[2]==='build'&&(process.env.NODE_ENV!=='production'||process.env.VITE_SUPABASE_URL!=='https://maintenance.invalid'||process.env.VITE_SUPABASE_PROJECT_ID!=='maintenance_test'||process.env.VITE_SUPABASE_PUBLISHABLE_KEY!=='sb_publishable_maintenance_test'))process.exit(12);`,
    );
    await saveFixture(f);
    assert.equal((await main(f.args("check"))).report.status, "checked");
    for (const env of [
      { SECRET_KEY: "fixture" },
      { NODE_ENV: "test" },
      { VITE_SUPABASE_URL: "https://production.supabase.co" },
      { VITE_SUPABASE_PROJECT_ID: "abcdefghijklmnopqrst" },
      { VITE_SUPABASE_ANON_KEY: "eyJ.production.token" },
    ]) {
      const copy = structuredClone(f.config);
      copy.gates[3].env = env;
      assert.throws(() => validateConfig(copy));
    }
    const alternate = structuredClone(f.config);
    alternate.gates[3].env.VITE_SUPABASE_PROJECT_ID = "test_fixture";
    assert.doesNotThrow(() => validateConfig(alternate));
    const invalidExclude = structuredClone(f.config);
    invalidExclude.fix.exclude = ["src/**/*.ts"];
    assert.throws(() => validateConfig(invalidExclude), /sem globs/);
  },
);

test("API TypeScript rejeita cada projeto vazio mesmo com outro projeto válido", async (t) => {
  const f = await fixture(t);
  await writeFile(
    path.join(f.root, "tsconfig.json"),
    JSON.stringify({
      files: [],
      references: [{ path: "./tsconfig.app.json" }],
    }),
  );
  await assert.rejects(
    inspect(f.root, {
      ...f.config,
      tsconfigs: ["tsconfig.app.json", "tsconfig.json"],
    }),
    /Projeto TypeScript vazio ou inválido: tsconfig.json/,
  );
});
