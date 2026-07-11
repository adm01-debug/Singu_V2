import { useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCSAccount, useRecalcAccountHealth } from "@/hooks/useCustomerSuccess";
import { HealthScoreGauge } from "@/components/customer-success/HealthScoreGauge";
import { HealthSignalTimeline } from "@/components/customer-success/HealthSignalTimeline";
import { NPSDistributionChart } from "@/components/customer-success/NPSDistributionChart";
import { NPSResponseDialog } from "@/components/customer-success/NPSResponseDialog";
import { QBRTimeline } from "@/components/customer-success/QBRTimeline";
import { RefreshCw, Star, CalendarClock, DollarSign } from "lucide-react";
import { SmartBackButton } from "@/components/navigation/SmartBackButton";

export default function CustomerSuccessAccount() {
  const { id } = useParams();
  const { data: account, isLoading } = useCSAccount(id);
  const recalc = useRecalcAccountHealth();
  const [npsOpen, setNpsOpen] = useState(false);
  const [tab, setTab] = useState("health");

  if (isLoading) return <div className="container p-6"><Skeleton className="h-64" /></div>;
  if (!account) return <div className="container p-6">Conta não encontrada</div>;

  const daysToRenewal = account.renewal_date ? Math.ceil((new Date(account.renewal_date).getTime() - Date.now()) / 86400000) : null;

  return (
    <>
      <Helmet><title>{account.account_name} | Customer Success</title></Helmet>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <SmartBackButton fallback="/customer-success" label="Voltar para Customer Success" />
        </div>

        <Card>
          <CardContent className="p-6 flex items-center gap-6 flex-wrap">
            <HealthScoreGauge score={account.health_score} size="lg" />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold">{account.account_name}</h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="outline" className="capitalize">{account.tier}</Badge>
                <Badge variant="outline" className="capitalize">{account.lifecycle_stage.replace("_", " ")}</Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" />R$ {(account.arr / 1000).toFixed(0)}k ARR</span>
                {daysToRenewal !== null && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1"><CalendarClock className="h-3 w-3" />Renova em {daysToRenewal}d</span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => recalc.mutate(account.id)} disabled={recalc.isPending} className="gap-2">
                <RefreshCw className={`h-4 w-4 ${recalc.isPending ? "animate-spin" : ""}`} />Recalcular
              </Button>
              <Button size="sm" onClick={() => setNpsOpen(true)} className="gap-2"><Star className="h-4 w-4" />Registrar NPS</Button>
            </div>
          </CardContent>
        </Card>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="health">Health</TabsTrigger>
            <TabsTrigger value="qbrs">QBRs</TabsTrigger>
            <TabsTrigger value="nps">NPS</TabsTrigger>
          </TabsList>
          <TabsContent value="health" className="mt-4"><HealthSignalTimeline accountId={account.id} /></TabsContent>
          <TabsContent value="qbrs" className="mt-4"><QBRTimeline accountId={account.id} /></TabsContent>
          <TabsContent value="nps" className="mt-4"><NPSDistributionChart accountId={account.id} /></TabsContent>
        </Tabs>

        <NPSResponseDialog accountId={account.id} open={npsOpen} onOpenChange={setNpsOpen} />
      </div>
    </>
  );
}
