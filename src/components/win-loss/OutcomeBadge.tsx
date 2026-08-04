import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { WinLossOutcome } from '@/hooks/useWinLoss';
import { Trophy, X, MinusCircle, Clock } from 'lucide-react';

interface Props {
  outcome: WinLossOutcome;
  className?: string;
}

const config: Record<WinLossOutcome, { label: string; icon: typeof Trophy; cls: string }> = {
  won: { label: 'Ganho', icon: Trophy, cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' },
  lost: { label: 'Perdido', icon: X, cls: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/20' },
  no_decision: { label: 'Sem decisão', icon: MinusCircle, cls: 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/20' },
  pending: { label: 'Pendente', icon: Clock, cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20' },
};

export function OutcomeBadge({ outcome, className }: Props) {
  const c = config[outcome];
  const Icon = c.icon;
  return (
    <Badge variant="outline" className={cn('gap-1 font-medium', c.cls, className)}>
      <Icon className="h-3 w-3" />
      {c.label}
    </Badge>
  );
}
