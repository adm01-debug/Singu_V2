import { Suspense, ReactNode } from 'react';
import { useLazySection } from '@/hooks/useLazySection';
import { Surface } from '@/components/ui/surface';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LazySectionProps {
  children: ReactNode;
  fallbackHeight?: string;
  fallbackVariant?: 'chart' | 'list' | 'card' | 'default';
  className?: string;
}

function SkeletonVariant({ variant, height }: { variant: string; height: string }) {
  if (variant === 'chart') {
    return (
      <Surface level={1} rounded="lg" className={cn('p-6', height)}>
        <Skeleton className="h-4 w-40 mb-4" />
        <div className="flex items-end gap-2 h-[calc(100%-3rem)]">
          {[40, 65, 50, 80, 60, 75, 45].map((h, i) => (
            <Skeleton key={i} className="flex-1 rounded-t" style={{ height: `${h}%` }} />
          ))}
        </div>
      </Surface>
    );
  }

  if (variant === 'list') {
    return (
      <Surface level={1} rounded="lg" className={cn('p-6', height)}>
        <Skeleton className="h-4 w-48 mb-4" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 py-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </Surface>
    );
  }

  if (variant === 'card') {
    return (
      <Surface level={1} rounded="lg" className={cn('p-6', height)}>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-8 w-20 rounded" />
        </div>
        <Skeleton className="h-16 w-full rounded-lg mb-3" />
        <Skeleton className="h-3 w-3/4" />
      </Surface>
    );
  }

  return (
    <Surface level={1} rounded="lg" className={cn('animate-pulse w-full', height)} />
  );
}

export function LazySection({ children, fallbackHeight = 'h-40', fallbackVariant = 'default', className }: LazySectionProps) {
  const { ref, isVisible } = useLazySection({ rootMargin: '200px' });

  return (
    <div ref={ref} className={className}>
      {isVisible ? (
        <Suspense fallback={<SkeletonVariant variant={fallbackVariant} height={fallbackHeight} />}>
          {children}
        </Suspense>
      ) : (
        <SkeletonVariant variant={fallbackVariant} height={fallbackHeight} />
      )}
    </div>
  );
}
