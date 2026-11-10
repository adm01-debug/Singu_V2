/**
 * Edge-case tests for scripts/check-edge-cors.mjs and check-edge-imports.mjs.
 * Each script runs against an isolated temp fixture tree so real files are untouched.
 *
 * Run with: node --test scripts/check-edge-cors.test.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function runInSandbox(scriptPath, fixture) {
  const dir = mkdtempSync(join(tmpdir(), "edge-check-"));
  try {
    for (const [rel, content] of Object.entries(fixture)) {
      const full = join(dir, rel);
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, content, "utf8");
    }
    const res = spawnSync("node", [join(REPO_ROOT, scriptPath)], {
      cwd: dir,
      encoding: "utf8",
    });
    return { code: res.status, stdout: res.stdout, stderr: res.stderr };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// ─── check-edge-cors ─────────────────────────────────────────────────────────

test("check-edge-cors: passes when no wildcard is present", () => {
  const { code } = runInSandbox("scripts/check-edge-cors.mjs", {
    "supabase/functions/foo/index.ts":
      'const h = { "Access-Control-Allow-Origin": "https://app.example.com" };\n',
  });
  assert.equal(code, 0);
});

test("check-edge-cors: fails when wildcard is present and function is NOT allowlisted", () => {
  const { code, stderr } = runInSandbox("scripts/check-edge-cors.mjs", {
    "supabase/functions/leaky/index.ts":
      'const h = { "Access-Control-Allow-Origin": "*" };\n',
  });
  assert.equal(code, 1);
  assert.match(stderr, /leaky/);
});

test("check-edge-cors: passes when wildcard function IS in the allowlist", () => {
  const { code } = runInSandbox("scripts/check-edge-cors.mjs", {
    "supabase/functions/public-api/index.ts":
      'const h = { "Access-Control-Allow-Origin": "*" };\n',
    "scripts/edge-cors-allowlist.txt": "public-api\n",
  });
  assert.equal(code, 0);
});

test("check-edge-cors: comments and blank lines in allowlist are ignored", () => {
  const { code } = runInSandbox("scripts/check-edge-cors.mjs", {
    "supabase/functions/public-api/index.ts":
      'const h = { "Access-Control-Allow-Origin": "*" };\n',
    "scripts/edge-cors-allowlist.txt": "# comment line\n\npublic-api\n",
  });
  assert.equal(code, 0);
});

test("check-edge-cors: detects wildcard via raw header string too", () => {
  const { code } = runInSandbox("scripts/check-edge-cors.mjs", {
    "supabase/functions/leaky/index.ts":
      'const raw = `Access-Control-Allow-Origin: *`;\n',
  });
  assert.equal(code, 1);
});

test("check-edge-cors: ignores non-.ts files", () => {
  const { code } = runInSandbox("scripts/check-edge-cors.mjs", {
    "supabase/functions/foo/README.md":
      "Do not do this: Access-Control-Allow-Origin: *\n",
  });
  assert.equal(code, 0);
});

// ─── check-edge-imports ──────────────────────────────────────────────────────

test("check-edge-imports: passes when only npm: imports are used", () => {
  const { code } = runInSandbox("scripts/check-edge-imports.mjs", {
    "supabase/functions/foo/index.ts": 'import { z } from "npm:zod@3";\n',
  });
  assert.equal(code, 0);
});

test("check-edge-imports: fails on esm.sh import", () => {
  const { code, stderr } = runInSandbox("scripts/check-edge-imports.mjs", {
    "supabase/functions/foo/index.ts": 'import { z } from "https://esm.sh/zod@3";\n',
  });
  assert.equal(code, 1);
  assert.match(stderr, /esm\.sh/);
});

test("check-edge-imports: counts multiple violations in the same file", () => {
  const { code, stderr } = runInSandbox("scripts/check-edge-imports.mjs", {
    "supabase/functions/foo/index.ts":
      'import a from "https://esm.sh/a";\nimport b from "https://esm.sh/b";\n',
  });
  assert.equal(code, 1);
  assert.match(stderr, /2 ocorrência/);
});

test("check-edge-imports: ignores deno.land/std imports", () => {
  const { code } = runInSandbox("scripts/check-edge-imports.mjs", {
    "supabase/functions/foo/index.ts":
      'import { serve } from "https://deno.land/std@0.224.0/http/server.ts";\n',
  });
  assert.equal(code, 0);
});

// ─── Formas de burlar o guard de CORS (todas têm de falhar) ──────────────────

const CORS_BURLAS = {
  "headers.set(nome, '*')": 'res.headers.set("Access-Control-Allow-Origin", "*");\n',
  "fallback ?? '*'": 'const h = { "Access-Control-Allow-Origin": origin ?? "*" };\n',
  "ternário com '*'": 'const h = { "Access-Control-Allow-Origin": ok ? origin : "*" };\n',
  "valor em outra linha": 'const h = {\n  "Access-Control-Allow-Origin":\n    origin || "*",\n};\n',
  "nome em minúsculas": 'const h = { "access-control-allow-origin": "*" };\n',
  "aspas simples": "const h = { 'Access-Control-Allow-Origin': '*' };\n",
  "crase no valor": 'const h = { "Access-Control-Allow-Origin": `*` };\n',
  "constante do mesmo arquivo": 'const ANY = "*";\nconst h = { "Access-Control-Allow-Origin": ANY };\n',
  "constante com fallback": 'const O = Deno.env.get("X") ?? "*";\nconst h = { "Access-Control-Allow-Origin": O };\n',
  "nome concatenado": 'const h = { ["Access-Control-" + "Allow-Origin"]: "*" };\n',
  "valor concatenado": 'const h = { "Access-Control-Allow-Origin": "" + "*" };\n',
  "atribuição por índice": 'h["Access-Control-Allow-Origin"] = "*";\n',
  "nome guardado em constante": 'const H = "Access-Control-Allow-Origin";\nheaders.set(H, "*");\n',
  "função do mesmo arquivo devolve '*'":
    'function origem(req) {\n  if (req) return req.headers.get("Origin");\n  return "*";\n}\nconst h = { "Access-Control-Allow-Origin": origem(req) };\n',
  "tupla de new Headers": 'new Headers([["Access-Control-Allow-Origin", "*"]]);\n',
  "header cru em minúsculas": 'const raw = "access-control-allow-origin: *";\n',
};

for (const [nome, codigo] of Object.entries(CORS_BURLAS)) {
  test(`check-edge-cors: pega wildcard via ${nome}`, () => {
    const { code, stderr } = runInSandbox("scripts/check-edge-cors.mjs", { "supabase/functions/leaky/index.ts": codigo });
    assert.equal(code, 1, stderr);
    assert.match(stderr, /leaky → supabase\/functions\/leaky\/index\.ts:\d+/);
  });
}

test("check-edge-cors: pega wildcard em .tsx e .js (não só .ts)", () => {
  for (const arquivo of ["mail.tsx", "util.js", "util.mjs"]) {
    const { code } = runInSandbox("scripts/check-edge-cors.mjs", {
      [`supabase/functions/leaky/${arquivo}`]: 'const h = { "Access-Control-Allow-Origin": "*" };\n',
    });
    assert.equal(code, 1, arquivo);
  }
});

test("check-edge-cors: wildcard em _shared falha (vale para todas as funções)", () => {
  const { code, stderr } = runInSandbox("scripts/check-edge-cors.mjs", {
    "supabase/functions/_shared/auth.ts": 'export const corsHeaders = { "Access-Control-Allow-Origin": "*" };\n',
  });
  assert.equal(code, 1);
  assert.match(stderr, /_shared/);
});

const CORS_LIMPOS = {
  "linha de comentário //": '// nunca use "Access-Control-Allow-Origin": "*" aqui\nexport const a = 1;\n',
  "bloco de comentário": '/**\n * Access-Control-Allow-Origin: * é proibido (ADR-007)\n */\nexport const a = 1;\n',
  "wildcard em OUTRO header": 'const h = { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Headers": "*" };\n',
  "select('*') no mesmo arquivo":
    'const h = { "Access-Control-Allow-Origin": getOrigin(req) };\nconst r = await db.from("t").select("*");\n',
  "leitura do header em teste": 'assertNotEquals(res.headers.get("Access-Control-Allow-Origin"), "*");\n',
  "comparação, não atribuição": 'if (h["Access-Control-Allow-Origin"] === "*") throw new Error("x");\n',
  "instrução seguinte sem ponto e vírgula": 'h["Access-Control-Allow-Origin"] = origin\nconst curinga = "*"\n',
  "origem vinda de lista fixa":
    'const ORIGENS = ["https://a.example.com"];\nconst h = { "Access-Control-Allow-Origin": ORIGENS[0] };\n',
};

