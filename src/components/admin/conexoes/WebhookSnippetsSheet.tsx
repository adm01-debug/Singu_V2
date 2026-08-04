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

  const ts = Date.now();
  const hmacHeaders = webhook.require_signature
    ? `\n  -H "X-Lovable-Timestamp: ${ts}" \\\n  -H "X-Lovable-Signature: sha256=<calcule_hmac>" \\`
    : '';

  const curl = `curl -X POST "${url}" \\
  -H "Content-Type: application/json" \\${hmacHeaders}
  -d '${examplePayload}'`;

  const fetchJs = `// JavaScript / TypeScript
const response = await fetch("${url}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",${webhook.require_signature ? `
    "X-Lovable-Timestamp": String(Date.now()),
    "X-Lovable-Signature": "sha256=" + hmac, // calcule HMAC-SHA256(secret, timestamp + "." + body)` : ''}
  },
  body: ${examplePayload},
});
const data = await response.json();`;

  const python = `# Python (requests)
import requests${webhook.require_signature ? `, hmac, hashlib, time, json

ts = str(int(time.time() * 1000))
body = json.dumps(${examplePayload})
sig = "sha256=" + hmac.new(SECRET.encode(), (ts + "." + body).encode(), hashlib.sha256).hexdigest()` : ''}

response = requests.post(
  "${url}",
  headers={
    "Content-Type": "application/json",${webhook.require_signature ? `
    "X-Lovable-Timestamp": ts,
    "X-Lovable-Signature": sig,` : ''}
  },
  ${webhook.require_signature ? 'data=body' : `json=${examplePayload}`}
)`;

  const n8n = `// n8n — Configure um nó HTTP Request:
{
  "method": "POST",
  "url": "${url}",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      { "name": "Content-Type", "value": "application/json" }${webhook.require_signature ? `,
      { "name": "X-Lovable-Timestamp", "value": "={{ $now.toMillis() }}" },
      { "name": "X-Lovable-Signature", "value": "sha256={{ /* calcule via Code node */ }}" }` : ''}
    ]
  },
  "sendBody": true,
  "bodyContentType": "json",
  "jsonBody": ${examplePayload}
}`;

  const bitrix = `// Bitrix24 — Outbound Webhook
// Em Aplicações > Webhooks > Outbound:
// Handler URL: ${url}
// Eventos: ONCRMLEADADD, ONCRMCONTACTADD, etc.
// O Bitrix envia automaticamente data.FIELDS.* — ajuste field_mapping para extrair.`;

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
