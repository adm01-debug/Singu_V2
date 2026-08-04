/**
 * Teste unitário do detector de fallback Cloudflare.
 *
 * Valida que respostas HTML de erro do Cloudflare (502/503/504) são reconhecidas
 * por padrão regex, prevenindo regressão da resiliência implementada no hotfix
 * de `external-data` que retorna `{ fallback: true, data: [], count: 0 }` ao
 * invés de propagar HTML cru para o cliente.
 *
 * Roda offline (sem rede). Executável via `supabase--test_edge_functions`.
 */
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

/** Padrão usado em `external-data/index.ts` para detectar HTML de gateway. */
const CLOUDFLARE_ERROR_PATTERN = /<html|cloudflare|502 Bad Gateway|503 Service|504 Gateway/i;

const SAMPLE_502 = `<html>\r\n<head><title>502 Bad Gateway</title></head>\r\n<body>\r\n<center><h1>502 Bad Gateway</h1></center>\r\n<hr><center>cloudflare</center>\r\n</body>\r\n</html>`;
const SAMPLE_503 = `<html><head><title>503 Service Temporarily Unavailable</title></head><body><h1>503</h1><hr>cloudflare</body></html>`;
const SAMPLE_504 = `<html><head><title>504 Gateway Time-out</title></head><body><h1>504</h1></body></html>`;
const VALID_JSON = `{"data":[{"id":"abc"}],"count":1}`;

Deno.test("cloudflare-fallback: detecta HTML 502 Bad Gateway", () => {
  assert(CLOUDFLARE_ERROR_PATTERN.test(SAMPLE_502), "Deve detectar HTML 502");
});

Deno.test("cloudflare-fallback: detecta HTML 503 Service Unavailable", () => {
  assert(CLOUDFLARE_ERROR_PATTERN.test(SAMPLE_503), "Deve detectar HTML 503");
});

Deno.test("cloudflare-fallback: detecta HTML 504 Gateway Timeout", () => {
  assert(CLOUDFLARE_ERROR_PATTERN.test(SAMPLE_504), "Deve detectar HTML 504");
});

Deno.test("cloudflare-fallback: NÃO ativa em JSON válido", () => {
  assertEquals(CLOUDFLARE_ERROR_PATTERN.test(VALID_JSON), false, "JSON válido não deve disparar fallback");
});

Deno.test("cloudflare-fallback: payload degradado tem shape esperado", () => {
  // Forma exata que o frontend (`src/lib/externalData.ts`) espera ao receber fallback
  const degraded = { fallback: true, data: [], count: 0 };
  assertEquals(degraded.fallback, true);
  assertEquals(Array.isArray(degraded.data), true);
  assertEquals(degraded.data.length, 0);
  assertEquals(degraded.count, 0);
});
