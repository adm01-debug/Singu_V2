import { memo, useState } from 'react';
import { Star, Trash2, Check, Plus, Link2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { periodLabelShort } from '@/lib/ficha360Formatters';
import {
  useFicha360FilterFavorites,
  suggestFavoriteName,
  encodeFavoriteToToken,
  buildFavoriteShareUrl,
  type FilterFavorite,
} from '@/hooks/useFicha360FilterFavorites';

interface Props {
  days: number;
  channels: string[];
  onApply: (days: number, channels: string[]) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  call: 'Ligação',
  email: 'Email',
  meeting: 'Reunião',
  note: 'Nota',
};

function formatCombo(days: number, channels: string[]): string {
  const label = periodLabelShort(days);
  if (channels.length === 0) return `${label} · todos os canais`;
  if (channels.length <= 2) {
    return `${label} · ${channels.map((c) => CHANNEL_LABELS[c] ?? c).join(', ')}`;
  }
  return `${label} · ${CHANNEL_LABELS[channels[0]] ?? channels[0]} +${channels.length - 1}`;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export const FavoritosFiltrosMenu = memo(function FavoritosFiltrosMenu({
  days,
  channels,
  onApply,
  open: controlledOpen,
  onOpenChange,
}: Props) {
  const { favorites, save, quickSave, remove, findMatch, canSaveMore, maxFavorites } =
    useFicha360FilterFavorites();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (v: boolean) => {
    if (onOpenChange) onOpenChange(v);
    else setInternalOpen(v);
  };
  const [savingMode, setSavingMode] = useState(false);
  const [draftName, setDraftName] = useState('');

  const activeMatch = findMatch(days, channels);
  const isDefault = days === 90 && channels.length === 0;
  const duplicateExists = !!activeMatch;
  const cannotSave = isDefault || duplicateExists || !canSaveMore;

  const startSaving = () => {
    setDraftName(suggestFavoriteName(days, channels));
    setSavingMode(true);
  };

  const confirmSave = () => {
    const result = save(draftName, days, channels);
    if (!result) {
      toast.error(
        !canSaveMore
          ? `Limite de ${maxFavorites} favoritos atingido.`
          : 'Não foi possível salvar este favorito.',
      );
      return;
    }
    toast.success(`Favorito "${result.name}" salvo.`);
    setSavingMode(false);
    setDraftName('');
  };

  const cancelSave = () => {
    setSavingMode(false);
    setDraftName('');
  };

  const applyFavorite = (fav: FilterFavorite) => {
    onApply(fav.days, fav.channels);
    toast.success(`Favorito "${fav.name}" aplicado.`);
    setOpen(false);
  };

  const handleShare = async (fav: FilterFavorite) => {
    const token = encodeFavoriteToToken({
      name: fav.name,
      days: fav.days,
      channels: fav.channels,
    });
    const url = buildFavoriteShareUrl(token);
    const ok = await copyToClipboard(url);
    if (ok) toast.success('Link copiado. Envie para quem quiser aplicar este filtro.');
    else toast.error('Não foi possível copiar o link.');
  };

  const handleRemove = (fav: FilterFavorite) => {
    remove(fav.id);
    toast.success(`Favorito "${fav.name}" removido.`);
  };

  return (
    <DropdownMenu open={open} onOpenChange={(v) => { setOpen(v); if (!v) cancelSave(); }}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={activeMatch ? 'default' : 'outline'}
          size="sm"
          className="h-8 gap-1.5 text-xs"
          aria-pressed={!!activeMatch}
          aria-label={
            activeMatch
              ? `Filtros favoritos — vendo: ${activeMatch.name}`
              : 'Filtros favoritos'
          }
          title={activeMatch ? `Vendo: ${activeMatch.name}` : 'Filtros favoritos'}
        >
          <Star
            className={cn(
              'h-3.5 w-3.5',
              activeMatch && 'fill-primary text-primary',
            )}
          />
          <span className="hidden sm:inline">
            {activeMatch ? activeMatch.name : 'Favoritos'}
          </span>
          {!activeMatch && favorites.length > 0 && (
            <Badge
              variant="secondary"
              className="h-4 px-1 text-[10px] tabular-nums"
            >
              {favorites.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 pt-2 pb-1">
          <DropdownMenuLabel className="p-0 text-xs font-medium">
            Filtros favoritos
          </DropdownMenuLabel>
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {favorites.length}/{maxFavorites}
          </span>
        </div>
        <DropdownMenuSeparator />

        {favorites.length === 0 ? (
          <div className="px-3 py-4 text-xs text-muted-foreground text-center">
            Nenhum favorito ainda. Configure período e canais e salve abaixo.
          </div>
        ) : (
          <ul className="max-h-72 overflow-y-auto py-1">
            {favorites.map((fav) => {
              const isActive = activeMatch?.id === fav.id;
              return (
                <li
                  key={fav.id}
                  className={cn(
                    'group flex items-center gap-1 px-2 py-1.5 rounded-sm mx-1',
                    isActive ? 'bg-accent/40' : 'hover:bg-muted/50',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => applyFavorite(fav)}
                    className="flex-1 min-w-0 text-left flex items-start gap-2"
                  >
                    <Star
                      className={cn(
                        'h-3.5 w-3.5 mt-0.5 shrink-0',
                        isActive ? 'fill-primary text-primary' : 'text-muted-foreground',
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium truncate">{fav.name}</span>
                        {isActive && <Check className="h-3 w-3 text-primary shrink-0" />}
                      </div>
                      <span className="text-[11px] text-muted-foreground truncate block">
                        {formatCombo(fav.days, fav.channels)}
                      </span>
                    </div>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleShare(fav)}
                    aria-label={`Copiar link de ${fav.name}`}
                    title="Copiar link compartilhável"
                  >
                    <Link2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemove(fav)}
                    aria-label={`Remover ${fav.name}`}
                    title="Remover favorito"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}

        <DropdownMenuSeparator />

        <div className="px-2 py-2 space-y-1">
          {!savingMode ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-8 text-xs gap-1.5"
                onClick={() => {
                  const result = quickSave(days, channels);
                  if (!result) {
                    toast.error(
                      !canSaveMore
                        ? `Limite de ${maxFavorites} favoritos atingido.`
                        : 'Não foi possível salvar este favorito.',
                    );
                    return;
                  }
                  toast.success(`Favorito "${result.name}" salvo.`);
                }}
                disabled={cannotSave}
                aria-label="Salvar filtros atuais como favorito sem nomear"
                title={
                  isDefault
                    ? 'Os filtros atuais são o padrão — ajuste para salvar'
                    : duplicateExists
                    ? `Já salvo como: ${activeMatch?.name}`
                    : !canSaveMore
                    ? `Limite de ${maxFavorites} favoritos atingido`
                    : 'Salvar com nome auto-gerado (Shift + S)'
                }
              >
                <Save className="h-3.5 w-3.5" />
                Salvar agora
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-8 text-xs gap-1.5"
                onClick={startSaving}
                disabled={cannotSave}
                title={
                  isDefault
                    ? 'Os filtros atuais são o padrão — ajuste para salvar'
                    : duplicateExists
                    ? `Já existe um favorito idêntico: ${activeMatch?.name}`
                    : !canSaveMore
                    ? `Limite de ${maxFavorites} favoritos atingido`
                    : 'Salvar combinação atual com nome personalizado'
                }
              >
                <Plus className="h-3.5 w-3.5" />
                Salvar com nome…
              </Button>
            </>
          ) : (
            <div className="space-y-2">
              <div className="text-[11px] text-muted-foreground">
                {formatCombo(days, channels)}
              </div>
              <div className="flex gap-1.5">
                <Input
                  autoFocus
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value.slice(0, 40))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      confirmSave();
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      cancelSave();
                    }
                  }}
                  placeholder="Nome do favorito"
                  className="h-7 text-xs"
                  maxLength={40}
                />
                <Button
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={confirmSave}
                  disabled={!draftName.trim()}
                >
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
