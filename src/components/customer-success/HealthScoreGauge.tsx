import { cn } from "@/lib/utils";

export function HealthScoreGauge({ score, size = "md", showLabel = true }: { score: number; size?: "sm" | "md" | "lg"; showLabel?: boolean }) {
  const safe = Math.max(0, Math.min(100, score));
  const color = safe >= 70 ? "text-success" : safe >= 40 ? "text-warning" : "text-destructive";
  const ring = safe >= 70 ? "stroke-success" : safe >= 40 ? "stroke-warning" : "stroke-destructive";
  const sizes = { sm: { box: "w-14 h-14", text: "text-base", stroke: 6 }, md: { box: "w-24 h-24", text: "text-2xl", stroke: 8 }, lg: { box: "w-32 h-32", text: "text-3xl", stroke: 10 } };
  const cfg = sizes[size];
  const radius = 45;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (safe / 100) * circ;

  return (
    <div className={cn("relative inline-flex items-center justify-center", cfg.box)}>
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} className="stroke-muted/30 fill-none" strokeWidth={cfg.stroke} />
        <circle cx="50" cy="50" r={radius} className={cn("fill-none transition-all duration-500", ring)} strokeWidth={cfg.stroke} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="relative flex flex-col items-center">
        <span className={cn("font-bold tabular-nums", cfg.text, color)}>{safe}</span>
        {showLabel && size !== "sm" && <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Health</span>}
      </div>
    </div>
  );
}
