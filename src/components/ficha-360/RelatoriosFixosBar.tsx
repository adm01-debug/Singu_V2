import { memo, useState } from 'react';
import {
  BarChart3,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  RefreshCw,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  useFicha360FilterFavorites,
  suggestFavoriteName,
  type FilterFavorite,
} from '@/hooks/useFicha360FilterFavorites';
import type { InteractionTag } from '@/lib/interactionTags';
import { periodLabelShort } from '@/lib/ficha360Formatters';
import { SalvarRelatorioDialog } from './SalvarRelatorioDialog';

const MAX_VISIBLE = 4;

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  call: 'Ligação',
  email: 'Email',
  meeting: 'Reunião',
  note: 'Nota',
};

function buildSummary(f: FilterFavorite): string {
  const parts: string[] = [periodLabelShort(f.days)];
  if (f.channels.length === 0) parts.push('Todos');
  else parts.push(f.channels.map((c) => CHANNEL_LABELS[c] ?? c).join('+'));
  if (f.tags.length > 0) parts.push(`${f.tags.length} tag${f.tags.length === 1 ? '' : 's'}`);
  if (f.q?.trim()) parts.push(`busca "${f.q.trim().slice(0, 14)}"`);
  return parts.join(' · ');
}

interface Props {
  /** Filtros aplicados atuais (para detectar match e capturar em "Salvar atual"). */
  days: number;
  channels: string[];
  tags: InteractionTag[];
  q: string;
  onApply: (preset: FilterFavorite) => void;
  /** Aberto externamente (atalho Shift+R). */
  saveDialogOpen?: boolean;
  onSaveDialogOpenChange?: (open: boolean) => void;
}

