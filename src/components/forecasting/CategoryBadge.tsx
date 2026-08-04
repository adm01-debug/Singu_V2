import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ForecastCategory } from "@/hooks/useForecasting";

const CONFIG: Record<ForecastCategory, { label: string; cls: string }> = {
  commit: { label: "Commit", cls: "bg-success/15 text-success border-success/30" },
  best_case: { label: "Best Case", cls: "bg-info/15 text-info border-info/30" },
  pipeline: { label: "Pipeline", cls: "bg-primary/10 text-primary border-primary/30" },
  omitted: { label: "Omitido", cls: "bg-muted text-muted-foreground border-border" },
};

export function CategoryBadge({ category, className }: { category: ForecastCategory; className?: string }) {
  const c = CONFIG[category];
  return <Badge variant="outline" className={cn("border", c.cls, className)}>{c.label}</Badge>;
}
