import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Hash, Info, Sparkles, Users } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { SortKey } from '@/lib/sortInteractions';

interface Props {
  value: SortKey;
  onChange: (value: SortKey) => void;
  hasQuery: boolean;
  /**
   * Contagens por canal já calculadas no escopo atual (mesmos números dos
   * chips de canal). Quando ausente ou vazio, a opção "Por canal" fica
   * desabilitada porque não há referência para ordenar.
   */
  channelCounts?: Record<string, number>;
}

interface SortConfigItem {
  key: SortKey;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut: string;
  requiresQuery?: boolean;
  requiresChannelCounts?: boolean;
}

const SORT_CONFIG: SortConfigItem[] = [
  { key: 'recent', label: 'Mais recentes', description: 'Ordena pela data da interação, das mais novas para as mais antigas.', icon: ArrowDown, shortcut: 'R' },
  { key: 'oldest', label: 'Mais antigas', description: 'Ordena pela data da interação, das mais antigas para as mais novas.', icon: ArrowUp, shortcut: 'O' },
  { key: 'relevance', label: 'Melhor correspondência', description: 'Ranqueia pela pontuação do termo buscado (título 3×, tags 2×, conteúdo 1×).', icon: Sparkles, shortcut: 'M', requiresQuery: true },
  { key: 'entity', label: 'Por pessoa/empresa', description: 'Agrupa as interações pela entidade vinculada (contato ou empresa) e ordena alfabeticamente.', icon: Users, shortcut: 'P' },
  { key: 'channel', label: 'Por canal', description: 'Agrupa as interações por canal (WhatsApp, e-mail, ligação...) seguindo a ordem dos chips.', icon: Hash, shortcut: 'C', requiresChannelCounts: true },
];

export const SortChips = React.memo(function SortChips({ value, onChange, hasQuery, channelCounts }: Props) {
  const hasChannelCounts = useMemo(
    () => !!channelCounts && Object.values(channelCounts).some((n) => n > 0),
    [channelCounts],
  );
  const effective: SortKey = useMemo(() => {
    if (value === 'relevance' && !hasQuery) return 'recent';
    if (value === 'channel' && !hasChannelCounts) return 'recent';
    return value;
  }, [value, hasQuery, hasChannelCounts]);
  const [altDown, setAltDown] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setAltDown(true);
      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const k = e.key.toLowerCase();
      const item = SORT_CONFIG.find(i => i.shortcut.toLowerCase() === k);
      if (!item) return;
      if (item.requiresQuery && !hasQuery) return;
      if (item.requiresChannelCounts && !hasChannelCounts) return;
      e.preventDefault();
      if (effective !== item.key) {
        onChange(item.key);
        // Toast curto e único — não dispara no no-op (mesmo chip ativo).
        toast.message(`↕ ${item.label}`, { id: 'sort-change', duration: 1200 });
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setAltDown(false);
    };
    const onBlur = () => setAltDown(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [effective, hasQuery, hasChannelCounts, onChange]);

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className="inline-flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5"
        role="group"
        aria-label="Ordenar lista"
      >
        {SORT_CONFIG.map(({ key, label, description, icon: Icon, shortcut, requiresQuery, requiresChannelCounts }) => {
          const active = effective === key;
          const disabled =
            (!!requiresQuery && !hasQuery) ||
            (!!requiresChannelCounts && !hasChannelCounts);
          const disabledReason = requiresQuery
            ? 'Desabilitado: digite um termo na busca para ranquear por relevância.'
            : 'Desabilitado: nenhum canal com interações no escopo atual.';

          return (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  disabled={disabled}
                  aria-pressed={active}
                  aria-label={label}
                  onClick={() => {
                    if (disabled || active) return;
                    onChange(key);
                  }}
                  className={cn(
                    'relative inline-flex items-center gap-1.5 h-8 px-2.5 rounded text-xs font-medium transition-colors',
                    active
                      ? 'border border-primary bg-primary/10 text-foreground'
                      : 'border border-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
                    disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground',
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className={cn(active ? 'inline' : 'hidden sm:inline')}>{label}</span>
                  {key === 'relevance' && !disabled && (
                    <Tooltip delayDuration={150}>
                      <TooltipTrigger asChild>
                        <span
                          data-testid="relevance-info-icon"
                          aria-hidden="true"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center ml-0.5 cursor-help"
                        >
                          <Info className="w-3 h-3 text-muted-foreground/70" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[260px] text-xs">
                        Pontuação por ocorrências do termo: título conta 3×, tags 2×, conteúdo 1×. Empate desempata pela mais recente.
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {altDown && !disabled && (
                    <kbd className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] px-1 rounded bg-foreground text-background text-[9px] font-mono font-semibold flex items-center justify-center pointer-events-none">
                      {shortcut}
                    </kbd>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[260px] text-xs">
                {disabled ? (
                  <span>{disabledReason}</span>
                ) : (
                  <span>
                    {/* Linha 1: igual ao texto da cheatsheet (?) — "Ordenar: <Label> · Alt+<X>" */}
                    <span className="font-medium">Ordenar: {label}</span>
                    <span className="opacity-70"> · Alt+{shortcut}</span>
                    <br />
                    <span className="opacity-90">{description}</span>
                  </span>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
});