for (const [nome, codigo] of Object.entries(CORS_LIMPOS)) {
  test(`check-edge-cors: não acusa ${nome}`, () => {
    const { code, stderr } = runInSandbox("scripts/check-edge-cors.mjs", { "supabase/functions/foo/index.ts": codigo });
    assert.equal(code, 0, stderr);
  });
}

test("check-edge-cors: entrada morta no allowlist falha e é nomeada", () => {
  const { code, stderr } = runInSandbox("scripts/check-edge-cors.mjs", {
    "supabase/functions/foo/index.ts": 'const h = { "Access-Control-Allow-Origin": "https://app.example.com" };\n',
    "scripts/edge-cors-allowlist.txt": "# comentário\nfoo\nnao-existe\n",
  });
  assert.equal(code, 1);
  assert.match(stderr, /sem wildcard correspondente/);
  assert.match(stderr, /- foo\n/);
  assert.match(stderr, /- nao-existe\n/);
});

test("check-edge-cors: allowlist com CRLF e espaços continua valendo", () => {
  const { code, stderr } = runInSandbox("scripts/check-edge-cors.mjs", {
    "supabase/functions/public-api/index.ts": 'const h = { "Access-Control-Allow-Origin": "*" };\n',
    "scripts/edge-cors-allowlist.txt": "# x\r\n  public-api  \r\n",
  });
  assert.equal(code, 0, stderr);
});

