import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConfidenceLevel } from '@/hooks/useDealForecastConfidence';
import { WhyScoreDrawer, type WhyScoreFactor } from '@/components/intelligence/WhyScoreDrawer';

interface Props {
  confidence: number;
  level: ConfidenceLevel;
  expectedValue: number;
  className?: string;
  /** Quando fornecido, badge vira clicável e abre WhyScoreDrawer. */
  dealId?: string;
  dealTitle?: string;
  factors?: WhyScoreFactor[];
  recommendations?: string[];
}

const LEVEL_STYLES: Record<ConfidenceLevel, string> = {
  low: 'bg-muted text-muted-foreground border-border',
  medium: 'bg-info/15 text-info border-info/30',
  high: 'bg-success/15 text-success border-success/30',
};

const LEVEL_LABEL: Record<ConfidenceLevel, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(v);

export function DealConfidenceBadge({
  confidence,
  level,
  expectedValue,
  className,
  dealId,
  dealTitle,
  factors,
  recommendations,
}: Props) {
  const [open, setOpen] = useState(false);
  const interactive = !!dealId && !!factors;

  const badge = (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 border',
        interactive ? 'cursor-pointer hover:opacity-80' : 'cursor-default',
        LEVEL_STYLES[level],
        className,
      )}
    >
      <Sparkles className="h-3 w-3" />
      {confidence}%
    </Badge>
  );

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          {interactive ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setOpen(true); }}
              className="inline-flex"
              aria-label={`Confiança de previsão ${confidence}%. Clique para ver detalhes.`}
            >
              {badge}
            </button>
          ) : (
            badge
          )}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px]">
          <p className="font-medium text-xs">
            Confiança {LEVEL_LABEL[level]} · {confidence}/100
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Valor esperado: {formatCurrency(expectedValue)}
          </p>
          {interactive && (
            <p className="text-xs text-muted-foreground mt-0.5">Clique para ver fatores</p>
          )}
        </TooltipContent>
      </Tooltip>
      {interactive && dealId && factors && (
        <WhyScoreDrawer
          open={open}
          onOpenChange={setOpen}
          scoreKey={`forecast-confidence:deal:${dealId}`}
          title={dealTitle ? `Confiança · ${dealTitle}` : 'Confiança da previsão'}
          subtitle={`${confidence}/100 — ${LEVEL_LABEL[level]} · valor esperado ${formatCurrency(expectedValue)}`}
          score={confidence}
          factors={factors}
          recommendations={recommendations}
        />
      )}
    </>
  );
}
