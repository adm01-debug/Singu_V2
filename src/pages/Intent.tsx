import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Radar, RefreshCcw, Settings2, Flame, Activity, TrendingUp } from "lucide-react";
import { useIntentSignals, useTopIntentScores, useRefreshIntent, SIGNAL_TYPE_LABELS } from "@/hooks/useIntent";
import { HotAccountsTable } from "@/components/intent/HotAccountsTable";
import { IntentSignalsTimeline } from "@/components/intent/IntentSignalsTimeline";

export default function IntentPage() {
  const [signalType, setSignalType] = useState<string>("all");
  const [days, setDays] = useState<number>(30);

  const { data: signals = [], isLoading: signalsLoading } = useIntentSignals({
    signal_type: signalType === "all" ? undefined : signalType,
    days,
    limit: 200,
  });
  const { data: accountScores = [], isLoading: accLoading } = useTopIntentScores("account", 50);
  const { data: contactScores = [] } = useTopIntentScores("contact", 50);
  const refresh = useRefreshIntent();

  const kpis = useMemo(() => {
    const last24h = signals.filter((s) => Date.now() - new Date(s.occurred_at).getTime() < 86400_000).length;
    const last7d = signals.filter((s) => Date.now() - new Date(s.occurred_at).getTime() < 7 * 86400_000).length;
    const hotAccounts = accountScores.filter((s) => s.intent_score >= 70).length;
    const avgScore = accountScores.length
      ? Math.round(accountScores.reduce((s, x) => s + x.intent_score, 0) / accountScores.length)
      : 0;
    return { last24h, last7d, hotAccounts, avgScore };
  }, [signals, accountScores]);

  return (
    <AppLayout>
      <Helmet>
        <title>Intent Data — SINGU CRM</title>
        <meta name="description" content="Sinais de intenção de compra first-party, score por conta e contato e contas hot." />
      </Helmet>

      <div className="container py-6 space-y-6">
        <header className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Radar className="h-6 w-6 text-primary" /> Intent Data
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Capture sinais first-party de visitas, formulários e engajamento. Identifique contas com alta intenção de compra.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refresh.mutate()} disabled={refresh.isPending}>
              <RefreshCcw className={`h-4 w-4 mr-2 ${refresh.isPending ? "animate-spin" : ""}`} />
              Recalcular scores
            </Button>
            <Button asChild>
              <Link to="/intent/setup"><Settings2 className="h-4 w-4 mr-2" /> Configurar pixel</Link>
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard icon={Activity} label="Sinais 24h" value={kpis.last24h} />
          <KpiCard icon={TrendingUp} label="Sinais 7 dias" value={kpis.last7d} />
          <KpiCard icon={Flame} label="Contas hot (≥70)" value={kpis.hotAccounts} tone="warning" />
          <KpiCard icon={Radar} label="Score médio" value={kpis.avgScore} suffix="/100" />
        </div>

        <Tabs defaultValue="accounts">
          <TabsList>
            <TabsTrigger value="accounts">Contas hot</TabsTrigger>
            <TabsTrigger value="contacts">Contatos hot</TabsTrigger>
            <TabsTrigger value="signals">Timeline de sinais</TabsTrigger>
          </TabsList>

          <TabsContent value="accounts" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Contas ordenadas por intent score</CardTitle></CardHeader>
              <CardContent className="p-0"><HotAccountsTable scores={accountScores} loading={accLoading} /></CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Contatos ordenados por intent score</CardTitle></CardHeader>
              <CardContent className="p-0"><HotAccountsTable scores={contactScores} /></CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signals" className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Select value={signalType} onValueChange={setSignalType}>
                <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {Object.entries(SIGNAL_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Últimas 24h</SelectItem>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="90">90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {signalsLoading ? (
              <div className="p-6 text-sm text-muted-foreground">Carregando sinais…</div>
            ) : (
              <IntentSignalsTimeline signals={signals} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function KpiCard({
  icon: Icon, label, value, suffix, tone,
}: { icon: typeof Activity; label: string; value: number; suffix?: string; tone?: "warning" }) {
  return (
    <Card variant={tone === "warning" ? "warning" : "default"}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
          <Icon className="h-3.5 w-3.5" /> {label}
        </div>
        <p className="text-2xl font-semibold mt-1.5">
          {value}{suffix && <span className="text-sm text-muted-foreground ml-1">{suffix}</span>}
        </p>
      </CardContent>
    </Card>
  );
}
