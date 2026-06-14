import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search, X, User, Building2, Check, Sigma,
  MessageSquare, Phone, Mail, Users as UsersIcon, Video, FileText,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import type { AdvancedFilters } from '@/hooks/useInteractionsAdvancedFilter';
import { InteracoesPresetsMenu } from './InteracoesPresetsMenu';
import { CanaisQuickFilter } from './CanaisQuickFilter';
import { DirecaoQuickFilter } from './DirecaoQuickFilter';
import { SortChips } from './SortChips';
import { DateRangePopover } from './DateRangePopover';
import { ViewModeChips } from './ViewModeChips';

interface ContactOption { id: string; label: string }
interface CompanyOption { id: string; label: string }

interface Props {
  filters: AdvancedFilters;
  setFilter: <K extends keyof AdvancedFilters>(key: K, value: AdvancedFilters[K]) => void;
  clear: () => void;
  activeCount: number;
  contacts: ContactOption[];
  companies: CompanyOption[];
  resultsCount: number;
  totalCount: number;
  applyAll?: (next: Partial<AdvancedFilters>) => void;
  applyDateRange: (de?: Date, ate?: Date) => boolean;
  /** Limpeza atômica do range — repassada ao DateRangePopover e ao botão "X". */
  clearDateRange?: () => boolean;
  channelCounts?: Record<string, number>;
}

