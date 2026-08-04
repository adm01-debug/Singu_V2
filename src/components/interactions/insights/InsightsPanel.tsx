import { useState, useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, MessageCircle, TrendingUp, AlertTriangle, Sparkles, Flame, ListFilter } from "lucide-react";
import { useInteractionsInsights, type Period, type ThemeAggregate, type ObjectionAggregate } from "@/hooks/useInteractionsInsights";
import type { SentimentOverall } from "@/hooks/useConversationIntel";
import { SentimentDistributionChart } from "./SentimentDistributionChart";
import { SentimentTrendChart } from "./SentimentTrendChart";
import { ObjectionsTrendChart } from "./ObjectionsTrendChart";
import { ThemesRanking } from "./ThemesRanking";
import { ObjectionsRanking } from "./ObjectionsRanking";
import { ObjectionsSpotlight } from "./ObjectionsSpotlight";
import { ThemeExamplesDrawer } from "./ThemeExamplesDrawer";
import { SentimentExamplesDrawer } from "./SentimentExamplesDrawer";

const PERIOD_LABEL: Record<string, string> = { positive: "Positivo", neutral: "Neutro", negative: "Negativo", mixed: "Misto" };

function isPeriod(v: string | null): v is Period {
  return v === "7d" || v === "30d" || v === "90d";
}

function isSentimentBucket(v: string | null): v is SentimentOverall {
  return v === "positive" || v === "neutral" || v === "negative" || v === "mixed";
}

type ObjectionFilter = "all" | "unhandled" | "critical";

function isObjectionFilter(v: string | null): v is ObjectionFilter {
  return v === "all" || v === "unhandled" || v === "critical";
}

/**
 * Severidade alinhada com `ObjectionsSpotlight.getSeverity` para que o filtro
 * "Críticas" daqui case com a marcação visual dos cards.
 */
function isCritical(o: ObjectionAggregate): boolean {
  const rate = o.count ? (o.handled / o.count) * 100 : 0;
  return o.unhandled >= 3 || rate <= 30;
}

