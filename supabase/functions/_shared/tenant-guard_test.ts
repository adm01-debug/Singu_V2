import { assertEquals } from "jsr:@std/assert";
import {
  enforceTenantIdentity,
  extractRelationId,
  getRelationScope,
  isSafeIdentifier,
  quotePostgrestValue,
} from "./tenant-guard.ts";

Deno.test("enforceTenantIdentity substitui identidades em qualquer profundidade", () => {
  let nested: Record<string, unknown> = { owner_id: "outro-usuario" };
  for (let depth = 0; depth < 20; depth++) nested = { nested };

  const result = enforceTenantIdentity(nested, "usuario-autenticado") as Record<string, unknown>;
  let current = result;
  for (let depth = 0; depth < 20; depth++) {
    current = current.nested as Record<string, unknown>;
  }

  assertEquals(current.owner_id, "usuario-autenticado");
});

Deno.test("enforceTenantIdentity substitui identidades dentro de arrays", () => {
  const result = enforceTenantIdentity(
    [{ user_id: "outro-usuario", data: { created_by: "terceiro" } }],
    "usuario-autenticado",
  );

  assertEquals(result, [{
    user_id: "usuario-autenticado",
    data: { created_by: "usuario-autenticado" },
  }]);
});

Deno.test("isSafeIdentifier rejeita expressão PostgREST", () => {
  assertEquals(isSafeIdentifier("first_name"), true);
  assertEquals(isSafeIdentifier("name.ilike.*),user_id.neq.current"), false);
  assertEquals(isSafeIdentifier("profile->>email"), false);
});

Deno.test("quotePostgrestValue neutraliza separadores da expressão lógica", () => {
  assertEquals(
    quotePostgrestValue('%nome%),user_id.neq.usuario%'),
    '"%nome%),user_id.neq.usuario%"',
  );
  assertEquals(quotePostgrestValue('valor"\\final'), '"valor\\"\\\\final"');
});

Deno.test("getRelationScope classifica relações sem user_id pelo proprietário", () => {
  assertEquals(getRelationScope("contact_phones"), {
    foreignKey: "contact_id",
    parentTable: "contacts",
  });
  assertEquals(getRelationScope("company_addresses"), {
    foreignKey: "company_id",
    parentTable: "companies",
  });
  assertEquals(getRelationScope("contacts"), null);
});

Deno.test("extractRelationId exige filtro de igualdade da relação", () => {
  assertEquals(
    extractRelationId(
      [{ type: "eq", column: "contact_id", value: "contato-autorizado" }],
      "contact_id",
    ),
    "contato-autorizado",
  );
  assertEquals(
    extractRelationId(
      [{ type: "in", column: "contact_id", value: ["contato-externo"] }],
      "contact_id",
    ),
    null,
  );
});
