import { randomUUID } from "node:crypto";
import {
  writeFile,
  mkdir,
  lstat,
  rename,
  rm,
  copyFile,
  chmod,
  readdir,
} from "node:fs/promises";
import path from "node:path";
import {
  fileHash,
  digest,
  redact,
  fail,
  exists,
  json,
  atomic,
} from "./common.mjs";
import { run, offline, resources } from "./process.mjs";
import { confined } from "./config.mjs";
import { fingerprint, prepareFinanceSource } from "./source.mjs";
import { validateGraph } from "./artifacts.mjs";

export async function generate(ctx, fp, expectedGraph) {
  await resources(ctx);
  const prefix = await offline(ctx);
  const job = path.join(ctx.state, "runs", `${Date.now()}-${randomUUID()}`);
  await mkdir(job, { recursive: true, mode: 0o700 });
  let step = 0;
  const execute = async (argv, env = ctx.env) => {
    if (ctx.interrupted()) fail("Execução interrompida");
    const result = await run(
      [...prefix, ...argv],
      ctx.root,
      env,
      ctx.config.timeoutMs,
    );
    const log = path.join(job, `${step++}.log`);
    await writeFile(log, redact(result.output), { mode: 0o600 });
    if (
      result.code !== 0 ||
      result.timedOut ||
      result.overflow ||
      result.canceled
    )
      fail(`Extração/validação falhou; log privado ${log}`);
    return result.output;
  };
  try {
    let candidate, wrapperEvidence;
    if (ctx.config.adapter === "finance") {
      const wrapperConfig = await json(
        path.join(ctx.root, "scripts/graphify/config.json"),
      );
      if (
        wrapperConfig.version !== ctx.config.pin ||
        digest(wrapperConfig.profiles?.pilot?.files) !==
          digest(ctx.config.scope)
      )
        fail("Perfil Finance diverge do wrapper pilot versionado");
      const shims = path.join(job, "bin");
      await mkdir(shims, { mode: 0o700 });
      const shim = path.join(shims, "graphify");
      await writeFile(
        path.join(shims, "package.json"),
        JSON.stringify({ type: "module" }),
        { mode: 0o600 },
      );
      await writeFile(
        shim,
        `#!${process.execPath}\nimport {spawnSync} from 'node:child_process';const a=process.argv.slice(2);for(let i=0;i<a.length;i++)if(a[i]==='--max-workers'&&a[i+1])a[i+1]='1';const r=spawnSync(${JSON.stringify(ctx.binary)},a,{stdio:'inherit',env:process.env});process.exit(r.status??1);\n`,
        { mode: 0o700 },
      );
      const financeRoot = await prepareFinanceSource(ctx, fp, job, execute);
      const wrapperOutput = path.join(financeRoot, "graphify-out/pilot");
      await execute(
        [
          ctx.python,
          path.join(financeRoot, "scripts/graphify/run.py"),
          "pilot",
          "--profile",
          "pilot",
        ],
        { ...ctx.env, PATH: `${shims}:${ctx.env.PATH}` },
      );
      const runs = (await readdir(wrapperOutput)).filter((name) =>
        name.startsWith("execucao-"),
      );
      if (runs.length !== 1)
        fail("Wrapper Finance não produziu execução única verificável");
      wrapperEvidence = path.join(wrapperOutput, runs[0], "evidencia.json");
      if ((await json(wrapperEvidence)).status !== "validado_com_limitacoes")
        fail("Wrapper Finance recusou o corpus");
      candidate = path.join(
        path.dirname(wrapperEvidence),
        "graphify-out/graph.json",
      );
    } else if (ctx.config.adapter === "champions") {
      await confined(ctx.root, ".graphify-local", { ignored: true });
      const destination = `.graphify-local/local-${Date.now()}-${randomUUID()}`;
      await execute([
        process.execPath,
        "scripts/graphify/extract-code-only.mjs",
        "--scope",
        ctx.config.scope[0],
        "--out",
        destination,
        "--max-workers",
        "1",
        "--allow-large-scope",
      ]);
      wrapperEvidence = path.join(ctx.root, destination, "snapshot.json");
      candidate = path.join(ctx.root, destination, "graphify-out/graph.json");
    } else {
      const staging = path.join(job, "staging"),
        corpus = path.join(job, "corpus");
      await mkdir(corpus, { mode: 0o700 });
      for (const [file, expected] of Object.entries(fp.files)) {
        const target = path.join(corpus, file);
        await mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
        await copyFile(path.join(ctx.root, file), target);
        await chmod(target, 0o600);
        if ((await fileHash(target)) !== expected)
          fail("Fonte mudou ao preparar corpus isolado");
      }
      await execute([
        "git",
        "-c",
        "core.hooksPath=/dev/null",
        "-C",
        corpus,
        "init",
        "--quiet",
      ]);
      await execute([
        ctx.binary,
        "extract",
        corpus,
        "--code-only",
        "--no-cluster",
        "--max-workers",
        "1",
        "--out",
        staging,
      ]);
      await execute([
        ctx.binary,
        "cluster-only",
        staging,
        "--no-label",
        "--no-viz",
      ]);
      candidate = path.join(staging, "graphify-out/graph.json");
    }
    const graph = await validateGraph(candidate, ctx.config.partial),
      after = await fingerprint(ctx.root, ctx.config);
    if (after.hash !== fp.hash || ctx.interrupted())
      fail("Fonte mudou durante a geração; grafo anterior preservado");
    await mkdir(ctx.outputRoot, { recursive: true, mode: 0o700 });
    for (const file of [ctx.graph, ctx.provenance]) {
      const tracked = await run(
        [
          "git",
          "-c",
          "core.hooksPath=/dev/null",
          "-C",
          ctx.root,
          "ls-files",
          "--error-unmatch",
          "--",
          path.relative(ctx.root, file),
        ],
        ctx.root,
        ctx.env,
        30000,
      );
      if (tracked.code === 0)
        fail("Saída é rastreada pelo Git; promoção exige fluxo versionado");
    }
    let backup;
    const currentGraph = (await exists(ctx.graph))
      ? await validateGraph(ctx.graph, ctx.config.partial)
      : null;
    if ((currentGraph?.sha256 || null) !== (expectedGraph?.sha256 || null))
      fail("Outro processo mudou o grafo; promoção recusada");
    if (currentGraph) {
      backup = path.join(ctx.state, "backups", `${Date.now()}-${randomUUID()}`);
      await mkdir(backup, { recursive: true, mode: 0o700 });
      await copyFile(ctx.graph, path.join(backup, "graph.json"));
      await chmod(path.join(backup, "graph.json"), 0o600);
      if (await exists(ctx.provenance))
        await copyFile(ctx.provenance, path.join(backup, "provenance.json"));
    }
    if (ctx.lockAlive && !ctx.lockAlive())
      fail("Lease global perdeu a trava durante extração");
    const temp = path.join(
      ctx.outputRoot,
      `.graphify-local-${randomUUID()}.tmp`,
    );
    await copyFile(candidate, temp);
    await chmod(temp, 0o600);
    if (!currentGraph) {
      const { link } = await import("node:fs/promises");
      try {
        await link(temp, ctx.graph);
      } finally {
        await rm(temp, { force: true });
      }
    } else await rename(temp, ctx.graph);
    const meta = {
      version: 1,
      generator: "graphify-local",
      root: ctx.root,
      project: ctx.config.project,
      pin: ctx.config.pin,
      configHash: fp.configHash,
      fingerprint: fp.hash,
      head: fp.head,
      sourceHash: fp.sourceHash,
      metadataHash: fp.metadataHash,
      sourceFiles: fp.files,
      scope: ctx.config.scope,
      partial: ctx.config.partial,
      graph,
      wrapperEvidence,
      createdAt: new Date().toISOString(),
      inputTokens: 0,
      outputTokens: 0,
      network: "unshare user+net",
      maxWorkers: 1,
    };
    await atomic(ctx.provenance, meta);
    await rm(path.join(ctx.state, "dirty.json"), { force: true });
    return {
      status: "generated",
      graph,
      partial: meta.partial,
      scope: meta.scope,
      provenance: ctx.provenance,
      backup,
      jobDir: job,
    };
  } finally {
    await rm(path.join(job, "corpus"), { recursive: true, force: true });
    await rm(path.join(job, "staging"), { recursive: true, force: true });
  }
}
export async function adoptInitial(ctx, fp) {
  const file = path.join(
    ctx.outputRoot,
    "graphify-local-initial-provenance.json",
  );
  if (!(await exists(file)) || (await exists(ctx.provenance))) return false;
  if ((await lstat(file)).isSymbolicLink()) return false;
  const initial = await json(file);
  if (
    initial.generator !== "initial-code-only" ||
    initial.root !== ctx.root ||
    initial.graphifyVersion !== ctx.config.pin ||
    initial.partial !== ctx.config.partial ||
    digest(initial.scope) !== digest(ctx.config.scope) ||
    initial.sourceFingerprint?.head !== fp.head ||
    digest(initial.sourceFingerprint.files) !== digest(fp.files)
  )
    return false;
  const graph = await validateGraph(ctx.graph, ctx.config.partial);
  if (initial.graphSha256 !== graph.sha256) return false;
  // Só adota a execução inicial conhecida, com bytes, corpus, versão e commit conferidos.
  // Metadados que alteram descoberta precisam ser anteriores à própria extração.
  for (const file of ctx.config.metadata) {
    const info = await lstat(path.join(ctx.root, file)).catch(() => null);
    if (info && info.mtimeMs > Date.parse(initial.createdAt)) return false;
  }
  await atomic(ctx.provenance, {
    version: 1,
    generator: "graphify-local",
    adoptedFrom: file,
    root: ctx.root,
    project: ctx.config.project,
    pin: ctx.config.pin,
    configHash: fp.configHash,
    fingerprint: fp.hash,
    head: fp.head,
    sourceHash: fp.sourceHash,
    metadataHash: fp.metadataHash,
    sourceFiles: fp.files,
    scope: ctx.config.scope,
    partial: ctx.config.partial,
    graph,
    createdAt: new Date().toISOString(),
    inputTokens: 0,
    outputTokens: 0,
  });
  return true;
}
