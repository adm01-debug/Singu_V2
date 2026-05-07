import { memo, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ComposedChart,
  Bar,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ReferenceDot,
} from "recharts";
import type { TooltipProps } from "recharts";
import { TrendingUp, TrendingDown, Minus, Pin, ShieldCheck, Shield, ShieldAlert, HelpCircle, Activity, Filter, EyeOff, CalendarRange, Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { CHART_COLORS } from "@/data/nlpAnalyticsConstants";
import type { SentimentTrendPoint, SentimentTrendSummary } from "@/hooks/useInteractionsInsights";
import { useSentimentAnnotations, type SentimentAnnotation } from "@/hooks/useSentimentAnnotations";
import { ANNOTATION_CATEGORIES, CATEGORY_KEYS } from "./annotationCategories";
import type { AnnotationCategory } from "@/hooks/useSentimentAnnotations";
import { AnnotationDialog } from "./AnnotationDialog";
import { AnnotationList } from "./AnnotationList";
import { cn } from "@/lib/utils";

interface Props {
  data: SentimentTrendPoint[];
  summary?: SentimentTrendSummary;
  contactId?: string;
}

import {
  normalizeWeek,
  parseWeekLocal,
  isValidWeek,
  weekTimestamp,
  normalizeAndSortWeekPoints,
} from "./weekUtils";

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

function toIsoDate(w: string): string {
  return normalizeWeek(w);
}

const DIRECTION_LABEL: Record<SentimentTrendSummary["direction"], string> = {
  up: "Melhorando",
  stable: "Estável",
  down: "Piorando",
};

const DIRECTION_CLASS: Record<SentimentTrendSummary["direction"], string> = {
  up: "text-success bg-success/10 border-success/30",
  stable: "text-muted-foreground bg-muted border-border",
  down: "text-destructive bg-destructive/10 border-destructive/30",
};

const DIRECTION_ICON = { up: TrendingUp, stable: Minus, down: TrendingDown } as const;

type SentimentKey = "positive" | "neutral" | "negative" | "mixed";

const SENTIMENT_TOKENS: Record<SentimentKey, { label: string; swatch: string; text: string; bar: string }> = {
  positive: { label: "Positivo", swatch: "bg-success", text: "text-success", bar: "bg-success/70" },
  neutral: { label: "Neutro", swatch: "bg-muted-foreground", text: "text-muted-foreground", bar: "bg-muted-foreground/70" },
  negative: { label: "Negativo", swatch: "bg-destructive", text: "text-destructive", bar: "bg-destructive/70" },
  mixed: { label: "Misto", swatch: "bg-warning", text: "text-warning", bar: "bg-warning/70" },
};

const SENTIMENT_ORDER: SentimentKey[] = ["positive", "neutral", "negative", "mixed"];

function pctClass(pct: number): string {
  if (pct >= 60) return "text-success";
  if (pct <= 30) return "text-destructive";
  return "text-muted-foreground";
}

interface TooltipExtra { positivePctMA?: number | null; maWindow?: number; maWindowSize?: number; maWindowVolume?: number; maWindowBelowThreshold?: boolean; maWindowPartial?: boolean; maWindowLowVolume?: boolean; smoothActive?: boolean; annotations?: SentimentAnnotation[] }

const SHOW_ALL_ROWS_KEY = "singu:sentiment-trend:tooltip-show-all-rows";

function readShowAllRows(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SHOW_ALL_ROWS_KEY) === "1";
}

function WeeklySentimentTooltip({ active, payload }: TooltipProps<number, string>) {
  const [showAllRows, setShowAllRows] = useState<boolean>(() => readShowAllRows());

  const toggleShowAll = (next: boolean) => {
    setShowAllRows(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SHOW_ALL_ROWS_KEY, next ? "1" : "0");
    }
  };

  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload as (SentimentTrendPoint & TooltipExtra) | undefined;
  if (!point) return null;

  // Defensivo: ainda que sortedData já normalize, garantimos aqui que o
  // label da semana, a chave usada para anotações e qualquer leitura
  // derivada usem sempre 'YYYY-MM-DD' — evita inconsistência caso o ponto
  // chegue de uma fonte que não passou pelo pipeline (ex.: legend hover).
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
                  const count = point[k] ?? 0;
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

type EvolutionDirection = "up" | "stable" | "down";
interface EvolutionStats {
  currentPct: number;
  previousPct: number;
  deltaPp: number;
  direction: EvolutionDirection;
  weeksCompared: number;
}

