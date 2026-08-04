import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bookmark, Check, MoreVertical, Plus, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useSavedViews, type SavedView } from '@/hooks/useSavedViews';
import { cn } from '@/lib/utils';

const NAME_MAX = 60;

interface SavedViewState {
  query: string;
}

interface Props {
  /** Escopo lógico, geralmente o pathname (ex.: `interacoes`). */
  scope: string;
  className?: string;
}

/**
 * Botão + dropdown para salvar e reaplicar visualizações nomeadas.
 * O snapshot é a query string atual da URL (filtros, sort, paginação).
 * Persistência local via `useSavedViews` (escopo isolado por rota).
 */
export function SavedViewsMenu({ scope, className }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { views, save, remove, toggleFavorite } = useSavedViews<SavedViewState>(scope);

  const [name, setName] = useState('');
  const [open, setOpen] = useState(false);
  const [savePopoverOpen, setSavePopoverOpen] = useState(false);

  const currentQuery = searchParams.toString();
  const trimmed = name.trim();
  const hasFilters = currentQuery.length > 0;

  const sortedViews = [...views].sort((a, b) => {
    const fa = a.isFavorite ? 1 : 0;
    const fb = b.isFavorite ? 1 : 0;
    if (fa !== fb) return fb - fa;
    return a.name.localeCompare(b.name);
  });

  const handleSave = () => {
    if (!trimmed) {
      toast.warning('Dê um nome para a visualização');
      return;
    }
    const duplicate = views.some((v) => v.name.toLowerCase() === trimmed.toLowerCase());
    if (duplicate) {
      toast.warning('Já existe uma visualização com esse nome', {
        description: 'Escolha outro nome.',
      });
      return;
    }
    const created = save(trimmed.slice(0, NAME_MAX), { query: currentQuery });
    toast.success('Visualização salva', { description: created.name });
    setName('');
    setSavePopoverOpen(false);
    setOpen(false);
  };

  const applyView = (view: SavedView<SavedViewState>) => {
    const sp = new URLSearchParams(view.state?.query ?? '');
    setSearchParams(sp, { replace: false });
    toast.success('Visualização aplicada', { description: view.name });
    setOpen(false);
  };

  return (
    <div className={cn('inline-flex', className)}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            aria-label="Visualizações salvas"
          >
            <Bookmark className="w-4 h-4" />
            <span className="hidden sm:inline">Visualizações</span>
            {views.length > 0 && (
              <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                {views.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Visualizações salvas</span>
            <Popover open={savePopoverOpen} onOpenChange={setSavePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs"
                  disabled={!hasFilters}
                  title={hasFilters ? 'Salvar visualização atual' : 'Aplique filtros para salvar'}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Salvar atual
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="saved-view-name" className="text-xs">
                    Nome da visualização
                  </Label>
                  <Input
                    id="saved-view-name"
                    autoFocus
                    placeholder="Ex.: Meu pipeline"
                    value={name}
                    maxLength={NAME_MAX}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSave();
                      }
                    }}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Salva filtros, ordenação e paginação atuais.
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setName('');
                      setSavePopoverOpen(false);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={!trimmed}>
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Salvar
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {sortedViews.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              Nenhuma visualização salva ainda.
              <br />
              Aplique filtros e clique em <strong>Salvar atual</strong>.
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto py-1">
              {sortedViews.map((v) => (
                <div key={v.id} className="flex items-center gap-1 px-1">
                  <DropdownMenuItem
                    className="flex-1 cursor-pointer"
                    onSelect={(e) => {
                      e.preventDefault();
                      applyView(v);
                    }}
                  >
                    <Bookmark className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                    <span className="truncate">{v.name}</span>
                  </DropdownMenuItem>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    aria-label={v.isFavorite ? `Desfavoritar ${v.name}` : `Favoritar ${v.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(v.id);
                    }}
                  >
                    <Star
                      className={cn(
                        'w-3.5 h-3.5',
                        v.isFavorite ? 'fill-warning text-warning' : 'text-muted-foreground',
                      )}
                    />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        aria-label={`Opções para ${v.name}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={(e) => {
                          e.preventDefault();
                          remove(v.id);
                          toast.success('Visualização removida', { description: v.name });
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
