import { lstat, open } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { inside, fail, exists, hash, json } from "./common.mjs";
import { checked } from "./process.mjs";
import { fingerprint } from "./source.mjs";

export async function runtime(ctx) {
  const python = path.join(ctx.envRoot, "bin/python"),
    binary = path.join(ctx.envRoot, "bin/graphify");
  if ((await exists(binary)) && (await lstat(binary)).isSymbolicLink())
    fail(
      "Executável local não pode apontar para CLI compartilhada",
      "missing_runtime",
    );
  if (!(await exists(python)) || !(await exists(binary)))
    fail("Ambiente individual ausente; execute install", "missing_runtime");
  const script =
    'import importlib.metadata as m,sys,json,pathlib;import graphify,networkx,tree_sitter,tree_sitter_sql;assert tree_sitter_sql.language() is not None;print(json.dumps({"version":m.version("graphifyy"),"prefix":sys.prefix,"module":str(pathlib.Path(graphify.__file__).resolve())}))';
  let value;
  try {
    value = JSON.parse(
      await checked([python, "-I", "-c", script], ctx.root, ctx.env, 30000),
    );
  } catch {
    fail(
      "Ambiente individual não passou no smoke de imports",
      "missing_runtime",
    );
  }
  if (
    value.version !== ctx.config.pin ||
    path.resolve(value.prefix) !== ctx.envRoot ||
    !inside(ctx.envRoot, value.module)
  )
    fail("Runtime não corresponde ao ambiente e pin locais", "missing_runtime");
  const version = await checked(
    [binary, "--version"],
    ctx.root,
    ctx.env,
    30000,
  );
  if (
    !version.split("\n").some((s) => s.trim() === `graphify ${ctx.config.pin}`)
  )
    fail("Executável local tem versão divergente", "missing_runtime");
  return { version: value.version, python, binary, prefix: value.prefix };
}

export async function validateGraph(file, partial = false) {
  const descriptor = await open(
    file,
    constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK,
  );
  try {
    const info = await descriptor.stat({ bigint: true });
    if (!info.isFile() || info.size > 512n * 1024n * 1024n)
      fail("Artefato do grafo não é arquivo regular ou excede512MB");
    const bytes = await descriptor.readFile(),
      after = await descriptor.stat({ bigint: true });
    if (
      BigInt(bytes.length) !== info.size ||
      after.size !== info.size ||
      after.mtimeNs !== info.mtimeNs ||
      after.ctimeNs !== info.ctimeNs
    )
      fail("Artefato do grafo mudou durante a leitura");
    const graph = JSON.parse(bytes.toString("utf8"));
    if (!Array.isArray(graph.nodes) || !graph.nodes.length)
      fail("Grafo vazio ou inválido");
    const ids = new Set(graph.nodes.map((n) => String(n.id)));
    if (
      ids.size !== graph.nodes.length ||
      graph.nodes.some(
        (n) =>
          !["string", "number"].includes(typeof n.id) ||
          String(n.id).length === 0 ||
          (typeof n.id === "number" && !Number.isFinite(n.id)),
      )
    )
      fail("IDs do grafo inválidos ou duplicados");
    const edges = graph.links || graph.edges;
    if (!Array.isArray(edges)) fail("Relações do grafo inválidas");
    let unresolvedImports = 0;
    for (const edge of edges) {
      if (ids.has(String(edge.source)) && ids.has(String(edge.target)))
        continue;
      if (
        partial &&
        ids.has(String(edge.source)) &&
        ["imports", "imports_from", "dynamic_import", "re_exports"].includes(
          edge.relation,
        )
      ) {
        unresolvedImports++;
        continue;
      }
      fail("Grafo contém relações sem origem/destino");
    }
    return {
      nodes: graph.nodes.length,
      edges: edges.length,
      unresolvedImports,
      sha256: hash(bytes),
    };
  } finally {
    await descriptor.close();
  }
}
export async function status(ctx, currentFingerprint) {
  const runtimeInfo = await runtime(ctx);
  const fp = currentFingerprint || (await fingerprint(ctx.root, ctx.config));
  if (!(await exists(ctx.graph)))
    return {
      status: "missing_graph",
      runtime: runtimeInfo,
      fingerprint: fp.hash,
      partial: ctx.config.partial,
      scope: ctx.config.scope,
    };
  if ((await lstat(ctx.graph)).isSymbolicLink())
    fail("Grafo não pode ser symlink");
  const graph = await validateGraph(ctx.graph, ctx.config.partial);
  if (!(await exists(ctx.provenance)))
    return {
      status: "unverified",
      runtime: runtimeInfo,
      graph,
      fingerprint: fp.hash,
      partial: ctx.config.partial,
      scope: ctx.config.scope,
    };
  if ((await lstat(ctx.provenance)).isSymbolicLink())
    fail("Proveniência não pode ser symlink");
  const meta = await json(ctx.provenance);
  const valid =
    meta.version === 1 &&
    meta.root === ctx.root &&
    meta.pin === ctx.config.pin &&
    meta.fingerprint === fp.hash &&
    meta.graph.sha256 === graph.sha256;
  return {
    status: valid ? "current" : "stale",
    runtime: runtimeInfo,
    graph,
    fingerprint: fp.hash,
    partial: ctx.config.partial,
    scope: ctx.config.scope,
  };
}
