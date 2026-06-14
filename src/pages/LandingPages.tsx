 import { useState, useMemo } from 'react';
 import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
 import { Plus, Globe, Eye, Trash2, ExternalLink, Copy, BarChart3, FileText, Layout } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useLandingPages, useLandingPageSubmissions, type LandingPage } from '@/hooks/useLandingPages';
import { EmailBuilder } from '@/components/email-builder/EmailBuilder';
import type { EmailBlock } from '@/components/email-builder/types';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function LandingPages() {
  const { pages, isLoading, create, update, remove, togglePublish } = useLandingPages();
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<LandingPage | null>(null);
  const [viewingSubs, setViewingSubs] = useState<LandingPage | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const { data: submissions = [] } = useLandingPageSubmissions(viewingSubs?.id);

  const stats = useMemo(() => ({
    total: pages.length,
    published: pages.filter(p => p.is_published).length,
    views: pages.reduce((s, p) => s + p.view_count, 0),
    subs: pages.reduce((s, p) => s + p.submission_count, 0),
  }), [pages]);

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    create.mutate(
      { title: newTitle.trim(), slug: newSlug.trim() || undefined, description: newDesc.trim() || null },
      {
        onSuccess: (page) => {
          setShowNew(false);
          setNewTitle(''); setNewSlug(''); setNewDesc('');
          if (page) setEditing(page);
        },
      }
    );
  };

  const copyUrl = (slug: string) => {
    const url = `${window.location.origin}/lp/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('URL copiada!');
  };

  return (
    <AppLayout>
      <Helmet>
        <title>Landing Pages | SINGU</title>
        <meta name="description" content="Crie landing pages com formulários para capturar leads." />
      </Helmet>
       <div className="min-h-screen p-4 md:p-6 space-y-6">
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-6">
           <div className="space-y-1">
             <div className="flex items-center gap-2 mb-1">
               <div className="p-1.5 rounded-lg bg-primary/10">
                 <Layout className="w-5 h-5 text-primary" />
               </div>
               <h1 className="text-2xl font-bold tracking-tight">Landing Pages</h1>
             </div>
             <p className="text-sm text-muted-foreground max-w-2xl">
               Crie páginas de alta conversão integradas ao ecossistema SINGU.
               Capture leads e acione automações instantaneamente.
             </p>
           </div>
           <div className="flex items-center gap-2">
             <Button asChild variant="outline" size="sm" className="gap-2 h-9">
               <Link to="/marketing">
                 <BarChart3 className="w-4 h-4" /> Marketing Hub
               </Link>
             </Button>
             <Button asChild variant="outline" size="sm" className="gap-2 h-9 text-primary border-primary/20 bg-primary/5">
               <Link to="/landing-pages">
                 <Layout className="w-4 h-4" /> Landing Pages
               </Link>
             </Button>
           </div>
         </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: stats.total, icon: FileText },
            { label: 'Publicadas', value: stats.published, icon: Globe },
            { label: 'Visualizações', value: stats.views, icon: Eye },
            { label: 'Leads capturados', value: stats.subs, icon: BarChart3 },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-3 flex items-center gap-3">
                <s.icon className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowNew(true)} className="h-8 text-xs">
            <Plus className="h-3 w-3 mr-1" /> Nova Landing Page
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
            ) : pages.length === 0 ? (
              <div className="text-center py-12">
                <Globe className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma landing page criada ainda.</p>
              </div>
            ) : (
              <div className="divide-y">
                {pages.map(p => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{p.title}</p>
                        <Badge variant={p.is_published ? 'default' : 'secondary'} className="text-[10px]">
                          {p.is_published ? 'Publicada' : 'Rascunho'}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                        /lp/{p.slug} · {p.view_count} views · {p.submission_count} leads · atualizada {formatDistanceToNow(new Date(p.updated_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Copiar URL" onClick={() => copyUrl(p.slug)}>
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      {p.is_published && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Abrir" asChild>
                          <a href={`/lp/${p.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="w-3.5 h-3.5" /></a>
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setViewingSubs(p)}>
                        <BarChart3 className="w-3.5 h-3.5 mr-1" /> Leads
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setEditing(p)}>
                        Editar
                      </Button>
                      <div className="flex items-center gap-1 px-2">
                        <Switch
                          checked={p.is_published}
                          onCheckedChange={(v) => togglePublish.mutate({ id: p.id, publish: v })}
                        />
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => remove.mutate(p.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* New */}
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Nova Landing Page</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">Título</Label><Input value={newTitle} onChange={e => setNewTitle(e.target.value)} className="h-8 text-xs" placeholder="Ex: Captação Webinar Maio" /></div>
              <div><Label className="text-xs">Slug (opcional)</Label><Input value={newSlug} onChange={e => setNewSlug(e.target.value)} className="h-8 text-xs" placeholder="webinar-maio" /></div>
              <div><Label className="text-xs">Descrição</Label><Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} className="text-xs min-h-[60px]" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNew(false)} className="text-xs">Cancelar</Button>
              <Button onClick={handleCreate} disabled={!newTitle.trim() || create.isPending} className="text-xs">Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Editor */}
        <Sheet open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }}>
          <SheetContent className="w-full sm:max-w-5xl overflow-y-auto">
            {editing && (
              <LandingPageEditor
                page={editing}
                onSave={(blocks, theme) => update.mutate({ id: editing.id, blocks: blocks as never, theme: theme as never })}
                isSaving={update.isPending}
              />
            )}
          </SheetContent>
        </Sheet>

        {/* Submissions */}
        <Sheet open={!!viewingSubs} onOpenChange={(o) => { if (!o) setViewingSubs(null); }}>
          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
            <SheetHeader><SheetTitle>Leads capturados — {viewingSubs?.title}</SheetTitle></SheetHeader>
            <div className="mt-4 space-y-2">
              {submissions.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">Nenhum lead capturado ainda.</p>
              ) : submissions.map(s => (
                <div key={s.id} className="border rounded p-2 text-xs">
                  <p className="font-medium">{s.name || s.email || 'Anônimo'}</p>
                  <p className="text-muted-foreground">{s.email} {s.phone && `· ${s.phone}`}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(s.created_at), { addSuffix: true, locale: ptBR })}
                    {s.utm_source && ` · ${s.utm_source}/${s.utm_medium ?? '—'}`}
                  </p>
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </AppLayout>
  );
}

function LandingPageEditor({ page, onSave, isSaving }: { page: LandingPage; onSave: (b: EmailBlock[], theme: Record<string, unknown>) => void; isSaving: boolean }) {
  const [blocks, setBlocks] = useState<EmailBlock[]>((page.blocks as unknown as EmailBlock[]) ?? []);
  const [theme] = useState<Record<string, unknown>>(page.theme ?? {});

  return (
    <div className="space-y-3">
      <SheetHeader>
        <SheetTitle>Editor — {page.title}</SheetTitle>
      </SheetHeader>
      <div className="rounded border bg-primary/5 border-primary/20 p-2 text-[10px] text-muted-foreground">
        URL pública: <code className="text-primary">/lp/{page.slug}</code> — adicione um bloco de "Botão" com URL <code>#form</code> ou um bloco "Texto" para guiar o lead. O formulário de captura é renderizado automaticamente no rodapé da página pública.
      </div>
      <EmailBuilder blocks={blocks} onBlocksChange={setBlocks} />
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button onClick={() => onSave(blocks, theme)} disabled={isSaving} size="sm">
          {isSaving ? 'Salvando…' : 'Salvar alterações'}
        </Button>
      </div>
    </div>
  );
}
