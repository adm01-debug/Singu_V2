import { useState } from "react";
import { useStakeholders, useUpsertStakeholder, useDeleteStakeholder, type DealRoomStakeholder, type Side } from "@/hooks/useDealRooms";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const INFLUENCE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  champion: { label: "Champion", variant: "default" },
  decision_maker: { label: "Decisor", variant: "default" },
  influencer: { label: "Influenciador", variant: "secondary" },
  blocker: { label: "Blocker", variant: "destructive" },
  user: { label: "Usuário", variant: "outline" },
};

export function StakeholderList({ roomId }: { roomId: string }) {
  const { data = [] } = useStakeholders(roomId);
  const upsert = useUpsertStakeholder(roomId);
  const del = useDeleteStakeholder(roomId);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DealRoomStakeholder | null>(null);
  const grouped = { 
    seller: data.filter((s) => s.side === "seller"), 
    buyer: data.filter((s) => s.side === "buyer") 
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => setEditing(null)}><Plus className="h-4 w-4" />Novo stakeholder</Button>
          </DialogTrigger>
          <StakeholderDialog editing={editing} onSave={async (s) => { await upsert.mutateAsync(s); setOpen(false); setEditing(null); }} />
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(["buyer", "seller"] as const).map((side) => (
          <div key={side} className="space-y-2">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {side === "buyer" ? "Comprador" : "Vendedor"} ({grouped[side].length})
            </h4>
            <div className="space-y-2">
              {grouped[side].map((s) => (
                <Card key={s.id} className="border shadow-none">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{s.name}</p>
                        {s.role_title && <p className="text-xs text-muted-foreground">{s.role_title}</p>}
                        {s.email && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Mail className="h-3 w-3" />{s.email}</p>}
                        <div className="flex gap-1 mt-2">
                          <Badge variant={s.influence ? (INFLUENCE[s.influence]?.variant || "default") : "default"} className="text-xs">
                            {s.influence ? (INFLUENCE[s.influence]?.label || s.influence) : "Membro"}
                          </Badge>
                          <Badge variant="outline" className="text-xs">Eng. {s.engagement_score}</Badge>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => { setEditing(s); setOpen(true); }}>✎</Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => del.mutate(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!grouped[side].length && <p className="text-xs text-muted-foreground italic">Nenhum stakeholder</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StakeholderDialog({ editing, onSave }: { editing: DealRoomStakeholder | null; onSave: (s: Partial<DealRoomStakeholder>) => void }) {
  const [form, setForm] = useState<Partial<DealRoomStakeholder>>(editing ?? { name: "", email: "", role_title: "", side: "buyer", influence: "user", engagement_score: 50 });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{editing ? "Editar" : "Novo"} stakeholder</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><Label>Cargo</Label><Input value={form.role_title ?? ""} onChange={(e) => setForm({ ...form, role_title: e.target.value })} /></div>
        <div><Label>Email</Label><Input type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Lado</Label>
            <Select value={form.side} onValueChange={(v) => setForm({ ...form, side: v as Side })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="buyer">Comprador</SelectItem>
                <SelectItem value="seller">Vendedor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Influência</Label>
            <Select value={form.influence} onValueChange={(v) => setForm({ ...form, influence: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="champion">Champion</SelectItem>
                <SelectItem value="decision_maker">Decisor</SelectItem>
                <SelectItem value="influencer">Influenciador</SelectItem>
                <SelectItem value="blocker">Blocker</SelectItem>
                <SelectItem value="user">Usuário</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>Engajamento (0-100)</Label>
          <Input type="number" min={0} max={100} value={form.engagement_score} onChange={(e) => setForm({ ...form, engagement_score: Number(e.target.value) })} />
        </div>
      </div>
      <DialogFooter><Button onClick={() => onSave(form)} disabled={!form.name}>Salvar</Button></DialogFooter>
    </DialogContent>
  );
}
