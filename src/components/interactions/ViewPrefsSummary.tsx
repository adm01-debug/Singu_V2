import React from 'react';
import { Rows3, Rows2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { DensityMode } from '@/hooks/useInteractionsAdvancedFilter';

interface Props {
  /** Modo de densidade atual. */
  density: DensityMode;
  /** Tamanho do lote (itens por página) atual. */
  perPage: number;
  /** Lista de tamanhos de lote permitidos. */
  perPageOptions: readonly number[];
  /** Total de itens visíveis na lista — exibido como contexto opcional. */
  total?: number;
  /** Indica que a densidade só faz sentido na visão de lista. Default: true. */
  densityEnabled?: boolean;
  onDensityChange: (value: DensityMode) => void;
  onPerPageChange: (value: number) => void;
}

const DENSITY_LABEL: Record<DensityMode, string> = {
  comfortable: 'Confortável',
  compact: 'Compacta',
};

/**
 * Resumo visível das preferências de visualização (densidade + lote) com
 * controles inline para alterar ambos diretamente no painel da lista, sem
 * precisar abrir menus. Pensado para reforçar transparência: o usuário SEMPRE
 * vê em qual modo e com qual lote está olhando os dados.
 *
 * Acessibilidade:
 * - Cada controle tem `aria-label` descritivo.
 * - Os botões de densidade usam `aria-pressed` (toggle group).
 * - O seletor de lote usa o `Select` do design system (combobox acessível).
 */
export const ViewPrefsSummary = React.memo(function ViewPrefsSummary({
  density,
  perPage,
  perPageOptions,
  total,
  densityEnabled = true,
  onDensityChange,
  onPerPageChange,
}: Props) {
  return (
    <TooltipProvider delayDuration={200}>
      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground"
        role="group"
        aria-label="Preferências de visualização"
        data-testid="view-prefs-summary"
      >
        {densityEnabled && (
          <div className="inline-flex items-center gap-1.5">
            <span className="hidden sm:inline">Densidade:</span>
            <span className="sr-only">Densidade atual: {DENSITY_LABEL[density]}.</span>
            <div
              className="inline-flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5"
              role="group"
              aria-label="Alterar densidade"
            >
              {(['comfortable', 'compact'] as const).map((d) => {
                const active = density === d;
                const Icon = d === 'compact' ? Rows2 : Rows3;
                return (
                  <Tooltip key={d}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-pressed={active}
                        aria-label={DENSITY_LABEL[d]}
                        onClick={() => {
                          if (active) return;
                          onDensityChange(d);
                        }}
                        className={cn(
                          'inline-flex items-center gap-1.5 h-7 px-2 rounded text-xs font-medium transition-colors',
                          active
                            ? 'border border-primary bg-primary/10 text-foreground'
                            : 'border border-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
                        )}
                      >
                        <Icon className="w-3.5 h-3.5" aria-hidden />
                        <span className="hidden md:inline">{DENSITY_LABEL[d]}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">{DENSITY_LABEL[d]}</TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        )}

        <span className="hidden sm:inline" aria-hidden="true">
          •
        </span>

        <div className="inline-flex items-center gap-1.5">
          <label className="hidden sm:inline" htmlFor="view-prefs-perpage">
            Lote:
          </label>
          <span className="sr-only">Tamanho do lote atual: {perPage} itens por página.</span>
          <Select value={String(perPage)} onValueChange={(v) => onPerPageChange(parseInt(v, 10))}>
            <SelectTrigger
              id="view-prefs-perpage"
              className="h-7 w-[72px] text-xs"
              aria-label="Itens por página"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {perPageOptions.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground">/ página</span>
        </div>

        {typeof total === 'number' && total > 0 && (
          <>
            <span className="hidden sm:inline" aria-hidden="true">
              •
            </span>
            <span className="tabular-nums">
              <span className="font-medium text-foreground">{total}</span>{' '}
              {total === 1 ? 'item' : 'itens'}
            </span>
          </>
        )}
      </div>
    </TooltipProvider>
  );
});
