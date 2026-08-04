import { useState } from "react";
import type { TooltipProps } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { SentimentTrendPoint } from "@/hooks/useInteractionsInsights";
import { type SentimentAnnotation } from "@/hooks/useSentimentAnnotations";
import { ANNOTATION_CATEGORIES } from "./annotationCategories";
import { normalizeWeek, parseWeekLocal } from "./weekUtils";

export type SentimentKey = "positive" | "neutral" | "negative" | "mixed";

// eslint-disable-next-line react-refresh/only-export-components
export const SENTIMENT_TOKENS: Record<SentimentKey, { label: string; swatch: string; text: string; bar: string }> = {
  positive: { label: "Positivo", swatch: "bg-success", text: "text-success", bar: "bg-success/70" },
  neutral: { label: "Neutro", swatch: "bg-muted-foreground", text: "text-muted-foreground", bar: "bg-muted-foreground/70" },
  negative: { label: "Negativo", swatch: "bg-destructive", text: "text-destructive", bar: "bg-destructive/70" },
  mixed: { label: "Misto", swatch: "bg-warning", text: "text-warning", bar: "bg-warning/70" },
};

// eslint-disable-next-line react-refresh/only-export-components
export const SENTIMENT_ORDER: SentimentKey[] = ["positive", "neutral", "negative", "mixed"];

export interface TooltipExtra {
  positivePctMA?: number | null;
  maWindow?: number;
  maWindowSize?: number;
  maWindowVolume?: number;
  maWindowBelowThreshold?: boolean;
  maWindowPartial?: boolean;
  maWindowLowVolume?: boolean;
  smoothActive?: boolean;
  annotations?: SentimentAnnotation[];
}

