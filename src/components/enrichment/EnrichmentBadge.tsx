import { memo } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ValidationStatus } from '@/hooks/useContactValidationStatus';

interface Props {
  status?: ValidationStatus;
  score?: number;
  detail?: string;
  loading?: boolean;
  compact?: boolean;
}

const CONFIG: Record<ValidationStatus, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  valid: { label: 'Válido', cls: 'border-success/40 text-success bg-success/10', Icon: CheckCircle2 },
  invalid: { label: 'Inválido', cls: 'border-destructive/40 text-destructive bg-destructive/10', Icon: XCircle },
  risky: { label: 'Risco', cls: 'border-warning/40 text-warning bg-warning/10', Icon: AlertTriangle },
  catchall: { label: 'Catch-all', cls: 'border-warning/40 text-warning bg-warning/10', Icon: AlertTriangle },
  unreachable: { label: 'Inalcançável', cls: 'border-destructive/40 text-destructive bg-destructive/10', Icon: XCircle },
  unknown: { label: 'Desconhecido', cls: 'border-muted-foreground/30 text-muted-foreground bg-muted/30', Icon: HelpCircle },
};

export const EnrichmentBadge = memo(function EnrichmentBadge({ status, score, detail, loading, compact }: Props) {
  if (loading) {
    return (
      <Badge variant="outline" className="text-[10px] gap-0.5 border-muted-foreground/20">
        <Loader2 className="h-2.5 w-2.5 animate-spin" />
      </Badge>
    );
  }
  if (!status) return null;
  const cfg = CONFIG[status];
  const tip = [cfg.label, score != null ? `Score: ${score}` : null, detail].filter(Boolean).join(' · ');

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={cn('text-[10px] gap-0.5 cursor-help', cfg.cls)}>
            <cfg.Icon className="h-2.5 w-2.5" />
            {!compact && cfg.label}
            {!compact && score != null && <span className="opacity-70">{score}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">{tip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
