import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import { Bookmark, BookmarkPlus, Trash2, Check, Download, Link2, Upload, FileJson, Star, Sparkles, Pencil, RefreshCw, X, Zap, Copy, Eye, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSearchPresets, type PresetSortMode } from '@/hooks/useSearchPresets';
import { toast } from 'sonner';
import type { AdvancedFilters } from '@/hooks/useInteractionsAdvancedFilter';
import { ImportPresetsDialog } from './ImportPresetsDialog';
import { PresetFiltersDiff } from '@/components/search/PresetFiltersDiff';
import {
  buildBundle,
  bundleToBase64Url,
  downloadBundleAsFile,
  dedupeNameAgainst,
  type ExportablePreset,
} from '@/lib/searchPresetTransport';
import { suggestInteracoesPresetName } from '@/lib/suggestPresetName';

interface Props {
  filters: AdvancedFilters;
  setFilter: <K extends keyof AdvancedFilters>(key: K, value: AdvancedFilters[K]) => void;
  clear: () => void;
  activeCount: number;
  onApplyAll?: (next: Partial<AdvancedFilters>) => void;
}

interface SerializedPayload {
  q: string;
  contact: string;
  company: string;
  canais: string[];
  de?: string;
  ate?: string;
  sort?: string;
}

function summarize(p: SerializedPayload): string {
  const parts: string[] = [];
  if (p.q) parts.push(`"${p.q.slice(0, 20)}"`);
  if (Array.isArray(p.canais) && p.canais.length > 0) {
    parts.push(`${p.canais.length} canal${p.canais.length > 1 ? 'is' : ''}`);
  }
  if (p.contact) parts.push('pessoa');
  if (p.company) parts.push('empresa');
  if (p.de || p.ate) parts.push('data');
  return parts.join(' · ') || 'sem filtros';
}

function parseDate(iso?: string): Date | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? undefined : d;
}

