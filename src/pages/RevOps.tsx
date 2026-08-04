import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, RefreshCw } from "lucide-react";
import { RevenueFunnelChart } from "@/components/revops/RevenueFunnelChart";
import { KPIComparisonGrid } from "@/components/revops/KPIComparisonGrid";
import { BenchmarkConfigForm } from "@/components/revops/BenchmarkConfigForm";
import { RevOpsAlertList } from "@/components/revops/RevOpsAlertList";
import { RevOpsPeriodSelector, getRange, type RevOpsPeriod } from "@/components/revops/RevOpsPeriodSelector";
import { useRevOpsKPIs, useTriggerRevOpsSnapshot } from "@/hooks/useRevOps";

export default function RevOps() {
  const [period, setPeriod] = useState<RevOpsPeriod>("30d");
  const range = useMemo(() => getRange(period), [period]);
  const { data: kpis, isLoading } = useRevOpsKPIs(range.start, range.end);
  const { data: prevKpis } = useRevOpsKPIs(range.prevStart, range.prevEnd);
  const trigger = useTriggerRevOpsSnapshot();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Helmet>
        <title>RevOps Dashboard | Revenue Operations</title>
        <meta name="description" content="Visão unificada de eficiência da máquina de receita: funil ponta-a-ponta, KPIs, benchmarks e alertas." />
      </Helmet>

      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Revenue Operations</h1>
            <p className="text-sm text-muted-foreground">Eficiência ponta-a-ponta do funil de receita</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RevOpsPeriodSelector value={period} onChange={setPeriod} />
          <Button variant="outline" size="sm" onClick={() => trigger.mutate()} disabled={trigger.isPending}>
            <RefreshCw className={`w-4 h-4 mr-2 ${trigger.isPending ? "animate-spin" : ""}`} />
            Atualizar Snapshot
          </Button>
        </div>
      </header>

      <RevOpsAlertList />

      <Tabs defaultValue="kpis" className="space-y-4">
        <TabsList>
          <TabsTrigger value="kpis">KPIs</TabsTrigger>
          <TabsTrigger value="funnel">Funil</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
        </TabsList>

        <TabsContent value="kpis" className="space-y-4">
          {isLoading || !kpis ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <KPIComparisonGrid kpis={kpis} prev={prevKpis} />
          )}
        </TabsContent>

        <TabsContent value="funnel">
          {isLoading || !kpis ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <RevenueFunnelChart kpis={kpis} />
          )}
        </TabsContent>

        <TabsContent value="benchmarks">
          <BenchmarkConfigForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
