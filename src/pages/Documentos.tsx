import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { FileText, Plus, Edit, Trash2, Send, Copy, Eye, CheckCircle2, Clock, XCircle, Search } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/navigation/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import {
  useDocumentTemplates,
  useDocumentSignatures,
  extractMergeFields,
  renderMergeFields,
  type DocumentTemplate,
} from '@/hooks/useDocumentTemplates';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  pending: { label: 'Pendente', icon: Clock, color: 'text-muted-foreground' },
  viewed: { label: 'Visualizado', icon: Eye, color: 'text-blue-500' },
  signed: { label: 'Assinado', icon: CheckCircle2, color: 'text-green-500' },
  declined: { label: 'Recusado', icon: XCircle, color: 'text-destructive' },
  expired: { label: 'Expirado', icon: XCircle, color: 'text-muted-foreground' },
};

export default function Documentos() {
  const { templates, isLoading: loadingTpl, create, update, remove, defaultFields } = useDocumentTemplates();
  const { signatures, isLoading: loadingSig, sendForSignature, cancel, stats } = useDocumentSignatures();

  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<DocumentTemplate | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [showSend, setShowSend] = useState<DocumentTemplate | null>(null);

  // Template form
  const [tplName, setTplName] = useState('');
  const [tplDescription, setTplDescription] = useState('');
  const [tplCategory, setTplCategory] = useState('');
  const [tplContent, setTplContent] = useState('');

  // Send form
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [mergeData, setMergeData] = useState<Record<string, string>>({});

  const detectedFields = useMemo(() => extractMergeFields(tplContent), [tplContent]);

  const filteredTemplates = useMemo(() => {
    if (!search) return templates;
    const q = search.toLowerCase();
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q) ||
        (t.category ?? '').toLowerCase().includes(q)
    );
  }, [templates, search]);

  const openNew = () => {
    setEditing(null);
    setTplName('');
    setTplDescription('');
    setTplCategory('');
    setTplContent('');
    setShowNew(true);
  };

  const openEdit = (t: DocumentTemplate) => {
    setEditing(t);
    setTplName(t.name);
    setTplDescription(t.description ?? '');
    setTplCategory(t.category ?? '');
    setTplContent(t.content_html);
    setShowNew(true);
  };

  const handleSaveTemplate = () => {
    if (!tplName.trim() || !tplContent.trim()) {
      toast.error('Preencha nome e conteúdo');
      return;
    }
    if (editing) {
      update.mutate(
        {
          id: editing.id,
          name: tplName,
          description: tplDescription || null,
          category: tplCategory || null,
          content_html: tplContent,
        },
        { onSuccess: () => setShowNew(false) }
      );
    } else {
      create.mutate(
        {
          name: tplName,
          description: tplDescription || null,
          category: tplCategory || null,
          content_html: tplContent,
        },
        { onSuccess: () => setShowNew(false) }
      );
    }
  };

  const openSend = (t: DocumentTemplate) => {
    setShowSend(t);
    setSignerName('');
    setSignerEmail('');
    const init: Record<string, string> = {};
    for (const f of t.merge_fields) init[f] = '';
    setMergeData(init);
  };

  const handleSend = () => {
    if (!showSend || !signerName.trim() || !signerEmail.trim()) {
      toast.error('Preencha nome e email do signatário');
      return;
    }
    const rendered = renderMergeFields(showSend.content_html, mergeData);
    sendForSignature.mutate(
      {
        template_id: showSend.id,
        signer_name: signerName,
        signer_email: signerEmail,
        rendered_html: rendered,
        merge_data: mergeData,
        expires_in_days: 30,
      },
      {
        onSuccess: () => {
          setShowSend(null);
        },
      }
    );
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/signature/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  };

  return (
    <AppLayout>
      <Helmet>
        <title>Documentos & Assinaturas | SINGU CRM</title>
        <meta name="description" content="Gerencie templates de contratos, NDAs e propostas com assinatura eletrônica integrada." />
      </Helmet>

      <PageHeader
        title="Documentos & Assinaturas"
        actions={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" />
            Novo template
          </Button>
        }
      />

      <Tabs defaultValue="templates" className="mt-6">
        <TabsList>
          <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
          <TabsTrigger value="signatures">Assinaturas ({signatures.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {loadingTpl ? (
            <div className="text-sm text-muted-foreground">Carregando...</div>
          ) : filteredTemplates.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum template encontrado.</p>
                <Button variant="outline" className="mt-4" onClick={openNew}>
                  Criar primeiro template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((t) => (
                <Card key={t.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base line-clamp-2">{t.name}</CardTitle>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {t.document_type}
                      </Badge>
                    </div>
                    {t.category && <p className="text-xs text-muted-foreground">{t.category}</p>}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {t.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {t.merge_fields.slice(0, 3).map((f) => (
                        <Badge key={f} variant="secondary" className="text-xs">
                          {f.replace(/[{}]/g, '')}
                        </Badge>
                      ))}
                      {t.merge_fields.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{t.merge_fields.length - 3}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{t.usage_count} envio(s)</span>
                      <span>
                        {formatDistanceToNow(new Date(t.updated_at), { locale: ptBR, addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex gap-1 pt-2 border-t">
                      <Button size="sm" variant="default" className="flex-1" onClick={() => openSend(t)}>
                        <Send className="h-3 w-3 mr-1" />
                        Enviar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEdit(t)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm('Remover template?')) remove.mutate(t.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="signatures" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard label="Total" value={stats.total} />
            <StatCard label="Pendentes" value={stats.pending} color="text-muted-foreground" />
            <StatCard label="Visualizados" value={stats.viewed} color="text-blue-500" />
            <StatCard label="Assinados" value={stats.signed} color="text-green-500" />
            <StatCard label="Taxa" value={`${stats.signedRate}%`} color="text-primary" />
          </div>

          {loadingSig ? (
            <div className="text-sm text-muted-foreground">Carregando...</div>
          ) : signatures.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                Nenhum documento enviado ainda.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {signatures.map((s) => {
                    const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.pending;
                    const Icon = cfg.icon;
                    return (
                      <div key={s.id} className="p-4 flex items-center gap-3">
                        <Icon className={`h-5 w-5 shrink-0 ${cfg.color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{s.signer_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{s.signer_email}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {cfg.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          {formatDistanceToNow(new Date(s.created_at), { locale: ptBR, addSuffix: true })}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyLink(s.signature_token)}
                          title="Copiar link"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        {(s.status === 'pending' || s.status === 'viewed') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm('Cancelar este envio?')) cancel.mutate(s.id);
                            }}
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Template editor */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar template' : 'Novo template'}</DialogTitle>
            <DialogDescription>
              Use variáveis como <code className="text-primary">{'{{contato.nome}}'}</code> que serão substituídas no envio.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label>Nome *</Label>
                <Input value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="Contrato de Prestação" />
              </div>
              <div>
                <Label>Categoria</Label>
                <Input value={tplCategory} onChange={(e) => setTplCategory(e.target.value)} placeholder="Comercial" />
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Input
                value={tplDescription}
                onChange={(e) => setTplDescription(e.target.value)}
                placeholder="Modelo padrão de contrato anual"
              />
            </div>
            <div>
              <Label>Conteúdo HTML *</Label>
              <Textarea
                value={tplContent}
                onChange={(e) => setTplContent(e.target.value)}
                rows={12}
                className="font-mono text-xs"
                placeholder={`<h1>Contrato</h1>\n<p>Entre {{empresa.nome}} e {{contato.nome}}...</p>`}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Variáveis sugeridas (clique para inserir):</Label>
              <div className="flex flex-wrap gap-1">
                {defaultFields.map((f) => (
                  <Badge
                    key={f}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent text-xs"
                    onClick={() => setTplContent((prev) => prev + ' ' + f)}
                  >
                    {f}
                  </Badge>
                ))}
              </div>
              {detectedFields.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Detectadas no template: {detectedFields.join(', ')}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveTemplate}>{editing ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send for signature */}
      <Dialog open={!!showSend} onOpenChange={(o) => !o && setShowSend(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enviar para assinatura</DialogTitle>
            <DialogDescription>{showSend?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label>Nome do signatário *</Label>
                <Input value={signerName} onChange={(e) => setSignerName(e.target.value)} />
              </div>
              <div>
                <Label>Email *</Label>
                <Input type="email" value={signerEmail} onChange={(e) => setSignerEmail(e.target.value)} />
              </div>
            </div>
            {showSend && showSend.merge_fields.length > 0 && (
              <div className="space-y-2 border-t pt-3">
                <Label>Preencher variáveis</Label>
                <div className="grid md:grid-cols-2 gap-2">
                  {showSend.merge_fields.map((f) => (
                    <div key={f}>
                      <Label className="text-xs">{f.replace(/[{}]/g, '')}</Label>
                      <Input
                        value={mergeData[f] ?? ''}
                        onChange={(e) => setMergeData((prev) => ({ ...prev, [f]: e.target.value }))}
                        placeholder={f}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSend(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSend} disabled={sendForSignature.isPending}>
              <Send className="h-4 w-4 mr-2" />
              Enviar para assinatura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-2xl font-bold ${color ?? ''}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
