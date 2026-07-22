import { useState } from 'react';
import { useSmsCampaigns, useSmsCampaignRecipients, useSmsTemplates } from '@/hooks/useSmsCampaigns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { MessageSquareText, Send, Plus, Trash2, FileText, AlertCircle, Loader2 } from 'lucide-react';

const SMS_LIMIT = 160;

function statusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'sent': case 'delivered': return 'default';
    case 'sending': case 'scheduled': return 'secondary';
    case 'failed': return 'destructive';
    default: return 'outline';
  }
}

export default function SmsMarketing() {
  const { campaigns, loading, createCampaign, sendCampaign, deleteCampaign, creating, sending } = useSmsCampaigns();
  const { templates, createTemplate, deleteTemplate } = useSmsTemplates();
  const [selected, setSelected] = useState<string | null>(null);
  const { data: recipients = [] } = useSmsCampaignRecipients(selected);

  const [newOpen, setNewOpen] = useState(false);
  const [tplOpen, setTplOpen] = useState(false);
  const [form, setForm] = useState({ name: '', message: '', sender_id: '' });
  const [tplForm, setTplForm] = useState({ name: '', body: '', category: '' });

  const selectedCampaign = campaigns.find(c => c.id === selected);

  const segments = Math.ceil((form.message.length || 1) / SMS_LIMIT);

  const handleCreate = async () => {
    if (!form.name || !form.message) return;
    await createCampaign({ ...form, sender_id: form.sender_id || undefined });
    setForm({ name: '', message: '', sender_id: '' });
    setNewOpen(false);
  };

  const handleCreateTpl = async () => {
    if (!tplForm.name || !tplForm.body) return;
    await createTemplate({ name: tplForm.name, body: tplForm.body, category: tplForm.category || undefined });
    setTplForm({ name: '', body: '', category: '' });
    setTplOpen(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquareText className="w-8 h-8 text-primary" />
            SMS Marketing
          </h1>
          <p className="text-muted-foreground mt-1">Campanhas SMS segmentadas com métricas em tempo real</p>
        </div>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Nova Campanha</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Nova Campanha SMS</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Black Friday — clientes VIP" />
              </div>
              <div>
                <Label>Sender ID / Número remetente</Label>
                <Input value={form.sender_id} onChange={(e) => setForm({ ...form, sender_id: e.target.value })} placeholder="+5511999998888 ou MARCA" />
              </div>
              <div>
                <Label>Mensagem</Label>
                <Textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={5}
                  placeholder="Olá {{first_name}}, oferta exclusiva..."
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Variáveis: {`{{first_name}}, {{last_name}}, {{full_name}}`}</span>
                  <span className={form.message.length > SMS_LIMIT ? 'text-warning font-semibold' : ''}>
                    {form.message.length} chars · {segments} segmento{segments !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              {templates.length > 0 && (
                <div>
                  <Label>Usar template</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {templates.map(t => (
                      <Button key={t.id} type="button" variant="outline" size="sm" onClick={() => setForm({ ...form, message: t.body })}>
                        {t.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={creating || !form.name || !form.message}>
                {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Criar campanha
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4 mt-4">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Carregando...</div>
          ) : campaigns.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquareText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Nenhuma campanha SMS criada ainda.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {campaigns.map(c => (
                <Card key={c.id} className="cursor-pointer hover:shadow-md transition" onClick={() => setSelected(c.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{c.name}</CardTitle>
                      <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
                    </div>
                    <CardDescription className="line-clamp-2 text-xs">{c.message}</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div><div className="font-semibold text-base">{c.total_recipients}</div><div className="text-muted-foreground">Alvos</div></div>
                    <div><div className="font-semibold text-base text-success">{c.total_sent}</div><div className="text-muted-foreground">Enviados</div></div>
                    <div><div className="font-semibold text-base text-destructive">{c.total_failed}</div><div className="text-muted-foreground">Falhas</div></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Dialog open={tplOpen} onOpenChange={setTplOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Plus className="w-4 h-4 mr-2" />Novo template</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Novo Template SMS</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Nome</Label><Input value={tplForm.name} onChange={(e) => setTplForm({ ...tplForm, name: e.target.value })} /></div>
                  <div><Label>Categoria</Label><Input value={tplForm.category} onChange={(e) => setTplForm({ ...tplForm, category: e.target.value })} placeholder="Promoção, Lembrete..." /></div>
                  <div><Label>Mensagem</Label><Textarea rows={4} value={tplForm.body} onChange={(e) => setTplForm({ ...tplForm, body: e.target.value })} /></div>
                </div>
                <DialogFooter><Button onClick={handleCreateTpl}>Salvar</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          {templates.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground"><FileText className="w-10 h-10 mx-auto mb-2" />Nenhum template ainda.</CardContent></Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {templates.map(t => (
                <Card key={t.id}>
                  <CardHeader className="pb-2 flex flex-row items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{t.name}</CardTitle>
                      {t.category && <Badge variant="outline" className="mt-1">{t.category}</Badge>}
                    </div>
                    <Button variant="ghost" size="icon" aria-label="Remover" onClick={() => deleteTemplate(t.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{t.body}</p>
                    {t.variables.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {t.variables.map(v => <Badge key={v} variant="secondary" className="text-xs">{`{{${v}}}`}</Badge>)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedCampaign && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center justify-between">
                  {selectedCampaign.name}
                  <Badge variant={statusVariant(selectedCampaign.status)}>{selectedCampaign.status}</Badge>
                </SheetTitle>
                <SheetDescription>{selectedCampaign.message}</SheetDescription>
              </SheetHeader>

              <div className="grid grid-cols-4 gap-3 mt-6">
                <Card><CardContent className="p-3 text-center"><div className="text-2xl font-bold">{selectedCampaign.total_recipients}</div><div className="text-xs text-muted-foreground">Destinatários</div></CardContent></Card>
                <Card><CardContent className="p-3 text-center"><div className="text-2xl font-bold text-success">{selectedCampaign.total_sent}</div><div className="text-xs text-muted-foreground">Enviados</div></CardContent></Card>
                <Card><CardContent className="p-3 text-center"><div className="text-2xl font-bold text-destructive">{selectedCampaign.total_failed}</div><div className="text-xs text-muted-foreground">Falhas</div></CardContent></Card>
                <Card><CardContent className="p-3 text-center"><div className="text-2xl font-bold">R$ {(selectedCampaign.cost_estimate_cents / 100).toFixed(2)}</div><div className="text-xs text-muted-foreground">Custo est.</div></CardContent></Card>
              </div>

              {selectedCampaign.status === 'draft' && (
                <div className="mt-6 space-y-3">
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-xs">
                    <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                    <span>O envio materializa todos os contatos com telefone, exclui opt-outs e dispara via provedor SMS (Twilio). Caso o provedor não esteja configurado, os destinatários ficam preparados aguardando o setup.</span>
                  </div>
                  <Button className="w-full" onClick={() => sendCampaign(selectedCampaign.id)} disabled={sending}>
                    {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    Materializar &amp; Enviar
                  </Button>
                </div>
              )}

              <div className="mt-6">
                <h3 className="font-semibold mb-2">Destinatários ({recipients.length})</h3>
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {recipients.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Nenhum destinatário ainda.</p>
                  ) : recipients.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-2 rounded border text-sm">
                      <span className="font-mono">{r.phone}</span>
                      <div className="flex items-center gap-2">
                        {r.error_message && <span className="text-xs text-destructive truncate max-w-[200px]" title={r.error_message}>{r.error_message}</span>}
                        <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button variant="destructive" size="sm" onClick={() => { deleteCampaign(selectedCampaign.id); setSelected(null); }}>
                  <Trash2 className="w-4 h-4 mr-2" />Excluir campanha
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
