import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BookOpen, Search, Plus, Swords, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { usePlaybooks, SCENARIO_LABELS, usePlaybookUsageLog, type PlaybookScenario } from "@/hooks/usePlaybooks";
import { useBattleCards } from "@/hooks/useBattleCards";
import { PlaybookCard } from "@/components/playbooks/PlaybookCard";
import { BattleCardListItem } from "@/components/playbooks/BattleCardListItem";
import { GeneratePlaybookDialog } from "@/components/playbooks/GeneratePlaybookDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Playbooks() {
  const [tab, setTab] = useState("playbooks");
  const [search, setSearch] = useState("");
  const [scenario, setScenario] = useState<string>("all");
  const playbooks = usePlaybooks({
    search: search || undefined,
    scenario: scenario === "all" ? undefined : (scenario as PlaybookScenario),
  });
  const battleCards = useBattleCards(search || undefined);
  const usage = usePlaybookUsageLog({ days: 30 });

  return (
    <>
      <Helmet>
        <title>Playbooks & Battle Cards | SINGU</title>
        <meta name="description" content="Biblioteca de playbooks de venda e battle cards consultáveis em segundos." />
      </Helmet>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="size-6 text-primary" /> Playbooks & Battle Cards
            </h1>
            <p className="text-muted-foreground text-sm">Roteiros estruturados por estágio + fichas de concorrentes para usar durante a call.</p>
          </div>
          <div className="flex gap-2">
            <GeneratePlaybookDialog />
            <Button asChild variant="outline"><Link to="/playbooks/new"><Plus className="size-4" /> Novo manual</Link></Button>
          </div>
        </header>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="playbooks"><BookOpen className="size-4 mr-2" /> Playbooks ({playbooks.data?.length || 0})</TabsTrigger>
            <TabsTrigger value="battle-cards"><Swords className="size-4 mr-2" /> Battle Cards ({battleCards.data?.length || 0})</TabsTrigger>
            <TabsTrigger value="usage"><Activity className="size-4 mr-2" /> Uso</TabsTrigger>
          </TabsList>

          <TabsContent value="playbooks" className="space-y-4 mt-4">
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar playbook…" className="pl-9" />
              </div>
              <Select value={scenario} onValueChange={setScenario}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os cenários</SelectItem>
                  {Object.entries(SCENARIO_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {playbooks.isLoading ? (
              <p className="text-muted-foreground text-sm">Carregando…</p>
            ) : (playbooks.data?.length || 0) === 0 ? (
              <Card><CardContent className="py-12 text-center">
                <BookOpen className="size-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground mb-3">Nenhum playbook ainda. Gere o primeiro com IA.</p>
                <GeneratePlaybookDialog />
              </CardContent></Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {playbooks.data!.map((pb) => <PlaybookCard key={pb.id} playbook={pb} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="battle-cards" className="space-y-4 mt-4">
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar concorrente…" className="pl-9" />
              </div>
              <Button asChild variant="outline"><Link to="/playbooks/battle-cards/new"><Plus className="size-4" /> Novo battle card</Link></Button>
            </div>

            {battleCards.isLoading ? (
              <p className="text-muted-foreground text-sm">Carregando…</p>
            ) : (battleCards.data?.length || 0) === 0 ? (
              <Card><CardContent className="py-12 text-center">
                <Swords className="size-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum battle card cadastrado.</p>
              </CardContent></Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {battleCards.data!.map((c) => <BattleCardListItem key={c.id} card={c} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="usage" className="space-y-4 mt-4">
            <Card>
              <CardContent className="p-0">
                {usage.isLoading ? (
                  <p className="p-6 text-sm text-muted-foreground">Carregando…</p>
                ) : (usage.data?.length || 0) === 0 ? (
                  <p className="p-12 text-center text-sm text-muted-foreground">Nenhum uso registrado nos últimos 30 dias.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {usage.data!.map((u) => (
                      <li key={u.id} className="flex items-center justify-between gap-3 p-4">
                        <div className="space-y-0.5 min-w-0">
                          <p className="text-sm font-medium">
                            {u.action === "opened" ? "Abriu" : u.action === "copied" ? "Copiou" : u.action === "shared" ? "Compartilhou" : u.action === "used_in_deal" ? "Usou no deal" : "Recomendado"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {u.playbook_id ? "Playbook" : u.battle_card_id ? "Battle card" : "—"}
                            {u.deal_id && ` · deal ${u.deal_id.slice(0, 8)}`}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {format(new Date(u.opened_at), "dd MMM HH:mm", { locale: ptBR })}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
