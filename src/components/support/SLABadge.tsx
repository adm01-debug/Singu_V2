import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Props {
  deadline: string | null;
  resolvedAt?: string | null;
  className?: string;
}

/**
 * Visual SLA indicator using semantic design tokens.
 * - success: resolved within SLA
 * - warning: <2h remaining
 * - destructive: overdue
 * - default: on track
 */
export function SLABadge({ deadline, resolvedAt, className }: Props) {
  if (!deadline) return null;

  if (resolvedAt) {
    return (
      <Badge variant="outline" className={cn('h-5 text-[10px] gap-1 border-success/40 text-success', className)}>
        <CheckCircle2 className="h-3 w-3" /> SLA OK
      </Badge>
    );
  }

  const now = Date.now();
  const due = new Date(deadline).getTime();
  const diffMs = due - now;
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffMs < 0) {
    const overdueH = Math.abs(Math.round(diffHours));
    return (
      <Badge variant="outline" className={cn('h-5 text-[10px] gap-1 border-destructive/50 bg-destructive/10 text-destructive', className)}>
        <AlertTriangle className="h-3 w-3" /> SLA vencido {overdueH}h
      </Badge>
    );
  }

  const isWarning = diffHours < 2;
  const label = diffHours < 1
    ? `${Math.round(diffHours * 60)}min`
    : `${Math.round(diffHours)}h`;

  return (
    <Badge
      variant="outline"
      className={cn(
        'h-5 text-[10px] gap-1',
        isWarning
          ? 'border-warning/50 bg-warning/10 text-warning-foreground'
          : 'border-primary/30 text-primary',
        className,
      )}
    >
      <Clock className="h-3 w-3" /> SLA em {label}
    </Badge>
  );
}
