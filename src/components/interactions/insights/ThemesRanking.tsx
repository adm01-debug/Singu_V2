import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Hash } from "lucide-react";
import type { ThemeAggregate } from "@/hooks/useInteractionsInsights";

interface Props {
  themes: ThemeAggregate[];
  onSelect: (theme: ThemeAggregate) => void;
}

function ThemesRankingImpl({ themes, onSelect }: Props) {
  if (!themes.length) {
    return <p className="text-sm text-muted-foreground text-center py-8">Nenhum tema detectado no período.</p>;
  }
  const max = themes[0]?.mentions ?? 1;
  return (
    <ul className="space-y-1.5">
      {themes.map((t) => {
        const pct = Math.max(8, Math.round((t.mentions / max) * 100));
        return (
          <li key={t.label}>
            <button
              type="button"
              onClick={() => onSelect(t)}
              className="w-full flex items-center gap-3 rounded-md border border-border/60 bg-card hover:bg-muted/40 px-3 py-2 text-left transition-colors"
            >
              <Hash className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground truncate">{t.label}</span>
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5">{t.category}</Badge>
                </div>
                <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-semibold text-foreground">{t.mentions}</div>
                <div className="text-[10px] text-muted-foreground">{t.count} conv.</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export const ThemesRanking = memo(ThemesRankingImpl);