for (const script of ["scripts/check-edge-cors.mjs", "scripts/check-edge-imports.mjs"]) {
  test(`${script}: sem supabase/functions sai com 2 em vez de aprovar no vazio`, () => {
    const { code, stderr } = runInSandbox(script, { "src/x.ts": "export {};\n" });
    assert.equal(code, 2);
    assert.match(stderr, /não existe/);
  });

  test(`${script}: --root aponta para outra raiz; --help sai com 0; --root sem valor sai com 2`, () => {
    const dir = mkdtempSync(join(tmpdir(), "edge raiz ç-"));
    try {
      mkdirSync(join(dir, "supabase/functions/foo"), { recursive: true });
      writeFileSync(join(dir, "supabase/functions/foo/index.ts"),
        'import x from "https://esm.sh/x";\nconst h = { "Access-Control-Allow-Origin": "*" };\n');
      const rodar = (...args) => spawnSync("node", [join(REPO_ROOT, script), ...args], { cwd: tmpdir(), encoding: "utf8" });
      assert.equal(rodar("--root", dir).status, 1);
      assert.equal(rodar("--help").status, 0);
      assert.equal(rodar("--root").status, 2);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test(`${script}: o repositório atual passa`, () => {
    const res = spawnSync("node", [join(REPO_ROOT, script)], { cwd: REPO_ROOT, encoding: "utf8" });
    assert.equal(res.status, 0, res.stderr);
    assert.match(res.stdout, /^✅ .*\(\d{2,} arquivo\(s\) verificados\)/);
  });
}

test("check-edge-cors: o allowlist versionado não tem entrada sem pasta em supabase/functions", () => {
  const entradas = readFileSync(join(REPO_ROOT, "scripts/edge-cors-allowlist.txt"), "utf8")
    .split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
  for (const fn of entradas) assert.ok(existsSync(join(REPO_ROOT, "supabase/functions", fn)), fn);
});

// ─── Formas de burlar o guard de imports ─────────────────────────────────────

const IMPORT_BURLAS = {
  "import de efeito colateral": 'import "https://esm.sh/x@1";\n',
  "import dinâmico": 'const m = await import("https://esm.sh/x@1");\n',
  "import dinâmico com crase": "const m = await import(`https://esm.sh/x@1`);\n",
  "http sem s": 'import x from "http://esm.sh/x@1";\n',
  "subdomínio": 'import x from "https://cdn.esm.sh/x@1";\n',
  "sem espaço depois de from": 'import x from"https://esm.sh/x@1";\n',
  "export from": 'export * from "https://esm.sh/x@1";\n',
  "import em várias linhas": 'import {\n  a,\n  b,\n} from\n  "https://esm.sh/x@1";\n',
  "maiúsculas no host": 'import x from "https://ESM.SH/x@1";\n',
};

for (const [nome, codigo] of Object.entries(IMPORT_BURLAS)) {
  test(`check-edge-imports: pega ${nome}`, () => {
    const { code, stderr } = runInSandbox("scripts/check-edge-imports.mjs", { "supabase/functions/foo/index.ts": codigo });
    assert.equal(code, 1, stderr);
    assert.match(stderr, /supabase\/functions\/foo\/index\.ts:\d+ \(1 ocorrência/);
  });
}

test("check-edge-imports: pega esm.sh em .tsx/.js e em import map (deno.json, import_map.json)", () => {
  const casos = {
    "mail.tsx": 'import x from "https://esm.sh/x@1";\n',
    "util.js": 'import x from "https://esm.sh/x@1";\n',
    "deno.json": '{ "imports": { "x": "https://esm.sh/x@1" } }\n',
    "import_map.json": '{ "imports": { "x/": "https://esm.sh/x@1/" } }\n',
  };
  for (const [arquivo, conteudo] of Object.entries(casos)) {
    const { code } = runInSandbox("scripts/check-edge-imports.mjs", { [`supabase/functions/foo/${arquivo}`]: conteudo });
    assert.equal(code, 1, arquivo);
  }
});

const IMPORT_LIMPOS = {
  "import comentado": '// antes: import x from "https://esm.sh/x@1";\nimport { z } from "npm:zod@3.23.8";\n',
  "host parecido": 'import x from "https://notesm.sh/x";\nimport y from "https://esm.sh.example.com/y";\n',
  "jsr e node": 'import { assert } from "jsr:@std/assert@1";\nimport fs from "node:fs";\n',
  "import relativo": 'import { a } from "../_shared/auth.ts";\n',
};

for (const [nome, codigo] of Object.entries(IMPORT_LIMPOS)) {
  test(`check-edge-imports: não acusa ${nome}`, () => {
    const { code, stderr } = runInSandbox("scripts/check-edge-imports.mjs", { "supabase/functions/foo/index.ts": codigo });
    assert.equal(code, 0, stderr);
  });
}
