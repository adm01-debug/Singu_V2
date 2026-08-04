import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Plug, Workflow, Bot, Webhook, Plus } from 'lucide-react';
import { useConnections, type ConnectionType } from '@/hooks/useConnections';
import { useIncomingWebhooks } from '@/hooks/useIncomingWebhooks';
import { ConnectionFormDialog } from '@/components/admin/conexoes/ConnectionFormDialog';
import { ConnectionCard } from '@/components/admin/conexoes/ConnectionCard';
import { IncomingWebhookCard } from '@/components/admin/conexoes/IncomingWebhookCard';
import { IncomingWebhookFormDialog } from '@/components/admin/conexoes/IncomingWebhookFormDialog';
import { McpInstructionsCard } from '@/components/admin/conexoes/McpInstructionsCard';

const TYPE_META: Record<ConnectionType, { label: string; icon: typeof Database; description: string }> = {
  supabase_external: { label: 'Supabase Externo', icon: Database, description: 'Bancos Supabase externos com chaves de serviço' },
  bitrix24:          { label: 'Bitrix24',         icon: Plug,     description: 'Webhooks REST do Bitrix24 (CRM/VOIP)' },
  n8n:               { label: 'n8n',              icon: Workflow, description: 'Workflows n8n via webhook URL' },
  mcp_claude:        { label: 'MCP Claude',       icon: Bot,      description: 'Servidor MCP exposto para o Claude Desktop' },
  custom:            { label: 'Custom',           icon: Plug,     description: 'Endpoints HTTP genéricos' },
};

export default function AdminConexoes() {
  const { connections, isLoading } = useConnections();
  const { webhooks } = useIncomingWebhooks();
  const [editingType, setEditingType] = useState<ConnectionType | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showWebhookDialog, setShowWebhookDialog] = useState(false);
  const [editingWebhookId, setEditingWebhookId] = useState<string | null>(null);

  const byType = (t: ConnectionType) => connections.filter(c => c.connection_type === t);

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Conexões</h1>
            <p className="text-muted-foreground">
              Central de integrações: bancos externos, Bitrix24, n8n, MCP do Claude e webhooks entrantes.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <a href="/admin/conexoes/logs">Ver logs unificados</a>
          </Button>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {(Object.keys(TYPE_META) as ConnectionType[]).map(t => {
            const meta = TYPE_META[t];
            const count = byType(t).length;
            const active = byType(t).filter(c => c.is_active).length;
            const Icon = meta.icon;
            return (
              <Card key={t} className="border-border/60">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{meta.label}</p>
                    <p className="text-lg font-semibold leading-none">{active}/{count}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs defaultValue="supabase_external" className="space-y-4">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="supabase_external"><Database className="w-4 h-4 mr-2" />Supabase</TabsTrigger>
            <TabsTrigger value="bitrix24"><Plug className="w-4 h-4 mr-2" />Bitrix24</TabsTrigger>
            <TabsTrigger value="n8n"><Workflow className="w-4 h-4 mr-2" />n8n</TabsTrigger>
            <TabsTrigger value="mcp_claude"><Bot className="w-4 h-4 mr-2" />MCP Claude</TabsTrigger>
            <TabsTrigger value="webhooks"><Webhook className="w-4 h-4 mr-2" />Webhooks Entrantes</TabsTrigger>
          </TabsList>

          {(['supabase_external', 'bitrix24', 'n8n', 'mcp_claude'] as ConnectionType[]).map(t => {
            const meta = TYPE_META[t];
            return (
              <TabsContent key={t} value={t} className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <div>
                      <CardTitle>{meta.label}</CardTitle>
                      <CardDescription>{meta.description}</CardDescription>
                    </div>
                    <Button onClick={() => { setEditingType(t); setEditingId(null); }} size="sm">
                      <Plus className="w-4 h-4 mr-1" />Nova
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {t === 'mcp_claude' && <McpInstructionsCard />}
                    {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
                    {!isLoading && byType(t).length === 0 && (
                      <p className="text-sm text-muted-foreground py-8 text-center border border-dashed border-border/60 rounded-md">
                        Nenhuma conexão {meta.label} cadastrada ainda.
                      </p>
                    )}
                    {byType(t).map(conn => (
                      <ConnectionCard
                        key={conn.id}
                        connection={conn}
                        onEdit={() => { setEditingType(conn.connection_type); setEditingId(conn.id); }}
                      />
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}

          <TabsContent value="webhooks" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle>Webhooks Entrantes</CardTitle>
                  <CardDescription>
                    URLs públicas que outros sistemas (Lovable, n8n, Zapier…) usam para enviar dados ao SINGU.
                  </CardDescription>
                </div>
                <Button onClick={() => { setEditingWebhookId(null); setShowWebhookDialog(true); }} size="sm">
                  <Plus className="w-4 h-4 mr-1" />Novo
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {webhooks.length === 0 && (
                  <p className="text-sm text-muted-foreground py-8 text-center border border-dashed border-border/60 rounded-md">
                    Nenhum webhook cadastrado. Crie um para começar a receber dados de outros sistemas.
                  </p>
                )}
                {webhooks.map(w => (
                  <IncomingWebhookCard
                    key={w.id}
                    webhook={w}
                    onEdit={() => { setEditingWebhookId(w.id); setShowWebhookDialog(true); }}
                  />
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {editingType && (
          <ConnectionFormDialog
            open={!!editingType}
            onOpenChange={(o) => { if (!o) { setEditingType(null); setEditingId(null); } }}
            connectionType={editingType}
            connectionId={editingId}
          />
        )}

        {showWebhookDialog && (
          <IncomingWebhookFormDialog
            open={showWebhookDialog}
            onOpenChange={(o) => { setShowWebhookDialog(o); if (!o) setEditingWebhookId(null); }}
            webhookId={editingWebhookId}
          />
        )}
      </div>
    </AdminLayout>
  );
}
