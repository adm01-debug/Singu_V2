/**
 * Edge-case tests for the schema validator.
 * Run with: deno test supabase/functions/_shared/validate_test.ts
 */
import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { validate } from "./validate.ts";

Deno.test("validate: rejects non-object bodies (null, array, primitives)", () => {
  for (const bad of [null, [], "string", 42, true]) {
    const r = validate(bad, { name: { type: "string", required: true } });
    assertEquals(r.ok, false);
  }
});

Deno.test("validate: missing required field returns error", () => {
  const r = validate({}, { name: { type: "string", required: true } });
  assertEquals(r.ok, false);
  if (!r.ok) assert(r.error.includes("name"));
});

Deno.test("validate: whitespace-only string treated as missing for required fields", () => {
  const r = validate({ name: "   " }, { name: { type: "string", required: true } });
  assertEquals(r.ok, false);
});

Deno.test("validate: string trimmed by default", () => {
  const r = validate<{ name: string }>({ name: "  hi  " }, { name: { type: "string" } });
  assertEquals(r.ok, true);
  if (r.ok) assertEquals(r.data.name, "hi");
});

Deno.test("validate: trim=false preserves whitespace", () => {
  const r = validate<{ name: string }>(
    { name: "  hi  " },
    { name: { type: "string", trim: false } },
  );
  assertEquals(r.ok, true);
  if (r.ok) assertEquals(r.data.name, "  hi  ");
});

Deno.test("validate: minLength / maxLength boundaries", () => {
  const schema = { s: { type: "string" as const, minLength: 3, maxLength: 5 } };
  assertEquals(validate({ s: "ab" }, schema).ok, false);
  assertEquals(validate({ s: "abc" }, schema).ok, true);
  assertEquals(validate({ s: "abcde" }, schema).ok, true);
  assertEquals(validate({ s: "abcdef" }, schema).ok, false);
});

Deno.test("validate: pattern must match", () => {
  const schema = { code: { type: "string" as const, pattern: /^[A-Z]{3}$/ } };
  assertEquals(validate({ code: "abc" }, schema).ok, false);
  assertEquals(validate({ code: "ABC" }, schema).ok, true);
});

Deno.test("validate: integer rejects string-encoded numbers and floats", () => {
  const schema = { n: { type: "integer" as const, required: true } };
  assertEquals(validate({ n: "5" }, schema).ok, false, "string must fail");
  assertEquals(validate({ n: 1.5 }, schema).ok, false, "float must fail");
  assertEquals(validate({ n: 5 }, schema).ok, true);
});

Deno.test("validate: integer min/max boundaries", () => {
  const schema = { n: { type: "integer" as const, min: 0, max: 10 } };
  assertEquals(validate({ n: -1 }, schema).ok, false);
  assertEquals(validate({ n: 0 }, schema).ok, true);
  assertEquals(validate({ n: 10 }, schema).ok, true);
  assertEquals(validate({ n: 11 }, schema).ok, false);
});

Deno.test("validate: number rejects NaN", () => {
  const r = validate({ n: NaN }, { n: { type: "number" as const, required: true } });
  assertEquals(r.ok, false);
});

Deno.test("validate: boolean is strict (no truthy coercion)", () => {
  const schema = { b: { type: "boolean" as const, required: true } };
  assertEquals(validate({ b: "true" }, schema).ok, false);
  assertEquals(validate({ b: 1 }, schema).ok, false);
  assertEquals(validate({ b: true }, schema).ok, true);
});

Deno.test("validate: array maxItems enforced", () => {
  const schema = { a: { type: "array" as const, maxItems: 2 } };
  assertEquals(validate({ a: [1, 2, 3] }, schema).ok, false);
  assertEquals(validate({ a: [1, 2] }, schema).ok, true);
  assertEquals(validate({ a: "not-array" }, schema).ok, false);
});

Deno.test("validate: object rejects arrays even though typeof [] === 'object'", () => {
  const r = validate({ o: [] }, { o: { type: "object" as const, required: true } });
  assertEquals(r.ok, false);
});

Deno.test("validate: optional missing field is silently dropped", () => {
  const r = validate<{ name?: string }>({}, { name: { type: "string" } });
  assertEquals(r.ok, true);
  if (r.ok) assertEquals(r.data.name, undefined);
});

Deno.test("validate: unknown fields are ignored (no reflection into output)", () => {
  const r = validate<Record<string, unknown>>(
    { name: "ok", extra: "should not appear" },
    { name: { type: "string" } },
  );
  assertEquals(r.ok, true);
  if (r.ok) {
    assertEquals(r.data.name, "ok");
    assertEquals("extra" in r.data, false);
  }
});