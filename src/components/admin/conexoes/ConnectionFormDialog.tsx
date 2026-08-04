import { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useConnections, type ConnectionType, type ConnectionConfig } from '@/hooks/useConnections';
import { Loader2, TestTube2, Save, Info } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  connectionType: ConnectionType;
  connectionId: string | null;
}

const FIELDS: Record<ConnectionType, Array<{ key: string; label: string; type?: string; placeholder?: string; secret?: boolean; help?: string }>> = {
  supabase_external: [
    { key: 'url', label: 'URL do Projeto', placeholder: 'https://xxx.supabase.co' },
    { key: 'project_ref', label: 'Project Ref', placeholder: 'xxxxxxxxxxxx' },
    { key: 'anon_key', label: 'Anon Key (publishable)', type: 'password' },
    { key: 'service_role_key', label: 'Service Role Key', type: 'password', secret: true,
      help: 'Será usada apenas pelo backend. Mantenha em sigilo.' },
    { key: 'database_url', label: 'Database URL (opcional)', type: 'password', secret: true,
      placeholder: 'postgres://…' },
  ],
  bitrix24: [
    { key: 'portal_url', label: 'Portal URL', placeholder: 'https://suaempresa.bitrix24.com.br' },
    { key: 'webhook_url', label: 'Webhook URL', placeholder: 'https://…/rest/1/abc123/' },
    { key: 'client_id', label: 'Client ID (OAuth, opcional)' },
    { key: 'client_secret', label: 'Client Secret (OAuth, opcional)', type: 'password', secret: true },
  ],
  n8n: [
    { key: 'instance_url', label: 'URL da Instância', placeholder: 'https://meu.n8n.cloud' },
    { key: 'webhook_url', label: 'Webhook URL', placeholder: 'https://…/webhook/abc' },
    { key: 'api_key', label: 'API Key (opcional)', type: 'password', secret: true },
  ],
  mcp_claude: [
    { key: 'token', label: 'Token MCP', help: 'Token compartilhado entre Claude e o servidor MCP. Gere algo aleatório com 32+ caracteres.' },
    { key: 'allowed_tools', label: 'Tools Permitidas (CSV)', placeholder: 'search_contacts,search_companies,list_deals' },
  ],
  custom: [
    { key: 'url', label: 'URL', placeholder: 'https://api.exemplo.com' },
    { key: 'method', label: 'Método HTTP', placeholder: 'GET' },
    { key: 'auth_header', label: 'Header de Autenticação', type: 'password', secret: true },
  ],
};

export function ConnectionFormDialog({ open, onOpenChange, connectionType, connectionId }: Props) {
  const { connections, upsert, test } = useConnections();
  const existing = connections.find(c => c.id === connectionId);

  const [name, setName] = useState(existing?.name ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [isActive, setIsActive] = useState(existing?.is_active ?? true);
  const [config, setConfig] = useState<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    for (const f of FIELDS[connectionType]) base[f.key] = String((existing?.config?.[f.key] as string) ?? '');
    return base;
  });

  const fields = FIELDS[connectionType];

  const handleSave = async () => {
    if (!name.trim()) return;
    await upsert.mutateAsync({
      id: connectionId ?? undefined,
      name: name.trim(),
      connection_type: connectionType,
      description: description.trim() || null,
      is_active: isActive,
      config: config as Record<string, unknown>,
    } as Partial<ConnectionConfig> & { name: string; connection_type: ConnectionType });
    onOpenChange(false);
  };

  const handleTest = async () => {
    await test.mutateAsync({
      connection_id: connectionId ?? undefined,
      connection_type: connectionType,
      config: config as Record<string, unknown>,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{connectionId ? 'Editar' : 'Nova'} conexão</DialogTitle>
          <DialogDescription>Configure as credenciais e teste antes de salvar.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Nome *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Produção / Cliente X" />
            </div>
            <div className="flex items-end gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} id="active" />
              <Label htmlFor="active">Ativa</Label>
            </div>
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea value={description ?? ''} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>

          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription className="text-xs">
              Credenciais sensíveis ficam armazenadas apenas no banco protegido por RLS de admin e nunca aparecem no frontend dos usuários comuns.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            {fields.map(f => (
              <div key={f.key}>
                <Label className="flex items-center gap-2">
                  {f.label}
                  {f.secret && <span className="text-xs text-amber-500">🔒 secreto</span>}
                </Label>
                <Input
                  type={f.type ?? 'text'}
                  value={config[f.key] ?? ''}
                  onChange={e => setConfig(c => ({ ...c, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  autoComplete="off"
                />
                {f.help && <p className="text-xs text-muted-foreground mt-1">{f.help}</p>}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleTest} disabled={test.isPending}>
            {test.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <TestTube2 className="w-4 h-4 mr-1" />}
            Testar
          </Button>
          <Button onClick={handleSave} disabled={upsert.isPending || !name.trim()}>
            {upsert.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
