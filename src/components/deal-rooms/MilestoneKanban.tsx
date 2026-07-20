import { useState } from "react";
import { useMilestones, useUpsertMilestone, useDeleteMilestone, type MilestoneStatus, type Side, type DealRoomMilestone } from "@/hooks/useDealRooms";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLUMNS: { status: MilestoneStatus; label: string }[] = [
  { status: "pending", label: "A fazer" },
  { status: "in_progress", label: "Em andamento" },
  { status: "done", label: "Concluído" },
  { status: "blocked", label: "Bloqueado" },
];

const SIDE_LABEL: Record<Side, string> = { seller: "Vendedor", buyer: "Comprador", both: "Ambos" };

export function MilestoneKanban({ roomId }: { roomId: string }) {
  const { data: ms = [] } = useMilestones(roomId);
  const upsert = useUpsertMilestone(roomId);
  const del = useDeleteMilestone(roomId);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DealRoomMilestone | null>(null);
  const onSave = async (m: Partial<DealRoomMilestone>) => {
    try {
      await upsert.mutateAsync(m);
      setOpen(false);
      setEditing(null);
    } catch {
      // mutation onError handles the toast; dialog stays open so user can retry
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => setEditing(null)}><Plus className="h-4 w-4" />Novo milestone</Button>
          </DialogTrigger>
          <MilestoneDialog editing={editing} onSave={onSave} />
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {COLUMNS.map((c) => (
          <div key={c.status} className="space-y-2">
            <div className="flex items-center justify-between px-2">
              <h4 className="text-sm font-semibold">{c.label}</h4>
              <span className="text-xs text-muted-foreground">{ms.filter((x) => x.status === c.status).length}</span>
            </div>
            <div className="space-y-2 min-h-[80px]">
              {ms.filter((x) => x.status === c.status).map((m) => (
                <Card key={m.id} className="cursor-pointer border shadow-none" onClick={() => { setEditing(m); setOpen(true); }}>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium line-clamp-2">{m.title}</p>
                      <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); del.mutate(m.id); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">{SIDE_LABEL[m.owner_side as Side]}</Badge>
                      {m.due_date && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Calendar className="h-3 w-3" />{new Date(m.due_date).toLocaleDateString("pt-BR")}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MilestoneDialog({ editing, onSave }: { editing: DealRoomMilestone | null; onSave: (m: Partial<DealRoomMilestone>) => void }) {
  const [form, setForm] = useState<Partial<DealRoomMilestone>>(editing ?? { title: "", description: "", status: "pending", owner_side: "both", due_date: "", sort_order: 0 });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{editing ? "Editar milestone" : "Novo milestone"}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>Título</Label>
          <Input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <Label>Descrição</Label>
          <Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">A fazer</SelectItem>
                <SelectItem value="in_progress">Em andamento</SelectItem>
                <SelectItem value="done">Concluído</SelectItem>
                <SelectItem value="blocked">Bloqueado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Responsável</Label>
            <Select value={form.owner_side as string} onValueChange={(v) => setForm({ ...form, owner_side: v as Side })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="seller">Vendedor</SelectItem>
                <SelectItem value="buyer">Comprador</SelectItem>
                <SelectItem value="both">Ambos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>Data limite</Label>
          <Input type="date" value={form.due_date ?? ""} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={() => onSave({ ...form, due_date: form.due_date || null })} disabled={!form.title}>Salvar</Button>
      </DialogFooter>
    </DialogContent>
  );
}
