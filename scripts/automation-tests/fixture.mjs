import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {chmodSync,cpSync,readdirSync,mkdirSync,mkdtempSync,readFileSync,rmSync,writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname,join} from "node:path";
import {fileURLToPath} from "node:url";

export const kit = dirname(dirname(fileURLToPath(import.meta.url)));

export const text = (p) => readFileSync(p, "utf8");

export function fixture(
  t,
  {
    originalHook = "",
    hookName = "pre-commit",
    previous = ".original-hooks",
  } = {},
) {
  const root = mkdtempSync(join(tmpdir(), "repo-automation-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const write = (p, contents) => {
    mkdirSync(dirname(join(root, p)), { recursive: true });
    writeFileSync(join(root, p), contents);
  };
  const run = (cmd, args, extra = {}) =>
    spawnSync(cmd, args, {
      cwd: root,
      encoding: "utf8",
      timeout: 15000,
      env: { ...process.env, HUSKY: "0" },
      ...extra,
    });
  const git = (...args) => {
    const r = run("git", args);
    assert.equal(r.status, 0, r.stderr);
    return r.stdout.trim();
  };
  git("init", "-b", "main");
  git("config", "user.name", "Fixture automation");
  git("config", "user.email", "automation@example.invalid");
  git("config", "core.hooksPath", "/dev/null");
  write(".gitignore", ".tools/graph-state/\nfixture-*.log\n");
  write("src/source.txt", "base\n");
  write(
    "scripts/smoke.unit.mjs",
    "import test from 'node:test'; import assert from 'node:assert/strict'; test('fixture',()=>assert.equal(2+2,4));\n",
  );
  write(
    "scripts/motor.sh",
    '#!/bin/sh\nprintf \'%s\\n\' "$@" > fixture-motor.log\nexit "${FIXTURE_MOTOR_EXIT:-0}"\n',
  );
  write(
    "scripts/graph.mjs",
    `import fs from 'node:fs';
fs.writeFileSync('fixture-graph.log',JSON.stringify(process.argv.slice(2)));
if(process.argv[2]==='mark'){fs.mkdirSync('.tools/graph-state',{recursive:true});fs.writeFileSync('.tools/graph-state/dirty.json','{}');}
process.exit(Number(process.env.FIXTURE_GRAPH_EXIT||0));\n`,
  );
  write("scripts/automation.mjs", text(join(kit, "automation.mjs")));
  cpSync(join(kit, "automation"), join(root, "scripts/automation"), { recursive: true });
  write("graphify.local.json", "{}\n");
  const config = {
    version: 1,
    name: "fixture",
    entrypoint: "scripts/automation.mjs",
    testSuites: ["scripts/smoke.unit.mjs"],
    motor: ["sh", "scripts/motor.sh"],
    graph: ["node", "scripts/graph.mjs"],
    graphConfig: "graphify.local.json",
    aliases: {
      "automation:test": "node scripts/automation.mjs test",
      "automation:doctor": "node scripts/automation.mjs doctor --static",
    },
    registrations: [
      {
        id: "core",
        kind: "tool",
        files: ["scripts/automation.mjs"],
        manual: ["node", "scripts/automation.mjs", "doctor"],
        triggers: ["manual", "prepush"],
      },
      {
        id: "units",
        kind: "test",
        files: ["scripts/smoke.unit.mjs"],
        manual: ["node", "scripts/automation.mjs", "test"],
        triggers: ["manual", "precommit", "prepush", "PR", "pushmain"],
      },
      {
        id: "motor",
        kind: "motor",
        files: ["scripts/motor.sh"],
        manual: ["node", "scripts/automation.mjs", "heal", "--ref", "HEAD"],
        triggers: ["manual", "nightly"],
      },
      {
        id: "graph",
        kind: "graph",
        files: ["scripts/graph.mjs"],
        manual: ["node", "scripts/automation.mjs", "graph", "status"],
        triggers: [
          "manual",
          "postcommit",
          "postmerge",
          "postcheckout",
          "nightly",
        ],
      },
    ],
    ci: [
      {
        file: ".github/workflows/ci.yml",
        events: ["PR", "pushmain"],
        command: "node scripts/automation.mjs test",
      },
    ],
    nightly: {
      command: [
        "node",
        "scripts/automation.mjs",
        "nightly",
        "--ref",
        "origin/main",
      ],
    },
    timeoutMs: 5000,
  };
  const moduleFiles = readdirSync(join(kit, "automation")).filter(name => name.endsWith(".mjs")).map(name => "scripts/automation/" + name);
  for (const file of moduleFiles) config.registrations.push({ id: "helper-" + file.split("/").at(-1), kind: "helper", files: [file], callers: ["scripts/automation.mjs", ...moduleFiles].filter(caller => caller !== file && text(join(root, caller)).includes(file.split("/").at(-1))), triggers: ["manual", "precommit", "PR", "pushmain"] });
  const save = () =>
    write("scripts/automation.config.json", JSON.stringify(config, null, 2));
  save();
  write(
    "package.json",
    JSON.stringify({ type: "module", scripts: config.aliases }),
  );
  write(
    ".github/workflows/ci.yml",
    "name: fixture\non:\n  pull_request: {}\n  push:\n    branches: [main]\njobs:\n  tools:\n    runs-on: ubuntu-latest\n    steps:\n      - run: node scripts/automation.mjs test\n",
  );
  git("add", ".");
  git("commit", "-m", "base");
  git("config", "core.hooksPath", previous);
  if (originalHook) {
    write(previous + "/" + hookName, "#!/bin/sh\n" + originalHook);
    chmodSync(join(root, previous, hookName), 0o700);
  }
  const cli = (...args) =>
    run(process.execPath, ["scripts/automation.mjs", "--root", root, ...args]);
  const install = () => {
    const r = cli("install-hooks");
    assert.equal(r.status, 0, r.stderr + r.stdout);
    return r;
  };
  return { root, config, write, run, git, save, cli, install };
}
