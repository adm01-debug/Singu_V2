import { cn } from '@/lib/utils';

interface MetricMonoProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: { value: number; positive?: boolean };
  className?: string;
}

export const MetricMono = ({ label, value, unit, delta, className }: MetricMonoProps) => {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span className="intel-eyebrow">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="intel-mono text-2xl font-medium text-foreground tabular-nums">
          {value}
        </span>
        {unit && <span className="intel-mono text-xs text-muted-foreground">{unit}</span>}
        {delta && (
          <span
            className={cn(
              'intel-mono text-[10px] font-medium ml-1',
              delta.positive ? 'text-[hsl(var(--sev-ok))]' : 'text-[hsl(var(--sev-critical))]'
            )}
          >
            {delta.positive ? '▲' : '▼'} {Math.abs(delta.value)}%
          </span>
        )}
      </div>
    </div>
  );
};
