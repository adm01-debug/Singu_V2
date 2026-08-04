import React, { useMemo } from 'react';
import { History, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  call: 'Ligação',
  email: 'Email',
  meeting: 'Reunião',
  video_call: 'Vídeo',
  note: 'Nota',
};

interface Props {
  history: string[][];
  /** Combinação atualmente aplicada — usada para destacar o item ativo. */
  current: string[];
  onApply: (combo: string[]) => void;
  onRemove: (combo: string[]) => void;
  onClearAll: () => void;
}

function comboLabel(combo: string[]): string {
  return combo.map((c) => CHANNEL_LABELS[c] ?? c).join(' + ');
}

function sameCombo(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

/**
 * Mostra até 5 combinações recentes de canais, MRU. Clique aplica em 1 toque.
 * Esconde-se quando o histórico está vazio.
 */
export const RecentChannelCombos = React.memo(function RecentChannelCombos({
  history,
  current,
  onApply,
  onRemove,
  onClearAll,
}: Props) {
  const items = useMemo(
    () => history.map((combo) => ({ combo, label: comboLabel(combo), isActive: sameCombo(combo, current) })),
    [history, current],
  );

  if (items.length === 0) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className="flex flex-wrap items-center gap-1.5 mt-1.5 pt-1.5 border-t border-border/60"
        role="region"
        aria-label="Combinações recentes de canais"
      >
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <History className="w-3 h-3" aria-hidden="true" />
          Recentes:
        </span>
        {items.map(({ combo, label, isActive }) => (
          <Tooltip key={combo.join('|')}>
            <TooltipTrigger asChild>
              <Badge
                variant={isActive ? 'default' : 'outline'}
                role="button"
                tabIndex={0}
                aria-pressed={isActive}
                aria-label={`Aplicar combinação ${label}${isActive ? ' (atual)' : ''}`}
                onClick={() => { if (!isActive) onApply(combo); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (!isActive) onApply(combo);
                  }
                }}
                className={cn(
                  'cursor-pointer gap-1 px-2 py-0.5 text-[11px] select-none transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                  !isActive && 'hover:bg-muted',
                  isActive && 'cursor-default',
                )}
              >
                <span className="tabular-nums opacity-60">{combo.length}×</span>
                <span className="max-w-[160px] truncate">{label}</span>
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`Remover combinação ${label} do histórico`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(combo);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      onRemove(combo);
                    }
                  }}
                  className="ml-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <X className="w-2.5 h-2.5" aria-hidden="true" />
                </span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">
              {isActive
                ? 'Combinação atualmente aplicada.'
                : `Aplicar ${combo.length} canal${combo.length === 1 ? '' : 'is'}: ${label}.`}
            </TooltipContent>
          </Tooltip>
        ))}
        {items.length > 1 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={onClearAll}
                aria-label="Limpar histórico de combinações de canais"
                className="ml-1 h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
              >
                Limpar histórico
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Apaga as {items.length} combinações salvas.</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
});
