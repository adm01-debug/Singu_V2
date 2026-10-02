import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  isValidIdempotencyKey,
  verifyWebhookHmac,
} from "./webhook-signature.ts";

async function sign(
  secret: string,
  timestamp: string,
  idempotencyKey: string,
  body: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${timestamp}.${idempotencyKey}.${body}`),
  );
  return `sha256=${Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}`;
}

Deno.test("aceita assinatura vinculada ao corpo e à chave de idempotência", async () => {
  const signature = await sign(
    "segredo-de-teste-com-32-caracteres",
    "1760000000000",
    "evento_1234567890",
    '{"contact":{"name":"Ana"}}',
  );
  assertEquals(
    await verifyWebhookHmac(
      "segredo-de-teste-com-32-caracteres",
      "1760000000000",
      "evento_1234567890",
      '{"contact":{"name":"Ana"}}',
      signature,
    ),
    true,
  );
});

Deno.test("rejeita replay com outra chave de idempotência", async () => {
  const signature = await sign(
    "segredo-de-teste-com-32-caracteres",
    "1760000000000",
    "evento_1234567890",
    '{"contact":{"name":"Ana"}}',
  );
  assertEquals(
    await verifyWebhookHmac(
      "segredo-de-teste-com-32-caracteres",
      "1760000000000",
      "evento_0987654321",
      '{"contact":{"name":"Ana"}}',
      signature,
    ),
    false,
  );
});

Deno.test("rejeita alteração do corpo assinado", async () => {
  const signature = await sign(
    "segredo-de-teste-com-32-caracteres",
    "1760000000000",
    "evento_1234567890",
    '{"contact":{"name":"Ana"}}',
  );
  assertEquals(
    await verifyWebhookHmac(
      "segredo-de-teste-com-32-caracteres",
      "1760000000000",
      "evento_1234567890",
      '{"contact":{"name":"Eva"}}',
      signature,
    ),
    false,
  );
});

Deno.test("valida o formato da chave de idempotência", () => {
  assertEquals(isValidIdempotencyKey("evento_1234567890"), true);
  assertEquals(isValidIdempotencyKey("curta"), false);
  assertEquals(isValidIdempotencyKey("evento com espaço 123"), false);
});
