import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useLuxWebhookConfig, type LuxWebhookConfig } from '@/hooks/useLuxWebhookConfig';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings, Play, Building2, User, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function WebhookConfigCard({ entityType, config, onSave, onToggle, onTest, testingType }: {
  entityType: 'contact' | 'company';
  config?: LuxWebhookConfig;
  onSave: (data: { entity_type: 'contact' | 'company'; webhook_url: string; timeout_ms: number; max_retries: number }) => void;
  onToggle: (id: string, active: boolean) => void;
  onTest: (entityType: string) => void;
  testingType: string | null;
}) {
  const [url, setUrl] = useState(config?.webhook_url || '');
  const [timeout, setTimeout_] = useState(config?.timeout_ms || 60000);
  const [retries, setRetries] = useState(config?.max_retries || 3);
  const Icon = entityType === 'company' ? Building2 : User;
  const label = entityType === 'company' ? 'Empresas' : 'Contatos';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Icon className="w-5 h-5" />
            Webhook — {label}
          </CardTitle>
          <div className="flex items-center gap-2">
            {config && (
              <Switch checked={config.is_active} onCheckedChange={(v) => onToggle(config.id, v)} />
            )}
            <Badge variant={config?.is_active ? 'default' : 'secondary'}>
              {config?.is_active ? 'Ativo' : config ? 'Inativo' : 'Não configurado'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>URL do Webhook (n8n)</Label>
          <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://n8n.example.com/webhook/..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Timeout (ms)</Label>
            <Input type="number" value={timeout} onChange={e => setTimeout_(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Max Retries</Label>
            <Input type="number" value={retries} onChange={e => setRetries(Number(e.target.value))} min={0} max={5} />
          </div>
        </div>

        {config?.last_test_at && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {config.last_test_status === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-destructive" />
            )}
            <span>Último teste: {formatDistanceToNow(new Date(config.last_test_at), { locale: ptBR, addSuffix: true })}</span>
            <Badge variant={config.last_test_status === 'success' ? 'default' : 'destructive'} className="text-xs">
              {config.last_test_status}
            </Badge>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button onClick={() => onSave({ entity_type: entityType, webhook_url: url, timeout_ms: timeout, max_retries: retries })}>
            Salvar
          </Button>
          {config && (
            <Button variant="outline" onClick={() => onTest(entityType)} disabled={testingType === entityType}>
              {testingType === entityType ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              Testar Webhook
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function LuxExecutionHistory() {
  const { data: records = [], isLoading: loading } = useQuery({
    queryKey: ['lux-intelligence-history-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lux_intelligence')
        .select('id, entity_type, entity_id, status, created_at, completed_at, error_message')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60_000,
    refetchOnWindowFocus: false,
  });

  if (loading) return <div className="text-sm text-muted-foreground py-4">Carregando histórico...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="w-5 h-5" />
          Últimas Execuções
        </CardTitle>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma execução registrada.</p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {records.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  {r.entity_type === 'company' ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  <div>
                    <p className="text-sm font-medium">{r.entity_type} — {r.entity_id.slice(0, 8)}...</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(r.created_at), { locale: ptBR, addSuffix: true })}
                    </p>
                  </div>
                </div>
                <Badge variant={r.status === 'completed' ? 'default' : r.status === 'error' ? 'destructive' : 'secondary'}>
                  {r.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminLuxConfig() {
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { configs, isLoading, upsert, toggleActive, testWebhook } = useLuxWebhookConfig();
  const [testingType, setTestingType] = useState<string | null>(null);

  if (adminLoading || isLoading) return <div className="p-8">Carregando...</div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  const contactConfig = configs.find(c => c.entity_type === 'contact');
  const companyConfig = configs.find(c => c.entity_type === 'company');

  const handleTest = async (entityType: string) => {
    setTestingType(entityType);
    try { await testWebhook.mutateAsync(entityType); } finally { setTestingType(null); }
  };

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Settings className="w-7 h-7 text-secondary" />
        <div>
          <h1 className="text-2xl font-bold">Lux Intelligence — Configuração</h1>
          <p className="text-sm text-muted-foreground">Gerencie webhooks n8n para enriquecimento de dados</p>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WebhookConfigCard
          entityType="company"
          config={companyConfig}
          onSave={(d) => upsert.mutate(d)}
          onToggle={(id, active) => toggleActive.mutate({ id, is_active: active })}
          onTest={handleTest}
          testingType={testingType}
        />
        <WebhookConfigCard
          entityType="contact"
          config={contactConfig}
          onSave={(d) => upsert.mutate(d)}
          onToggle={(id, active) => toggleActive.mutate({ id, is_active: active })}
          onTest={handleTest}
          testingType={testingType}
        />
      </div>

      <LuxExecutionHistory />
    </div>
  );
}
