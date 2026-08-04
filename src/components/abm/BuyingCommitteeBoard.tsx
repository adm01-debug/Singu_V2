import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Plus, Trash2, Pencil, Crown, Heart, Shield, User, Cog, DollarSign, Users } from "lucide-react";
import {
  useBuyingCommittee,
  useUpsertCommitteeMember,
  useDeleteCommitteeMember,
  type BuyingCommitteeMember,
  type CommitteeRole,
} from "@/hooks/useABM";

const roleConfig: Record<CommitteeRole, { label: string; icon: typeof Crown; tone: string }> = {
  decision_maker: { label: "Decisor", icon: Crown, tone: "bg-primary/15 text-primary border-primary/30" },
  champion: { label: "Champion", icon: Heart, tone: "bg-success/15 text-success border-success/30" },
  influencer: { label: "Influenciador", icon: Users, tone: "bg-accent/15 text-accent-foreground border-accent/30" },
  blocker: { label: "Bloqueador", icon: Shield, tone: "bg-destructive/15 text-destructive border-destructive/30" },
  user: { label: "Usuário", icon: User, tone: "bg-muted text-muted-foreground border-border" },
  technical: { label: "Técnico", icon: Cog, tone: "bg-secondary text-secondary-foreground border-border" },
  economic: { label: "Econômico", icon: DollarSign, tone: "bg-warning/15 text-warning border-warning/30" },
};

const roleOrder: CommitteeRole[] = ["decision_maker", "champion", "influencer", "economic", "technical", "user", "blocker"];

export function BuyingCommitteeBoard({ accountId }: { accountId: string }) {
  const { data: members = [], isLoading } = useBuyingCommittee(accountId);
  const upsert = useUpsertCommitteeMember();
  const del = useDeleteCommitteeMember();
  const [editing, setEditing] = useState<Partial<BuyingCommitteeMember> | null>(null);

  const grouped = roleOrder.reduce<Record<CommitteeRole, BuyingCommitteeMember[]>>((acc, role) => {
    acc[role] = members.filter((m) => m.committee_role === role);
    return acc;
  }, {} as Record<CommitteeRole, BuyingCommitteeMember[]>);

  const onSave = () => {
    if (!editing?.contact_name || !editing.committee_role) return;
    upsert.mutate(
      {
        ...editing,
        account_id: accountId,
        contact_name: editing.contact_name,
        committee_role: editing.committee_role as CommitteeRole,
      },
      { onSuccess: () => setEditing(null) }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{members.length} stakeholder(s) mapeado(s)</p>
        <Button size="sm" onClick={() => setEditing({ committee_role: "influencer", influence_level: 5, engagement_score: 0 })}>
          <Plus className="h-4 w-4 mr-1" /> Adicionar
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {roleOrder.map((role) => {
            const cfg = roleConfig[role];
            const Icon = cfg.icon;
            return (
              <Card key={role} className="min-h-[140px]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5" />
                    {cfg.label}
                    <Badge variant="outline" className="ml-auto text-[10px]">{grouped[role].length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {grouped[role].length === 0 ? (
                    <p className="text-[11px] text-muted-foreground italic">Nenhum</p>
                  ) : (
                    grouped[role].map((m) => (
                      <div key={m.id} className={`text-xs p-2 rounded border ${cfg.tone}`}>
                        <div className="flex justify-between items-start">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{m.contact_name}</p>
                            {m.contact_role && <p className="text-[10px] opacity-80 truncate">{m.contact_role}</p>}
                            <p className="text-[10px] mt-1">Influência: {m.influence_level}/10</p>
                          </div>
                          <div className="flex gap-1">
                            <Button size="icon" aria-label="Editar" variant="ghost" className="h-5 w-5" onClick={() => setEditing(m)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
        <Button
                              size="icon" aria-label="Remover"
                              variant="ghost"
                              className="h-5 w-5"
                              onClick={() => del.mutate({ id: m.id, account_id: accountId })}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar" : "Adicionar"} stakeholder</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome *</Label>
              <Input
                value={editing?.contact_name ?? ""}
                onChange={(e) => setEditing({ ...editing, contact_name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input
                  value={editing?.contact_email ?? ""}
                  onChange={(e) => setEditing({ ...editing, contact_email: e.target.value })}
                />
              </div>
              <div>
                <Label>Cargo</Label>
                <Input
                  value={editing?.contact_role ?? ""}
                  onChange={(e) => setEditing({ ...editing, contact_role: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Papel no comitê</Label>
              <Select
                value={editing?.committee_role ?? "influencer"}
                onValueChange={(v) => setEditing({ ...editing, committee_role: v as CommitteeRole })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roleOrder.map((r) => (
                    <SelectItem key={r} value={r}>{roleConfig[r].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nível de influência: {editing?.influence_level ?? 5}/10</Label>
              <Slider
                min={1} max={10} step={1}
                value={[editing?.influence_level ?? 5]}
                onValueChange={([v]) => setEditing({ ...editing, influence_level: v })}
              />
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea
                value={editing?.notes ?? ""}
                onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={onSave} disabled={upsert.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