export const RelatoriosFixosBar = memo(function RelatoriosFixosBar({
  days,
  channels,
  tags,
  q,
  onApply,
  saveDialogOpen,
  onSaveDialogOpenChange,
}: Props) {
  const {
    favorites,
    findMatch,
    save,
    update,
    updateFilters,
    remove,
    canSaveMore,
    maxFavorites,
  } = useFicha360FilterFavorites();

  const [internalSaveOpen, setInternalSaveOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const isExternal = typeof saveDialogOpen === 'boolean';
  const saveOpen = isExternal ? saveDialogOpen! : internalSaveOpen;
  const setSaveOpen = (next: boolean) => {
    if (isExternal) onSaveDialogOpenChange?.(next);
    else setInternalSaveOpen(next);
  };

  const editing = editingId ? favorites.find((f) => f.id === editingId) ?? null : null;

  const activeMatch = findMatch(days, channels, tags, q);
  const isDefaultState =
    days === 90 && channels.length === 0 && tags.length === 0 && !q.trim();
  const saveDisabledReason = activeMatch
    ? `Já salvo como "${activeMatch.name}"`
    : isDefaultState
      ? 'Configure filtros antes de salvar'
      : !canSaveMore
        ? `Limite de ${maxFavorites} relatórios atingido`
        : null;

  const visible = favorites.slice(0, MAX_VISIBLE);
  const overflow = favorites.slice(MAX_VISIBLE);

  const handleApply = (preset: FilterFavorite) => {
    onApply(preset);
  };

  const handleDelete = (preset: FilterFavorite) => {
    remove(preset.id);
    toast.success(`Relatório "${preset.name}" excluído`, { duration: 2000 });
  };

  const handleUpdateFilters = (preset: FilterFavorite) => {
    const updated = updateFilters(preset.id, days, channels, tags, q);
    if (updated) {
      toast.success(`"${updated.name}" atualizado com filtros atuais`, { duration: 2000 });
    }
  };

  const openCreate = () => {
    if (saveDisabledReason) {
      if (saveDisabledReason !== `Já salvo como "${activeMatch?.name}"` || activeMatch) {
        toast.info(saveDisabledReason, { duration: 1800 });
      }
      return;
    }
    setEditingId(null);
    setSaveOpen(true);
  };

  const openEdit = (preset: FilterFavorite) => {
    setEditingId(preset.id);
    setSaveOpen(true);
  };

  const handleSubmitDialog = (data: {
    name: string;
    description?: string;
    autoOpenSummary: boolean;
  }) => {
    if (editing) {
      const updated = update(editing.id, data);
      if (updated) {
        toast.success(`"${updated.name}" atualizado`, { duration: 2000 });
      } else {
        toast.error('Não foi possível atualizar o relatório.');
      }
    } else {
      const created = save(
        data.name,
        days,
        channels,
        tags,
        q,
        data.description,
        data.autoOpenSummary,
      );
      if (created) {
        toast.success(`Relatório "${created.name}" salvo`, {
          description: data.description,
          duration: 2200,
        });
      } else {
        toast.error(
          !canSaveMore
            ? `Limite de ${maxFavorites} relatórios atingido.`
            : 'Não foi possível salvar (filtros inválidos).',
        );
      }
    }
    setSaveOpen(false);
    setEditingId(null);
  };

  const dialogTakenNames = favorites
    .filter((f) => (editing ? f.id !== editing.id : true))
    .map((f) => f.name);

  const dialogSuggestedName = suggestFavoriteName(days, channels, tags, q);

  return (
    <div className="flex items-center gap-2 flex-wrap py-1">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground shrink-0">
        <BarChart3 className="h-3.5 w-3.5" />
        <span>Relatórios fixos:</span>
      </div>

      {favorites.length === 0 ? (
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={openCreate}
          disabled={!!saveDisabledReason}
        >
          <Plus className="h-3 w-3 mr-1" /> Crie seu primeiro relatório
        </Button>
      ) : (
        <TooltipProvider delayDuration={300}>
          {visible.map((f) => (
            <PresetChip
              key={f.id}
              preset={f}
              active={activeMatch?.id === f.id}
              onApply={() => handleApply(f)}
              onEdit={() => openEdit(f)}
              onUpdateFilters={() => handleUpdateFilters(f)}
              onDelete={() => handleDelete(f)}
            />
          ))}

          {overflow.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                  +{overflow.length} <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                {overflow.map((f) => (
                  <DropdownMenuItem
                    key={f.id}
                    onSelect={() => handleApply(f)}
                    className="flex flex-col items-start gap-0.5"
                  >
                    <div className="flex items-center gap-1.5 w-full">
                      <span className="text-xs font-medium truncate flex-1">{f.name}</span>
                      {activeMatch?.id === f.id && (
                        <Badge variant="default" className="h-4 px-1 text-[9px]">ativo</Badge>
                      )}
                      {f.autoOpenSummary !== false && (
                        <Sparkles className="h-3 w-3 text-primary shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground truncate w-full">
                      {buildSummary(f)}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </TooltipProvider>
      )}

      {favorites.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={openCreate}
                disabled={!!saveDisabledReason}
              >
                <Plus className="h-3 w-3 mr-1" /> Salvar atual
              </Button>
            </span>
          </TooltipTrigger>
          {saveDisabledReason && (
            <TooltipContent side="top">{saveDisabledReason}</TooltipContent>
          )}
        </Tooltip>
      )}

      <SalvarRelatorioDialog
        open={saveOpen}
        onOpenChange={(next) => {
          setSaveOpen(next);
          if (!next) setEditingId(null);
        }}
        mode={editing ? 'edit' : 'create'}
        days={editing ? editing.days : days}
        channels={editing ? editing.channels : channels}
        tags={editing ? editing.tags : tags}
        q={editing ? editing.q ?? '' : q}
        suggestedName={dialogSuggestedName}
        preset={editing ?? undefined}
        takenNames={dialogTakenNames}
        onSubmit={handleSubmitDialog}
      />
    </div>
  );
});

interface ChipProps {
  preset: FilterFavorite;
  active: boolean;
  onApply: () => void;
  onEdit: () => void;
  onUpdateFilters: () => void;
  onDelete: () => void;
}

function PresetChip({ preset, active, onApply, onEdit, onUpdateFilters, onDelete }: ChipProps) {
  const summary = buildSummary(preset);
  return (
    <div className="group inline-flex items-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={active ? 'secondary' : 'outline'}
            size="sm"
            onClick={onApply}
            aria-pressed={active}
            aria-label={`Aplicar relatório ${preset.name} (${summary})`}
            className={cn(
              'h-7 text-xs rounded-r-none border-r-0 max-w-[200px]',
              active && 'ring-2 ring-primary ring-offset-1 ring-offset-background',
            )}
          >
            <span className="truncate">{preset.name}</span>
            {preset.autoOpenSummary !== false && (
              <Sparkles className="h-3 w-3 ml-1 text-primary shrink-0" aria-hidden="true" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium text-xs">{preset.name}</p>
            {preset.description && (
              <p className="text-[11px] text-muted-foreground">{preset.description}</p>
            )}
            <p className="text-[10px] text-muted-foreground/80">{summary}</p>
          </div>
        </TooltipContent>
      </Tooltip>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant={active ? 'secondary' : 'outline'}
            size="sm"
            className={cn(
              'h-7 px-1.5 rounded-l-none',
              active && 'ring-2 ring-primary ring-offset-1 ring-offset-background ring-l-0',
            )}
            aria-label={`Mais ações de ${preset.name}`}
          >
            <MoreVertical className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil className="h-3.5 w-3.5 mr-2" /> Editar nome e descrição
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onUpdateFilters}>
            <RefreshCw className="h-3.5 w-3.5 mr-2" /> Atualizar com filtros atuais
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={onDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
