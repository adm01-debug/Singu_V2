import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Navigate } from 'react-router-dom';
import { EmptyState } from '@/components/ui/empty-state';
import { ExternalDataCard } from '@/components/ui/external-data-card';
import { Inbox, Sparkles, AlertTriangle, CheckCircle2, Loader2, Database, Trash2, Star } from 'lucide-react';
import { useActionToast } from '@/hooks/useActionToast';
import { CircuitOpenError } from '@/lib/circuitBreaker';

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export default function ComponentGallery() {
  const { isAdmin, isLoading } = useIsAdmin();
  const [variant, setVariant] = useState<ButtonVariant>('default');
  const [size, setSize] = useState<ButtonSize>('default');
  const [disabled, setDisabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [badgeText, setBadgeText] = useState('Novo');
  const toast = useActionToast();

  if (isLoading) return <AppLayout><div className="p-8">Carregando…</div></AppLayout>;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Component Gallery</h1>
          <p className="text-muted-foreground">
            Storybook-lite: variantes vivas das primitivas críticas para QA visual e onboarding.
          </p>
        </header>

        <Tabs defaultValue="button" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="button">Button</TabsTrigger>
            <TabsTrigger value="card">Card</TabsTrigger>
            <TabsTrigger value="badge">Badge</TabsTrigger>
            <TabsTrigger value="empty">EmptyState</TabsTrigger>
            <TabsTrigger value="toast">ActionToast</TabsTrigger>
            <TabsTrigger value="loaders">Loaders</TabsTrigger>
            <TabsTrigger value="external">ExternalDataCard</TabsTrigger>
            <TabsTrigger value="bulk">BulkActionsBar</TabsTrigger>
          </TabsList>

          {/* Button */}
          <TabsContent value="button">
            <Card>
              <CardHeader>
                <CardTitle>Button</CardTitle>
                <CardDescription>Variantes, tamanhos, estados.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border rounded-lg bg-muted/30">
                  <div className="space-y-2">
                    <Label>Variant</Label>
                    <select
                      value={variant}
                      onChange={(e) => setVariant(e.target.value as ButtonVariant)}
                      className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                    >
                      {(['default','destructive','outline','secondary','ghost','link'] as ButtonVariant[]).map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Size</Label>
                    <select
                      value={size}
                      onChange={(e) => setSize(e.target.value as ButtonSize)}
                      className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                    >
                      {(['default','sm','lg','icon'] as ButtonSize[]).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Switch checked={disabled} onCheckedChange={setDisabled} id="disabled" />
                    <Label htmlFor="disabled">Disabled</Label>
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Switch checked={loading} onCheckedChange={setLoading} id="loading" />
                    <Label htmlFor="loading">Loading</Label>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 p-6 border rounded-lg">
                  <Button variant={variant} size={size} disabled={disabled || loading}>
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {size === 'icon' ? <Sparkles className="w-4 h-4" /> : 'Botão'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Card */}
          <TabsContent value="card" className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Card padrão</CardTitle>
                <CardDescription>Usado em listas e dashboards.</CardDescription>
              </CardHeader>
              <CardContent>Conteúdo do card.</CardContent>
            </Card>
            <Card className="border-primary">
              <CardHeader>
                <CardTitle>Card destacado</CardTitle>
                <CardDescription>border-primary para chamar atenção.</CardDescription>
              </CardHeader>
              <CardContent>Variant alternativa.</CardContent>
            </Card>
          </TabsContent>

          {/* Badge */}
          <TabsContent value="badge">
            <Card>
              <CardHeader><CardTitle>Badge</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Input
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  placeholder="Texto do badge"
                  className="max-w-xs"
                />
                <div className="flex flex-wrap gap-2">
                  <Badge>{badgeText}</Badge>
                  <Badge variant="secondary">{badgeText}</Badge>
                  <Badge variant="destructive">{badgeText}</Badge>
                  <Badge variant="outline">{badgeText}</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* EmptyState */}
          <TabsContent value="empty">
            <Card>
              <CardHeader><CardTitle>EmptyState</CardTitle></CardHeader>
              <CardContent>
                <EmptyState
                  icon={Inbox}
                  title="Nenhum item por aqui"
                  description="Quando houver dados, eles aparecerão neste painel."
                  actions={[{ label: 'Adicionar primeiro item', onClick: () => toast.success('Ação disparada') }]}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ActionToast */}
          <TabsContent value="toast">
            <Card>
              <CardHeader>
                <CardTitle>ActionToast</CardTitle>
                <CardDescription>Wrapper sobre sonner com semântica de ação.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button onClick={() => toast.success('Salvo com sucesso')}>
                  <CheckCircle2 className="w-4 h-4 mr-2" /> success
                </Button>
                <Button variant="secondary" onClick={() => toast.info('Operação em andamento')}>
                  info
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => toast.destructive({
                    message: 'Item excluído',
                    onUndo: () => toast.success('Restaurado'),
                  })}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" /> destructive (com undo)
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Loaders */}
          <TabsContent value="loaders">
            <Card>
              <CardHeader><CardTitle>Loaders</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap items-center gap-6">
                <div role="status" aria-live="polite" className="flex items-center gap-2 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Carregando…
                </div>
                <div className="h-2 w-48 bg-muted rounded animate-pulse" aria-hidden="true" />
                <div className="h-12 w-12 rounded-full bg-muted animate-pulse" aria-hidden="true" />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ExternalDataCard — 5 estados */}
          <TabsContent value="external" className="grid md:grid-cols-2 gap-4">
            <ExternalDataCard title="Loading" icon={<Database className="h-4 w-4" />} isLoading>
              <div />
            </ExternalDataCard>
            <ExternalDataCard
              title="Circuit Open"
              icon={<Database className="h-4 w-4" />}
              error={new CircuitOpenError('external-data', 30000)}
            >
              <div />
            </ExternalDataCard>
            <ExternalDataCard
              title="Erro genérico"
              icon={<Database className="h-4 w-4" />}
              error={new Error('Falha ao buscar dados')}
              onRetry={() => toast.info('Retry disparado')}
            >
              <div />
            </ExternalDataCard>
            <ExternalDataCard
              title="Empty"
              icon={<Database className="h-4 w-4" />}
              hasData={false}
              emptyMessage="Sem dados para exibir"
            >
              <div />
            </ExternalDataCard>
            <ExternalDataCard title="Com dados" icon={<Database className="h-4 w-4" />} hasData>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Receita do mês</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">R$ 124.500</p></CardContent>
              </Card>
            </ExternalDataCard>
          </TabsContent>

          {/* BulkActionsBar mock */}
          <TabsContent value="bulk">
            <Card>
              <CardHeader>
                <CardTitle>BulkActionsBar</CardTitle>
                <CardDescription>Barra fixa de ações em lote (mock estático).</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3 shadow-sm">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary">12 selecionados</Badge>
                    <span className="text-muted-foreground">de 247</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="gap-1">
                      <Star className="h-4 w-4" /> Favoritar
                    </Button>
                    <Button size="sm" variant="outline">Mover</Button>
                    <Button size="sm" variant="destructive" className="gap-1">
                      <Trash2 className="h-4 w-4" /> Excluir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