function formatWeek(w: string): string {
  const d = parseWeekLocal(w);
  if (isNaN(d.getTime())) return w;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function formatWeekRange(weekStartIso: string): string {
  const start = parseWeekLocal(weekStartIso);
  if (isNaN(start.getTime())) return formatWeek(weekStartIso);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
  return `${fmt(start)} – ${fmt(end)}`;
}

function pctClass(pct: number): string {
  if (pct >= 60) return "text-success";
  if (pct <= 30) return "text-destructive";
  return "text-muted-foreground";
}

const SHOW_ALL_ROWS_KEY = "singu:sentiment-trend:tooltip-show-all-rows";

function readShowAllRows(): boolean {
  if (typeof window === "undefined") return false;
  try { return window.localStorage.getItem(SHOW_ALL_ROWS_KEY) === "1"; } catch { return false; }
}

export function WeeklySentimentTooltip({ active, payload }: TooltipProps<number, string>) {
  const [showAllRows, setShowAllRows] = useState<boolean>(() => readShowAllRows());

  const toggleShowAll = (next: boolean) => {
    setShowAllRows(next);
    if (typeof window !== "undefined") {
      try { window.localStorage.setItem(SHOW_ALL_ROWS_KEY, next ? "1" : "0"); } catch { /* private browsing */ }
    }
  };

  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload as (SentimentTrendPoint & TooltipExtra) | undefined;
  if (!point) return null;

  const weekKey = normalizeWeek(point.week);
  const total = point.total ?? 0;
  const positivePct =
    typeof point.positivePct === "number"
      ? point.positivePct
      : total > 0
        ? Math.round((point.positive / total) * 100)
        : 0;
  const anns = point.annotations ?? [];

  const visibleKeys = showAllRows
    ? SENTIMENT_ORDER
    : SENTIMENT_ORDER.filter((k) => (point[k] ?? 0) > 0);

  return (
    <div className="rounded-md border border-border bg-popover text-popover-foreground shadow-sm p-3 min-w-[220px] max-w-[280px] pointer-events-auto space-y-2">
      <div className="space-y-0.5">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Semana de {formatWeekRange(weekKey)}
        </p>
        {total === 0 ? (
          <p className="text-xs text-muted-foreground">Volume: 0 interações</p>
        ) : (
          <p className="text-xs font-semibold text-foreground">
            Volume: <span className="tabular-nums">{total}</span> {total === 1 ? "interação" : "interações"}
          </p>
        )}
      </div>

      {total > 0 && (
        <>
          <div className="text-xs border-t border-border/60 pt-2 space-y-1">
            <div className="flex items-baseline gap-1">
              <span className={cn("font-semibold tabular-nums", pctClass(positivePct))}>{positivePct}%</span>
              <span className="text-muted-foreground">positivo</span>
            </div>
            {point.smoothActive && typeof point.positivePctMA === "number" && (() => {
              const ma = point.positivePctMA as number;
              const delta = positivePct - ma;
              const sign = delta > 0 ? "+" : delta < 0 ? "−" : "±";
              const arrow = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
              const ArrowIcon = arrow;
              const deltaClass = delta > 0 ? "text-success" : delta < 0 ? "text-destructive" : "text-muted-foreground";
              const winVol = point.maWindowVolume ?? 0;
              return (
                <div className="space-y-0.5">
                  <div className="flex items-center flex-wrap gap-1.5 text-[11px]">
                    <span
                      className="h-2 w-2 rounded-sm shrink-0"
                      style={{ backgroundColor: "hsl(var(--success))", opacity: 0.45 }}
                      aria-hidden
                    />
                    <span className="text-muted-foreground">
                      Tendência MM{point.maWindow ?? 3}:
                    </span>
                    <span className="font-medium tabular-nums text-foreground">{ma}%</span>
                    <span className={cn("inline-flex items-center gap-0.5 tabular-nums", deltaClass)}>
                      <ArrowIcon className="h-3 w-3" />
                      {sign}{Math.abs(delta)}pp
                    </span>
                    {point.maWindowPartial && (
                      <span className="inline-flex items-center rounded-sm bg-muted px-1 py-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">
                        janela parcial ({point.maWindowSize}/{point.maWindow})
                      </span>
                    )}
                    {point.maWindowLowVolume && (
                      <span className="inline-flex items-center rounded-sm bg-warning/15 text-warning px-1 py-0.5 text-[9px] uppercase tracking-wide">
                        baixo volume
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground ml-3.5">
                    Ponderada por volume · janela: <span className="tabular-nums">{winVol}</span> {winVol === 1 ? "interação" : "interações"}
                  </p>
                </div>
              );
            })()}
            {point.smoothActive && point.positivePctMA === null && point.maWindowBelowThreshold && (
              <p className="text-[10px] text-warning italic ml-3.5">
                Volume insuficiente na janela MM{point.maWindow ?? 3} para tendência confiável.
              </p>
            )}
          </div>

          <div className="border-t border-border/60 pt-2 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="tooltip-show-all-rows" className="text-[10px] text-muted-foreground cursor-pointer">
                Mostrar zerados
              </Label>
              <Switch
                id="tooltip-show-all-rows"
                checked={showAllRows}
                onCheckedChange={toggleShowAll}
                aria-label="Alternar exibição de sentimentos com contagem zero"
                className="scale-75 origin-right"
              />
            </div>
            {visibleKeys.length === 0 ? (
              <p className="text-[10px] text-muted-foreground italic">Nenhum sentimento registrado.</p>
            ) : (
              <ul className="space-y-1">
                {visibleKeys.map((k) => {
                  const tokens = SENTIMENT_TOKENS[k];
                  const count = (point[k] as number) ?? 0;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  const isZero = count === 0;
                  const isMixed = k === "mixed";
                  return (
                    <li
                      key={k}
                      className={cn(
                        "space-y-0.5",
                        isZero && "opacity-50",
                        isMixed && !isZero && "rounded-sm bg-warning/10 px-1.5 py-1 -mx-1.5 ring-1 ring-warning/30 opacity-100"
                      )}
                    >
                      <div className="flex items-center gap-2 text-xs">
                        <span className={cn("h-2 w-2 rounded-sm shrink-0", tokens.swatch)} aria-hidden />
                        <span className={cn("flex-1 truncate text-foreground", isMixed && !isZero && "font-semibold")}>
                          {tokens.label}
                          {isMixed && !isZero && (
                            <span className="ml-1 text-[9px] uppercase tracking-wide text-warning font-semibold">destaque</span>
                          )}
                        </span>
                        <span className="tabular-nums font-medium text-foreground min-w-[1.5rem] text-right">{count}</span>
                        <span className="tabular-nums text-muted-foreground text-[10px] min-w-[2.5rem] text-right">{pct}%</span>
                      </div>
                      <div className="h-0.5 w-full rounded-full bg-muted/60 overflow-hidden ml-4">
                        <div
                          className={cn("h-full rounded-full transition-all", tokens.bar)}
                          style={{ width: `${pct}%` }}
                          aria-hidden
                        />
                      </div>
                      {isMixed && isZero && (
                        <p className="text-[10px] text-muted-foreground italic ml-4">
                          Sem conversas mistas nesta semana.
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {!showAllRows && (point.mixed ?? 0) === 0 && total > 0 && (
              <p className="text-[10px] text-warning/90 italic">
                Misto: 0 nesta semana — sem sinais ambíguos.
              </p>
            )}
          </div>
        </>
      )}

      {anns.length > 0 && (
        <div className="border-t border-border/60 pt-2 space-y-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
            Anotações ({anns.length})
          </p>
          <ul className="space-y-1">
            {anns.slice(0, 3).map((a) => {
              const meta = ANNOTATION_CATEGORIES[a.category];
              const Icon = meta.icon;
              return (
                <li key={a.id} className="flex items-start gap-1.5 text-[11px]">
                  <span
                    className="mt-0.5 inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm"
                    style={{ backgroundColor: meta.color }}
                    aria-hidden
                  >
                    <Icon className="h-2.5 w-2.5" style={{ color: "hsl(var(--background))" }} strokeWidth={2.5} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-medium text-foreground line-clamp-2">{a.title}</span>
                    <span className="block text-[9px] uppercase tracking-wide text-muted-foreground">
                      {meta.label}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
          {anns.length > 3 && (
            <p className="text-[10px] text-muted-foreground italic">+{anns.length - 3} anotação(ões) — veja a lista abaixo</p>
          )}
        </div>
      )}
    </div>
  );
}