export const AdvancedSearchBar = React.memo(function AdvancedSearchBar({
  filters, setFilter, clear, activeCount, contacts, companies, resultsCount, totalCount, applyAll, applyDateRange, clearDateRange, channelCounts,
}: Props) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = () => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    };
    /**
     * Devolve o foco ao input de busca após a remoção de um chip de filtro.
     *
     * Acessibilidade:
     *  - `focus({ preventScroll: true })` evita que o navegador role a página
     *    para o input quando ele está fora da viewport (ex.: usuário rolou
     *    para baixo na lista e clicou num chip ainda visível na sticky bar).
     *  - Se o evento trouxer `caret` no detail (CustomEvent), restauramos a
     *    posição EXATA do cursor antes da remoção — preserva a edição em
     *    andamento. Sem `caret`, posicionamos no fim como fallback seguro.
     *  - `setSelectionRange` é envolto em try/catch porque alguns tipos de
     *    input (ex.: type="email") lançam InvalidStateError no Firefox.
     */
    const caretEndHandler = (ev: Event) => {
      const el = searchInputRef.current;
      if (!el) return;
      const len = el.value?.length ?? 0;
      const detail = (ev as CustomEvent<{ caret?: number | null }>).detail;
      const requested = typeof detail?.caret === 'number' ? detail.caret : null;
      const pos = requested === null ? len : Math.max(0, Math.min(len, requested));
      el.focus({ preventScroll: true });
      try { el.setSelectionRange(pos, pos); } catch { /* noop */ }
      // Pulso visual de foco: sinaliza que o input voltou a aceitar digitação
      // após a remoção do chip. Reaplica a classe (remove + reflow + add) para
      // que o `animation` reinicie mesmo se múltiplos chips forem removidos
      // em sequência rápida (o navegador só reinicia animation com troca real).
      el.classList.remove('search-focus-flash');
      // Forçar reflow garantindo o restart da animação. Acessar offsetWidth é
      // o padrão clássico para sincronizar o style recalc antes do próximo add.
      // Atribuição força a leitura de offsetWidth (reflow) sem usar o operador void.
      const reflow = el.offsetWidth;
      if (reflow < 0) { /* nunca ocorre: leitura existe só para sincronizar o reflow */ }
      el.classList.add('search-focus-flash');
      window.setTimeout(() => el.classList.remove('search-focus-flash'), 1000);
    };
    window.addEventListener('focus-interactions-search', handler);
    window.addEventListener('focus-interactions-search-caret-end', caretEndHandler);
    return () => {
      window.removeEventListener('focus-interactions-search', handler);
      window.removeEventListener('focus-interactions-search-caret-end', caretEndHandler);
    };
  }, []);

  /**
   * Rastreia continuamente a última posição conhecida do cursor no input de
   * busca e a persiste em `data-last-caret` no próprio elemento DOM.
   *
   * Por que isso é necessário:
   *  - Quando o usuário digita algo no meio da string e clica no "X" de um
   *    chip de filtro, o foco sai do input ANTES de `onAfterRemove` rodar.
   *    Nesse instante `document.activeElement` já não é o input e
   *    `selectionStart` perde o valor anterior — o handler externo não tem
   *    como recuperar a posição original sem essa memória persistida.
   *  - Armazenar no atributo `data-last-caret` mantém o acoplamento mínimo:
   *    `InteracoesContent` lê via querySelector sem precisar de contexto,
   *    callback prop ou estado compartilhado.
   *
   * Eventos cobertos (todos disparam ANTES do blur causado pelo mousedown
   * no chip): `keyup` (digitação/setas), `click` (reposicionamento via
   * mouse), `select` (seleção arrastada), `input` (colar/cortar).
   */
  useEffect(() => {
    const el = searchInputRef.current;
    if (!el) return;
    const track = () => {
      if (typeof el.selectionStart === 'number') {
        el.dataset.lastCaret = String(el.selectionStart);
      }
    };
    el.addEventListener('keyup', track);
    el.addEventListener('click', track);
    el.addEventListener('select', track);
    el.addEventListener('input', track);
    el.addEventListener('focus', track);
    return () => {
      el.removeEventListener('keyup', track);
      el.removeEventListener('click', track);
      el.removeEventListener('select', track);
      el.removeEventListener('input', track);
      el.removeEventListener('focus', track);
    };
  }, []);

  const selectedContact = useMemo(
    () => contacts.find(c => c.id === filters.contact),
    [contacts, filters.contact]
  );
  const selectedCompany = useMemo(
    () => companies.find(c => c.id === filters.company),
    [companies, filters.company]
  );

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/60 pb-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[260px] max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            data-interacoes-search
            placeholder="Buscar palavra-chave em título, conteúdo ou tags..."
            value={filters.q}
            onChange={(e) => setFilter('q', e.target.value)}
            className={cn('pl-10', filters.q && 'pr-10')}
          />
          {filters.q && (
            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setFilter('q', '')}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <SelectedChannelsIndicator
          canais={filters.canais}
          onChange={(next) => setFilter('canais', next)}
        />

        <CanaisQuickFilter
          canais={filters.canais}
          onChange={(next) => setFilter('canais', next)}
          counts={channelCounts}
        />

        <ChannelsTotalBadge counts={channelCounts} />

        <DirecaoQuickFilter
          value={filters.direcao}
          onChange={(v) => setFilter('direcao', v)}
        />

        <EntityPicker
          icon={User}
          placeholder="Pessoa"
          options={contacts}
          selected={selectedContact}
          onSelect={(id) => setFilter('contact', id)}
        />

        <EntityPicker
          icon={Building2}
          placeholder="Empresa"
          options={companies}
          selected={selectedCompany}
          onSelect={(id) => setFilter('company', id)}
        />

        <DateRangePopover de={filters.de} ate={filters.ate} applyDateRange={applyDateRange} clearDateRange={clearDateRange} />

        {(filters.de || filters.ate) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => (clearDateRange ? clearDateRange() : applyDateRange(undefined, undefined))}
                className="h-9 px-2 text-muted-foreground hover:text-destructive"
                aria-label="Limpar filtros de data"
              >
                <X className="w-4 h-4" />
                <span className="hidden md:inline ml-1">Limpar datas</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Limpar filtros de data (Alt+D)</TooltipContent>
          </Tooltip>
        )}

        <div className="hidden h-6 w-px bg-border sm:block" aria-hidden="true" />
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground hidden sm:inline">
          Ordenar:
        </span>
        <SortChips
          value={filters.sort}
          onChange={(v) => setFilter('sort', v)}
          hasQuery={!!filters.q.trim()}
          channelCounts={channelCounts}
        />

        <ViewModeChips
          value={filters.view}
          onChange={(v) => setFilter('view', v)}
        />

        <InteracoesPresetsMenu
          filters={filters}
          setFilter={setFilter}
          clear={clear}
          activeCount={activeCount}
          onApplyAll={applyAll}
        />

        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clear} className="gap-1 text-muted-foreground">
            <X className="w-4 h-4" /> Limpar tudo
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <div className="ml-auto text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{resultsCount}</span> de {totalCount} interações
          {activeCount > 0 && <> · <span className="text-primary">{activeCount} filtro{activeCount > 1 ? 's' : ''} ativo{activeCount > 1 ? 's' : ''}</span></>}
        </div>
      </div>
    </div>
  );
});

/**
 * Total geral de interações no escopo atual (somatório dos canais visíveis).
 * Fica visível ao lado do seletor de canais para o usuário ter o "tamanho do
 * universo filtrado" sem precisar recorrer aos chips de busca avançada.
 */
