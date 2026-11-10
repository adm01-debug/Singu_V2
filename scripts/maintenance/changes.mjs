import { lstat } from "node:fs/promises";
import path from "node:path";
import { fail, run, git } from "./lib.mjs";

export async function changed(root, config, prefix = [], allowed) {
  const staged = await run(
    [
      ...prefix,
      "git",
      "-c",
      "core.hooksPath=/dev/null",
      "diff",
      "--cached",
      "--quiet",
    ],
    root,
    config.timeoutMs,
  );
  if (staged.code !== 0 || staged.timedOut)
    fail("Gate/corretor alterou o índice Git; execução descartada");
  const status = await git(
    root,
    ["status", "--porcelain=v1", "-z", "--untracked-files=all"],
    undefined,
    prefix,
  );
  const modulesLink = await lstat(path.join(root, "node_modules")).then(
    (s) => s.isSymbolicLink(),
    () => false,
  );
  if (
    status
      .split("\0")
      .some(
        (line) =>
          line.startsWith("??") &&
          !(modulesLink && line.slice(3) === "node_modules"),
      )
  )
    fail("Arquivo não rastreado criado por correção/gate");
  const files = (
    await git(
      root,
      ["diff", "--name-only", "-z", "--no-renames"],
      undefined,
      prefix,
    )
  )
    .split("\0")
    .filter(Boolean);
  if (files.some((f) => !config.fix.roots.some((r) => f.startsWith(`${r}/`))))
    fail("Correção alterou arquivo fora do escopo autorizado");
  if (allowed && files.some((file) => !allowed.has(file)))
    fail("Correção alterou arquivo gerado ou excluído do escopo");
  const raw = (
    await git(root, ["diff", "--raw", "-z", "--no-renames"], undefined, prefix)
  )
    .split("\0")
    .filter(Boolean);
  if (
    raw.some(
      (entry) =>
        entry.startsWith(":") &&
        entry.split(" ")[0].slice(1) !== entry.split(" ")[1],
    )
  )
    fail(
      "Correção alterou modo/tipo ou removeu arquivo; apenas conteúdo de texto é permitido",
    );
  const stats = (
    await git(
      root,
      ["diff", "--numstat", "-z", "--no-renames"],
      undefined,
      prefix,
    )
  )
    .split("\0")
    .filter(Boolean);
  let lines = 0;
  for (const row of stats) {
    const [add, remove] = row.split("\t");
    if (!/^\d+$/.test(add) || !/^\d+$/.test(remove))
      fail("Alteração binária não autorizada");
    lines += Number(add) + Number(remove);
  }
  if (files.length > config.maxFiles || lines > config.maxChangedLines)
    fail(
      `Limite de alteração excedido: ${files.length} arquivos, ${lines} linhas`,
    );
  return { files, lines };
}
