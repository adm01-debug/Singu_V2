import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Bot, Copy } from 'lucide-react';
import { toast } from 'sonner';

export function McpInstructionsCard() {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const mcpUrl = `https://${projectId}.functions.supabase.co/mcp-server`;

  const claudeConfig = `{
  "mcpServers": {
    "singu-crm": {
      "url": "${mcpUrl}",
      "transport": "http",
      "headers": {
        "X-MCP-Token": "<seu-token-aqui>"
      }
    }
  }
}`;

  const copy = async (txt: string) => {
    try {
      await navigator.clipboard.writeText(txt);
      toast.success('Copiado');
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  return (
    <Alert>
      <Bot className="w-4 h-4" />
      <AlertTitle>Como conectar no Claude Desktop</AlertTitle>
      <AlertDescription className="space-y-3 text-xs mt-2">
        <p>
          1. Crie uma conexão abaixo, gere um token aleatório (32+ chars) e salve.<br />
          2. No Claude Desktop, edite <code>claude_desktop_config.json</code> e cole:
        </p>
        <div className="relative">
          <pre className="bg-muted/40 p-3 rounded font-mono overflow-x-auto text-[11px]">{claudeConfig}</pre>
          <Button
            size="sm" variant="ghost" className="absolute top-1 right-1"
            onClick={() => copy(claudeConfig)}
          ><Copy className="w-3.5 h-3.5" /></Button>
        </div>
        <p>
          3. Reinicie o Claude. As tools <code>search_contacts</code>, <code>search_companies</code> e
          <code>list_deals</code> ficarão disponíveis.
        </p>
      </AlertDescription>
    </Alert>
  );
}
