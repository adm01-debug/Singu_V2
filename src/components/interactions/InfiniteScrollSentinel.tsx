import React, { type RefObject } from 'react';
import { ChevronDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useListDensity } from '@/contexts/DensityContext';

interface Props {
  sentinelRef: RefObject<HTMLDivElement>;
  hasMore: boolean;
  totalLoaded: number;
  total: number;
  /**
   * Override explícito. Quando omitido, herda do `DensityProvider` ou do
   * localStorage (`singu-table-density`) via `useListDensity`.
   */
  density?: 'comfortable' | 'compact';
  onLoadMore?: () => void;
}

export const InfiniteScrollSentinel = React.memo(function InfiniteScrollSentinel({
  sentinelRef, hasMore, totalLoaded, total, density, onLoadMore,
}: Props) {
  const ambient = useListDensity();
  const effectiveDensity = density ?? ambient;

  if (total === 0) return null;

  if (hasMore) {
    const isCompact = effectiveDensity === 'compact';
    const pct = total > 0 ? Math.min(100, Math.round((totalLoaded / total) * 100)) : 0;
    const skeletonCount = isCompact ? 2 : 3;

    return (
      <div
        ref={sentinelRef}
        className={cn(isCompact ? 'space-y-2 py-2' : 'space-y-3 py-4')}
        aria-live="polite"
        aria-busy="true"
      >
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={totalLoaded}
          aria-label="Carregando mais interações"
          className="h-1 w-full rounded-full bg-muted overflow-hidden"
        >
          <div
            className="h-full bg-primary/70 transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        {onLoadMore && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={onLoadMore}
              className="h-7 px-3 text-xs gap-1"
              aria-label="Carregar mais interações"
            >
              <ChevronDown className="h-3 w-3" /> Carregar mais
            </Button>
          </div>
        )}
        {Array.from({ length: skeletonCount }).map((_, i) => {
          const variant = SKELETON_VARIANTS[i % SKELETON_VARIANTS.length];
          return isCompact ? (
            <CompactItemSkeleton
              key={i}
              titleMaxWidth={variant.titleWidth}
              metaWidth={variant.metaWidth}
              tagCount={variant.tagCount}
            />
          ) : (
            <ComfortableItemSkeleton
              key={i}
              titleWidth={variant.titleWidth}
              bodyLines={variant.bodyLines}
              tagCount={variant.tagCount}
            />
          );
        })}
        <p className="text-center text-xs text-muted-foreground">
          Carregando mais interações… ({totalLoaded} de {total})
        </p>
      </div>
    );
  }

  const densityLabel = effectiveDensity === 'compact' ? 'compacta' : 'confortável';
  return (
    <div className="py-4 text-center text-xs text-muted-foreground">
      Fim da lista — {totalLoaded} de {total}{' '}
      {totalLoaded === 1 ? 'interação exibida' : 'interações exibidas'}
      {' · '}densidade {densityLabel}
    </div>
  );
});

/**
 * Variantes determinísticas (sem `Math.random` → estáveis em SSR/snapshots) que
 * simulam a heterogeneidade real dos cards de interação: títulos curtos vs.
 * longos, presença/ausência de tags e linhas de corpo de tamanhos diferentes.
 * Aplicadas em ordem cíclica via índice — o usuário percebe variação natural
 * sem flicker, mantendo o layout previsível.
 */
const SKELETON_VARIANTS: ReadonlyArray<{
  titleWidth: string;
  metaWidth: string;
  bodyLines: number;
  tagCount: number;
}> = [
  { titleWidth: 'max-w-[70%]', metaWidth: 'w-2/5', bodyLines: 2, tagCount: 2 },
  { titleWidth: 'max-w-[45%]', metaWidth: 'w-1/3', bodyLines: 1, tagCount: 0 },
  { titleWidth: 'max-w-[60%]', metaWidth: 'w-1/2', bodyLines: 2, tagCount: 3 },
  { titleWidth: 'max-w-[35%]', metaWidth: 'w-1/4', bodyLines: 1, tagCount: 1 },
];

interface CompactItemSkeletonProps {
  titleMaxWidth?: string;
  /** Largura da linha de meta (ex.: 'w-2/5'). */
  metaWidth?: string;
  /** Número de chips/tags simuladas após a linha de meta (0 esconde a faixa). */
  tagCount?: number;
}

export function CompactItemSkeleton({
  titleMaxWidth = 'max-w-[60%]',
  metaWidth = 'w-2/5',
  tagCount = 0,
}: CompactItemSkeletonProps) {
  return (
    <div className="flex items-start gap-3 px-2 py-2">
      <Skeleton className="mt-0.5 h-7 w-7 rounded-md shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <Skeleton className={cn('h-3.5 flex-1 rounded-sm', titleMaxWidth)} />
          <Skeleton className="h-1.5 w-1.5 rounded-full shrink-0" />
        </div>
        <div className="flex items-center gap-1.5">
          <Skeleton className={cn('h-3 rounded-sm', metaWidth)} />
          {tagCount > 0 && (
            <div className="flex items-center gap-1 ml-1">
              {Array.from({ length: Math.min(tagCount, 3) }).map((_, i) => (
                <Skeleton
                  key={i}
                  className={cn(
                    'h-3 rounded-full',
                    i === 0 ? 'w-10' : i === 1 ? 'w-8' : 'w-6',
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ComfortableItemSkeletonProps {
  /** Largura do título (max-w-* class). */
  titleWidth?: string;
  /** Quantidade de linhas de corpo (1–3). */
  bodyLines?: number;
  /** Número de tags simuladas (0 esconde o rodapé de tags). */
  tagCount?: number;
}

/**
 * Skeleton "rico" para o modo confortável: avatar maior, título variável,
 * 1–3 linhas de corpo (a última sempre encurtada para mimetizar texto real)
 * e faixa opcional de tags. Substitui o placeholder genérico `h-20`.
 */
export function ComfortableItemSkeleton({
  titleWidth = 'max-w-[60%]',
  bodyLines = 2,
  tagCount = 2,
}: ComfortableItemSkeletonProps) {
  const lines = Math.max(1, Math.min(3, bodyLines));
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border/40 bg-card/30">
      <Skeleton className="h-9 w-9 rounded-md shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className={cn('h-4 flex-1 rounded-sm', titleWidth)} />
          <Skeleton className="h-3 w-16 rounded-sm shrink-0" />
        </div>
        <div className="space-y-1.5">
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn(
                'h-3 rounded-sm',
                i === lines - 1 ? 'w-2/3' : 'w-full',
              )}
            />
          ))}
        </div>
        {tagCount > 0 && (
          <div className="flex items-center gap-1.5 pt-0.5">
            {Array.from({ length: Math.min(tagCount, 4) }).map((_, i) => (
              <Skeleton
                key={i}
                className={cn(
                  'h-4 rounded-full',
                  i === 0 ? 'w-14' : i === 1 ? 'w-10' : i === 2 ? 'w-12' : 'w-8',
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
