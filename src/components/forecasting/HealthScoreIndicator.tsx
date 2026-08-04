import { cn } from "@/lib/utils";
import { Heart, AlertTriangle, CheckCircle2 } from "lucide-react";

export function HealthScoreIndicator({ score, className }: { score: number; className?: string }) {
  const Icon = score >= 70 ? CheckCircle2 : score >= 40 ? Heart : AlertTriangle;
  const color = score >= 70 ? "text-success" : score >= 40 ? "text-warning" : "text-destructive";
  return (
    <div className={cn("inline-flex items-center gap-1.5 text-sm font-medium", color, className)}>
      <Icon className="h-3.5 w-3.5" />
      <span>{score}</span>
    </div>
  );
}
