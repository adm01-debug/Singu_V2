import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { BookOpen, Plus, Search, Tag, Trash2, Edit, Eye, ThumbsUp, ChevronDown } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/navigation/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useKnowledgeBase, KBArticle } from '@/hooks/useKnowledgeBase';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DEFAULT_CATEGORIES = ['geral', 'vendas', 'produto', 'processos', 'onboarding', 'faq'];

export default function KnowledgeBase() {
  const { articles, isLoading, create, update, remove, categories } = useKnowledgeBase();
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<KBArticle | null>(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('geral');
  const [tagsInput, setTagsInput] = useState('');

  const allCategories = [...new Set([...DEFAULT_CATEGORIES, ...categories])];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return articles.filter(a => {
      if (catFilter !== 'all' && a.category !== catFilter) return false;
      if (q && !a.title.toLowerCase().includes(q) && !a.content.toLowerCase().includes(q) && !a.tags.some(t => t.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [articles, catFilter, search]);

  const openEditor = (article?: KBArticle) => {
    if (article) {
      setEditing(article);
      setTitle(article.title);
      setContent(article.content);
      setCategory(article.category);
      setTagsInput(article.tags.join(', '));
    } else {
      setEditing(null);
      setTitle(''); setContent(''); setCategory('geral'); setTagsInput('');
    }
    setShowEditor(true);
  };

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    if (editing) {
      update.mutate({ id: editing.id, title, content, category, tags });
    } else {
      create.mutate({ title, content, category, tags });
    }
    setShowEditor(false);
  };

  return (
    <AppLayout>
      <Helmet>
        <title>Knowledge Base | SINGU</title>
        <meta name="description" content="Base de conhecimento interna — artigos, processos e FAQs para a equipe." />
      </Helmet>
      <div className="min-h-screen p-4 md:p-6 space-y-4">
        <PageHeader backTo="/" backLabel="Dashboard" title="Knowledge Base" />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Artigos', value: articles.length, icon: BookOpen },
            { label: 'Categorias', value: allCategories.length, icon: Tag },
            { label: 'Visualizações', value: articles.reduce((s, a) => s + a.views_count, 0), icon: Eye },
            { label: 'Úteis', value: articles.reduce((s, a) => s + a.helpful_count, 0), icon: ThumbsUp },
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

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Buscar artigos..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
          </div>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Todas categorias</SelectItem>
              {allCategories.map(c => <SelectItem key={c} value={c} className="text-xs capitalize">{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => openEditor()} className="h-8 text-xs">
            <Plus className="h-3 w-3 mr-1" /> Novo Artigo
          </Button>
        </div>

        {/* Articles */}
        <div className="space-y-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum artigo encontrado.</p>
          ) : (
            filtered.map(article => (
              <Collapsible
                key={article.id}
                open={expandedId === article.id}
                onOpenChange={open => setExpandedId(open ? article.id : null)}
              >
                <Card>
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <BookOpen className="h-4 w-4 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{article.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge variant="secondary" className="text-[10px] h-4 capitalize">{article.category}</Badge>
                            {article.tags.slice(0, 3).map(t => (
                              <Badge key={t} variant="outline" className="text-[10px] h-4">{t}</Badge>
                            ))}
                            <span className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(article.updated_at), { addSuffix: true, locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Eye className="h-3 w-3" />{article.views_count}</span>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedId === article.id ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 pb-3 px-4 border-t">
                      <div className="prose prose-sm max-w-none text-xs text-muted-foreground whitespace-pre-wrap mt-2">
                        {article.content}
                      </div>
                      <div className="flex gap-1 mt-3">
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openEditor(article)}>
                          <Edit className="h-3 w-3 mr-1" /> Editar
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => remove.mutate(article.id)}>
                          <Trash2 className="h-3 w-3 mr-1" /> Excluir
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => update.mutate({ id: article.id, helpful_count: article.helpful_count + 1 })}>
                          <ThumbsUp className="h-3 w-3 mr-1" /> Útil ({article.helpful_count})
                        </Button>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))
          )}
        </div>

        {/* Editor Dialog */}
        <Dialog open={showEditor} onOpenChange={setShowEditor}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? 'Editar Artigo' : 'Novo Artigo'}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Título</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Como qualificar um lead" className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Categoria</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {allCategories.map(c => <SelectItem key={c} value={c} className="text-xs capitalize">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Tags (separadas por vírgula)</Label>
                <Input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="vendas, qualificação, BANT" className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Conteúdo</Label>
                <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Escreva o conteúdo do artigo..." className="text-xs min-h-[180px]" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditor(false)} className="text-xs">Cancelar</Button>
              <Button onClick={handleSave} disabled={!title.trim() || !content.trim()} className="text-xs">
                {editing ? 'Salvar' : 'Criar Artigo'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