export function InsightsPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const periodParam = searchParams.get("periodo");
  const period: Period = isPeriod(periodParam) ? periodParam : "30d";
  const sentimentParam = searchParams.get("sentimento");
  const selectedBucket: SentimentOverall | null = isSentimentBucket(sentimentParam) ? sentimentParam : null;
  const objectionFilterParam = searchParams.get("objecoes");
  const objectionFilter: ObjectionFilter = isObjectionFilter(objectionFilterParam)
    ? objectionFilterParam
    : "all";

  const handleObjectionFilter = useCallback((next: ObjectionFilter) => {
    const params = new URLSearchParams(searchParams);
    if (next === "all") params.delete("objecoes");
    else params.set("objecoes", next);
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  const handlePeriod = useCallback((p: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("periodo", p);
    // Trocar período invalida o bucket selecionado (drawer fecha junto).
    next.delete("sentimento");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleSelectBucket = useCallback((bucket: SentimentOverall | null) => {
    const next = new URLSearchParams(searchParams);
    if (bucket) next.set("sentimento", bucket);
    else next.delete("sentimento");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const { kpis, sentimentDistribution, sentimentTrend, sentimentTrendSummary, topThemes, topObjections, objectionsTrend, objectionsTrendSummary, sentimentBuckets, isLoading } = useInteractionsInsights(period);
  const [selectedTheme, setSelectedTheme] = useState<ThemeAggregate | null>(null);

  // Fechar drawer de temas ao trocar período (bucket é tratado via URL em handlePeriod).
  useEffect(() => { setSelectedTheme(null); }, [period]);

  // Contagens por filtro (sempre sobre o set completo, para alimentar os
  // badges do toggle independentemente do filtro selecionado).
  const objectionCounts = useMemo(() => {
    const all = topObjections.length;
    const unhandled = topObjections.filter((o) => o.unhandled > 0).length;
    const critical = topObjections.filter(isCritical).length;
    return { all, unhandled, critical };
  }, [topObjections]);

  const filteredObjections = useMemo(() => {
    if (objectionFilter === "unhandled") return topObjections.filter((o) => o.unhandled > 0);
    if (objectionFilter === "critical") return topObjections.filter(isCritical);
    return topObjections;
  }, [topObjections, objectionFilter]);

  const isEmpty = !isLoading && kpis.totalAnalyzed === 0;

  return (
    <div className="space-y-4">
      {/* Header com período */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Insights de Conversas</h2>
          <Badge variant="outline" className="text-[10px]">IA · Gemini</Badge>
        </div>
        <Tabs value={period} onValueChange={handlePeriod}>
          <TabsList className="h-8">
            <TabsTrigger value="7d" className="text-xs h-6 px-3">7 dias</TabsTrigger>
            <TabsTrigger value="30d" className="text-xs h-6 px-3">30 dias</TabsTrigger>
            <TabsTrigger value="90d" className="text-xs h-6 px-3">90 dias</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      )}

      {isEmpty && (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <Brain className="h-10 w-10 text-muted-foreground mx-auto" />
            <h3 className="text-base font-semibold text-foreground">Sem análises no período</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Análises são geradas automaticamente para interações com transcrição (chamadas, reuniões e notas com mais de 100 caracteres). Registre uma interação com conteúdo para começar.
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isEmpty && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard icon={MessageCircle} label="Conversas analisadas" value={kpis.totalAnalyzed} />
            <KpiCard
              icon={TrendingUp}
              label="Sentimento dominante"
              value={kpis.dominantSentiment ? PERIOD_LABEL[kpis.dominantSentiment] : "—"}
              hint={kpis.dominantSentiment ? `${kpis.dominantPct}% das conversas` : undefined}
            />
            <KpiCard icon={Brain} label="Coaching score médio" value={`${kpis.avgCoachingScore}/100`} />
            <KpiCard
              icon={AlertTriangle}
              label="Objeções não tratadas"
              value={kpis.unhandledObjections}
              variant={kpis.unhandledObjections > 0 ? "warning" : "default"}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Distribuição de sentimento</CardTitle></CardHeader>
              <CardContent><SentimentDistributionChart data={sentimentDistribution} onSelectBucket={handleSelectBucket} activeBucket={selectedBucket} /></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Tendência semanal</CardTitle></CardHeader>
              <CardContent><SentimentTrendChart data={sentimentTrend} summary={sentimentTrendSummary} /></CardContent>
            </Card>
          </div>

          {/* Evolução semanal de objeções */}
          {objectionsTrend.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Evolução semanal de objeções
                </CardTitle>
                <CardDescription className="text-xs">
                  Quando o risco de bloqueio aumentou ou diminuiu — críticas (não tratadas) vs. atenções (tratadas).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ObjectionsTrendChart data={objectionsTrend} summary={objectionsTrendSummary} />
              </CardContent>
            </Card>
          )}

          {/* Themes & Objections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Temas mais discutidos</CardTitle>
              </CardHeader>
              <CardContent>
                <ThemesRanking themes={topThemes} onSelect={setSelectedTheme} />
              </CardContent>
            </Card>
            <div className="space-y-3">
              {topObjections.length > 0 && (
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ListFilter className="h-3.5 w-3.5" />
                    <span>Filtrar objeções</span>
                  </div>
                  <Tabs
                    value={objectionFilter}
                    onValueChange={(v) => handleObjectionFilter(v as ObjectionFilter)}
                  >
                    <TabsList className="h-7 p-0.5">
                      <TabsTrigger
                        value="all"
                        className="text-[11px] h-6 px-2 gap-1"
                        title="Todas as objeções do período"
                      >
                        Todas
                        <Badge variant="outline" className="h-4 text-[10px] px-1 ml-0.5">
                          {objectionCounts.all}
                        </Badge>
                      </TabsTrigger>
                      <TabsTrigger
                        value="unhandled"
                        className="text-[11px] h-6 px-2 gap-1"
                        title="Objeções com pelo menos uma menção sem tratamento"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        Não tratadas
                        <Badge variant="outline" className="h-4 text-[10px] px-1 ml-0.5">
                          {objectionCounts.unhandled}
                        </Badge>
                      </TabsTrigger>
                      <TabsTrigger
                        value="critical"
                        className="text-[11px] h-6 px-2 gap-1"
                        title="Severidade alta: 3+ não tratadas ou taxa de tratamento ≤ 30%"
                      >
                        <Flame className="h-3 w-3" />
                        Críticas
                        <Badge variant="outline" className="h-4 text-[10px] px-1 ml-0.5">
                          {objectionCounts.critical}
                        </Badge>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              )}

              {topObjections.length > 0 && filteredObjections.length === 0 && (
                <Card>
                  <CardContent className="py-6 text-center space-y-2">
                    <p className="text-sm text-foreground">
                      {objectionFilter === "unhandled"
                        ? "Nenhuma objeção sem tratamento neste período. 🎉"
                        : "Nenhuma objeção crítica neste período. 🎉"}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleObjectionFilter("all")}
                      className="text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                    >
                      Ver todas as objeções
                    </button>
                  </CardContent>
                </Card>
              )}

              {filteredObjections.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Objeções em destaque</CardTitle>
                    <CardDescription className="text-xs">
                      {objectionFilter === "all"
                        ? "Top 3 com maior risco de bloqueio"
                        : objectionFilter === "unhandled"
                          ? `Top com menções sem tratamento (${filteredObjections.length})`
                          : `Top com severidade crítica (${filteredObjections.length})`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ObjectionsSpotlight objections={filteredObjections} />
                  </CardContent>
                </Card>
              )}

              {filteredObjections.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Objeções recorrentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ObjectionsRanking objections={filteredObjections} />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      )}

      <ThemeExamplesDrawer theme={selectedTheme} onClose={() => setSelectedTheme(null)} />
      <SentimentExamplesDrawer
        bucket={selectedBucket}
        interactionIds={selectedBucket ? sentimentBuckets[selectedBucket] ?? [] : []}
        onClose={() => handleSelectBucket(null)}
      />
    </div>
  );
}

interface KpiProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  hint?: string;
  variant?: "default" | "warning";
}

function KpiCard({ icon: Icon, label, value, hint, variant = "default" }: KpiProps) {
  return (
    <Card variant={variant === "warning" ? "warning" : "default"}>
      <CardContent className="p-4 space-y-1.5">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          <span className="text-[11px] uppercase tracking-wide">{label}</span>
        </div>
        <div className="text-2xl font-semibold text-foreground tabular-nums">{value}</div>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