export const InteracoesPresetsMenu = React.memo(function InteracoesPresetsMenu({
  filters, setFilter, clear, activeCount, onApplyAll,
}: Props) {
  const { presets, sortedPresets, sortMode, setSortMode, savePreset, deletePreset, updatePreset, duplicatePreset, toggleFavorite, markAsUsed } = useSearchPresets('interactions');
  const [isNaming, setIsNaming] = useState(false);
  const [name, setName] = useState('');
  // Estado do popover persistido em localStorage:
  // - se estava aberto antes de aplicar um preset, restaura no próximo mount
  //   e não fecha automaticamente após aplicar.
  const OPEN_KEY = 'interacoes-presets-open';
  const [open, setOpen] = useState<boolean>(() => {
    try { return localStorage.getItem(OPEN_KEY) === '1'; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem(OPEN_KEY, open ? '1' : '0'); } catch { /* noop */ }
  }, [open]);
  const [importOpen, setImportOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [pendingFilterUpdate, setPendingFilterUpdate] = useState<typeof presets[number] | null>(null);
  const [recentlyAppliedId, setRecentlyAppliedId] = useState<string | null>(null);
  // Modo de pré-visualização: clique no item abre painel diff em vez de aplicar.
  const [previewMode, setPreviewMode] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  // Navegação por teclado: índice do preset focado na lista (-1 = nenhum).
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

  // Auto-save: persistent toggle + active preset id (last applied/saved)
  const AUTOSAVE_KEY = 'interacoes-presets-autosave';
  const ACTIVE_KEY = 'interacoes-presets-active-id';
  const [autoSave, setAutoSave] = useState<boolean>(() => {
    try { return localStorage.getItem(AUTOSAVE_KEY) === '1'; } catch { return false; }
  });
  const [activePresetId, setActivePresetId] = useState<string | null>(() => {
    try { return localStorage.getItem(ACTIVE_KEY); } catch { return null; }
  });
  const [autoSavedAt, setAutoSavedAt] = useState<number | null>(null);
  useEffect(() => {
    try { localStorage.setItem(AUTOSAVE_KEY, autoSave ? '1' : '0'); } catch { /* noop */ }
  }, [autoSave]);
  useEffect(() => {
    try {
      if (activePresetId) localStorage.setItem(ACTIVE_KEY, activePresetId);
      else localStorage.removeItem(ACTIVE_KEY);
    } catch { /* noop */ }
  }, [activePresetId]);
  // If the active preset was deleted elsewhere, clear the reference
  useEffect(() => {
    if (activePresetId && !presets.some(p => p.id === activePresetId)) {
      setActivePresetId(null);
    }
  }, [presets, activePresetId]);


  useEffect(() => {
    if (editingId) {
      requestAnimationFrame(() => renameInputRef.current?.select());
    }
  }, [editingId]);

  const handleStartNaming = () => {
    const suggested = suggestInteracoesPresetName(filters);
    const finalName = dedupeNameAgainst(presets.map((p) => p.name), suggested);
    setName(finalName);
    setIsNaming(true);
  };

  const handleRegenerateSuggestion = () => {
    const suggested = suggestInteracoesPresetName(filters);
    const finalName = dedupeNameAgainst(presets.map((p) => p.name), suggested);
    setName(finalName);
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

  const currentPayload: SerializedPayload = useMemo(() => ({
    q: filters.q,
    contact: filters.contact,
    company: filters.company,
    canais: Array.isArray(filters.canais) ? filters.canais : [],
    de: filters.de?.toISOString(),
    ate: filters.ate?.toISOString(),
    sort: filters.sort,
  }), [filters]);

  const handleSave = () => {
    const trimmed = name.trim().slice(0, 60);
    if (!trimmed) return;
    // Garante dedupe normalizado (case/acentos/pontuação) contra TODOS os presets,
    // incluindo favoritos — evita "Acme · WhatsApp" vs "acme whatsapp" duplicados.
    const finalName = dedupeNameAgainst(presets.map((p) => p.name), trimmed);
    const created = savePreset({
      name: finalName,
      filters: {
        q: currentPayload.q ? [currentPayload.q] : [],
        contact: currentPayload.contact ? [currentPayload.contact] : [],
        company: currentPayload.company ? [currentPayload.company] : [],
        canais: currentPayload.canais,
        de: currentPayload.de ? [currentPayload.de] : [],
        ate: currentPayload.ate ? [currentPayload.ate] : [],
        sort: currentPayload.sort ? [currentPayload.sort] : [],
      },
      sortBy: '',
      sortOrder: 'desc',
    });
    setActivePresetId(created.id);
    setName('');
    setIsNaming(false);
    if (finalName !== trimmed) {
      toast.success('Busca salva!', {
        description: `Nome ajustado para "${finalName}" para evitar duplicidade.`,
      });
    } else {
      toast.success('Busca salva!');
    }
  };

  // Reseta o índice focado sempre que o popover abre/fecha ou a lista muda.
  useEffect(() => {
    if (!open) {
      setFocusedIndex(-1);
    }
  }, [open]);


  const applyPreset = (preset: typeof presets[number]) => {
    const presetFilters = preset.filters;
    const payload: SerializedPayload = {
      q: presetFilters.q?.[0] ?? '',
      contact: presetFilters.contact?.[0] ?? '',
      company: presetFilters.company?.[0] ?? '',
      canais: Array.isArray(presetFilters.canais) ? presetFilters.canais : [],
      de: presetFilters.de?.[0],
      ate: presetFilters.ate?.[0],
      sort: presetFilters.sort?.[0],
    };
    const validSorts = ['recent', 'oldest', 'relevance', 'entity'] as const;
    type SortVal = typeof validSorts[number];
    const nextSort: SortVal = (validSorts as readonly string[]).includes(payload.sort ?? '')
      ? (payload.sort as SortVal)
      : 'recent';
    const nextFilters: Partial<AdvancedFilters> = {
      q: payload.q,
      contact: payload.contact,
      company: payload.company,
      canais: payload.canais,
      de: parseDate(payload.de),
      ate: parseDate(payload.ate),
      sort: nextSort,
    };

    if (onApplyAll) {
      onApplyAll(nextFilters);
    } else {
      // Fallback: replace via clear + setFilter (compat)
      clear();
      setFilter('q', payload.q);
      setFilter('contact', payload.contact);
      setFilter('company', payload.company);
      setFilter('canais', payload.canais);
      setFilter('de', parseDate(payload.de));
      setFilter('ate', parseDate(payload.ate));
      setFilter('sort', nextSort);
    }

    markAsUsed(preset.id);
    setActivePresetId(preset.id);
    setRecentlyAppliedId(preset.id);
    window.setTimeout(() => {
      setRecentlyAppliedId((cur) => (cur === preset.id ? null : cur));
    }, 1500);
    // Mantém o popover aberto após aplicar (estado restaurado de localStorage),
    // permitindo trocar rapidamente entre presets sem reabrir o menu.
    toast.success('Filtros atualizados', { description: `Preset "${preset.name}" aplicado` });
    requestAnimationFrame(() => {
      // Rola até o topo da tabela e devolve o foco ao input de busca
      // (sem fechar o popover — Radix permite foco fora mantendo-o aberto).
      window.dispatchEvent(new CustomEvent('scroll-interactions-top'));
      window.dispatchEvent(new CustomEvent('focus-interactions-search'));
    });
  };

  // Auto-save: when enabled and there's an active preset, persist filter changes
  // into that preset after a debounce. Skip if filters match the saved snapshot.
  useEffect(() => {
    if (!autoSave || !activePresetId) return;
    const target = presets.find(p => p.id === activePresetId);
    if (!target) return;

    const nextFilters = {
      q: currentPayload.q ? [currentPayload.q] : [],
      contact: currentPayload.contact ? [currentPayload.contact] : [],
      company: currentPayload.company ? [currentPayload.company] : [],
      canais: currentPayload.canais,
      de: currentPayload.de ? [currentPayload.de] : [],
      ate: currentPayload.ate ? [currentPayload.ate] : [],
      sort: currentPayload.sort ? [currentPayload.sort] : [],
    };
    // Shallow compare via JSON to avoid redundant writes
    if (JSON.stringify(target.filters) === JSON.stringify(nextFilters)) return;

    const handle = window.setTimeout(() => {
      updatePreset(activePresetId, { filters: nextFilters, sortBy: '', sortOrder: 'desc' });
      setAutoSavedAt(Date.now());
    }, 1200);
    return () => window.clearTimeout(handle);
  }, [autoSave, activePresetId, currentPayload, presets, updatePreset]);


  const exportOne = (preset: typeof presets[number]) => {
    const item: ExportablePreset = {
      name: preset.name,
      filters: preset.filters,
      sortBy: preset.sortBy,
      sortOrder: preset.sortOrder,
    };
    downloadBundleAsFile(buildBundle([item]));
    toast.success('JSON baixado');
  };

  const copyLink = async (preset: typeof presets[number]) => {
    const item: ExportablePreset = {
      name: preset.name,
      filters: preset.filters,
      sortBy: preset.sortBy,
      sortOrder: preset.sortOrder,
    };
    const b64 = bundleToBase64Url(buildBundle([item]));
    const url = `${window.location.origin}/interacoes?preset=${b64}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado');
    } catch {
      toast.error('Falha ao copiar link');
    }
  };

  const exportAll = () => {
    const items: ExportablePreset[] = presets.map(p => ({
      name: p.name,
      filters: p.filters,
      sortBy: p.sortBy,
      sortOrder: p.sortOrder,
    }));
    downloadBundleAsFile(buildBundle(items));
    toast.success(`${items.length} busca${items.length > 1 ? 's' : ''} exportada${items.length > 1 ? 's' : ''}`);
  };

  const startRename = (preset: typeof presets[number], e: React.MouseEvent) => {
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

  const askUpdateFilters = (preset: typeof presets[number], e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingFilterUpdate(preset);
  };

  const confirmUpdateFilters = () => {
    if (!pendingFilterUpdate) return;
    const target = pendingFilterUpdate;
    // Snapshot do estado anterior para suportar Desfazer.
    const snapshot = {
      filters: target.filters,
      sortBy: target.sortBy,
      sortOrder: target.sortOrder,
      searchTerm: target.searchTerm,
    };
    updatePreset(target.id, {
      filters: {
        q: currentPayload.q ? [currentPayload.q] : [],
        contact: currentPayload.contact ? [currentPayload.contact] : [],
        company: currentPayload.company ? [currentPayload.company] : [],
        canais: currentPayload.canais,
        de: currentPayload.de ? [currentPayload.de] : [],
        ate: currentPayload.ate ? [currentPayload.ate] : [],
        sort: currentPayload.sort ? [currentPayload.sort] : [],
      },
      sortBy: '',
      sortOrder: 'desc',
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

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5" aria-label="Buscas salvas">
            <Bookmark className="w-4 h-4" />
            <span className="hidden sm:inline">Buscas</span>
            {presets.length > 0 && (
              <span className="text-xs bg-primary/10 text-primary rounded-full px-1.5">
                {presets.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-96 p-0"
          align="end"
          onOpenAutoFocus={(e) => {
            // Não roubamos foco ao abrir/restaurar — preserva o foco da barra de busca.
            e.preventDefault();
          }}
          onInteractOutside={(e) => {
            // Não fecha quando o foco/click vai para a barra de busca de interações.
            const target = e.target as HTMLElement | null;
            if (target?.closest('[data-interacoes-search]')) {
              e.preventDefault();
            }
          }}
          onKeyDown={(e) => {
            // Navegação por teclado nos presets: ↑/↓ move, Enter aplica, Esc fecha.
            if (sortedPresets.length === 0) return;
            if (editingId || isNaming) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setFocusedIndex((i) => {
                const next = i < sortedPresets.length - 1 ? i + 1 : 0;
                requestAnimationFrame(() => itemRefs.current[next]?.scrollIntoView({ block: 'nearest' }));
                return next;
              });
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setFocusedIndex((i) => {
                const next = i <= 0 ? sortedPresets.length - 1 : i - 1;
                requestAnimationFrame(() => itemRefs.current[next]?.scrollIntoView({ block: 'nearest' }));
                return next;
              });
            } else if (e.key === 'Enter' && focusedIndex >= 0 && focusedIndex < sortedPresets.length) {
              e.preventDefault();
              applyPreset(sortedPresets[focusedIndex]);
            }
          }}
        >
          <div className="p-3 border-b border-border">
            <h4 className="font-medium text-sm text-foreground">Buscas salvas</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Salve, exporte e compartilhe combinações de filtros
            </p>
          </div>

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
              <Button
                type="button"
                variant={previewMode ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-2 gap-1 text-xs shrink-0"
                onClick={() => { setPreviewMode((v) => !v); setPreviewId(null); }}
                title={previewMode ? 'Desativar pré-visualização' : 'Ativar pré-visualização — clique mostra o diff antes de aplicar'}
                aria-pressed={previewMode}
              >
                {previewMode ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                Prévia
              </Button>
            </div>
          )}

          {sortedPresets.length > 0 && (
            <div className="max-h-64 overflow-y-auto divide-y divide-border">
              {sortedPresets.map((preset, index) => {
                const payload: SerializedPayload = {
                  q: preset.filters.q?.[0] ?? '',
                  contact: preset.filters.contact?.[0] ?? '',
                  company: preset.filters.company?.[0] ?? '',
                  canais: Array.isArray(preset.filters.canais) ? preset.filters.canais : [],
                  de: preset.filters.de?.[0],
                  ate: preset.filters.ate?.[0],
                };
                const usage = preset.usageCount ?? 0;
                const isFocused = focusedIndex === index;
                return (
                  <React.Fragment key={preset.id}>
                  <div
                    ref={(el) => { itemRefs.current[index] = el; }}
                    className={[
                      'flex items-center justify-between p-2.5 hover:bg-muted/50 cursor-pointer group relative transition-colors',
                      activePresetId === preset.id ? 'bg-primary/5 border-l-2 border-primary' : '',
                      recentlyAppliedId === preset.id ? 'animate-preset-flash' : '',
                      previewId === preset.id ? 'bg-muted/40' : '',
                      isFocused ? 'bg-accent/40 ring-1 ring-inset ring-primary/40' : '',
                    ].filter(Boolean).join(' ')}
                    aria-current={activePresetId === preset.id ? 'true' : undefined}
                    onMouseEnter={() => setFocusedIndex(index)}
                    onClick={() => {
                      if (editingId === preset.id) return;
                      if (previewMode) {
                        setPreviewId((cur) => (cur === preset.id ? null : preset.id));
                      } else {
                        applyPreset(preset);
                      }
                    }}
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
                            {previewId === preset.id && (
                              <span className="shrink-0 text-[10px] uppercase tracking-wide font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                Prévia
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {summarize(payload)}
                            {usage >= 3 && <span className="ml-1.5">· Usado {usage}x</span>}
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
                            title={previewId === preset.id ? 'Fechar prévia' : 'Pré-visualizar mudanças'}
                            aria-label="Pré-visualizar mudanças"
                            aria-expanded={previewId === preset.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewId((cur) => (cur === preset.id ? null : preset.id));
                            }}
                          >
                            {previewId === preset.id
                              ? <EyeOff className="w-3 h-3 text-foreground" />
                              : <Eye className="w-3 h-3 text-muted-foreground" />}
                          </Button>
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
                          {activeCount > 0 && (
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
                            title="Duplicar busca"
                            aria-label="Duplicar busca"
                            disabled={presets.length >= 10}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (presets.length >= 10) {
                                toast.error('Limite de 10 presets atingido');
                                return;
                              }
                              const dup = duplicatePreset(preset.id);
                              if (dup) toast.success('Busca duplicada!', { description: `"${dup.name}"` });
                            }}
                          >
                            <Copy className="w-3 h-3 text-muted-foreground" />
                 <Button
                            variant="ghost"
                            size="icon" aria-label="Baixar JSON"
                            className="h-6 w-6"
                            title="Baixar JSON"
                            onClick={(e) => { e.stopPropagation(); exportOne(preset); }}
                          >
                            <Download className="w-3 h-3 text-muted-foreground" />
                          </Button>ro<Button
                            variant="ghost"
                            size="icon" aria-label="Copiar link"
                            className="h-6 w-6"
                            title="Copiar link"
                            onClick={(e) => { e.stopPropagation(); copyLink(preset); }}
                          >
                            <Link2 className="w-3 h-3 text-muted-foreground" />
                          </Button>"w<Button
                            variant="ghost"
                            size="icon" aria-label="Remover"
                            className="h-6 w-6"
                            title="Remover"
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePreset(preset.id);
                              toast('Busca removida');
                            }}
                          >
                            <Trash2 className="w-3 h-3 text-muted-foreground" />
                          </Button>       <Trash2 className="w-3 h-3 text-muted-foreground" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  {previewId === preset.id && (
                    <div className="px-2.5 py-2 bg-muted/20 border-l-2 border-muted-foreground/30 space-y-2">
                      <p className="text-[11px] text-muted-foreground">
                        Mudanças que serão aplicadas (atual → preset):
                      </p>
                      <PresetFiltersDiff
                        before={{
                          q: currentPayload.q ? [currentPayload.q] : [],
                          contact: currentPayload.contact ? [currentPayload.contact] : [],
                          company: currentPayload.company ? [currentPayload.company] : [],
                          canais: currentPayload.canais,
                          de: currentPayload.de ? [currentPayload.de] : [],
                          ate: currentPayload.ate ? [currentPayload.ate] : [],
                          sort: currentPayload.sort ? [currentPayload.sort] : [],
                        }}
                        after={preset.filters}
                        labelFor={{
                          q: 'Busca livre',
                          contact: 'Contato',
                          company: 'Empresa',
                          canais: 'Canais',
                          de: 'De',
                          ate: 'Até',
                          sort: 'Ordenação',
                        }}
                      />
                      <div className="flex items-center justify-end gap-1.5 pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={(e) => { e.stopPropagation(); setPreviewId(null); }}
                        >
                          Fechar
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 px-2 text-xs gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewId(null);
                            applyPreset(preset);
                          }}
                        >
                          <Check className="w-3 h-3" />
                          Aplicar
                        </Button>
                      </div>
                    </div>
                  )}
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {presets.length === 0 && !isNaming && (
            <div className="p-4 text-center text-muted-foreground">
              <Bookmark className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
              <p className="text-xs">Nenhuma busca salva.</p>
              <p className="text-xs mt-0.5">Aplique filtros e clique em "Salvar".</p>
            </div>
          )}

          <div className="px-2.5 py-2 border-t border-border flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Zap className={`w-3.5 h-3.5 shrink-0 ${autoSave && activePresetId ? 'text-primary' : 'text-muted-foreground'}`} />
              <div className="min-w-0">
                <label htmlFor="autosave-toggle" className="text-xs font-medium text-foreground cursor-pointer">
                  Auto-salvar preset
                </label>
                <p className="text-[10px] text-muted-foreground truncate">
                  {!activePresetId
                    ? 'Aplique ou salve um preset para ativar'
                    : autoSave
                      ? `Salvando em "${presets.find(p => p.id === activePresetId)?.name ?? '—'}"${autoSavedAt ? ' · sincronizado' : ''}`
                      : `Preset ativo: "${presets.find(p => p.id === activePresetId)?.name ?? '—'}"`}
                </p>
              </div>
            </div>
            <Switch
              id="autosave-toggle"
              checked={autoSave}
              onCheckedChange={setAutoSave}
              disabled={!activePresetId}
              aria-label="Alternar auto-salvar preset"
            />
          </div>

          <div className="p-2.5 border-t border-border space-y-1.5">
            {isNaming ? (

              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  autoFocus
                  placeholder="Nome da busca..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                    if (e.key === 'Escape') { setIsNaming(false); setName(''); }
                  }}
                  maxLength={60}
                  className="h-8 text-sm"
                />
                {!name.trim() && (
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
                <Button size="sm" className="h-8 px-2" onClick={handleSave} disabled={!name.trim()}>
                  <Check className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-xs"
                onClick={handleStartNaming}
                disabled={activeCount === 0 || presets.length >= 10}
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                {presets.length >= 10 ? 'Limite de 10 buscas atingido' : 'Salvar busca atual'}
              </Button>
            )}

            <div className="flex gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 justify-start gap-2 text-xs"
                onClick={() => { setOpen(false); setImportOpen(true); }}
              >
                <Upload className="w-3.5 h-3.5" />
                Importar buscas
              </Button>
              {presets.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 justify-start gap-2 text-xs"
                  onClick={exportAll}
                  title="Baixar todas como JSON"
                >
                  <FileJson className="w-3.5 h-3.5" />
                  Exportar todas
                </Button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <ImportPresetsDialog open={importOpen} onOpenChange={setImportOpen} />

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
                    after={{
                      q: currentPayload.q ? [currentPayload.q] : [],
                      contact: currentPayload.contact ? [currentPayload.contact] : [],
                      company: currentPayload.company ? [currentPayload.company] : [],
                      canais: currentPayload.canais,
                      de: currentPayload.de ? [currentPayload.de] : [],
                      ate: currentPayload.ate ? [currentPayload.ate] : [],
                      sort: currentPayload.sort ? [currentPayload.sort] : [],
                    }}
                    labelFor={{
                      q: 'Busca livre',
                      contact: 'Contato',
                      company: 'Empresa',
                      canais: 'Canais',
                      de: 'De',
                      ate: 'Até',
                      sort: 'Ordenação',
                    }}
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
});
