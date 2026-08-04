import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, Building2 } from "lucide-react";
import { useABMAccount, useABMAccounts, useRescoreAccounts } from "@/hooks/useABM";
import { AccountTierBadge } from "@/components/abm/AccountTierBadge";
import { AccountScoreCard } from "@/components/abm/AccountScoreCard";
import { AccountHierarchyTree } from "@/components/abm/AccountHierarchyTree";
import { BuyingCommitteeBoard } from "@/components/abm/BuyingCommitteeBoard";
import { WhitespaceOpportunities } from "@/components/abm/WhitespaceOpportunities";
import { AccountPlanEditor } from "@/components/abm/AccountPlanEditor";

export default function ABMAccountDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: account, isLoading } = useABMAccount(id);
  const { data: allAccounts = [] } = useABMAccounts();
  const rescore = useRescoreAccounts(id);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-6 space-y-4">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!account) {
    return (
      <AppLayout>
        <div className="p-6 text-center">
          <p className="text-sm text-muted-foreground">Conta não encontrada</p>
          <Button asChild variant="outline" className="mt-3"><Link to="/abm">Voltar</Link></Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon" aria-label="Voltar"><Link to="/abm"><ArrowLeft className="h-4 w-4" /></Link></Button>
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-bold">{account.company_name}</h1>
                <AccountTierBadge tier={account.tier} />
                <Badge variant="outline" className="capitalize text-[10px]">{account.status.replace("_", " ")}</Badge>
              </div>
              {account.notes && <p className="text-xs text-muted-foreground mt-1 max-w-2xl">{account.notes}</p>}
            </div>
          </div>
          <Button variant="outline" onClick={() => rescore.mutate()} disabled={rescore.isPending}>
            <RefreshCw className={`h-4 w-4 mr-1 ${rescore.isPending ? "animate-spin" : ""}`} />
            Reavaliar score
          </Button>
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="committee">Buying Committee</TabsTrigger>
            <TabsTrigger value="plan">Plano de Conta</TabsTrigger>
            <TabsTrigger value="whitespace">Whitespace</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="grid gap-4 lg:grid-cols-3">
              <AccountScoreCard account={account} />
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Hierarquia da conta</CardTitle></CardHeader>
                <CardContent>
                  <AccountHierarchyTree accounts={allAccounts} currentId={account.id} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="committee" className="mt-4">
            <BuyingCommitteeBoard accountId={account.id} />
          </TabsContent>

          <TabsContent value="plan" className="mt-4">
            <AccountPlanEditor accountId={account.id} />
          </TabsContent>

          <TabsContent value="whitespace" className="mt-4">
            <WhitespaceOpportunities accountId={account.id} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
