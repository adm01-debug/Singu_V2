import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Building2, Plus, RefreshCw, Search, Target, TrendingUp, Sparkles, Users, Megaphone,
} from "lucide-react";
import { useABMAccounts, useRescoreAccounts } from "@/hooks/useABM";
import { AccountTierBadge } from "@/components/abm/AccountTierBadge";
import { CreateAccountDialog } from "@/components/abm/CreateAccountDialog";

export default function ABM() {
  const { data: accounts = [], isLoading } = useABMAccounts();
  const rescore = useRescoreAccounts();
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    return accounts.filter((a) => {
      if (tierFilter !== "all" && a.tier !== tierFilter) return false;
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (search && !a.company_name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [accounts, search, tierFilter, statusFilter]);

  const stats = useMemo(() => {
    const strategic = accounts.filter((a) => a.tier === "strategic").length;
    const avgScore = accounts.length ? Math.round(accounts.reduce((s, a) => s + a.account_score, 0) / accounts.length) : 0;
    const targetRevenue = accounts.reduce((s, a) => s + (a.target_revenue ?? 0), 0);
    return { total: accounts.length, strategic, avgScore, targetRevenue };
  }, [accounts]);

  return (
    <AppLayout>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              Account-Based Selling
            </h1>
            <p className="text-sm text-muted-foreground">Gestão estratégica de contas-alvo com scoring, comitê de compra e whitespace</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => rescore.mutate()} disabled={rescore.isPending}>
              <RefreshCw className={`h-4 w-4 mr-1 ${rescore.isPending ? "animate-spin" : ""}`} />
              Recalcular Scores
            </Button>
            <Button asChild variant="outline">
              <Link to="/abm/campanhas"><Megaphone className="h-4 w-4 mr-1" />Campanhas</Link>
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />Nova Conta
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Contas ABM" value={stats.total} icon={Building2} />
          <Kpi label="Estratégicas" value={stats.strategic} icon={Sparkles} accent />
          <Kpi label="Score médio" value={stats.avgScore} icon={TrendingUp} />
          <Kpi label="Receita-alvo" value={`R$ ${stats.targetRevenue.toLocaleString("pt-BR")}`} icon={Target} />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Carteira ABM
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Buscar por nome..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tiers</SelectItem>
                  <SelectItem value="strategic">Estratégica</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                  <SelectItem value="mid">Mid-Market</SelectItem>
                  <SelectItem value="smb">SMB</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos status</SelectItem>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="nurture">Nutrição</SelectItem>
                  <SelectItem value="closed_won">Ganha</SelectItem>
                  <SelectItem value="closed_lost">Perdida</SelectItem>
                  <SelectItem value="paused">Pausada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma conta encontrada</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setCreateOpen(true)}>
                  Criar primeira conta
                </Button>
              </div>
            ) : (
              <div className="border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Receita-alvo</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((a) => (
                      <TableRow key={a.id} className="cursor-pointer hover:bg-muted/40">
                        <TableCell className="font-medium">{a.company_name}</TableCell>
                        <TableCell><AccountTierBadge tier={a.tier} /></TableCell>
                        <TableCell className="text-right font-semibold">{a.account_score}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] capitalize">{a.status.replace("_", " ")}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {a.target_revenue ? `R$ ${a.target_revenue.toLocaleString("pt-BR")}` : "—"}
                        </TableCell>
                        <TableCell>
                          <Button asChild variant="ghost" size="sm">
                            <Link to={`/abm/${a.id}`}>Abrir</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <CreateAccountDialog open={createOpen} onOpenChange={setCreateOpen} />
      </div>
    </AppLayout>
  );
}

function Kpi({ label, value, icon: Icon, accent }: { label: string; value: string | number; icon: typeof Building2; accent?: boolean }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">{label}</span>
          <Icon className={`h-4 w-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
        </div>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