const SHOW_PCT_LINE_KEY = "singu:sentiment-trend:show-pct-line";
const SMOOTH_ENABLED_KEY = "singu:sentiment-trend:smooth-enabled";
const SMOOTH_WINDOW_KEY = "singu:sentiment-trend:smooth-window";
const ANN_FILTER_KEY = "singu:sentiment-trend:annotation-categories";
type SmoothWindow = 2 | 3;

function readAnnotationFilter(): Set<AnnotationCategory> {
  if (typeof window === "undefined") return new Set(CATEGORY_KEYS);
  const raw = window.localStorage.getItem(ANN_FILTER_KEY);
  if (!raw) return new Set(CATEGORY_KEYS);
  try {
    const parsed = JSON.parse(raw) as string[];
    const valid = parsed.filter((k): k is AnnotationCategory =>
      (CATEGORY_KEYS as string[]).includes(k)
    );
    return valid.length > 0 ? new Set(valid) : new Set(CATEGORY_KEYS);
  } catch {
    return new Set(CATEGORY_KEYS);
  }
}
function readSmoothWindow(): SmoothWindow {
  if (typeof window === "undefined") return 3;
  const v = window.localStorage.getItem(SMOOTH_WINDOW_KEY);
  return v === "2" ? 2 : 3;
}

