import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function CoachingScoreBadge({ score, className }: { score: number | null | undefined; className?: string }) {
  if (score == null) return <Badge variant="outline" className={className}>—</Badge>;
  const tone = score >= 80 ? "bg-success/15 text-success border-success/30"
    : score >= 60 ? "bg-primary/15 text-primary border-primary/30"
    : score >= 40 ? "bg-warning/15 text-warning border-warning/30"
    : "bg-destructive/15 text-destructive border-destructive/30";
  return (
    <Badge variant="outline" className={cn("font-semibold tabular-nums", tone, className)}>
      {score}/100
    </Badge>
  );
}
