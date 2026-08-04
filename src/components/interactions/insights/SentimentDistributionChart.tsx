import { memo, useCallback, useEffect, useMemo, useRef, type KeyboardEvent } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, type TooltipProps } from "recharts";
import { CheckCircle2 } from "lucide-react";
import { CHART_COLORS } from "@/data/nlpAnalyticsConstants";
import type { SentimentOverall } from "@/hooks/useConversationIntel";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useScopedShortcut } from "@/lib/keyboardShortcutRegistry";

const AFFORDANCE_HINT = "Clique para ver conversas";

interface Slice {
  key: string;
  count: number;
  pct: number;
}

interface Props {
  data: Slice[];
  onSelectBucket?: (key: SentimentOverall) => void;
  activeBucket?: SentimentOverall | null;
}

const COLORS: Record<string, string> = {
  positive: CHART_COLORS.positive,
  neutral: CHART_COLORS.neutral,
  negative: CHART_COLORS.negative,
  mixed: "hsl(262, 83%, 58%)",
};

const LABELS: Record<string, string> = {
  positive: "Positivo",
  neutral: "Neutro",
  negative: "Negativo",
  mixed: "Misto",
};

function isSentimentKey(k: string): k is SentimentOverall {
  return k === "positive" || k === "neutral" || k === "negative" || k === "mixed";
}

