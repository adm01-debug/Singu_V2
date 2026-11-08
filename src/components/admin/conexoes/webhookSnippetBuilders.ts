export function buildPythonWebhookSnippet(examplePayload: string, url: string): string {
  const payloadString = JSON.stringify(JSON.stringify(JSON.parse(examplePayload)));

  return `# Python (requests)
import requests, hmac, hashlib, time, json, uuid

SECRET = "<seu_webhook_secret>"
ts = str(int(time.time() * 1000))
idempotency_key = uuid.uuid4().hex
body = json.dumps(json.loads(${payloadString}), separators=(",", ":"))
sig = "sha256=" + hmac.new(SECRET.encode(), (ts + "." + idempotency_key + "." + body).encode(), hashlib.sha256).hexdigest()

response = requests.post(
  "${url}",
  headers={
    "Content-Type": "application/json",
    "X-Lovable-Timestamp": ts,
    "X-Webhook-Idempotency-Key": idempotency_key,
    "X-Lovable-Signature": sig,
  },
  data=body,
)`;
}