function ChannelsTotalBadge({ counts }: { counts?: Record<string, number> }) {
  const { total, channelsCount } = useMemo(() => {
    if (!counts) return { total: 0, channelsCount: 0 };
    const values = Object.values(counts);
    return {
      total: values.reduce((acc, n) => acc + (Number.isFinite(n) ? n : 0), 0),
      channelsCount: values.filter((n) => n > 0).length,
    };
  }, [counts]);

  if (!counts || total === 0) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            role="status"
            aria-label={`Total de ${total} interações no escopo atual`}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-border bg-muted/40 text-xs text-muted-foreground"
          >
            <Sigma className="w-3.5 h-3.5" />
            <span className="tabular-nums font-semibold text-foreground">{total}</span>
            <span className="hidden sm:inline">interaç{total === 1 ? 'ão' : 'ões'}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[260px] text-xs">
          Somatório dos canais no escopo atual ({channelsCount} cana{channelsCount === 1 ? 'l' : 'is'} com interações).
          Atualiza conforme você ajusta busca, pessoa, empresa, período ou sentimento.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

const CHANNEL_ICON_META: Array<{
  value: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = [
  { value: 'whatsapp', label: 'WhatsApp', Icon: MessageSquare },
  { value: 'call', label: 'Ligação', Icon: Phone },
  { value: 'email', label: 'Email', Icon: Mail },
  { value: 'meeting', label: 'Reunião', Icon: UsersIcon },
  { value: 'video_call', label: 'Vídeo', Icon: Video },
  { value: 'note', label: 'Nota', Icon: FileText },
];

/**
 * Indicador compacto ao lado da busca: exibe ícones+labels dos canais
 * selecionados com o atalho `Alt+N` correspondente. Cada chip é clicável
 * para remover o canal individualmente; tooltip mostra o atalho completo.
 *
 * Aparece apenas quando há ao menos um canal selecionado.
 */
function SelectedChannelsIndicator({
  canais,
  onChange,
}: {
  canais: string[];
  onChange: (next: string[]) => void;
}) {
  const selected = useMemo(() => {
    const set = new Set(canais);
    return CHANNEL_ICON_META
      .map((meta, idx) => ({ ...meta, shortcut: `Alt+${idx + 1}` }))
      .filter((c) => set.has(c.value));
  }, [canais]);

  if (selected.length === 0) return null;

  const remove = (value: string) => {
    onChange(canais.filter((c) => c !== value));
  };

  // Mostra até 3 com label legível; o restante vira contador "+N".
  const visible = selected.slice(0, 3);
  const overflow = selected.length - visible.length;

  return (
    <TooltipProvider delayDuration={200}>
      <div
        role="group"
        aria-label={`Canais selecionados: ${selected.map((c) => c.label).join(', ')}`}
        className="inline-flex items-center gap-1 h-8 px-1 rounded-md border border-primary/30 bg-primary/5"
      >
        <span className="hidden md:inline text-[10px] uppercase tracking-wide text-primary/80 px-1 font-semibold">
          Canais
        </span>
        {visible.map((c) => {
          const Icon = c.Icon;
          return (
            <Tooltip key={c.value}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => remove(c.value)}
                  aria-label={`Remover ${c.label} (${c.shortcut})`}
                  className="group inline-flex items-center gap-1 h-6 px-1.5 rounded text-xs font-medium text-foreground bg-background hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <Icon className="w-3 h-3 shrink-0" />
                  <span className="hidden lg:inline">{c.label}</span>
                  <kbd className="hidden md:inline-flex items-center justify-center min-w-[28px] h-4 px-1 rounded bg-muted text-[9px] font-mono font-semibold text-muted-foreground group-hover:bg-destructive/20">
                    {c.shortcut}
                  </kbd>
                  <X className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {c.label} · pressione <span className="font-mono font-semibold">{c.shortcut}</span> para alternar
              </TooltipContent>
            </Tooltip>
          );
        })}
        {overflow > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center justify-center h-6 px-1.5 rounded text-[10px] font-semibold text-primary bg-primary/10">
                +{overflow}
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs max-w-[240px]">
              {selected.slice(3).map((c) => `${c.label} (${c.shortcut})`).join(', ')}
            </TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onChange([])}
              aria-label="Limpar todos os canais (Alt+0)"
              className="inline-flex items-center justify-center h-6 w-6 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Limpar todos · <span className="font-mono font-semibold">Alt+0</span>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

interface EntityPickerProps {
  icon: typeof User;
  placeholder: string;
  options: { id: string; label: string }[];
  selected?: { id: string; label: string };
  onSelect: (id: string) => void;
}

function EntityPicker({ icon: Icon, placeholder, options, selected, onSelect }: EntityPickerProps) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn('justify-start gap-2 max-w-[200px]', !selected && 'text-muted-foreground')}>
          <Icon className="w-4 h-4 shrink-0" />
          <span className="truncate">{selected?.label ?? placeholder}</span>
          {selected && (
            <X
              className="w-3.5 h-3.5 ml-1 shrink-0 opacity-60 hover:opacity-100"
              onClick={(e) => { e.stopPropagation(); onSelect(''); }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Buscar ${placeholder.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>Nenhum resultado.</CommandEmpty>
            <CommandGroup>
              {options.slice(0, 100).map(opt => (
                <CommandItem
                  key={opt.id}
                  value={opt.label}
                  onSelect={() => { onSelect(opt.id); setOpen(false); }}
                >
                  <Check className={cn('mr-2 h-4 w-4', selected?.id === opt.id ? 'opacity-100' : 'opacity-0')} />
                  <span className="truncate">{opt.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
