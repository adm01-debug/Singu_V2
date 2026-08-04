import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useCSAccounts } from "@/hooks/useCustomerSuccess";
import { AccountPortfolioCard } from "@/components/customer-success/AccountPortfolioCard";
import { RenewalPipelineList } from "@/components/customer-success/RenewalPipelineList";
import { NPSDistributionChart } from "@/components/customer-success/NPSDistributionChart";
import { QBRTimeline } from "@/components/customer-success/QBRTimeline";
import { CreateAccountDialog } from "@/components/customer-success/CreateAccountDialog";
import { Heart, AlertTriangle, DollarSign, Users } from "lucide-react";

export default function CustomerSuccess() {
  const { data: accounts = [], isLoading } = useCSAccounts();
  const [tab, setTab] = useState("portfolio");

  const stats = useMemo(() => {
    const total = accounts.length;
    const atRisk = accounts.filter(a => a.health_score < 40 || a.lifecycle_stage === "at_risk").length;
    const totalArr = accounts.reduce((s, a) => s + Number(a.arr || 0), 0);
    const avgHealth = total > 0 ? Math.round(accounts.reduce((s, a) => s + a.health_score, 0) / total) : 0;
    return { total, atRisk, totalArr, avgHealth };
  }, [accounts]);

  return (
    <>
      <Helmet>
        <title>Customer Success | CRM</title>
        <meta name="description" content="Gestão de Customer Success, health score, NPS, QBRs e renovações." />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Heart className="h-6 w-6 text-primary" />Customer Success</h1>
            <p className="text-sm text-muted-foreground">Health score, NPS, QBRs e renovações em um só hub</p>
          </div>
          <CreateAccountDialog />
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="p-4 flex items-center gap-3"><Users className="h-5 w-5 text-primary" /><div><p className="text-xs text-muted-foreground">Contas ativas</p><p className="text-2xl font-bold tabular-nums">{stats.total}</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><Heart className="h-5 w-5 text-success" /><div><p className="text-xs text-muted-foreground">Health médio</p><p className="text-2xl font-bold tabular-nums">{stats.avgHealth}</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-destructive" /><div><p className="text-xs text-muted-foreground">Em risco</p><p className="text-2xl font-bold tabular-nums">{stats.atRisk}</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><DollarSign className="h-5 w-5 text-warning" /><div><p className="text-xs text-muted-foreground">ARR total</p><p className="text-2xl font-bold tabular-nums">R$ {(stats.totalArr / 1000).toFixed(0)}k</p></div></CardContent></Card>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="renewals">Renovações</TabsTrigger>
            <TabsTrigger value="nps">NPS</TabsTrigger>
            <TabsTrigger value="qbrs">QBRs</TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="mt-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
              </div>
            ) : accounts.length === 0 ? (
              <Card><CardContent className="p-12 text-center text-muted-foreground">
                <Heart className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>Nenhuma conta cadastrada ainda. Adicione clientes para começar a acompanhar o health score.</p>
              </CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {accounts.map(a => <AccountPortfolioCard key={a.id} account={a} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="renewals" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <RenewalPipelineList daysAhead={30} />
              <RenewalPipelineList daysAhead={60} />
              <RenewalPipelineList daysAhead={90} />
            </div>
          </TabsContent>

          <TabsContent value="nps" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NPSDistributionChart />
              <Card><CardContent className="p-6">
                <h3 className="font-semibold mb-3">Como funciona</h3>
                <p className="text-sm text-muted-foreground mb-2">NPS = % Promotores − % Detratores</p>
                <div className="space-y-1 text-xs">
                  <p><Badge variant="outline" className="bg-success/10 text-success border-success/30 mr-2">9-10</Badge>Promotor — engajado e refere</p>
                  <p><Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 mr-2">7-8</Badge>Neutro — satisfeito mas passivo</p>
                  <p><Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 mr-2">0-6</Badge>Detrator — risco de churn</p>
                </div>
              </CardContent></Card>
            </div>
          </TabsContent>

          <TabsContent value="qbrs" className="mt-4">
            <QBRTimeline />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
