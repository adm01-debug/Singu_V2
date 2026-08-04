import { useState } from 'react';
import { Zap, Plus, Trash2, Copy, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useCannedResponses } from '@/hooks/useCannedResponses';
import { toast } from 'sonner';

interface Props {
  onSelect?: (content: string) => void;
}

export function CannedResponsesPanel({ onSelect }: Props) {
  const { responses, create, use, remove } = useCannedResponses();
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category] = useState('geral');

  const filtered = responses.filter(r =>
    !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.content.toLowerCase().includes(search.toLowerCase())
  );

  const handleUse = async (id: string) => {
    const text = await use.mutateAsync(id);
    if (onSelect) {
      onSelect(text);
    } else {
      navigator.clipboard.writeText(text)
        .then(() => toast.success('Copiado para a área de transferência!'))
        .catch(() => toast.error('Não foi possível copiar'));
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Respostas Rápidas
          </span>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowNew(true)}>
            <Plus className="h-3 w-3 mr-1" /> Nova
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Buscar respostas..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
        </div>

        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">Nenhuma resposta rápida.</p>
          ) : (
            filtered.map(r => (
              <div key={r.id} className="flex items-center justify-between p-2 rounded border hover:bg-muted/30 transition-colors">
                <div className="min-w-0 flex-1 mr-2">
                  <p className="text-xs font-medium truncate">{r.title}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{r.content.substring(0, 80)}...</p>
                </div>
                <div className="flex gap-0.5 shrink-0">
                  <Badge variant="outline" className="text-[10px] h-4">{r.usage_count}×</Badge>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleUse(r.id)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => remove.mutate(r.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nova Resposta Rápida</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Título</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Boas-vindas ao suporte" className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Conteúdo</Label>
              <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Olá! Obrigado por entrar em contato..." className="text-xs min-h-[100px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)} className="text-xs">Cancelar</Button>
            <Button onClick={() => { create.mutate({ title, content, category }); setShowNew(false); setTitle(''); setContent(''); }} disabled={!title.trim() || !content.trim()} className="text-xs">Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
