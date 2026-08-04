import { cn } from '@/lib/utils';

interface IntelSkeletonProps {
  lines?: number;
  className?: string;
  label?: string;
}

/**
 * Skeleton com estética de terminal: barra animada com gradient cyan,
 * label opcional ("LOADING…"), respeita tokens .intel-* (opt-in).
 */
export const IntelSkeleton = ({ lines = 3, className, label = 'LOADING' }: IntelSkeletonProps) => {
  return (
    <div className={cn('space-y-1.5', className)} role="status" aria-live="polite" aria-busy="true">
      <div className="flex items-center gap-2 mb-1">
        <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--intel-accent))] animate-pulse" />
        <span className="intel-mono text-[10px] text-muted-foreground tracking-widest">
          {label}…
        </span>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded-sm bg-gradient-to-r from-[hsl(var(--intel-surface-2))] via-[hsl(var(--intel-accent)/0.15)] to-[hsl(var(--intel-surface-2))] bg-[length:200%_100%] animate-[intel-shimmer_1.6s_ease-in-out_infinite]"
          style={{ width: `${100 - i * 12}%` }}
        />
      ))}
      <span className="sr-only">Carregando dados…</span>
    </div>
  );
};
