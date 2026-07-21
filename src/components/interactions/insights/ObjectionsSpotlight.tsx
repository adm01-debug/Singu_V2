import { memo, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Flame, AlertTriangle, CheckCircle2, Lightbulb, ChevronDown, ChevronUp, Copy, Check, ExternalLink, Filter, Wand2, ShieldCheck, RotateCcw, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ObjectionAggregate } from "@/hooks/useInteractionsInsights";
import { ObjectionExamplesModal } from "./ObjectionExamplesModal";
import { SuggestedResponseModal } from "./SuggestedResponseModal";
import { useMarkObjectionHandled } from "@/hooks/useMarkObjectionHandled";
import { usePersistentBoolean } from "@/hooks/usePersistentBoolean";
import { useObjectionContextSummary } from "@/hooks/useObjectionContextSummary";
import { useAuth } from "@/hooks/useAuth";
import { useObjectionExampleFeedback } from "@/hooks/useObjectionExampleFeedback";
import { useAppliedResponses } from "@/hooks/useAppliedResponses";

/**
 * Gera uma chave estável e curta para persistir preferências por objeção
 * (normaliza acentos/caixa, remove não-alfanuméricos e inclui o tamanho
 * original como anti-colisão simples).
 */
function objectionStorageKey(prefix: string, objection: string): string {
  const slug = objection
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    // eslint-disable-next-line sonarjs/slow-regex -- regex verified non-catastrophic (no nested ambiguous quantifiers / bounded)
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `relateiq:${prefix}:${slug}:${objection.length}`;
}

const PERIOD_TO_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };

