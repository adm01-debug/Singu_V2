import { ShieldCheck, Shield, ShieldAlert, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type EvolutionDirection = "up" | "stable" | "down";

export interface EvolutionStats {
  currentPct: number;
  previousPct: number;
  deltaPp: number;
  direction: EvolutionDirection;
  weeksCompared: number;
}

export interface ConfidenceInfo {
  level: "high" | "medium" | "low";
  marginPp: number;
  stdDev: number;
  n: number;
  label: string;
  icon: LucideIcon;
  colorClass: string;
}

const DIRECTION_CLASS: Record<EvolutionDirection, string> = {
  up: "text-success bg-success/10 border-success/30",
  stable: "text-muted-foreground bg-muted border-border",
  down: "text-destructive bg-destructive/10 border-destructive/30",
};

const DIRECTION_ICON = { up: TrendingUp, stable: Minus, down: TrendingDown } as const;

interface Props {
  stats: EvolutionStats;
  confidence: ConfidenceInfo | null;
}

export function EvolutionStatsCard({ stats, confidence }: Props) {
  const EvIcon = DIRECTION_ICON[stats.direction];
  const evLabel = stats.direction === "up" ? "Subiu" : stats.direction === "down" ? "Desceu" : "Estável";
  const evSign = stats.deltaPp > 0 ? "+" : stats.deltaPp < 0 ? "−" : "";
  const CIcon = confidence?.icon;

  return (
    <div className={cn("rounded-md border px-3 py-2 space-y-1", DIRECTION_CLASS[stats.direction])}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <EvIcon className="h-4 w-4" />
          <span className="text-xs font-semibold">% positivo {evLabel.toLowerCase()}</span>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            Período atual: {stats.currentPct}% · Período anterior: {stats.previousPct}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("gap-1 text-[10px] tabular-nums", DIRECTION_CLASS[stats.direction])}>
            {evSign}{Math.abs(stats.deltaPp)}pp
          </Badge>
          <span className="text-[10px] text-muted-foreground">vs. {stats.weeksCompared} semanas anteriores</span>
        </div>
      </div>
      {confidence && CIcon && (
        <TooltipProvider delayDuration={150}>
          <div className={cn("flex items-center gap-1.5 text-[11px]", confidence.colorClass)}>
            <CIcon className="h-3 w-3 shrink-0" />
            <span>{confidence.label}</span>
            <UITooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-muted-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-full"
                  aria-label="Como calculo o intervalo de confiança"
                >
                  <HelpCircle className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-[11px] leading-relaxed">
                <p className="font-semibold mb-1">Como calculo essa margem</p>
                <p className="text-muted-foreground">
                  Calculo o desvio-padrão semanal do % positivo nas {confidence.n} semanas do período
                  (σ ≈ {confidence.stdDev.toFixed(1)}pp) e divido por √n para obter a margem
                  (±{confidence.marginPp.toFixed(1)}pp). Se o delta atual for ≥ 2× a margem, a variação é
                  <span className="text-success"> significativa</span>; abaixo da margem, está
                  <span className="text-warning"> dentro do ruído</span>.
                </p>
                <p className="text-muted-foreground mt-1.5 italic">
                  Heurística aproximada — não substitui um teste estatístico formal.
                </p>
              </TooltipContent>
            </UITooltip>
          </div>
        </TooltipProvider>
      )}
    </div>
  );
}