function SentimentTrendChartImpl({ data, summary, contactId }: Props) {
  const [smoothEnabled, setSmoothEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const v = window.localStorage.getItem(SMOOTH_ENABLED_KEY);
    return v === null ? true : v === "1";
  });
  const toggleSmooth = (next: boolean) => {
    setSmoothEnabled(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SMOOTH_ENABLED_KEY, next ? "1" : "0");
    }
  };
  const [smoothWindow, setSmoothWindow] = useState<SmoothWindow>(() => readSmoothWindow());
  const changeSmoothWindow = (next: SmoothWindow) => {
    setSmoothWindow(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SMOOTH_WINDOW_KEY, String(next));
    }
  };
  const [annDialogOpen, setAnnDialogOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState<SentimentAnnotation | null>(null);
  const [showPositivePctLine, setShowPositivePctLine] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const v = window.localStorage.getItem(SHOW_PCT_LINE_KEY);
    return v === null ? true : v === "1";
  });
  const togglePctLine = (next: boolean) => {
    setShowPositivePctLine(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SHOW_PCT_LINE_KEY, next ? "1" : "0");
    }
  };

  const annotationsApi = useSentimentAnnotations(contactId);
  const annotationsByWeekRaw = annotationsApi.byWeek;

  const [annCategoryFilter, setAnnCategoryFilter] = useState<Set<AnnotationCategory>>(() =>
    readAnnotationFilter()
  );
  const persistAnnFilter = (next: Set<AnnotationCategory>) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ANN_FILTER_KEY, JSON.stringify(Array.from(next)));
    }
  };
  const toggleAnnCategory = (cat: AnnotationCategory) => {
    setAnnCategoryFilter((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      persistAnnFilter(next);
      return next;
    });
  };
  const setAllAnnCategories = (enable: boolean) => {
    const next: Set<AnnotationCategory> = enable ? new Set(CATEGORY_KEYS) : new Set();
    setAnnCategoryFilter(next);
    persistAnnFilter(next);
  };

  const annotationCategoryCounts = useMemo(() => {
    const counts = {} as Record<AnnotationCategory, number>;
    for (const k of CATEGORY_KEYS) counts[k] = 0;
    for (const list of annotationsByWeekRaw.values()) {
      for (const a of list) counts[a.category] = (counts[a.category] ?? 0) + 1;
    }
    return counts;
  }, [annotationsByWeekRaw]);

  const annotationsByWeek = useMemo(() => {
    // Normaliza a chave do mapa para 'YYYY-MM-DD' para casar com o
    // dataKey "week" do eixo X (que também é normalizado em sortedData).
    // Sem isso, week_start vindo do banco como '2025-04-07T00:00:00' não
    // bateria com '2025-04-07' usado no chart.
    const filtered = new Map<string, SentimentAnnotation[]>();
    for (const [week, list] of annotationsByWeekRaw.entries()) {
      const key = normalizeWeek(week);
      const kept = list.filter((a) => annCategoryFilter.has(a.category));
      if (kept.length === 0) continue;
      const acc = filtered.get(key) ?? [];
      acc.push(...kept);
      filtered.set(key, acc);
    }
    return filtered;
  }, [annotationsByWeekRaw, annCategoryFilter]);

  const totalAnnotations = annotationsApi.list.data?.length ?? 0;
  const visibleAnnotations = useMemo(() => {
    let n = 0;
    for (const list of annotationsByWeek.values()) n += list.length;
    return n;
  }, [annotationsByWeek]);
  const allCategoriesActive = annCategoryFilter.size === CATEGORY_KEYS.length;

  const { sortedData, invalidWeekCount } = useMemo(
    () => normalizeAndSortWeekPoints<SentimentTrendPoint>(data),
    [data]
  );

  // Pontos com média móvel calculados a partir EXATAMENTE do mesmo
  // sortedData usado por evolutionStats e confidenceInfo. Isolar essa etapa
  // garante que duplicatas mescladas/normalização afetem MA e evolução de
  // forma consistente — mudanças em anotações ou filtros visuais nunca
  // recalculam os números, evitando divergência entre o badge "Subiu/Desceu"
  // e a linha de tendência.
  const MIN_WINDOW_VOLUME = 3;
  const LOW_WINDOW_VOLUME = 8;
  const maPoints = useMemo(() => {
    return sortedData.map((p, i) => {
      const start = Math.max(0, i - (smoothWindow - 1));
      const win = sortedData.slice(start, i + 1);
      const sumPos = win.reduce((a, w) => a + (w.positive ?? 0), 0);
      const sumTot = win.reduce((a, w) => a + (w.total ?? 0), 0);
      const positivePctMA =
        sumTot >= MIN_WINDOW_VOLUME ? Math.round((sumPos / sumTot) * 100) : null;
      return {
        ...p,
        positivePctMA,
        maWindow: smoothWindow,
        maWindowSize: win.length,
        maWindowVolume: sumTot,
        maWindowPartial: win.length < smoothWindow,
        maWindowLowVolume: sumTot > 0 && sumTot < LOW_WINDOW_VOLUME,
        maWindowBelowThreshold: sumTot > 0 && sumTot < MIN_WINDOW_VOLUME,
      };
    });
  }, [sortedData, smoothWindow]);

  // Overlay puramente visual: injeta anotações filtradas e flag de smoothing
  // sobre os pontos numéricos imutáveis acima. Recalcular este memo não
  // muda nenhum valor de MA/evolução.
  const dataWithMA = useMemo(() => {
    return maPoints.map((p) => ({
      ...p,
      smoothActive: smoothEnabled,
      annotations: annotationsByWeek.get(p.week) ?? [],
    }));
  }, [maPoints, annotationsByWeek, smoothEnabled]);

  const maQualityCounts = useMemo(() => {
    let partial = 0;
    let low = 0;
    for (const p of dataWithMA) {
      if (p.smoothActive && typeof p.positivePctMA === "number") {
        if (p.maWindowPartial) partial++;
        if (p.maWindowLowVolume) low++;
      }
    }
    return { partial, low };
  }, [dataWithMA]);

  const weekOptions = useMemo(() => sortedData.map((p) => p.week), [sortedData]);

  const annotationDots = useMemo(() => {
    // Deriva os marcadores estritamente de dataWithMA, cujas chaves "week"
    // são as mesmas do dataKey do eixo X (já normalizadas via sortedData).
    // Isso garante que o ReferenceDot caia exatamente sobre a banda da
    // semana correspondente, sem desalinhamento por strings divergentes.
    return dataWithMA
      .filter((p) => (p.annotations?.length ?? 0) > 0)
      .map((p) => {
        const anns = p.annotations!;
        const first = anns[0];
        const meta = ANNOTATION_CATEGORIES[first.category];
        return {
          week: p.week, // chave canônica do eixo X
          color: meta.color,
          count: anns.length,
          category: first.category,
          icon: meta.icon,
          label: meta.label,
          title: first.title,
        };
      });
  }, [dataWithMA]);

  // Anotações cuja semana não existe no sortedData ficam invisíveis no
  // gráfico (sem banda correspondente). Contamos para sinalizar ao usuário
  // em vez de "perder" anotações silenciosamente.
  const orphanAnnotations = useMemo(() => {
    if (!annotationsApi.list.data) return 0;
    const validWeeks = new Set(sortedData.map((p) => p.week));
    let n = 0;
    for (const a of annotationsApi.list.data) {
      if (!annCategoryFilter.has(a.category)) continue;
      if (!validWeeks.has(normalizeWeek(a.week_start))) n++;
    }
    return n;
  }, [annotationsApi.list.data, sortedData, annCategoryFilter]);

  const mixedStats = useMemo(() => {
    const totalMixed = sortedData.reduce((acc, p) => acc + (p.mixed ?? 0), 0);
    const totalAll = sortedData.reduce((acc, p) => acc + (p.total ?? 0), 0);
    const pct = totalAll > 0 ? Math.round((totalMixed / totalAll) * 100) : 0;
    return { totalMixed, pct };
  }, [sortedData]);

  const evolutionStats = useMemo<EvolutionStats | null>(() => {
    if (sortedData.length < 4) return null;
    const mid = Math.floor(sortedData.length / 2);
    const prev = sortedData.slice(0, mid);
    const curr = sortedData.slice(mid);
    const sumPos = (arr: SentimentTrendPoint[]) => arr.reduce((a, p) => a + (p.positive ?? 0), 0);
    const sumTot = (arr: SentimentTrendPoint[]) => arr.reduce((a, p) => a + (p.total ?? 0), 0);
    const prevTot = sumTot(prev);
    const currTot = sumTot(curr);
    if (prevTot === 0 || currTot === 0) return null;
    const previousPct = Math.round((sumPos(prev) / prevTot) * 100);
    const currentPct = Math.round((sumPos(curr) / currTot) * 100);
    const deltaPp = currentPct - previousPct;
    const direction: EvolutionDirection = Math.abs(deltaPp) < 3 ? "stable" : deltaPp > 0 ? "up" : "down";
    return { currentPct, previousPct, deltaPp, direction, weeksCompared: prev.length };
  }, [sortedData]);

  const confidenceInfo = useMemo(() => {
    if (!evolutionStats || sortedData.length < 4) return null;
    const pcts = sortedData.map((p) => {
      const tot = p.total ?? 0;
      if (tot <= 0) return null;
      return typeof p.positivePct === "number" ? p.positivePct : Math.round(((p.positive ?? 0) / tot) * 100);
    }).filter((v): v is number => v !== null);
    if (pcts.length < 4) return null;
    const mean = pcts.reduce((a, b) => a + b, 0) / pcts.length;
    const variance = pcts.reduce((a, b) => a + (b - mean) ** 2, 0) / pcts.length;
    const stdDev = Math.sqrt(variance);
    const marginPp = stdDev / Math.sqrt(pcts.length);
    const absDelta = Math.abs(evolutionStats.deltaPp);
    const level: "high" | "medium" | "low" =
      absDelta >= 2 * marginPp ? "high" : absDelta < marginPp ? "low" : "medium";
    const marginStr = marginPp.toFixed(1);
    const meta = {
      high: { label: `Variação significativa (±${marginStr}pp de margem)`, icon: ShieldCheck, colorClass: "text-success" },
      medium: { label: `Variação moderada (±${marginStr}pp de margem)`, icon: Shield, colorClass: "text-muted-foreground" },
      low: { label: `Dentro do ruído típico (±${marginStr}pp de margem) — leitura pouco confiável`, icon: ShieldAlert, colorClass: "text-warning" },
    } as const;
    return { level, marginPp, stdDev, n: pcts.length, ...meta[level] };
  }, [sortedData, evolutionStats]);


  if (sortedData.length < 2) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        Dados insuficientes para tendência (mín. 2 semanas).
      </p>
    );
  }

  const Icon = summary ? DIRECTION_ICON[summary.direction] : Minus;
  const deltaSign = summary && summary.deltaPct > 0 ? "+" : "";

  // Normaliza as chaves de bestWeek/worstWeek para casar com o dataKey "week"
  // do eixo X (que também é normalizado em sortedData). Sem isso, formatos
  // como "2025-04-07T00:00:00" ou "2025-04-07Z" não casam com "2025-04-07"
  // e o ReferenceLine fica posicionado fora da banda correspondente.
  const validWeekSet = useMemo(() => new Set(sortedData.map((p) => p.week)), [sortedData]);
  const bestWeekNorm = summary?.bestWeek ? normalizeWeek(summary.bestWeek.week) : undefined;
  const worstWeekNorm = summary?.worstWeek ? normalizeWeek(summary.worstWeek.week) : undefined;
  const bestWeekValid = !!bestWeekNorm && validWeekSet.has(bestWeekNorm);
  const worstWeekValid = !!worstWeekNorm && validWeekSet.has(worstWeekNorm);
  const showRefLines =
    bestWeekValid && worstWeekValid && bestWeekNorm !== worstWeekNorm;

  const firstWeek = sortedData[0]?.week;
  const lastWeek = sortedData[sortedData.length - 1]?.week;

  return (
    <div className="space-y-3">
      {sortedData.length > 0 && (
        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[10px] text-muted-foreground px-1">
          <span className="inline-flex items-center gap-1">
            <CalendarRange className="h-3 w-3" />
            <span>
              Exibindo{" "}
              <span className="font-medium tabular-nums text-foreground">{sortedData.length}</span>{" "}
              {sortedData.length === 1 ? "semana" : "semanas"}
              {firstWeek && lastWeek && (
                <>
                  {" "}·{" "}
                  <span className="tabular-nums text-foreground">{formatWeek(firstWeek)}</span>
                  {firstWeek !== lastWeek && (
                    <>
                      {" → "}
                      <span className="tabular-nums text-foreground">{formatWeek(lastWeek)}</span>
                    </>
                  )}
                </>
              )}
            </span>
          </span>
          <TooltipProvider delayDuration={200}>
            <UITooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Como o intervalo é calculado"
                >
                  <Info className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-[11px]">
                Semanas ordenadas cronologicamente por data normalizada
                (YYYY-MM-DD). Duplicatas são mescladas e semanas inválidas
                são descartadas para manter a integridade da média móvel.
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
          {invalidWeekCount > 0 && (
            <span className="inline-flex items-center gap-1 text-warning/90">
              <ShieldAlert className="h-3 w-3" />
              {invalidWeekCount} {invalidWeekCount === 1 ? "registro descartado" : "registros descartados"} por semana inválida
            </span>
          )}
        </div>
      )}
      {evolutionStats ? (() => {
        const EvIcon = DIRECTION_ICON[evolutionStats.direction];
        const evLabel = evolutionStats.direction === "up" ? "Subiu" : evolutionStats.direction === "down" ? "Desceu" : "Estável";
        const evSign = evolutionStats.deltaPp > 0 ? "+" : evolutionStats.deltaPp < 0 ? "−" : "";
        const CIcon = confidenceInfo?.icon;
        return (
          <div className={cn("rounded-md border px-3 py-2 space-y-1", DIRECTION_CLASS[evolutionStats.direction])}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <EvIcon className="h-4 w-4" />
                <span className="text-xs font-semibold">% positivo {evLabel.toLowerCase()}</span>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  Período atual: {evolutionStats.currentPct}% · Período anterior: {evolutionStats.previousPct}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn("gap-1 text-[10px] tabular-nums", DIRECTION_CLASS[evolutionStats.direction])}>{evSign}{Math.abs(evolutionStats.deltaPp)}pp</Badge>
                <span className="text-[10px] text-muted-foreground">vs. {evolutionStats.weeksCompared} semanas anteriores</span>
              </div>
            </div>
            {confidenceInfo && CIcon && (
              <TooltipProvider delayDuration={150}>
                <div className={cn("flex items-center gap-1.5 text-[11px]", confidenceInfo.colorClass)}>
                  <CIcon className="h-3 w-3 shrink-0" />
                  <span>{confidenceInfo.label}</span>
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
                        Calculo o desvio-padrão semanal do % positivo nas {confidenceInfo.n} semanas do período
                        (σ ≈ {confidenceInfo.stdDev.toFixed(1)}pp) e divido por √n para obter a margem
                        (±{confidenceInfo.marginPp.toFixed(1)}pp). Se o delta atual for ≥ 2× a margem, a variação é
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
      })() : (
        <div className="rounded-md border border-border bg-muted/30 px-3 py-2 flex items-center gap-2 text-[11px] text-muted-foreground">
          <Minus className="h-3.5 w-3.5 shrink-0" />
          <span>
            Comparação de períodos indisponível — são necessárias ao menos 4 semanas com volume em cada metade.
          </span>
        </div>
      )}
      {summary && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("gap-1 text-[10px]", DIRECTION_CLASS[summary.direction])}>
              <Icon className="h-3 w-3" />
              {DIRECTION_LABEL[summary.direction]} {deltaSign}
              {summary.deltaPct}pp
            </Badge>
            <Button
              type="button"
              variant={smoothEnabled ? "secondary" : "outline"}
              size="xs"
              onClick={() => toggleSmooth(!smoothEnabled)}
              aria-pressed={smoothEnabled}
              title={smoothEnabled ? `Desativar média móvel de ${smoothWindow} semanas` : `Ativar média móvel de ${smoothWindow} semanas`}
              className="gap-1"
            >
              <Activity className="h-3 w-3" />
              Média móvel: {smoothEnabled ? `ON (MM${smoothWindow})` : "OFF"}
            </Button>
            {smoothEnabled && (
              <div
                role="radiogroup"
                aria-label="Janela da média móvel"
                className="inline-flex items-center rounded-md border border-border bg-background overflow-hidden"
              >
                {([2, 3] as const).map((w) => {
                  const active = smoothWindow === w;
                  return (
                    <button
                      key={w}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => changeSmoothWindow(w)}
                      title={`Janela de ${w} semanas`}
                      className={cn(
                        "px-2 py-0.5 text-[10px] font-medium tabular-nums transition-colors",
                        active
                          ? "bg-secondary text-secondary-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      MM{w}
                    </button>
                  );
                })}
              </div>
            )}
            {contactId && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => { setEditingAnn(null); setAnnDialogOpen(true); }}
                title="Adicionar anotação"
              >
                <Pin className="h-3 w-3" /> Anotar
              </Button>
            )}
            {contactId && totalAnnotations > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    title="Filtrar anotações por categoria"
                    className={cn(!allCategoriesActive && "text-primary")}
                  >
                    <Filter className="h-3 w-3" />
                    Filtrar
                    {!allCategoriesActive && (
                      <span className="ml-1 inline-flex items-center justify-center rounded-sm bg-primary/15 px-1 text-[9px] font-semibold tabular-nums text-primary">
                        {annCategoryFilter.size}/{CATEGORY_KEYS.length}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-64 p-2">
                  <div className="flex items-center justify-between px-1 pb-1.5 border-b border-border">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Categorias visíveis
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setAllAnnCategories(true)}
                        disabled={allCategoriesActive}
                        className="text-[10px] text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                      >
                        Todas
                      </button>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <button
                        type="button"
                        onClick={() => setAllAnnCategories(false)}
                        disabled={annCategoryFilter.size === 0}
                        className="text-[10px] text-muted-foreground hover:underline disabled:opacity-50"
                      >
                        Nenhuma
                      </button>
                    </div>
                  </div>
                  <ul className="py-1 space-y-0.5">
                    {CATEGORY_KEYS.map((k) => {
                      const meta = ANNOTATION_CATEGORIES[k];
                      const Icon = meta.icon;
                      const checked = annCategoryFilter.has(k);
                      const count = annotationCategoryCounts[k] ?? 0;
                      return (
                        <li key={k}>
                          <label
                            className={cn(
                              "flex items-center gap-2 rounded-sm px-1.5 py-1 text-xs cursor-pointer hover:bg-muted/60",
                              count === 0 && "opacity-60"
                            )}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleAnnCategory(k)}
                              aria-label={`Mostrar anotações de ${meta.label}`}
                            />
                            <span
                              className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm"
                              style={{ backgroundColor: meta.color }}
                              aria-hidden
                            >
                              <Icon
                                className="h-2.5 w-2.5"
                                style={{ color: "hsl(var(--background))" }}
                                strokeWidth={2.5}
                              />
                            </span>
                            <span className="flex-1 text-foreground">{meta.label}</span>
                            <span className="tabular-nums text-[10px] text-muted-foreground">
                              {count}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="border-t border-border pt-1.5 px-1 text-[10px] text-muted-foreground">
                    Exibindo <span className="font-medium tabular-nums text-foreground">{visibleAnnotations}</span> de{" "}
                    <span className="tabular-nums">{totalAnnotations}</span> anotação(ões).
                  </p>
                </PopoverContent>
              </Popover>
            )}
            <div className="flex items-center gap-2 pl-1">
              <Switch
                id="toggle-pct-line"
                checked={showPositivePctLine}
                onCheckedChange={togglePctLine}
                aria-label="Alternar linha de % positivo"
              />
              <Label htmlFor="toggle-pct-line" className="text-xs cursor-pointer">
                Linha % positivo
              </Label>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] flex-1 max-w-xl">
            <div className="rounded border border-border/60 p-1">
              <p className="font-semibold text-success">
                {summary.bestWeek ? `${formatWeek(normalizeWeek(summary.bestWeek.week))} · ${summary.bestWeek.positivePct}%` : "—"}
              </p>
              <p className="text-muted-foreground">Melhor</p>
            </div>
            <div className="rounded border border-border/60 p-1">
              <p className="font-semibold text-destructive">
                {summary.worstWeek ? `${formatWeek(normalizeWeek(summary.worstWeek.week))} · ${summary.worstWeek.positivePct}%` : "—"}
              </p>
              <p className="text-muted-foreground">Pior</p>
            </div>
            <div className="rounded border border-border/60 p-1">
              <p className="font-semibold text-foreground">{summary.totalInteractions}</p>
              <p className="text-muted-foreground">Conversas</p>
            </div>
            <div className="rounded border border-border/60 p-1">
              <p className="font-semibold text-warning tabular-nums">
                {mixedStats.totalMixed} <span className="text-muted-foreground font-normal">· {mixedStats.pct}%</span>
              </p>
              <p className="text-muted-foreground">Mistos</p>
            </div>
          </div>
        </div>
      )}

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={dataWithMA} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="week" tickFormatter={formatWeek} stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis yAxisId="count" stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
            <YAxis yAxisId="pct" orientation="right" domain={[0, 100]} tickFormatter={(v) => `${v}%`} stroke="hsl(var(--muted-foreground))" fontSize={11} hide={!showPositivePctLine} />
            <YAxis yAxisId="volume" orientation="right" domain={[0, "dataMax"]} hide />
            <Tooltip content={<WeeklySentimentTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }} />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              formatter={(value: string) => {
                if (value === "Misto") {
                  if (mixedStats.totalMixed === 0) {
                    return (
                      <span className="text-muted-foreground italic">
                        Misto <span className="text-[10px]">(0 no período)</span>
                      </span>
                    );
                  }
                  return (
                    <span className="text-warning font-semibold">
                      Misto{" "}
                      <span className="text-[10px] text-warning/80 font-normal tabular-nums">
                        ({mixedStats.totalMixed} · {mixedStats.pct}%)
                      </span>
                    </span>
                  );
                }
                return <span className="text-foreground">{value}</span>;
              }}
            />
            {bestWeekValid && bestWeekNorm !== worstWeekNorm && (
              <ReferenceLine
                yAxisId="pct"
                x={bestWeekNorm}
                stroke="hsl(var(--success))"
                strokeDasharray="2 2"
                ifOverflow="hidden"
                label={{ value: "Melhor", position: "top", fill: "hsl(var(--success))", fontSize: 10 }}
              />
            )}
            {worstWeekValid && bestWeekNorm !== worstWeekNorm && (
              <ReferenceLine
                yAxisId="pct"
                x={worstWeekNorm}
                stroke="hsl(var(--destructive))"
                strokeDasharray="2 2"
                ifOverflow="hidden"
                label={{ value: "Pior", position: "top", fill: "hsl(var(--destructive))", fontSize: 10 }}
              />
            )}
            <Bar yAxisId="volume" dataKey="total" name="Volume" fill="hsl(var(--muted-foreground))" fillOpacity={0.18} radius={[2, 2, 0, 0]} barSize={18} />
            {smoothEnabled && showPositivePctLine && (
              <Line
                yAxisId="pct"
                type="monotone"
                dataKey="positivePctMA"
                name={`Tendência (MM${smoothWindow})`}
                stroke="hsl(var(--success))"
                strokeWidth={3}
                strokeOpacity={0.45}
                dot={(props: any) => {
                  const { cx, cy, payload, index } = props;
                  if (cx == null || cy == null) return <></>;
                  const isPartial = !!payload?.maWindowPartial;
                  const isLow = !!payload?.maWindowLowVolume;
                  if (!isPartial && !isLow) return <></>;
                  const fill = isLow ? "hsl(var(--warning))" : "hsl(var(--muted-foreground))";
                  const stroke = "hsl(var(--background))";
                  return (
                    <g key={`ma-dot-${index}`}>
                      <circle cx={cx} cy={cy} r={4} fill={fill} stroke={stroke} strokeWidth={1.5} />
                      {isPartial && (
                        <circle cx={cx} cy={cy} r={6} fill="none" stroke={fill} strokeWidth={1} strokeDasharray="2 2" opacity={0.7} />
                      )}
                    </g>
                  );
                }}
                activeDot={false}
                isAnimationActive={false}
                connectNulls
              />
            )}
            <Line yAxisId="count" type="monotone" dataKey="positive" name="Positivo" stroke={CHART_COLORS.positive} strokeWidth={2} dot={false} />
            <Line yAxisId="count" type="monotone" dataKey="neutral" name="Neutro" stroke={CHART_COLORS.neutral} strokeWidth={2} dot={false} />
            <Line yAxisId="count" type="monotone" dataKey="negative" name="Negativo" stroke={CHART_COLORS.negative} strokeWidth={2} dot={false} />
            <Line
              yAxisId="count"
              type="monotone"
              dataKey="mixed"
              name="Misto"
              stroke={CHART_COLORS.mixed}
              strokeWidth={3.5}
              dot={{ r: 3, fill: CHART_COLORS.mixed, stroke: CHART_COLORS.mixed, strokeWidth: 1 }}
              activeDot={{ r: 5, fill: CHART_COLORS.mixed, stroke: "hsl(var(--background))", strokeWidth: 2 }}
            />
            {showPositivePctLine && (
              <Line
                yAxisId="pct"
                type="monotone"
                dataKey="positivePct"
                name="% Positivo"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            )}
            {annotationDots.map((d) => {
              const Icon = d.icon;
              return (
                <ReferenceDot
                  key={d.week}
                  yAxisId="pct"
                  x={d.week}
                  y={100}
                  ifOverflow="visible"
                  isFront
                  shape={(props: any) => {
                    const { cx, cy } = props;
                    if (cx == null || cy == null) return null;
                    const r = 9;
                    return (
                      <g>
                        <title>{`${d.label}: ${d.title}${d.count > 1 ? ` (+${d.count - 1})` : ""}`}</title>
                        <circle cx={cx} cy={cy} r={r} fill={d.color} stroke="hsl(var(--background))" strokeWidth={1.5} />
                        <foreignObject x={cx - 6} y={cy - 6} width={12} height={12} style={{ pointerEvents: "none" }}>
                          <div style={{ width: 12, height: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "hsl(var(--background))" }}>
                            <Icon width={10} height={10} strokeWidth={2.5} />
                          </div>
                        </foreignObject>
                        {d.count > 1 && (
                          <g>
                            <circle cx={cx + r - 1} cy={cy - r + 1} r={6} fill="hsl(var(--background))" stroke={d.color} strokeWidth={1} />
                            <text x={cx + r - 1} y={cy - r + 3} textAnchor="middle" fontSize={8} fontWeight={700} fill={d.color}>
                              {d.count > 9 ? "9+" : d.count}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  }}
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {smoothEnabled && showPositivePctLine && (maQualityCounts.partial > 0 || maQualityCounts.low > 0) && (
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground -mt-1 px-1">
          <span className="font-medium">Tendência MM{smoothWindow}:</span>
          {maQualityCounts.partial > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <svg width="14" height="10" viewBox="0 0 14 10" aria-hidden>
                <circle cx="7" cy="5" r="2.5" fill="hsl(var(--muted-foreground))" />
                <circle cx="7" cy="5" r="4" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1" strokeDasharray="2 2" />
              </svg>
              <span>
                {maQualityCounts.partial} {maQualityCounts.partial === 1 ? "semana" : "semanas"} com janela parcial (início da série)
              </span>
            </span>
          )}
          {maQualityCounts.low > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: "hsl(var(--warning))" }}
                aria-hidden
              />
              <span className="text-warning">
                {maQualityCounts.low} {maQualityCounts.low === 1 ? "semana" : "semanas"} com baixo volume na janela
              </span>
            </span>
          )}
        </div>
      )}
      {contactId && (
        <>
          <AnnotationList
            api={annotationsApi}
            onEdit={(a) => { setEditingAnn(a); setAnnDialogOpen(true); }}
            categoryFilter={annCategoryFilter}
          />
          {!allCategoriesActive && totalAnnotations > 0 && (
            <p className="text-[10px] text-muted-foreground italic flex items-center gap-1 px-1">
              <EyeOff className="h-3 w-3" />
              Filtro ativo: ocultando {totalAnnotations - visibleAnnotations} anotação(ões) de categorias desmarcadas.
            </p>
          )}
          {orphanAnnotations > 0 && (
            <p className="text-[10px] text-warning/90 italic flex items-center gap-1 px-1">
              <ShieldAlert className="h-3 w-3" />
              {orphanAnnotations} anotação(ões) sem semana correspondente no gráfico — visíveis apenas na lista abaixo.
            </p>
          )}
          <AnnotationDialog
            open={annDialogOpen}
            onOpenChange={setAnnDialogOpen}
            contactId={contactId}
            weekOptions={weekOptions}
            editing={editingAnn}
            api={annotationsApi}
          />
        </>
      )}
    </div>
  );
}

export const SentimentTrendChart = memo(SentimentTrendChartImpl);
