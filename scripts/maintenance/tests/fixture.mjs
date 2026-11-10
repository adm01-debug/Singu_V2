import {mkdtemp,mkdir,writeFile,rm,symlink} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {networkPrefix} from "../run.mjs";
import {git} from "../lib.mjs";

export async function fixture(
  t,
  {
    content = "bad",
    failure = "",
    emptyTypes = false,
    trackedEnv = false,
    formatterEscapes = false,
    nativeTypes = false,
  } = {},
) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "maintenance-test-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const root = path.join(dir, "repo"),
    state = path.join(dir, "state");
  await mkdir(root);
  await mkdir(path.join(root, "src"));
  await mkdir(path.join(root, "scripts"));
  await git(root, ["init", "-q", "-b", "main"]);
  await writeFile(
    path.join(root, "package.json"),
    JSON.stringify({ name: "fixture", type: "module", private: true }),
  );
  await writeFile(path.join(root, "package-lock.json"), "{}");
  await writeFile(path.join(root, ".gitignore"), "node_modules/\ndist/\n");
  await writeFile(
    path.join(root, "src/value.ts"),
    `export const value = '${content}';\n`,
  );
  await writeFile(
    path.join(root, "tsconfig.app.json"),
    JSON.stringify({ files: emptyTypes ? [] : ["src/value.ts"] }),
  );
  if (trackedEnv)
    await writeFile(
      path.join(root, ".env"),
      "MAINTENANCE_TEST_SECRET=private-fixture-value\n",
    );
  const gates = `import fs from 'node:fs';import {spawnSync} from 'node:child_process';\nconst text=fs.readFileSync('src/value.ts','utf8'); const phase=process.argv[2];\nif(fs.existsSync('.env') || process.env.MAINTENANCE_TEST_SECRET) {console.error('secret environment was present');process.exit(40);}\nif(${JSON.stringify(failure)}==='baseline' && phase==='lint') {console.error('Error: baseline fixture');process.exit(21);}\nif(${JSON.stringify(failure)}==='patched' && phase==='test' && text.includes('good')) {console.error('Error: patched fixture');process.exit(22);}\nif(${JSON.stringify(failure)}==='staged' && phase==='lint'){fs.appendFileSync('package.json','\\n');spawnSync('git',['add','package.json']);}\nif(${JSON.stringify(failure)}==='mutating' && phase==='test' && text.includes('good'))fs.writeFileSync('src/value.ts',text.replace('good','different'));\nif(${JSON.stringify(failure)}==='timeout' && phase==='test') await new Promise(r=>setTimeout(r,30000));\n`;
  await writeFile(path.join(root, "scripts/gate.mjs"), gates);
  const tsDir = path.join(root, "node_modules/typescript");
  await mkdir(tsDir, { recursive: true });
  await writeFile(
    path.join(tsDir, "package.json"),
    JSON.stringify({ name: "typescript", main: "index.cjs" }),
  );
  await mkdir(path.join(tsDir, "bin"));
  await writeFile(
    path.join(tsDir, "bin/tsc"),
    nativeTypes
      ? `const fs=require('fs'),path=require('path');if(process.argv.includes('--listFilesOnly')){const cfg=process.argv[process.argv.indexOf('--project')+1];console.log(JSON.parse(fs.readFileSync(cfg,'utf8')).files.map(f=>path.resolve(f)).join('\\n'));}`
      : "process.exit(0);",
  );
  await writeFile(
    path.join(tsDir, "index.cjs"),
    nativeTypes
      ? 'module.exports={version:"7.0.2",versionMajorMinor:"7.0"};'
      : `const fs=require('fs'),path=require('path');module.exports={sys:{readFile:f=>fs.readFileSync(f,'utf8')},readConfigFile:(f,read)=>({config:JSON.parse(read(f))}),parseJsonConfigFileContent:(c,sys,base)=>({errors:[],fileNames:(c.files||[]).map(f=>path.resolve(base,f))})};`,
  );
  for (const name of ["eslint", "prettier"]) {
    const d = path.join(root, "node_modules", name);
    await mkdir(d, { recursive: true });
    await writeFile(
      path.join(d, "package.json"),
      JSON.stringify({ name, type: "module", bin: { [name]: "bin.mjs" } }),
    );
    await writeFile(
      path.join(d, "bin.mjs"),
      name === "prettier"
        ? `import fs from 'node:fs';const f='src/value.ts';if(process.argv.includes('--list-different')){if(fs.readFileSync(f,'utf8').includes('bad')){console.log(f);process.exit(1);}process.exit(0);}fs.writeFileSync(f,fs.readFileSync(f,'utf8').replace('bad','good'));${formatterEscapes ? "fs.writeFileSync('package.json','{}');" : ""}`
        : "",
    );
  }
  const config = {
    version: 1,
    manager: "npm",
    tsconfigs: ["tsconfig.app.json"],
    gates: ["lint", "types", "test", "build"].map((name) => ({
      name,
      command:
        name === "types"
          ? [
              "node",
              new URL("../typecheck.mjs", import.meta.url).pathname,
              "tsconfig.app.json",
            ]
          : ["node", "scripts/gate.mjs", name],
    })),
    fix: { roots: ["src"], prettier: true, eslintRules: [] },
    timeoutMs: failure === "timeout" ? 300 : 5000,
    maxFiles: 20,
    maxChangedLines: 400,
  };
  const configFile = path.join(dir, "config.json");
  await writeFile(configFile, JSON.stringify(config));
  await git(root, ["add", "."]);
  await git(root, [
    "-c",
    "user.name=Fixture",
    "-c",
    "user.email=fixture@localhost",
    "commit",
    "-qm",
    "base",
  ]);
  const args = (action = "heal") => [
    action,
    "--root",
    root,
    "--ref",
    "main",
    "--config",
    configFile,
    "--state",
    state,
  ];
  return { root, state, configFile, args, config, dir };
}

