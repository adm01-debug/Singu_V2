import React from 'react';
import { Loader2, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  /** Há mais itens não exibidos? Quando false, exibe estado de "tudo carregado". */
  hasMore: boolean;
  /** Quantos itens já estão visíveis. */
  totalLoaded: number;
  /** Quantos itens existem no total (após filtros). */
  total: number;
  /** Classe extra para customizar offset/sticky-top no container hospedeiro. */
  className?: string;
  /**
   * Offset CSS para a posição sticky (ex.: '0px', '3.5rem'). Default: 0.
   * Use quando houver header fixo acima.
   */
  topOffset?: string;
  /**
   * Quando `true` (default), também exibe a contagem no estado inicial — antes
   * de qualquer scroll — mesmo que `totalLoaded === total` (lista cabe inteira).
   * Útil para o usuário entender a profundidade do dataset desde o primeiro frame.
   * Defina como `false` para ocultar quando não há `hasMore`.
   */
  showWhenComplete?: boolean;
}

/**
 * Indicador sticky no topo de uma seção de lista com carregamento incremental.
 *
 * Dois modos visuais:
 *  - **Carregando** (`hasMore === true`): ícone de spinner, label "Exibindo X de Y · Z restantes"
 *    e mini barra de progresso. Aparece antes do sentinela, sinalizando que
 *    mais itens serão revelados conforme rolar.
 *  - **Completo** (`hasMore === false`, `showWhenComplete=true`): ícone de check,
 *    label "X itens" — mantém o usuário ciente do tamanho do dataset desde o início.
 *
 * Acessível via `role="status"` + `aria-live="polite"` para anunciar mudanças
 * de profundidade carregada a leitores de tela.
 */
export const IncrementalLoadStickyBar = React.memo(function IncrementalLoadStickyBar({
  hasMore,
  totalLoaded,
  total,
  className,
  topOffset = '0px',
  showWhenComplete = true,
}: Props) {
  if (total === 0) return null;
  if (!hasMore && !showWhenComplete) return null;

  const pct = Math.min(100, Math.round((totalLoaded / total) * 100));
  const remaining = Math.max(0, total - totalLoaded);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{ top: topOffset }}
      className={cn(
        'sticky z-10 -mx-2 mb-2 px-3 py-1.5 rounded-md',
        'bg-background/85 backdrop-blur-sm border border-border/60 shadow-sm',
        'flex items-center gap-2 text-xs text-muted-foreground',
        className,
      )}
    >
      {hasMore ? (
        <Loader2 className="h-3 w-3 animate-spin text-primary shrink-0" aria-hidden="true" />
      ) : (
        <ListChecks className="h-3 w-3 text-primary shrink-0" aria-hidden="true" />
      )}
      <span className="tabular-nums">
        {hasMore ? (
          <>
            Exibindo <strong className="text-foreground font-medium">{totalLoaded}</strong> de{' '}
            <strong className="text-foreground font-medium">{total}</strong>
            <span className="hidden sm:inline">
              {' '}· {remaining} {remaining === 1 ? 'restante' : 'restantes'}
            </span>
          </>
        ) : (
          <>
            <strong className="text-foreground font-medium">{total}</strong>{' '}
            {total === 1 ? 'item' : 'itens'}
            <span className="hidden sm:inline"> · todos carregados</span>
          </>
        )}
      </span>
      {hasMore && (
        <div
          className="ml-auto h-1 w-16 sm:w-24 rounded-full bg-muted overflow-hidden"
          aria-hidden="true"
        >
          <div
            className="h-full bg-primary/70 transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
});
