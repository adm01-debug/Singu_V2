import {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { fetchAllPages } from "./pagination.ts";

Deno.test("busca todas as páginas sem truncar em 1000 linhas", async () => {
  const source = Array.from({ length: 2505 }, (_, index) => index);
  const rows = await fetchAllPages((from, to) =>
    Promise.resolve({ data: source.slice(from, to + 1), error: null })
  );
  assertEquals(rows.length, 2505);
  assertEquals(rows.at(-1), 2504);
});

Deno.test("encerra após uma página final vazia", async () => {
  let calls = 0;
  const source = Array.from({ length: 2000 }, (_, index) => index);
  const rows = await fetchAllPages((from, to) => {
    calls++;
    return Promise.resolve({ data: source.slice(from, to + 1), error: null });
  });
  assertEquals(rows.length, 2000);
  assertEquals(calls, 3);
});

Deno.test("propaga erro de paginação", async () => {
  await assertRejects(
    () => fetchAllPages<number>(() =>
      Promise.resolve({ data: null, error: { message: "consulta falhou" } })
    ),
    Error,
    "consulta falhou",
  );
});
