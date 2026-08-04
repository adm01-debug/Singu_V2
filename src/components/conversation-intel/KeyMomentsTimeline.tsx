import { Flame, AlertCircle, DollarSign, Target, Trophy, Users, ArrowRight } from "lucide-react";

const ICONS: Record<string, typeof Flame> = {
  pain_revealed: Flame,
  budget_disclosed: DollarSign,
  decision_criteria: Target,
  objection: AlertCircle,
  commitment: Trophy,
  competitor_mentioned: Users,
  next_step: ArrowRight,
};

const TONES: Record<string, string> = {
  pain_revealed: "text-warning",
  budget_disclosed: "text-success",
  decision_criteria: "text-primary",
  objection: "text-destructive",
  commitment: "text-success",
  competitor_mentioned: "text-warning",
  next_step: "text-primary",
};

export function KeyMomentsTimeline({ moments }: { moments: Array<{ position_pct: number; moment_type: string; description: string }> }) {
  if (!moments?.length) return <p className="text-xs text-muted-foreground">Nenhum momento crítico marcado.</p>;
  const sorted = [...moments].sort((a, b) => a.position_pct - b.position_pct);
  return (
    <ol className="space-y-2">
      {sorted.map((m, i) => {
        const Icon = ICONS[m.moment_type] ?? Flame;
        return (
          <li key={i} className="flex items-start gap-2">
            <div className="flex flex-col items-center">
              <Icon className={`h-3.5 w-3.5 ${TONES[m.moment_type] ?? "text-primary"}`} />
              <span className="text-[10px] text-muted-foreground tabular-nums mt-0.5">{Math.round(m.position_pct)}%</span>
            </div>
            <p className="text-xs text-foreground flex-1">{m.description}</p>
          </li>
        );
      })}
    </ol>
  );
}
