import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Bookmark, BookmarkPlus, Trash2, Check, Star, Sparkles, Pencil, RefreshCw, X, Copy } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { suggestGenericPresetName } from '@/lib/suggestPresetName';
import { dedupeNameAgainst } from '@/lib/searchPresetTransport';
import { PresetFiltersDiff } from './PresetFiltersDiff';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSearchPresets, type SearchPreset, type PresetSortMode } from '@/hooks/useSearchPresets';
import { toast } from 'sonner';

interface SearchPresetsMenuProps {
  context?: string;
  currentFilters: Record<string, string[]>;
  currentSortBy: string;
  currentSortOrder: 'asc' | 'desc';
  currentSearchTerm?: string;
  onApplyPreset: (preset: SearchPreset) => void;
  buttonLabel?: string;
  title?: string;
  description?: string;
}

export function SearchPresetsMenu({
  context = 'contacts',
  currentFilters,
  currentSortBy,
  currentSortOrder,
  currentSearchTerm,
  onApplyPreset,
  buttonLabel = 'Presets',
  title = 'Presets de Busca',
  description = 'Salve e reutilize combinações de filtros',
}: SearchPresetsMenuProps) {
  const {
    presets,
    sortedPresets,
    sortMode,
    setSortMode,
    savePreset,
    deletePreset,
    updatePreset,
    duplicatePreset,
    toggleFavorite,
    markAsUsed,
  } = useSearchPresets(context);
  const [isNaming, setIsNaming] = useState(false);
  const [presetName, setPresetName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [pendingFilterUpdate, setPendingFilterUpdate] = useState<SearchPreset | null>(null);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [recentlyAppliedId, setRecentlyAppliedId] = useState<string | null>(null);

  useEffect(() => {
    if (editingId) {
      requestAnimationFrame(() => renameInputRef.current?.select());
    }
  }, [editingId]);

  const hasActiveFilters = Object.keys(currentFilters).some(k => currentFilters[k]?.length > 0)
    || currentSearchTerm;

  const startRename = (preset: SearchPreset, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(preset.id);
    setRenameValue(preset.name);
  };

  const cancelRename = () => {
    setEditingId(null);
    setRenameValue('');
  };

  const commitRename = () => {
    if (!editingId) return;
    const trimmed = renameValue.trim().slice(0, 60);
    if (!trimmed) { cancelRename(); return; }
    const current = presets.find(p => p.id === editingId);
    if (!current) { cancelRename(); return; }
    if (trimmed === current.name) { cancelRename(); return; }
    const otherNames = presets.filter(p => p.id !== editingId).map(p => p.name);
    const finalName = dedupeNameAgainst(otherNames, trimmed);
    const previousName = current.name;
    const targetId = editingId;
    updatePreset(targetId, { name: finalName });
    cancelRename();
    toast.success('Preset renomeado', {
      description: `"${previousName}" → "${finalName}"`,
      action: {
        label: 'Desfazer',
        onClick: () => {
          updatePreset(targetId, { name: previousName });
          toast('Renomeio desfeito');
        },
      },
    });
  };

  const handleRenameKeydown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); commitRename(); }
    if (e.key === 'Escape') { e.preventDefault(); cancelRename(); }
  };

  const askUpdateFilters = (preset: SearchPreset, e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingFilterUpdate(preset);
  };

  const confirmUpdateFilters = () => {
    if (!pendingFilterUpdate) return;
    const target = pendingFilterUpdate;
    // Snapshot dos campos que vamos sobrescrever, para permitir undo.
    const snapshot = {
      filters: target.filters,
      sortBy: target.sortBy,
      sortOrder: target.sortOrder,
      searchTerm: target.searchTerm,
    };
    updatePreset(target.id, {
      filters: currentFilters,
      sortBy: currentSortBy,
      sortOrder: currentSortOrder,
      searchTerm: currentSearchTerm,
    });
    setPendingFilterUpdate(null);
    toast.success('Filtros do preset atualizados', {
      description: `"${target.name}"`,
      action: {
        label: 'Desfazer',
        onClick: () => {
          updatePreset(target.id, snapshot);
          toast('Atualização desfeita');
        },
      },
    });
  };

  const handleStartNaming = () => {
    const suggested = suggestGenericPresetName(currentFilters, currentSearchTerm);
    const finalName = dedupeNameAgainst(presets.map((p) => p.name), suggested);
    setPresetName(finalName);
    setIsNaming(true);
  };

  const handleRegenerateSuggestion = () => {
    const suggested = suggestGenericPresetName(currentFilters, currentSearchTerm);
    const finalName = dedupeNameAgainst(presets.map((p) => p.name), suggested);
    setPresetName(finalName);
    requestAnimationFrame(() => inputRef.current?.select());
  };

  // useLayoutEffect garante focus+select síncronos antes do paint,
  // evitando flicker de cursor sem seleção e seleção dupla.
  useLayoutEffect(() => {
    if (!isNaming) return;
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    el.select();
  }, [isNaming]);

  const handleSave = () => {
    const trimmed = presetName.trim();
    if (!trimmed) return;
    // Dedupe normalizado contra TODOS os presets (inclui favoritos),
    // case/acentos/pontuação insensível.
    const finalName = dedupeNameAgainst(presets.map((p) => p.name), trimmed);
    savePreset({
      name: finalName,
      filters: currentFilters,
      sortBy: currentSortBy,
      sortOrder: currentSortOrder,
      searchTerm: currentSearchTerm,
    });
    setPresetName('');
    setIsNaming(false);
    if (finalName !== trimmed) {
      toast.success('Preset salvo!', {
        description: `Nome ajustado para "${finalName}" para evitar duplicidade.`,
      });
    } else {
      toast.success('Preset salvo!');
    }
  };


  const handleApply = (preset: SearchPreset) => {
    markAsUsed(preset.id);
    onApplyPreset(preset);
    setActivePresetId(preset.id);
    setRecentlyAppliedId(preset.id);
    window.setTimeout(() => {
      setRecentlyAppliedId((cur) => (cur === preset.id ? null : cur));
    }, 1500);
    toast.success('Filtros atualizados', { description: `Preset "${preset.name}" aplicado` });
  };

  return (
    <>
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          aria-label="Presets de busca salvos"
        >
          <Bookmark className="w-4 h-4" />
          <span className="hidden sm:inline">{buttonLabel}</span>
          {presets.length > 0 && (
            <span className="text-xs bg-primary/10 text-primary rounded-full px-1.5">
              {presets.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <div className="p-3 border-b border-border">
          <h4 className="font-medium text-sm text-foreground">{title}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {description}
          </p>
        </div>

        {/* Sort selector */}
        {presets.length > 0 && (
          <div className="px-3 py-2 border-b border-border flex items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0">Ordenar:</span>
            <Select value={sortMode} onValueChange={(v) => setSortMode(v as PresetSortMode)}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="favoritos" className="text-xs">Favoritos</SelectItem>
                <SelectItem value="mais-usados" className="text-xs">Mais usados</SelectItem>
                <SelectItem value="recentes" className="text-xs">Mais recentes</SelectItem>
                <SelectItem value="alfabetica" className="text-xs">Alfabética</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Saved presets */}
        {sortedPresets.length > 0 && (
          <div className="max-h-48 overflow-y-auto divide-y divide-border">
            {sortedPresets.map(preset => {
              const usage = preset.usageCount ?? 0;
              return (
                <div
                  key={preset.id}
                  className={[
                    'flex items-center justify-between p-2.5 hover:bg-muted/50 cursor-pointer group transition-colors',
                    activePresetId === preset.id ? 'bg-primary/5 border-l-2 border-primary' : '',
                    recentlyAppliedId === preset.id ? 'animate-preset-flash' : '',
                  ].filter(Boolean).join(' ')}
                  aria-current={activePresetId === preset.id ? 'true' : undefined}
                  onClick={() => { if (editingId !== preset.id) handleApply(preset); }}
                >
                  <button
                    type="button"
                    className="mr-2 flex-shrink-0 p-0.5 rounded hover:bg-muted"
                    title={preset.isFavorite ? 'Remover dos favoritos' : 'Marcar como favorito'}
                    aria-label={preset.isFavorite ? 'Remover dos favoritos' : 'Marcar como favorito'}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(preset.id);
                    }}
                  >
                    <Star
                      className={
                        preset.isFavorite
                          ? 'w-3.5 h-3.5 fill-primary text-primary'
                          : 'w-3.5 h-3.5 text-muted-foreground'
                      }
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    {editingId === preset.id ? (
                      <Input
                        ref={renameInputRef}
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={handleRenameKeydown}
                        onBlur={commitRename}
                        onClick={(e) => e.stopPropagation()}
                        maxLength={60}
                        className="h-7 text-xs"
                        aria-label="Renomear preset"
                      />
                    ) : (
                      <>
                        <p className="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
                          <span className="truncate">{preset.name}</span>
                          {activePresetId === preset.id && (
                            <span className="shrink-0 text-[10px] uppercase tracking-wide font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                              Ativo
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {Object.values(preset.filters).flat().length} filtros
                          {preset.searchTerm && ` · "${preset.searchTerm}"`}
                          {usage >= 3 && ` · Usado ${usage}x`}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 flex-shrink-0">
                    {editingId === preset.id ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon" aria-label="Confirmar"
                          className="h-6 w-6"
                          title="Confirmar"
                          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); commitRename(); }}
                        >
                          <Check className="w-3 h-3 text-muted-foreground" />
                        </Button>
 <Button
                          variant="ghost"
                          size="icon" aria-label="Cancelar"
                          className="h-6 w-6"
                          title="Cancelar"
                          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); cancelRename(); }}
                        >
                          <X className="w-3 h-3 text-muted-foreground" />
                        </Button>              </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          title="Renomear"
                          aria-label="Renomear preset"
                          onClick={(e) => startRename(preset, e)}
                        >
                          <Pencil className="w-3 h-3 text-muted-foreground" />
                        </Button>
                        {hasActiveFilters && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            title="Atualizar com filtros atuais"
                            aria-label="Atualizar filtros do preset"
                            onClick={(e) => askUpdateFilters(preset, e)}
                          >
                            <RefreshCw className="w-3 h-3 text-muted-foreground" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          title="Duplicar preset"
                          aria-label="Duplicar preset"
                          disabled={presets.length >= 10}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (presets.length >= 10) {
                              toast.error('Limite de 10 presets atingido');
                              return;
                            }
                            const dup = duplicatePreset(preset.id);
                            if (dup) toast.success('Preset duplicado!', { description: `"${dup.name}"` });
                          }}
                        >
                          <Copy className="w-3 h-3 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon" aria-label="Remover"
                          className="h-6 w-6"
                          title="Remover"
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePreset(preset.id);
                            toast('Preset removido');
                          }}
                        >
                          <Trash2 className="w-3 h-3 text-muted-foreground" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {presets.length === 0 && !isNaming && (
          <div className="p-4 text-center text-muted-foreground">
            <Bookmark className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
            <p className="text-xs">Nenhum preset salvo</p>
          </div>
        )}

        {/* Save new preset */}
        <div className="p-2.5 border-t border-border">
          {isNaming ? (
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                autoFocus
                placeholder="Nome do preset..."
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') { setIsNaming(false); setPresetName(''); }
                }}
                maxLength={60}
                className="h-8 text-sm"
              />
              {!presetName.trim() && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2"
                  onClick={handleRegenerateSuggestion}
                  title="Sugerir nome com base nos filtros"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </Button>
              )}
              <Button size="sm" className="h-8 px-2" onClick={handleSave} disabled={!presetName.trim()}>
                <Check className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-xs"
              onClick={handleStartNaming}
              disabled={!hasActiveFilters}
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              Salvar filtros atuais como preset
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>

    <AlertDialog open={!!pendingFilterUpdate} onOpenChange={(o) => !o && setPendingFilterUpdate(null)}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Atualizar filtros deste preset?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Os filtros salvos serão substituídos pelos filtros ativos agora.
                As estatísticas de uso e o favorito serão preservados.
              </p>
              {pendingFilterUpdate && (
                <p className="text-foreground">
                  Mudanças em <strong>"{pendingFilterUpdate.name}"</strong>:
                </p>
              )}
              {pendingFilterUpdate && (
                <PresetFiltersDiff
                  before={pendingFilterUpdate.filters}
                  after={currentFilters}
                />
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={confirmUpdateFilters}>Atualizar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
