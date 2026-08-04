import React from 'react';
import { Smile, Meh, Frown, Sparkles, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { SentimentoFilter } from '@/hooks/useInteractionsAdvancedFilter';

interface Props {
  value: SentimentoFilter | undefined;
  onChange: (value: SentimentoFilter | undefined) => void;
  counts?: Partial<Record<SentimentoFilter, number>>;
}

interface ItemConfig {
  key: SentimentoFilter | 'all';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  activeClass: string;
}

const ITEMS: ItemConfig[] = [
  { key: 'all',      label: 'Todos',    icon: Filter,    activeClass: 'border-primary bg-primary/10 text-foreground' },
  { key: 'positive', label: 'Positivo', icon: Smile,     activeClass: 'border-success bg-success/10 text-success' },
  { key: 'neutral',  label: 'Neutro',   icon: Meh,       activeClass: 'border-warning bg-warning/10 text-warning' },
  { key: 'negative', label: 'Negativo', icon: Frown,     activeClass: 'border-destructive bg-destructive/10 text-destructive' },
  { key: 'mixed',    label: 'Misto',    icon: Sparkles,  activeClass: 'border-accent bg-accent/10 text-accent-foreground' },
];

export const SentimentQuickFilter = React.memo(function SentimentQuickFilter({ value, onChange, counts }: Props) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Item atualmente "checked" — usado para roving tabindex (apenas o ativo é
  // alcançável por Tab; setas movem entre os demais).
  const activeKey: SentimentoFilter | 'all' = value ?? 'all';

  const focusByIndex = React.useCallback((idx: number) => {
    const root = containerRef.current;
    if (!root) return;
    const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('button[role="radio"]'));
    if (buttons.length === 0) return;
    const safeIdx = (idx + buttons.length) % buttons.length;
    buttons[safeIdx]?.focus();
  }, []);

  const moveFocus = React.useCallback((dir: 1 | -1) => {
    const root = containerRef.current;
    if (!root) return;
    const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('button[role="radio"]'));
    if (buttons.length === 0) return;
    const idx = buttons.findIndex((b) => b === document.activeElement);
    focusByIndex((idx === -1 ? 0 : idx) + dir);
  }, [focusByIndex]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        moveFocus(1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        moveFocus(-1);
        break;
      case 'Home':
        e.preventDefault();
        focusByIndex(0);
        break;
      case 'End':
        e.preventDefault();
        focusByIndex(-1); // wrap → último
        break;
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div
        ref={containerRef}
        role="radiogroup"
        aria-label="Filtrar por sentimento"
        onKeyDown={handleKeyDown}
        className="flex flex-wrap items-center gap-1.5"
      >
        {ITEMS.map(({ key, label, icon: Icon, activeClass }) => {
          const isAll = key === 'all';
          const active = isAll ? !value : value === key;
          const count = !isAll && counts ? counts[key as SentimentoFilter] : undefined;
          // Roving tabindex: somente o item ativo entra na ordem de Tab.
          const tabIndex = key === activeKey ? 0 : -1;
          const ariaLabel = isAll
            ? 'Todos os sentimentos'
            : typeof count === 'number'
              ? `${label} (${count} ${count === 1 ? 'interação' : 'interações'})`
              : label;
          const handleSelect = () => onChange(isAll ? undefined : (key as SentimentoFilter));
          return (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={ariaLabel}
                  tabIndex={tabIndex}
                  onClick={handleSelect}
                  // Space precisa ser tratado explicitamente em role="radio";
                  // Enter já é nativo em <button>, mas reforçamos por consistência.
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter') {
                      e.preventDefault();
                      handleSelect();
                    }
                  }}
                  className={cn(
                    'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full border text-xs font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    active
                      ? activeClass
                      : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{label}</span>
                  {typeof count === 'number' && count > 0 && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        'ml-0.5 inline-flex items-center justify-center min-w-[1.25rem] h-4 px-1 rounded-full text-[10px] font-semibold tabular-nums',
                        active ? 'bg-foreground/10' : 'bg-muted',
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {isAll ? 'Mostrar todos os sentimentos' : `Filtrar por ${label.toLowerCase()}`}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
});
