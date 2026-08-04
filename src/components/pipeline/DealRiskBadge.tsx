import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Activity, AlertTriangle, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RiskLevel } from '@/hooks/useDealSlipRisk';
import { WhyScoreDrawer, type WhyScoreFactor } from '@/components/intelligence/WhyScoreDrawer';

interface Props {
  score: number;
  level: RiskLevel;
  /** Override opcional: se fornecido, substitui a abertura do WhyScoreDrawer. */
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  /** Quando fornecido (junto com factors), badge abre WhyScoreDrawer. */
  dealId?: string;
  dealTitle?: string;
  factors?: WhyScoreFactor[];
  recommendations?: string[];
}

const config: Record<RiskLevel, { label: string; cls: string; Icon: typeof Activity }> = {
  healthy: {
    label: 'Saudável',
    cls: 'bg-success/15 text-success border-success/30 hover:bg-success/25',
    Icon: ShieldCheck,
  },
  attention: {
    label: 'Atenção',
    cls: 'bg-warning/15 text-warning border-warning/30 hover:bg-warning/25',
    Icon: Activity,
  },
  high: {
    label: 'Risco alto',
    cls: 'bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/25',
    Icon: AlertTriangle,
  },
};

export function DealRiskBadge({
  score,
  level,
  onClick,
  className,
  dealId,
  dealTitle,
  factors,
  recommendations,
}: Props) {
  const { label, cls, Icon } = config[level];
  const [open, setOpen] = useState(false);
  const canOpenWhy = !onClick && !!dealId && !!factors;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onClick) {
                onClick(e);
              } else if (canOpenWhy) {
                setOpen(true);
              }
            }}
            className={cn('inline-flex', className)}
            aria-label={`Risco ${label}: ${score}/100`}
          >
            <Badge variant="outline" className={cn('gap-1 text-[10px] px-1.5 py-0 h-5 cursor-pointer', cls)}>
              <Icon className="h-3 w-3" />
              {score}
            </Badge>
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p className="text-xs font-medium">Slip Risk: {label}</p>
          <p className="text-[10px] text-muted-foreground">Clique para ver detalhes</p>
        </TooltipContent>
      </Tooltip>
      {canOpenWhy && dealId && factors && (
        <WhyScoreDrawer
          open={open}
          onOpenChange={setOpen}
          scoreKey={`slip-risk:deal:${dealId}`}
          title={dealTitle ? `Slip Risk · ${dealTitle}` : 'Slip Risk'}
          subtitle={`${score}/100 — ${label}`}
          score={score}
          factors={factors}
          recommendations={recommendations}
          band={level === 'high' ? 'low' : level === 'attention' ? 'mid' : 'high'}
        />
      )}
    </TooltipProvider>
  );
}