function SentimentDistributionChartImpl({ data, onSelectBucket, activeBucket }: Props) {
  const itemRefs = useRef<Map<string, HTMLLIElement>>(new Map());
  // Último bucket aberto, para restaurar foco quando o drawer fechar (active → null).
  const lastActiveRef = useRef<SentimentOverall | null>(null);
  // Marca se o usuário interagiu via teclado, para evitar roubar foco em cliques de mouse.
  const keyboardRef = useRef(false);
  // "Cursor" do navegador global por atalho — mantém memória entre keydowns mesmo
  // quando o foco do DOM está fora da legenda.
  const cursorRef = useRef<SentimentOverall | null>(null);

  useEffect(() => {
    const onKey = () => { keyboardRef.current = true; };
    const onMouse = () => { keyboardRef.current = false; };
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("mousedown", onMouse, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("mousedown", onMouse, true);
    };
  }, []);

  // Mantém / restaura o foco no item correspondente ao bucket ativo (ou no último,
  // ao fechar o drawer) — somente se a interação corrente foi por teclado, para
  // não roubar o foco quando o usuário clicou com o mouse.
  useEffect(() => {
    if (!keyboardRef.current) {
      if (activeBucket) lastActiveRef.current = activeBucket;
      return;
    }
    if (activeBucket) {
      lastActiveRef.current = activeBucket;
      cursorRef.current = activeBucket;
      const el = itemRefs.current.get(activeBucket);
      if (el && document.activeElement !== el) el.focus();
    } else if (lastActiveRef.current) {
      const el = itemRefs.current.get(lastActiveRef.current);
      if (el) el.focus();
    }
  }, [activeBucket]);

  // Derivações memoizadas (precisam vir antes de qualquer early-return).
  const filtered = useMemo(() => data.filter((d) => d.count > 0), [data]);
  const navigableKeys = useMemo<SentimentOverall[]>(
    () => (onSelectBucket ? data.filter((d) => d.count > 0).map((d) => d.key as SentimentOverall) : []),
    [data, onSelectBucket],
  );

  const handleSelect = useCallback((key: string) => {
    if (!onSelectBucket || !isSentimentKey(key)) return;
    const slice = data.find((d) => d.key === key);
    if (!slice || slice.count === 0) return;
    onSelectBucket(key);
  }, [onSelectBucket, data]);

  const focusKey = useCallback((key: string) => {
    const el = itemRefs.current.get(key);
    if (el) el.focus();
  }, []);

  // Move o cursor global em uma direção; usado pelos atalhos globais (setas).
  // Sincroniza foco no <li> correspondente para feedback visual + screen reader.
  // Primeira ativação (sem cursor e sem activeBucket) apenas posiciona no primeiro/último,
  // sem avançar — o usuário precisa "entrar" na navegação antes de movimentar.
  const moveCursor = useCallback((direction: -1 | 1 | "first" | "last") => {
    if (navigableKeys.length === 0) return;
    const seed = cursorRef.current ?? activeBucket ?? null;
    let nextIdx: number;
    if (direction === "first") nextIdx = 0;
    else if (direction === "last") nextIdx = navigableKeys.length - 1;
    else if (seed === null) {
      // Bootstrap: primeira tecla → primeiro item se ArrowRight, último se ArrowLeft.
      nextIdx = direction === 1 ? 0 : navigableKeys.length - 1;
    } else {
      const currentIdx = navigableKeys.indexOf(seed);
      nextIdx = currentIdx === -1
        ? 0
        : (currentIdx + direction + navigableKeys.length) % navigableKeys.length;
    }
    const next = navigableKeys[nextIdx];
    cursorRef.current = next;
    focusKey(next);
  }, [navigableKeys, activeBucket, focusKey]);

  // Pula o atalho global quando o evento já está sendo tratado localmente
  // (foco em um item da legenda) — evita "double step".
  const isFromLegend = (e: KeyboardEvent | globalThis.KeyboardEvent) => {
    const t = e.target as HTMLElement | null;
    return !!t?.dataset?.bucketKey;
  };

  // Atalhos globais (escopo "insights"): setas navegam, Enter seleciona.
  // O hook ignora automaticamente quando o foco está em input/textarea/select/contentEditable.
  useScopedShortcut({
    scope: "insights",
    keys: "ArrowRight",
    description: "Próxima fatia de sentimento",
    handler: (e) => { if (!isFromLegend(e)) moveCursor(1); },
  });
  useScopedShortcut({
    scope: "insights",
    keys: "ArrowLeft",
    description: "Fatia de sentimento anterior",
    handler: (e) => { if (!isFromLegend(e)) moveCursor(-1); },
  });
  useScopedShortcut({
    scope: "insights",
    keys: "Enter",
    description: "Abrir conversas do sentimento focado",
    handler: (e) => {
      if (isFromLegend(e)) return; // o handler da <li> já cuida via Enter/Espaço
      const key = cursorRef.current ?? activeBucket ?? navigableKeys[0];
      if (key) handleSelect(key);
    },
  });

  if (!filtered.length) {
    return <p className="text-sm text-muted-foreground text-center py-12">Sem dados de sentimento no período.</p>;
  }

  // Handler local da <ul> — preserva navegação completa (Arrow*, Home, End, Enter, Espaço)
  // quando o foco já está em um item. Os atalhos globais cobrem o caso "foco fora da lista".
  const handleListKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    if (navigableKeys.length === 0) return;
    const target = e.target as HTMLElement;
    const currentKey = target?.dataset?.bucketKey;
    const currentIdx = currentKey ? navigableKeys.indexOf(currentKey as SentimentOverall) : -1;
    if (currentIdx === -1) return;

    const moveTo = (nextIdx: number) => {
      e.preventDefault();
      const next = navigableKeys[(nextIdx + navigableKeys.length) % navigableKeys.length];
      cursorRef.current = next;
      focusKey(next);
    };

    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        moveTo(currentIdx + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        moveTo(currentIdx - 1);
        break;
      case "Home":
        moveTo(0);
        break;
      case "End":
        moveTo(navigableKeys.length - 1);
        break;
    }
  };

  const hasActive = !!activeBucket && filtered.some((d) => d.key === activeBucket);
  const activeSlice = hasActive ? filtered.find((d) => d.key === activeBucket) : undefined;
  const activeColor = activeSlice ? COLORS[activeSlice.key] ?? "hsl(var(--muted))" : undefined;

  // Pie de "anel" externo: só renderiza arco da fatia ativa, deixando o resto transparente.
  // Reforça visualmente a correspondência entre o bucket aberto na lista e sua fatia.
  const ringData = hasActive
    ? filtered.map((d) => ({ ...d, _ring: d.key === activeBucket ? 1 : 0 }))
    : [];

  return (
    <div className="space-y-3">
      <div className="h-56 sentiment-pie-focus relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filtered}
              dataKey="count"
              nameKey="key"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              isAnimationActive={false}
              onClick={(e: { key?: string } | undefined) => e?.key && handleSelect(e.key)}
              className={onSelectBucket ? "cursor-pointer" : undefined}
            >
              {filtered.map((d) => {
                const clickable = !!onSelectBucket && d.count > 0;
                const isActive = hasActive && d.key === activeBucket;
                const dim = hasActive && !isActive;
                const sliceColor = COLORS[d.key] ?? "hsl(var(--muted))";
                return (
                  <Cell
                    key={d.key}
                    fill={sliceColor}
                    fillOpacity={dim ? 0.22 : 1}
                    stroke={isActive ? "hsl(var(--background))" : "transparent"}
                    strokeWidth={isActive ? 2 : 0}
                    style={{
                      transition: "fill-opacity 200ms ease, stroke-width 200ms ease, transform 200ms ease, filter 200ms ease",
                      transformOrigin: "center",
                      transform: isActive ? "scale(1.06)" : "scale(1)",
                      filter: isActive ? `drop-shadow(0 0 6px ${sliceColor})` : "none",
                    }}
                    tabIndex={clickable ? 0 : -1}
                    role={clickable ? "button" : undefined}
                    aria-label={clickable ? `Ver conversas com sentimento ${LABELS[d.key]}` : undefined}
                    aria-pressed={clickable ? isActive : undefined}
                    onKeyDown={clickable ? (e: React.KeyboardEvent<SVGPathElement>) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelect(d.key);
                      }
                    } : undefined}
                  />
                );
              })}
            </Pie>
            {hasActive && (
              <Pie
                data={ringData}
                dataKey="count"
                nameKey="key"
                innerRadius={84}
                outerRadius={90}
                paddingAngle={2}
                isAnimationActive={false}
                stroke="none"
              >
                {ringData.map((d) => (
                  <Cell
                    key={`ring-${d.key}`}
                    fill={d._ring ? (COLORS[d.key] ?? "hsl(var(--muted))") : "transparent"}
                    fillOpacity={d._ring ? 0.9 : 0}
                  />
                ))}
              </Pie>
            )}
            <Tooltip
              cursor={false}
              content={(tp: TooltipProps<number, string>) => {
                const item = tp.payload?.[0];
                if (!item) return null;
                const slice = item.payload as Slice;
                const clickable = !!onSelectBucket && slice.count > 0;
                return (
                  <div
                    style={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                      padding: "6px 8px",
                      boxShadow: "0 4px 12px hsl(var(--background) / 0.4)",
                    }}
                  >
                    <div className="font-medium text-foreground">{LABELS[slice.key]}</div>
                    <div className="text-muted-foreground">{slice.count} ({slice.pct}%)</div>
                    {clickable && (
                      <div className="mt-1 text-[10px] text-primary">{AFFORDANCE_HINT}</div>
                    )}
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {hasActive && activeSlice && (
          <div
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"
            aria-hidden="true"
          >
            <span
              className="text-[10px] uppercase tracking-wide font-medium"
              style={{ color: activeColor }}
            >
              {LABELS[activeSlice.key]}
            </span>
            <span className="text-lg font-semibold leading-none text-foreground">
              {activeSlice.pct}%
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5">
              {activeSlice.count} {activeSlice.count === 1 ? "conversa" : "conversas"}
            </span>
          </div>
        )}
      </div>
      <TooltipProvider delayDuration={250}>
        <ul
          className="grid grid-cols-2 gap-2 text-xs"
          role="group"
          aria-label="Distribuição de sentimento — use as setas para navegar e Enter para abrir"
          onKeyDown={handleListKeyDown}
        >
          {data.map((d) => {
            const clickable = !!onSelectBucket && d.count > 0;
            const isActive = hasActive && d.key === activeBucket;
            const dim = hasActive && !isActive;
            const sliceColor = COLORS[d.key] ?? "hsl(var(--muted))";
            const item = (
              <li
                key={d.key}
                ref={(el) => {
                  if (el) itemRefs.current.set(d.key, el);
                  else itemRefs.current.delete(d.key);
                }}
                data-bucket-key={d.key}
                className={`relative flex items-center gap-2 rounded pl-2 pr-1 py-0.5 transition-all border-l-2 ${clickable ? "cursor-pointer hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background" : ""} ${isActive ? "bg-muted ring-1 ring-ring/60 shadow-sm" : ""} ${dim ? "opacity-50" : ""} ${!clickable && d.count === 0 ? "opacity-60 cursor-not-allowed" : ""}`}
                style={{ borderLeftColor: isActive ? sliceColor : "transparent" }}
                onClick={clickable ? () => handleSelect(d.key) : undefined}
                onKeyDown={clickable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleSelect(d.key); } } : undefined}
                role={clickable ? "button" : undefined}
                tabIndex={clickable ? 0 : -1}
                aria-pressed={clickable ? isActive : undefined}
                aria-disabled={d.count === 0 ? true : undefined}
                aria-label={
                  clickable
                    ? `Ver conversas com sentimento ${LABELS[d.key]}${isActive ? " (selecionado)" : ""}`
                    : d.count === 0
                      ? `Sem conversas no bucket ${LABELS[d.key]}`
                      : undefined
                }
              >
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: sliceColor }} />
                <span className={isActive ? "text-foreground font-medium" : "text-muted-foreground"}>{LABELS[d.key]}</span>
                {isActive && (
                  <CheckCircle2
                    className="h-3.5 w-3.5 shrink-0"
                    style={{ color: sliceColor }}
                    aria-hidden="true"
                  />
                )}
                <span className="ml-auto font-medium text-foreground">{d.pct}%</span>
              </li>
            );
            if (!clickable) return item;
            return (
              <UITooltip key={d.key}>
                <TooltipTrigger asChild>{item}</TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {AFFORDANCE_HINT}
                </TooltipContent>
              </UITooltip>
            );
          })}
        </ul>
      </TooltipProvider>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="sentiment-bucket-live"
      >
        {hasActive && activeSlice
          ? `Bucket selecionado: ${LABELS[activeSlice.key].toLowerCase()}`
          : ""}
      </div>
    </div>
  );
}

export const SentimentDistributionChart = memo(SentimentDistributionChartImpl);
