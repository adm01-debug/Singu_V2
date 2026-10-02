export function isValidIdempotencyKey(value: string): boolean {
  return /^[A-Za-z0-9_-]{16,128}$/.test(value);
}

export async function verifyWebhookHmac(
  secret: string,
  timestamp: string,
  idempotencyKey: string,
  rawBody: string,
  signature: string,
): Promise<boolean> {
  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const digest = await crypto.subtle.sign(
      "HMAC",
      key,
      enc.encode(`${timestamp}.${idempotencyKey}.${rawBody}`),
    );
    const hex = Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
    const expected = `sha256=${hex}`;
    if (expected.length !== signature.length) return false;
    let diff = 0;
    for (let index = 0; index < expected.length; index++) {
      diff |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
    }
    return diff === 0;
  } catch {
    return false;
  }
}
