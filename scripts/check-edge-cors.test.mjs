/**
 * Edge-case tests for scripts/check-edge-cors.mjs and check-edge-imports.mjs.
 * Each script runs against an isolated temp fixture tree so real files are untouched.
 *
 * Run with: node --test scripts/check-edge-cors.test.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
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