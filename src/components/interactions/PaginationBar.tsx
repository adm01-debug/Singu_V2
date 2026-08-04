import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { VALID_PER_PAGE } from '@/hooks/useInteractionsAdvancedFilter';

interface Props {
  page: number;
  perPage: number;
  total: number;
  onPageChange: (p: number) => void;
  onPerPageChange: (pp: number) => void;
  /** Disparado ao passar o mouse / focar no botão "Próxima" — pré-aquece a transição. */
  onPrefetchNext?: () => void;
}

/**
 * Algoritmo "windowed" para páginas: sempre mostra primeira, vizinhas da atual e última,
 * com elipses entre intervalos descontínuos.
 */
function buildWindow(current: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const set = new Set<number>([1, totalPages, current, current - 1, current + 1]);
  const sorted = Array.from(set).filter(n => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  const out: Array<number | 'ellipsis'> = [];
  for (let i = 0; i < sorted.length; i++) {
    out.push(sorted[i]);
    if (i < sorted.length - 1 && sorted[i + 1] - sorted[i] > 1) out.push('ellipsis');
  }
  return out;
}

export const PaginationBar = React.memo(function PaginationBar({
  page, perPage, total, onPageChange, onPerPageChange, onPrefetchNext,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const window = useMemo(() => buildWindow(page, totalPages), [page, totalPages]);

  if (total === 0 || total <= perPage) return null;

  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border/60">
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
          className="gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Anterior</span>
        </Button>

        {window.map((item, idx) =>
          item === 'ellipsis' ? (
            <span key={`e-${idx}`} className="px-2 text-muted-foreground select-none" aria-hidden>
              …
            </span>
          ) : (
            <Button
              key={item}
              variant={item === page ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onPageChange(item)}
              aria-current={item === page ? 'page' : undefined}
              aria-label={`Ir para página ${item}`}
              className={cn('min-w-[2.25rem]', item === page && 'pointer-events-none')}
            >
              {item}
            </Button>
          )
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          onMouseEnter={onPrefetchNext}
          onFocus={onPrefetchNext}
          onTouchStart={onPrefetchNext}
          disabled={page >= totalPages}
          aria-label="Próxima página"
          className="gap-1"
        >
          <span className="hidden sm:inline">Próxima</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Mostrar</span>
          <Select value={String(perPage)} onValueChange={(v) => onPerPageChange(parseInt(v, 10))}>
            <SelectTrigger className="h-8 w-[72px]" aria-label="Itens por página">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VALID_PER_PAGE.map(n => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="tabular-nums">
          <span className="font-medium text-foreground">{start}–{end}</span> de <span className="font-medium text-foreground">{total}</span>
        </span>
      </div>
    </div>
  );
});
