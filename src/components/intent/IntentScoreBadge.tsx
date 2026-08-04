import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { IntentScore } from "@/hooks/useIntent";

interface Props {
  score: number;
  trend?: IntentScore["score_trend"];
  size?: "sm" | "md";
  className?: string;
}

export function IntentScoreBadge({ score, trend = "stable", size = "md", className }: Props) {
  const tone =
    score >= 70 ? "bg-destructive/10 text-destructive border-destructive/30"
    : score >= 40 ? "bg-warning/10 text-warning border-warning/30"
    : "bg-muted text-muted-foreground border-border";

  const TrendIcon = trend === "rising" ? TrendingUp : trend === "falling" ? TrendingDown : Minus;
  const trendColor = trend === "rising" ? "text-success" : trend === "falling" ? "text-destructive" : "text-muted-foreground";

  return (
    <Badge variant="outline" className={cn(tone, "gap-1.5", size === "sm" ? "text-xs" : "", className)}>
      <span className="font-semibold">{score}</span>
      <TrendIcon className={cn("h-3 w-3", trendColor)} />
    </Badge>
  );
}
