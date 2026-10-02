import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CodeExample } from '@/components/docs/CodeExample';
import type { IncomingWebhook } from '@/hooks/useIncomingWebhooks';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  webhook: IncomingWebhook;
  url: string;
}

/**
 * Painel lateral com snippets prontos para integração:
 * cURL, fetch JS, Python requests, n8n HTTP node, Bitrix24 outbound webhook.
 */
export function WebhookSnippetsSheet({ open, onOpenChange, webhook, url }: Props) {
  const examplePayload = JSON.stringify(
    Object.fromEntries(
      Object.entries(webhook.field_mapping ?? {}).map(([_, src]) => [src, `<valor_${src}>`]),
    ),
    null, 2,
  );

  const compactPayload = JSON.stringify(JSON.parse(examplePayload));
  const curl = `secret="<seu_webhook_secret>"
body='${compactPayload}'
timestamp="$(($(date +%s) * 1000))"
idempotency_key="$(openssl rand -hex 16)"
signature="sha256=$(printf '%s' "$timestamp.$idempotency_key.$body" | openssl dgst -sha256 -hmac "$secret" -hex | sed 's/^.* //')"

curl -X POST "${url}" \\
  -H "Content-Type: application/json" \\
  -H "X-Lovable-Timestamp: $timestamp" \\
  -H "X-Webhook-Idempotency-Key: $idempotency_key" \\
  -H "X-Lovable-Signature: $signature" \\
  --data-raw "$body"`;

  const fetchJs = `// JavaScript / TypeScript
const secret = "<seu_webhook_secret>";
const body = JSON.stringify(${examplePayload});
const timestamp = Date.now().toString();
const idempotencyKey = crypto.randomUUID();
const key = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(secret),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign"],
);
const digest = await crypto.subtle.sign(
  "HMAC",
  key,
  new TextEncoder().encode(timestamp + "." + idempotencyKey + "." + body),
);
const hmac = Array.from(new Uint8Array(digest), byte =>
  byte.toString(16).padStart(2, "0"),
).join("");

const response = await fetch("${url}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Lovable-Timestamp": timestamp,
    "X-Webhook-Idempotency-Key": idempotencyKey,
    "X-Lovable-Signature": "sha256=" + hmac,
  },
  body,
});
const data = await response.json();`;

  const python = `# Python (requests)
import requests, hmac, hashlib, time, json, uuid

SECRET = "<seu_webhook_secret>"
ts = str(int(time.time() * 1000))
idempotency_key = uuid.uuid4().hex
body = json.dumps(${examplePayload}, separators=(",", ":"))
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

  const n8n = `// n8n — nó Code antes do HTTP Request
const crypto = require("crypto");
const body = JSON.stringify(${examplePayload});
const timestamp = Date.now().toString();
const idempotencyKey = crypto.randomUUID();
const signature = "sha256=" + crypto
  .createHmac("sha256", $env.WEBHOOK_SECRET)
  .update(timestamp + "." + idempotencyKey + "." + body)
  .digest("hex");
return [{ json: { body, timestamp, idempotencyKey, signature } }];

// No nó HTTP Request, envie body={{ $json.body }} como RAW e use:
// X-Lovable-Timestamp={{ $json.timestamp }}
// X-Webhook-Idempotency-Key={{ $json.idempotencyKey }}
// X-Lovable-Signature={{ $json.signature }}`;

  const bitrix = `// Bitrix24 — Outbound Webhook
// O webhook nativo não calcula HMAC SHA-256 e não deve chamar esta URL diretamente.
// Encaminhe o evento por uma automação/middleware que preserve o corpo bruto e adicione:
// X-Lovable-Timestamp, X-Webhook-Idempotency-Key e X-Lovable-Signature.
// Destino final: ${url}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle>Exemplos de integração — {webhook.name}</SheetTitle>
          <SheetDescription>
            Snippets prontos para colar no sistema de origem. Cada exemplo já inclui URL, headers necessários e payload baseado no mapping.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 mt-4 pr-4">
          <div className="space-y-4">
            <CodeExample title="cURL" language="bash" code={curl} />
            <CodeExample title="JavaScript / fetch" language="typescript" code={fetchJs} />
            <CodeExample title="Python (requests)" language="python" code={python} />
            <CodeExample title="n8n — HTTP Request node" language="json" code={n8n} />
            <CodeExample title="Bitrix24 — Outbound Webhook" language="text" code={bitrix} />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
