import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Star, Save, Trash2, Share2, Bookmark, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { SavedView } from '@/hooks/useSavedViews';

interface Props<T> {
  scope: string;
  views: SavedView<T>[];
  currentState: T;
  onSave: (name: string, state: T) => SavedView<T>;
  onApply: (view: SavedView<T>) => void;
  onRemove: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onSetDefault: (id: string) => void;
  shareUrl: (view: SavedView<T>) => string;
  className?: string;
}

export function SavedViewsBar<T>({
  views, currentState, onSave, onApply, onRemove,
  onToggleFavorite, onSetDefault, shareUrl, className,
}: Props<T>) {
  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState('');

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Dê um nome à view');
      return;
    }
    onSave(trimmed, currentState);
    toast.success(`View "${trimmed}" salva`);
    setName('');
    setSaveOpen(false);
  };

  const handleShare = (view: SavedView<T>) => {
    const url = shareUrl(view);
    if (!url) {
      toast.error('Não foi possível gerar link');
      return;
    }
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url)
        .then(() => toast.success('Link copiado para a área de transferência'))
        .catch(() => toast.error('Não foi possível copiar'));
    } else {
      toast.info(url);
    }
  };

  const favorites = views.filter((v) => v.isFavorite);

  return (
    <div className={cn('flex items-center gap-2', className)} data-density-aware>
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="gap-1.5 h-8">
            <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="text-xs">Views</span>
            {views.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">
                {views.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="border-b px-3 py-2">
            <p className="text-xs font-semibold">Views salvas</p>
            <p className="text-[11px] text-muted-foreground">
              Salve combinações de filtros + colunas e compartilhe via URL
            </p>
          </div>
          <div className="max-h-72 overflow-y-auto p-1">
            {views.length === 0 && (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                Nenhuma view salva ainda
              </div>
            )}
            {favorites.length > 0 && (
              <div className="px-2 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Favoritas
              </div>
            )}
            {[...favorites, ...views.filter((v) => !v.isFavorite)].map((v) => (
              <div
                key={v.id}
                className="group flex items-center gap-1 rounded-md px-2 py-1.5 hover:bg-muted"
              >
                <button
                  type="button"
                  onClick={() => onToggleFavorite(v.id)}
                  className="text-muted-foreground hover:text-warning"
                  aria-label={v.isFavorite ? 'Desfavoritar' : 'Favoritar'}
                >
                  <Star className={cn('h-3.5 w-3.5', v.isFavorite && 'fill-warning text-warning')} />
                </button>
                <button
                  type="button"
                  onClick={() => onApply(v)}
                  className="flex-1 text-left text-xs truncate"
                >
                  {v.name}
                  {v.isDefault && (
                    <Badge variant="outline" className="ml-1.5 h-4 px-1 text-[9px]">padrão</Badge>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onSetDefault(v.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary"
                  aria-label="Definir como padrão"
                  title="Definir como padrão"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleShare(v)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary"
                  aria-label="Compartilhar via URL"
                >
                  <Share2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onRemove(v.id);
                    toast.success('View removida');
                  }}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  aria-label="Remover"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="border-t p-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full gap-1.5 h-7 text-xs"
              onClick={() => setSaveOpen(true)}
            >
              <Save className="h-3 w-3" /> Salvar view atual
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Salvar view</DialogTitle>
            <DialogDescription className="text-xs">
              Capture os filtros e colunas atuais com um nome para reusar e compartilhar.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            placeholder="Ex.: Leads quentes SP, Pipeline Q4..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
            }}
          />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSaveOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSave} className="gap-1">
              <Save className="h-3.5 w-3.5" /> Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
