import { useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Plus, Megaphone, Trash2, Pencil, Calendar, DollarSign, Target } from "lucide-react";
import { useABMCampaigns, useDeleteCampaign, type ABMCampaign } from "@/hooks/useABM";
import { ABMCampaignDialog } from "@/components/abm/ABMCampaignDialog";

const typeLabels: Record<string, string> = {
  one_to_one: "1:1",
  one_to_few: "1:Few",
  one_to_many: "1:Many",
};
const statusTones: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-success/15 text-success border-success/30",
  paused: "bg-warning/15 text-warning border-warning/30",
  completed: "bg-primary/15 text-primary border-primary/30",
  archived: "bg-muted text-muted-foreground",
};

export default function ABMCampaigns() {
  const { data: campaigns = [], isLoading } = useABMCampaigns();
  const del = useDeleteCampaign();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ABMCampaign | undefined>();

  const openNew = () => { setEditing(undefined); setDialogOpen(true); };
  const openEdit = (c: ABMCampaign) => { setEditing(c); setDialogOpen(true); };

  return (
    <AppLayout>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon" aria-label="Voltar"><Link to="/abm"><ArrowLeft className="h-4 w-4" /></Link></Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Megaphone className="h-6 w-6 text-primary" />
                Campanhas ABM
              </h1>
              <p className="text-sm text-muted-foreground">Campanhas direcionadas a contas estratégicas</p>
            </div>
          </div>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" />Nova campanha</Button>
        </div>

        {isLoading ? (
          <div className="grid gap-3 md:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40" />)}</div>
        ) : campaigns.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Megaphone className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma campanha criada ainda</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={openNew}>Criar primeira campanha</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((c) => (
              <Card key={c.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0">
                      <CardTitle className="text-sm truncate">{c.name}</CardTitle>
                      <div className="flex gap-1.5 mt-1">
                        <Badge variant="outline" className="text-[10px]">{typeLabels[c.campaign_type] ?? c.campaign_type}</Badge>
                        <Badge variant="outline" className={`text-[10px] capitalize ${statusTones[c.status] ?? ""}`}>
                          {c.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
  <Button size="icon" aria-label="Editar" variant="ghost" className="h-7 w-7" onClick={() => openEdit(c)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>   <Button size="icon" aria-label="Remover" variant="ghost" className="h-7 w-7" onClick={() => del.mutate(c.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {c.description && <p className="text-muted-foreground line-clamp-2">{c.description}</p>}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Target className="h-3 w-3" />
                    <span>{c.target_account_ids.length} conta(s)</span>
                  </div>
                  {c.channels.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {c.channels.slice(0, 4).map((ch) => (
                        <Badge key={ch} variant="secondary" className="text-[9px] capitalize">{ch}</Badge>
                      ))}
                    </div>
                  )}
                  {(c.start_date || c.end_date) && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{c.start_date ?? "?"} → {c.end_date ?? "?"}</span>
                    </div>
                  )}
                  {c.budget && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <DollarSign className="h-3 w-3" />
                      <span>R$ {c.budget.toLocaleString("pt-BR")}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <ABMCampaignDialog open={dialogOpen} onOpenChange={setDialogOpen} initial={editing} />
      </div>
    </AppLayout>
  );
}
