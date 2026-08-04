import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useForecastPeriods, useCurrentPeriod, useCreatePeriod, useForecastSummary, useForecastSnapshots, useAnalyzeForecast } from "@/hooks/useForecasting";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PeriodSelector } from "@/components/forecasting/PeriodSelector";
import { QuotaProgressBar } from "@/components/forecasting/QuotaProgressBar";
import { ForecastWaterfall } from "@/components/forecasting/ForecastWaterfall";
import { CategoryColumn } from "@/components/forecasting/CategoryColumn";
import { AccuracyChart } from "@/components/forecasting/AccuracyChart";
import { RiskDealsTable } from "@/components/forecasting/RiskDealsTable";
import { ForecastNarrativeCard } from "@/components/forecasting/ForecastNarrativeCard";
import { Settings, Plus, Sparkles, TrendingUp, Target, AlertTriangle, DollarSign, Loader2 } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function Forecasting() {
  const { data: periods = [] } = useForecastPeriods();
  const { data: currentMonth } = useCurrentPeriod("month");
  const createPeriod = useCreatePeriod();
  const analyze = useAnalyzeForecast();

  const [selected, setSelected] = useState<string | undefined>(undefined);
  const periodId = selected ?? currentMonth?.id ?? periods[0]?.id;

  const summary = useForecastSummary(periodId);
  const { data: snapshots = [] } = useForecastSnapshots(periodId);

  const kpis = useMemo(() => [
    { label: "Commit", value: summary.commit, icon: Target, color: "text-success" },
    { label: "Best Case", value: summary.bestCase, icon: TrendingUp, color: "text-info" },
    { label: "Attainment", value: `${summary.attainment}%`, icon: DollarSign, color: "text-primary", isText: true },
    { label: "Gap to Quota", value: summary.gap, icon: AlertTriangle, color: summary.gap > 0 ? "text-warning" : "text-success" },
  ], [summary]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Helmet><title>Forecasting & Revenue Intelligence | SINGU CRM</title></Helmet>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><TrendingUp className="h-6 w-6 text-primary" />Forecasting & Revenue Intelligence</h1>
          <p className="text-sm text-muted-foreground">Previsão de receita com IA, categorização e tracking de accuracy</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PeriodSelector periods={periods} value={periodId} onChange={setSelected} />
          <Button variant="outline" onClick={() => createPeriod.mutate("month")}><Plus className="h-4 w-4" />Mês</Button>
          <Button variant="outline" onClick={() => createPeriod.mutate("quarter")}><Plus className="h-4 w-4" />Trimestre</Button>
          <Button asChild variant="outline"><Link to="/forecasting/setup"><Settings className="h-4 w-4" />Setup</Link></Button>
        </div>
      </div>

      {!periodId ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          Crie um período de forecast para começar.
        </CardContent></Card>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {kpis.map(k => (
              <Card key={k.label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{k.label}</span>
                    <k.icon className={`h-4 w-4 ${k.color}`} />
                  </div>
                  <div className="mt-2 text-2xl font-bold">
                    {k.isText ? k.value : `R$ ${Number(k.value).toLocaleString("pt-BR")}`}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2"><ForecastWaterfall commit={summary.commit} bestCase={summary.bestCase} pipeline={summary.pipeline} won={Number(summary.period?.actual_won_amount ?? 0)} quota={summary.quota} /></div>
            <QuotaProgressBar commit={summary.commit} won={Number(summary.period?.actual_won_amount ?? 0)} quota={summary.quota} />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">{summary.deals.length} deals no período</div>
            <Button onClick={() => analyze.mutate({ periodId, deals: summary.deals.map(d => ({ deal_id: d.deal_id, deal_name: d.deal_name ?? undefined, amount: Number(d.forecasted_amount), expected_close_date: d.forecasted_close_date ?? undefined, stage: d.stage ?? undefined, last_activity_at: d.last_activity_at ?? undefined, contact_id: d.contact_id ?? undefined, company_id: d.company_id ?? undefined })) })} disabled={analyze.isPending || summary.deals.length === 0}>
              {analyze.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Re-analisar com IA
            </Button>
          </div>

          <Tabs defaultValue="categories">
            <TabsList>
              <TabsTrigger value="categories">Pipeline por Categoria</TabsTrigger>
              <TabsTrigger value="trending">Trending</TabsTrigger>
              <TabsTrigger value="risk">Risk</TabsTrigger>
              <TabsTrigger value="narrative">Narrativa IA</TabsTrigger>
            </TabsList>
            <TabsContent value="categories" className="mt-4"><CategoryColumn deals={summary.deals} /></TabsContent>
            <TabsContent value="trending" className="mt-4"><AccuracyChart snapshots={snapshots} /></TabsContent>
            <TabsContent value="risk" className="mt-4"><RiskDealsTable deals={summary.deals} /></TabsContent>
            <TabsContent value="narrative" className="mt-4"><ForecastNarrativeCard periodId={periodId} /></TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