function toIsoDate(d: Date): string {
  // YYYY-MM-DD em horário local — formato esperado pelos parâmetros `de`/`ate`.
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

interface Props {
  objections: ObjectionAggregate[];
}

type Severity = "high" | "medium" | "low";

interface SeverityStyle {
  border: string;
  iconColor: string;
  bar: string;
  Icon: typeof Flame;
  label: string;
}

const SEVERITY_STYLES: Record<Severity, SeverityStyle> = {
  high: {
    border: "border-destructive/40 bg-destructive/5",
    iconColor: "text-destructive",
    bar: "bg-destructive",
    Icon: Flame,
    label: "Crítica",
  },
  medium: {
    border: "border-warning/40 bg-warning/5",
    iconColor: "text-warning",
    bar: "bg-warning",
    Icon: AlertTriangle,
    label: "Atenção",
  },
  low: {
    border: "border-success/40 bg-success/5",
    iconColor: "text-success",
    bar: "bg-success",
    Icon: CheckCircle2,
    label: "Bem tratada",
  },
};

function getSeverity(o: ObjectionAggregate): Severity {
  const rate = o.count ? (o.handled / o.count) * 100 : 0;
  if (o.unhandled >= 3 || rate <= 30) return "high";
  if (o.unhandled >= 1 || rate <= 70) return "medium";
  return "low";
}

interface ObjectionCardProps {
  o: ObjectionAggregate;
}

// eslint-disable-next-line sonarjs/cognitive-complexity
const ObjectionCard = memo(function ObjectionCard({ o }: ObjectionCardProps) {
  const { user } = useAuth();
  const uid = user?.id ?? 'anon';
  const [expanded, setExpanded] = usePersistentBoolean(
    `${objectionStorageKey("objection-suggested-expanded", o.objection)}-${uid}`,
    false,
  );
  // Aba ativa do bloco "Resposta sugerida": true = "Resumo", false = "Resposta".
  const [summaryActive, setSummaryActive] = usePersistentBoolean(
    `${objectionStorageKey("objection-summary-active", o.objection)}-${uid}`,
    false,
  );
  const [copied, setCopied] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const markHandled = useMarkObjectionHandled();
  const { markApplied, getByObjection } = useAppliedResponses();
  const applications = getByObjection(o.objection);
  const appliedCount = applications.length;
  const lastAppliedAt = applications[0]?.applied_at ?? null;
  const examplesCount = Array.isArray(o.examples) ? o.examples.length : 0;
  const hasExamples = examplesCount > 0;
  const allHandled = o.unhandled === 0 && o.count > 0;

  const handleToggleHandled = useCallback(() => {
    markHandled.mutate({ objection: o.objection, handled: !allHandled });
  }, [markHandled, o.objection, allHandled]);

  const handleQuickMarkApplied = useCallback(() => {
    markApplied.mutate({
      objection: o.objection,
      category: o.category,
      responseText: o.suggestedResponse ?? null,
    });
  }, [markApplied, o.objection, o.category, o.suggestedResponse]);


  const severity = getSeverity(o);
  const style = SEVERITY_STYLES[severity];
  const rate = o.count ? Math.round((o.handled / o.count) * 100) : 0;
  const Icon = style.Icon;

  const suggested = o.suggestedResponse ?? "";
  const isLong = suggested.length > 160 || suggested.includes("\n");
  const showToggle = isLong;
  const panelId = `objection-suggested-${o.objection.replace(/\s+/g, "-").slice(0, 40)}`;
  const summaryPanelId = `${panelId}-summary`;

  // Carrega feedback "Útil" desta objeção para priorizar exemplos no resumo.
  const exampleFeedback = useObjectionExampleFeedback({
    objection: o.objection,
    category: o.category,
  });
  const usefulIds = useMemo(
    () => Array.from(exampleFeedback.usefulByInteraction.entries())
      .filter(([, v]) => v)
      .map(([k]) => k),
    [exampleFeedback.usefulByInteraction],
  );

  // Lazy: só dispara o resumo IA quando a aba "Resumo" estiver ativa
  // (e houver exemplos de interações para alimentar o contexto).
  const summaryQuery = useObjectionContextSummary({
    objection: o.objection,
    category: o.category,
    interactionIds: Array.isArray(o.examples) ? o.examples : [],
    usefulInteractionIds: usefulIds,
    enabled: summaryActive && hasExamples,
  });

  const handleCopy = useCallback(async () => {
    if (!suggested) return;
    try {
      await navigator.clipboard.writeText(suggested);
      setCopied(true);
      toast.success("Resposta copiada");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Não foi possível copiar");
    }
  }, [suggested]);

  const handleApplyFilter = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    // Aplica busca textual pela objeção (mais específica do que a categoria).
    next.set("q", o.objection);
    // Traduz o "periodo" (somente Insights) em range de datas (de/ate) usado pela Lista.
    if (!next.get("de") && !next.get("ate")) {
      const periodo = next.get("periodo");
      const days = periodo ? PERIOD_TO_DAYS[periodo] : undefined;
      if (days) {
        const ate = new Date();
        const de = new Date();
        de.setDate(de.getDate() - days);
        next.set("de", toIsoDate(de));
        next.set("ate", toIsoDate(ate));
      }
    }
    // Remove parâmetros exclusivos da aba Insights e troca para a Lista.
    next.delete("periodo");
    next.delete("sentimento");
    next.delete("tab");
    // Reset de paginação para garantir resultados visíveis.
    next.delete("page");
    setSearchParams(next, { replace: false });
    toast.success("Filtro aplicado", {
      description: `Mostrando interações com "${o.objection.slice(0, 60)}${o.objection.length > 60 ? "…" : ""}"`,
    });
  }, [o.objection, searchParams, setSearchParams]);


  return (
    <div className={cn("rounded-md border p-3 space-y-2.5", style.border)}>
      <div className="flex items-start gap-2">
        <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", style.iconColor)} />
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium text-foreground line-clamp-2"
            title={o.objection}
          >
            {o.objection}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="outline" className="text-[10px] h-4 px-1.5">
              {o.category}
            </Badge>
            {rate === 100 ? (
              <Badge variant="success" className="text-[10px] h-4 px-1.5 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Bem tratada
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className={cn("text-[10px] h-4 px-1.5", style.iconColor)}
              >
                {style.label}
              </Badge>
            )}
            {appliedCount > 0 && (
              <Badge
                variant="outline"
                className="text-[10px] h-4 px-1.5 gap-1 border-success/40 text-success"
                title={
                  lastAppliedAt
                    ? `Você aplicou esta resposta ${appliedCount}× — última em ${new Date(lastAppliedAt).toLocaleDateString("pt-BR")}`
                    : `Aplicada ${appliedCount}×`
                }
              >
                <CheckCircle2 className="h-2.5 w-2.5" />
                Aplicada {appliedCount}×
              </Badge>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <button
            type="button"
            onClick={handleApplyFilter}
            aria-label={`Filtrar interações por "${o.objection}" mantendo o período atual`}
            title="Aplicar este filtro na lista de interações"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground/80 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1.5 py-0.5"
          >
            <Filter className="h-3 w-3" />
            Filtrar interações
          </button>
          <button
            type="button"
            onClick={handleToggleHandled}
            disabled={markHandled.isPending}
            aria-label={
              allHandled
                ? `Reabrir objeção "${o.objection}" como pendente`
                : `Marcar objeção "${o.objection}" como tratada em todas as conversas do período`
            }
            aria-pressed={allHandled}
            title={allHandled ? "Reabrir como pendente" : "Marcar como tratada"}
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-medium rounded-sm px-1.5 py-0.5 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:opacity-60 disabled:cursor-progress",
              allHandled
                ? "text-muted-foreground hover:text-foreground hover:underline"
                : "text-success hover:underline",
            )}
          >
            {markHandled.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : allHandled ? (
              <RotateCcw className="h-3 w-3" />
            ) : (
              <ShieldCheck className="h-3 w-3" />
            )}
            {markHandled.isPending
              ? "Atualizando…"
              : allHandled
                ? "Reabrir"
                : "Marcar como tratada"}
          </button>
        </div>
      </div>



      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
          <span>
            {o.count}× mencionada · {o.handled}/{o.count} tratadas
          </span>
          <span className="font-medium">{rate}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={cn("h-full transition-all", style.bar)}
            style={{ width: `${rate}%` }}
          />
        </div>
      </div>

      {o.unhandled === 0 ? (
        <div className="flex items-center justify-between gap-2 text-[11px] text-success bg-success/8 rounded px-2 py-1.5">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            Esta objeção está sendo bem tratada
          </span>
          {hasExamples && (
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center gap-1 font-medium text-success hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm shrink-0"
            >
              <ExternalLink className="h-3 w-3" />
              Ver conversas ({examplesCount})
            </button>
          )}
        </div>
      ) : suggested ? (
        <div className="flex items-start gap-1.5 text-[11px] bg-warning/8 border border-warning/20 rounded px-2 py-1.5">
          <Lightbulb className="h-3.5 w-3.5 shrink-0 text-warning mt-0.5" />
          <div className="flex-1 min-w-0">
            <Tabs
              value={summaryActive ? "summary" : "response"}
              onValueChange={(v) => setSummaryActive(v === "summary")}
              className="w-full"
            >
              <TabsList className="h-7 p-0.5 bg-warning/10 border border-warning/20">
                <TabsTrigger
                  value="summary"
                  className="h-6 text-[11px] px-2 gap-1 data-[state=active]:bg-background data-[state=active]:text-foreground"
                  disabled={!hasExamples}
                  title={hasExamples ? "Resumo gerado por IA" : "Resumo indisponível: sem conversas relacionadas"}
                >
                  <Sparkles className="h-3 w-3" />
                  Resumo
                </TabsTrigger>
                <TabsTrigger
                  value="response"
                  className="h-6 text-[11px] px-2 gap-1 data-[state=active]:bg-background data-[state=active]:text-foreground"
                >
                  <Lightbulb className="h-3 w-3" />
                  Resposta
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="summary"
                id={summaryPanelId}
                className="mt-1.5 focus-visible:outline-none"
              >
                {!hasExamples ? (
                  <p className="text-muted-foreground italic">
                    Sem conversas relacionadas para gerar um resumo.
                  </p>
                ) : summaryQuery.isLoading ? (
                  <div className="space-y-1.5" aria-live="polite" aria-busy="true">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                    <p className="text-[10px] text-muted-foreground italic mt-1">
                      Resumindo o contexto…
                    </p>
                  </div>
                ) : summaryQuery.isError ? (
                  <div className="flex items-start gap-1.5 text-destructive">
                    <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p>
                        {summaryQuery.error instanceof Error
                          ? summaryQuery.error.message
                          : "Não foi possível gerar o resumo."}
                      </p>
                      <button
                        type="button"
                        onClick={() => summaryQuery.refetch()}
                        className="mt-1 inline-flex items-center gap-1 font-medium text-foreground/80 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Tentar novamente
                      </button>
                    </div>
                  </div>
                ) : summaryQuery.data?.empty ? (
                  <p className="text-muted-foreground italic">
                    {summaryQuery.data.summary}
                  </p>
                ) : summaryQuery.data?.summary ? (
                  <p className="text-foreground/90 whitespace-pre-wrap">
                    {summaryQuery.data.summary}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">
                    Toque para gerar o resumo.
                  </p>
                )}
              </TabsContent>

              <TabsContent
                value="response"
                className="mt-1.5 focus-visible:outline-none"
              >
                <p className="font-medium text-foreground mb-0.5 sr-only">
                  Resposta sugerida
                </p>
                <p
                  id={panelId}
                  className={cn(
                    "text-muted-foreground whitespace-pre-wrap transition-all",
                    !expanded && showToggle && "line-clamp-3",
                  )}
                >
                  {suggested}
                </p>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {showToggle && (
                    <button
                      type="button"
                      onClick={() => setExpanded((v) => !v)}
                      aria-expanded={expanded}
                      aria-controls={panelId}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-warning hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                    >
                      {expanded ? (
                        <>
                          <ChevronUp className="h-3 w-3" />
                          Recolher
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3" />
                          Ver resposta completa
                        </>
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCopy}
                    aria-label="Copiar resposta sugerida"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground/80 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-success" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copiar resposta
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setComposerOpen(true)}
                    aria-label="Abrir modal para editar e enviar a resposta sugerida"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  >
                    <Wand2 className="h-3 w-3" />
                    Criar resposta sugerida
                  </button>
                  <button
                    type="button"
                    onClick={handleQuickMarkApplied}
                    disabled={markApplied.isPending}
                    aria-label="Marcar esta resposta como aplicada em uma negociação"
                    title="Registrar que você usou esta resposta sugerida"
                    className={cn(
                      "inline-flex items-center gap-1 text-[11px] font-medium rounded-sm",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      "disabled:opacity-60 disabled:cursor-progress",
                      "text-success hover:underline",
                    )}
                  >
                    {markApplied.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3" />
                    )}
                    {markApplied.isPending ? "Marcando…" : "Marcar como aplicada"}
                  </button>
                  {hasExamples && (
                    <button
                      type="button"
                      onClick={() => setDrawerOpen(true)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground/80 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Ver conversas ({examplesCount})
                    </button>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 px-2">
          <p className="text-[11px] text-muted-foreground italic">
            Sem resposta sugerida disponível ainda.
          </p>
          {hasExamples && (
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground/80 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm shrink-0"
            >
              <ExternalLink className="h-3 w-3" />
              Ver conversas ({examplesCount})
            </button>
          )}
        </div>
      )}

      <ObjectionExamplesModal
        objection={drawerOpen ? o : null}
        onClose={() => setDrawerOpen(false)}
      />
      {composerOpen && (
        <SuggestedResponseModal
          open={composerOpen}
          onOpenChange={setComposerOpen}
          objection={o.objection}
          category={o.category}
          suggestedResponse={suggested}
        />
      )}
    </div>
  );
});

function ObjectionsSpotlightImpl({ objections }: Props) {
  const top = useMemo(() => {
    if (!Array.isArray(objections) || objections.length === 0) return [];
    return [...objections]
      .map((o) => ({ o, score: o.unhandled * 2 + o.count }))
      .sort(
        (a, b) =>
          b.score - a.score ||
          b.o.count - a.o.count ||
          a.o.objection.localeCompare(b.o.objection, "pt-BR"),
      )
      .slice(0, 3)
      .map((x) => x.o);
  }, [objections]);

  if (top.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Flame className="h-4 w-4 text-destructive" />
        <h3 className="text-sm font-semibold text-foreground">Objeções que pedem ação</h3>
        <Badge variant="outline" className="text-[10px]">Top {top.length}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {top.map((o) => (
          <ObjectionCard key={o.objection} o={o} />
        ))}
      </div>
    </div>
  );
}

export const ObjectionsSpotlight = memo(ObjectionsSpotlightImpl);
