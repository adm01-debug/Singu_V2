import { memo, useEffect, useState } from 'react';
import { Tag, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  ALL_TAGS,
  TAG_DICTIONARY,
  type InteractionTag,
} from '@/lib/interactionTags';

interface Props {
  selected: InteractionTag[];
  onChange: (next: InteractionTag[]) => void;
  counts: Record<InteractionTag, number>;
}

/**
 * Dropdown multi-seleção de tags temáticas (orçamento, follow-up, proposta…).
 * Escuta evento `ficha360:open-tags` para abrir via atalho Shift+T.
 */
export const FiltroTagsDropdown = memo(function FiltroTagsDropdown({
  selected,
  onChange,
  counts,
}: Props) {
  const [open, setOpen] = useState(false);
  const selectedSet = new Set<InteractionTag>(selected);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('ficha360:open-tags', handler);
    return () => window.removeEventListener('ficha360:open-tags', handler);
  }, []);

  const toggle = (tag: InteractionTag) => {
    if (selectedSet.has(tag)) onChange(selected.filter((t) => t !== tag));
    else onChange([...selected, tag]);
  };

  const selectedCountSuffix = selected.length ? ` (${selected.length} selecionadas)` : '';
  const tagsAriaLabel = `Filtrar por tags${selectedCountSuffix}`;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          aria-label={tagsAriaLabel}
          title="Filtrar por tags temáticas (Shift + T)"
        >
          <Tag className="h-3.5 w-3.5" />
          <span>Tags</span>
          {selected.length > 0 && (
            <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground tabular-nums">
              {selected.length}
            </span>
          )}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          Tags temáticas
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-72 overflow-y-auto py-1">
          {ALL_TAGS.map((tag) => {
            const meta = TAG_DICTIONARY[tag];
            const count = counts[tag] ?? 0;
            const isSelected = selectedSet.has(tag);
            const isEmpty = count === 0 && !isSelected;
            return (
              <button
                key={tag}
                type="button"
                role="menuitemcheckbox"
                aria-checked={isSelected}
                aria-label={`${meta.label} — ${count} interaç${count === 1 ? 'ão' : 'ões'}`}
                onClick={(e) => {
                  e.preventDefault();
                  toggle(tag);
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-xs transition-colors',
                  'hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:bg-accent',
                  isEmpty && 'opacity-50',
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      'flex h-3.5 w-3.5 items-center justify-center rounded-sm border',
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-background',
                    )}
                    aria-hidden="true"
                  >
                    {isSelected && (
                      <svg
                        viewBox="0 0 16 16"
                        className="h-2.5 w-2.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <path d="M3 8l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className="truncate">{meta.label}</span>
                </span>
                <span className="tabular-nums text-[10px] text-muted-foreground">
                  {count > 200 ? '200+' : count}
                </span>
              </button>
            );
          })}
        </div>
        {selected.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onChange([]);
              }}
              className="flex w-full items-center gap-1.5 rounded-sm px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              aria-label="Limpar todas as tags selecionadas"
            >
              <X className="h-3 w-3" /> Limpar tags
            </button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
