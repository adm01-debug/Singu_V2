import { memo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LeadGrade, GRADE_CONFIG } from '@/hooks/useLeadScore';
import { WhyScoreDrawer, type WhyScoreFactor } from '@/components/intelligence/WhyScoreDrawer';
import { useWhyScoreDrawerPreference } from '@/hooks/useWhyScoreDrawerPreference';

interface Props {
  score: number;
  grade: LeadGrade;
  change?: number;
  showTrend?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /** Quando fornecido, o badge fica clicável e abre o WhyScoreDrawer. */
  contactId?: string;
  contactName?: string;
  factors?: WhyScoreFactor[];
  recommendations?: string[];
}

const GRADE_STYLES: Record<LeadGrade, string> = {
  cold: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  warm: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  hot: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  on_fire: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
};

const SIZE_CLASSES = {
  sm: 'text-[10px] px-1.5 py-0',
  md: 'text-xs px-2 py-0.5',
  lg: 'text-sm px-2.5 py-1',
};

function LeadScoreBadgeInner({
  score,
  grade,
  change,
  showTrend = true,
  size = 'md',
  contactId,
  contactName,
  factors,
  recommendations,
}: Props) {
  const config = GRADE_CONFIG[grade];
  const TrendIcon = !change || change === 0 ? Minus : change > 0 ? TrendingUp : TrendingDown;
  const trendColor = !change || change === 0 ? 'text-muted-foreground' : change > 0 ? 'text-emerald-500' : 'text-red-500';

  const interactive = !!contactId && !!factors;
  const { shouldAutoOpen, rememberOpen, forgetOpen } = useWhyScoreDrawerPreference();
  const [open, setOpen] = useState<boolean>(shouldAutoOpen && interactive);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) rememberOpen();
    else forgetOpen();
  };

  const badge = (
    <Badge
      variant="outline"
      className={`${GRADE_STYLES[grade]} ${SIZE_CLASSES[size]} font-semibold gap-1 border ${interactive ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
    >
      <span>{config.emoji}</span>
      <span>{Math.round(score)}</span>
      {showTrend && change !== undefined && change !== 0 && (
        <TrendIcon className={`h-3 w-3 ${trendColor}`} />
      )}
    </Badge>
  );

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          {interactive ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setOpen(true); rememberOpen(); }}
              className="inline-flex"
              aria-label={`Lead score ${Math.round(score)} de 100. Clique para ver detalhes.`}
            >
              {badge}
            </button>
          ) : (
            badge
          )}
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p className="font-semibold">Lead Score: {Math.round(score)}/100 — {config.label}</p>
          {change !== undefined && change !== 0 && (
            <p className={trendColor}>
              {change > 0 ? '+' : ''}{Math.round(change)} pts desde último cálculo
            </p>
          )}
          {interactive && <p className="text-muted-foreground mt-1">Clique para ver fatores</p>}
        </TooltipContent>
      </Tooltip>
      {interactive && contactId && factors && (
        <WhyScoreDrawer
          open={open}
          onOpenChange={handleOpenChange}
          scoreKey={`lead-score:contact:${contactId}`}
          title={contactName ? `Lead Score · ${contactName}` : 'Lead Score'}
          subtitle={`Pontuação ${Math.round(score)}/100 — ${config.label}`}
          score={score}
          factors={factors}
          recommendations={recommendations}
        />
      )}
    </>
  );
}

export const LeadScoreBadge = memo(LeadScoreBadgeInner);