export const sandboxAvailable = await networkPrefix(process.cwd()).then(
  () => true,
  () => false,
);

export const isolated = { skip: !sandboxAvailable };

export async function saveFixture(f) {
  await git(f.root, ["add", "."]);
  await git(f.root, [
    "-c",
    "user.name=Fixture",
    "-c",
    "user.email=fixture@localhost",
    "commit",
    "-qm",
    "fixture alterada",
  ]);
}

export async function saveConfig(f) {
  await writeFile(f.configFile, JSON.stringify(f.config));
}

export async function formatter(f, body) {
  await writeFile(path.join(f.root, "node_modules/prettier/bin.mjs"), body);
}

export async function vendorFixture(t) {
  const f = await fixture(t),
    vendor = path.join(f.root, "vendor/local-dep");
  await mkdir(vendor, { recursive: true });
  await writeFile(
    path.join(vendor, "package.json"),
    JSON.stringify({ name: "local-dep", version: "1.0.0", main: "index.cjs" }),
  );
  await writeFile(path.join(vendor, "index.cjs"), "module.exports = 'base';\n");
  await writeFile(
    path.join(f.root, "package.json"),
    JSON.stringify({
      name: "fixture",
      type: "module",
      dependencies: { "local-dep": "file:vendor/local-dep" },
    }),
  );
  await writeFile(
    path.join(f.root, "package-lock.json"),
    JSON.stringify({
      packages: {
        "node_modules/local-dep": { resolved: "vendor/local-dep", link: true },
      },
    }),
  );
  await symlink(
    "../vendor/local-dep",
    path.join(f.root, "node_modules/local-dep"),
    "dir",
  );
  await saveFixture(f);
  return { ...f, vendor };
}

export const genericFormatter = `import fs from 'node:fs';const args=process.argv.slice(2),files=args.slice(args.indexOf('--')+1);if(args.includes('--list-different')){const bad=files.filter(f=>fs.readFileSync(f,'utf8').includes('bad'));if(bad.length)console.log(bad.join('\\n'));process.exit(bad.length?1:0);}const file=args.at(-1);fs.writeFileSync(file,fs.readFileSync(file,'utf8').replaceAll('bad','good'));`;

export async function fakeEslint(f) {
  const parser = path.join(f.root, "node_modules/typescript-eslint");
  await mkdir(parser);
  await writeFile(
    path.join(parser, "package.json"),
    '{"name":"typescript-eslint","main":"index.cjs"}',
  );
  await writeFile(
    path.join(parser, "index.cjs"),
    "module.exports={parser:{}};",
  );
  const bin = path.join(f.root, "node_modules/eslint/bin");
  await mkdir(bin);
  await writeFile(
    path.join(bin, "eslint.js"),
    `import fs from 'node:fs';import path from 'node:path';const args=process.argv.slice(2);if(!args.includes('--no-inline-config'))process.exit(23);let files=args.includes('--')?args.slice(args.indexOf('--')+1):args.includes('--fix')?[args.at(-1)]:fs.readdirSync('src').filter(f=>f.endsWith('.ts')).map(f=>'src/'+f);if(args.includes('--fix-dry-run')){console.log(JSON.stringify(files.map(f=>{const text=fs.readFileSync(f,'utf8');return {filePath:path.resolve(f),messages:[],fatalErrorCount:0,...(text.includes('bad')?{output:text.replaceAll('bad','good')}:{})};})));}else{for(const f of files)fs.writeFileSync(f,fs.readFileSync(f,'utf8').replaceAll('bad','good'));}`,
  );
  f.config.fix.prettier = false;
  f.config.fix.eslintRules = ["semi"];
  await saveConfig(f);
}
