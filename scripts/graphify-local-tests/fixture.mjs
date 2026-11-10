import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { main } from "../graphify-local.mjs";

export function git(root, ...args) {
  const result = spawnSync(
    "git",
    ["-c", "core.hooksPath=/dev/null", "-C", root, ...args],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

export async function fixture(t) {
  const dir = await mkdtemp(path.join(tmpdir(), "graphify-adapter-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const root = path.join(dir, "repo"),
    env = path.join(root, ".tools/graphify/.venv");
  await mkdir(path.join(root, "src"), { recursive: true });
  await mkdir(path.join(env, "bin"), { recursive: true });
  await writeFile(
    path.join(root, ".gitignore"),
    ".tools/\ngraphify-out/\nnode_modules/\n",
  );
  await writeFile(
    path.join(root, "package.json"),
    '{"name":"fixture","type":"commonjs"}',
  );
  await writeFile(
    path.join(root, "src/value.ts"),
    'export const value = "v1";\n',
  );
  const python = `#!${process.execPath}\nconst path=require('node:path');const prefix=path.resolve(__dirname,'..');console.log(JSON.stringify({version:'0.9.97',prefix,module:path.join(prefix,'lib/graphify/__init__.py')}));\n`;
  await writeFile(path.join(env, "bin/python"), python, { mode: 0o700 });
  const graphify = `#!${process.execPath}\nconst fs=require('node:fs'),path=require('node:path');const a=process.argv.slice(2);const base=path.resolve(__dirname,'..');
if(a[0]==='--version'){console.log('graphify 0.9.97');process.exit(0);}
if(a[0]==='extract'){
 if(process.env.GRAPHIFY_FIXTURE_SECRET||fs.existsSync(path.join(a[1],'.env'))||fs.existsSync(path.join(a[1],'credentials.json'))||fs.existsSync(path.join(a[1],'node_modules')))process.exit(99);
 const source=fs.readFileSync(path.join(a[1],'src/value.ts'),'utf8');
 if(source.includes('TIMEOUT'))setInterval(()=>{},1000);else{
 const out=path.join(a[a.indexOf('--out')+1],'graphify-out');fs.mkdirSync(out,{recursive:true});
 const graph=source.includes('INVALID')?{nodes:[],links:[]}:{nodes:[{id:'value',label:source,source_file:'src/value.ts'}],links:[]};
 fs.writeFileSync(path.join(out,'graph.json'),JSON.stringify(graph));
 fs.appendFileSync(path.join(base,'calls'),'extract\\n');
 if(source.includes('MUTATE'))fs.appendFileSync(path.resolve(base,'../../..','src/value.ts'),'// concurrent change\\n');
 }}else if(a[0]==='cluster-only'){}else{const file=a[a.indexOf('--graph')+1];console.log(a[0]+':'+JSON.parse(fs.readFileSync(file,'utf8')).nodes[0].label);}
`;
  await writeFile(path.join(env, "bin/graphify"), graphify, { mode: 0o700 });
  const config = {
    version: 1,
    project: "fixture",
    environment: ".tools/graphify/.venv",
    pin: "0.9.97",
    pythonVersion: "3.11",
    state: ".tools/graphify/state",
    output: "graphify-out",
    adapter: "generic",
    scope: ["."],
    partial: false,
    timeoutMs: 3000,
    minAvailableMb: 1,
    metadata: [".gitignore", "package.json"],
  };
  const configFile = path.join(dir, "config.json");
  await writeFile(configFile, JSON.stringify(config));
  git(root, "init", "-b", "main");
  git(root, "config", "user.name", "Fixture");
  git(root, "config", "user.email", "fixture@example.invalid");
  git(root, "add", ".");
  git(root, "commit", "-m", "base");
  const options = {
    globalLock: path.join(dir, "fleet.lock"),
    fixtureOfflinePrefix: [],
    resourceProbe: async () => ({ availableMb: 32768, load: 0, parallelism: 2 }),
  };
  const args = (action, ...terms) => [
    action,
    ...terms,
    "--config",
    configFile,
    "--root",
    root,
  ];
  const call = (action, ...terms) => main(args(action, ...terms), options);
  const graph = path.join(root, "graphify-out/graph.json");
  return { dir, root, env, config, configFile, options, args, call, graph };
}
