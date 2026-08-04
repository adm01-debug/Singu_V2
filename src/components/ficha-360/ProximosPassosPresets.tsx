import React, { useState } from 'react';
import { Bookmark, BookmarkPlus, Check, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useFicha360FilterPresets, type FilterPreset } from '@/hooks/useFicha360FilterPresets';
import type { NbaPriority, NbaSort } from '@/hooks/useProximosPassosFilters';
import { toast } from 'sonner';

interface Props {
  current: { priorities: NbaPriority[]; channels: string[]; sort: NbaSort };
  hasActiveFilters: boolean;
  onApply: (preset: FilterPreset) => void;
}

function presetMatchesCurrent(preset: FilterPreset, current: Props['current']): boolean {
  const eqArr = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false;
    const as = [...a].sort();
    const bs = [...b].sort();
    return as.every((v, i) => v === bs[i]);
  };
  return (
    preset.sort === current.sort &&
    eqArr(preset.priorities, current.priorities) &&
    eqArr(preset.channels, current.channels)
  );
}

function ProximosPassosPresetsComponent({ current, hasActiveFilters, onApply }: Props) {
  const { presets, savePreset, deletePreset, isSaving } = useFicha360FilterPresets();
  const [openSave, setOpenSave] = useState(false);
  const [name, setName] = useState('');

  const activePreset = presets.find((p) => presetMatchesCurrent(p, current));

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Dê um nome ao filtro.');
      return;
    }
    try {
      await savePreset({
        name: trimmed,
        priorities: current.priorities,
        channels: current.channels,
        sort: current.sort,
      });
      toast.success(`Filtro "${trimmed}" salvo.`);
      setName('');
      setOpenSave(false);
    } catch {
      toast.error('Não foi possível salvar.');
    }
  };

  const handleDelete = async (preset: FilterPreset, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deletePreset(preset.id);
      toast.success(`Filtro "${preset.name}" removido.`);
    } catch {
      toast.error('Não foi possível remover.');
    }
  };

  if (presets.length === 0 && !hasActiveFilters) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {presets.length > 0 && (
        <>
          <Bookmark className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
          {presets.map((preset) => {
            const active = activePreset?.id === preset.id;
            return (
              <Badge
                key={preset.id}
                variant={active ? 'default' : 'outline'}
                role="button"
                aria-pressed={active}
                onClick={() => onApply(preset)}
                className={cn(
                  'group cursor-pointer gap-1 px-2 py-0.5 text-[11px] transition-colors select-none',
                  !active && 'hover:bg-muted',
                )}
              >
                {active && <Check className="h-2.5 w-2.5" />}
                <span className="max-w-[120px] truncate">{preset.name}</span>
                <button
                  type="button"
                  onClick={(e) => handleDelete(preset, e)}
                  aria-label={`Remover filtro ${preset.name}`}
                  className={cn(
                    'ml-0.5 inline-flex h-3 w-3 items-center justify-center rounded-sm opacity-0 transition-opacity',
                    'group-hover:opacity-100 hover:bg-foreground/10',
                  )}
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              </Badge>
            );
          })}
        </>
      )}

      {hasActiveFilters && !activePreset && (
        <Popover open={openSave} onOpenChange={setOpenSave}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="xs"
              className="h-6 gap-1 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <BookmarkPlus className="h-3 w-3" />
              Salvar
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-60 p-2">
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">Salvar filtros atuais</p>
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: WhatsApp alta"
                maxLength={40}
                className="h-8 text-xs"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                }}
              />
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="xs" onClick={() => setOpenSave(false)}>
                  Cancelar
                </Button>
                <Button size="xs" onClick={handleSave} disabled={isSaving || !name.trim()}>
                  Salvar
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

export const ProximosPassosPresets = React.memo(ProximosPassosPresetsComponent);
