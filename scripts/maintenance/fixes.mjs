import {readFile,writeFile} from "node:fs/promises";
import path from "node:path";
import {fail,git,tool} from "./lib.mjs";
import {allowedSourceFiles} from "./sandbox.mjs";

export const batches = (files, size = 16) =>
  Array.from({ length: Math.ceil(files.length / size) }, (_, i) =>
    files.slice(i * size, (i + 1) * size),
  );

export function prettierCandidates(scan, expected) {
  const files = scan.stdout.split(/\r?\n/);
  if (files.at(-1) === "") files.pop();
  if (
    scan.stderr.trim() ||
    files.some((file) => !expected.has(file)) ||
    (scan.code === 1 && files.length === 0) ||
    (scan.code === 0 && files.length !== 0)
  )
    fail("Prettier não produziu uma lista válida e completa de arquivos");
  return files;
}

export async function fixes(root, config, jobDir, execute, prefix = [], tracked) {
  tracked ||= await allowedSourceFiles(root, config, prefix);
  const candidates = new Set();
  let prettierBin, eslintArgs;
  if (config.fix.prettier) {
    const p = tool(root, "prettier");
    const pkg = JSON.parse(await readFile(p.pkg, "utf8")),
      bin = typeof pkg.bin === "string" ? pkg.bin : pkg.bin.prettier;
    prettierBin = path.resolve(p.dir, bin);
    for (const [index, batch] of batches([...tracked]).entries()) {
      const scan = await execute(
        "scan",
        `prettier_${index}`,
        [
          process.execPath,
          prettierBin,
          "--list-different",
          "--ignore-unknown",
          "--",
          ...batch,
        ],
        true,
      );
      for (const file of prettierCandidates(scan, new Set(batch)))
        candidates.add(file);
    }
  }
  if (config.fix.eslintRules.length) {
    tool(root, "typescript-eslint");
    const override = path.join(jobDir, "eslint-layout.mjs");
    const settings = {
      semi: ["error", "always"],
      quotes: ["error", "double"],
      indent: ["error", 2],
      "comma-dangle": ["error", "always-multiline"],
      "eol-last": ["error", "always"],
      "no-trailing-spaces": "error",
      "space-infix-ops": "error",
      "keyword-spacing": "error",
      "object-curly-spacing": ["error", "always"],
      "array-bracket-spacing": ["error", "never"],
    };
    const rules = Object.fromEntries(
      config.fix.eslintRules.map((r) => [r, settings[r]]),
    );
    await writeFile(
      override,
      `import {createRequire} from 'node:module';\nconst req=createRequire(${JSON.stringify(path.join(root, "package.json"))});\nexport default [{files:['**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}'],languageOptions:{parser:req('typescript-eslint').parser,parserOptions:{ecmaFeatures:{jsx:true}}},rules:${JSON.stringify(rules)}}];\n`,
      { mode: 0o600 },
    );
    const eslint = tool(root, "eslint");
    eslintArgs = [
      process.execPath,
      path.join(eslint.dir, "bin/eslint.js"),
      "--no-config-lookup",
      "--no-inline-config",
      "--config",
      override,
      "--fix-type",
      "layout",
    ];
    for (const [index, batch] of batches(
      [...tracked].filter((file) => /\.(?:[cm]?[jt]s|[jt]sx)$/.test(file)),
    ).entries()) {
      const scan = await execute(
        "scan",
        `eslint_layout_${index}`,
        [...eslintArgs, "--fix-dry-run", "--format", "json", "--", ...batch],
        true,
      );
      let entries;
      try {
        entries = JSON.parse(scan.stdout);
      } catch {
        fail("ESLint dry-run não produziu JSON válido");
      }
      if (!Array.isArray(entries) || scan.stderr.trim())
        fail("ESLint dry-run retornou diagnósticos inválidos");
      const scanned = new Set();
      for (const item of entries) {
        if (
          !item ||
          typeof item.filePath !== "string" ||
          !path.isAbsolute(item.filePath) ||
          !Array.isArray(item.messages) ||
          !Number.isInteger(item.fatalErrorCount) ||
          item.fatalErrorCount < 0
        )
          fail("ESLint retornou resultado inválido");
        const file = path.relative(root, item.filePath).replaceAll("\\", "/");
        if (
          !batch.includes(file) ||
          scanned.has(file) ||
          item.fatalErrorCount > 0
        )
          fail("ESLint alterou o escopo ou encontrou erro de análise");
        scanned.add(file);
        if (item.output !== undefined) {
          if (typeof item.output !== "string")
            fail("ESLint retornou correção inválida");
          candidates.add(file);
        }
      }
      if (scanned.size !== batch.length)
        fail("ESLint não analisou todos os arquivos do lote");
    }
  }
  const selected = [],
    skippedBudget = [];
  let lines = 0;
  for (const file of [...candidates].sort()) {
    if (selected.length >= config.maxFiles) {
      skippedBudget.push(file);
      continue;
    }
    if (prettierBin)
      await execute("fix", "prettier", [
        process.execPath,
        prettierBin,
        "--write",
        "--ignore-unknown",
        file,
      ]);
    if (eslintArgs && /\.[cm]?[jt]sx?$/.test(file))
      await execute("fix", "eslint_layout", [...eslintArgs, "--fix", file]);
    const row = await git(
      root,
      ["diff", "--numstat", "--", file],
      undefined,
      prefix,
    );
    if (!row) continue;
    const [add, remove] = row.split("\t");
    if (!/^\d+$/.test(add) || !/^\d+$/.test(remove))
      fail("Correção binária não autorizada");
    const count = Number(add) + Number(remove);
    if (lines + count > config.maxChangedLines) {
      await git(
        root,
        ["restore", "--source=HEAD", "--worktree", "--", file],
        undefined,
        prefix,
      );
      skippedBudget.push(file);
      continue;
    }
    selected.push(file);
    lines += count;
  }
  return { candidates: candidates.size, selected, skippedBudget, lines };
}
