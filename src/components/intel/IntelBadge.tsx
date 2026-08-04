import { cn } from '@/lib/utils';

type Severity = 'critical' | 'warn' | 'info' | 'ok' | 'neutral';

interface IntelBadgeProps {
  severity?: Severity;
  children: React.ReactNode;
  className?: string;
  square?: boolean;
}

const severityClass: Record<Severity, string> = {
  critical: 'bg-[hsl(var(--sev-critical)/0.15)] text-[hsl(var(--sev-critical))] border-[hsl(var(--sev-critical)/0.4)]',
  warn: 'bg-[hsl(var(--sev-warn)/0.15)] text-[hsl(var(--sev-warn))] border-[hsl(var(--sev-warn)/0.4)]',
  info: 'bg-[hsl(var(--sev-info)/0.15)] text-[hsl(var(--sev-info))] border-[hsl(var(--sev-info)/0.4)]',
  ok: 'bg-[hsl(var(--sev-ok)/0.15)] text-[hsl(var(--sev-ok))] border-[hsl(var(--sev-ok)/0.4)]',
  neutral: 'bg-muted/40 text-muted-foreground border-border',
};

export const IntelBadge = ({ severity = 'neutral', children, className, square = true }: IntelBadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium border intel-mono uppercase tracking-wider',
        square ? 'rounded-sm' : 'rounded-full',
        severityClass[severity],
        className
      )}
    >
      {children}
    </span>
  );
};
